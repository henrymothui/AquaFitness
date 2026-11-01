import Link from "next/link";
import { ClassImage } from "@/components/class-image";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { createClass } from "@/app/studio/actions";
import { listClassTypes } from "@/lib/queries";

export const metadata = { title: "Classes" };

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const classes = await listClassTypes(true);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-4xl text-lagoon">Classes</h1>
        <p className="mt-2 text-sm text-ink/70">A class type is the template. Weekly times turn it into dates.</p>
      </div>
      <Flash error={params.error} notice={params.notice} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="New class">
          <form action={createClass} className="grid gap-4">
            <Field label="Name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minutes" hint="15 to 240">
                <input name="duration_minutes" type="number" min={15} max={240} defaultValue={45} required className={inputClass} />
              </Field>
              <Field label="Spots" hint="Starts at 10">
                <input name="default_capacity" type="number" min={1} max={100} defaultValue={10} required className={inputClass} />
              </Field>
            </div>
            <Field label="Reference image">
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
            <button className={buttonClass}>Save class</button>
          </form>
        </Panel>
        <ul className="grid gap-3">
          {classes.length === 0 ? (
            <li className="text-sm text-ink/70">No classes yet.</li>
          ) : (
            classes.map((item) => (
              <li key={item.id}>
                <Link href={`/studio/classes/${item.id}`} className="flex gap-4 rounded-3xl border border-line bg-card p-3 hover:border-pool">
                  <ClassImage path={item.image_path} name={item.name} className="h-16 w-16 rounded-2xl" />
                  <span>
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-sm text-ink/70">
                      {item.duration_minutes} min · {item.default_capacity} spots
                      {item.active ? "" : " · hidden"}
                    </span>
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
