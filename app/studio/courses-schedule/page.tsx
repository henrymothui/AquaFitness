import { CourseScheduleTabs } from "@/components/course-schedule-tabs";
import { Flash } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { getSettings, listAllSessions, listClassTypes, rostersForSessions } from "@/lib/queries";
import { imageUrl } from "@/lib/storage";

export const metadata = { title: "Courses management" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string; course_type?: string; error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const settings = await getSettings();
  const currentMonth = todayISO(settings.timezone).slice(0, 7);
  const month = query.month && /^\d{4}-\d{2}$/.test(query.month) ? query.month : currentMonth;
  const [courseTypes, allSessions] = await Promise.all([
    listClassTypes(true),
    listAllSessions(),
  ]);
  const participants = await rostersForSessions(allSessions.map((session) => session.id));

  return (
    <main className="grid w-full gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1>Courses management</h1><p className="mt-1 text-sm text-slate-500">Manage courses and participants.</p></div>
        <p className="text-sm text-slate-500">{allSessions.length} courses</p>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <CourseScheduleTabs
        timezone={settings.timezone}
        allSessions={allSessions}
        participants={participants}
        initialTab={query.tab}
        initialCourseType={query.course_type}
        month={month}
        courseTypes={courseTypes.map((item) => ({ ...item, image_url: imageUrl(item.image_path) }))}
      />
    </main>
  );
}
