import Link from "next/link";
import { JoinBand } from "@/components/marketing";
import { SiteHeader } from "@/components/site-header";
import { BrandMark } from "@/components/ui";
import { getI18n } from "@/lib/i18n";

export async function PublicHeader() {
  const { locale, t } = await getI18n();
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/classes", label: t.nav.classes },
    { href: "/trainers", label: t.nav.trainers },
    { href: "/locations", label: t.nav.locations },
    { href: "/careers", label: t.nav.careers },
  ];
  return (
    <SiteHeader locale={locale} links={links} joinLabel={t.nav.join} languageLabel={t.nav.language} />
  );
}

export async function SiteFooter() {
  const { t } = await getI18n();
  const year = new Date().getFullYear();

  return (
    <>
      <JoinBand kicker={t.footer.bandKicker} title={t.footer.bandTitle} cta={t.footer.bandCta} />
      <footer id="site-footer" className="border-t border-black/10 bg-white text-black">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <BrandMark size="sm" />
          <p className="text-xs leading-5 text-black/55 md:text-right">
            {t.footer.street}
            <span className="text-black/25"> · </span>
            {t.footer.city}
          </p>
        </div>
        <div className="border-t border-black/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-3 text-xs text-black/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} Hydrofit. {t.footer.rights}
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-black">
                {t.footer.terms}
              </Link>
              <Link href="/privacy" className="hover:text-black">
                {t.footer.privacy}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
