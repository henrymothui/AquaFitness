"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startPageLoading } from "@/components/page-loading";
import { CourseCalendar } from "@/components/course-calendar";
import { CourseEditDialog } from "@/components/course-edit-dialog";
import { StudioCourseTypes } from "@/components/studio-course-types";
import { setBookingStatus } from "@/app/studio/actions";
import { Field, inputClass } from "@/components/ui";
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
}: {
  timezone: string;
  allSessions: SessionView[];
  participants: Participant[];
  initialTab?: string;
  initialCourseType?: string;
  month: string;
  courseTypes: (ClassType & { image_url: string | null })[];
}) {
  const [tab, setTab] = useState<"courses" | "calendar" | "types">(
    initialTab === "calendar" || initialTab === "types"
      ? initialTab
      : "courses",
  );
  useEffect(() => {
    setTab(initialTab === "calendar" || initialTab === "types"
      ? initialTab
      : "courses");
  }, [initialTab]);
  const scheduledSessions = allSessions.filter((session) => session.status === "scheduled");
  const activeCourseTypes = courseTypes.filter((courseType) => courseType.active);
  const calendarCounts = Object.fromEntries(participants.reduce((counts, person) => {
    counts.set(person.sessionId, (counts.get(person.sessionId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>()));
  return (
    <div>
      <section hidden={tab !== "courses"}>
        <CourseList sessions={allSessions} participants={participants} timezone={timezone} courseTypes={courseTypes} month={month} courseTypeId={initialCourseType ?? ""} />
      </section>
      <section hidden={tab !== "calendar"}>
        <CourseCalendar month={month} sessions={scheduledSessions} classes={activeCourseTypes} counts={calendarCounts} timezone={timezone} />
      </section>
      <section hidden={tab !== "types"}>
        <StudioCourseTypes courses={courseTypes} returnTo="/studio/course-type" embedded />
      </section>
    </div>
  );
}
function CourseList({ sessions, participants, timezone, courseTypes, month, courseTypeId }: { sessions: SessionView[]; participants: Participant[]; timezone: string; courseTypes: ClassType[]; month: string; courseTypeId: string }) {
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
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-medium text-ink/65">Month
          <select aria-label="Navigate courses by month" value={month} onChange={(event) => {
            const query = new URLSearchParams({ month: event.target.value });
            if (courseTypeId) query.set("course_type", courseTypeId);
            startPageLoading();
            router.push(`/studio/schedule?${query.toString()}`);
          }} className={`${inputClass} min-w-48`}>
            {monthOptions.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`))}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65">Course type
          <select aria-label="Filter courses by course type" value={courseTypeId} onChange={(event) => {
            const query = new URLSearchParams({ month });
            if (event.target.value) query.set("course_type", event.target.value);
            startPageLoading();
            router.push(`/studio/schedule?${query.toString()}`);
          }} className={`${inputClass} min-w-48`}>
            <option value="">All course types</option>
            {[...courseTypes].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <p className="pb-2 text-sm text-ink/60">{monthSessions.length} {monthSessions.length === 1 ? "course" : "courses"} this month</p>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink/55"><tr>{["Course", "Status", "Date", "Time", "Instructor", "Total slots", "Slots filled", "Slots remaining"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {monthSessions.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-ink/60">{isFutureMonth ? "No courses created yet." : "No courses scheduled for this month."}</td></tr> : monthSessions.map((session) => {
            const filled = participantCounts.get(session.id) ?? 0;
            const date = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone }).format(new Date(session.startsAt));
            const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt));
            return <tr key={session.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3">{session.status === "scheduled" ? <button type="button" aria-label={`Edit ${session.title}`} onClick={() => setSelectedId(session.id)} className="text-left font-semibold text-pool hover:underline">{session.title}</button> : <span className="font-semibold text-ink/60">{session.title}</span>}<span className="mt-1 block text-xs text-ink/55">{session.classTypeName}</span></td>
              <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${session.status === "scheduled" ? "border-pool/20 bg-[#edf6f9] text-lagoon" : "border-line bg-slate-50 text-ink/55"}`}>{session.status === "scheduled" ? "Scheduled" : "Cancelled"}</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink/75">{date}</td>
              <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-ink/75">{time}</td>
              <td className="px-4 py-3">{session.instructor || "—"}</td>
              <td className="px-4 py-3 tabular-nums">{session.capacity}</td>
              <td className="px-4 py-3 tabular-nums">{filled}</td>
              <td className="px-4 py-3 tabular-nums">{Math.max(session.capacity - filled, 0)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <CourseEditDialog session={selected} classes={courseTypes} timezone={timezone} month={month} onClose={() => setSelectedId(null)} />
  </>;
}

function BookingStatusForm({ person, returnTo, status, label }: { person: Participant; returnTo: string; status: "attended" | "no_show"; label: string }) {
  const active = person.status === status;
  return <form action={setBookingStatus}>
    <input type="hidden" name="session_id" value={person.sessionId} />
    <input type="hidden" name="booking_id" value={person.id} />
    <input type="hidden" name="status" value={status} />
    <input type="hidden" name="return_to" value={returnTo} />
    <button aria-pressed={active} className={`rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-pool text-white" : "border border-line text-ink/70 hover:bg-slate-50"}`}>{label}</button>
  </form>;
}
