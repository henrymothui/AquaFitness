import { notFound } from "next/navigation";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { updateDiscount } from "@/app/studio/actions";
import { addDays } from "@/lib/dates";
import { dayKey } from "@/lib/format";
import { getDiscount, getSettings, listPackages } from "@/lib/queries";

export const metadata = { title: "Edit discount" };

export default async function EditDiscountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [discount, packages, settings] = await Promise.all([
    getDiscount(id),
    listPackages(true),
    getSettings(),
  ]);
  if (!discount) notFound();
  const starts = discount.starts_at ? dayKey(discount.starts_at, settings.timezone) : "";
  const ends = discount.ends_at
    ? addDays(dayKey(discount.ends_at, settings.timezone), -1)
    : "";
  const amount =
    discount.kind === "fixed" ? (discount.amount / 100).toFixed(2) : String(discount.amount);

  return (
    <main className="max-w-xl">
      <h1 className="text-4xl text-lagoon">{discount.name}</h1>
      <div className="mt-4">
        <Flash error={query.error} notice={query.notice} />
      </div>
      <div className="mt-6">
        <Panel title="Edit discount">
          <form action={updateDiscount} className="grid gap-4">
            <input type="hidden" name="id" value={discount.id} />
            <Field label="Name">
              <input name="name" required defaultValue={discount.name} className={inputClass} />
            </Field>
            <Field label="Code">
              <input name="code" defaultValue={discount.code ?? ""} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="kind" defaultValue={discount.kind} className={inputClass}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>
              <Field label="Amount" hint="10 means 10% or $10">
                <input name="amount" required defaultValue={amount} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input name="starts_on" type="date" defaultValue={starts} className={inputClass} />
              </Field>
              <Field label="Ends">
                <input name="ends_on" type="date" defaultValue={ends} className={inputClass} />
              </Field>
            </div>
            <Field label="Redemption cap">
              <input name="max_redemptions" type="number" min={1} defaultValue={discount.max_redemptions ?? ""} className={inputClass} />
            </Field>
            <p className="text-sm text-ink/60">Used {discount.redemption_count} times.</p>
            <fieldset>
              <legend className="text-sm font-medium">Applies to</legend>
              <div className="mt-2 grid gap-2">
                {packages.map((pack) => (
                  <label key={pack.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="package_ids"
                      value={pack.id}
                      defaultChecked={!discount.applies_to_all && discount.packageIds.includes(pack.id)}
                    />
                    {pack.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={discount.active} />
              Active
            </label>
            <button className={buttonClass}>Update discount</button>
          </form>
        </Panel>
      </div>
    </main>
  );
}
