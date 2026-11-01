import Link from "next/link";
import { HeroCarousel } from "@/components/hero-carousel";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { SessionCards } from "@/components/session-list";
import { formatMoney } from "@/lib/format";
import { bookingCounts, getSettings, listPackages, listUpcoming } from "@/lib/queries";

export default async function HomePage() {
  const settings = await getSettings();
  const [sessions, packages] = await Promise.all([listUpcoming(6), listPackages(false)]);
  const counts = await bookingCounts(sessions.map((session) => session.id));

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <HeroCarousel />

        <section className="mt-12 grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
          <div>
            <h2 className="text-3xl text-lagoon">Coming up</h2>
            <div className="mt-4">
              <SessionCards sessions={sessions} timeZone={settings.timezone} counts={counts} />
            </div>
            <Link href="/schedule" className="mt-4 inline-block text-sm font-medium text-pool">
              Open the full week
            </Link>
          </div>
          <div>
            <h2 className="text-3xl text-lagoon">Packs</h2>
            <ul className="mt-4 grid gap-3">
              {packages.length === 0 ? (
                <li className="text-sm text-ink/70">Packs will show here once the studio adds them.</li>
              ) : (
                packages.slice(0, 4).map((pack) => (
                  <li key={pack.id} className="rounded-3xl border border-line/80 bg-card p-4">
                    <p className="font-medium tracking-wide">{pack.name}</p>
                    <p className="mt-1 text-sm text-ink/70">
                      {pack.credit_count} classes ·{" "}
                      <span className="font-medium text-tide">{formatMoney(pack.price_cents)}</span>
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
