"use client";

import { useState } from "react";
import { placeCreditOrder } from "@/app/book/actions";

type CreditPack = { id: string; name: string; credits: number; price: number; note: string };
type Stage = "shop" | "cart" | "payment";

function money(amount: number) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(amount / 100);
}

export function CreditStore({ packs }: { packs: CreditPack[] }) {
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ff827c]">Hydrofit · Credit packs</p>
        <h1 className="mt-3 font-display text-4xl font-semibold uppercase sm:text-5xl">Top up your credits</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Choose a pack and submit your order. The studio will confirm payment manually before adding credits.</p>
        <ol aria-label="Checkout progress" className="mt-7 flex max-w-lg items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {["Choose credits", "Your cart", "Payment"].map((label, index) => {
            const active = ["shop", "cart", "payment"].indexOf(stage) >= index;
            return <li key={label} className="flex flex-1 items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#e10600] text-white" : "bg-white/10 text-white/45"}`}>{index + 1}</span><span className={active ? "text-white" : ""}>{label}</span>{index < 2 ? <span aria-hidden="true" className="h-px flex-1 bg-white/15" /> : null}</li>;
          })}
        </ol>
      </div>

      {stage === "shop" ? <div className="p-5 sm:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => <article key={pack.id} className={`relative flex flex-col rounded-2xl border p-5 ${pack.id === bestValuePackId ? "border-[#e10600]/35 bg-[#fff8f7]" : "border-black/10 bg-white"}`}>
            {pack.id === bestValuePackId ? <span className="absolute right-4 top-4 rounded-full bg-[#e10600] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">Best value</span> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e10600]">{pack.credits} {pack.credits === 1 ? "credit" : "credits"}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold uppercase">{pack.name}</h2>
            <p className="mt-2 min-h-10 text-xs leading-5 text-black/50">{pack.note}</p>
            <p className="mt-5 font-display text-3xl font-semibold">{money(pack.price)}</p>
            <p className="mt-1 text-[11px] text-black/40">{money(Math.round(pack.price / pack.credits))} per credit</p>
            <button type="button" onClick={() => add(pack.id)} className="mt-6 rounded-full bg-[#e10600] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#c10500]">Add to cart <span aria-hidden="true">+</span></button>
          </article>)}
        </div>
        {packs.length === 0 ? <p className="mt-5 rounded-xl bg-[#f7f8f8] px-4 py-3 text-xs leading-5 text-black/45">There are no credit packs available right now.</p> : <p className="mt-5 rounded-xl bg-[#f7f8f8] px-4 py-3 text-xs leading-5 text-black/45">Credits are added after the studio confirms your payment.</p>}
      </div> : null}

      {stage === "cart" ? <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex items-end justify-between border-b border-black/10 pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e10600]">{count} {count === 1 ? "item" : "items"}</p><h2 className="mt-1 font-display text-3xl font-semibold uppercase">Your cart</h2></div><button type="button" onClick={() => setStage("shop")} className="text-xs font-semibold text-black/45 hover:text-[#e10600]">Add more credits</button></div>
          {items.length ? <ul className="divide-y divide-black/[0.07]">{items.map(({ pack, quantity }) => <li key={pack.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h3 className="font-semibold">{pack.name}</h3><p className="mt-1 text-xs text-black/45">{pack.credits * quantity} credits · {money(pack.price)} each</p></div><div className="flex items-center gap-4"><div className="flex items-center rounded-full border border-black/10"><button type="button" aria-label={`Remove one ${pack.name}`} onClick={() => setQuantity(pack.id, quantity - 1)} className="h-9 w-9 text-lg text-black/55">−</button><span className="w-6 text-center text-sm font-semibold">{quantity}</span><button type="button" aria-label={`Add one ${pack.name}`} onClick={() => setQuantity(pack.id, quantity + 1)} className="h-9 w-9 text-lg text-black/55">+</button></div><span className="w-20 text-right text-sm font-semibold">{money(pack.price * quantity)}</span></div></li>)}</ul> : <div className="py-12 text-center"><p className="text-sm text-black/50">Your cart is empty.</p><button type="button" onClick={() => setStage("shop")} className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#e10600]">Browse credit packs →</button></div>}
        </div>
        <aside className="h-fit rounded-2xl bg-[#f7f8f8] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">Order summary</p><div className="mt-5 flex justify-between text-sm text-black/55"><span>Credits</span><span>{credits}</span></div><div className="mt-3 flex justify-between border-t border-black/10 pt-4 text-base font-semibold"><span>Total</span><span>{money(total)}</span></div><button type="button" disabled={!items.length} onClick={() => setStage("payment")} className="mt-5 w-full rounded-full bg-[#e10600] px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:bg-black/15">Continue to order →</button><p className="mt-3 text-center text-[10px] leading-4 text-black/40">Payment is confirmed manually by the studio.</p></aside>
      </div> : null}

      {stage === "payment" ? <div className="mx-auto max-w-xl px-6 py-12 text-center sm:px-10">
        <button type="button" onClick={() => setStage("cart")} className="text-xs font-semibold text-black/45 hover:text-[#e10600]">← Back to cart</button>
        <h2 className="mt-5 font-display text-3xl font-semibold uppercase">Submit your order</h2>
        <p className="mt-3 text-sm leading-6 text-black/55">Your order will be marked pending payment. The studio will review your payment and add your credits once it is marked paid.</p>
        <form action={placeCreditOrder} className="mt-7">
          <input type="hidden" name="items" value={JSON.stringify(items.map(({ pack, quantity }) => ({ id: pack.id, quantity })))} />
          <button className="w-full rounded-full bg-[#e10600] px-6 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#c10500]">Place order · {money(total)}</button>
        </form>
      </div> : null}
    </section>
  );
}
