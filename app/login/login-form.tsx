"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { login, type LoginState } from "./actions";
import { setLocale } from "@/app/locale-action";
import type { Locale, Dictionary } from "@/lib/i18n";

type LoginCopy = Dictionary["publicPages"]["login"];

export function LoginLocaleControl({ locale, value, label }: { locale: Locale; value: Locale; label: string }) {
  const router = useRouter();
  async function choose() {
    if (locale === value) return;
    await setLocale(value);
    router.refresh();
  }
  return <button type="button" onClick={choose} aria-pressed={locale === value} className={locale === value ? "text-black" : "text-black/40 hover:text-black"}>{label}</button>;
}

export function LoginForm({ copy }: { copy: LoginCopy }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.username}</label>
        <input id="username" name="username" autoComplete="username" required placeholder={copy.usernamePlaceholder} className="login-input" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.password}</label>
          <span className="text-[11px] text-black/40">{copy.demoAccess}</span>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required placeholder={copy.passwordPlaceholder} className="login-input" />
      </div>
      {state?.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#e10600] px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#e10600]/15 transition hover:-translate-y-0.5 hover:bg-[#c10500] disabled:cursor-wait disabled:opacity-70">
        {pending ? copy.submitting : copy.submit}
        {!pending ? <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span> : null}
      </button>
    </form>
  );
}
