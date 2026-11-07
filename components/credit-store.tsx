"use client";

import { useState } from "react";
import { placeCreditOrder } from "@/app/book/actions";
import type { Dictionary, Locale } from "@/lib/i18n";

type CreditPack = { id: string; name: string; credits: number; price: number; note: string };
type Stage = "shop" | "cart" | "payment";

function money(amount: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-SG", { style: "currency", currency: "SGD" }).format(amount / 100);
}

function isFinderModule(x: number, y: number, left: number, top: number) {
  const column = x - left;
  const row = y - top;
  if (column < 0 || column > 6 || row < 0 || row > 6) return null;
  return column === 0 || column === 6 || row === 0 || row === 6 || (column >= 2 && column <= 4 && row >= 2 && row <= 4);
}

function SampleQrCode({ locale }: { locale: Locale }) {
  const modules = Array.from({ length: 25 * 25 }, (_, index) => {
    const x = index % 25;
    const y = Math.floor(index / 25);
    const finder = isFinderModule(x, y, 0, 0) ?? isFinderModule(x, y, 18, 0) ?? isFinderModule(x, y, 0, 18);
    return finder ?? ((x * 7 + y * 11 + x * y * 3) % 9 < 4);
  });

  return (
    <svg aria-label={locale === "vi" ? "Mã QR mẫu trang trí" : "Decorative sample QR code"} role="img" viewBox="0 0 25 25" className="h-full w-full" shapeRendering="crispEdges">
      <rect width="25" height="25" fill="white" />
      {modules.map((filled, index) => filled ? <rect key={index} x={index % 25} y={Math.floor(index / 25)} width="1" height="1" fill="#111719" /> : null)}
    </svg>
  );
}

