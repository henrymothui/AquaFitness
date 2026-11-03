import Image from "next/image";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/ui";
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
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <p className="max-w-2xl text-base leading-7 text-black/75">{copy.intro}</p>
          <article className="mt-10 grid overflow-hidden border border-black/10 md:grid-cols-2">
            <div className="relative min-h-72">
              <Image src="/brand/pool-class.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6 md:p-8">
              <h2 className="font-display text-4xl uppercase leading-none">{copy.name}</h2>
              <p className="mt-4 text-base">{copy.street}</p>
              <p className="text-black/60">{copy.city}</p>
              <p className="mt-4 text-sm leading-6 text-black/70">{copy.about}</p>
              <h3 className="mt-6 font-display text-2xl uppercase">{copy.hoursTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-black/70">{copy.hours}</p>
              <a
                href={directions}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-[#e10600] px-5 py-2.5 font-display text-sm uppercase tracking-[0.12em] text-white hover:bg-[#c10500]"
              >
                {copy.directions}
              </a>
            </div>
          </article>
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 className="font-display text-3xl uppercase">{copy.amenitiesTitle}</h3>
              <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
                {copy.amenities.map((item) => (
                  <li key={item} className="py-3 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <figure>
              <div className="h-72 overflow-hidden border border-black/10 bg-[#eee]">
                <iframe title={address} src={mapSrc} className="h-full w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <figcaption className="mt-2 text-right text-xs text-black/45">
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
                  {copy.mapNote}
                </a>
              </figcaption>
            </figure>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
