import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { quietButtonClass } from "@/components/ui";

export const metadata = { title: "Customer Support" };

const questions = [
  {
    question: "How do I book a class?",
    answer:
      "Open the timetable and pick a session that still has room. A place is held when the studio desk records the booking.",
  },
  {
    question: "Can I use a class pack?",
    answer:
      "Yes. Packs are paid at the desk. Each class you attend uses one credit. A pack ends when the credits are used, or when its validity period ends.",
  },
  {
    question: "What if a class is cancelled?",
    answer:
      "The studio will say so at the desk. If you had a booking, ask the desk to move the credit or the place to another session.",
  },
];

export default function SupportPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">Our Story</p>
        <h1 className="mt-2 text-4xl text-lagoon">Customer Support</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          Questions about a booking, a pack, or a first visit can go to the studio desk.
        </p>

        <article className="mt-8 max-w-2xl rounded-3xl border border-line/80 bg-card p-5 md:p-8">
          <h2 className="text-3xl tracking-wide text-lagoon">Talk to the desk</h2>
          <p className="mt-4 text-sm leading-7 text-ink/80">
            Hydrofit Aquafitness, 12 Vo Truong Toan, Ho Chi Minh City. Come by before or after a
            class, or ask the instructor to pass a note to the desk.
          </p>
          <p className="mt-4 text-sm leading-7 text-ink/80">
            Sample hours: weekdays 6:30–9:00 and 17:30–20:30, Saturday 7:30–10:30. The desk is at
            the pool during those windows.
          </p>
          <Link href="/schedule" className={`${quietButtonClass} mt-6`}>
            See the timetable
          </Link>
        </article>

        <section className="mt-6 max-w-2xl">
          <h2 className="text-3xl text-lagoon">Common questions</h2>
          <ul className="mt-4 grid gap-3">
            {questions.map((item) => (
              <li key={item.question} className="rounded-3xl border border-line/80 bg-card p-5">
                <p className="font-medium tracking-wide text-lagoon">{item.question}</p>
                <p className="mt-2 text-sm leading-7 text-ink/80">{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
