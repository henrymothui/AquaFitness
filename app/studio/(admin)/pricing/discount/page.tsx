import { PackageSectionNav } from "@/components/package-section-nav";
import { StudioDiscounts } from "@/components/studio-discounts";
import { Flash } from "@/components/ui";
import { listDiscountPlans } from "@/lib/queries";

export const metadata = { title: "Discount" };

export default async function DiscountStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const plans = await listDiscountPlans(true);

  return (
    <main className="grid gap-5">
      <Flash error={params.error} notice={params.notice} />
      <PackageSectionNav />
      <StudioDiscounts plans={plans} />
    </main>
  );
}
