import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassImage } from "@/components/class-image";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { formatWhen } from "@/lib/format";
import { bookingCounts, getSession, getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.session.metaTitle };
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t } = await getI18n();
  const copy = t.publicPages.session;
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
            {copy.weekly}
          </p>
          <h1 className="mt-2 text-4xl text-lagoon">{session.title}</h1>
          <p className="mt-3 text-lg">{formatWhen(session.startsAt, settings.timezone, locale)}</p>
          <p className="mt-2 text-sm text-ink/70">
            {taken >= session.capacity
              ? `${copy.full} · ${taken} ${copy.of} ${session.capacity}`
              : `${session.capacity - taken} ${copy.spots} ${copy.of} ${session.capacity}`}
            .{" "}
            {session.creditsRequired === 0
              ? copy.noCredit
              : session.creditsRequired === 1
              ? copy.usesCredit
              : copy.usesCredits.replace("{count}", String(session.creditsRequired))}
          </p>
          {session.description ? <p className="mt-6 max-w-prose text-ink/80">{session.description}</p> : null}
          <p className="mt-6 rounded-2xl bg-card px-4 py-3 text-sm text-ink/70">
            {copy.bookingInfo}
          </p>
          <Link href="/classes" className="mt-4 inline-block text-sm font-medium text-pool">
            {copy.back}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
