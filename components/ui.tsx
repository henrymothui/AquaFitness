import Image from "next/image";
import Link from "next/link";
import { JoinBand } from "@/components/marketing";
import { SiteHeader } from "@/components/site-header";
import { getI18n } from "@/lib/i18n";

export const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-pool focus:ring-4 focus:ring-pool/10";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-lagoon px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-tide";

export const quietButtonClass =
  "inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-pool hover:text-lagoon";

export function BrandMark({
  tone = "dark",
  size = "md",
  hideNameOnMobile = false,
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md";
  hideNameOnMobile?: boolean;
}) {
  const mark = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/hydrofit-logo.jpg"
        alt=""
        width={96}
        height={96}
        className={`${mark} rounded-full object-cover object-[center_34%] ring-2 ring-white shadow-sm`}
      />
      <span className={`leading-none ${hideNameOnMobile ? "hidden sm:block" : ""}`}>
        <span
          className={`block font-display text-[1.35rem] font-semibold tracking-[0.16em] ${
            tone === "light" ? "text-white" : "text-black"
          }`}
        >
          HYDROFIT
        </span>
        <span
          className={`mt-1 block text-[10px] font-semibold tracking-[0.34em] ${
            tone === "light" ? "text-[#b7e4ee]" : "text-pool"
          }`}
        >
          AQUAFITNESS
        </span>
      </span>
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink/80">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-ink/60">{hint}</span> : null}
    </label>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line/80 bg-card p-5">
      <h2 className="text-2xl tracking-wide text-lagoon">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="rounded-2xl border border-pool/30 bg-pool/10 px-4 py-3 text-sm text-tide">
        {notice}
      </p>
    );
  }
  return null;
}

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
