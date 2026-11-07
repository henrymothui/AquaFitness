import Image from "next/image";

export const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-pool focus:ring-2 focus:ring-pool/15";

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-lagoon px-4 py-2.5 text-sm font-medium text-white transition hover:bg-tide";

export const quietButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900";

export function WaterDropIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 3.5C9.4 7.4 6 10.3 6 14.1a6 6 0 0 0 12 0c0-3.8-3.4-6.7-6-10.6Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.4 15.6c.3 1.4 1.2 2.2 2.6 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function BrandMark({
  tone = "dark",
  size = "md",
  hideNameOnMobile = false,
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md";
  hideNameOnMobile?: boolean;
}) {
  const mark = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/hydrofit-logo.jpg"
        alt=""
        width={96}
        height={96}
        className={`${mark} rounded-full object-cover object-[center_34%] ring-2 ring-white shadow-sm`}
      />
      <span className={`leading-none ${hideNameOnMobile ? "hidden sm:block" : ""}`}>
        <span
          className={`block font-display text-[1.35rem] font-semibold tracking-[0.16em] ${
            tone === "light" ? "text-white" : "text-black"
          }`}
        >
          HYDROFIT
        </span>
        <span
          className={`mt-1 block text-[10px] font-semibold tracking-[0.34em] ${
            tone === "light" ? "text-[#b7e4ee]" : "text-pool"
          }`}
        >
          AQUAFITNESS
        </span>
      </span>
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink/80">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-ink/60">{hint}</span> : null}
    </label>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e5e9ed] bg-white p-4 sm:p-5">
      <h2>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="rounded-2xl border border-pool/30 bg-pool/10 px-4 py-3 text-sm text-tide">
        {notice}
      </p>
    );
  }
  return null;
}
