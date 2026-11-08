import { CourseScheduleTabs } from "@/components/course-schedule-tabs";
import { CourseManagementNav } from "@/components/course-management-nav";
import { Flash } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { getSettings, listAllSessions, listClassTypes, listCoaches, rostersForSessions } from "@/lib/queries";
import { imageUrl } from "@/lib/storage";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string; course_type?: string; error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const settings = await getSettings();
  const currentMonth = todayISO(settings.timezone).slice(0, 7);
  const month = query.month && /^\d{4}-\d{2}$/.test(query.month) ? query.month : currentMonth;
  const [courseTypes, allSessions, coaches] = await Promise.all([
    listClassTypes(true),
    listAllSessions(),
    listCoaches(),
  ]);
  const participants = await rostersForSessions(allSessions.map((session) => session.id));

  return (
    <main className="grid w-full gap-4 sm:gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1>Courses</h1><p className="mt-1 text-sm text-slate-500">Manage courses and participants.</p></div>
        <p className="text-sm text-slate-500">{allSessions.length} courses</p>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <CourseManagementNav />
      <CourseScheduleTabs
        timezone={settings.timezone}
        allSessions={allSessions}
        participants={participants}
        initialTab={query.tab}
        initialCourseType={query.course_type}
        month={month}
        courseTypes={courseTypes.map((item) => ({ ...item, image_url: imageUrl(item.image_path) }))}
        coaches={coaches.map((coach) => ({ id: coach.id, fullName: coach.fullName, active: coach.active }))}
      />
    </main>
  );
}
