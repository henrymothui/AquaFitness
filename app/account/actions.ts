"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoAccount } from "@/lib/demo-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rpc } from "@/lib/rpc";

export type ProfileActionState = {
  message: string;
  status: "success" | "error" | null;
};

export async function cancelMemberBooking(formData: FormData) {
  const account = await getDemoAccount();
  if (account?.role !== "public" || !account.customer_id) redirect("/login");

  const bookingId = String(formData.get("booking_id") ?? "");
  if (!/^[\da-f-]{36}$/i.test(bookingId)) {
    redirect(`/account?error=${encodeURIComponent("This booking could not be cancelled.")}`);
  }

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("customer_id, status, sessions(starts_at, status)")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) redirect(`/account?error=${encodeURIComponent("This booking could not be cancelled. Please try again.")}`);

  const session = Array.isArray(data?.sessions) ? data.sessions[0] : data?.sessions;
  if (
    !data ||
    data.customer_id !== account.customer_id ||
    data.status !== "booked" ||
    !session ||
    session.status !== "scheduled" ||
    new Date(session.starts_at).getTime() <= Date.now()
  ) {
    redirect(`/account?error=${encodeURIComponent("Only your upcoming booked classes can be cancelled.")}`);
  }

  try {
    await rpc("cancel_booking", { p_booking_id: bookingId });
  } catch {
    redirect(`/account?error=${encodeURIComponent("The class could not be cancelled. Please try again.")}`);
  }

  revalidatePath("/account");
  revalidatePath("/book");
  redirect(`/account?notice=${encodeURIComponent("Class cancelled. Your credit was returned.")}`);
}

export async function updateMemberProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const account = await getDemoAccount();
  if (account?.role !== "public") {
    return { status: "error", message: "Please sign in to update your profile." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!fullName || fullName.length > 120) {
    return { status: "error", message: "Enter a name up to 120 characters." };
  }
  if (phone.length > 40) {
    return { status: "error", message: "Phone number must be 40 characters or fewer." };
  }
  if (title && title !== "Mr" && title !== "Mrs") {
    return { status: "error", message: "Choose Mr or Mrs for your title." };
  }
  if (dateOfBirth) {
    const parsedDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      && !Number.isNaN(parsedDate.getTime())
      && parsedDate.toISOString().slice(0, 10) === dateOfBirth
      && dateOfBirth <= new Date().toISOString().slice(0, 10);
    if (!validDate) {
      return { status: "error", message: "Enter a valid date of birth that is not in the future." };
    }
  }
  if (address.length > 300) {
    return { status: "error", message: "Address must be 300 characters or fewer." };
  }

  if (!account.customer_id) {
    return { status: "error", message: "Your member profile is not linked to the studio yet." };
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
    return { status: "error", message: "Your profile could not be saved. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/studio/customers");
  revalidatePath(`/studio/customers/${account.customer_id}`);

  return { status: "success", message: "Your profile has been updated." };
}
