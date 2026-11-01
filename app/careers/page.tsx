import { PublicHeader, SiteFooter } from "@/components/ui";

export const metadata = { title: "Careers" };

const role = {
  title: "Aqua Fit Instructor",
  meta: "Part-time · 12 Vo Truong Toan, Ho Chi Minh City",
  summary:
    "Lead Aqua Fit, a 45-minute pool class for strength, cardio, and mobility. Groups are small, up to 10 people, with morning and evening times through the week and a Saturday morning class.",
};

export default function CareersPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">Careers</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          Hydrofit is hiring a pool instructor for Aqua Fit at the studio in Ho Chi Minh City.
        </p>

        <article className="mt-8 max-w-2xl rounded-3xl border border-line/80 bg-card p-5 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">Open role</p>
          <h2 className="mt-2 text-3xl tracking-wide text-lagoon">{role.title}</h2>
          <p className="mt-2 text-sm text-ink/70">{role.meta}</p>
          <p className="mt-4 text-sm leading-7 text-ink/80">{role.summary}</p>

          <h3 className="mt-8 text-2xl tracking-wide text-lagoon">What you will do</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/80">
            <li>Lead the class in the water, from warm-up through the main set and cool-down.</li>
            <li>Cue form so people of different fitness levels can follow safely.</li>
            <li>Arrive early enough to greet the group and confirm the pool is ready.</li>
            <li>Tell the desk if someone needs a change, or if the class should be adjusted.</li>
          </ul>

          <h3 className="mt-8 text-2xl tracking-wide text-lagoon">What we are looking for</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/80">
            <li>Experience teaching group fitness, ideally in the pool.</li>
            <li>A current water-safety or lifeguard qualification, or a plan to earn one before the first class.</li>
            <li>Clear English. Vietnamese is welcome with the group.</li>
            <li>Comfort teaching a class of up to 10, rather than a large gym floor.</li>
          </ul>

          <h3 className="mt-8 text-2xl tracking-wide text-lagoon">Schedule and pay</h3>
          <p className="mt-3 text-sm leading-7 text-ink/80">
            Weekday mornings and evenings, plus Saturday morning. You do not need every slot. Say
            which times you can cover. Pay is per class, and the rate is set when you are hired.
          </p>

          <h3 className="mt-8 text-2xl tracking-wide text-lagoon">How to apply</h3>
          <p className="mt-3 text-sm leading-7 text-ink/80">
            Come to the studio desk at 12 Vo Truong Toan and ask about the instructor role. Bring
            a short note on the classes you have taught.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
