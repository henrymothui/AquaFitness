"use client";

import { updateSession } from "@/app/studio/actions";
import { buttonClass, Field, inputClass, quietButtonClass } from "@/components/ui";
import type { ClassType, SessionView } from "@/lib/queries";

function localDate(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function localTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

export function CourseEditDialog({
  session,
  classes,
  timezone,
  month,
  onClose,
}: {
  session: SessionView | null;
  classes: ClassType[];
  timezone: string;
  month: string;
  onClose: () => void;
}) {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-course-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-wide text-ink/50">Course schedule</p><h2 id="edit-course-title" className="mt-1 text-xl font-semibold">Edit course</h2></div>
          <button type="button" aria-label="Close edit course form" onClick={onClose} className={quietButtonClass}>×</button>
        </div>
        <form action={updateSession} className="mt-5 grid gap-3 border-t border-line pt-4">
          <input type="hidden" name="id" value={session.id} />
          <p className="text-sm text-ink/60">Changes apply to this date only.</p>
          <Field label="Course title"><input name="title" required defaultValue={session.title} className={inputClass} /></Field>
          <Field label="Course type"><select name="class_type_id" required defaultValue={session.classTypeId} className={inputClass}>{!classes.some((item) => item.id === session.classTypeId) ? <option value={session.classTypeId}>{session.classTypeName}</option> : null}{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Date"><input name="date" type="date" required defaultValue={localDate(session.startsAt, timezone)} className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Start"><input name="start_time" type="time" required defaultValue={localTime(session.startsAt, timezone)} className={inputClass} /></Field><Field label="End"><input name="end_time" type="time" required defaultValue={localTime(session.endsAt, timezone)} className={inputClass} /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Max participants"><input name="capacity" type="number" min={1} max={100} defaultValue={session.capacity} required className={inputClass} /></Field><Field label="Price in credits"><input name="credits_required" type="number" min={1} max={20} defaultValue={session.creditsRequired} required className={inputClass} /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Instructor"><input name="instructor" defaultValue={session.instructor ?? ""} className={inputClass} /></Field><Field label="Location"><input name="location" defaultValue={session.location ?? ""} className={inputClass} /></Field></div>
          <Field label="Description"><textarea name="description" rows={3} defaultValue={session.ownDescription ?? ""} className={inputClass} /></Field>
          <input type="hidden" name="return_to" value={`/studio/schedule?month=${month}`} />
          <div className="flex gap-2 pt-1"><button className={buttonClass}>Save course</button><button type="button" onClick={onClose} className={quietButtonClass}>Cancel</button></div>
        </form>
      </section>
    </div>
  );
}
