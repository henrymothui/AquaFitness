import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.support.metaTitle };
}

export default async function SupportPage() {
  const { t } = await getI18n();
  const copy = t.publicPages.support;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl text-lagoon">{copy.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">{copy.intro}</p>

        <article className="mt-8 max-w-2xl rounded-3xl border border-line/80 bg-card p-5 md:p-8">
          <h2 className="text-3xl tracking-wide text-lagoon">{copy.desk}</h2>
          <p className="mt-4 text-sm leading-7 text-ink/80">{copy.address}</p>
          <p className="mt-4 text-sm leading-7 text-ink/80">{copy.hours}</p>
        </article>

        <section className="mt-6 max-w-2xl">
          <h2 className="text-3xl text-lagoon">{copy.questionsTitle}</h2>
          <ul className="mt-4 grid gap-3">
            {copy.questions.map((item) => (
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
