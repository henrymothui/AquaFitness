import { ScrollStory } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=106.7410311%2C10.8004768%2C106.7550311%2C10.8104768&layer=mapnik&marker=10.8054768%2C106.7480311";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.locations.metaTitle };
}

export default async function LocationsPage() {
  const { t } = await getI18n();
  const copy = t.locations;
  const address = `${copy.street}, ${copy.city}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory
          chapters={[
            {
              image: "/brand/studio.jpg",
              imageAlt: copy.name,
              position: "object-[center_62%]",
              line: copy.visitLine,
              word: copy.visitWord,
              eyebrow: copy.kicker,
              paragraphs: [copy.intro, `${copy.name}. ${address}. ${copy.about}`, `${copy.hoursTitle}: ${copy.hours}`],
              cta: { href: directions, label: copy.directions, external: true },
              aside: (
                <p className="text-sm leading-6 text-black/70">
                  <a href={copy.phoneHref} className="underline">
                    {copy.phone}
                  </a>
                  <span className="text-black/25"> · </span>
                  <a href={`mailto:${copy.email}`} className="underline">
                    {copy.email}
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
                {copy.mapNote}
              </a>
            </figcaption>
          </figure>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
