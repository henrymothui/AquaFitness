"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { cancelMemberBooking } from "@/app/account/actions";
import { updateMemberProfile, type ProfileActionState } from "@/app/account/actions";
import type { CreditOrderView, SaleView } from "@/lib/queries";
import { creditsLabel, formatDay, formatMoney, formatTime, formatWhen } from "@/lib/format";

type Booking = {
  id: string;
  status: string;
  creditsUsed: number;
  startsAt: string | null;
  title: string;
  canCancel: boolean;
};

type TabKey = "overview" | "profile" | "orders";

const tabs: { id: TabKey; label: string }[] = [
  { id: "overview", label: "Credits & classes" },
  { id: "profile", label: "Personal information" },
  { id: "orders", label: "Order history" },
];

const initialProfileState: ProfileActionState = { status: null, message: "" };
const cardClass = "rounded-2xl border border-black/10 bg-white p-5 shadow-[0_18px_44px_-34px_rgba(0,0,0,0.28)] sm:p-6";

function StatusPill({ status }: { status: string }) {
  const tone = status === "booked" || status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "rejected"
      ? "border-rose-200 bg-rose-50 text-rose-700"
    : status === "cancelled" || status === "expired" || status === "exhausted"
      ? "border-black/10 bg-black/[0.04] text-black/55"
      : "border-amber-200 bg-amber-50 text-amber-700";

  const label = status === "attended" ? "Checked in" : status === "no_show" ? "Absent" : status.replaceAll("_", " ");

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${tone}`}>{label}</span>;
}

function SectionTitle({ kicker, title, aside }: { kicker: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/[0.08] pb-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#e10600]">{kicker}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide text-black">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

function EmptyState({ title, description, link }: { title: string; description: string; link?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-[#fafafa] px-5 py-9 text-center">
      <p className="font-display text-xl font-semibold text-black/80">{title}</p>
      <p className="mt-1 text-sm text-black/50">{description}</p>
      {link ? <Link href={link.href} className="mt-4 inline-flex rounded-full bg-[#e10600] px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#c10500]">{link.label}</Link> : null}
    </div>
  );
}

export function AccountTabs({
  initialTab = "overview",
  memberName,
  title,
  dateOfBirth,
  address,
  email,
  phone,
  creditsAvailable,
  creditsConsumed,
  sales,
  creditOrders,
  bookings,
  timezone,
}: {
  initialTab?: TabKey;
  memberName: string;
  title: "Mr" | "Mrs" | null;
  dateOfBirth: string | null;
  address: string | null;
  email: string;
  phone: string | null;
  creditsAvailable: number;
  creditsConsumed: number;
  sales: SaleView[];
  creditOrders: CreditOrderView[];
  bookings: Booking[];
  timezone: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [profileState, profileAction, pending] = useActionState(updateMemberProfile, initialProfileState);
  const [selectedTitle, setSelectedTitle] = useState(title ?? "");
  const orderedBookings = [...bookings].sort((a, b) => {
    if (!a.startsAt) return 1;
    if (!b.startsAt) return -1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_55px_-36px_rgba(0,0,0,0.4)]">
        <div className="relative isolate min-h-[210px] overflow-hidden bg-[#101719] px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="absolute inset-0 -z-20 bg-[url('/brand/banner.jpg')] bg-cover bg-[center_42%]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/35 to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ff827c]">Hydrofit · Member account</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-display text-4xl font-semibold uppercase leading-[0.95] tracking-[0.07em] sm:text-5xl">Welcome back,<br className="sm:hidden" /> {memberName.split(" ")[0]}.</h1>
              <p className="mt-3 max-w-xl text-sm text-white/75">Your classes, credits, and member details, together in one place.</p>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto border-t border-black/10 px-3 sm:px-6" role="tablist" aria-label="Account sections">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`account-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`account-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 px-3 py-4 font-display text-xs font-semibold uppercase tracking-[0.1em] transition sm:px-5 ${active ? "text-black" : "text-black/45 hover:text-black/75"}`}
              >
                {tab.label}
                <span className={`absolute inset-x-3 bottom-0 h-[2px] transition sm:inset-x-5 ${active ? "bg-[#e10600]" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <section
        id={`account-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`account-tab-${activeTab}`}
        className="outline-none"
        key={activeTab}
      >
        {activeTab === "overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="relative isolate overflow-hidden rounded-2xl bg-[#11191b] p-5 text-white shadow-lg shadow-black/10 sm:p-6">
                <div aria-hidden="true" className="absolute -right-14 -top-20 -z-10 h-56 w-56 rounded-full border border-white/10" />
                <div aria-hidden="true" className="absolute -right-5 -top-11 -z-10 h-36 w-36 rounded-full border border-white/10" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Credits available</p>
                <p className="mt-4 font-display text-5xl font-semibold tabular-nums">{creditsAvailable}</p>
                <p className="mt-1 text-sm text-white/55">Ready for your next class</p>
              </article>
              <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Credits consumed</p>
                <p className="mt-4 font-display text-5xl font-semibold tabular-nums text-black">{creditsConsumed}</p>
                <p className="mt-1 text-sm text-black/50">Used across your packages</p>
              </article>
            </div>

            <section className={cardClass}>
              <SectionTitle kicker="On your calendar" title="Class schedule" />
              {orderedBookings.length === 0 ? (
                <div className="mt-5"><EmptyState title="No classes registered" description="Your booked classes will appear here." link={{ href: "/book", label: "Find a class" }} /></div>
              ) : (
                <ul className="mt-1 divide-y divide-black/[0.07]">
                  {orderedBookings.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-4 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-black/85">{booking.title}</p>
                        {booking.startsAt ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f1cfcd] bg-[#fff3f2] px-3 py-1.5 text-xs font-semibold text-[#b32620]">
                              <span aria-hidden="true">◷</span>{formatDay(booking.startsAt, timezone)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e10600] px-3 py-1.5 text-xs font-semibold tabular-nums text-white">
                              <span aria-hidden="true">◷</span>{formatTime(booking.startsAt, timezone)}
                            </span>
                          </div>
                        ) : <p className="mt-1 text-xs text-black/50">Date to be confirmed</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill status={booking.status} />
                        {booking.canCancel ? (
                          <form action={cancelMemberBooking}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <button className="text-xs font-semibold text-[#b32620] underline-offset-4 hover:underline">Cancel class</button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "profile" ? (
          <section className={`w-full ${cardClass}`}>
            <SectionTitle kicker="Member profile" title="Personal information" />
            <form action={profileAction} className="mt-5 grid gap-5">
              <fieldset className="grid gap-2 text-sm font-medium text-black/70">
                <legend>Title</legend>
                <div className="flex flex-wrap gap-3">
                  {(["Mr", "Mrs"] as const).map((option) => (
                    <label key={option} className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-black/15 bg-white px-4 py-3 transition hover:border-black/30 has-[:checked]:border-[#e10600] has-[:checked]:bg-[#fff8f7]">
                      <input
                        type="checkbox"
                        name="title"
                        value={option}
                        checked={selectedTitle === option}
                        onChange={(event) => setSelectedTitle(event.target.checked ? option : "")}
                        className="size-4 accent-[#e10600]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Full name
                <input name="full_name" required maxLength={120} defaultValue={memberName} className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Email address
                <input type="email" value={email} readOnly aria-describedby="email-help" className="w-full cursor-not-allowed rounded-xl border border-black/10 bg-black/[0.035] px-4 py-3 text-sm text-black/55 outline-none" />
                <span id="email-help" className="text-xs font-normal text-black/45">Email is linked to your member sign-in. Contact the studio to change it.</span>
              </label>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Date of birth
                <input name="date_of_birth" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={dateOfBirth ?? ""} className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Address
                <textarea name="address" rows={3} maxLength={300} defaultValue={address ?? ""} placeholder="Add your address" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-black/70">
                Phone number
                <input name="phone" type="tel" maxLength={40} defaultValue={phone ?? ""} placeholder="Add a phone number" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10" />
              </label>
              {profileState.message ? (
                <p role={profileState.status === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${profileState.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{profileState.message}</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-5">
                <p className="max-w-sm text-xs leading-5 text-black/45">Your saved profile information is shared with the Hydrofit studio team.</p>
                <button disabled={pending} className="inline-flex min-w-36 justify-center rounded-full bg-[#e10600] px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#c10500] disabled:cursor-wait disabled:opacity-60">
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === "orders" ? (
          <section className={cardClass}>
            <SectionTitle kicker="Purchase history" title="Order history" aside={<Link href="/packages" className="text-xs font-semibold text-black/55 transition hover:text-[#e10600]">View packages <span aria-hidden="true">→</span></Link>} />
            {sales.length === 0 && creditOrders.length === 0 ? (
              <div className="mt-5"><EmptyState title="No orders yet" description="Your package purchases will appear here." link={{ href: "/packages", label: "Explore packages" }} /></div>
            ) : (
              <ul className="mt-1 divide-y divide-black/[0.07]">
                {creditOrders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4 first:pt-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black/85">{order.packageName}</p>
                      <p className="mt-1 text-xs text-black/50">{formatWhen(order.createdAt, timezone)} · {order.creditsTotal} credits · {order.quantity} {order.quantity === 1 ? "pack" : "packs"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={order.status} />
                      <span className="text-sm font-semibold tabular-nums text-black/80">{formatMoney(order.priceCents)}</span>
                    </div>
                  </li>
                ))}
                {sales.map((sale) => (
                  <li key={sale.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4 first:pt-5 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black/85">{sale.packageName}</p>
                      <p className="mt-1 text-xs text-black/50">{formatWhen(sale.purchasedAt, timezone)} · {creditsLabel(sale.creditsUsed, sale.creditsTotal)} credits</p>
                      {sale.expiresAt ? <p className="mt-1 text-[11px] text-black/40">Expires {formatWhen(sale.expiresAt, timezone)}</p> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={sale.status} />
                      <span className="text-sm font-semibold tabular-nums text-black/80">{formatMoney(sale.finalPriceCents)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </section>
    </>
  );
}
