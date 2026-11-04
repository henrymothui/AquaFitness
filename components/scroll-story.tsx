"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type StoryPoint = { title: string; body: string };

export type StoryChapter = {
  image: string;
  imageAlt: string;
  position: string;
  line: string;
  word: string;
  eyebrow?: string;
  paragraphs?: string[];
  points?: StoryPoint[];
  listLabel?: string;
  list?: readonly string[];
  quotes?: readonly { name: string; detail: string; quote: string }[];
  aside?: ReactNode;
  closer?: string;
  cta?: { href: string; label: string; external?: boolean };
};

const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

function pieceStyle(delay: string): CSSProperties {
  return {
    opacity: 0,
    transform: "translate3d(0, 2.6rem, 0)",
    transition: `opacity 0.85s ease ${delay}, transform 1.05s ${ease} ${delay}`,
  };
}

function blockStyle(x: boolean, delay = "0ms"): CSSProperties {
  return {
    opacity: 0,
    transform: x ? "translate3d(-2.6rem, 1.1rem, 0)" : "translate3d(0, 2.4rem, 0)",
    transition: `opacity 0.9s ease ${delay}, transform 1.05s ${ease} ${delay}`,
  };
}

function show(el: HTMLElement) {
  el.style.opacity = "1";
  el.style.transform = "none";
}

function ChapterCta({
  cta,
  onImage,
}: {
  cta: NonNullable<StoryChapter["cta"]>;
  onImage: boolean;
}) {
  const className =
    "mt-8 inline-flex rounded-full bg-[#e10600] px-8 py-3 font-display text-base uppercase tracking-[0.16em] text-white hover:bg-[#c10500]";
  const style = onImage ? pieceStyle("0.38s") : undefined;
  if (cta.external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={style}
        {...(onImage ? { "data-piece": "" } : {})}
      >
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className} style={style} {...(onImage ? { "data-piece": "" } : {})}>
      {cta.label}
    </Link>
  );
}

