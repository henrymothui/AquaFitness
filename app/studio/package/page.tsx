import { StudioPackages } from "@/components/studio-packages";
import { CourseManagementNav } from "@/components/course-management-nav";
import { Flash } from "@/components/ui";
import { listClassTypes, listPackages } from "@/lib/queries";

export const metadata = { title: "Package" };

export default async function PackagesStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const [packages, classes] = await Promise.all([listPackages(true), listClassTypes(true)]);

  return (
    <main className="grid gap-5">
      <Flash error={params.error} notice={params.notice} />
      <CourseManagementNav />
      <StudioPackages packages={packages} classes={classes} />
    </main>
  );
}
