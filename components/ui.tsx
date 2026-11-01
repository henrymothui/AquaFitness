import Image from "next/image";
import Link from "next/link";
import { PublicNav, type PublicNavLink } from "@/components/public-nav";

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
            tone === "light" ? "text-white" : "text-lagoon"
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

const publicLinks: PublicNavLink[] = [
  { href: "/", label: "Home" },
  {
    href: "/schedule",
    label: "Inscription",
    children: [
      { href: "/schedule", label: "Regular Class" },
      { href: "/events", label: "Special Events" },
      { href: "/packages", label: "Special Packs" },
    ],
  },
  {
    href: "/about",
    label: "Our Story",
    children: [
      { href: "/about", label: "About Us" },
      { href: "/reviews", label: "Customer Review" },
      { href: "/support", label: "Customer Support" },
    ],
  },
  { href: "/careers", label: "Careers" },
  { href: "/studio", label: "Studio" },
];

const bookNowClass =
  "inline-flex items-center rounded-[4px] bg-lagoon px-3.5 py-2 text-sm font-medium leading-none text-white transition-colors hover:bg-ink";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20">
      <div className="h-1.5 w-full bg-lagoon" aria-hidden="true" />
      <div className="border-b border-black/[0.06] bg-white/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
          <Link href="/" className="shrink-0" aria-label="Hydrofit home">
            <BrandMark hideNameOnMobile />
          </Link>
          <PublicNav
            links={publicLinks}
            className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex"
          />
          <Link href="/schedule" className={bookNowClass}>
            Book now
          </Link>
        </div>
        <PublicNav
          links={publicLinks}
          className="flex items-center justify-center gap-0.5 border-t border-black/[0.06] px-2 py-1 lg:hidden"
        />
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-black/[0.06] bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr] md:px-10">
        <div>
          <BrandMark size="sm" />
          <p className="mt-5 text-base leading-6 text-ink">Ho Chi Minh City</p>
          <p className="text-base leading-6 text-ink/60">12 Vo Truong Toan</p>
        </div>
        <div>
          <p className="font-display text-lg text-ink">Menu</p>
          <ul className="mt-4 space-y-2.5">
            {publicLinks
              .flatMap((link) => (link.children?.length ? link.children : [link]))
              .map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base leading-6 text-ink/60 transition-colors hover:text-pool"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            <li>
              <Link
                href="/schedule"
                className="text-base leading-6 text-ink/60 transition-colors hover:text-pool"
              >
                Book now
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row md:px-10">
          <p className="font-display text-lg text-ink/55">© {year} Hydrofit. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm font-medium text-ink transition-colors hover:text-pool"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-ink transition-colors hover:text-pool"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
