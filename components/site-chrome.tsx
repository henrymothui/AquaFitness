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
    { href: "/price", label: t.nav.price },
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
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/classes", label: t.nav.classes },
    { href: "/price", label: t.nav.price },
    { href: "/trainers", label: t.nav.trainers },
    { href: "/locations", label: t.nav.locations },
    { href: "/careers", label: t.nav.careers },
    { href: "/schedule", label: t.footer.schedule },
  ];

  return (
    <>
      <JoinBand kicker={t.footer.bandKicker} title={t.footer.bandTitle} body={t.footer.bandBody} cta={t.footer.bandCta} />
      <footer className="bg-white text-black">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <BrandMark size="sm" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-black/60">{t.footer.tagline}</p>
          </div>
          <div>
            <p className="font-display text-lg uppercase tracking-[0.14em]">{t.footer.menu}</p>
            <ul className="mt-4 space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-black/60 hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-lg uppercase tracking-[0.14em]">{t.footer.visit}</p>
            <p className="mt-4 text-sm text-black/70">{t.footer.street}</p>
            <p className="text-sm text-black/70">{t.footer.city}</p>
          </div>
        </div>
        <div className="border-t border-black/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center">
            <p className="text-sm text-black/50">
              © {year} Hydrofit. {t.footer.rights}
            </p>
            <div className="flex gap-5 text-sm">
              <Link href="/terms" className="text-black/70 hover:text-black">
                {t.footer.terms}
              </Link>
              <Link href="/privacy" className="text-black/70 hover:text-black">
                {t.footer.privacy}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
