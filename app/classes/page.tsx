import Image from "next/image";
import Link from "next/link";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/ui";
import { getI18n } from "@/lib/i18n";

const images = ["/brand/pool-class.jpg", "/brand/banner.jpg", "/brand/hcmc-skyline.jpg", "/brand/pool-class.jpg"];

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.classes.metaTitle };
}

export default async function ClassesPage() {
  const { t } = await getI18n();
  const copy = t.classes;

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <p className="max-w-2xl text-base leading-7 text-black/75">{copy.intro}</p>
          <ul className="mt-12 grid gap-10">
            {copy.items.map((item, index) => (
              <li key={item.name} className="grid items-center gap-6 border-t border-black/10 pt-8 md:grid-cols-[16rem_1fr_auto]">
                <div className="relative h-44 overflow-hidden bg-[#ddd] md:h-36">
                  <Image src={images[index]} alt="" fill sizes="16rem" className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">
                    {item.minutes} · {item.level}
                  </p>
                  <h2 className="mt-2 font-display text-4xl uppercase">{item.name}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">{item.body}</p>
                </div>
                <Link
                  href="/schedule"
                  className="justify-self-start rounded-full border border-black px-5 py-2 font-display text-sm uppercase tracking-[0.12em] hover:bg-black hover:text-white md:justify-self-end"
                >
                  {copy.book}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
