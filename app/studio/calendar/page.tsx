import StudioCoursesPage from "@/components/studio-courses-page";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; course_type?: string; error?: string; notice?: string }>;
}) {
  return <StudioCoursesPage searchParams={searchParams.then((params) => ({ ...params, tab: "calendar" }))} />;
}
