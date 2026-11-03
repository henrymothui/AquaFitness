"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type PublicNavLink = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemClass =
  "whitespace-nowrap rounded-[2px] px-3 py-2 text-sm font-medium leading-none tracking-tight transition-colors md:px-4";

export function PublicNav({
  links,
  className,
}: {
  links: PublicNavLink[];
  className?: string;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function close() {
      navRef.current?.querySelectorAll("details[open]").forEach((menu) => {
        menu.removeAttribute("open");
      });
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onPointerDown(event: PointerEvent) {
      const open = navRef.current?.querySelector("details[open]");
      if (open && !open.contains(event.target as Node)) close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    navRef.current?.querySelectorAll("details[open]").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }, [pathname]);

  return (
    <nav ref={navRef} className={className} aria-label="Primary">
      {links.map((link) => {
        if (!link.children?.length) {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`${itemClass} ${active ? "text-lagoon" : "text-ink hover:bg-black/[0.04]"}`}
            >
              {link.label}
            </Link>
          );
        }

        const active = link.children.some((child) => isActive(pathname, child.href));

        return (
          <details key={link.label} className="group relative">
            <summary
              className={`${itemClass} flex cursor-pointer list-none items-center marker:hidden [&::-webkit-details-marker]:hidden ${
                active ? "text-lagoon" : "text-ink hover:bg-black/[0.04] group-open:text-lagoon"
              }`}
            >
              {link.label}
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="ml-1 h-2.5 w-2.5 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="pointer-events-none absolute left-1/2 top-full z-30 w-max -translate-x-1/2 pt-2 group-open:pointer-events-auto group-hover:pointer-events-auto">
              <div className="invisible min-w-[11.5rem] overflow-hidden rounded-[6px] border border-black/[0.06] bg-white py-1 opacity-0 shadow-[0_18px_40px_-24px_rgba(16,36,51,0.55)] group-open:visible group-open:opacity-100 group-hover:visible group-hover:opacity-100">
                {link.children.map((child) => {
                  const childActive = isActive(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={childActive ? "page" : undefined}
                      className={`block whitespace-nowrap px-4 py-2.5 text-sm font-medium tracking-tight transition-colors ${
                        childActive ? "text-lagoon" : "text-ink hover:bg-black/[0.04]"
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </details>
        );
      })}
    </nav>
  );
}
