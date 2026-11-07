import { redirect } from "next/navigation";
import { AccountTabs } from "@/components/account-tabs";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getDemoAccount } from "@/lib/demo-auth";
import { availableCredits } from "@/lib/demo-member";
import {
  customerBookings,
  customerCreditOrders,
  customerSales,
  getCustomer,
  getSettings,
} from "@/lib/queries";

export const metadata = { title: "My account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const query = await searchParams;
  const account = await getDemoAccount();
  if (account?.role === "admin") redirect("/studio");
  if (account?.role !== "public") redirect("/login");

  const [customer, settings] = await Promise.all([
    account.customer_id ? getCustomer(account.customer_id) : Promise.resolve(null),
    getSettings(),
  ]);
  const [sales, bookings, creditOrders] = customer
    ? await Promise.all([customerSales(customer.id), customerBookings(customer.id), customerCreditOrders(customer.id)])
    : [[], [], []];
  const creditsConsumed = sales
    .filter((sale) => sale.status !== "cancelled")
    .reduce((sum, sale) => sum + sale.creditsUsed, 0);

  return (
    <>
      <PublicHeader />
      <main className="min-h-[70vh] bg-[#f7f8f8] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {query.notice ? (
            <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              ✓ {query.notice}
            </p>
          ) : null}
          {query.error ? (
            <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {query.error}
            </p>
          ) : null}
          <AccountTabs
            memberName={customer?.full_name ?? "Member"}
            title={customer?.title ?? null}
            dateOfBirth={customer?.date_of_birth ?? null}
            address={customer?.address ?? null}
            email={customer?.email ?? ""}
            phone={customer?.phone ?? null}
            creditsAvailable={availableCredits(sales)}
            creditsConsumed={creditsConsumed}
            sales={sales}
            creditOrders={creditOrders}
            bookings={bookings}
            timezone={settings.timezone}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
