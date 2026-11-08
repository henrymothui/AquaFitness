import { notFound } from "next/navigation";
import { ClassImage } from "@/components/class-image";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { updateClass } from "@/app/studio/actions";
import { getClassType } from "@/lib/queries";
import { DEFAULT_CLASS_COLOR } from "@/lib/class-colors";
import { ClassColorOptions } from "@/components/class-color-options";

export const metadata = { title: "Edit course type" };

export default async function EditClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const classType = await getClassType(id);
  if (!classType) notFound();

  return (
    <main className="grid max-w-xl gap-4 sm:gap-6">
      <h1 className="break-words text-2xl text-lagoon sm:text-4xl">{classType.name}</h1>
      <Flash error={query.error} notice={query.notice} />
      <ClassImage path={classType.image_path} name={classType.name} className="h-40 rounded-2xl sm:h-48 sm:rounded-3xl" />
      <Panel title="Edit course type">
        <form action={updateClass} className="grid gap-4">
          <input type="hidden" name="id" value={classType.id} />
          <Field label="Name">
            <input name="name" required defaultValue={classType.name} className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea name="description" rows={3} defaultValue={classType.description ?? ""} className={inputClass} />
          </Field>
          <Field label="Schedule color" hint="Used for this course type in the course calendar.">
            <ClassColorOptions value={classType.color ?? DEFAULT_CLASS_COLOR} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (minutes)">
              <input name="duration_minutes" type="number" min={15} max={240} defaultValue={classType.duration_minutes} required className={inputClass} />
            </Field>
            <Field label="Default capacity" hint="Updates future dates you have not edited by hand">
              <input name="default_capacity" type="number" min={1} max={100} defaultValue={classType.default_capacity} required className={inputClass} />
            </Field>
          </div>
          <Field label="Replace course image">
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={classType.active} />
            Available for booking and scheduling. Turning this off clears upcoming dates.
          </label>
          <button className={buttonClass}>Update course type</button>
        </form>
      </Panel>
    </main>
  );
}
