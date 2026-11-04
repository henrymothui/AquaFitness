import Link from "next/link";
import { ClassImage } from "@/components/class-image";
import { formatTime, spotsLabel } from "@/lib/format";
import type { SessionView } from "@/lib/queries";

export function SessionCards({
  sessions,
  timeZone,
  counts,
  hrefBase = "/sessions",
}: {
  sessions: SessionView[];
  timeZone: string;
  counts: Map<string, number>;
  hrefBase?: string;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-ink/70">Nothing on the schedule yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {sessions.map((session) => {
        const taken = counts.get(session.id) ?? 0;
        return (
          <li key={session.id}>
            <Link
              href={`${hrefBase}/${session.id}`}
              className="flex gap-4 rounded-3xl border border-line/80 bg-card p-3 transition hover:-translate-y-0.5 hover:border-pool/50"
            >
              <ClassImage
                path={session.imagePath}
                name={session.title}
                className="h-20 w-20 shrink-0 rounded-2xl"
              />
              <span className="min-w-0">
                <span className="block font-medium">{session.title}</span>
                <span className="mt-1 block text-sm text-ink/70">
                  {formatTime(session.startsAt, timeZone)}
                  {session.kind === "event" ? " · Event" : ""}
                  {session.creditsRequired > 1 ? ` · ${session.creditsRequired} credits` : ""}
                </span>
                <span className="mt-2 inline-flex rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium tracking-wide text-tide">
                  {spotsLabel(taken, session.capacity)} · {session.capacity} max
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
