"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoAccount } from "@/lib/demo-auth";
import { getCustomer } from "@/lib/queries";
import { rpc } from "@/lib/rpc";

function fail(message: string): never {
  redirect(`/book?error=${encodeURIComponent(message.slice(0, 240))}`);
}

export async function checkoutBookings(formData: FormData) {
  const account = await getDemoAccount();
  if (account?.role !== "public") redirect("/login");

  const sessionIds = [...new Set(formData.getAll("session_id").map(String))];
  if (!sessionIds.length) fail("Add a class to your booking before checkout.");
  if (sessionIds.length > 12 || sessionIds.some((id) => !/^[\da-f-]{36}$/i.test(id))) {
    fail("Your booking could not be checked. Please refresh and try again.");
  }

  const customer = account.customer_id ? await getCustomer(account.customer_id) : null;
  if (!customer) fail("Your member profile is not linked to the studio yet. Please contact the front desk.");

  try {
    await rpc("checkout_sessions", {
      p_session_ids: sessionIds,
      p_customer_id: customer.id,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.replace(/^(ERROR:\s*)+/i, "") : "Checkout could not be completed.";
    fail(message);
  }

  for (const id of sessionIds) revalidatePath(`/studio/sessions/${id}`);
  revalidatePath("/account");
  revalidatePath("/book");
  redirect(`/account?notice=${encodeURIComponent(`${sessionIds.length} class${sessionIds.length === 1 ? "" : "es"} booked. Your credits have been updated.`)}`);
}

export async function placeCreditOrder(formData: FormData) {
  const account = await getDemoAccount();
  if (account?.role !== "public" || !account.customer_id) redirect("/login");

  let items: { id: string; quantity: number }[];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("items") ?? ""));
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 12) throw new Error();
    items = parsed.map((item) => {
      if (!item || typeof item !== "object") throw new Error();
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || !/^[\da-f-]{36}$/i.test(record.id)) throw new Error();
      if (typeof record.quantity !== "number" || !Number.isInteger(record.quantity) || record.quantity < 1 || record.quantity > 10) throw new Error();
      return { id: record.id, quantity: Number(record.quantity) };
    });
  } catch {
    fail("Your order could not be checked. Please refresh and try again.");
  }

  try {
    await rpc("place_credit_orders", {
      p_customer_id: account.customer_id,
      p_package_ids: items.map((item) => item.id),
      p_quantities: items.map((item) => item.quantity),
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.replace(/^(ERROR:\s*)+/i, "") : "Your order could not be placed.";
    fail(message);
  }

  revalidatePath("/account");
  revalidatePath("/studio/orders");
  redirect(`/account?notice=${encodeURIComponent("Order submitted. Your credits will be added after payment is confirmed.")}`);
}
