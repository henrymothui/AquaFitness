import Link from "next/link";
import { dayBounds, todayISO } from "@/lib/dates";
import { formatTime, spotsLabel } from "@/lib/format";
import { bookingCounts, getSettings, listSessionsBetween } from "@/lib/queries";

export default async function StudioTodayPage() {
  const settings = await getSettings();
  const today = todayISO(settings.timezone);
  const bounds = dayBounds(today, settings.timezone);
  const sessions = await listSessionsBetween(bounds.from, bounds.to);
  const counts = await bookingCounts(sessions.map((session) => session.id));

  return (
    <main>
      <h1 className="text-4xl text-lagoon">Today</h1>
      <p className="mt-2 text-sm text-ink/70">
        {settings.name} · times in {settings.timezone}. Default class size is {settings.default_capacity}.
      </p>
      <ul className="mt-8 grid gap-3">
        {sessions.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-line bg-card px-4 py-6 text-sm text-ink/70">
            No classes today. Add a weekly time or a special event.
          </li>
        ) : (
          sessions.map((session) => {
            const taken = counts.get(session.id) ?? 0;
            return (
              <li key={session.id}>
                <Link
                  href={`/studio/sessions/${session.id}`}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-line/80 bg-card px-4 py-4 transition hover:-translate-y-0.5 hover:border-pool/50"
                >
                  <span>
                    <span className="block font-medium">{session.title}</span>
                    <span className="text-sm text-ink/70">
                      {formatTime(session.startsAt, settings.timezone)}
                      {session.kind === "event" ? " · Event" : ""}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-tide">
                    {taken}/{session.capacity} · {spotsLabel(taken, session.capacity)}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
