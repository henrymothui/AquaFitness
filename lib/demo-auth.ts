import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type DemoRole = "admin" | "public";
export const DEMO_PUBLIC_EMAIL = "member@hydrofit.demo";

const SESSION_COOKIE = "hydrofit-demo-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type DemoAccount = {
  id: string;
  username: "admin" | "user";
  role: DemoRole;
  customer_id: string | null;
};

function hashSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateDemoAccount(username: string, password: string) {
  if (password !== "1234" || (username !== "admin" && username !== "user")) return null;

  const supabase = createAdminClient();
  const { data: account, error } = await supabase
    .from("demo_accounts")
    .select("id, username, role, customer_id")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!account) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();
  const { error: sessionError } = await supabase.from("demo_sessions").insert({
    token_hash: hashSession(token),
    account_id: account.id,
    expires_at: expiresAt,
  });
  if (sessionError) throw new Error(sessionError.message);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
  return account as DemoAccount;
}

export async function getDemoAccount(): Promise<DemoAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: session, error } = await supabase
    .from("demo_sessions")
    .select("account_id")
    .eq("token_hash", hashSession(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!session) return null;

  const { data: account, error: accountError } = await supabase
    .from("demo_accounts")
    .select("id, username, role, customer_id")
    .eq("id", session.account_id)
    .maybeSingle();
  if (accountError) throw new Error(accountError.message);
  return account as DemoAccount | null;
}

export async function getDemoRole(): Promise<DemoRole | null> {
  return (await getDemoAccount())?.role ?? null;
}

export async function clearDemoRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const { error } = await createAdminClient()
      .from("demo_sessions")
      .delete()
      .eq("token_hash", hashSession(token));
    if (error) throw new Error(error.message);
  }
  cookieStore.delete(SESSION_COOKIE);
}
