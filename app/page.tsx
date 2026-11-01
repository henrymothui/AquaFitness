import Image from "next/image";
import Link from "next/link";
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
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#082f4d_0%,#0e4c73_52%,#1a8aa0_100%)] px-8 py-12 text-white shadow-[0_28px_70px_-36px_rgba(8,47,77,0.85)] md:px-12 md:py-14">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
                Ho Chi Minh City
              </p>
              <h1 className="mt-3 max-w-xl text-5xl uppercase tracking-[0.04em] text-white md:text-6xl">
                Classes in the water, ten at a time.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/80">
                {settings.name} publishes the week, the packs, and the special events. The desk
                books each spot and stops a pack when the credits run out.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/schedule"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-lagoon shadow-sm transition hover:bg-foam"
                >
                  See the week
                </Link>
                <Link
                  href="/packages"
                  className="rounded-full border border-white/35 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  Class packs
                </Link>
              </div>
            </div>
            <Image
              src="/brand/hydrofit-logo.jpg"
              alt="Hydrofit Aquafitness"
              width={720}
              height={720}
              priority
              className="h-44 w-44 shrink-0 rounded-[1.75rem] object-cover shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ring-4 ring-white/25 md:h-52 md:w-52"
            />
          </div>
        </section>

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
