import { PublicHeader, SiteFooter } from "@/components/site-chrome";

export const metadata = { title: "Customer Review" };

const reviews = [
  {
    name: "Lan P.",
    detail: "Aqua Fit · weekday mornings",
    quote:
      "I started because my knees were tired of the gym. The water takes the impact, and the instructor still keeps the class moving. Ten people is the right size.",
  },
  {
    name: "Minh T.",
    detail: "Class pack · three months",
    quote:
      "I bought a pack at the desk and used it on evening classes. Booking is simple, and I always know how many credits I have left.",
  },
  {
    name: "Claire R.",
    detail: "Saturday morning",
    quote:
      "Saturday is the class I can actually keep. The warm-up is gentle, and the main set still feels like a workout. I leave the pool tired in a good way.",
  },
];

export default function ReviewsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">Our Story</p>
        <h1 className="mt-2 text-4xl text-lagoon">Customer Review</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          A few notes from people who train at Hydrofit. These are sample reviews for the page.
        </p>

        <ul className="mt-8 grid max-w-3xl gap-4">
          {reviews.map((review) => (
            <li key={review.name} className="rounded-3xl border border-line/80 bg-card p-5 md:p-8">
              <p className="text-sm leading-7 text-ink/80">“{review.quote}”</p>
              <p className="mt-4 font-medium tracking-wide text-lagoon">{review.name}</p>
              <p className="mt-1 text-xs text-ink/60">{review.detail}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
