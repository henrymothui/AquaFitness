"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount, hashPassword, verifyPassword } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function backWith(key: "error" | "notice", value: string): never {
  redirect(`/studio/settings?${key}=${encodeURIComponent(value)}`);
}

export async function updateAdminProfile(formData: FormData) {
  const account = await getCurrentAccount();
  if (account?.role !== "admin") redirect("/");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    backWith("error", "Username must be 3–32 characters and use letters, numbers, dots, underscores, or hyphens.");
  }
  if (newPassword && newPassword.length < 8) {
    backWith("error", "New password must be at least 8 characters.");
  }
  if (newPassword !== confirmPassword) {
    backWith("error", "New password and confirmation do not match.");
  }
  if ((newPassword || username !== account.username) && !currentPassword) {
    backWith("error", "Enter your current password to save account changes.");
  }

  if (currentPassword) {
    const supabase = createAdminClient();
    const { data: credentials, error: credentialsError } = await supabase
      .from("admin_accounts")
      .select("password_hash")
      .eq("id", account.id)
      .maybeSingle();
    if (credentialsError || !credentials || !verifyPassword(currentPassword, credentials.password_hash)) {
      backWith("error", "Current password is incorrect.");
    }

    const { error } = await supabase
      .from("admin_accounts")
      .update({
        username,
        ...(newPassword ? { password_hash: hashPassword(newPassword) } : {}),
      })
      .eq("id", account.id);
    if (error) {
      backWith("error", error.code === "23505" ? "That username is already in use." : "Could not update the admin profile. Please try again.");
    }
  } else if (username !== account.username) {
    backWith("error", "Enter your current password to save account changes.");
  }

  revalidatePath("/studio/settings");
  revalidatePath("/log-in");
  backWith("notice", "Admin profile updated.");
}
