"use client";

import { useState } from "react";
import { updateCustomer } from "@/app/studio/actions";
import { Field, buttonClass, inputClass, quietButtonClass } from "@/components/ui";
import type { Customer } from "@/lib/queries";

type DirectoryCustomer = Customer & {
  username: string | null;
  joinedDate: string;
  creditsPurchased: number;
  creditsConsumed: number;
  liveCredits: number;
};

export function StudioCustomerDirectory({ customers }: { customers: DirectoryCustomer[] }) {
  const [editing, setEditing] = useState<DirectoryCustomer | null>(null);

  function close() {
    setEditing(null);
  }

  return (
    <>
      {customers.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">No customers have been registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
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
      )}

      {editing ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="customer-dialog-title">Edit customer</h2>
                <p className="mt-1 text-sm text-slate-500">Update this customer’s information.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form key={editing.id} action={updateCustomer} className="grid gap-4">
              <input type="hidden" name="id" value={editing.id} />
              <input type="hidden" name="return_to" value="/studio/directory" />
              <Field label="Name">
                <input name="full_name" required defaultValue={editing.full_name} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <select name="title" defaultValue={editing.title ?? ""} className={inputClass}>
                    <option value="">Select a title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                  </select>
                </Field>
                <Field label="Date of birth">
                  <input name="date_of_birth" type="date" defaultValue={editing.date_of_birth ?? ""} className={inputClass} />
                </Field>
              </div>
              <Field label="Address">
                <textarea name="address" rows={2} defaultValue={editing.address ?? ""} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input name="email" type="email" defaultValue={editing.email ?? ""} className={inputClass} />
                </Field>
                <Field label="Telephone">
                  <input name="phone" defaultValue={editing.phone ?? ""} className={inputClass} />
                </Field>
              </div>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={editing.notes ?? ""} className={inputClass} />
              </Field>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className={quietButtonClass}>Cancel</button>
                <button className={buttonClass}>Save customer</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
