import Image from "next/image";
import Link from "next/link";

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

const publicLinks = [
  { href: "/schedule", label: "Week" },
  { href: "/events", label: "Events" },
  { href: "/packages", label: "Packs" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-[#f4f9fb]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="Hydrofit home">
          <BrandMark hideNameOnMobile />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-ink/75 transition hover:bg-sand hover:text-lagoon"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/studio"
            className="rounded-full bg-lagoon px-3.5 py-1.5 text-white shadow-sm transition hover:bg-tide"
          >
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
      <BrandMark size="sm" />
      <p className="max-w-sm text-sm leading-6 text-ink/55">
        12 Vo Truong Toan, Ho Chi Minh City. Bookings are taken at the studio desk.
      </p>
    </footer>
  );
}
