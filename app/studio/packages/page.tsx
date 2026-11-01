import Link from "next/link";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { createPackage } from "@/app/studio/actions";
import { formatMoney } from "@/lib/format";
import { listClassTypes, listPackages } from "@/lib/queries";

export const metadata = { title: "Packages" };

export default async function PackagesStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const [packages, classes] = await Promise.all([listPackages(true), listClassTypes(true)]);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-4xl text-lagoon">Packages</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          A 10-class pack gives 10 credits. Booking stops when those credits are used. Leave every
          class unchecked to cover the whole timetable.
        </p>
      </div>
      <Flash error={params.error} notice={params.notice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New package">
          <form action={createPackage} className="grid gap-4">
            <Field label="Name">
              <input name="name" required className={inputClass} placeholder="10 class pack" />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={2} className={inputClass} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Credits">
                <input name="credit_count" type="number" min={1} max={200} defaultValue={10} required className={inputClass} />
              </Field>
              <Field label="Price (SGD)">
                <input name="price" type="number" min={0} step="0.01" required className={inputClass} />
              </Field>
              <Field label="Valid days" hint="Optional">
                <input name="validity_days" type="number" min={1} className={inputClass} />
              </Field>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Covers</legend>
              <div className="mt-2 grid gap-2">
                {classes.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="class_type_ids" value={item.id} />
                    {item.name}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/60">Leave unchecked to cover every class.</p>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
            <button className={buttonClass}>Save package</button>
          </form>
        </Panel>
        <ul className="grid gap-3">
          {packages.map((pack) => (
            <li key={pack.id}>
              <Link href={`/studio/packages/${pack.id}`} className="block rounded-3xl border border-line bg-card p-4 hover:border-pool">
                <span className="font-medium">{pack.name}</span>
                <span className="mt-1 block text-sm text-ink/70">
                  {pack.credit_count} credits · {formatMoney(pack.price_cents)}
                  {pack.active ? "" : " · hidden"}
                </span>
                <span className="mt-1 block text-sm text-ink/60">
                  {pack.applies_to_all ? "All classes" : pack.classNames.join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
