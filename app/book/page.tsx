import { redirect } from "next/navigation";
import { BookingExperience } from "@/components/booking-experience";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getDemoAccount } from "@/lib/demo-auth";
import { availableCredits } from "@/lib/demo-member";
import { bookingCounts, customerSales, getCustomer, getSettings, listClassTypes, listUpcoming } from "@/lib/queries";

export const metadata = { title: "Book a class" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const account = await getDemoAccount();
  if (account?.role !== "public") redirect("/login");

  const [settings, sessions, classes, customer] = await Promise.all([
    getSettings(),
    listUpcoming(100),
    listClassTypes(false),
    account.customer_id ? getCustomer(account.customer_id) : Promise.resolve(null),
  ]);
  const [bookingMap, sales] = await Promise.all([
    bookingCounts(sessions.map((session) => session.id)),
    customer ? customerSales(customer.id) : Promise.resolve([]),
  ]);
  const credits = availableCredits(sales);

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-[#f7f8f8] pb-16">
        <BookingExperience
          sessions={sessions}
          classes={classes}
          counts={Object.fromEntries(bookingMap)}
          timezone={settings.timezone}
          credits={credits}
          memberName={customer?.full_name ?? "Member"}
          error={query.error}
          notice={query.notice}
        />
      </main>
      <SiteFooter />
    </>
  );
}
