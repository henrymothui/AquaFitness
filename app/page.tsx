import Image from "next/image";
import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { formatMoney, formatTime } from "@/lib/format";
import { getI18n } from "@/lib/i18n";
import { bookingCounts, getSettings, listPackages, listUpcoming } from "@/lib/queries";

const offerImages = ["/brand/banner.jpg", "/brand/pool-class.jpg", "/brand/hcmc-skyline.jpg"];

async function loadHome() {
  try {
    const settings = await getSettings();
    const [sessions, packages] = await Promise.all([listUpcoming(4), listPackages(false)]);
    const counts = await bookingCounts(sessions.map((session) => session.id));
    return { settings, sessions, packages, counts };
  } catch {
    return { settings: null, sessions: [], packages: [], counts: new Map<string, number>() };
  }
}

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.home.metaTitle, description: t.home.metaDescription };
}

export default async function HomePage() {
  const { t } = await getI18n();
  const { settings, sessions, packages, counts } = await loadHome();
  const copy = t.home;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative min-h-[78vh] overflow-hidden bg-[#d5d5d5] text-white">
          <Image
            src="/brand/banner.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_40%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,24,40,0.78)_0%,rgba(6,24,40,0.28)_48%,rgba(6,24,40,0.08)_100%)]" />
          <div className="relative mx-auto flex min-h-[78vh] w-full max-w-7xl flex-col justify-end px-6 pb-16 pt-20 md:pb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">{copy.heroKicker}</p>
            <h1 className="mt-3 font-display text-[18vw] font-semibold uppercase leading-[0.82] tracking-wide sm:text-8xl md:text-9xl">
              <span className="text-[#ff2a2a]">{copy.heroA}</span>
              <br />
              {copy.heroB}
            </h1>
            <p className="mt-4 max-w-xl font-display text-2xl uppercase tracking-wide text-white/90 md:text-3xl">
              {copy.heroSub}
            </p>
            <div className="mt-8">
              <Link
                href="/schedule"
                className="inline-flex rounded-full bg-[#e10600] px-8 py-3 font-display text-base uppercase tracking-[0.16em] text-white hover:bg-[#c10500]"
              >
                {copy.trial}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:py-20">
          <p className="font-display text-4xl uppercase leading-[0.95] md:text-5xl">{copy.lead}</p>
          <ul className="grid gap-6">
            {copy.points.map((point) => (
              <li key={point.title} className="border-t border-black/10 pt-4">
                <p className="font-display text-2xl uppercase tracking-wide">{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-black/65">{point.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#f3f3f3]">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e10600]">{copy.whyKicker}</p>
            <h2 className="mt-3 max-w-3xl font-display text-5xl uppercase leading-[0.92] md:text-6xl">{copy.whyTitle}</h2>
            <ul className="mt-10 grid gap-px bg-black/10 md:grid-cols-2">
              {copy.why.map((item) => (
                <li key={item.title} className="bg-[#f3f3f3] p-6 md:p-8">
                  <h3 className="font-display text-3xl uppercase leading-none">{item.title}</h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-black/70">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e10600]">{copy.offerKicker}</p>
              <h2 className="mt-3 font-display text-5xl uppercase leading-[0.92] md:text-6xl">{copy.offerTitle}</h2>
            </div>
            <Link href="/classes" className="hidden text-sm font-semibold uppercase tracking-[0.14em] underline md:inline">
              {copy.offerCta}
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {copy.offers.map((offer, index) => (
              <li key={offer.title} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd]">
                  <Image src={offerImages[index]} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
                </div>
                <h3 className="mt-4 font-display text-3xl uppercase">{offer.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/65">{offer.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-black/10">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e10600]">{copy.weekKicker}</p>
              <h2 className="mt-3 font-display text-5xl uppercase">{copy.weekTitle}</h2>
              <Link href="/schedule" className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.14em] underline">
                {copy.weekCta}
              </Link>
            </div>
            <ul className="divide-y divide-black/10 border-y border-black/10">
              {sessions.length === 0 ? (
                <li className="py-4 text-sm text-black/60">{copy.weekEmpty}</li>
              ) : (
                sessions.map((session) => {
                  const taken = counts.get(session.id) ?? 0;
                  const left = Math.max(session.capacity - taken, 0);
                  return (
                    <li key={session.id}>
                      <Link href={`/sessions/${session.id}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-[#e10600]">
                        <span>
                          <span className="block font-display text-2xl uppercase">{session.title}</span>
                          <span className="text-sm text-black/55">
                            {settings ? formatTime(session.startsAt, settings.timezone) : ""}
                          </span>
                        </span>
                        <span className="text-sm">{left}</span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e10600]">{copy.priceKicker}</p>
          <h2 className="mt-3 font-display text-5xl uppercase md:text-6xl">{copy.priceTitle}</h2>
          {packages.length === 0 ? (
            <p className="mt-6 max-w-xl text-sm leading-6 text-black/65">{copy.priceEmpty}</p>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {packages.slice(0, 3).map((pack) => (
                <li key={pack.id} className="border border-black/10 p-6">
                  <p className="font-display text-3xl uppercase">{pack.name}</p>
                  <p className="mt-4 font-display text-4xl">{formatMoney(pack.price_cents)}</p>
                  <p className="mt-2 text-sm text-black/60">
                    {pack.credit_count} {pack.credit_count === 1 ? copy.credit : copy.credits}
                    {pack.validity_days ? ` · ${copy.valid} ${pack.validity_days} ${copy.days}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/price" className="mt-8 inline-block text-sm font-semibold uppercase tracking-[0.14em] underline">
            {copy.priceCta}
          </Link>
        </section>

        <section className="relative min-h-[28rem] overflow-hidden bg-black text-white">
          <Image src="/brand/hcmc-skyline.jpg" alt="" fill sizes="100vw" className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
          <div className="relative mx-auto flex min-h-[28rem] w-full max-w-7xl flex-col justify-end px-6 py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">{copy.locKicker}</p>
            <h2 className="mt-3 font-display text-6xl uppercase leading-[0.9] md:text-7xl">{copy.locTitle}</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/80">{copy.locBody}</p>
            <Link href="/locations" className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] underline">
              {copy.locCta}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
