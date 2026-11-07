import Link from "next/link";
import { JoinBand } from "@/components/marketing";
import { SiteHeader } from "@/components/site-header";
import { BrandMark } from "@/components/ui";
import { getI18n } from "@/lib/i18n";
import { getCurrentRole } from "@/lib/auth";

export async function PublicHeader() {
  const { locale, t } = await getI18n();
  const role = await getCurrentRole();
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/classes", label: t.nav.classes },
    { href: "/trainers", label: t.nav.trainers },
    { href: "/careers", label: t.nav.careers },
    ...(role === "public" ? [{ href: "/my-account", label: t.nav.account }] : []),
    ...(role === "admin" ? [{ href: "/studio", label: "Studio" }] : []),
  ];
  return (
    <SiteHeader locale={locale} links={links} joinLabel={t.nav.join} languageLabel={t.nav.language} loginLabel={t.nav.login} logoutLabel={t.nav.logout} primaryLabel={t.nav.primary} menuLabel={t.nav.menu} role={role} />
  );
}

export async function SiteFooter() {
  const { t } = await getI18n();
  const year = new Date().getFullYear();

  return (
    <>
      <JoinBand kicker={t.footer.bandKicker} title={t.footer.bandTitle} />
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1" aria-label={t.footer.social}>
                <a
                  href="https://www.instagram.com/hydrofitvn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-8 w-8 items-center justify-center text-black/55 transition-colors hover:text-black"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/share/1CWrQ54nQY/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-8 w-8 items-center justify-center text-black/55 transition-colors hover:text-black"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                    <path d="M14.2 8.4V6.9c0-.6.2-1 1-1H17V3.5h-2.4C12.2 3.5 11 4.8 11 6.8v1.6H8.8v2.6H11V21h3.1v-10h2.4l.4-2.6h-2.7z" />
                  </svg>
                </a>
              </div>
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
