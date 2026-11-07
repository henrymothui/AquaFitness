"use server";

import { redirect } from "next/navigation";
import { authenticateDemoAccount, clearDemoRole, type DemoAccount } from "@/lib/demo-auth";
import { getI18n } from "@/lib/i18n";

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const { t } = await getI18n();
  const errors = t.publicPages.loginErrors;
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let account: DemoAccount | null;
  try {
    account = await authenticateDemoAccount(username, password);
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("demo_accounts") && cause.message.includes("schema cache")) {
      return { error: errors.setup };
    }
    return { error: errors.connect };
  }
  if (!account) {
    return { error: errors.credentials };
  }
  redirect(account.role === "admin" ? "/studio" : "/");
}

export async function logout() {
  await clearDemoRole();
  redirect("/");
}
