import { PublicHeader, SiteFooter } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { listPackages } from "@/lib/queries";

export const metadata = { title: "Packs" };

export default async function PackagesPage() {
  const packages = await listPackages(false);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">Class packs</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/70">
          Buy a pack at the studio. Each class you attend uses a credit, and the pack stops when
          the credits are gone. Prices are recorded here. Payment is taken at the desk.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {packages.length === 0 ? (
            <li className="text-sm text-ink/70">No packs yet.</li>
          ) : (
            packages.map((pack) => (
              <li key={pack.id} className="rounded-3xl border border-line/80 bg-card p-5">
                <h2 className="text-2xl tracking-wide text-lagoon">{pack.name}</h2>
                <p className="mt-2 text-2xl text-tide">{formatMoney(pack.price_cents)}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {pack.credit_count} {pack.credit_count === 1 ? "class" : "classes"}
                  {pack.validity_days ? ` · valid ${pack.validity_days} days` : ""}
                </p>
                {pack.description ? <p className="mt-3 text-sm">{pack.description}</p> : null}
                <p className="mt-3 text-sm text-ink/70">
                  {pack.applies_to_all ? "Any class" : pack.classNames.join(", ") || "Selected classes"}
                </p>
              </li>
            ))
          )}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
