import Link from "next/link";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.booking.metaTitle };
}

export default async function BookPage() {
  const { t } = await getI18n();
  const copy = t.booking;

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <p className="max-w-xl text-base leading-7 text-black/75">{copy.body}</p>
          <Link
            href="/about"
            className="mt-8 inline-flex rounded-full bg-[#e10600] px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
          >
            {copy.cta}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
