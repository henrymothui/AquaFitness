"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type ClassCard = {
  name: string;
  minutes: string;
  level: string;
  body: string;
  summary: string;
  exercises: readonly string[];
  image: string;
};

export type ClassPrices = {
  single: string | null;
  pack: string | null;
};

const BOOKING_HREF = "/book-now";

export function ClassCatalog({
  items,
  prices,
  workout,
  book,
  close,
  singleLabel,
  packLabel,
}: {
  items: readonly ClassCard[];
  prices: ClassPrices;
  workout: string;
  book: string;
  close: string;
  singleLabel: string;
  packLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const item = open === null ? null : items[open];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <ul className="mt-12 grid gap-10">
        {items.map((entry, index) => (
          <li key={entry.name} className="border-t border-black/10 pt-8">
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="grid w-full items-center gap-6 text-left md:grid-cols-[20rem_1fr]"
            >
              <div className="relative aspect-video overflow-hidden bg-[#eee]">
                <Image src={entry.image} alt="" fill sizes="20rem" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">
                  {entry.minutes} · {entry.level}
                </p>
                <h2 className="mt-2 font-display text-4xl uppercase">{entry.name}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">{entry.body}</p>
                <PricePair prices={prices} singleLabel={singleLabel} packLabel={packLabel} />
              </div>
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
        {item ? (
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white text-black shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="relative h-52 bg-[#eee]">
              <Image src={item.image} alt="" fill sizes="32rem" className="object-cover" />
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label={close}
                className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-lg leading-none text-black shadow-sm hover:bg-white"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e10600]">
                {item.minutes} · {item.level}
              </p>
              <h2 id={titleId} className="mt-2 font-display text-4xl uppercase">
                {item.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/70">{item.summary}</p>
              <PricePair prices={prices} singleLabel={singleLabel} packLabel={packLabel} />
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">{workout}</h3>
              <ul className="mt-3 grid gap-2">
                {item.exercises.map((exercise) => (
                  <li key={exercise} className="text-sm leading-6 text-black/80">
                    {exercise}
                  </li>
                ))}
              </ul>
              <Link
                href={BOOKING_HREF}
                className="mt-6 inline-flex w-full justify-center rounded-full bg-[#e10600] px-5 py-3 font-display text-sm uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
              >
                {book}
              </Link>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

export function PricePair({
  prices,
  singleLabel,
  packLabel,
}: {
  prices: ClassPrices;
  singleLabel: string;
  packLabel: string;
}) {
  if (!prices.single && !prices.pack) return null;
  return (
    <div className="mt-5 flex gap-3">
      {prices.single ? (
        <p className="min-w-28 rounded-2xl border border-black/10 px-4 py-3">
          <span className="block font-display text-2xl leading-none">{prices.single}</span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{singleLabel}</span>
        </p>
      ) : null}
      {prices.pack ? (
        <p className="min-w-28 rounded-2xl bg-black px-4 py-3 text-white">
          <span className="block font-display text-2xl leading-none">{prices.pack}</span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">{packLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
