import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { WeekBoard } from "@/components/session-list";
import { addDays, mondayOf, todayISO } from "@/lib/dates";
import { bookingCounts, getSettings, listSessionsBetween } from "@/lib/queries";
import { weekBounds } from "@/lib/dates";

export const metadata = { title: "Week" };

function weekStart(value: string | undefined, timeZone: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return mondayOf(value);
  return mondayOf(todayISO(timeZone));
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const start = weekStart(params.week, settings.timezone);
  const bounds = weekBounds(start, settings.timezone);
  const sessions = await listSessionsBetween(bounds.from, bounds.to);
  const counts = await bookingCounts(sessions.map((session) => session.id));
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const previous = addDays(start, -7);
  const next = addDays(start, 7);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl text-lagoon">The week</h1>
            <p className="mt-2 text-sm text-ink/70">Times in {settings.timezone}. Each class shows spots left.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link href={`/schedule?week=${previous}`} className="rounded-full border border-line bg-card px-3 py-1.5">
              Previous
            </Link>
            <Link href="/schedule" className="rounded-full border border-line bg-card px-3 py-1.5">
              This week
            </Link>
            <Link href={`/schedule?week=${next}`} className="rounded-full border border-line bg-card px-3 py-1.5">
              Next
            </Link>
          </div>
        </div>
        <div className="mt-8">
          <WeekBoard days={days} sessions={sessions} timeZone={settings.timezone} counts={counts} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
