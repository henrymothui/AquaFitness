import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { SessionCards } from "@/components/session-list";
import { bookingCounts, getSettings, listEvents } from "@/lib/queries";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.events.metaTitle };
}

export default async function EventsPage() {
  const { locale, t } = await getI18n();
  const copy = t.publicPages.events;
  const [settings, events] = await Promise.all([getSettings(), listEvents()]);
  const counts = await bookingCounts(events.map((event) => event.id));

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">{copy.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">{copy.intro}</p>
        <div className="mt-8 max-w-2xl">
          <SessionCards sessions={events} timeZone={settings.timezone} counts={counts} copy={t.publicPages.booking} locale={locale} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
