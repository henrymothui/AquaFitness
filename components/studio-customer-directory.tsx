"use client";

import { useEffect, useState } from "react";
import { createCustomer, loadCustomerAdminEvents, updateCustomer } from "@/app/studio/actions";
import { ClientCreditTools, type CourseChoice } from "@/components/client-credit-tools";
import { Field, buttonClass, inputClass, quietButtonClass } from "@/components/ui";
import type { Customer, CustomerAdminEvent, DiscountPlan, GrantedDiscount } from "@/lib/queries";

const openAddCustomerEvent = "aqua:open-add-customer";

export function AddCustomerButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(openAddCustomerEvent))}
      className="inline-flex h-8 w-[8.75rem] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#c5dde6] bg-[#f3fafc] px-2.5 text-xs font-semibold text-[#155b78] transition hover:border-[#8ec3d4] hover:bg-[#e7f5f9]"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
        <path d="M10 4.75v10.5M4.75 10h10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Add customer
    </button>
  );
}

type DirectoryCustomer = Customer & {
  username: string | null;
  joinedDate: string;
  creditsPurchased: number;
  creditsConsumed: number;
  liveCredits: number;
};

export function StudioCustomerDirectory({
  customers,
  courses,
  timezone,
  searchQuery = "",
  emptyLabel = "No customers have been registered yet.",
  discountPlans = [],
  grantedDiscounts = [],
}: {
  customers: DirectoryCustomer[];
  courses: CourseChoice[];
  timezone: string;
  searchQuery?: string;
  emptyLabel?: string;
  discountPlans?: DiscountPlan[];
  grantedDiscounts?: GrantedDiscount[];
}) {
  const [editing, setEditing] = useState<DirectoryCustomer | null>(null);
  const [creating, setCreating] = useState(false);
  const [activity, setActivity] = useState<CustomerAdminEvent[] | null>(null);

  function close() {
    setEditing(null);
    setCreating(false);
  }

  useEffect(() => {
    const open = () => {
      setEditing(null);
      setCreating(true);
    };
    window.addEventListener(openAddCustomerEvent, open);
    return () => window.removeEventListener(openAddCustomerEvent, open);
  }, []);

  useEffect(() => {
    if (!editing) return;
    let ignore = false;
    setActivity(null);
    loadCustomerAdminEvents(editing.id).then((events) => {
      if (!ignore) setActivity(events);
    }).catch(() => {
      if (!ignore) setActivity([]);
    });
    return () => {
      ignore = true;
    };
  }, [editing]);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-[#edf0f2] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <form className="flex w-full items-center gap-2 sm:max-w-lg" action="/studio/directory">
          <input
            name="q"
            defaultValue={searchQuery}
            placeholder="Search name, email, or phone"
            aria-label="Search customers by name, email, or phone"
            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-pool focus:ring-2 focus:ring-pool/15"
          />
          <button className="inline-flex h-9 shrink-0 items-center rounded-lg border border-[#c5dde6] bg-[#f3fafc] px-3 text-xs font-semibold text-[#155b78] transition hover:border-[#8ec3d4] hover:bg-[#e7f5f9]">Search</button>
        </form>
        <span className="text-xs text-slate-400">Live credit reflects active, unexpired packs</span>
      </div>
      {customers.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <>
          <ul className="divide-y divide-[#edf0f2] md:hidden">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setEditing(customer)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition active:bg-slate-50"
                  aria-label={`Edit ${customer.full_name}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold leading-tight text-slate-800">
                      {[customer.title, customer.full_name].filter(Boolean).join(" ")}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {customer.phone || customer.email || "No contact"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex min-w-11 items-center justify-center rounded-full bg-[#eaf4f8] px-2 py-1 text-xs font-semibold text-[#155b78]">
                      {customer.liveCredits}
                    </span>
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-slate-300">
                      <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
                <col className="w-[160px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telephone</th>
                  <th className="px-4 py-3 text-right">Date joined</th>
                  <th className="px-4 py-3">Credits purchased</th>
                  <th className="px-4 py-3">Credits consumed</th>
                  <th className="px-5 py-3">Live credit</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} onClick={() => setEditing(customer)} className="cursor-pointer border-t border-[#edf0f2] transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setEditing(customer)}
                        className="text-left font-semibold text-slate-800 hover:text-lagoon focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-lagoon"
                        aria-label={`Edit ${customer.full_name}`}
                      >
                        {[customer.title, customer.full_name].filter(Boolean).join(" ")}
                      </button>
                      {customer.notes ? <p className="mt-1 max-w-sm truncate text-xs text-slate-400">{customer.notes}</p> : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{customer.username || "—"}</td>
                    <td className="break-words px-4 py-4 text-slate-600">{customer.email || "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{customer.phone || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-slate-600">{customer.joinedDate}</td>
                    <td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-600">{customer.creditsPurchased}</td>
                    <td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-600">{customer.creditsConsumed}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex min-w-14 items-center justify-center rounded-full bg-[#eaf4f8] px-2.5 py-1 font-semibold text-[#155b78]">
                        {customer.liveCredits}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {creating || editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:grid sm:place-items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="customer-dialog-title">{creating ? "Add customer" : "Edit customer"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {creating
                    ? "Add a client who does not need to register or sign in."
                    : "Update this customer’s information, credits, or course bookings. Changes are logged."}
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form key={creating ? "new-customer" : editing?.id} action={creating ? createCustomer : updateCustomer} className="grid gap-4">
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <input type="hidden" name="return_to" value={creating ? `/studio/directory` : "/studio/directory"} />
              <Field label="Name">
                <input name="full_name" required defaultValue={editing?.full_name ?? ""} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <select name="title" defaultValue={editing?.title ?? ""} className={inputClass}>
                    <option value="">Select a title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                  </select>
                </Field>
                <Field label="Date of birth">
                  <input name="date_of_birth" type="date" defaultValue={editing?.date_of_birth ?? ""} className={inputClass} />
                </Field>
              </div>
              <Field label="Address">
                <textarea name="address" rows={2} defaultValue={editing?.address ?? ""} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" hint={creating ? "Leave blank if this client will not sign in." : undefined}>
                  <input name="email" type="email" defaultValue={editing?.email ?? ""} className={inputClass} />
                </Field>
                <Field label="Telephone">
                  <input name="phone" defaultValue={editing?.phone ?? ""} className={inputClass} />
                </Field>
              </div>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={editing?.notes ?? ""} className={inputClass} />
              </Field>
              {creating ? (
                <>
                  <Field label="Starting credits" hint="Optional. Added credits are logged.">
                    <input name="opening_credits" type="number" min={0} max={500} step={1} defaultValue={0} className={inputClass} />
                  </Field>
                  <Field label="Credit note">
                    <input name="note" maxLength={160} className={inputClass} />
                  </Field>
                </>
              ) : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className={quietButtonClass}>Cancel</button>
                <button className={buttonClass}>{creating ? "Add customer" : "Save customer"}</button>
              </div>
            </form>
            {editing ? (
              <div className="mt-6 border-t border-line pt-6">
                <ClientCreditTools
                  customerId={editing.id}
                  liveCredits={editing.liveCredits}
                  courses={courses}
                  events={activity}
                  returnTo="/studio/directory"
                  timezone={timezone}
                  discountPlans={discountPlans}
                  grantedDiscount={grantedDiscounts.find((grant) => grant.customerId === editing.id) ?? null}
                />
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
