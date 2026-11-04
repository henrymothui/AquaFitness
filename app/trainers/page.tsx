import { PageBanner } from "@/components/marketing";
import { ScrollStory, type StoryChapter } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.trainers.metaTitle };
}

export default async function TrainersPage() {
  const { t } = await getI18n();
  const copy = t.trainers;

  const chapters: StoryChapter[] = copy.people.map((person, index) => {
    return {
      line: "",
      word: person.name,
      eyebrow: person.role,
      paragraphs: index === 0 ? [copy.intro, person.body] : [person.body],
      listLabel: copy.focus,
      list: person.focus,
      cta: index === copy.people.length - 1 ? { href: "/about", label: copy.book } : undefined,
    };
  });

  return (
    <>
      <PublicHeader />
      <main>
        <div className="snap-start">
          <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        </div>
        <ScrollStory chapters={chapters} snap heavyTitle />
      </main>
      <SiteFooter />
    </>
  );
}
