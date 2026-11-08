"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startPageLoading } from "@/components/page-loading";
import { CourseCalendar } from "@/components/course-calendar";
import { CourseEditDialog } from "@/components/course-edit-dialog";
import { StudioCourseTypes } from "@/components/studio-course-types";
import { type CoachOption } from "@/components/coach-select";
import { inputClass } from "@/components/ui";
import { monthKeyInTimeZone, upcomingMonthKeys } from "@/lib/dates";
import type { ClassType, SessionView } from "@/lib/queries";

type Participant = {
  id: string;
  sessionId: string;
  status: string;
  customerName: string;
  customerEmail: string;
};

export function CourseScheduleTabs({
  timezone,
  allSessions,
  participants,
  initialTab,
  initialCourseType,
  month,
  courseTypes,
  coaches = [],
}: {
  timezone: string;
  allSessions: SessionView[];
  participants: Participant[];
  initialTab?: string;
  initialCourseType?: string;
  month: string;
  courseTypes: (ClassType & { image_url: string | null })[];
  coaches: CoachOption[];
}) {
  const tab: "courses" | "calendar" | "types" =
    initialTab === "calendar" || initialTab === "types" ? initialTab : "courses";
  const scheduledSessions = allSessions.filter((session) => session.status === "scheduled");
  const activeCourseTypes = courseTypes.filter((courseType) => courseType.active);
  const calendarCounts = Object.fromEntries(participants.reduce((counts, person) => {
    counts.set(person.sessionId, (counts.get(person.sessionId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>()));
  return (
    <div>
      <section hidden={tab !== "courses"}>
        <CourseList sessions={allSessions} participants={participants} timezone={timezone} courseTypes={courseTypes} coaches={coaches} month={month} courseTypeId={initialCourseType ?? ""} />
      </section>
      <section hidden={tab !== "calendar"}>
        <CourseCalendar month={month} sessions={scheduledSessions} classes={activeCourseTypes} coaches={coaches} counts={calendarCounts} timezone={timezone} />
      </section>
      <section hidden={tab !== "types"}>
        <StudioCourseTypes courses={courseTypes} returnTo="/studio/courses/course-type" embedded />
      </section>
    </div>
  );
}
function coachName(session: SessionView, coaches: CoachOption[] = []) {
  return session.instructor || coaches.find((coach) => coach.id === session.coachId)?.fullName || null;
}

function CourseList({ sessions, participants, timezone, courseTypes, coaches = [], month, courseTypeId }: { sessions: SessionView[]; participants: Participant[]; timezone: string; courseTypes: ClassType[]; coaches?: CoachOption[]; month: string; courseTypeId: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const monthOptions = [...new Set([
    ...upcomingMonthKeys(timezone),
    month,
    ...sessions.map((session) => monthKeyInTimeZone(new Date(session.startsAt), timezone)),
  ])].sort((a, b) => b.localeCompare(a));
  const isFutureMonth = month > monthKeyInTimeZone(new Date(), timezone);
  const monthSessions = sessions.filter((session) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" }).formatToParts(new Date(session.startsAt));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}` === month && (!courseTypeId || session.classTypeId === courseTypeId);
  });
  const participantCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of participants) map.set(person.sessionId, (map.get(person.sessionId) ?? 0) + 1);
    return map;
  }, [participants]);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="grid w-full grid-cols-2 items-end gap-3 sm:flex sm:w-auto sm:flex-wrap">
        <label className="grid min-w-0 gap-1 text-xs font-medium text-ink/65">Month
          <select aria-label="Navigate courses by month" value={month} onChange={(event) => {
            const query = new URLSearchParams({ month: event.target.value });
            if (courseTypeId) query.set("course_type", courseTypeId);
            startPageLoading();
            router.push(`/studio/courses/schedule?${query.toString()}`);
          }} className={`${inputClass} w-full min-w-0 sm:min-w-48`}>
            {monthOptions.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`))}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-xs font-medium text-ink/65">Course type
          <select aria-label="Filter courses by course type" value={courseTypeId} onChange={(event) => {
            const query = new URLSearchParams({ month });
            if (event.target.value) query.set("course_type", event.target.value);
            startPageLoading();
            router.push(`/studio/courses/schedule?${query.toString()}`);
          }} className={`${inputClass} w-full min-w-0 sm:min-w-48`}>
            <option value="">All course types</option>
            {[...courseTypes].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <p className="col-span-2 pb-1 text-sm text-ink/60 sm:pb-2">{monthSessions.length} {monthSessions.length === 1 ? "course" : "courses"} this month</p>
      </div>
    </div>
    <ul className="grid gap-2 md:hidden">
      {monthSessions.length === 0 ? (
        <li className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">{isFutureMonth ? "No courses created yet." : "No courses scheduled for this month."}</li>
      ) : monthSessions.map((session) => {
        const filled = participantCounts.get(session.id) ?? 0;
        const date = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: timezone }).format(new Date(session.startsAt));
        const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt));
        const remaining = Math.max(session.capacity - filled, 0);
        const editable = session.status === "scheduled";
        const card = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`block truncate text-[15px] font-semibold leading-tight ${editable ? "text-pool" : "text-ink/60"}`}>{session.title}</span>
                <span className="mt-0.5 block truncate text-xs text-ink/55">{date} · {time}</span>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${editable ? "border-pool/20 bg-[#edf6f9] text-lagoon" : "border-line bg-slate-50 text-ink/55"}`}>
                {editable ? "Scheduled" : "Cancelled"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/60 pt-2 text-xs text-ink/60">
              <span className="truncate">{coachName(session, coaches) || "Coach not set"}</span>
              <span className="shrink-0 tabular-nums"><strong className="font-semibold text-ink">{filled}</strong>/{session.capacity} filled · {remaining} left</span>
            </div>
          </>
        );
        return (
          <li key={session.id} className="rounded-xl border border-line bg-white">
            {editable ? (
              <button type="button" aria-label={`Edit ${session.title}`} onClick={() => setSelectedId(session.id)} className="block w-full p-3 text-left transition active:bg-slate-50">
                {card}
              </button>
            ) : (
              <div className="p-3">{card}</div>
            )}
          </li>
        );
      })}
    </ul>
    <div className="hidden overflow-x-auto rounded-xl border border-line bg-white md:block">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink/55"><tr>{["Course", "Coach", "Status", "Date", "Time", "Total slots", "Slots filled", "Slots remaining"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {monthSessions.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-ink/60">{isFutureMonth ? "No courses created yet." : "No courses scheduled for this month."}</td></tr> : monthSessions.map((session) => {
            const filled = participantCounts.get(session.id) ?? 0;
            const date = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone }).format(new Date(session.startsAt));
            const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt));
            const editable = session.status === "scheduled";
            return <tr key={session.id} onClick={editable ? () => setSelectedId(session.id) : undefined} className={editable ? "cursor-pointer hover:bg-slate-50/70" : "hover:bg-slate-50/70"}>
              <td className="px-4 py-3">{editable ? <button type="button" aria-label={`Edit ${session.title}`} onClick={() => setSelectedId(session.id)} className="text-left font-semibold text-pool hover:underline">{session.title}</button> : <span className="font-semibold text-ink/60">{session.title}</span>}<span className="mt-1 block text-xs text-ink/55">{session.classTypeName}</span></td>
              <td className="px-4 py-3 font-medium text-ink">{coachName(session, coaches) || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${session.status === "scheduled" ? "border-pool/20 bg-[#edf6f9] text-lagoon" : "border-line bg-slate-50 text-ink/55"}`}>{session.status === "scheduled" ? "Scheduled" : "Cancelled"}</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink/75">{date}</td>
              <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-ink/75">{time}</td>
              <td className="px-4 py-3 tabular-nums">{session.capacity}</td>
              <td className="px-4 py-3 tabular-nums">{filled}</td>
              <td className="px-4 py-3 tabular-nums">{Math.max(session.capacity - filled, 0)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <CourseEditDialog session={selected} classes={courseTypes} coaches={coaches} timezone={timezone} month={month} onClose={() => setSelectedId(null)} />
  </>;
}
