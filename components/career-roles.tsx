"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

export function CareerRoles({ copy }: { copy: Dictionary["careers"] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const role = open === null ? null : copy.roles[open];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <h2 className="mt-12 font-display text-3xl uppercase">{copy.rolesTitle}</h2>
      <ul className="mt-2 border-b border-black/10">
        {copy.roles.map((entry, index) => (
          <li key={entry.title} className="border-t border-black/10">
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="group flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">{entry.meta}</span>
                <span className="relative mt-1.5 block w-fit font-display text-xl font-medium! uppercase leading-none tracking-[0.06em]! transition-colors duration-200 group-hover:text-[#e10600] after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 group-hover:after:scale-x-100 md:text-2xl">
                  {entry.title}
                </span>
              </span>
              <span className="shrink-0 font-display text-sm uppercase tracking-[0.14em] text-black/55 transition-colors duration-200 group-hover:text-[#e10600]">
                {copy.details}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 backdrop:bg-black/60 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
        onClose={() => setOpen(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(null);
        }}
      >
        {role ? (
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white text-black shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="sticky top-0 z-10 flex justify-end bg-white/95 px-4 pt-4">
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label={copy.close}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f3] text-lg leading-none text-black hover:bg-[#e7e7e7]"
              >
                ×
              </button>
            </div>
            <div className="px-6 pt-1 pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">{role.meta}</p>
              <h2 id={titleId} className="mt-2 font-display text-2xl font-medium! uppercase leading-none tracking-[0.04em]! md:text-3xl">
                {role.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/75">{role.body}</p>
              {role.sections.map((section) => (
                <section key={section.title}>
                  <h3 className="mt-8 font-display text-2xl uppercase">{section.title}</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-black/75">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
              <h3 className="mt-8 font-display text-2xl uppercase">{role.noteTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-black/75">{role.note}</p>
              <div className="mt-8 border-t border-black/10 pt-6">
                <h3 className="font-display text-2xl uppercase">{copy.applyTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-black/70">{copy.applyBody}</p>
                <dl className="mt-5 grid gap-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{copy.phoneTitle}</dt>
                    <dd className="mt-1">
                      <a href={copy.phoneHref} className="underline decoration-black/25 underline-offset-4 hover:decoration-black">
                        {copy.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{copy.emailTitle}</dt>
                    <dd className="mt-1">
                      <a href={copy.emailHref} className="underline decoration-black/25 underline-offset-4 hover:decoration-black">
                        {copy.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{copy.visitTitle}</dt>
                    <dd className="mt-1 leading-6 text-black/75">{copy.address}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
