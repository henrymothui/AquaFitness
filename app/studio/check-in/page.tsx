import { Flash } from "@/components/ui";
import { CheckInManagement } from "@/components/check-in-management";
import { getCurrentAccount } from "@/lib/auth";
import { customerCreditBalances, getSettings, listAllSessions, listCustomers, rostersForSessions } from "@/lib/queries";

export const metadata = { title: "Check-in management" };

const COURSE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; course?: string }>;
}) {
  const [query, settings, sessions, account] = await Promise.all([
    searchParams,
    getSettings(),
    listAllSessions(),
    getCurrentAccount(),
  ]);
  const visibleSessions = account?.role === "coach"
    ? sessions.filter((session) => session.coachId === account.id)
    : sessions;
  const requestedCourse = COURSE_ID.test(query.course ?? "") ? query.course ?? "" : "";
  const matchedCourse = visibleSessions.some((session) => session.id === requestedCourse) ? requestedCourse : "";
  const courseId = matchedCourse || (account?.role === "coach" && visibleSessions.length === 1 ? visibleSessions[0].id : "");
  const participants = courseId ? await rostersForSessions([courseId]) : [];
  const clients = account?.role === "admin" ? await listCustomers() : [];
  const balances = account?.role === "admin" ? await customerCreditBalances(clients.map((client) => client.id)) : new Map<string, number>();

  return (
    <main className="grid w-full gap-4 sm:gap-5">
      <div>
        <h1>Operations</h1>
        <p className="mt-1 text-sm text-slate-500">
          {account?.role === "coach"
            ? "Check in the courses assigned to you."
            : "Select a course to check clients in."}
        </p>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <CheckInManagement
        sessions={visibleSessions}
        participants={participants}
        courseId={courseId}
        timezone={settings.timezone}
        assignedOnly={account?.role === "coach"}
        canAddClients={account?.role === "admin"}
        clients={clients.map((client) => ({
          id: client.id,
          name: client.full_name,
          credits: balances.get(client.id) ?? 0,
        }))}
      />
    </main>
  );
}
