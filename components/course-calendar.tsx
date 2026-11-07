"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createEvent, updateEvent } from "@/app/studio/actions";
import { buttonClass, Field, inputClass, quietButtonClass } from "@/components/ui";
import { monthKeyInTimeZone, upcomingMonthKeys } from "@/lib/dates";
import type { ClassType, SessionView } from "@/lib/queries";

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function localDate(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function localTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

export function CourseCalendar({
  month,
  sessions,
  classes,
  counts,
  timezone,
}: {
  month: string;
  sessions: SessionView[];
  classes: ClassType[];
  counts: Record<string, number>;
  timezone: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionView | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [classTypeFilter, setClassTypeFilter] = useState("all");
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthIndex - 1, 1));
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const byDate = useMemo(() => {
    const map = new Map<string, SessionView[]>();
    for (const session of sessions) {
      if (classTypeFilter !== "all" && session.classTypeId !== classTypeFilter) continue;
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(session.startsAt));
      const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      const key = `${p.year}-${p.month}-${p.day}`;
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [sessions, timezone, classTypeFilter]);
  const monthOptions = [...new Set([
    ...upcomingMonthKeys(timezone),
    month,
    ...sessions.map((session) => monthKeyInTimeZone(new Date(session.startsAt), timezone)),
  ])].sort((a, b) => b.localeCompare(a));
  const hasMonthCourses = sessions.some((session) => monthKeyInTimeZone(new Date(session.startsAt), timezone) === month);
  const isFutureMonth = month > monthKeyInTimeZone(new Date(), timezone);
  const selectedSessions = selected ? byDate.get(selected) ?? [] : [];
  const changeMonth = (nextMonth: string) => {
    router.push(`/studio/courses-schedule?month=${nextMonth}&tab=calendar`);
  };

  return (
    <div className="w-full">
      <section className="w-full rounded-xl border border-[#e5e9ed] bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium text-ink/65">Month
              <select aria-label="Navigate courses by month" value={month} onChange={(event) => changeMonth(event.target.value)} className={`${inputClass} min-w-48`}>
                {monthOptions.map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`))}</option>)}
              </select>
            </label>
            <Field label="Course type">
              <select aria-label="Filter calendar by course type" value={classTypeFilter} onChange={(event) => setClassTypeFilter(event.target.value)} className={`${inputClass} min-w-48`}>
                <option value="all">All course types</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
          </div>
          <button type="button" onClick={() => { setSelected(`${month}-01`); setShowForm(true); }} className={buttonClass}>Add course</button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="pb-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 overflow-hidden rounded-lg border-l border-t border-[#e5e9ed]">
          {Array.from({ length: offset }, (_, i) => <div key={`blank-${i}`} className="min-h-24 border-b border-r border-[#e5e9ed] bg-slate-50/60 sm:min-h-32 lg:min-h-36" />)}
          {Array.from({ length: days }, (_, i) => {
            const key = dateKey(new Date(Date.UTC(year, monthIndex - 1, i + 1)));
            const items = byDate.get(key) ?? [];
            const active = selected === key;
            return <div key={key} className={`min-h-24 border-b border-r border-[#e5e9ed] p-1.5 sm:min-h-32 sm:p-2.5 lg:min-h-36 ${active ? "bg-[#edf6f9]" : "bg-white"}`}>
              <button type="button" onClick={() => { setSelected(key); setShowForm(false); }} aria-label={`Add a course on ${key}`} className={`flex h-6 w-6 items-center justify-center rounded-md text-xs ${active ? "bg-[#dceef4] font-semibold text-[#155b78]" : "text-slate-700"}`}>{i + 1}</button>
              <span className="mt-1 grid gap-1">{items.slice(0, 2).map((item) => <button type="button" key={item.id} onClick={() => setSelectedSession(item)} className="truncate rounded px-1 py-1 text-left text-[10px] font-medium leading-tight sm:text-xs" style={{ color: item.classTypeColor, backgroundColor: `${item.classTypeColor}1a` }}><span className="block truncate">{item.title}</span><span className="block truncate text-[9px] font-normal opacity-75">{counts[item.id] ?? 0} participant{(counts[item.id] ?? 0) === 1 ? "" : "s"}</span></button>)}{items.length > 2 && <button type="button" onClick={() => { setSelected(key); setShowForm(false); }} className="text-left text-[10px] text-slate-400">+{items.length - 2} more</button>}</span>
            </div>;
          })}
        </div>
        {!hasMonthCourses ? <p className="mt-4 rounded-lg border border-dashed border-[#d8e1e7] px-4 py-3 text-center text-sm text-ink/60">{isFutureMonth ? "No courses created yet." : "No courses scheduled for this month."}</p> : null}
        <p className="mt-3 text-xs text-slate-400">Select a date to view or add a course.</p>
      </section>

      {selected ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="selected-date-heading" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-xl sm:rounded-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Selected date</p><h3 id="selected-date-heading" className="mt-1 text-lg font-semibold text-slate-900">{new Intl.DateTimeFormat("en", { weekday: "short", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${selected}T12:00:00Z`))}</h3></div><div className="flex items-center gap-2"><button onClick={() => setShowForm(true)} className={buttonClass}>Add course</button><button type="button" aria-label="Close date details" onClick={() => setSelected(null)} className={quietButtonClass}>✕</button></div></div>
          {showForm ? <form action={createEvent} className="mt-5 grid gap-3 border-t border-line pt-4">
            <Field label="Course title"><input name="title" required placeholder="e.g. Aqua Strength" className={inputClass} /></Field>
            <Field label="Course type"><select name="class_type_id" required className={inputClass}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Date"><input name="date" type="date" required defaultValue={selected} className={inputClass} /></Field>
            <input type="hidden" name="return_to" value="/studio/courses-schedule" />
            <div className="grid grid-cols-2 gap-3"><Field label="Start"><input name="start_time" type="time" defaultValue="10:00" required className={inputClass} /></Field><Field label="End"><input name="end_time" type="time" defaultValue="10:45" required className={inputClass} /></Field></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Max participants"><input name="capacity" type="number" min={1} max={100} defaultValue={10} required className={inputClass} /></Field><Field label="Price in credits"><input name="credits_required" type="number" min={1} max={20} defaultValue={1} required className={inputClass} /></Field></div>
            <Field label="Instructor"><input name="instructor" placeholder="Instructor name" className={inputClass} /></Field>
            <Field label="Location"><input name="location" placeholder="Pool or studio" className={inputClass} /></Field>
            <div className="flex gap-2 pt-1"><button className={buttonClass}>Create course</button><button type="button" onClick={() => setShowForm(false)} className={quietButtonClass}>Cancel</button></div>
          </form> : <div className="mt-5 grid gap-3 border-t border-line pt-4">
            {selectedSessions.length === 0 ? <p className="text-sm text-ink/60">No courses scheduled. Add one to open bookings.</p> : selectedSessions.map((session) => <button type="button" key={session.id} onClick={() => { setSelected(null); setSelectedSession(session); }} className="rounded-2xl border border-line p-3 text-left transition hover:border-pool"><span className="flex justify-between gap-2"><span className="flex min-w-0 items-center gap-2 font-semibold text-ink"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.classTypeColor }} /><span className="truncate">{session.title}</span></span><span className="shrink-0 text-xs text-tide">{counts[session.id] ?? 0}/{session.capacity}</span></span><span className="mt-1 block text-xs text-ink/65">{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))} · {session.creditsRequired} credit{session.creditsRequired === 1 ? "" : "s"}</span><span className="mt-1 block text-xs text-ink/55">{session.instructor || "Instructor not set"} · {session.location || "Location not set"}</span><span className="mt-2 inline-block text-xs font-medium text-pool">Edit course →</span></button>)}
          </div>}
        </section>
      </div> : null}

      {selectedSession ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSession(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="edit-calendar-course-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wide text-ink/50">Course schedule</p><h2 id="edit-calendar-course-title" className="mt-1 text-xl font-semibold">Edit course</h2></div><button type="button" aria-label="Close edit course form" onClick={() => setSelectedSession(null)} className={quietButtonClass}>×</button></div>
          <form action={updateEvent} className="mt-5 grid gap-3 border-t border-line pt-4">
            <input type="hidden" name="id" value={selectedSession.id} />
            {selectedSession.kind === "regular" ? <p className="text-sm text-ink/60">Changes apply to this date only.</p> : null}
            <Field label="Course title"><input name="title" required defaultValue={selectedSession.title} className={inputClass} /></Field>
            <Field label="Course type"><select name="class_type_id" required defaultValue={selectedSession.classTypeId} className={inputClass}>{!classes.some((item) => item.id === selectedSession.classTypeId) ? <option value={selectedSession.classTypeId}>{selectedSession.classTypeName}</option> : null}{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Date"><input name="date" type="date" required defaultValue={localDate(selectedSession.startsAt, timezone)} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Start"><input name="start_time" type="time" required defaultValue={localTime(selectedSession.startsAt, timezone)} className={inputClass} /></Field><Field label="End"><input name="end_time" type="time" required defaultValue={localTime(selectedSession.endsAt, timezone)} className={inputClass} /></Field></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Max participants"><input name="capacity" type="number" min={1} max={100} defaultValue={selectedSession.capacity} required className={inputClass} /></Field><Field label="Price in credits"><input name="credits_required" type="number" min={1} max={20} defaultValue={selectedSession.creditsRequired} required className={inputClass} /></Field></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Instructor"><input name="instructor" defaultValue={selectedSession.instructor ?? ""} className={inputClass} /></Field><Field label="Location"><input name="location" defaultValue={selectedSession.location ?? ""} className={inputClass} /></Field></div>
            <Field label="Description"><textarea name="description" rows={3} defaultValue={selectedSession.ownDescription ?? ""} className={inputClass} /></Field>
            <input type="hidden" name="return_to" value={`/studio/courses-schedule?tab=calendar&month=${month}`} />
            <div className="flex gap-2 pt-1"><button className={buttonClass}>Save course</button><button type="button" onClick={() => setSelectedSession(null)} className={quietButtonClass}>Cancel</button></div>
          </form>
        </section>
      </div> : null}
    </div>
  );
}
