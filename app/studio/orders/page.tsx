import Link from "next/link";
import { resolveCreditOrder } from "@/app/studio/orders/actions";
import { Flash, quietButtonClass } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { customerBillingHistory, pendingCreditOrders } from "@/lib/queries";

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
  const [orders, billing] = await Promise.all([
    billingTab ? Promise.resolve([]) : pendingCreditOrders(),
    billingTab ? customerBillingHistory() : Promise.resolve([]),
  ]);

  return (
    <main className="grid gap-6">
      <div>
        <p className="text-sm font-medium text-slate-500">PAYMENT REVIEW</p>
        <h1 className="mt-1">Orders</h1>
        <p className="mt-2 text-sm text-slate-500">Review customer credit orders and confirmed sales.</p>
      </div>

      <Flash error={params.error} notice={params.notice} />

      <nav aria-label="Order views" className="mb-4 flex overflow-x-auto border-b border-line">
        <Link href="/studio/orders?tab=pending" aria-current={!billingTab ? "page" : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${!billingTab ? "border-pool text-pool" : "border-transparent text-ink/55 hover:text-ink"}`}>Pending order</Link>
        <Link href="/studio/orders?tab=billing" aria-current={billingTab ? "page" : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${billingTab ? "border-pool text-pool" : "border-transparent text-ink/55 hover:text-ink"}`}>Billing</Link>
      </nav>

      {billingTab ? (
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          <div className="flex justify-end border-b border-[#edf0f2] p-3">
            <a href="/studio/customers/billing/export" className={quietButtonClass}>Export billing CSV</a>
          </div>
          {billing.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">No customer billing records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Paid date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3 text-right">Credits purchased</th><th className="px-4 py-3 text-right">Credits consumed</th>
                    <th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Amount paid</th><th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((sale) => (
                    <tr key={sale.id} className="border-t border-[#edf0f2] transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{shortDate(sale.purchasedAt)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/studio/customers/${sale.customerId}`} className="font-semibold text-slate-800 hover:text-lagoon">{sale.customerName}</Link>
                        {sale.customerEmail ? <p className="mt-1 text-xs text-slate-400">{sale.customerEmail}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{sale.packageName}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{sale.creditsTotal}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{sale.creditsUsed}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatMoney(sale.priceCents)}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatMoney(sale.discountCents)}</td>
                      <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-800">{formatMoney(sale.finalPriceCents)}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{sale.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          <div className="border-b border-[#edf0f2] bg-amber-50 px-5 py-3 text-sm text-amber-900">Confirm payment manually before marking an order as paid. Credits are added only after confirmation.</div>
          {orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">There are no orders awaiting payment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Order date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Credit pack</th><th className="px-4 py-3 text-right">Credits</th><th className="px-4 py-3 text-right">Amount due</th><th className="px-5 py-3">Status / action</th></tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-[#edf0f2]">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{shortDate(order.createdAt)}</td>
                      <td className="px-4 py-4"><Link href={`/studio/customers/${order.customerId}`} className="font-semibold text-slate-800 hover:text-lagoon">{order.customerName}</Link>{order.customerEmail ? <p className="mt-1 text-xs text-slate-400">{order.customerEmail}</p> : null}</td>
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
          )}
        </section>
      )}
    </main>
  );
}
