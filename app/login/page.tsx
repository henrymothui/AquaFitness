import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/ui";
import { getDemoRole } from "@/lib/demo-auth";
import { getI18n } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const role = await getDemoRole();
  if (role) redirect(role === "admin" ? "/studio" : "/");
  const { t } = await getI18n();

  return (
    <main className="min-h-screen bg-[#f3f3f3] p-0 sm:p-4 lg:p-7">
      <div className="mx-auto grid min-h-screen max-w-[1600px] overflow-hidden bg-white shadow-[0_24px_90px_-45px_rgba(0,0,0,0.35)] sm:min-h-[calc(100svh-2rem)] sm:rounded-[1.5rem] lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[1.08fr_0.92fr] lg:rounded-[2rem]">
        <section className="relative min-h-[260px] overflow-hidden bg-black sm:min-h-[310px] lg:min-h-[720px]">
          <Image src="/brand/banner.jpg" alt="Water splashing around a swimmer at Hydrofit" fill priority sizes="(max-width: 1024px) 100vw, 56vw" className="object-cover object-[center_42%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/35" />
          <div className="absolute left-6 top-6 sm:left-9 sm:top-8 lg:left-12 lg:top-11"><BrandMark tone="light" size="sm" /></div>
          <div className="absolute inset-0 flex items-center justify-center px-5 pt-10 text-center text-white lg:pt-0">
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <span aria-hidden="true" className="hidden h-1 w-8 bg-[#e10600] sm:block md:w-14" />
              <div>
                <p className="font-display text-[clamp(1.2rem,3.6vw,2.2rem)] font-medium uppercase leading-none tracking-[0.18em]">{t.home.heroWord}</p>
                <p className="mt-3 font-display text-[clamp(0.65rem,1.2vw,0.95rem)] font-medium uppercase tracking-[0.22em] text-white/85">{t.home.heroSub}</p>
              </div>
              <span aria-hidden="true" className="hidden h-1 w-8 bg-[#e10600] sm:block md:w-14" />
            </div>
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-[#e10600]" />
          <p className="absolute bottom-5 left-6 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65 sm:left-9 lg:bottom-8 lg:left-12">Saigon · Vietnam</p>
        </section>

        <section className="flex min-h-[calc(100svh-260px)] flex-col px-6 py-7 sm:min-h-[calc(100svh-310px)] sm:px-10 sm:py-9 lg:min-h-0 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between lg:hidden"><Link href="/" aria-label="Hydrofit home"><BrandMark size="sm" /></Link><span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">Member portal</span></div>
          <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12 lg:py-16">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e10600]">Welcome to Hydrofit <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M12 3.5C9.4 7.4 6 10.3 6 14.1a6 6 0 0 0 12 0c0-3.8-3.4-6.7-6-10.6Z" stroke="currentColor" strokeWidth="1.7"/><path d="M9.4 15.6c.3 1.4 1.2 2.2 2.6 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7"/></svg></p>
            <h2 className="mt-3 font-display text-5xl font-medium leading-none tracking-tight text-black sm:text-[3.6rem]">Come on in.</h2>
            <p className="mt-4 text-sm leading-6 text-black/55">Sign in to find your next favorite moment in the water.</p>
            <LoginForm />
          </div>
          <footer className="mx-auto flex w-full max-w-[430px] items-center justify-between border-t border-black/10 pt-5 text-[11px] text-black/40"><span>© {new Date().getFullYear()} Hydrofit</span><Link href="/" className="transition hover:text-[#e10600]">Back to the pool <span aria-hidden="true">→</span></Link></footer>
        </section>
      </div>
    </main>
  );
}
