"use client";

import { useMemo, useState } from "react";
import { cancelBooking, setBookingStatus } from "@/app/studio/actions";
import type { SessionView } from "@/lib/queries";

type Participant = {
  id: string;
  sessionId: string;
  status: string;
  customerName: string;
  customerEmail: string;
};

export function CheckInManagement({
  sessions,
  participants,
  timezone,
}: {
  sessions: SessionView[];
  participants: Participant[];
  timezone: string;
}) {
  const [courseId, setCourseId] = useState("all");
  const [courseType, setCourseType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [canceling, setCanceling] = useState<{ bookingId: string; sessionId: string; customerName: string; courseTitle: string } | null>(null);

  const courseTypes = useMemo(
    () => [...new Set(sessions.map((session) => session.classTypeName))].sort((a, b) => a.localeCompare(b)),
    [sessions],
  );
  const rows = useMemo(() => {
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const query = search.trim().toLocaleLowerCase();
    return participants.flatMap((person) => {
      const session = sessionById.get(person.sessionId);
      if (!session) return [];
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(session.startsAt));
      if (courseId !== "all" && session.id !== courseId) return [];
      if (courseType !== "all" && session.classTypeName !== courseType) return [];
      if (status !== "all" && person.status !== status) return [];
      if ((fromDate && date < fromDate) || (toDate && date > toDate)) return [];
      if (query && ![person.customerName, person.customerEmail, session.title, session.classTypeName, session.instructor ?? ""].some((value) => value.toLocaleLowerCase().includes(query))) return [];
      return [{ session, person, date }];
    }).sort((a, b) => a.session.startsAt.localeCompare(b.session.startsAt) || a.person.customerName.localeCompare(b.person.customerName));
  }, [sessions, participants, timezone, courseId, courseType, status, fromDate, toDate, search]);

  const courseOptions = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  function exportCsv() {
    const headings = ["Client", "Email", "Course", "Course type", "Date", "Time", "Instructor", "Location", "Check-in status"];
    const values = rows.map(({ session, person, date }) => [
      person.customerName,
      person.customerEmail,
      session.title,
      session.classTypeName,
      date,
      new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt)),
      session.instructor ?? "",
      session.location ?? "",
      person.status.replaceAll("_", " "),
    ]);
    const csv = [headings, ...values]
      .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `course-check-in-${new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}.csv`;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="grid gap-4 rounded-xl border border-[#e5e9ed] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Course attendance</h2>
          <p className="mt-1 text-sm text-ink/60">Choose a course or combine filters to find a booking. Cancelled bookings return their credit.</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="rounded-lg bg-pool px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lagoon disabled:cursor-not-allowed disabled:opacity-50">Export CSV ({rows.length})</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="grid gap-1 text-xs font-medium text-ink/65 xl:col-span-2">Course
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
            <option value="all">All courses</option>
            {courseOptions.map((session) => <option key={session.id} value={session.id}>{session.title} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65">Course type
          <select value={courseType} onChange={(event) => setCourseType(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
            <option value="all">All types</option>{courseTypes.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65">Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
            <option value="all">All statuses</option><option value="booked">Booked</option><option value="attended">Checked in</option><option value="no_show">Absent</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65">From
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65">To
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/65 sm:col-span-2 xl:col-span-3">Search client or course
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, course, instructor…" className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool" />
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line shadow-sm shadow-sky-950/5">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-foam text-[11px] uppercase tracking-[0.12em] text-ink/65"><tr>{["Client", "Course", "Date & time", "Instructor", "Status", "Manage"].map((heading) => <th key={heading} scope="col" className="border-b border-line px-4 py-3.5 font-bold">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-line/80">
            {rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-ink/60">No bookings match these filters.</td></tr> : rows.map(({ session, person, date }) => (
              <tr key={`${session.id}-${person.id}`} className="align-middle transition-colors odd:bg-white even:bg-foam/35 hover:bg-sand/45">
                <td className="px-4 py-3.5"><p className="font-semibold text-ink">{person.customerName}</p><span className="mt-1 block text-xs text-ink/55">{person.customerEmail || "No email"}</span></td>
                <td className="px-4 py-3.5"><p className="font-semibold text-ink">{session.title}</p><span className="mt-1 block text-xs text-ink/55">{session.classTypeName}</span></td>
                <td className="whitespace-nowrap px-4 py-3.5">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}<span className="mt-1 block text-xs text-ink/55">{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</span></td>
                <td className="px-4 py-3.5">{session.instructor || "—"}</td>
                <td className="px-4 py-3.5"><span className="inline-flex min-w-24 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-ink/75">{person.status.replaceAll("_", " ")}</span></td>
                <td className="px-4 py-3.5"><div className="flex flex-nowrap gap-2">
                  {session.status === "cancelled" ? <span className="text-xs text-ink/55">Course cancelled</span> : <>
                    <BookingAction person={person} sessionId={session.id} value="attended" activeLabel="Checked in" label="Check in" />
                    <BookingAction person={person} sessionId={session.id} value="no_show" activeLabel="Absence" label="Absence" />
                    <button type="button" onClick={() => setCanceling({ bookingId: person.id, sessionId: session.id, customerName: person.customerName, courseTitle: session.title })} className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-ink/75 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/40">
                      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5"><path d="m4 4 8 8m0-8-8 8" /></svg>
                      Cancel
                    </button>
                  </>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink/60">{rows.length} {rows.length === 1 ? "booking" : "bookings"}</p>

      {canceling ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={(event) => { if (event.target === event.currentTarget) setCanceling(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-booking-title" aria-describedby="cancel-booking-description" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="cancel-booking-title" className="text-lg font-semibold text-ink">Cancel this booking?</h2>
            <p id="cancel-booking-description" className="mt-2 text-sm leading-6 text-ink/65">This will cancel {canceling.customerName}’s booking for {canceling.courseTitle} and return the credit.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCanceling(null)} className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink/75 transition hover:bg-slate-50">Keep booking</button>
              <form action={cancelBooking}>
                <input type="hidden" name="session_id" value={canceling.sessionId} />
                <input type="hidden" name="booking_id" value={canceling.bookingId} />
                <input type="hidden" name="return_to" value="/studio/check-in" />
                <button className="h-9 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85">Confirm cancel</button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function BookingAction({
  person,
  sessionId,
  value,
  label,
  activeLabel,
}: {
  person: Participant;
  sessionId: string;
  value: "attended" | "no_show";
  label: string;
  activeLabel: string;
}) {
  const active = person.status === value;
  return <form action={setBookingStatus}>
    <input type="hidden" name="session_id" value={sessionId} /><input type="hidden" name="booking_id" value={person.id} /><input type="hidden" name="status" value={active ? "booked" : value} /><input type="hidden" name="return_to" value="/studio/check-in" />
    <button aria-pressed={active} className={`inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/40 ${active ? value === "attended" ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-amber-300 bg-amber-100 text-amber-900" : "border-line bg-white text-ink/75 hover:bg-slate-50"}`}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
        {value === "attended" ? <path d="m3.5 8 3 3 6-6" /> : <><circle cx="8" cy="8" r="5.5" /><path d="M5.5 8h5" /></>}
      </svg>
      <span>{active ? activeLabel : label}</span>
    </button>
  </form>;
}
