import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassImage } from "@/components/class-image";
import { Flash, Field, Panel, buttonClass, inputClass, quietButtonClass } from "@/components/ui";
import {
  bookCustomer,
  cancelBooking,
  cancelSession,
  setBookingStatus,
  setCapacity,
  updateEvent,
} from "@/app/studio/actions";
import { dayKey, formatWhen, spotsLabel, timeInputFromIso } from "@/lib/format";
import {
  bookingCounts,
  eligiblePacks,
  getSession,
  getSettings,
  listClassTypes,
  roster,
} from "@/lib/queries";

export const metadata = { title: "Roster" };

export default async function StudioSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSession(id);
  if (!session) notFound();
  const [settings, counts, people, classes] = await Promise.all([
    getSettings(),
    bookingCounts([session.id]),
    roster(session.id),
    session.kind === "event" ? listClassTypes(false) : Promise.resolve([]),
  ]);
  const taken = counts.get(session.id) ?? 0;
  const open = session.status === "scheduled" && taken < session.capacity;
  const packs = open ? await eligiblePacks(session.classTypeId, session.creditsRequired) : [];
  const activePeople = people.filter((person) => person.status !== "cancelled");

  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-pool">
            {session.kind === "event" ? "Event" : "Class"}
            {session.status === "cancelled" ? " · cancelled" : ""}
          </p>
          <h1 className="text-4xl text-lagoon">{session.title}</h1>
          <p className="mt-2 text-sm text-ink/70">
            {formatWhen(session.startsAt, settings.timezone)} · {taken}/{session.capacity} ·{" "}
            {spotsLabel(taken, session.capacity)}
          </p>
        </div>
        <Link href={`/sessions/${session.id}`} className="text-sm font-medium text-pool">
          Public page
        </Link>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <ClassImage path={session.imagePath} name={session.title} className="h-48 max-w-xl rounded-3xl" />

      {session.kind === "event" && session.status === "scheduled" ? (
        <Panel title="Edit event">
          <form action={updateEvent} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={session.id} />
            <Field label="Title">
              <input name="title" required defaultValue={session.title} className={inputClass} />
            </Field>
            <Field label="Class">
              <select name="class_type_id" defaultValue={session.classTypeId} className={inputClass}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" required defaultValue={dayKey(session.startsAt, settings.timezone)} className={inputClass} />
            </Field>
            <Field label="Credits">
              <input name="credits_required" type="number" min={1} max={20} defaultValue={session.creditsRequired} required className={inputClass} />
            </Field>
            <Field label="Start">
              <input name="start_time" type="time" required defaultValue={timeInputFromIso(session.startsAt, settings.timezone)} className={inputClass} />
            </Field>
            <Field label="End">
              <input name="end_time" type="time" required defaultValue={timeInputFromIso(session.endsAt, settings.timezone)} className={inputClass} />
            </Field>
            <Field label="Spots">
              <input name="capacity" type="number" min={1} max={100} defaultValue={session.capacity} required className={inputClass} />
            </Field>
            <Field label="Replace image">
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} defaultValue={session.ownDescription ?? ""} className={inputClass} />
            </Field>
            <button className={buttonClass}>Save event</button>
          </form>
        </Panel>
      ) : null}

      {session.kind === "regular" && session.status === "scheduled" ? (
        <Panel title="This date only">
          <p className="mb-4 text-sm text-ink/70">
            {session.held
              ? "This date was edited on its own, so the weekly time will not overwrite it."
              : "Changing the spots here keeps this date as edited."}
          </p>
          <form action={setCapacity} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={session.id} />
            <Field label="Spots">
              <input name="capacity" type="number" min={1} max={100} defaultValue={session.capacity} required className={inputClass} />
            </Field>
            <button className={buttonClass}>Save spots</button>
          </form>
        </Panel>
      ) : null}

      <Panel title="Roster">
        {session.status === "scheduled" && open ? (
          packs.length === 0 ? (
            <p className="mb-4 text-sm text-ink/70">
              Nobody has credits left for this class. A pack that is used up cannot be booked.
            </p>
          ) : (
            <form action={bookCustomer} className="mb-6 flex flex-wrap items-end gap-3">
              <input type="hidden" name="session_id" value={session.id} />
              <Field label="Book from a pack">
                <select name="customer_package_id" required className={`${inputClass} min-w-72`}>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.customerName} · {pack.packageName} · {pack.creditsLeft} left
                    </option>
                  ))}
                </select>
              </Field>
              <button className={buttonClass}>Book into class</button>
            </form>
          )
        ) : (
          <p className="mb-4 text-sm text-ink/70">
            {session.status === "cancelled" ? "This session is cancelled." : "This class is full."}
          </p>
        )}
        <ul className="grid gap-3">
          {activePeople.length === 0 ? (
            <li className="text-sm text-ink/70">No one is booked.</li>
          ) : (
            activePeople.map((person) => (
              <li key={person.id} className="rounded-2xl border border-line px-4 py-3">
                <p className="font-medium">{person.customerName}</p>
                <p className="text-sm text-ink/70">
                  {person.packageName} · {person.status} · {person.creditsLeft}{" "}
                  {person.creditsLeft === 1 ? "credit" : "credits"} left on the pack
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {person.status !== "attended" ? (
                    <form action={setBookingStatus}>
                      <input type="hidden" name="session_id" value={session.id} />
                      <input type="hidden" name="booking_id" value={person.id} />
                      <input type="hidden" name="status" value="attended" />
                      <button className={quietButtonClass}>Attended</button>
                    </form>
                  ) : null}
                  {person.status !== "no_show" ? (
                    <form action={setBookingStatus}>
                      <input type="hidden" name="session_id" value={session.id} />
                      <input type="hidden" name="booking_id" value={person.id} />
                      <input type="hidden" name="status" value="no_show" />
                      <button className={quietButtonClass}>No-show</button>
                    </form>
                  ) : null}
                  <form action={cancelBooking}>
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="booking_id" value={person.id} />
                    <button className={quietButtonClass}>Cancel booking</button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </Panel>

      {session.status === "scheduled" ? (
        <form action={cancelSession}>
          <input type="hidden" name="id" value={session.id} />
          <button className="text-sm font-medium text-coral">
            Cancel this date and return every credit
          </button>
        </form>
      ) : null}
    </main>
  );
}
