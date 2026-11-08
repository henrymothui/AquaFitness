import Link from "next/link";
import { resolveCreditOrder } from "@/app/studio/(admin)/orders/actions";
import { CustomerSectionNav } from "@/components/customer-section-nav";
import { ExportLink, Flash } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { confirmedCreditOrders, pendingCreditOrders } from "@/lib/queries";

export const metadata = { title: "Orders" };

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const billingTab = params.tab === "billing";
  const orders = billingTab ? [] : await pendingCreditOrders();
  const confirmedOrders = billingTab ? await confirmedCreditOrders() : [];

  return (
    <main className="grid gap-6">
      <CustomerSectionNav active={billingTab ? "billing" : "orders"} />

      <Flash error={params.error} notice={params.notice} />

      {billingTab ? (
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          <div className="flex justify-end border-b border-[#edf0f2] p-3">
            <ExportLink href="/studio/directory/billing/export">Export billing</ExportLink>
          </div>
          {confirmedOrders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">There are no confirmed orders yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-[#edf0f2] md:hidden">
                {confirmedOrders.map((order) => (
                  <li key={order.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/studio/directory/${order.customerId}`} className="block truncate text-[15px] font-semibold leading-tight text-slate-800">{order.customerName}</Link>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{order.packageName} · {order.creditsTotal} credits</p>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold tabular-nums text-slate-800">{formatMoney(order.priceCents)}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">{shortDate(order.confirmedAt)}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Confirmed date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Credit pack</th>
                    <th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3 text-right">Amount paid</th><th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedOrders.map((order) => (
                    <tr key={order.id} className="border-t border-[#edf0f2] transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{shortDate(order.confirmedAt)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/studio/directory/${order.customerId}`} className="font-semibold text-slate-800 hover:text-lagoon">{order.customerName}</Link>
                        {order.customerEmail ? <p className="mt-1 text-xs text-slate-400">{order.customerEmail}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{order.packageName}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{order.quantity}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{order.creditsTotal}</td>
                      <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-800">{formatMoney(order.priceCents)}</td>
                      <td className="px-5 py-4"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          <div className="border-b border-[#edf0f2] bg-amber-50 px-5 py-3 text-sm text-amber-900">Confirm payment manually before marking an order as paid. Credits are added only after confirmation.</div>
          {orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">There are no orders awaiting payment.</p>
          ) : (
            <>
              <ul className="divide-y divide-[#edf0f2] md:hidden">
                {orders.map((order) => (
                  <li key={order.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/studio/directory/${order.customerId}`} className="block truncate text-[15px] font-semibold leading-tight text-slate-800">{order.customerName}</Link>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{order.packageName} · {order.creditsTotal} credits · {order.quantity} {order.quantity === 1 ? "pack" : "packs"}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{shortDate(order.createdAt)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">{formatMoney(order.priceCents)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-amber-700">pending</span>
                      <form action={resolveCreditOrder} className="flex-1">
                        <input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="status" value="paid" />
                        <button className="h-9 w-full rounded-lg bg-emerald-600 text-xs font-semibold text-white active:bg-emerald-700">Mark paid</button>
                      </form>
                      <form action={resolveCreditOrder} className="flex-1">
                        <input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="status" value="rejected" />
                        <button className="h-9 w-full rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 active:bg-rose-50">Reject</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Order date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Credit pack</th><th className="px-4 py-3 text-right">Credits</th><th className="px-4 py-3 text-right">Amount due</th><th className="px-5 py-3">Status / action</th></tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-[#edf0f2]">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{shortDate(order.createdAt)}</td>
                      <td className="px-4 py-4"><Link href={`/studio/directory/${order.customerId}`} className="font-semibold text-slate-800 hover:text-lagoon">{order.customerName}</Link>{order.customerEmail ? <p className="mt-1 text-xs text-slate-400">{order.customerEmail}</p> : null}</td>
                      <td className="px-4 py-4 text-slate-700">{order.packageName}<p className="mt-1 text-xs text-slate-400">{order.quantity} {order.quantity === 1 ? "pack" : "packs"}</p></td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{order.creditsTotal}</td>
                      <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-800">{formatMoney(order.priceCents)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-amber-700">pending payment</span>
                          <form action={resolveCreditOrder}><input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="status" value="paid" /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Mark paid</button></form>
                          <form action={resolveCreditOrder}><input type="hidden" name="order_id" value={order.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Reject</button></form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
