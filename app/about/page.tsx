import { ScrollStory } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
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
        <ScrollStory
          chapters={[
            {
              image: "/brand/about-skyline.jpg",
              imageAlt: copy.storyImageAlt,
              position: "object-[center_45%]",
              line: copy.storyLine,
              word: copy.storyWord,
              paragraphs: copy.story,
            },
            {
              image: "/brand/about-spa.jpg",
              imageAlt: copy.aquaImageAlt,
              position: "object-center",
              line: copy.waterLine,
              word: copy.waterWord,
              paragraphs: copy.aqua,
              points: copy.aquaPoints,
            },
            {
              image: "/brand/studio.jpg",
              imageAlt: copy.poolImageAlt,
              position: "object-center",
              line: copy.poolLine,
              word: copy.poolWord,
              closer: copy.closer,
              cta: { href: "/book", label: copy.closerCta },
            },
          ]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
