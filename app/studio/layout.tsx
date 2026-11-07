import { StudioNav } from "@/components/studio-nav";
import { logout } from "@/app/login/actions";
import { getDemoRole } from "@/lib/demo-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Studio" };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if ((await getDemoRole()) !== "admin") redirect("/");

  return (
    <div className="studio-shell min-h-screen bg-[#f7f9fb] text-ink md:flex">
      <StudioNav />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex min-h-[60px] items-center justify-end gap-2 border-b border-[#e5e9ed] bg-white px-4 sm:px-7">
          <form action={logout}>
            <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">Sign out</button>
          </form>
        </header>
        <div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
        <footer className="border-t border-[#e9edf0] px-5 py-3 text-xs text-slate-400 sm:px-8">Hydrofit Studio</footer>
      </div>
    </div>
  );
}
