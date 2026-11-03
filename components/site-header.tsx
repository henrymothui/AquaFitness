"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { setLocale } from "@/app/locale-action";
import type { Locale } from "@/lib/i18n";

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
}: {
  locale: Locale;
  links: NavLink[];
  joinLabel: string;
  languageLabel: string;
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

        <nav className="ml-4 hidden items-center xl:flex" aria-label="Primary">
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
            href="/schedule"
            className="hidden rounded-full bg-[#e10600] px-4 py-2 font-display text-sm font-medium uppercase tracking-[0.12em] text-white hover:bg-[#c10500] sm:inline-flex"
          >
            {joinLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center xl:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex w-5 flex-col gap-1.5">
              <span className="h-0.5 w-full bg-black" />
              <span className="h-0.5 w-full bg-black" />
              <span className="h-0.5 w-full bg-black" />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-white px-4 py-4 xl:hidden">
          <nav className="flex flex-col" aria-label="Primary">
            {links.map((link) => {
              const on = active(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={on ? "page" : undefined}
                  className={`border-b border-black/5 py-3 font-display text-lg uppercase tracking-[0.14em] ${
                    on ? "text-[#e10600]" : "text-black"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em]">
              <button type="button" onClick={() => choose("en")} className={locale === "en" ? "text-black" : "text-black/40"}>
                EN
              </button>
              <button type="button" onClick={() => choose("vi")} className={locale === "vi" ? "text-black" : "text-black/40"}>
                VI
              </button>
            </div>
            <Link
              href="/schedule"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#e10600] px-4 py-2 font-display text-sm uppercase tracking-[0.12em] text-white"
            >
              {joinLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
