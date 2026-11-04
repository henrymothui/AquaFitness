import { ScrollStory } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.home.metaTitle, description: t.home.metaDescription };
}

export default async function HomePage() {
  const { t } = await getI18n();
  const copy = t.home;

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory
          chapters={[
            {
              image: "/brand/banner.jpg",
              imageAlt: "",
              position: "object-[center_42%]",
              line: copy.heroA,
              word: copy.heroB,
              closer: copy.heroSub,
              cta: { href: "/book", label: copy.trial },
            },
            {
              image: "/brand/about-class.jpg",
              imageAlt: copy.whyTitle,
              position: "object-[center_58%]",
              line: copy.whyLine,
              word: copy.whyWord,
              eyebrow: copy.whyKicker,
              points: copy.why,
            },
            {
              image: "/brand/location-class.jpg",
              imageAlt: copy.offerTitle,
              position: "object-[center_40%]",
              line: copy.paceLine,
              word: copy.paceWord,
              eyebrow: copy.offerKicker,
              points: copy.offers,
              cta: { href: "/classes", label: copy.offerCta },
            },
            {
              image: "/brand/about-city.jpg",
              imageAlt: copy.feedbackTitle,
              position: "object-[center_46%]",
              line: copy.voiceLine,
              word: copy.voiceWord,
              eyebrow: copy.feedbackKicker,
              quotes: copy.feedback,
            },
            {
              image: "/brand/studio.jpg",
              imageAlt: copy.locTitle,
              position: "object-[center_62%]",
              line: copy.studioLine,
              word: copy.studioWord,
              closer: copy.locBody,
              cta: { href: "/locations", label: copy.locCta },
            },
          ]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
