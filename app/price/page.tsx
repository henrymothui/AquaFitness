import Link from "next/link";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { formatMoney } from "@/lib/format";
import { getI18n } from "@/lib/i18n";
import { listPackages, type PackageView } from "@/lib/queries";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.price.metaTitle };
}

async function loadPackages(): Promise<PackageView[]> {
  try {
    return await listPackages(false);
  } catch {
    return [];
  }
}

export default async function PricePage() {
  const { t } = await getI18n();
  const copy = t.price;
  const packages = await loadPackages();

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <p className="max-w-2xl text-base leading-7 text-black/75">{copy.intro}</p>
          {packages.length === 0 ? (
            <div className="mt-10 border border-black/10 p-8">
              <h2 className="font-display text-4xl uppercase">{copy.emptyTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">{copy.emptyBody}</p>
            </div>
          ) : (
            <ul className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pack) => {
                const each = pack.credit_count > 0 ? Math.round(pack.price_cents / pack.credit_count) : pack.price_cents;
                return (
                  <li key={pack.id} className="flex flex-col border border-black/10 p-6">
                    <h2 className="font-display text-4xl uppercase leading-none">{pack.name}</h2>
                    <p className="mt-6 font-display text-5xl">{formatMoney(pack.price_cents)}</p>
                    <p className="mt-2 text-sm text-black/55">
                      {formatMoney(each)} {copy.perClass}
                    </p>
                    <ul className="mt-6 space-y-2 text-sm leading-6 text-black/75">
                      <li>
                        {pack.credit_count} {pack.credit_count === 1 ? copy.class : copy.classes}
                      </li>
                      <li>
                        {pack.validity_days ? `${copy.validFor} ${pack.validity_days} ${copy.days}` : copy.noExpiry}
                      </li>
                      <li>{pack.applies_to_all ? copy.anyClass : pack.classNames.join(", ") || copy.selected}</li>
                      {pack.description ? <li>{pack.description}</li> : null}
                    </ul>
                    <Link
                      href="/schedule"
                      className="mt-8 inline-flex justify-center rounded-full bg-[#e10600] px-5 py-3 font-display text-sm uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
                    >
                      {copy.book}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="bg-[#f3f3f3]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:grid-cols-[0.7fr_1.3fr]">
            <h2 className="font-display text-5xl uppercase leading-[0.92]">{copy.howTitle}</h2>
            <ol className="space-y-4">
              {copy.how.map((step, index) => (
                <li key={step} className="flex gap-4 border-t border-black/10 pt-4">
                  <span className="font-display text-2xl text-[#e10600]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-6">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