export function ScrollStory({ chapters }: { chapters: StoryChapter[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const layers = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];

    if (reduce) {
      for (const node of root.querySelectorAll<HTMLElement>("[data-piece], [data-reveal], [data-bar]")) {
        node.style.opacity = "1";
        node.style.transform = "none";
        node.style.transition = "none";
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          if (target.dataset.reveal === "lockup") {
            for (const piece of target.querySelectorAll<HTMLElement>("[data-piece]")) show(piece);
            for (const bar of target.querySelectorAll<HTMLElement>("[data-bar]")) {
              bar.style.transform = "scaleX(1)";
            }
          } else {
            show(target);
          }
          observer.unobserve(target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );

    for (const node of reveals) observer.observe(node);

    let frame = 0;
    const tick = () => {
      const view = window.innerHeight;
      const travel = Math.min(180, view * 0.2);
      for (const layer of layers) {
        const rect = layer.parentElement?.getBoundingClientRect();
        if (!rect) continue;
        const progress = Math.min(1, Math.max(0, (view - rect.top) / (rect.height + view)));
        layer.style.transform = `translate3d(0, ${(0.5 - progress) * travel}px, 0)`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-piece], [data-reveal], [data-bar] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
      {chapters.map((chapter, index) => {
        const hasCopy = Boolean(
          chapter.paragraphs?.length ||
            chapter.list?.length ||
            chapter.points?.length ||
            chapter.quotes?.length ||
            chapter.aside,
        );
        const ctaOnImage = Boolean(chapter.cta && !hasCopy);
        return (
        <article key={chapter.image}>
          <section className="relative h-[calc(100svh-4.5rem)] overflow-hidden bg-black md:h-[calc(100svh-5rem)]">
            <div data-parallax className="absolute inset-x-0 -top-24 -bottom-24">
              <Image
                src={chapter.image}
                alt={chapter.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`object-cover ${chapter.position}`}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/45" />
            <div className="relative flex h-full items-center justify-center px-5 text-center text-white">
              <div data-reveal="lockup" className="flex items-center justify-center gap-3 sm:gap-6">
                <span
                  data-bar
                  className="hidden h-1.5 w-12 origin-right bg-[#e10600] sm:block md:w-28"
                  style={{ transform: "scaleX(0)", transition: `transform 0.9s ${ease} 0.28s` }}
                />
                <div>
                  {chapter.line ? (
                    <p
                      data-piece
                      className="font-display text-[clamp(1.6rem,4vw,3.5rem)] uppercase leading-none tracking-[0.18em]"
                      style={pieceStyle("0.05s")}
                    >
                      {chapter.line}
                    </p>
                  ) : null}
                  <h2
                    data-piece
                    className="mt-1 font-display text-[clamp(3.6rem,12vw,9.25rem)] uppercase leading-[0.78] tracking-wide"
                    style={pieceStyle("0.16s")}
                  >
                    {chapter.word}
                  </h2>
                  {chapter.closer ? (
                    <p
                      data-piece
                      className="mx-auto mt-6 max-w-md text-sm uppercase tracking-[0.22em] text-white/80 md:text-base"
                      style={pieceStyle("0.28s")}
                    >
                      {chapter.closer}
                    </p>
                  ) : null}
                  {ctaOnImage && chapter.cta ? <ChapterCta cta={chapter.cta} onImage /> : null}
                </div>
                <span
                  data-bar
                  className="hidden h-1.5 w-12 origin-left bg-[#e10600] sm:block md:w-28"
                  style={{ transform: "scaleX(0)", transition: `transform 0.9s ${ease} 0.28s` }}
                />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#e10600]" />
          </section>

          {hasCopy ? (
            <section className="bg-white">
              {chapter.paragraphs?.length || chapter.eyebrow || chapter.aside || (chapter.cta && !ctaOnImage) ? (
                <div
                  data-reveal="left"
                  className={`mx-auto w-full max-w-3xl px-6 text-center ${
                    chapter.paragraphs?.length
                      ? chapter.list?.length
                        ? "pt-16 pb-4 md:pt-24 md:pb-6"
                        : "py-16 md:py-24"
                      : "px-6 pt-14 pb-2 md:pt-20"
                  }`}
                  style={blockStyle(true)}
                >
                  {chapter.eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e10600]">{chapter.eyebrow}</p>
                  ) : null}
                  {chapter.paragraphs?.length ? (
                    <div
                      className={`space-y-5 text-lg leading-8 text-black/80 md:text-xl md:leading-9 ${
                        chapter.eyebrow ? "mt-5" : ""
                      }`}
                    >
                      {chapter.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                  {chapter.aside ? <div className="mt-8 flex justify-center">{chapter.aside}</div> : null}
                  {chapter.cta && !ctaOnImage ? <ChapterCta cta={chapter.cta} onImage={false} /> : null}
                </div>
              ) : null}
              {chapter.list?.length ? (
                <div className="mx-auto w-full max-w-xl px-6 pb-16 md:pb-24">
                  {chapter.listLabel ? (
                    <p
                      data-reveal="up"
                      className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-black/45"
                      style={blockStyle(false)}
                    >
                      {chapter.listLabel}
                    </p>
                  ) : null}
                  <ul className="mt-4 border-b border-black/10">
                    {chapter.list.map((item, itemIndex) => (
                      <li
                        key={item}
                        data-reveal="up"
                        className="border-t border-black/10 py-3 text-center text-base text-black/80"
                        style={blockStyle(false, `${itemIndex * 70}ms`)}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {chapter.quotes?.length ? (
                <ul className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 md:grid-cols-3 md:pb-24">
                  {chapter.quotes.map((item, itemIndex) => (
                    <li
                      key={item.name}
                      data-reveal="up"
                      className="border-t-2 border-black pt-5"
                      style={blockStyle(false, `${itemIndex * 90}ms`)}
                    >
                      <p className="text-lg leading-7">“{item.quote}”</p>
                      <p className="mt-5 font-display text-xl uppercase">{item.name}</p>
                      <p className="text-sm text-black/50">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {chapter.points?.length ? (
                <div className="mx-auto w-full max-w-7xl px-6 pb-16 md:pb-24">
                  <ul
                    className={`grid gap-px bg-black/10 sm:grid-cols-2 ${
                      (chapter.points?.length ?? 0) > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"
                    }`}
                  >
                    {chapter.points.map((point, pointIndex) => (
                      <li
                        key={point.title}
                        data-reveal="up"
                        className="bg-white p-6"
                        style={blockStyle(false, `${pointIndex * 80}ms`)}
                      >
                        <h3 className="font-display text-2xl uppercase leading-none">{point.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-black/70">{point.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </article>
        );
      })}
    </div>
  );
}
