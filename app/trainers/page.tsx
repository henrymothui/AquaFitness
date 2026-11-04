import { ScrollStory, type StoryChapter } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

const frames = [
  { image: "/brand/location-class.jpg", position: "object-[center_32%]" },
  { image: "/brand/class-strength.jpg", position: "object-[center_68%]" },
];

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.trainers.metaTitle };
}

export default async function TrainersPage() {
  const { t } = await getI18n();
  const copy = t.trainers;

  const chapters: StoryChapter[] = copy.people.map((person, index) => {
    const [first, ...rest] = person.name.split(" ");
    const frame = frames[index] ?? frames[0];
    return {
      image: frame.image,
      imageAlt: "",
      position: frame.position,
      line: rest.join(" "),
      word: first,
      eyebrow: person.role,
      paragraphs: index === 0 ? [copy.intro, person.body] : [person.body],
      listLabel: copy.focus,
      list: person.focus,
      cta: index === copy.people.length - 1 ? { href: "/locations", label: copy.book } : undefined,
    };
  });

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory chapters={chapters} />
      </main>
      <SiteFooter />
    </>
  );
}
