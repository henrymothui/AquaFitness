"use server";

import { redirect } from "next/navigation";
import { authenticateAdminAccount, logoutAccount, type AppAccount } from "@/lib/auth";
import { authenticateMember, registerMember } from "@/lib/user-management";
import { getI18n } from "@/lib/i18n";

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const { t } = await getI18n();
  const errors = t.publicPages.loginErrors;
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let account: AppAccount | null;
  try {
    account = await authenticateAdminAccount(username, password);
    if (!account && username.includes("@")) {
      account = await authenticateMember(username, password) as AppAccount | null;
    }
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("admin_accounts") && cause.message.includes("schema cache")) {
      return { error: errors.setup };
    }
    return { error: errors.connect };
  }
  if (!account) {
    return { error: errors.credentials };
  }
  redirect(account.role === "admin" ? "/studio" : "/");
}

export type RegistrationState = { error?: string; success?: string } | undefined;

export async function registerMemberAction(
  _state: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const { t } = await getI18n();
  const fullName = String(formData.get("full_name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "");

  try {
    await registerMember({ fullName, email, password, phone });
    return { success: t.publicPages.registrationMessages.sent };
  } catch {
    // Do not disclose whether an email already has an account or expose database details.
    return { error: t.publicPages.registrationMessages.failed };
  }
}

export async function logout() {
  await logoutAccount();
  redirect("/");
}
