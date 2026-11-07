import { PricePair, type ClassPrices } from "@/components/class-catalog";
import { ScrollStory, type StoryChapter } from "@/components/scroll-story";
import { PublicHeader, SiteFooter } from "@/components/site-chrome";
import { formatMoney } from "@/lib/format";
import { getI18n } from "@/lib/i18n";
import { listPackages } from "@/lib/queries";

const frames = [
  { image: "/brand/class-fit.jpg", position: "object-[center_58%]" },
  { image: "/brand/class-strength.jpg", position: "object-[center_70%]" },
  { image: "/brand/class-restore.jpg", position: "object-center" },
  { image: "/brand/class-saturday.jpg", position: "object-[center_42%]" },
];

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.classes.metaTitle };
}

async function loadPrices(): Promise<ClassPrices> {
  try {
    const packages = await listPackages(false);
    const ten = packages.find((pack) => pack.credit_count === 10);
    const one = packages.find((pack) => pack.credit_count === 1);
    const singleCents = one?.price_cents ?? (ten ? Math.round(ten.price_cents / ten.credit_count) : null);
    return {
      single: singleCents == null ? null : formatMoney(singleCents),
      pack: ten ? formatMoney(ten.price_cents) : null,
    };
  } catch {
    return { single: null, pack: null };
  }
}

export default async function ClassesPage() {
  const { t } = await getI18n();
  const copy = t.classes;
  const prices = await loadPrices();

  const chapters: StoryChapter[] = copy.items.map((item, index) => {
    const bits = item.name.split(" ");
    const word = bits.pop() ?? item.name;
    const line = bits.join(" ");
    const frame = frames[index] ?? frames[0];
    return {
      image: frame.image,
      imageAlt: item.name,
      position: frame.position,
      line,
      word,
      eyebrow: `${item.minutes} · ${item.level}`,
      paragraphs: index === 0 ? [copy.intro, item.body, item.summary] : [item.body, item.summary],
      listLabel: copy.workout,
      list: item.exercises,
      aside:
        prices.single || prices.pack ? (
          <PricePair prices={prices} singleLabel={copy.singleLabel} packLabel={copy.packLabel} />
        ) : undefined,
      cta: { href: "/book-now", label: copy.book },
    };
  });

  return (
    <>
      <PublicHeader />
      <main>
        <ScrollStory snap chapters={chapters} />
      </main>
      <SiteFooter />
    </>
  );
}
