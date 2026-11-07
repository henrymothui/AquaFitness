"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoAccount } from "@/lib/demo-auth";
import { getCustomer } from "@/lib/queries";
import { rpc } from "@/lib/rpc";
import { getI18n } from "@/lib/i18n";

export async function checkoutBookings(formData: FormData) {
  const { t } = await getI18n();
  const messages = t.publicPages.bookingMessages;
  const account = await getDemoAccount();
  if (account?.role !== "public") redirect("/login");

  const sessionIds = [...new Set(formData.getAll("session_id").map(String))];
  if (!sessionIds.length) redirect(`/book?error=${encodeURIComponent(messages.add)}`);
  if (sessionIds.length > 12 || sessionIds.some((id) => !/^[\da-f-]{36}$/i.test(id))) {
    redirect(`/book?error=${encodeURIComponent(messages.invalid)}`);
  }

  const customer = account.customer_id ? await getCustomer(account.customer_id) : null;
  if (!customer) redirect(`/book?error=${encodeURIComponent(messages.unlinked)}`);

  try {
    await rpc("checkout_sessions", {
      p_session_ids: sessionIds,
      p_customer_id: customer.id,
    });
  } catch {
    redirect(`/book?error=${encodeURIComponent(messages.checkout)}`);
  }

  for (const id of sessionIds) revalidatePath(`/studio/sessions/${id}`);
  revalidatePath("/account");
  revalidatePath("/book");
  const notice = sessionIds.length === 1 ? messages.bookedOne : messages.bookedMany.replace("{count}", String(sessionIds.length));
  redirect(`/account?notice=${encodeURIComponent(notice)}`);
}

export async function placeCreditOrder(formData: FormData) {
  const { t } = await getI18n();
  const messages = t.publicPages.bookingMessages;
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
    redirect(`/book/credits?error=${encodeURIComponent(messages.invalid)}`);
  }

  try {
    await rpc("place_credit_orders", {
      p_customer_id: account.customer_id,
      p_package_ids: items.map((item) => item.id),
      p_quantities: items.map((item) => item.quantity),
    });
  } catch {
    redirect(`/book/credits?error=${encodeURIComponent(messages.orderFailed)}`);
  }

  revalidatePath("/account");
  revalidatePath("/studio/orders");
  redirect(`/account?notice=${encodeURIComponent(messages.orderSubmitted)}`);
}
