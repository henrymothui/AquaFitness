import { PublicHeader, SiteFooter } from "@/components/ui";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">Our Story</p>
        <h1 className="mt-2 text-4xl text-lagoon">About Us</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          Hydrofit is a small aquafitness studio in Ho Chi Minh City. Classes stay in the water,
          and groups stay small.
        </p>

        <article className="mt-8 max-w-2xl rounded-3xl border border-line/80 bg-card p-5 md:p-8">
          <h2 className="text-3xl tracking-wide text-lagoon">Why we started</h2>
          <p className="mt-4 text-sm leading-7 text-ink/80">
            Hydrofit began as a weekly pool class for people who wanted strength and cardio
            without pounding the pavement. The first groups met at 12 Vo Truong Toan. The same
            pool is still home.
          </p>
          <p className="mt-4 text-sm leading-7 text-ink/80">
            A class lasts 45 minutes: warm-up, a main set, and a cool-down. Most groups have no
            more than 10 people, so the instructor can see form and keep the pace comfortable for
            mixed fitness levels.
          </p>

          <h2 className="mt-8 text-3xl tracking-wide text-lagoon">What a week looks like</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/80">
            <li>Morning and evening Aqua Fit through the week.</li>
            <li>A Saturday morning class for people who train on the weekend.</li>
            <li>Special workshops that sit beside the regular timetable.</li>
            <li>Class packs bought at the desk, one credit per class you attend.</li>
          </ul>

          <h2 className="mt-8 text-3xl tracking-wide text-lagoon">Where to find us</h2>
          <p className="mt-4 text-sm leading-7 text-ink/80">
            12 Vo Truong Toan, Ho Chi Minh City. Ask at the studio desk if you are new and want to
            see the pool before your first class.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
