import { redirect } from "next/navigation";

export const metadata = { title: "Course types" };

export default async function CourseTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams({ tab: "types" });
  if (query.error) params.set("error", query.error);
  if (query.notice) params.set("notice", query.notice);
  redirect(`/studio/courses-schedule?${params.toString()}`);
}
