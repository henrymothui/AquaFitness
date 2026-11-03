import { CareerForm } from "@/components/career-form";
import { PageBanner } from "@/components/marketing";
import { PublicHeader, SiteFooter } from "@/components/ui";
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
        <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-16">
          <div>
            <p className="text-base leading-7 text-black/75">{copy.intro}</p>
            <h2 className="mt-10 font-display text-3xl uppercase">{copy.rolesTitle}</h2>
            <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
              {copy.roles.map((role) => (
                <li key={role} className="py-3 font-display text-xl uppercase">
                  {role}
                </li>
              ))}
            </ul>
            <article className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">{copy.roleMeta}</p>
              <h2 className="mt-2 font-display text-4xl uppercase">{copy.roleTitle}</h2>
              <p className="mt-4 text-sm leading-6 text-black/75">{copy.roleBody}</p>
              <h3 className="mt-8 font-display text-2xl uppercase">{copy.doTitle}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
                {copy.do.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mt-8 font-display text-2xl uppercase">{copy.lookTitle}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
                {copy.look.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mt-8 font-display text-2xl uppercase">{copy.payTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-black/75">{copy.pay}</p>
            </article>
          </div>
          <div className="border border-black/10 bg-[#f6f6f6] p-6 md:p-8">
            <h2 className="font-display text-4xl uppercase">{copy.formTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-black/70">{copy.formBody}</p>
            <CareerForm copy={copy} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
