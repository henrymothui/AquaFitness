"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { rpc } from "@/lib/rpc";

export async function resolveCreditOrder(formData: FormData) {
  if ((await getCurrentRole()) !== "admin") redirect("/");

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const pendingPath = "/studio/pending-orders";
  if (!/^[\da-f-]{36}$/i.test(orderId) || (status !== "paid" && status !== "rejected")) {
    redirect(`${pendingPath}?error=${encodeURIComponent("Order action is not valid.")}`);
  }

  try {
    await rpc("resolve_credit_order", { p_order_id: orderId, p_status: status });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.replace(/^(ERROR:\s*)+/i, "") : "The order could not be updated.";
    redirect(`${pendingPath}?error=${encodeURIComponent(message.slice(0, 240))}`);
  }

  revalidatePath("/studio/pending-orders");
  revalidatePath("/studio/confirmed-orders");
  revalidatePath("/studio/directory");
  revalidatePath("/my-account");
  const destination = status === "paid" ? "/studio/confirmed-orders" : pendingPath;
  redirect(`${destination}?notice=${encodeURIComponent(status === "paid" ? "Payment confirmed and credits granted. The order is now in Confirmed Orders." : "Order rejected.")}`);
}
