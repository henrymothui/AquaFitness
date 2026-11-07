"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { login, registerMemberAction, type LoginState, type RegistrationState } from "./actions";
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [registrationState, registerAction, registrationPending] = useActionState<RegistrationState, FormData>(registerMemberAction, undefined);

  return (
    <div className="mt-8">
      {mode === "login" ? (
        <form action={action} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.username}</label>
            <input id="username" name="username" autoComplete="username" required placeholder={copy.usernamePlaceholder} className="login-input" />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.password}</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" required placeholder={copy.passwordPlaceholder} className="login-input" />
          </div>
          {state?.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
          <button type="submit" disabled={pending} className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#e10600] px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#e10600]/15 transition hover:-translate-y-0.5 hover:bg-[#c10500] disabled:cursor-wait disabled:opacity-70">
            {pending ? copy.submitting : copy.submit}
            {!pending ? <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span> : null}
          </button>
          <div className="pt-2 text-center">
            <p className="mb-3 text-sm text-black/55">{copy.newHere}</p>
            <button type="button" onClick={() => setMode("signup")} className="flex w-full items-center justify-center rounded-full border border-black/15 px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-black transition hover:border-[#e10600] hover:text-[#e10600]">
              {copy.createAccount}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <h3 className="font-display text-2xl font-medium text-black">{copy.registrationHeading}</h3>
          <p className="mt-2 text-sm leading-6 text-black/55">{copy.registrationIntro}</p>
          {registrationState?.success ? (
            <div className="mt-5 space-y-5">
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{registrationState.success}</p>
              <button type="button" onClick={() => setMode("login")} className="w-full rounded-full border border-black/15 px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-black transition hover:border-black/35">
                {copy.signIn}
              </button>
            </div>
          ) : (
            <form action={registerAction} className="mt-6 space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.fullName}</label>
                <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} placeholder={copy.fullNamePlaceholder} className="login-input" />
              </div>
              <div>
                <label htmlFor="signup-email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.email}</label>
                <input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder={copy.emailPlaceholder} className="login-input" />
              </div>
              <div>
                <label htmlFor="signup-phone" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.phone}</label>
                <input id="signup-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder={copy.phonePlaceholder} className="login-input" />
              </div>
              <div>
                <label htmlFor="signup-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.17em] text-black/60">{copy.password}</label>
                <input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} placeholder={copy.passwordPlaceholder} className="login-input" />
                <p className="mt-2 text-xs text-black/45">{copy.passwordHelp}</p>
              </div>
              {registrationState?.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{registrationState.error}</p> : null}
              <button type="submit" disabled={registrationPending} className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#e10600] px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#e10600]/15 transition hover:-translate-y-0.5 hover:bg-[#c10500] disabled:cursor-wait disabled:opacity-70">
                {registrationPending ? copy.createAccountSubmitting : copy.registrationSubmit}
                {!registrationPending ? <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span> : null}
              </button>
              <p className="pt-1 text-center text-sm text-black/55">
                {copy.signInInstead}{" "}
                <button type="button" onClick={() => setMode("login")} className="font-semibold text-[#e10600] underline decoration-[#e10600]/30 underline-offset-4 transition hover:text-[#c10500]">
                  {copy.signIn}
                </button>
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
