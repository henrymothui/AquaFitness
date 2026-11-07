import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.reviews.metaTitle };
}

export default async function ReviewsPage() {
  const { t } = await getI18n();
  const copy = t.publicPages.reviews;
  const names = ["Lan P.", "Minh T.", "Claire R."];
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pool">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl text-lagoon">{copy.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">{copy.intro}</p>

        <ul className="mt-8 grid max-w-3xl gap-4">
          {copy.items.map((review, index) => (
            <li key={names[index]} className="rounded-3xl border border-line/80 bg-card p-5 md:p-8">
              <p className="text-sm leading-7 text-ink/80">“{review.quote}”</p>
              <p className="mt-4 font-medium tracking-wide text-lagoon">{names[index]}</p>
              <p className="mt-1 text-xs text-ink/60">{review.detail}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
