"use server";

import { redirect } from "next/navigation";
import { authenticateDemoAccount, clearDemoRole, type DemoAccount } from "@/lib/demo-auth";

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let account: DemoAccount | null;
  try {
    account = await authenticateDemoAccount(username, password);
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("demo_accounts") && cause.message.includes("schema cache")) {
      return { error: "Database setup is incomplete. Apply the pending Supabase migrations, then try again." };
    }
    return { error: "We couldn’t connect to the account database. Please try again." };
  }
  if (!account) {
    return { error: "That username and password don’t match. Try one of the demo accounts below." };
  }
  redirect(account.role === "admin" ? "/studio" : "/");
}

export async function logout() {
  await clearDemoRole();
  redirect("/");
}
