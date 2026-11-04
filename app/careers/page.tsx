import { CareerRoles } from "@/components/career-roles";
import { ScrollStory } from "@/components/scroll-story";
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
        <ScrollStory
          snap
          chapters={[
            {
              line: copy.kicker,
              word: copy.title,
              paragraphs: [copy.intro],
              panel: <CareerRoles copy={copy} />,
            },
          ]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
