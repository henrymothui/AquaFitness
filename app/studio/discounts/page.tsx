import Link from "next/link";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { createDiscount } from "@/app/studio/actions";
import { formatMoney } from "@/lib/format";
import { listDiscounts, listPackages } from "@/lib/queries";

export const metadata = { title: "Discounts" };

function discountLabel(kind: string, amount: number) {
  return kind === "percent" ? `${amount}% off` : `${formatMoney(amount)} off`;
}

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const [discounts, packages] = await Promise.all([listDiscounts(true), listPackages(true)]);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-4xl text-lagoon">Discounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          A discount changes the price you record. It does not change how many credits the customer
          receives.
        </p>
      </div>
      <Flash error={params.error} notice={params.notice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New discount">
          <form action={createDiscount} className="grid gap-4">
            <Field label="Name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Code" hint="Optional. Stored in capitals.">
              <input name="code" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="kind" className={inputClass} defaultValue="percent">
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>
              <Field label="Amount" hint="10 means 10% or $10">
                <input name="amount" required className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input name="starts_on" type="date" className={inputClass} />
              </Field>
              <Field label="Ends">
                <input name="ends_on" type="date" className={inputClass} />
              </Field>
            </div>
            <Field label="Redemption cap" hint="Optional">
              <input name="max_redemptions" type="number" min={1} className={inputClass} />
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">Applies to</legend>
              <div className="mt-2 grid gap-2">
                {packages.map((pack) => (
                  <label key={pack.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="package_ids" value={pack.id} />
                    {pack.name}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/60">Leave unchecked to apply to every package.</p>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
            <button className={buttonClass}>Save discount</button>
          </form>
        </Panel>
        <ul className="grid gap-3">
          {discounts.map((discount) => (
            <li key={discount.id}>
              <Link href={`/studio/discounts/${discount.id}`} className="block rounded-3xl border border-line bg-card p-4 hover:border-pool">
                <span className="font-medium">{discount.name}</span>
                <span className="mt-1 block text-sm text-ink/70">
                  {discountLabel(discount.kind, discount.amount)}
                  {discount.code ? ` · ${discount.code}` : ""}
                  {discount.active ? "" : " · hidden"}
                  {` · used ${discount.redemption_count}`}
                  {discount.max_redemptions ? `/${discount.max_redemptions}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
