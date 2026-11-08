"use client";

import { useState } from "react";
import { createCoach, deleteCoach, updateCoach } from "@/app/studio/(admin)/coach/actions";
import { buttonClass, Field, inputClass, quietButtonClass } from "@/components/ui";
import type { CoachAccount } from "@/lib/queries";

const usernamePattern = "[A-Za-z0-9][A-Za-z0-9._-]{2,31}";

export function StudioCoaches({ coaches }: { coaches: CoachAccount[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CoachAccount | null>(null);
  const [removing, setRemoving] = useState<CoachAccount | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Coaches</h1>
          <p className="mt-1 text-sm text-slate-500">Create a username and password, then assign the coach when you schedule a course.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonClass}>Add coach</button>
      </div>

      {coaches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white px-4 py-12 text-center text-sm text-ink/60">No coaches yet. Add one to assign them to a course.</p>
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white md:hidden">
            {coaches.map((coach) => (
              <li key={coach.id}>
                <button type="button" onClick={() => setEditing(coach)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{coach.fullName}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink/55">{coach.username} · {coach.assignedCourses} assigned</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${coach.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-ink/55"}`}>
                    {coach.active ? "Active" : "Inactive"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-white md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  {["Coach", "Username", "Access", "Assigned courses", ""].map((heading) => (
                    <th key={heading || "actions"} className="px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coaches.map((coach) => (
                  <tr key={coach.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{coach.fullName}</td>
                    <td className="px-4 py-3 text-ink/75">{coach.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${coach.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-ink/55"}`}>
                        {coach.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink/75">{coach.assignedCourses}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setEditing(coach)} className={quietButtonClass}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {adding ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:grid sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdding(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-coach-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="add-coach-title" className="text-xl font-semibold">Add coach</h2>
              <button type="button" aria-label="Close add coach form" onClick={() => setAdding(false)} className={quietButtonClass}>×</button>
            </div>
            <form action={createCoach} className="mt-5 grid gap-3">
              <Field label="Name"><input name="full_name" required maxLength={120} autoComplete="off" className={inputClass} /></Field>
              <Field label="Username"><input name="username" required minLength={3} maxLength={32} pattern={usernamePattern} autoComplete="off" className={inputClass} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Password"><input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} /></Field>
                <Field label="Confirm password"><input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink"><input name="active" type="checkbox" defaultChecked className="h-4 w-4" />Can sign in</label>
              <p className="text-xs text-ink/55">The coach uses this username and password on the studio sign-in page. They do not register themselves.</p>
              <div className="flex gap-2 pt-1"><button className={buttonClass}>Add coach</button><button type="button" onClick={() => setAdding(false)} className={quietButtonClass}>Cancel</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:grid sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="edit-coach-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-coach-title" className="text-xl font-semibold">Edit {editing.fullName}</h2>
                <p className="mt-1 text-sm text-ink/60">{editing.assignedCourses} scheduled {editing.assignedCourses === 1 ? "course" : "courses"}</p>
              </div>
              <button type="button" aria-label="Close edit coach form" onClick={() => setEditing(null)} className={quietButtonClass}>×</button>
            </div>
            <form action={updateCoach} className="mt-5 grid gap-3">
              <input type="hidden" name="id" value={editing.id} />
              <Field label="Name"><input name="full_name" required maxLength={120} defaultValue={editing.fullName} className={inputClass} /></Field>
              <Field label="Username"><input name="username" required minLength={3} maxLength={32} pattern={usernamePattern} defaultValue={editing.username} autoComplete="off" className={inputClass} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="New password"><input name="password" type="password" minLength={8} autoComplete="new-password" className={inputClass} /></Field>
                <Field label="Confirm new password"><input name="confirm_password" type="password" minLength={8} autoComplete="new-password" className={inputClass} /></Field>
              </div>
              <p className="text-xs text-ink/55">Leave the password blank to keep the current one.</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input name="active" type="checkbox" defaultChecked={editing.active} className="h-4 w-4" />Can sign in</label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button className={buttonClass}>Save coach</button>
                <button type="button" onClick={() => setEditing(null)} className={quietButtonClass}>Cancel</button>
                <button type="button" onClick={() => { setRemoving(editing); setEditing(null); }} className="ml-auto text-sm font-medium text-red-700">Remove coach</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {removing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRemoving(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-coach-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="delete-coach-title" className="text-lg font-semibold">Remove {removing.fullName}?</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">This deletes the login. Courses already assigned to this coach become unassigned. Type <strong>{removing.username}</strong> to confirm.</p>
            <form action={deleteCoach} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={removing.id} />
              <input name="confirm_username" required autoComplete="off" placeholder={removing.username} className={inputClass} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRemoving(null)} className={quietButtonClass}>Keep coach</button>
                <button className="inline-flex h-10 items-center rounded-lg bg-red-700 px-4 text-sm font-semibold text-white">Remove coach</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
