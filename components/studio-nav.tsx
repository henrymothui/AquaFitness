"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
import { BrandMark } from "@/components/ui";

type MenuLink = {
  href: string;
  label: string;
};

type MenuGroup = {
  id: string;
  label: string;
  href?: string;
  links?: MenuLink[];
};

const menuGroups: MenuGroup[] = [
  {
    id: "courses",
    label: "Courses",
    links: [
      { href: "/studio/courses/schedule", label: "Schedule" },
      { href: "/studio/courses/calendar", label: "Calendar" },
      { href: "/studio/courses/course-type", label: "Course Type" },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    links: [
      { href: "/studio/pricing/package", label: "Package" },
      { href: "/studio/pricing/discount", label: "Discount" },
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
    id: "coach",
    label: "Coach",
    href: "/studio/coach",
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

const settingsLink: MenuLink = { href: "/studio/settings", label: "Settings" };

function isLinkActive(link: MenuLink, pathname: string) {
  return (
    pathname === link.href ||
    pathname.startsWith(`${link.href}/`) ||
    (link.href === "/studio/courses/schedule" && pathname.startsWith("/studio/courses/schedule/")) ||
    (link.href === "/studio/directory" && pathname.startsWith("/studio/directory/"))
  );
}

function menuFor(role: "admin" | "coach") {
  if (role === "admin") return menuGroups;
  return [
    {
      id: "operations",
      label: "Operations",
      links: [{ href: "/studio/check-in", label: "Check-in" }],
    },
  ];
}

function isParentActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContaining(pathname: string, groups: MenuGroup[]) {
  return groups.find((group) =>
    (group.href ? isParentActive(group.href, pathname) : false) ||
    (group.links ?? []).some((link) => isLinkActive(link, pathname)),
  )?.id ?? null;
}

function ParentMenuLink({
  href,
  label,
  pathname,
  onNavigate,
  mobile = false,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const active = isParentActive(href, pathname);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={mobile
        ? `block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#eaf4f8] text-[#155b78]" : "text-slate-700 active:bg-slate-50"}`
        : `shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition md:w-full ${active ? "bg-[#eaf4f8] text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
    >
      {label}
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
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
  links?: MenuLink[];
  pathname: string;
}) {
  const active = (links ?? []).some((link) => isLinkActive(link, pathname));
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
        <Chevron open={open} />
      </button>
      <div id={`${id}-submenu`} className={`${open ? "flex" : "hidden"} items-center gap-1 md:mt-1 md:flex-col md:items-stretch`}>
        {(links ?? []).map((link) => {
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

function MobileMenuGroup({
  group,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  group: MenuGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const active = (group.links ?? []).some((link) => isLinkActive(link, pathname));

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition ${active ? "text-[#155b78]" : "text-slate-700"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{group.label}</span>
          {active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pool" aria-hidden /> : null}
        </span>
        <Chevron open={open} />
      </button>
      <div className={`${open ? "grid gap-1" : "hidden"} px-2 pb-2`}>
        {(group.links ?? []).map((link) => {
          const linkActive = isLinkActive(link, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={linkActive ? "page" : undefined}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${linkActive ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 active:bg-slate-50"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function StudioNav({ role }: { role: "admin" | "coach" }) {
  const pathname = usePathname();
  const groups = menuFor(role);
  const homeHref = role === "coach" ? "/studio/check-in" : "/studio/courses/schedule";
  const currentGroup = groupContaining(pathname, groups);
  // State is tagged with the pathname it belongs to, so navigating (including a
  // back/forward navigation that bypasses the links) resets the drawer without
  // needing a state-syncing effect.
  const [navState, setNavState] = useState<{ path: string; open: boolean; group: string | null }>({
    path: pathname,
    open: false,
    group: currentGroup,
  });
  const stale = navState.path !== pathname;
  const open = stale ? false : navState.open;
  const openGroup = stale ? currentGroup : navState.group;

  const setOpen = useCallback((next: boolean) => {
    setNavState({ path: pathname, open: next, group: openGroup });
  }, [pathname, openGroup]);

  function toggleGroup(id: string) {
    setNavState({ path: pathname, open, group: openGroup === id ? null : id });
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e5e9ed] bg-white px-4 md:hidden">
        <Link href={homeHref} aria-label="Hydrofit studio home" className="flex min-w-0 items-center">
          <BrandMark size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="studio-mobile-menu"
          aria-label="Open studio menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#e5e9ed] text-slate-700 transition active:bg-slate-100"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
            <path d="M3 6h14M3 10h14M3 14h14" />
          </svg>
        </button>
      </div>

      <div id="studio-mobile-menu" inert={!open} className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Studio menu"
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-[19rem] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e9ed] px-4 py-3">
            <Link href={homeHref} onClick={() => setOpen(false)} aria-label="Hydrofit studio home" className="flex min-w-0 items-center">
              <BrandMark size="sm" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close studio menu"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition active:bg-slate-100"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4.5 w-4.5">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>

          <div className="border-b border-[#e5e9ed] px-4 py-2.5">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${role === "coach" ? "border-pool/30 bg-[#eaf4f8] text-[#155b78]" : "border-red-200 bg-red-50 text-red-700"}`}>
              {role === "coach" ? "Coach Access" : "Admin Access"}
            </span>
          </div>

          <nav aria-label="Studio navigation" className="flex-1 overflow-y-auto overscroll-contain">
            {groups.map((group) => group.href && !group.links?.length ? (
              <div key={group.id} className="border-b border-slate-100 px-2 py-2">
                <ParentMenuLink href={group.href} label={group.label} pathname={pathname} onNavigate={() => setOpen(false)} mobile />
              </div>
            ) : (
              <MobileMenuGroup
                key={group.id}
                group={group}
                pathname={pathname}
                open={openGroup === group.id}
                onToggle={() => toggleGroup(group.id)}
                onNavigate={() => setOpen(false)}
              />
            ))}
            {role === "admin" ? (
              <div className="px-2 py-2">
                <Link
                  href={settingsLink.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === settingsLink.href ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${pathname === settingsLink.href ? "bg-[#eaf4f8] text-[#155b78]" : "text-slate-700 active:bg-slate-50"}`}
                >
                  {settingsLink.label}
                </Link>
              </div>
            ) : null}
          </nav>

          <div className="grid gap-2 border-t border-[#e5e9ed] p-3">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#b9dce8] bg-[#f0f9fc] px-3 py-2.5 text-sm font-semibold text-[#155b78]"
            >
              <span>Public site</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                <path d="M4 10h11M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <form action={logout}>
              <button className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition active:bg-slate-50">Sign out</button>
            </form>
          </div>
        </div>
      </div>

      <aside className="hidden border-b border-[#e5e9ed] bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex flex-col items-start px-4 py-3 md:px-5 md:py-5">
          <Link href={homeHref} aria-label="Hydrofit studio home">
            <BrandMark size="sm" />
          </Link>
          <span className={`mt-2 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] md:mt-4 md:flex md:w-fit ${role === "coach" ? "border-pool/30 bg-[#eaf4f8] text-[#155b78]" : "border-red-200 bg-red-50 text-red-700"}`}>
            {role === "coach" ? "Coach Access" : "Admin Access"}
          </span>
        </div>
        <nav aria-label="Studio navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-5">
          {groups.map((group) => group.href && !group.links?.length ? (
            <ParentMenuLink key={group.id} href={group.href} label={group.label} pathname={pathname} />
          ) : (
            <StudioMenuGroup key={group.id} id={group.id} label={group.label} links={group.links} pathname={pathname} />
          ))}
          {role === "admin" ? (
            <Link
              href="/studio/settings"
              aria-current={pathname === "/studio/settings" ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${pathname === "/studio/settings" ? "bg-[#eaf4f8] font-semibold text-[#155b78]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Settings
            </Link>
          ) : null}
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
    </>
  );
}
