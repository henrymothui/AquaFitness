import { ScrollStory } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=106.7410311%2C10.8004768%2C106.7550311%2C10.8104768&layer=mapnik&marker=10.8054768%2C106.7480311";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.about.metaTitle };
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const story = t.about;
  const visit = t.locations;
  const address = `${visit.street}, ${visit.city}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory
          chapters={[
            {
              image: "/brand/saigon-skyline-night.jpg",
              imageAlt: story.storyImageAlt,
              position: "object-[16%_34%]",
              line: story.storyLine,
              word: story.storyWord,
              paragraphs: story.story,
              credit: {
                label: "Gurval Le Bouter, CC BY 2.0",
                href: "https://commons.wikimedia.org/wiki/File:Saigon_skyline_night_view.jpg",
              },
            },
            {
              image: "/brand/saigon-city-hall.jpg",
              imageAlt: visit.imageAlt,
              position: "object-[center_45%]",
              line: visit.visitLine,
              word: visit.visitWord,
              eyebrow: visit.kicker,
              paragraphs: [visit.intro, `${visit.name}. ${address}. ${visit.about}`, `${visit.hoursTitle}: ${visit.hours}`],
              cta: { href: directions, label: visit.directions, external: true },
              credit: {
                label: "Alexkom000, CC BY 4.0",
                href: "https://commons.wikimedia.org/wiki/File:2024-11-16_Ho_Chi_Minh_City_Hall.jpg",
              },
              aside: (
                <p className="text-sm leading-6 text-black/70">
                  <a href={visit.phoneHref} className="underline">
                    {visit.phone}
                  </a>
                  <span className="text-black/25"> · </span>
                  <a href={`mailto:${visit.email}`} className="underline">
                    {visit.email}
                  </a>
                </p>
              ),
            },
          ]}
        />
        <section className="bg-white">
          <figure className="mx-auto w-full max-w-7xl px-6 pb-16 md:pb-24">
            <div className="min-h-80 overflow-hidden border border-black/10 bg-[#eee]">
              <iframe title={address} src={mapSrc} className="h-80 w-full border-0 md:h-[28rem]" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <figcaption className="mt-2 text-right text-xs text-black/45">
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
                {visit.mapNote}
              </a>
            </figcaption>
          </figure>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
