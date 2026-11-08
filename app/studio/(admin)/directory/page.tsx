import Link from "next/link";
import { ExportLink, Flash } from "@/components/ui";
import { formatMoney, formatWhen } from "@/lib/format";
import { customerBillingHistory, customerCreditBalances, customerCreditTotals, getSettings, listAllSessions, listCustomers, listDiscountPlans, listGrantedDiscounts } from "@/lib/queries";
import { redirect } from "next/navigation";
import { AddCustomerButton, StudioCustomerDirectory } from "@/components/studio-customer-directory";
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
  const [creditBalances, creditTotals, billing, settings, sessions, discountPlans, grantedDiscounts] = await Promise.all([
    billingTab ? Promise.resolve(new Map<string, number>()) : customerCreditBalances(customerIds),
    billingTab ? Promise.resolve(new Map<string, { purchased: number; consumed: number }>()) : customerCreditTotals(customerIds),
    billingTab ? customerBillingHistory() : Promise.resolve([]),
    billingTab ? Promise.resolve(null) : getSettings(),
    billingTab ? Promise.resolve([]) : listAllSessions(),
    billingTab ? Promise.resolve([]) : listDiscountPlans(true),
    billingTab ? Promise.resolve([]) : listGrantedDiscounts(),
  ]);
  const courses = sessions
    .filter((session) => session.status === "scheduled" && new Date(session.endsAt).getTime() > Date.now())
    .slice(0, 150)
    .map((session) => ({
      id: session.id,
      creditsRequired: session.creditsRequired,
      label: `${session.title} · ${formatWhen(session.startsAt, settings?.timezone ?? "UTC")} · ${session.creditsRequired} credit${session.creditsRequired === 1 ? "" : "s"}`,
    }));

  return (
    <main className="grid gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <CustomerSectionNav active="directory" />
        {billingTab ? (
          <ExportLink href="/studio/directory/billing/export">Export billing</ExportLink>
        ) : (
          <div className="flex items-center gap-2">
            <AddCustomerButton />
            <ExportLink href="/studio/directory/export" className="w-[8.75rem] justify-center">Export all</ExportLink>
          </div>
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
          <StudioCustomerDirectory
            searchQuery={params.q ?? ""}
            emptyLabel={params.q ? "No customers match your search." : "No customers have been registered yet."}
            courses={courses}
            timezone={settings?.timezone ?? "UTC"}
            discountPlans={discountPlans}
            grantedDiscounts={grantedDiscounts}
            customers={customers.map((customer) => ({
              ...customer,
              username: customer.username ?? null,
              joinedDate: joinedDate(customer.created_at),
              creditsPurchased: creditTotals.get(customer.id)?.purchased ?? 0,
              creditsConsumed: creditTotals.get(customer.id)?.consumed ?? 0,
              liveCredits: creditBalances.get(customer.id) ?? 0,
            }))}
          />
        </section>
      </div>}
    </main>
  );
}
