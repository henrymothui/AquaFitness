import { StudioCoaches } from "@/components/studio-coaches";
import { Flash } from "@/components/ui";
import { listCoaches } from "@/lib/queries";

export const metadata = { title: "Coaches" };

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [query, coaches] = await Promise.all([searchParams, listCoaches()]);

  return (
    <main className="grid w-full gap-4 sm:gap-5">
      <Flash error={query.error} notice={query.notice} />
      <StudioCoaches coaches={coaches} />
    </main>
  );
}
