import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { CreditStore } from "@/components/credit-store";
import { listPackages } from "@/lib/queries";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.credits.title };
}

export default async function PurchaseCreditsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const [{ locale, t }, packages] = await Promise.all([getI18n(), listPackages(false)]);

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-[#f7f8f8] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <Link href="/book-now" className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 transition hover:text-[#e10600]">{t.publicPages.credits.back}</Link>
          {query.error ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{query.error}</p> : null}
          <CreditStore locale={locale} copy={t.publicPages.credits} packs={packages.map((pack) => ({
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
