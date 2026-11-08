import { getCurrentAccount } from "@/lib/auth";
import { getSettings, listAllSessions, rostersForSessions } from "@/lib/queries";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function formatInZone(value: string, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, ...options }).format(new Date(value));
}

export async function GET() {
  const account = await getCurrentAccount();
  if (!account || (account.role !== "admin" && account.role !== "coach")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [settings, sessions] = await Promise.all([getSettings(), listAllSessions()]);
  const visibleSessions = account.role === "coach"
    ? sessions.filter((session) => session.coachId === account.id)
    : sessions;
  const participants = await rostersForSessions(visibleSessions.map((session) => session.id));
  const sessionById = new Map(visibleSessions.map((session) => [session.id, session]));
  const timezone = settings.timezone;

  const rows = participants.flatMap((person) => {
    const session = sessionById.get(person.sessionId);
    if (!session) return [];
    const startsAt = new Date(session.startsAt).getTime();
    return [{
      sort: `${startsAt.toString().padStart(16, "0")}|${person.customerName}`,
      values: [
        person.customerName,
        person.customerEmail,
        session.title,
        session.classTypeName,
        formatInZone(session.startsAt, timezone, { year: "numeric", month: "2-digit", day: "2-digit" }),
        new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(new Date(session.startsAt)),
        session.instructor ?? "",
        session.location ?? "",
        person.status.replaceAll("_", " "),
        person.statusSetBy ?? "",
        person.statusSetAt
          ? new Intl.DateTimeFormat("en", { timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(person.statusSetAt))
          : "",
      ],
    }];
  }).sort((a, b) => a.sort.localeCompare(b.sort));

  const headings = ["Client", "Email", "Course", "Course type", "Date", "Time", "Coach", "Location", "Check-in status", "Recorded by", "Recorded at"];
  const csv = `\uFEFF${[headings, ...rows.map((row) => row.values)].map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
  const date = formatInZone(new Date().toISOString(), timezone, { year: "numeric", month: "2-digit", day: "2-digit" });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="course-check-in-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
