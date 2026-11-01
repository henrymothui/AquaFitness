import Link from "next/link";
import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { createEvent } from "@/app/studio/actions";
import { formatWhen } from "@/lib/format";
import { getSettings, listClassTypes, listEvents } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function StudioEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const [classes, events, settings] = await Promise.all([
    listClassTypes(false),
    listEvents(),
    getSettings(),
  ]);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-4xl text-lagoon">Events</h1>
        <p className="mt-2 text-sm text-ink/70">A special class is one date, with its own picture and spot limit.</p>
      </div>
      <Flash error={params.error} notice={params.notice} />
      <Panel title="New event">
        {classes.length === 0 ? (
          <p className="text-sm text-ink/70">Add an active class first so packs know what this event covers.</p>
        ) : (
          <form action={createEvent} className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input name="title" required className={inputClass} />
            </Field>
            <Field label="Class it belongs to">
              <select name="class_type_id" required className={inputClass}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" required className={inputClass} />
            </Field>
            <Field label="Credits used" hint="Usually 1">
              <input name="credits_required" type="number" min={1} max={20} defaultValue={1} required className={inputClass} />
            </Field>
            <Field label="Start">
              <input name="start_time" type="time" required defaultValue="10:00" className={inputClass} />
            </Field>
            <Field label="End">
              <input name="end_time" type="time" required defaultValue="11:30" className={inputClass} />
            </Field>
            <Field label="Spots">
              <input name="capacity" type="number" min={1} max={100} defaultValue={10} required className={inputClass} />
            </Field>
            <Field label="Image">
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} className={inputClass} />
            </Field>
            <div className="flex items-end">
              <button className={buttonClass}>Save event</button>
            </div>
          </form>
        )}
      </Panel>
      <ul className="grid gap-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link href={`/studio/sessions/${event.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3 hover:border-pool">
              <span className="font-medium">{event.title}</span>
              <span className="mt-1 block text-sm text-ink/70">
                {formatWhen(event.startsAt, settings.timezone)} · {event.capacity} spots
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
