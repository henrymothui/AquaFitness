"use client";

import { useState } from "react";
import Link from "next/link";
import { createPackage, updatePackage } from "@/app/studio/actions";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { PackageView } from "@/lib/queries";

type ClassType = { id: string; name: string };

export function StudioPackages({
  packages,
  classes,
}: {
  packages: PackageView[];
  classes: ClassType[];
}) {
  const [editing, setEditing] = useState<PackageView | null>(null);
  const [adding, setAdding] = useState(false);
  const open = adding || editing !== null;
  const pack = editing;

  function close() {
    setAdding(false);
    setEditing(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Packages</h1>
          <p className="mt-2 text-sm text-slate-500">Manage class credits, pricing, and booking access.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonClass}>Add package</button>
      </div>

      {packages.length === 0 ? (
        <p className="rounded-xl border border-[#e5e9ed] bg-white p-6 text-sm text-slate-500">No packages yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-[#e5e9ed] bg-white">
              <div className="relative grid h-36 place-items-center bg-gradient-to-br from-lagoon to-pool text-white">
                <span className="font-display text-5xl font-semibold">{item.credit_count}</span>
                <span className="absolute bottom-3 text-xs font-semibold uppercase tracking-[0.16em]">Class credits</span>
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium ${item.active ? "bg-white text-emerald-700" : "bg-black/65 text-white"}`}>
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2>{item.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatMoney(item.price_cents)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditing(item)} className="rounded-lg border border-[#dce4e9] px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Quick edit</button>
                    <Link href={`/studio/package/${item.id}`} className="rounded-lg border border-[#dce4e9] px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Full editor</Link>
                  </div>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{item.description || "No description added."}</p>
                <div className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                  <p>{item.applies_to_all ? "Covers all classes" : item.classNames.join(", ") || "No classes selected"}</p>
                  <p>{item.validity_days ? `Valid for ${item.validity_days} days` : "No expiry"}</p>
                </div>
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
          <section role="dialog" aria-modal="true" aria-labelledby="package-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="package-dialog-title">{pack ? `Edit ${pack.name}` : "Add package"}</h2>
                <p className="mt-1 text-sm text-slate-500">Set the credits, price, and class access for this package.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form key={pack?.id ?? "new-package"} action={pack ? updatePackage : createPackage} className="grid gap-4">
              <input type="hidden" name="return_to" value="/studio/package" />
              {pack ? <input type="hidden" name="id" value={pack.id} /> : null}
              <Field label="Name">
                <input name="name" required defaultValue={pack?.name ?? ""} className={inputClass} placeholder="10 class pack" />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={3} defaultValue={pack?.description ?? ""} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Credits">
                  <input name="credit_count" type="number" min={1} max={200} defaultValue={pack?.credit_count ?? 10} required className={inputClass} />
                </Field>
                <Field label="Price (SGD)">
                  <input name="price" type="number" min={0} step="0.01" defaultValue={pack ? (pack.price_cents / 100).toFixed(2) : ""} required className={inputClass} />
                </Field>
                <Field label="Valid days" hint="Optional">
                  <input name="validity_days" type="number" min={1} defaultValue={pack?.validity_days ?? ""} className={inputClass} />
                </Field>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Covers</legend>
                <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                  {classes.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" name="class_type_ids" value={item.id} defaultChecked={Boolean(pack && !pack.applies_to_all && pack.classTypeIds.includes(item.id))} />
                      {item.name}
                    </label>
                  ))}
                  {classes.length === 0 ? <p className="text-sm text-slate-500">No active course types available.</p> : null}
                </div>
                <p className="mt-2 text-xs text-slate-500">Leave unchecked to cover every class.</p>
              </fieldset>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="active" defaultChecked={pack?.active ?? true} />
                Available for purchase
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button className={buttonClass}>{pack ? "Save changes" : "Add package"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
