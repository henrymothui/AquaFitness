"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio/pricing/package", label: "Package" },
  { href: "/studio/pricing/discount", label: "Discount" },
] as const;

export function PackageSectionNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Pricing" className="-mx-1 mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 md:mx-0 md:flex md:gap-0 md:overflow-x-auto md:rounded-none md:border-b md:border-line md:bg-transparent md:p-0">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`truncate rounded-lg px-1.5 py-2 text-center text-xs font-semibold transition md:shrink-0 md:rounded-none md:border-b-2 md:px-4 md:py-3 md:text-sm ${active ? "bg-white text-[#155b78] shadow-sm md:border-pool md:bg-transparent md:text-pool md:shadow-none" : "text-ink/55 md:border-transparent md:hover:text-ink"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
