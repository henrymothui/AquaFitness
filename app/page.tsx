import { ScrollStory } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.home.metaTitle, description: t.home.metaDescription };
}

const reasonFrames = [
  { image: "/brand/class-saturday.jpg", imagePosition: "object-[center_55%]" },
  { image: "/brand/class-fit.jpg", imagePosition: "object-center" },
  { image: "/brand/class-restore.jpg", imagePosition: "object-center" },
  { image: "/brand/class-strength.jpg", imagePosition: "object-[center_62%]" },
  { image: "/brand/location-spa.jpg", imagePosition: "object-center" },
];

export default async function HomePage() {
  const { t } = await getI18n();
  const copy = t.home;
  const water = t.about;

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory
          snap
          chapters={[
            {
              image: "/brand/banner.jpg",
              imageAlt: "",
              position: "object-[center_42%]",
              line: "",
              word: copy.heroWord,
              closer: copy.heroSub,
              featured: true,
            },
            {
              line: water.waterLine,
              word: water.waterWord,
              eyebrow: copy.whyKicker,
              paragraphs: water.aqua,
              points: copy.why.map((point, index) => ({
                ...point,
                image: reasonFrames[index]?.image,
                imageAlt: point.title,
                imagePosition: reasonFrames[index]?.imagePosition,
              })),
            },
            {
              line: copy.voiceLine,
              word: copy.voiceWord,
              eyebrow: copy.feedbackKicker,
              quotes: copy.feedback,
            },
          ]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
