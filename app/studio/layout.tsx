import { StudioNav } from "@/components/studio-nav";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getCurrentRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Studio" };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();
  if (role !== "admin" && role !== "coach") redirect("/");

  return (
    <div className="studio-shell min-h-screen bg-[#f7f9fb] text-ink md:flex">
      <StudioNav role={role} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="hidden min-h-[60px] items-center justify-end gap-2 border-b border-[#e5e9ed] bg-white px-4 sm:px-7 md:flex">
          {role === "admin" ? (
            <>
              <Link
                href="/studio/courses/schedule"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Schedule
              </Link>
              <Link
                href="/studio/coach"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Coach
              </Link>
            </>
          ) : (
            <Link
              href="/studio/check-in"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Check-in
            </Link>
          )}
          <form action={logout}>
            <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">Sign out</button>
          </form>
        </header>
        <div className="w-full flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </div>
        <footer className="border-t border-[#e9edf0] px-4 py-3 text-xs text-slate-400 sm:px-8">Hydrofit Studio</footer>
      </div>
    </div>
  );
}
