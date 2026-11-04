import Image from "next/image";
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
  cta,
}: {
  kicker: string;
  title: string;
  cta: string;
}) {
  const mark = title.trim().split(/\s+/).pop() ?? "";

  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <Image
        src="/brand/class-fit.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[32%_center] md:object-[62%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.55)_48%,rgba(0,0,0,0.2)_100%)] md:bg-[linear-gradient(105deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.62)_32%,rgba(0,0,0,0.2)_64%,rgba(0,0,0,0.28)_100%)]" />
      {mark ? (
        <p
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-[-0.04em] select-none font-display text-[30vw] font-semibold uppercase leading-[0.8] tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.4)] md:bottom-10 md:text-[11.5rem]"
        >
          {mark}
        </p>
      ) : null}
      <div className="relative mx-auto flex min-h-[28rem] w-full max-w-7xl flex-col items-start justify-end gap-8 px-6 pt-36 pb-12 md:min-h-[26rem] md:flex-row md:items-end md:justify-between md:py-16">
        <div className="max-w-xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/75">
            <span className="h-px w-8 bg-[#e10600]" aria-hidden />
            {kicker}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,6.4vw,5.4rem)] font-semibold uppercase leading-[0.86] tracking-wide [text-shadow:0_8px_32px_rgba(0,0,0,0.45)]">
            {title}
          </h2>
        </div>
        <Link
          href="/book"
          className="inline-flex shrink-0 rounded-full bg-[#e10600] px-7 py-3.5 font-display text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#c10500]"
        >
          {cta}
        </Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#e10600]" />
    </section>
  );
}
