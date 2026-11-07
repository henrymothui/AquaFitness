"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">Username</label>
        <input id="username" name="username" autoComplete="username" required placeholder="Enter your username" className="login-input" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">Password</label>
          <span className="text-[11px] text-black/40">Demo access</span>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" className="login-input" />
      </div>
      {state?.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#e10600] px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#e10600]/15 transition hover:-translate-y-0.5 hover:bg-[#c10500] disabled:cursor-wait disabled:opacity-70">
        {pending ? "Signing you in…" : "Enter Hydrofit"}
        {!pending ? <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span> : null}
      </button>
    </form>
  );
}
