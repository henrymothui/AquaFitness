import { Flash } from "@/components/ui";
import { CheckInManagement } from "@/components/check-in-management";
import { getSettings, listAllSessions, rostersForSessions } from "@/lib/queries";

export const metadata = { title: "Check-in management" };

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [query, settings, sessions] = await Promise.all([
    searchParams,
    getSettings(),
    listAllSessions(),
  ]);
  const participants = await rostersForSessions(sessions.map((session) => session.id));

  return (
    <main className="grid w-full gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Check-in</h1>
          <p className="mt-1 text-sm text-slate-500">Filter courses and manage attendance, absences, and cancellations.</p>
        </div>
        <p className="text-sm text-slate-500">{sessions.length} courses · {participants.length} active bookings</p>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <CheckInManagement sessions={sessions} participants={participants} timezone={settings.timezone} />
    </main>
  );
}
