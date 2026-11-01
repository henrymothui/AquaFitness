import Link from "next/link";
import { creditsLabel, formatWhen } from "@/lib/format";
import { followUp, getSettings } from "@/lib/queries";

export const metadata = { title: "Follow-up" };

function flags(row: {
  status: string;
  credits_total: number;
  credits_used: number;
  expires_at: string | null;
}) {
  const labels: string[] = [];
  const left = row.credits_total - row.credits_used;
  if (row.status === "exhausted" || left <= 0) labels.push("Used up");
  else if (left <= 2) labels.push("Low");
  if (row.status === "expired") labels.push("Expired");
  else if (row.expires_at && new Date(row.expires_at).getTime() - Date.now() <= 14 * 86400000) {
    labels.push("Expiring");
  }
  return labels;
}

export default async function FollowUpPage() {
  const [rows, settings] = await Promise.all([followUp(), getSettings()]);

  return (
    <main>
      <h1 className="text-4xl text-lagoon">Follow-up</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Packs with 2 credits or fewer, packs that have stopped, and packs that expire within 14 days.
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-ink/70">Every open pack still has credits to spare.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Last class</th>
                <th className="px-4 py-3 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.customer_package_id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/studio/customers/${row.customer_id}`} className="font-medium text-pool">
                      {row.full_name}
                    </Link>
                    <span className="block text-ink/60">{row.phone || row.email || ""}</span>
                  </td>
                  <td className="px-4 py-3">{row.package_name}</td>
                  <td className="px-4 py-3">{creditsLabel(row.credits_used, row.credits_total)}</td>
                  <td className="px-4 py-3">
                    {row.expires_at ? formatWhen(row.expires_at, settings.timezone) : "No expiry"}
                  </td>
                  <td className="px-4 py-3">
                    {row.last_class_at ? formatWhen(row.last_class_at, settings.timezone) : "None yet"}
                  </td>
                  <td className="px-4 py-3">{flags(row).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
