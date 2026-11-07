"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/ui";

const courseManagementLinks = [
  { href: "/studio/courses-schedule", label: "Courses" },
  { href: "/studio/courses-schedule?tab=types", label: "Course Type" },
  { href: "/studio/packages", label: "Package" },
];

const links = [
  { href: "/studio/check-in", label: "Check-in" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/customers", label: "Customers" },
];

export function StudioNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="border-b border-[#e5e9ed] bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:block md:px-5 md:py-5">
        <Link href="/studio/courses-schedule" aria-label="Hydrofit studio home">
          <BrandMark size="sm" />
        </Link>
        <span className="text-xs font-medium text-slate-400 md:mt-4 md:block">Studio</span>
      </div>
      <nav aria-label="Studio navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-5">
        <div className="flex shrink-0 items-center gap-1 md:block">
          <p className="hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:block">Course Management</p>
          <div className="flex items-center gap-1 md:flex-col md:items-stretch">
            {courseManagementLinks.map((link) => {
              const isCourseTypes = link.href.endsWith("?tab=types");
              const active = isCourseTypes
                ? pathname === "/studio/courses-schedule" && searchParams.get("tab") === "types"
                : (pathname === link.href && searchParams.get("tab") !== "types") || pathname.startsWith(`${link.href}/`) || (link.href === "/studio/courses-schedule" && pathname.startsWith("/studio/sessions/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm transition md:ml-2 md:w-[calc(100%-0.5rem)] ${active ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`) || (link.href === "/studio/orders" && pathname.startsWith("/studio/customers/billing"));
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm transition md:w-full ${active ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link href="/" className="shrink-0 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 md:mt-3">Public site</Link>
      </nav>
    </aside>
  );
}
