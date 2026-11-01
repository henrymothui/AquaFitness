import { PublicHeader, SiteFooter } from "@/components/ui";
import { SessionCards } from "@/components/session-list";
import { bookingCounts, getSettings, listEvents } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const [settings, events] = await Promise.all([getSettings(), listEvents()]);
  const counts = await bookingCounts(events.map((event) => event.id));

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">Special classes</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          Workshops and one-off sessions sit beside the weekly timetable. They use the same spot
          limit and the same class packs.
        </p>
        <div className="mt-8 max-w-2xl">
          <SessionCards sessions={events} timeZone={settings.timezone} counts={counts} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
