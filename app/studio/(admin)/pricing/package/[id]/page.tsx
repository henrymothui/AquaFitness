import { notFound } from "next/navigation";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { updatePackage } from "@/app/studio/actions";
import { getPackage, listClassTypes } from "@/lib/queries";

export const metadata = { title: "Edit package" };

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [pack, classes] = await Promise.all([getPackage(id), listClassTypes(true)]);
  if (!pack) notFound();

  return (
    <main className="max-w-xl">
      <h1 className="break-words text-2xl text-lagoon sm:text-4xl">{pack.name}</h1>
      <div className="mt-4">
        <Flash error={query.error} notice={query.notice} />
      </div>
      <div className="mt-6">
        <Panel title="Edit package">
          <form action={updatePackage} className="grid gap-4">
            <input type="hidden" name="id" value={pack.id} />
            <Field label="Name">
              <input name="name" required defaultValue={pack.name} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={2} defaultValue={pack.description ?? ""} className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
              <Field label="Credits">
                <input name="credit_count" type="number" min={1} max={200} defaultValue={pack.credit_count} required className={inputClass} />
              </Field>
              <Field label="Price (SGD)">
                <input name="price" type="number" min={0} step="0.01" defaultValue={(pack.price_cents / 100).toFixed(2)} required className={inputClass} />
              </Field>
              <Field label="Valid days">
                <input name="validity_days" type="number" min={1} defaultValue={pack.validity_days ?? ""} className={inputClass} />
              </Field>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Covers</legend>
              <div className="mt-2 grid gap-2">
                {classes.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="class_type_ids"
                      value={item.id}
                      defaultChecked={!pack.applies_to_all && pack.classTypeIds.includes(item.id)}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/60">Leave unchecked to cover every class.</p>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={pack.active} />
              Active
            </label>
            <button className={buttonClass}>Update package</button>
          </form>
        </Panel>
      </div>
    </main>
  );
}