export function CreditStore({ packs, copy, locale }: { packs: CreditPack[]; copy: Dictionary["publicPages"]["credits"]; locale: Locale }) {
  const [stage, setStage] = useState<Stage>("shop");
  const [cart, setCart] = useState<Record<string, number>>({});
  const items = packs.flatMap((pack) => {
    const quantity = cart[pack.id] ?? 0;
    return quantity ? [{ pack, quantity }] : [];
  });
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const credits = items.reduce((sum, item) => sum + item.pack.credits * item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.pack.price * item.quantity, 0);
  const bestValuePackId = packs.length > 1
    ? packs.reduce((best, pack) => pack.price / pack.credits < best.price / best.credits ? pack : best).id
    : null;

  function add(packId: string) {
    setCart((current) => ({ ...current, [packId]: (current[packId] ?? 0) + 1 }));
    setStage("cart");
  }

  function setQuantity(packId: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[packId];
      else next[packId] = quantity;
      return next;
    });
  }

  return (
    <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-black/[0.08] bg-white shadow-sm">
      <div className="bg-[#111719] px-6 py-8 text-white sm:px-10 sm:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ff827c]">{copy.kicker}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold uppercase sm:text-5xl">{copy.title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">{copy.intro}</p>
        <ol aria-label={locale === "vi" ? "Tiến trình thanh toán" : "Checkout progress"} className="mt-7 flex max-w-lg items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {copy.progress.map((label, index) => {
            const active = ["shop", "cart", "payment"].indexOf(stage) >= index;
            return <li key={label} className="flex flex-1 items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#e10600] text-white" : "bg-white/10 text-white/45"}`}>{index + 1}</span><span className={active ? "text-white" : ""}>{label}</span>{index < 2 ? <span aria-hidden="true" className="h-px flex-1 bg-white/15" /> : null}</li>;
          })}
        </ol>
      </div>

      {stage === "shop" ? <div className="p-5 sm:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => <article key={pack.id} className={`relative flex flex-col rounded-2xl border p-5 ${pack.id === bestValuePackId ? "border-[#e10600]/35 bg-[#fff8f7]" : "border-black/10 bg-white"}`}>
            {pack.id === bestValuePackId ? <span className="absolute right-4 top-4 rounded-full bg-[#e10600] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">{copy.bestValue}</span> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e10600]">{pack.credits} {pack.credits === 1 ? copy.credit : copy.credits}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold uppercase">{pack.name}</h2>
            <p className="mt-2 min-h-10 text-xs leading-5 text-black/50">{pack.note}</p>
            <p className="mt-5 font-display text-3xl font-semibold">{money(pack.price, locale)}</p>
            <p className="mt-1 text-[11px] text-black/40">{money(Math.round(pack.price / pack.credits), locale)} / {copy.credit}</p>
            <button type="button" onClick={() => add(pack.id)} className="mt-6 rounded-full bg-[#e10600] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#c10500]">{copy.add} <span aria-hidden="true">+</span></button>
          </article>)}
        </div>
        {packs.length === 0 ? <p className="mt-5 rounded-xl bg-[#f7f8f8] px-4 py-3 text-xs leading-5 text-black/45">{copy.emptyPacks}</p> : <p className="mt-5 rounded-xl bg-[#f7f8f8] px-4 py-3 text-xs leading-5 text-black/45">{copy.confirmedAfter}</p>}
      </div> : null}

      {stage === "cart" ? <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex items-end justify-between border-b border-black/10 pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e10600]">{count} {count === 1 ? copy.item : copy.items}</p><h2 className="mt-1 font-display text-3xl font-semibold uppercase">{copy.cart}</h2></div><button type="button" onClick={() => setStage("shop")} className="text-xs font-semibold text-black/45 hover:text-[#e10600]">{copy.addMore}</button></div>
          {items.length ? <ul className="divide-y divide-black/[0.07]">{items.map(({ pack, quantity }) => <li key={pack.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h3 className="font-semibold">{pack.name}</h3><p className="mt-1 text-xs text-black/45">{pack.credits * quantity} {copy.credits} · {money(pack.price, locale)} / {copy.each}</p></div><div className="flex items-center gap-4"><div className="flex items-center rounded-full border border-black/10"><button type="button" aria-label={locale === "vi" ? `Xóa một ${pack.name}` : `Remove one ${pack.name}`} onClick={() => setQuantity(pack.id, quantity - 1)} className="h-9 w-9 text-lg text-black/55">−</button><span className="w-6 text-center text-sm font-semibold">{quantity}</span><button type="button" aria-label={locale === "vi" ? `Thêm một ${pack.name}` : `Add one ${pack.name}`} onClick={() => setQuantity(pack.id, quantity + 1)} className="h-9 w-9 text-lg text-black/55">+</button></div><span className="w-20 text-right text-sm font-semibold">{money(pack.price * quantity, locale)}</span></div></li>)}</ul> : <div className="py-12 text-center"><p className="text-sm text-black/50">{copy.emptyCart}</p><button type="button" onClick={() => setStage("shop")} className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#e10600]">{copy.browse}</button></div>}
        </div>
        <aside className="h-fit rounded-2xl bg-[#f7f8f8] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">{copy.summary}</p><div className="mt-5 flex justify-between text-sm text-black/55"><span>{copy.credits}</span><span>{credits}</span></div><div className="mt-3 flex justify-between border-t border-black/10 pt-4 text-base font-semibold"><span>{copy.total}</span><span>{money(total, locale)}</span></div><button type="button" disabled={!items.length} onClick={() => setStage("payment")} className="mt-5 w-full rounded-full bg-[#e10600] px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:bg-black/15">{copy.continue}</button><p className="mt-3 text-center text-[10px] leading-4 text-black/40">{copy.manualConfirm}</p></aside>
      </div> : null}

      {stage === "payment" ? <div className="px-5 py-8 sm:px-8 sm:py-10">
        <button type="button" onClick={() => setStage("cart")} className="text-xs font-semibold text-black/45 hover:text-[#e10600]">← {copy.cart}</button>
        <div className="mx-auto mt-5 max-w-4xl">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e10600]">Payment</p>
            <h2 className="mt-2 font-display text-3xl font-semibold uppercase sm:text-4xl">{copy.submit}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">{copy.instructionsIntro}</p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-2xl border border-black/10 bg-[#f7f8f8] p-5 text-center sm:p-6">
              <div className="mx-auto flex aspect-square w-full max-w-56 items-center justify-center rounded-xl bg-white p-3 shadow-sm">
                <SampleQrCode locale={locale} />
              </div>
              <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-800">{copy.sampleQr}</span>
              <p className="mt-3 text-xs leading-5 text-black/50">{copy.sampleWarning}</p>
            </div>

            <div className="rounded-2xl border border-black/10 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">{copy.total}</p>
                <p className="font-display text-2xl font-semibold">{money(total, locale)}</p>
              </div>
              <h3 className="mt-5 text-sm font-semibold">{copy.instructions}</h3>
              <ol className="mt-4 space-y-4">
                {copy.steps.map((step, index) => <li key={step} className="flex gap-3 text-xs leading-5 text-black/55"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff0ef] text-[10px] font-semibold text-[#e10600]">{index + 1}</span><span>{step}</span></li>)}
              </ol>
              <form action={placeCreditOrder} className="mt-6">
                <input type="hidden" name="items" value={JSON.stringify(items.map(({ pack, quantity }) => ({ id: pack.id, quantity })))} />
                <button className="w-full rounded-full bg-[#e10600] px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#c10500]">{copy.place} · {money(total, locale)}</button>
              </form>
            </div>
          </div>
        </div>
      </div> : null}
    </section>
  );
}
