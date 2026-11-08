import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassImage } from "@/components/class-image";
import { Flash, Field, Panel, buttonClass, inputClass, quietButtonClass } from "@/components/ui";
import {
  bookCustomer,
  cancelBooking,
  cancelSession,
  enrollCustomer,
  setBookingStatus,
  setCapacity,
} from "@/app/studio/actions";
import { formatDay, formatTime, spotsLabel } from "@/lib/format";
import {
  customerCreditBalances,
  eligiblePacks,
  getSession,
  getSettings,
  listCustomers,
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
  const [query, settings, session] = await Promise.all([
    searchParams,
    getSettings(),
    params.then(({ id }) => getSession(id)),
  ]);
  if (!session) notFound();
  const people = await roster(session.id);
  const activePeople = people.filter((person) => person.status !== "cancelled");
  const taken = activePeople.length;
  const open = session.status === "scheduled" && taken < session.capacity;
  const [packs, customers] = open
    ? await Promise.all([eligiblePacks(session.classTypeId, session.creditsRequired), listCustomers()])
    : [[], [] as Awaited<ReturnType<typeof listCustomers>>];
  const balances = open ? await customerCreditBalances(customers.map((customer) => customer.id)) : new Map<string, number>();

  return (
    <main className="grid gap-4 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-pool">
            Class
            {session.status === "cancelled" ? " · cancelled" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-pool/20 bg-[#edf6f9] px-3 py-1.5 text-xs font-semibold text-lagoon sm:px-4 sm:py-2 sm:text-sm">
              <span aria-hidden="true">◷</span>{formatDay(session.startsAt, settings.timezone)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-lagoon px-3 py-1.5 text-xs font-semibold tabular-nums text-white sm:px-4 sm:py-2 sm:text-sm">
              <span aria-hidden="true">◷</span>{formatTime(session.startsAt, settings.timezone)}
            </span>
          </div>
          <h1 className="mt-2 break-words text-2xl text-lagoon sm:text-4xl">{session.title}</h1>
          <p className="mt-2 text-sm text-ink/70">
            {taken}/{session.capacity} · {spotsLabel(taken, session.capacity)}
          </p>
        </div>
        <Link href="/studio/courses/schedule" className="text-sm font-medium text-pool">
          ← Back to schedule
        </Link>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <ClassImage path={session.imagePath} name={session.title} className="h-40 max-w-xl rounded-2xl sm:h-48 sm:rounded-3xl" />

      {session.status === "scheduled" ? (
        <Panel title="This date only">
          <p className="mb-4 text-sm text-ink/70">
            {session.held
              ? "This date was edited on its own."
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
          <div className="mb-6 grid gap-4">
            {customers.length === 0 ? (
              <p className="text-sm text-ink/70">Add a customer in the directory before placing anyone on this course.</p>
            ) : (
              <form action={enrollCustomer} className="flex w-full flex-wrap items-end gap-3">
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="return_to" value={`/studio/courses/schedule/${session.id}`} />
                <Field label="Add a client" hint={`Uses ${session.creditsRequired} credit${session.creditsRequired === 1 ? "" : "s"}. The client does not need an account. This is logged.`}>
                  <select name="customer_id" required className={`${inputClass} w-full min-w-0 sm:min-w-72`}>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} · {balances.get(customer.id) ?? 0} credits
                      </option>
                    ))}
                  </select>
                </Field>
                <button className={buttonClass}>Add to course</button>
              </form>
            )}
            {packs.length === 0 ? (
              <p className="text-sm text-ink/70">
                Nobody has a specific pack with credits left. Add credits from the directory, then add the client above.
              </p>
            ) : (
              <form action={bookCustomer} className="flex w-full flex-wrap items-end gap-3">
                <input type="hidden" name="session_id" value={session.id} />
                <Field label="Or book from a pack">
                  <select name="customer_package_id" required className={`${inputClass} w-full min-w-0 sm:min-w-72`}>
                    {packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.customerName} · {pack.packageName} · {pack.creditsLeft} left
                      </option>
                    ))}
                  </select>
                </Field>
                <button className={buttonClass}>Book into class</button>
              </form>
            )}
          </div>
        ) : (
          <p className="mb-4 text-sm text-ink/70">
            {session.status === "cancelled" ? "This session is cancelled." : "This class is full."}
          </p>
        )}
        <ul className="divide-y divide-line rounded-xl border border-line">
          {activePeople.length === 0 ? (
            <li className="px-4 py-5 text-sm text-ink/70">No one is booked.</li>
          ) : (
            activePeople.map((person) => (
              <li key={person.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{person.customerName}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {person.packageName} · {person.status.replaceAll("_", " ")} · {person.creditsLeft}{" "}
                    {person.creditsLeft === 1 ? "credit" : "credits"} left
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setBookingStatus} className="flex-1 sm:flex-none">
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="booking_id" value={person.id} />
                    <input type="hidden" name="status" value="attended" />
                    <button className={`${person.status === "attended" ? buttonClass : quietButtonClass} w-full sm:w-auto`} aria-pressed={person.status === "attended"}>Check-in</button>
                  </form>
                  <form action={setBookingStatus} className="flex-1 sm:flex-none">
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="booking_id" value={person.id} />
                    <input type="hidden" name="status" value="no_show" />
                    <button className={`${person.status === "no_show" ? buttonClass : quietButtonClass} w-full sm:w-auto`} aria-pressed={person.status === "no_show"}>Absence</button>
                  </form>
                  <form action={cancelBooking} className="flex-1 sm:flex-none">
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="booking_id" value={person.id} />
                    <button className={`${quietButtonClass} w-full sm:w-auto`}>Cancel</button>
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
