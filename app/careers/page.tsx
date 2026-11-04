import { CareerRoles } from "@/components/career-roles";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.careers.metaTitle };
}

export default async function CareersPage() {
  const { t } = await getI18n();
  const copy = t.careers;

  return (
    <>
      <PublicHeader />
      <main>
        <PageBanner kicker={copy.kicker} title={copy.title} watermark={copy.watermark} />
        <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <p className="max-w-2xl text-base leading-7 text-black/75">{copy.intro}</p>
          <CareerRoles copy={copy} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
