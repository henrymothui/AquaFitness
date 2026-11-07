"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/ui";

type MenuLink = {
  href: string;
  label: string;
};

const menuGroups = [
  {
    id: "course-management",
    label: "Course Management",
    links: [
      { href: "/studio/schedule", label: "Schedule" },
      { href: "/studio/calendar", label: "Calendar" },
      { href: "/studio/course-type", label: "Course Type" },
      { href: "/studio/package", label: "Package" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    links: [
      { href: "/studio/check-in", label: "Check-in" },
    ],
  },
  {
    id: "customer",
    label: "Customer",
    links: [
      { href: "/studio/pending-orders", label: "Pending Orders" },
      { href: "/studio/confirmed-orders", label: "Confirmed Orders" },
      { href: "/studio/directory", label: "Directory" },
    ],
  },
];

function isLinkActive(link: MenuLink, pathname: string) {
  return (
    pathname === link.href ||
    pathname.startsWith(`${link.href}/`) ||
    (link.href === "/studio/schedule" && pathname.startsWith("/studio/schedule/")) ||
    (link.href === "/studio/directory" && pathname.startsWith("/studio/directory/"))
  );
}

function StudioMenuGroup({
  id,
  label,
  links,
  pathname,
}: {
  id: string;
  label: string;
  links: MenuLink[];
  pathname: string;
}) {
  const active = links.some((link) => isLinkActive(link, pathname));
  const [open, setOpen] = useState(active);

  return (
    <div className="shrink-0 md:w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-submenu`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition md:w-full md:justify-between ${active ? "text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
      >
        <span>{label}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}>
          <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <div id={`${id}-submenu`} className={`${open ? "flex" : "hidden"} items-center gap-1 md:mt-1 md:flex-col md:items-stretch`}>
        {links.map((link) => {
          const linkActive = isLinkActive(link, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={linkActive ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm transition md:ml-2 md:w-[calc(100%-0.5rem)] ${linkActive ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function StudioNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-[#e5e9ed] bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex flex-col items-start px-4 py-3 md:px-5 md:py-5">
        <Link href="/studio/schedule" aria-label="Hydrofit studio home">
          <BrandMark size="sm" />
        </Link>
        <span className="mt-2 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-700 md:mt-4 md:flex md:w-fit">
          Admin Access
        </span>
      </div>
      <nav aria-label="Studio navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-5">
        {menuGroups.map((group) => (
          <StudioMenuGroup key={group.id} {...group} pathname={pathname} />
        ))}
        <Link
          href="/studio/settings"
          aria-current={pathname === "/studio/settings" ? "page" : undefined}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${pathname === "/studio/settings" ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
        >
          Settings
        </Link>
        <Link
          href="/"
          className="mt-1 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#b9dce8] bg-[#f0f9fc] px-3 py-2.5 text-sm font-semibold text-[#155b78] shadow-sm transition hover:border-[#7db9cc] hover:bg-[#e3f3f8] md:mt-auto"
        >
          <span>Public site</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <path d="M4 10h11M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>
    </aside>
  );
}
