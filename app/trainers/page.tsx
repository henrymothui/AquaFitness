import Link from "next/link";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.trainers.metaTitle };
}

export default async function TrainersPage() {
  const { t } = await getI18n();
  const copy = t.trainers;

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <p className="max-w-2xl text-base leading-7 text-black/75">{copy.intro}</p>
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {copy.people.map((person) => (
              <li key={person.name} className="border border-black/10">
                <div className="flex h-56 items-end bg-[#111] p-5 text-white">
                  <p className="font-display text-6xl uppercase leading-none">{person.name.slice(0, 1)}</p>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-3xl uppercase leading-none">{person.name}</h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e10600]">{person.role}</p>
                  <p className="mt-4 text-sm leading-6 text-black/75">{person.body}</p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{copy.focus}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {person.focus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/locations"
            className="mt-10 inline-flex rounded-full bg-[#e10600] px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
          >
            {copy.book}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
