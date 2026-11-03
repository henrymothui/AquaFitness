import Link from "next/link";

export function PageBanner({
  kicker,
  title,
  watermark,
}: {
  kicker: string;
  title: string;
  watermark: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#ececec]">
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-0 select-none font-display text-[22vw] font-semibold uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(0,0,0,0.16)] md:text-[11rem]"
      >
        {watermark}
      </p>
      <div className="relative mx-auto w-full max-w-7xl px-6 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e10600]">{kicker}</p>
        <h1 className="mt-3 max-w-4xl font-display text-6xl font-semibold uppercase leading-[0.9] tracking-wide text-black md:text-8xl">
          {title}
        </h1>
      </div>
    </section>
  );
}

export function JoinBand({
  kicker,
  title,
  body,
  cta,
}: {
  kicker: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/50">{kicker}</p>
          <h2 className="mt-3 font-display text-5xl font-semibold uppercase leading-[0.9] md:text-6xl">{title}</h2>
          <p className="mt-4 max-w-xl text-base text-white/70">{body}</p>
        </div>
        <Link
          href="/schedule"
          className="rounded-full bg-[#e10600] px-6 py-3 font-display text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-[#c10500]"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
