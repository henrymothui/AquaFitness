"use client";

import { useState } from "react";
import { createDiscountPlan, updateDiscountPlan } from "@/app/studio/actions";
import { Field, buttonClass, inputClass } from "@/components/ui";
import type { DiscountPlan } from "@/lib/queries";

export function StudioDiscounts({ plans }: { plans: DiscountPlan[] }) {
  const [editing, setEditing] = useState<DiscountPlan | null>(null);
  const [adding, setAdding] = useState(false);
  const open = adding || editing !== null;
  const plan = editing;

  function close() {
    setAdding(false);
    setEditing(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Discount</h1>
          <p className="mt-2 text-sm text-slate-500">Create percentage packages, then grant one to a client. Their package price is reduced by that percentage.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonClass}>Add discount</button>
      </div>

      {plans.length === 0 ? (
        <p className="rounded-xl border border-[#e5e9ed] bg-white p-6 text-sm text-slate-500">No discount packages yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
              <div className="relative grid h-36 place-items-center bg-gradient-to-br from-lagoon to-pool text-white">
                <span className="font-display text-5xl font-semibold">{item.percent}%</span>
                <span className="absolute bottom-3 text-xs font-semibold uppercase tracking-[0.16em]">Off package price</span>
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium ${item.active ? "bg-white text-emerald-700" : "bg-black/65 text-white"}`}>
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <h2>{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.active ? "Can be granted to clients" : "Not applied to new sales"}</p>
                </div>
                <button type="button" onClick={() => setEditing(item)} className="inline-flex h-9 shrink-0 items-center rounded-lg border border-[#dce4e9] px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 md:h-auto md:py-1.5">Edit</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:grid sm:place-items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="discount-dialog-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="discount-dialog-title">{plan ? `Edit ${plan.name}` : "Add discount"}</h2>
                <p className="mt-1 text-sm text-slate-500">Name the package and set the percentage taken off a client’s package price.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form key={plan?.id ?? "new-discount"} action={plan ? updateDiscountPlan : createDiscountPlan} className="grid gap-4">
              <input type="hidden" name="return_to" value="/studio/pricing/discount" />
              {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
              <Field label="Name">
                <input name="name" required defaultValue={plan?.name ?? ""} className={inputClass} placeholder="Staff" />
              </Field>
              <Field label="Discount percentage" hint="Whole number from 1 to 100.">
                <input name="percent" type="number" min={1} max={100} step={1} required defaultValue={plan?.percent ?? 10} className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} />
                Available to grant
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button className={buttonClass}>{plan ? "Save changes" : "Add discount"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
