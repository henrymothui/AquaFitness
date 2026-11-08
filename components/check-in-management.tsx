"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking, enrollCustomer, setBookingStatus } from "@/app/studio/actions";
import { startPageLoading } from "@/components/page-loading";
import { ExportLink } from "@/components/ui";
import type { SessionView } from "@/lib/queries";

type Participant = {
  id: string;
  sessionId: string;
  status: string;
  customerName: string;
  customerEmail: string;
  statusSetBy: string | null;
  statusSetAt: string | null;
};

function actionLabel(status: string) {
  if (status === "attended") return "Checked in";
  if (status === "no_show") return "Marked absent";
  return "Cleared";
}

export function CheckInManagement({
  sessions,
  participants,
  courseId,
  timezone,
  assignedOnly = false,
  canAddClients = false,
  clients = [],
}: {
  sessions: SessionView[];
  participants: Participant[];
  courseId: string;
  timezone: string;
  assignedOnly?: boolean;
  canAddClients?: boolean;
  clients?: { id: string; name: string; credits: number }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [canceling, setCanceling] = useState<{ bookingId: string; sessionId: string; customerName: string; courseTitle: string } | null>(null);

  const rows = useMemo(() => {
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const query = search.trim().toLocaleLowerCase();
    return participants.flatMap((person) => {
      const session = sessionById.get(person.sessionId);
      if (!session || !courseId || session.id !== courseId) return [];
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(session.startsAt));
      if (status !== "all" && person.status !== status) return [];
      if (query && ![person.customerName, person.customerEmail].some((value) => value.toLocaleLowerCase().includes(query))) return [];
      return [{ session, person, date }];
    }).sort((a, b) => a.person.customerName.localeCompare(b.person.customerName));
  }, [sessions, participants, timezone, courseId, status, search]);

  const courseOptions = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const selectedCourse = sessions.find((session) => session.id === courseId) ?? null;
  const returnTo = courseId ? `/studio/check-in?course=${courseId}` : "/studio/check-in";
  const moreFiltersActive = status !== "all";

  function recordedBy(person: Participant) {
    if (!person.statusSetBy || !person.statusSetAt) return null;
    return `${actionLabel(person.status)} by ${person.statusSetBy} · ${stamp(person.statusSetAt)}`;
  }

  function selectCourse(id: string) {
    startPageLoading();
    router.replace(id ? `/studio/check-in?course=${id}` : "/studio/check-in");
  }

  function stamp(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date(value));
  }
  const checkedIn = rows.filter(({ person }) => person.status === "attended").length;
  const absent = rows.filter(({ person }) => person.status === "no_show").length;
  const bookedOnCourse = participants.filter((person) => person.sessionId === courseId).length;
  const courseOpen = Boolean(selectedCourse && selectedCourse.status === "scheduled" && bookedOnCourse < selectedCourse.capacity);

  return (
    <section className="grid gap-4 rounded-xl border border-[#e5e9ed] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Course attendance</h2>
          <p className="mt-1 text-sm text-ink/60">
            {selectedCourse
              ? `${checkedIn} checked in · ${absent} absent · ${rows.length} booked`
              : assignedOnly && sessions.length === 0
                ? "No courses are assigned to you yet."
                : "Choose one course before checking anyone in."}
          </p>
        </div>
        <ExportLink href="/studio/check-in/export">Export all</ExportLink>
      </div>

      <div className="grid gap-3 md:hidden">
        <label className="grid gap-1 text-xs font-medium text-ink/65">Course
          <select value={courseId} onChange={(event) => selectCourse(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-pool">
            <option value="">Select a course</option>
            {courseOptions.map((session) => <option key={session.id} value={session.id}>{session.title} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</option>)}
          </select>
        </label>
        {selectedCourse ? (
          <>
            <div className="flex gap-2">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client" aria-label="Search client" className="min-w-0 flex-1 rounded-lg border border-line px-3 py-3 text-sm text-ink outline-none focus:border-pool" />
              <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className={`shrink-0 rounded-lg border px-3 py-3 text-sm font-semibold transition ${moreFiltersActive ? "border-pool/40 bg-[#eaf4f8] text-[#155b78]" : "border-line bg-white text-ink/75"}`}>
                Filters{moreFiltersActive ? " •" : ""}
              </button>
            </div>
            {filtersOpen ? (
              <div className="grid gap-3 rounded-xl border border-line bg-foam/50 p-3">
                <label className="grid gap-1 text-xs font-medium text-ink/65">Status
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
                    <option value="all">All statuses</option><option value="booked">Booked</option><option value="attended">Checked in</option><option value="no_show">Absent</option>
                  </select>
                </label>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={`hidden gap-3 md:grid ${selectedCourse ? "md:grid-cols-3" : ""}`}>
        <label className="grid gap-1 text-xs font-medium text-ink/65">Course
          <select value={courseId} onChange={(event) => selectCourse(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
            <option value="">Select a course</option>
            {courseOptions.map((session) => <option key={session.id} value={session.id}>{session.title} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</option>)}
          </select>
        </label>
        {selectedCourse ? (
          <>
            <label className="grid gap-1 text-xs font-medium text-ink/65">Status
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool">
                <option value="all">All statuses</option><option value="booked">Booked</option><option value="attended">Checked in</option><option value="no_show">Absent</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-ink/65">Search client
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-pool" />
            </label>
          </>
        ) : null}
      </div>

      {canAddClients && selectedCourse ? (
        <form action={enrollCustomer} className="grid gap-3 rounded-xl border border-line bg-foam/40 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <input type="hidden" name="session_id" value={selectedCourse.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="grid gap-1 text-xs font-medium text-ink/65">
            Add a client
            <select name="customer_id" required disabled={!courseOpen || clients.length === 0} className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pool disabled:bg-slate-50">
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} · {client.credits} credits</option>
              ))}
            </select>
          </label>
          <button disabled={!courseOpen || clients.length === 0} className="h-10 rounded-lg bg-lagoon px-4 text-sm font-semibold text-white transition hover:bg-tide disabled:cursor-not-allowed disabled:opacity-50">
            Add to course
          </button>
          <p className="text-xs text-ink/55 sm:col-span-2">
            {selectedCourse.status !== "scheduled"
              ? "This course is cancelled."
              : !courseOpen
                ? "This course is full."
                : `Uses ${selectedCourse.creditsRequired} credit${selectedCourse.creditsRequired === 1 ? "" : "s"}. The client does not need an account. The booking and credit are logged.`}
          </p>
        </form>
      ) : null}

      <div className="md:hidden">
        {!selectedCourse ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">{assignedOnly && sessions.length === 0 ? "No courses are assigned to you yet." : "Select a course to see who needs check-in."}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">No bookings match these filters.</p>
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
            {rows.map(({ session, person }) => {
              const approval = recordedBy(person);
              return (
              <li key={`${session.id}-${person.id}`} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight text-ink">{person.customerName}</p>
                  {approval ? <p className="mt-0.5 truncate text-[11px] text-ink/55">{approval}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {session.status === "cancelled" ? (
                    <span className="text-[11px] text-ink/55">Cancelled</span>
                  ) : (
                    <>
                      <BookingAction person={person} sessionId={session.id} value="attended" activeLabel="In" label="Check in" returnTo={returnTo} compact />
                      <BookingAction person={person} sessionId={session.id} value="no_show" activeLabel="Absent" label="Absent" returnTo={returnTo} compact />
                    </>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line shadow-sm shadow-sky-950/5 md:block">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead className="bg-foam text-[11px] uppercase tracking-[0.12em] text-ink/65"><tr>{["Client", "Course", "Date & time", "Coach", "Status", "Manage"].map((heading) => <th key={heading} scope="col" className="border-b border-line px-4 py-3.5 font-bold">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-line/80">
            {!selectedCourse ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-ink/60">{assignedOnly && sessions.length === 0 ? "No courses are assigned to you yet." : "Select a course to see who needs check-in."}</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-ink/60">No bookings match these filters.</td></tr> : rows.map(({ session, person, date }) => (
              <tr key={`${session.id}-${person.id}`} className="align-middle transition-colors odd:bg-white even:bg-foam/35 hover:bg-sand/45">
                <td className="px-4 py-3.5"><p className="font-semibold text-ink">{person.customerName}</p><span className="mt-1 block text-xs text-ink/55">{person.customerEmail || "No email"}</span>{recordedBy(person) ? <span className="mt-1 block text-xs text-ink/55">{recordedBy(person)}</span> : null}</td>
                <td className="px-4 py-3.5"><p className="font-semibold text-ink">{session.title}</p><span className="mt-1 block text-xs text-ink/55">{session.classTypeName}</span></td>
                <td className="whitespace-nowrap px-4 py-3.5">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}<span className="mt-1 block text-xs text-ink/55">{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</span></td>
                <td className="px-4 py-3.5">{session.instructor || "—"}</td>
                <td className="px-4 py-3.5"><span className="inline-flex min-w-24 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-ink/75">{person.status.replaceAll("_", " ")}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-nowrap items-center gap-1.5">
                    {session.status === "cancelled" ? <span className="text-xs text-ink/55">Course cancelled</span> : <>
                      <BookingAction person={person} sessionId={session.id} value="attended" activeLabel="Checked in" label="Check in" returnTo={returnTo} iconOnly />
                      <BookingAction person={person} sessionId={session.id} value="no_show" activeLabel="Absence" label="Absence" returnTo={returnTo} iconOnly />
                      <Tip label="Cancel booking">
                        <button type="button" aria-label={`Cancel booking for ${person.customerName}`} onClick={() => setCanceling({ bookingId: person.id, sessionId: session.id, customerName: person.customerName, courseTitle: session.title })} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink/75 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/40">
                          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5"><path d="m4 4 8 8m0-8-8 8" /></svg>
                        </button>
                      </Tip>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCourse ? <p className="hidden text-sm text-ink/60 md:block">{rows.length} {rows.length === 1 ? "booking" : "bookings"}</p> : null}

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
                <input type="hidden" name="return_to" value={returnTo} />
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
  returnTo,
  compact = false,
  iconOnly = false,
}: {
  person: Participant;
  sessionId: string;
  value: "attended" | "no_show";
  label: string;
  activeLabel: string;
  returnTo: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const active = person.status === value;
  const text = active ? activeLabel : label;
  const button = <button
    aria-pressed={active}
    aria-label={`${text} for ${person.customerName}`}
    className={`inline-flex shrink-0 items-center justify-center rounded-lg border font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/40 ${iconOnly ? "h-8 w-8" : compact ? "h-10 gap-1 px-2 text-[11px]" : "h-8 w-28 gap-1 px-2 text-xs"} ${active ? value === "attended" ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-amber-300 bg-amber-100 text-amber-900" : "border-line bg-white text-ink/75 hover:bg-slate-50"}`}
  >
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${compact ? "h-4 w-4" : "h-3.5 w-3.5"}`}>
      {value === "attended" ? <path d="m3.5 8 3 3 6-6" /> : <><circle cx="8" cy="8" r="5.5" /><path d="M5.5 8h5" /></>}
    </svg>
    <span className={iconOnly || compact ? "sr-only" : ""}>{text}</span>
  </button>;
  return <form action={setBookingStatus}>
    <input type="hidden" name="session_id" value={sessionId} />
    <input type="hidden" name="booking_id" value={person.id} />
    <input type="hidden" name="status" value={active ? "booked" : value} />
    <input type="hidden" name="return_to" value={returnTo} />
    {iconOnly ? <Tip label={active ? `${text} · click to clear` : text}>{button}</Tip> : button}
  </form>;
}

function Tip({ label, children }: { label: string; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  function show() {
    const rect = anchor.current?.getBoundingClientRect();
    if (!rect) return;
    const half = 56;
    const left = Math.min(Math.max(rect.left + rect.width / 2, half), window.innerWidth - half);
    setPosition({ left, top: rect.top - 7 });
  }

  function hide() {
    setPosition(null);
  }

  useEffect(() => {
    if (!position) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [position]);

  return (
    <span ref={anchor} className="inline-flex" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {position ? (
        <span
          role="tooltip"
          style={{ left: position.left, top: position.top }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold leading-none text-white shadow-lg shadow-sky-950/25"
        >
          {label}
          <span aria-hidden="true" className="absolute left-1/2 top-full -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-ink" />
        </span>
      ) : null}
    </span>
  );
}
