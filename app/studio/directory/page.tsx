import Link from "next/link";
import { Flash, inputClass, quietButtonClass } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { customerBillingHistory, customerCreditBalances, customerCreditTotals, listCustomers } from "@/lib/queries";
import { redirect } from "next/navigation";
import { StudioCustomerDirectory } from "@/components/studio-customer-directory";
import { CustomerSectionNav } from "@/components/customer-section-nav";

export const metadata = { title: "Directory" };

function joinedDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string; tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === "billing") redirect("/studio/confirmed-orders");
  const billingTab = params.tab === "billing";
  const customers = billingTab ? [] : await listCustomers(params.q ?? "");
  const customerIds = customers.map((customer) => customer.id);
  const [creditBalances, creditTotals, billing] = await Promise.all([
    billingTab ? Promise.resolve(new Map<string, number>()) : customerCreditBalances(customerIds),
    billingTab ? Promise.resolve(new Map<string, { purchased: number; consumed: number }>()) : customerCreditTotals(customerIds),
    billingTab ? customerBillingHistory() : Promise.resolve([]),
  ]);

  return (
    <main className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <CustomerSectionNav active="directory" />
        {billingTab ? (
          <a href="/studio/directory/billing/export" className={quietButtonClass}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="mr-2 h-4 w-4">
              <path d="M10 2.5v9m0 0 3.25-3.25M10 11.5 6.75 8.25M3.5 13v3.25h13V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export billing CSV
          </a>
        ) : (
          <a href="/studio/directory/export" className={quietButtonClass}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="mr-2 h-4 w-4">
              <path d="M10 2.5v9m0 0 3.25-3.25M10 11.5 6.75 8.25M3.5 13v3.25h13V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export all to CSV
          </a>
        )}
      </div>

      <Flash error={params.error} notice={params.notice} />

      {billingTab ? (
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          {billing.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">No customer billing records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Paid date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3 text-right">Credits purchased</th>
                    <th className="px-4 py-3 text-right">Credits consumed</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Amount paid</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((sale) => (
                    <tr key={sale.id} className="border-t border-[#edf0f2] transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{joinedDate(sale.purchasedAt)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/studio/directory/${sale.customerId}`} className="font-semibold text-slate-800 hover:text-lagoon">{sale.customerName}</Link>
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
      ) : <div>
        <section className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#edf0f2] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <form className="flex w-full gap-2 sm:max-w-lg" action="/studio/directory">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search name, email, or phone"
                aria-label="Search customers by name, email, or phone"
                className={inputClass}
              />
              <button className={quietButtonClass}>Search</button>
            </form>
            <span className="text-xs text-slate-400">Live credit reflects active, unexpired packs</span>
          </div>

          {customers.length === 0 && params.q ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">No customers match your search.</p>
          ) : (
            <StudioCustomerDirectory customers={customers.map((customer) => ({
              ...customer,
              username: customer.username ?? null,
              joinedDate: joinedDate(customer.created_at),
              creditsPurchased: creditTotals.get(customer.id)?.purchased ?? 0,
              creditsConsumed: creditTotals.get(customer.id)?.consumed ?? 0,
              liveCredits: creditBalances.get(customer.id) ?? 0,
            }))} />
          )}
        </section>
      </div>}
    </main>
  );
}
