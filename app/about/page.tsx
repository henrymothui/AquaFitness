import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.about.metaTitle };
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const copy = t.about;

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <h2 className="font-display text-5xl uppercase leading-[0.92]">{copy.storyTitle}</h2>
          <div className="space-y-4 text-base leading-7 text-black/75">
            {copy.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
        <section className="bg-[#f3f3f3]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-20">
            <h2 className="font-display text-5xl uppercase leading-[0.92]">{copy.gymTitle}</h2>
            <ul className="divide-y divide-black/10 border-y border-black/10">
              {copy.gym.map((item) => (
                <li key={item} className="py-4 text-base leading-7">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <h2 className="max-w-3xl font-display text-5xl uppercase leading-[0.92]">{copy.missionTitle}</h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-black/75">{copy.mission}</p>
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {copy.pillars.map((pillar) => (
              <li key={pillar.title} className="border-t-2 border-black pt-4">
                <h3 className="font-display text-3xl uppercase">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/70">{pillar.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
