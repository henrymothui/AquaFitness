import { Flash, Panel, buttonClass, inputClass } from "@/components/ui";
import { getCurrentAccount } from "@/lib/auth";
import { updateAdminProfile } from "./actions";

export const metadata = { title: "Admin settings" };

export default async function StudioSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [account, query] = await Promise.all([getCurrentAccount(), searchParams]);

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4d849c]">Admin</p>
        <h1 className="mt-1">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the username and password for this admin account.</p>
      </div>
      <Flash error={query.error} notice={query.notice} />
      <Panel title="Admin profile">
        <p className="mb-5 text-sm text-slate-500">You will stay signed in after updating your details.</p>
        <form action={updateAdminProfile} className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Username
            <input
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}"
              autoComplete="username"
              defaultValue={account?.username ?? ""}
              className={inputClass}
            />
            <span className="text-xs font-normal text-slate-500">3–32 characters; letters, numbers, dots, underscores, and hyphens.</span>
          </label>

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <label className="grid content-start gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Current password
              <input name="current_password" type="password" autoComplete="current-password" className={inputClass} />
              <span className="text-xs font-normal text-slate-500">Required to change your username or password.</span>
            </label>
            <label className="grid content-start gap-2 text-sm font-medium text-slate-700">
              New password
              <input name="new_password" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
              <span className="text-xs font-normal text-slate-500">Leave blank to keep your current password.</span>
            </label>
            <label className="grid content-start gap-2 text-sm font-medium text-slate-700">
              Confirm new password
              <input name="confirm_password" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
            </label>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button className={buttonClass}>Save changes</button>
          </div>
        </form>
      </Panel>
    </main>
  );
}
