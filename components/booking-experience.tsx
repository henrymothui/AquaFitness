"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { checkoutBookings } from "@/app/book/actions";
import type { ClassType, SessionView } from "@/lib/queries";
import type { Dictionary, Locale } from "@/lib/i18n";

function keyFor(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function creditWord(count: number, copy: Dictionary["publicPages"]["booking"]) {
  return `${count} ${count === 1 ? copy.credit : copy.credits}`;
}

export function BookingExperience({
  sessions,
  classes,
  counts,
  timezone,
  credits,
  memberName,
  error,
  notice,
  locale,
  copy,
}: {
  sessions: SessionView[];
  classes: ClassType[];
  counts: Record<string, number>;
  timezone: string;
  credits: number;
  memberName: string;
  error?: string;
  notice?: string;
  locale: Locale;
  copy: Dictionary["publicPages"]["booking"];
}) {
  const todayKey = keyFor(new Date(), timezone);
  const [monthDate, setMonthDate] = useState(() => {
    const [year, month] = todayKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [filter, setFilter] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const month = monthDate.getUTCMonth();
  const year = monthDate.getUTCFullYear();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const dateLocale = locale === "vi" ? "vi-VN" : "en";
  const monthLabel = new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate);
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

  const grouped = useMemo(() => {
    const map = new Map<string, SessionView[]>();
    for (const session of sessions) {
      const date = keyFor(new Date(session.startsAt), timezone);
      map.set(date, [...(map.get(date) ?? []), session]);
    }
    return map;
  }, [sessions, timezone]);

  const filtered = (grouped.get(selectedDate) ?? []).filter((session) => filter === "all" || session.classTypeId === filter);
  const cartSessions = cart.map((id) => sessions.find((session) => session.id === id)).filter((session): session is SessionView => Boolean(session));
  const cartCredits = cartSessions.reduce((sum, session) => sum + session.creditsRequired, 0);
  function changeMonth(delta: number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setMonthDate(next);
    const nextMonthKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    const firstDate = [...grouped.keys()].filter((date) => date.startsWith(nextMonthKey)).sort()[0];
    setSelectedDate(firstDate ?? `${nextMonthKey}-01`);
  }

  function addToCart(id: string) {
    setCart((current) => [...current, id]);
    setCartOpen(true);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#111719] text-white">
        <div aria-hidden="true" className="absolute -right-20 -top-44 -z-10 h-[32rem] w-[32rem] rounded-full border border-white/[0.08]" />
        <div aria-hidden="true" className="absolute -right-5 -top-28 -z-10 h-[22rem] w-[22rem] rounded-full border border-white/[0.08]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-gradient-to-l from-[#e10600]/15 via-transparent to-transparent" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ff827c]">{copy.kicker}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold uppercase leading-[0.92] tracking-wide sm:text-7xl">{copy.title}<br /><span className="text-white/55">{copy.titleAccent}</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/65">{copy.intro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-44 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e10600] text-lg" aria-hidden="true">◇</span>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{copy.creditsAvailable}</p><p className="mt-0.5 font-display text-2xl font-semibold">{credits}<span className="ml-1.5 text-xs font-normal text-white/50">{copy.ready}</span></p></div>
            </div>
            <button onClick={() => setCartOpen((open) => !open)} className="flex h-[4.25rem] items-center gap-3 rounded-2xl bg-white px-5 text-left text-black transition hover:bg-[#fff0ef]">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0ef] text-[#e10600]" aria-hidden="true">▢<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e10600] text-[9px] font-bold text-white">{cart.length}</span></span>
              <span><span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-black/45">{copy.yourBooking}</span><span className="block text-sm font-semibold">{cart.length ? `${cart.length} ${cart.length === 1 ? copy.class : copy.classesPlural} · ${creditWord(cartCredits, copy)}` : copy.nothingAdded}</span></span>
            </button>
            <Link href="/book-now/credits" className="flex h-[4.25rem] items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10">
              {copy.purchaseCredits} <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="h-1 bg-[#e10600]" />
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">
        {notice ? <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">✓ {notice}</div> : null}
        {error ? <div role="alert" className="mb-5 rounded-2xl border border-[#f1cfcd] bg-white px-5 py-4 text-sm font-medium text-[#a92620]">{error}</div> : null}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e10600]">{memberName.split(" ")[0]} · {copy.pickNext}</p><h2 className="mt-1 font-display text-3xl font-semibold uppercase text-black sm:text-4xl">{copy.findFlow}</h2></div>
          <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-black/55 shadow-sm">
            <span className="uppercase tracking-[0.14em]">{copy.courseType}</span>
            <select aria-label={copy.courseType} value={filter} onChange={(event) => setFilter(event.target.value)} className="max-w-40 cursor-pointer border-0 bg-transparent pr-5 text-sm font-semibold text-black outline-none">
              <option value="all">{copy.allClasses}</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          <section className="rounded-[1.5rem] border border-black/[0.08] bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">{copy.chooseDate}</p><h3 className="mt-1 font-display text-2xl font-semibold text-black">{monthLabel}</h3></div>
              <div className="flex gap-2"><button type="button" aria-label={copy.previousMonth} onClick={() => changeMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-lg text-black/60 transition hover:border-[#e10600] hover:text-[#e10600]">←</button><button type="button" aria-label={copy.nextMonth} onClick={() => changeMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-lg text-black/60 transition hover:border-[#e10600] hover:text-[#e10600]">→</button></div>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-black/35 sm:text-[10px]">{copy.weekdays.map((day) => <div key={day} className="pb-2.5">{day}</div>)}</div>
            <div className="grid grid-cols-7 overflow-hidden rounded-xl border-l border-t border-black/[0.07]">
              {Array.from({ length: offset }, (_, index) => <div key={`empty-${index}`} className="min-h-[4.2rem] border-b border-r border-black/[0.07] bg-[#fafafa] sm:min-h-[5.5rem]" />)}
              {Array.from({ length: dayCount }, (_, index) => {
                const date = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
                const daySessions = (grouped.get(date) ?? []).filter((session) => filter === "all" || session.classTypeId === filter);
                const active = selectedDate === date;
                return <button type="button" key={date} onClick={() => setSelectedDate(date)} className={`relative flex min-h-[4.2rem] flex-col items-center border-b border-r border-black/[0.07] px-1 py-2 transition sm:min-h-[5.5rem] ${active ? "bg-[#e10600] text-white" : "bg-white text-black hover:bg-[#fff6f5]"}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${date === todayKey && !active ? "bg-[#fff0ef] text-[#e10600]" : ""}`}>{index + 1}</span>
                  {daySessions.length > 0 ? <span className={`mt-1 text-[9px] font-medium ${active ? "text-white/75" : "text-black/40"}`}>{daySessions.length} {daySessions.length === 1 ? copy.class : copy.classesPlural}</span> : null}
                </button>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-black/40"><span>{copy.studioTime}</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e10600]" /> {copy.selectedDay}</span></div>
          </section>

          <section className="rounded-[1.5rem] border border-black/[0.08] bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-3 border-b border-black/[0.07] pb-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#e10600]">{new Intl.DateTimeFormat(dateLocale, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(dateFromKey(selectedDate))}</p><h3 className="mt-1 font-display text-2xl font-semibold uppercase text-black">{copy.onSchedule}</h3></div>
              <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-[10px] font-semibold text-black/50">{filtered.length} {filtered.length === 1 ? copy.class : copy.classesPlural}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-black/15 bg-[#fbfbfb] px-5 py-9 text-center"><span className="text-2xl text-black/25">◷</span><p className="mt-2 text-sm font-semibold text-black/70">{copy.noClasses}</p><p className="mt-1 text-xs text-black/40">{copy.chooseAnotherDate}</p></div> : filtered.map((session) => {
                const taken = counts[session.id] ?? 0;
                const spots = Math.max(0, session.capacity - taken);
                const inCart = cart.includes(session.id);
                return <article key={session.id} className="group overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition hover:border-black/15 hover:shadow-md">
                  <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                    <div className="flex w-[4.1rem] shrink-0 flex-col items-center justify-center rounded-xl bg-[#111719] px-2 py-3 text-center text-white sm:w-[4.5rem]">
                      <span className="font-display text-lg font-semibold leading-none">{new Intl.DateTimeFormat(dateLocale, { hour: "numeric", timeZone: timezone }).format(new Date(session.startsAt))}</span>
                      <span className="mt-1 text-[9px] font-medium uppercase tracking-wide text-white/55">{new Intl.DateTimeFormat(dateLocale, { minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: session.classTypeColor, backgroundColor: `${session.classTypeColor}1a` }}>{session.classTypeName}</span></div>
                      <h4 className="mt-2 truncate font-display text-xl font-semibold leading-tight text-black">{session.title}</h4>
                      <p className="mt-1 truncate text-xs text-black/50">{session.instructor || (locale === "vi" ? "Huấn luyện viên Hydrofit" : "Hydrofit coach")}{session.location ? ` · ${session.location}` : (locale === "vi" ? " · Hồ Hydrofit" : " · Hydrofit pool")}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-black/45"><span>{session.durationMinutes} {locale === "vi" ? "phút" : "min"}</span><span>·</span><span>{creditWord(session.creditsRequired, copy)}</span><span>·</span><span className={spots <= 3 ? "font-semibold text-[#d52e28]" : ""}>{spots ? `${spots} ${spots === 1 ? copy.spotLeft : copy.spotsLeft}` : copy.full}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#fbfbfb] px-3 py-2.5 sm:px-4">
                    <span className="text-[10px] text-black/40">{session.description || (locale === "vi" ? "Bài tập ít va đập với sự hỗ trợ của nước." : "A low-impact workout with the water working with you.")}</span>
                    <button type="button" disabled={!spots || inCart} onClick={() => addToCart(session.id)} className="shrink-0 rounded-full bg-[#e10600] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40">{inCart ? copy.added : spots ? copy.addClass : copy.full}</button>
                  </div>
                </article>;
              })}
            </div>
          </section>
        </div>

        {cartOpen && cart.length > 0 ? <div className="fixed inset-0 z-40 flex justify-end bg-black/35" onClick={() => setCartOpen(false)}>
          <aside aria-label={copy.yourBooking} onClick={(event) => event.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e10600]">{copy.readyWhen}</p><h2 className="mt-1 font-display text-3xl font-semibold uppercase text-black">{copy.yourBooking}</h2></div><button type="button" aria-label={locale === "vi" ? "Đóng lịch đặt" : "Close booking"} onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-xl text-black/60">×</button></div>
            <ul className="flex-1 divide-y divide-black/[0.07] overflow-y-auto px-6">
              {cartSessions.map((session) => <li key={session.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-black/80">{session.title}</p><p className="mt-1 text-xs text-black/45">{new Intl.DateTimeFormat(dateLocale, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(session.startsAt))}</p><p className="mt-1 text-[10px] text-black/40">{creditWord(session.creditsRequired, copy)}</p></div><button type="button" onClick={() => setCart((items) => items.filter((id) => id !== session.id))} className="rounded-full px-3 py-2 text-xs font-semibold text-black/45 hover:bg-[#fff0ef] hover:text-[#e10600]">{copy.remove}</button></li>)}
            </ul>
            <div className="border-t border-black/10 px-6 py-5">
              <div className="flex justify-between text-sm text-black/55"><span>{copy.classes}</span><span>{cart.length}</span></div>
              <div className="mt-2 flex justify-between text-sm font-semibold text-black"><span>{copy.creditsAfter}</span><span>{Math.max(credits - cartCredits, 0)} {copy.remaining}</span></div>
              {cartCredits > credits ? <p className="mt-3 rounded-xl bg-[#fff5e9] px-3 py-2 text-xs leading-5 text-[#9b5a13]">{copy.bookingNeeds.replace("{needed}", String(cartCredits)).replace("{available}", String(credits))}</p> : <p className="mt-3 text-xs leading-5 text-black/40">{copy.creditsUsedOnConfirm}</p>}
              <form action={checkoutBookings} className="mt-4">
                {cart.map((id) => <input key={id} type="hidden" name="session_id" value={id} />)}
                <button disabled={cartCredits > credits} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e10600] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:bg-black/15">{copy.confirm} <span aria-hidden="true">→</span></button>
              </form>
              <p className="mt-3 text-center text-[10px] text-black/35">{copy.noPayment}</p>
            </div>
          </aside>
        </div> : null}
      </div>
    </>
  );
}
