import StudioCoursesPage from "@/components/studio-courses-page";

export const metadata = { title: "Course Type" };

export default async function CourseTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; course_type?: string; error?: string; notice?: string }>;
}) {
  return <StudioCoursesPage searchParams={searchParams.then((params) => ({ ...params, tab: "types" }))} />;
}
