import Link from "next/link";
import { Flash, Field, Panel, buttonClass, inputClass, quietButtonClass } from "@/components/ui";
import { createCustomer } from "@/app/studio/actions";
import { listCustomers } from "@/lib/queries";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string }>;
}) {
  const params = await searchParams;
  const customers = await listCustomers(params.q ?? "");

  return (
    <main className="grid gap-6">
      <h1 className="text-4xl text-lagoon">Customers</h1>
      <Flash error={params.error} notice={params.notice} />
      <form className="flex gap-2" action="/studio/customers">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, or phone" className={inputClass} />
        <button className={quietButtonClass}>Search</button>
      </form>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Add a customer">
          <form action={createCustomer} className="grid gap-4">
            <Field label="Name">
              <input name="full_name" required className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="phone" className={inputClass} />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={3} className={inputClass} />
            </Field>
            <button className={buttonClass}>Add customer</button>
          </form>
        </Panel>
        <ul className="grid gap-2">
          {customers.length === 0 ? (
            <li className="text-sm text-ink/70">No customers yet.</li>
          ) : (
            customers.map((customer) => (
              <li key={customer.id}>
                <Link href={`/studio/customers/${customer.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3 hover:border-pool">
                  <span className="font-medium">{customer.full_name}</span>
                  <span className="mt-1 block text-sm text-ink/70">
                    {[customer.email, customer.phone].filter(Boolean).join(" · ") || "No contact details"}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
