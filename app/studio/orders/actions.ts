"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoRole } from "@/lib/demo-auth";
import { rpc } from "@/lib/rpc";

export async function resolveCreditOrder(formData: FormData) {
  if ((await getDemoRole()) !== "admin") redirect("/");

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const path = "/studio/orders?tab=pending";
  if (!/^[\da-f-]{36}$/i.test(orderId) || (status !== "paid" && status !== "rejected")) {
    redirect(`${path}&error=${encodeURIComponent("Order action is not valid.")}`);
  }

  try {
    await rpc("resolve_credit_order", { p_order_id: orderId, p_status: status });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.replace(/^(ERROR:\s*)+/i, "") : "The order could not be updated.";
    redirect(`${path}&error=${encodeURIComponent(message.slice(0, 240))}`);
  }

  revalidatePath("/studio/orders");
  revalidatePath("/studio/customers");
  revalidatePath("/account");
  redirect(`${path}&notice=${encodeURIComponent(status === "paid" ? "Payment confirmed and credits granted." : "Order rejected.")}`);
}
