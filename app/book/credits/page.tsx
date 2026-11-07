import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { CreditStore } from "@/components/credit-store";
import { listPackages } from "@/lib/queries";

export const metadata = { title: "Purchase credits" };

export default async function PurchaseCreditsPage() {
  const packages = await listPackages(false);

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-[#f7f8f8] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <Link href="/book" className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 transition hover:text-[#e10600]">← Back to Book Now</Link>
          <CreditStore packs={packages.map((pack) => ({
            id: pack.id,
            name: pack.name,
            credits: pack.credit_count,
            price: pack.price_cents,
            note: pack.description ?? "",
          }))} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
