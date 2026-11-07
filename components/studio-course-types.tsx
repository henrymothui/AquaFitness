"use client";

import Image from "next/image";
import { useState } from "react";
import { createClass, deleteClassType, updateClass } from "@/app/studio/actions";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { ClassColorOptions } from "@/components/class-color-options";
import { DEFAULT_CLASS_COLOR } from "@/lib/class-colors";

type CourseType = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  image_path: string | null;
  image_url: string | null;
  color: string;
  default_capacity: number;
  active: boolean;
};

export function StudioCourseTypes({ courses, returnTo, embedded = false }: { courses: CourseType[]; returnTo?: string; embedded?: boolean }) {
  const [editing, setEditing] = useState<CourseType | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<CourseType | null>(null);
  const open = adding || editing !== null;
  const course = editing;

  function close() {
    setAdding(false);
    setEditing(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {embedded ? <h2>Course types</h2> : <h1>Course types</h1>}
          <p className="mt-2 text-sm text-slate-500">Manage the course types used for class bookings and schedules.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonClass}>Add course</button>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-xl border border-[#e5e9ed] bg-white p-6 text-sm text-slate-500">No course types yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
              <div className="relative h-44 bg-gradient-to-br from-lagoon to-pool">
                {item.image_url ? (
                  <Image src={item.image_url} alt="" fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center font-display text-6xl text-white">{item.name.slice(0, 1).toUpperCase()}</span>
                )}
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium ${item.active ? "bg-white text-emerald-700" : "bg-black/65 text-white"}`}>
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2>{item.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{item.duration_minutes} min · {item.default_capacity} spots</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />Schedule color</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditing(item)} className="rounded-lg border border-[#dce4e9] px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                    <button type="button" onClick={() => setDeleting(item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{item.description || "No description added."}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="course-type-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="course-type-dialog-title">{course ? `Edit ${course.name}` : "Add course"}</h2>
                <p className="mt-1 text-sm text-slate-500">These details are used for bookings and scheduled classes.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form key={course?.id ?? "new-course"} action={course ? updateClass : createClass} className="grid gap-4">
              {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
              {course ? <input type="hidden" name="id" value={course.id} /> : null}
              <Field label="Name">
                <input name="name" required defaultValue={course?.name ?? ""} className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={4} defaultValue={course?.description ?? ""} className={inputClass} />
              </Field>
              <Field label="Schedule color" hint="Used for this course type in the course calendar.">
                <ClassColorOptions value={course?.color ?? DEFAULT_CLASS_COLOR} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (minutes)">
                  <input name="duration_minutes" type="number" min={15} max={240} defaultValue={course?.duration_minutes ?? 45} required className={inputClass} />
                </Field>
                <Field label="Default capacity">
                  <input name="default_capacity" type="number" min={1} max={100} defaultValue={course?.default_capacity ?? 10} required className={inputClass} />
                </Field>
              </div>
              <Field label={course ? "Replace course image" : "Course image"}>
                <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="active" defaultChecked={course?.active ?? true} />
                Available for booking and scheduling
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button className={buttonClass}>{course ? "Save changes" : "Add course"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4" onClick={(event) => { if (event.target === event.currentTarget) setDeleting(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-course-type-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="delete-course-type-title">Delete {deleting.name}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This permanently removes the course type. Enter the admin code to confirm. Course types used by schedules, classes, or packages must be unlinked first.</p>
            <form action={deleteClassType} className="mt-5 grid gap-4">
              {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
              <input type="hidden" name="id" value={deleting.id} />
              <Field label="Admin code">
                <input name="admin_code" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} required className={inputClass} />
              </Field>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setDeleting(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button className="inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-800">Confirm delete</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
