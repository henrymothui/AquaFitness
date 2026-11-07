import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole = "admin" | "public";
export type AppAccount = {
  id: string;
  username: string;
  role: AppRole;
  customer_id: string | null;
};

const SESSION_COOKIE = "hydrofit-app-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function hashSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) return password === "1234";
  const [algorithm, salt, expectedHex] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function startSession(subjectId: string, role: AppRole) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();
  const { error } = await createAdminClient().from("app_sessions").insert({
    token_hash: hashSession(token),
    subject_id: subjectId,
    role,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function authenticateAdminAccount(username: string, password: string): Promise<AppAccount | null> {
  const { data: account, error } = await createAdminClient()
    .from("admin_accounts")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account || !verifyPassword(password, account.password_hash)) return null;

  await startSession(account.id, "admin");
  return { id: account.id, username: account.username, role: "admin", customer_id: null };
}

export async function startMemberSession(customer: { id: string; email: string | null }, authUserId: string) {
  await startSession(authUserId, "public");
  return {
    id: customer.id,
    username: customer.email ?? "",
    role: "public" as const,
    customer_id: customer.id,
  };
}

export async function getCurrentAccount(): Promise<AppAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: session, error } = await supabase
    .from("app_sessions")
    .select("subject_id, role")
    .eq("token_hash", hashSession(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!session) return null;

  if (session.role === "admin") {
    const { data: account, error: accountError } = await supabase
      .from("admin_accounts")
      .select("id, username")
      .eq("id", session.subject_id)
      .maybeSingle();
    if (accountError) throw new Error(accountError.message);
    return account ? { ...account, role: "admin", customer_id: null } : null;
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, email")
    .eq("auth_user_id", session.subject_id)
    .maybeSingle();
  if (customerError) throw new Error(customerError.message);
  return customer
    ? { id: customer.id, username: customer.email ?? "", role: "public", customer_id: customer.id }
    : null;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  return (await getCurrentAccount())?.role ?? null;
}

export async function logoutAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const { error } = await createAdminClient()
      .from("app_sessions")
      .delete()
      .eq("token_hash", hashSession(token));
    if (error) throw new Error(error.message);
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("hydrofit-demo-session");
}
