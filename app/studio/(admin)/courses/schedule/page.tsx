import StudioCoursesPage from "@/components/studio-courses-page";

export const metadata = { title: "Schedule" };

export default function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string; course_type?: string; error?: string; notice?: string }>;
}) {
  return <StudioCoursesPage searchParams={searchParams} />;
}
