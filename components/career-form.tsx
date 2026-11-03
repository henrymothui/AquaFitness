"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

export function CareerForm({ copy }: { copy: Dictionary["careers"] }) {
  const [note, setNote] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = [
      `${copy.name}: ${String(data.get("name") || "")}`,
      `${copy.phone}: ${String(data.get("phone") || "")}`,
      `${copy.email}: ${String(data.get("email") || "")}`,
      `${copy.role}: ${String(data.get("role") || "")}`,
      `${copy.message}: ${String(data.get("message") || "")}`,
    ];
    setNote(lines.join("\n"));
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="block text-sm font-medium">
        {copy.name}
        <input name="name" required className="mt-1 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {copy.phone}
          <input name="phone" required className="mt-1 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
        </label>
        <label className="block text-sm font-medium">
          {copy.email}
          <input name="email" type="email" required className="mt-1 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {copy.role}
        <select name="role" className="mt-1 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black">
          {copy.roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {copy.message}
        <textarea name="message" rows={4} className="mt-1 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
      </label>
      <button
        type="submit"
        className="justify-self-start rounded-full bg-[#e10600] px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
      >
        {copy.submit}
      </button>
      {note ? (
        <div className="border border-black/10 bg-[#f6f6f6] p-4">
          <p className="font-display text-2xl uppercase">{copy.ready}</p>
          <p className="mt-2 text-sm text-black/70">{copy.readyBody}</p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm">{note}</pre>
        </div>
      ) : null}
    </form>
  );
}
