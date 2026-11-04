import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassImage } from "@/components/class-image";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { formatWhen, spotsLabel } from "@/lib/format";
import { bookingCounts, getSession, getSettings } from "@/lib/queries";

export const metadata = { title: "Class" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, settings] = await Promise.all([getSession(id), getSettings()]);
  if (!session || session.status !== "scheduled") notFound();
  const counts = await bookingCounts([session.id]);
  const taken = counts.get(session.id) ?? 0;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-8 md:grid-cols-[1.1fr_0.9fr]">
        <ClassImage path={session.imagePath} name={session.title} className="min-h-72 rounded-[2rem]" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-pool">
            {session.kind === "event" ? "Special class" : "Weekly class"}
          </p>
          <h1 className="mt-2 text-4xl text-lagoon">{session.title}</h1>
          <p className="mt-3 text-lg">{formatWhen(session.startsAt, settings.timezone)}</p>
          <p className="mt-2 text-sm text-ink/70">
            {taken >= session.capacity
              ? `Full · ${taken} of ${session.capacity}`
              : `${spotsLabel(taken, session.capacity)} of ${session.capacity}`}
            .{" "}
            {session.creditsRequired === 1
              ? "Uses 1 credit."
              : `Uses ${session.creditsRequired} credits.`}
          </p>
          {session.description ? <p className="mt-6 max-w-prose text-ink/80">{session.description}</p> : null}
          <p className="mt-6 rounded-2xl bg-card px-4 py-3 text-sm text-ink/70">
            Spots are booked at the studio desk. A pack stops when its credits are used up.
          </p>
          <Link href="/classes" className="mt-4 inline-block text-sm font-medium text-pool">
            Back to classes
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
