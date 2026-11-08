"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { setLocale } from "@/app/locale-action";
import { logout } from "@/app/login/actions";
import type { Locale } from "@/lib/i18n";
import type { AppRole } from "@/lib/auth";

export type NavLink = { href: string; label: string };

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  locale,
  links,
  joinLabel,
  languageLabel,
  loginLabel,
  logoutLabel,
  primaryLabel,
  menuLabel,
  role,
}: {
  locale: Locale;
  links: NavLink[];
  joinLabel: string;
  languageLabel: string;
  loginLabel: string;
  logoutLabel: string;
  primaryLabel: string;
  menuLabel: string;
  role: AppRole | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function choose(next: Locale) {
    if (next === locale) return;
    await setLocale(next);
    setOpen(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center gap-4 px-4 md:h-20 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Hydrofit">
          <Image
            src="/brand/hydrofit-logo.jpg"
            alt=""
            width={96}
            height={96}
            className="h-11 w-11 rounded-full object-cover object-center ring-1 ring-black/10"
          />
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] font-semibold tracking-[0.14em] text-black">
              HYDROFIT
            </span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.28em] text-black/50">
              AQUAFITNESS
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center xl:flex" aria-label={primaryLabel}>
          {links.map((link) => {
            const on = active(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={on ? "page" : undefined}
                className={`px-2.5 py-2 font-display text-[14px] font-medium uppercase tracking-[0.12em] ${
                  on ? "text-black" : "text-black/70 hover:text-black"
                }`}
              >
                <span className={on ? "border-b-2 border-[#e10600] pb-1" : ""}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {role ? <form action={logout} className="hidden sm:block"><button className="px-2 py-2 text-xs font-semibold text-black/55 transition hover:text-black">{logoutLabel}</button></form> : <Link href="/log-in" className="hidden px-2 py-2 text-xs font-semibold text-black/65 transition hover:text-black sm:inline-flex">{loginLabel}</Link>}
          <div className="hidden items-center gap-2 text-xs font-semibold tracking-[0.16em] sm:flex" aria-label={languageLabel}>
            <button
              type="button"
              onClick={() => choose("en")}
              className={locale === "en" ? "text-black" : "text-black/40 hover:text-black"}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
            <span className="text-black/20" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={() => choose("vi")}
              className={locale === "vi" ? "text-black" : "text-black/40 hover:text-black"}
              aria-pressed={locale === "vi"}
            >
              VI
            </button>
          </div>
          <Link
            href="/book-now"
            className="hidden rounded-full bg-[#e10600] px-4 py-2 font-display text-sm font-medium uppercase tracking-[0.12em] text-white hover:bg-[#c10500] sm:inline-flex"
          >
            {joinLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={menuLabel}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex h-[18px] w-5 flex-col justify-between">
              <span
                className={`block h-0.5 w-full origin-center bg-black transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  open ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-black transition-opacity duration-200 motion-reduce:transition-none ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-full origin-center bg-black transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  open ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-[4.5rem] z-40 overflow-y-auto bg-white transition-[opacity,visibility] duration-300 md:top-20 xl:hidden ${
          open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        }`}
      >
        <div className="min-h-full border-t border-black/10 bg-white px-4" inert={!open}>
          <nav className="flex flex-col py-2" aria-label={primaryLabel}>
            {links.map((link, index) => {
              const on = active(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={on ? "page" : undefined}
                  style={{ transitionDelay: open ? `${70 + index * 45}ms` : "0ms" }}
                  className={`block py-3 font-display text-[15px] font-medium uppercase tracking-[0.14em] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
                  } ${on ? "text-[#e10600]" : "text-black"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div
            className={`flex items-center justify-between border-t border-black/10 py-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${70 + links.length * 45}ms` : "0ms" }}
          >
            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.16em]">
              <button type="button" onClick={() => choose("en")} className={locale === "en" ? "text-black" : "text-black/40"}>
                EN
              </button>
              <button type="button" onClick={() => choose("vi")} className={locale === "vi" ? "text-black" : "text-black/40"}>
                VI
              </button>
            </div>
            <Link
              href="/book-now"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#e10600] px-3 py-1.5 font-display text-xs uppercase tracking-[0.12em] text-white"
            >
              {joinLabel}
            </Link>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 py-3">
            {role === "admin" || role === "coach" ? <Link href={role === "coach" ? "/studio/check-in" : "/studio"} onClick={() => setOpen(false)} className="text-sm font-semibold text-[#315e50]">Studio workspace →</Link> : <span />}
            {role ? <form action={logout}><button className="text-sm font-medium text-black/55">{logoutLabel}</button></form> : <Link href="/log-in" onClick={() => setOpen(false)} className="text-sm font-medium text-black/55">{loginLabel}</Link>}
          </div>
        </div>
      </div>
    </header>
  );
}
