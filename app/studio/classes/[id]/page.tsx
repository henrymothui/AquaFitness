import { redirect } from "next/navigation";

export default async function LegacyClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/studio/course-type/${id}`);
}
