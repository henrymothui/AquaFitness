"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rpc } from "@/lib/rpc";
import { getI18n } from "@/lib/i18n";

export type ProfileActionState = {
  message: string;
  status: "success" | "error" | null;
};

export async function cancelMemberBooking(formData: FormData) {
  const { t } = await getI18n();
  const messages = t.publicPages.accountMessages;
  const account = await getCurrentAccount();
  if (account?.role !== "public" || !account.customer_id) redirect("/log-in");

  const bookingId = String(formData.get("booking_id") ?? "");
  if (!/^[\da-f-]{36}$/i.test(bookingId)) {
    redirect(`/my-account?error=${encodeURIComponent(messages.cancelInvalid)}`);
  }

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("customer_id, status, sessions(starts_at, status)")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) redirect(`/my-account?error=${encodeURIComponent(messages.cancelTryAgain)}`);

  const session = Array.isArray(data?.sessions) ? data.sessions[0] : data?.sessions;
  if (
    !data ||
    data.customer_id !== account.customer_id ||
    data.status !== "booked" ||
    !session ||
    session.status !== "scheduled" ||
    new Date(session.starts_at).getTime() <= Date.now()
  ) {
    redirect(`/my-account?error=${encodeURIComponent(messages.cancelUpcoming)}`);
  }

  try {
    await rpc("cancel_booking", { p_booking_id: bookingId });
  } catch {
    redirect(`/my-account?error=${encodeURIComponent(messages.cancelFailed)}`);
  }

  revalidatePath("/my-account");
  revalidatePath("/book-now");
  redirect(`/my-account?notice=${encodeURIComponent(messages.cancelled)}`);
}

export async function updateMemberProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { t } = await getI18n();
  const messages = t.publicPages.accountMessages;
  const account = await getCurrentAccount();
  if (account?.role !== "public") {
    return { status: "error", message: messages.signIn };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!fullName || fullName.length > 120) {
    return { status: "error", message: messages.name };
  }
  if (phone.length > 40) {
    return { status: "error", message: messages.phone };
  }
  if (title && title !== "Mr" && title !== "Mrs") {
    return { status: "error", message: messages.title };
  }
  if (dateOfBirth) {
    const parsedDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      && !Number.isNaN(parsedDate.getTime())
      && parsedDate.toISOString().slice(0, 10) === dateOfBirth
      && dateOfBirth <= new Date().toISOString().slice(0, 10);
    if (!validDate) {
      return { status: "error", message: messages.birthDate };
    }
  }
  if (address.length > 300) {
    return { status: "error", message: messages.address };
  }

  if (!account.customer_id) {
    return { status: "error", message: messages.unlinked };
  }

  const { error } = await createAdminClient()
    .from("customers")
    .update({
      full_name: fullName,
      title: title || null,
      date_of_birth: dateOfBirth || null,
      address: address || null,
      phone: phone || null,
    })
    .eq("id", account.customer_id);

  if (error) {
    return { status: "error", message: messages.saveFailed };
  }

  revalidatePath("/my-account");
  revalidatePath("/studio/directory");
  revalidatePath(`/studio/directory/${account.customer_id}`);

  return { status: "success", message: messages.saved };
}
