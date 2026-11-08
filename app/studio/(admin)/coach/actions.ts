"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentRole, hashPassword } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function back(key: "error" | "notice", value: string): never {
  redirect(`/studio/coach?${key}=${encodeURIComponent(value)}`);
}

function isRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function requireAdmin() {
  if ((await getCurrentRole()) !== "admin") redirect("/");
}

function usernameField(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!USERNAME.test(username)) {
    back("error", "Username must be 3–32 characters and use letters, numbers, dots, underscores, or hyphens.");
  }
  return username;
}

function nameField(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (fullName.length < 1 || fullName.length > 120) back("error", "Enter a coach name up to 120 characters.");
  return fullName;
}

function passwordPair(formData: FormData, required: boolean) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (!password && !required) return null;
  if (password.length < 8 || password.length > 128) back("error", "Password must be between 8 and 128 characters.");
  if (password !== confirm) back("error", "Password and confirmation do not match.");
  return password;
}

async function usernameTaken(username: string, exceptCoachId?: string) {
  const supabase = createAdminClient();
  const [admin, coach] = await Promise.all([
    supabase.from("admin_accounts").select("id").eq("username", username).maybeSingle(),
    supabase.from("coaches").select("id").eq("username", username).maybeSingle(),
  ]);
  if (admin.error) throw new Error(admin.error.message);
  if (coach.error) throw new Error(coach.error.message);
  if (admin.data) return true;
  return Boolean(coach.data && coach.data.id !== exceptCoachId);
}

export async function createCoach(formData: FormData) {
  await requireAdmin();
  const fullName = nameField(formData);
  const username = usernameField(formData);
  const password = passwordPair(formData, true);
  if (!password) return;

  try {
    if (await usernameTaken(username)) back("error", "That username is already in use.");
    const { error } = await createAdminClient().from("coaches").insert({
      full_name: fullName,
      username,
      password_hash: hashPassword(password),
      active: formData.get("active") === "on",
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    if (isRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "The coach could not be created.";
    back("error", message.slice(0, 240));
  }

  revalidatePath("/studio/coach");
  revalidatePath("/studio/courses/schedule");
  revalidatePath("/studio/courses/calendar");
  back("notice", "Coach added. They can sign in with this username and password.");
}

export async function updateCoach(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) back("error", "Coach is not valid.");
  const fullName = nameField(formData);
  const username = usernameField(formData);
  const password = passwordPair(formData, false);
  const active = formData.get("active") === "on";

  try {
    if (await usernameTaken(username, id)) back("error", "That username is already in use.");
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("coaches")
      .update({
        full_name: fullName,
        username,
        active,
        ...(password ? { password_hash: hashPassword(password) } : {}),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    const renamed = await supabase.from("sessions").update({ instructor: fullName }).eq("coach_id", id);
    if (renamed.error) throw new Error(renamed.error.message);
    if (!active) {
      await supabase.from("app_sessions").delete().eq("subject_id", id).eq("role", "coach");
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "The coach could not be updated.";
    back("error", message.slice(0, 240));
  }

  revalidatePath("/studio/coach");
  revalidatePath("/studio/courses/schedule");
  revalidatePath("/studio/courses/calendar");
  revalidatePath("/studio/check-in");
  back("notice", password ? "Coach updated, including the new password." : "Coach updated.");
}

export async function deleteCoach(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const confirm = String(formData.get("confirm_username") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(id)) back("error", "Coach is not valid.");

  try {
    const supabase = createAdminClient();
    const coach = await supabase.from("coaches").select("username").eq("id", id).maybeSingle();
    if (coach.error) throw new Error(coach.error.message);
    if (!coach.data) back("error", "That coach no longer exists.");
    if (confirm !== coach.data.username) back("error", "Type the coach username to confirm deletion.");
    const sessions = await supabase.from("app_sessions").delete().eq("subject_id", id).eq("role", "coach");
    if (sessions.error) throw new Error(sessions.error.message);
    const { error } = await supabase.from("coaches").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } catch (error) {
    if (isRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "The coach could not be deleted.";
    back("error", message.slice(0, 240));
  }

  revalidatePath("/studio/coach");
  revalidatePath("/studio/courses/schedule");
  revalidatePath("/studio/courses/calendar");
  revalidatePath("/studio/check-in");
  back("notice", "Coach removed. Courses they were assigned to are now unassigned.");
}
