import Link from "next/link";

const views = [
  { href: "/studio/pending-orders", label: "Pending Orders", id: "orders" },
  { href: "/studio/confirmed-orders", label: "Confirmed Orders", id: "billing" },
  { href: "/studio/directory", label: "Directory", id: "directory" },
] as const;

export function CustomerSectionNav({ active }: { active: (typeof views)[number]["id"] }) {
  return (
    <div className="grid gap-4">
      <div>
        <h1>Customer</h1>
        <p className="mt-1 text-sm text-slate-500">Manage customer orders and directory.</p>
      </div>
      <nav aria-label="Customer management" className="flex overflow-x-auto border-b border-line">
        {views.map((view) => (
          <Link
            key={view.id}
            href={view.href}
            aria-current={active === view.id ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${active === view.id ? "border-pool text-pool" : "border-transparent text-ink/55 hover:text-ink"}`}
          >
            {view.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
