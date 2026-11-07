import Link from "next/link";
import { ClassImage } from "@/components/class-image";
import type { SessionView } from "@/lib/queries";
import type { Dictionary, Locale } from "@/lib/i18n";

export function SessionCards({
  sessions,
  timeZone,
  counts,
  hrefBase = "/classes",
  copy,
  locale,
}: {
  sessions: SessionView[];
  timeZone: string;
  counts: Map<string, number>;
  hrefBase?: string;
  copy: Dictionary["publicPages"]["booking"];
  locale: Locale;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-ink/70">{copy.scheduleEmpty}</p>;
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
                  {new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(session.startsAt))}
                  {session.creditsRequired > 1 ? ` · ${session.creditsRequired} ${copy.credits}` : session.creditsRequired === 1 ? ` · 1 ${copy.credit}` : ""}
                </span>
                <span className="mt-2 inline-flex rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium tracking-wide text-tide">
                  {taken >= session.capacity ? copy.full : `${session.capacity - taken} ${session.capacity - taken === 1 ? copy.spotLeft : copy.spotsLeft}`} · {session.capacity} {locale === "vi" ? "tối đa" : "max"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
