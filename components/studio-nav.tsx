"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui";

const links = [
  { href: "/studio", label: "Today" },
  { href: "/studio/classes", label: "Classes" },
  { href: "/studio/schedules", label: "Weekly times" },
  { href: "/studio/events", label: "Events" },
  { href: "/studio/customers", label: "Customers" },
  { href: "/studio/packages", label: "Packages" },
  { href: "/studio/discounts", label: "Discounts" },
  { href: "/studio/follow-up", label: "Follow-up" },
];

export function StudioNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-white/10 bg-lagoon text-foam md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="px-4 py-5">
        <Link href="/studio">
          <BrandMark tone="light" size="sm" />
        </Link>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
          Studio desk
        </p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                active ? "bg-white text-lagoon shadow-sm" : "text-foam/90 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-foam/70 hover:bg-white/10"
        >
          Public site
        </Link>
      </nav>
    </aside>
  );
}
