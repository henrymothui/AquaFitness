"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio/schedule", label: "Schedule" },
  { href: "/studio/calendar", label: "Calendar" },
  { href: "/studio/course-type", label: "Course Type" },
  { href: "/studio/package", label: "Package" },
] as const;

export function CourseManagementNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Course management" className="mb-4 flex overflow-x-auto border-b border-line">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? "border-pool text-pool" : "border-transparent text-ink/55 hover:text-ink"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
