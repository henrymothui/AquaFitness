import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.publicPages.legal.privacyTitle };
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  const copy = t.publicPages.legal;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">{copy.privacyTitle}</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-ink/80">
          {copy.privacy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
