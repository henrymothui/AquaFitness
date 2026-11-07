import { notFound } from "next/navigation";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { recordSale, updateCustomer } from "@/app/studio/actions";
import { creditsLabel, formatMoney, formatWhen } from "@/lib/format";
import {
  customerBookings,
  customerSales,
  getCustomer,
  getSettings,
  listDiscounts,
  listPackages,
} from "@/lib/queries";

export const metadata = { title: "Customer" };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [customer, sales, bookings, packages, discounts, settings] = await Promise.all([
    getCustomer(id),
    customerSales(id),
    customerBookings(id),
    listPackages(false),
    listDiscounts(false),
    getSettings(),
  ]);
  if (!customer) notFound();

  return (
    <main className="grid gap-6">
      <h1 className="text-4xl text-lagoon">{customer.full_name}</h1>
      <Flash error={query.error} notice={query.notice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Details">
          <form action={updateCustomer} className="grid gap-4">
            <input type="hidden" name="id" value={customer.id} />
            <Field label="Name">
              <input name="full_name" required defaultValue={customer.full_name} className={inputClass} />
            </Field>
            <Field label="Title">
              <select name="title" defaultValue={customer.title ?? ""} className={inputClass}>
                <option value="">Select a title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input name="date_of_birth" type="date" defaultValue={customer.date_of_birth ?? ""} className={inputClass} />
            </Field>
            <Field label="Address">
              <textarea name="address" rows={2} defaultValue={customer.address ?? ""} className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" defaultValue={customer.email ?? ""} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={customer.phone ?? ""} className={inputClass} />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={3} defaultValue={customer.notes ?? ""} className={inputClass} />
            </Field>
            <button className={buttonClass}>Save details</button>
          </form>
        </Panel>
        <Panel title="Record a sale">
          {packages.length === 0 ? (
            <p className="text-sm text-ink/70">Create a package before recording a sale.</p>
          ) : (
            <form action={recordSale} className="grid gap-4">
              <input type="hidden" name="customer_id" value={customer.id} />
              <Field label="Package">
                <select name="package_id" required className={inputClass}>
                  {packages.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name} · {pack.credit_count} credits · {formatMoney(pack.price_cents)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Discount">
                <select name="discount_id" className={inputClass} defaultValue="">
                  <option value="">No discount</option>
                  {discounts.map((discount) => (
                    <option key={discount.id} value={discount.id}>
                      {discount.name}
                      {discount.code ? ` · ${discount.code}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Or a code" hint="A code overrides the discount selected above">
                <input name="code" className={inputClass} />
              </Field>
              <button className={buttonClass}>Record sale</button>
            </form>
          )}
        </Panel>
      </div>
      <Panel title="Packages">
        <ul className="grid gap-3">
          {sales.length === 0 ? (
            <li className="text-sm text-ink/70">No sales yet.</li>
          ) : (
            sales.map((sale) => (
              <li key={sale.id} className="rounded-2xl border border-line px-4 py-3">
                <p className="font-medium">{sale.packageName}</p>
                <p className="text-sm text-ink/70">
                  {creditsLabel(sale.creditsUsed, sale.creditsTotal)} · {sale.status} ·{" "}
                  {formatMoney(sale.finalPriceCents)}
                  {sale.discountCents > 0 ? ` after ${formatMoney(sale.discountCents)} off` : ""}
                </p>
                {sale.expiresAt ? (
                  <p className="text-sm text-ink/60">Expires {formatWhen(sale.expiresAt, settings.timezone)}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Panel>
      <Panel title="Recent bookings">
        <ul className="grid gap-2 text-sm">
          {bookings.length === 0 ? (
            <li className="text-ink/70">No bookings yet.</li>
          ) : (
            bookings.map((booking) => (
              <li key={booking.id} className="flex justify-between gap-3">
                <span>
                  {booking.title}
                  {booking.startsAt ? ` · ${formatWhen(booking.startsAt, settings.timezone)}` : ""}
                </span>
                <span className="text-ink/60">{booking.status}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </main>
  );
}
