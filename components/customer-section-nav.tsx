import Link from "next/link";

const views = [
  { href: "/studio/pending-orders", label: "Pending", fullLabel: "Pending Orders", id: "orders" },
  { href: "/studio/confirmed-orders", label: "Confirmed", fullLabel: "Confirmed Orders", id: "billing" },
  { href: "/studio/directory", label: "Directory", fullLabel: "Directory", id: "directory" },
] as const;

export function CustomerSectionNav({ active }: { active: (typeof views)[number]["id"] }) {
  return (
    <div className="grid gap-3 sm:gap-4">
      <div>
        <h1>Customer</h1>
        <p className="mt-1 text-sm text-slate-500">Manage customer orders and directory.</p>
      </div>
      <nav aria-label="Customer management" className="-mx-0.5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 md:mx-0 md:flex md:gap-0 md:overflow-x-auto md:rounded-none md:border-b md:border-line md:bg-transparent md:p-0">
        {views.map((view) => {
          const on = active === view.id;
          return (
            <Link
              key={view.id}
              href={view.href}
              aria-current={on ? "page" : undefined}
              className={`truncate rounded-lg px-1.5 py-2 text-center text-xs font-semibold transition md:shrink-0 md:rounded-none md:border-b-2 md:px-4 md:py-3 md:text-sm ${on ? "bg-white text-[#155b78] shadow-sm md:border-pool md:bg-transparent md:text-pool md:shadow-none" : "text-ink/55 md:border-transparent md:hover:text-ink"}`}
            >
              <span className="md:hidden">{view.label}</span>
              <span className="hidden md:inline">{view.fullLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
