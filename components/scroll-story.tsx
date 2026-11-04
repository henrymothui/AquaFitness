"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type StoryPoint = { title: string; body: string; image?: string; imageAlt?: string; imagePosition?: string };

export type StoryChapter = {
  image?: string;
  imageAlt?: string;
  position?: string;
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
  featured?: boolean;
  cta?: { href: string; label: string; external?: boolean };
  credit?: { label: string; href: string };
};

const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

function pieceStyle(delay: string): CSSProperties {
  return {
    opacity: 0,
    transform: "translate3d(0, 2.6rem, 0)",
    transition: `opacity 0.85s ease ${delay}, transform 1.05s ${ease} ${delay}`,
  };
}

function motionStyle(glide: boolean, delay: string, range: string, extra?: CSSProperties): CSSProperties {
  if (glide) return { animationRange: range, ...extra };
  return { ...pieceStyle(delay), ...extra };
}

function blockStyle(x: boolean, delay = "0ms", from?: "left" | "right"): CSSProperties {
  const transform =
    from === "left"
      ? "translate3d(-3.4rem, 1.8rem, 0)"
      : from === "right"
        ? "translate3d(3.4rem, 1.8rem, 0)"
        : x
          ? "translate3d(-2.6rem, 1.1rem, 0)"
          : "translate3d(0, 2.4rem, 0)";
  return {
    opacity: 0,
    transform,
    transition: `opacity 1.05s ease ${delay}, transform 1.25s ${ease} ${delay}`,
  };
}

function photoStyle(): CSSProperties {
  return {
    opacity: 0,
    transform: "scale(1.07)",
    transition: `opacity 1.05s ease, transform 1.35s ${ease}`,
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

export function ScrollStory({
  chapters,
  snap = false,
  glide = false,
  heavyTitle = false,
}: {
  chapters: StoryChapter[];
  snap?: boolean;
  glide?: boolean;
  heavyTitle?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const layers = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    const drifts = [...root.querySelectorAll<HTMLElement>("[data-drift]")];
    const driftY = new WeakMap<HTMLElement, number>();

    if (reduce) {
      for (const node of root.querySelectorAll<HTMLElement>("[data-piece], [data-reveal], [data-bar]")) {
        node.style.opacity = "1";
        node.style.transform = "none";
        node.style.transition = "none";
      }
      return;
    }

    // Scroll-driven keyframes only exist for snap and glide. Other pages stay
    // at opacity 0 unless the observer reveals them, even when view() is supported.
    const driven = (snap || glide) && CSS.supports("animation-timeline", "view()");
    const observer = driven
      ? null
      : new IntersectionObserver(
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
              observer?.unobserve(target);
            }
          },
          { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
        );

    if (observer) {
      for (const node of reveals) observer.observe(node);
    }

    let frame = 0;
    const tick = () => {
      frame = 0;
      const view = window.innerHeight;
      const travel = Math.min(180, view * 0.2);
      for (const layer of layers) {
        const rect = layer.parentElement?.getBoundingClientRect();
        if (!rect) continue;
        const progress = Math.min(1, Math.max(0, (view - rect.top) / (rect.height + view)));
        layer.style.transform = `translate3d(0, ${(0.5 - progress) * travel}px, 0)`;
      }
      const driftTravel = Math.min(42, view * 0.055);
      let pending = false;
      for (const layer of drifts) {
        const rect = layer.parentElement?.getBoundingClientRect();
        if (!rect) continue;
        const progress = Math.min(1, Math.max(0, (view - rect.top) / (rect.height + view)));
        const target = (0.5 - progress) * driftTravel;
        const prev = driftY.get(layer) ?? target;
        const next = prev + (target - prev) * 0.16;
        if (Math.abs(target - next) > 0.3) pending = true;
        driftY.set(layer, next);
        layer.style.transform = `translate3d(0, ${next}px, 0)`;
      }
      if (pending) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [snap, glide]);

  return (
    <div
      ref={rootRef}
      {...(snap ? { "data-story-snap": "" } : {})}
      {...(glide ? { "data-glide": "" } : {})}
    >
      <style>{`
        html:has([data-story-snap]) {
          scroll-snap-type: y proximity;
          scroll-behavior: smooth;
          scroll-padding-top: 4.5rem;
        }
        @media (min-width: 768px) {
          html:has([data-story-snap]) {
            scroll-padding-top: 5rem;
          }
        }
        @keyframes story-rise {
          from { opacity: 0; transform: translate3d(0, 1.35rem, 0) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        @keyframes story-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes story-from-left {
          from { opacity: 0; transform: translate3d(-4.5rem, 2.4rem, 0); }
          to { opacity: 1; transform: none; }
        }
        @keyframes story-from-right {
          from { opacity: 0; transform: translate3d(4.5rem, 2.4rem, 0); }
          to { opacity: 1; transform: none; }
        }
        @keyframes story-photo {
          from { opacity: 0; transform: scale(1.08); }
          to { opacity: 1; transform: none; }
        }
        @supports (animation-timeline: view()) {
          [data-story-snap] [data-piece],
          [data-story-snap] [data-reveal="up"],
          [data-story-snap] [data-reveal="left"] {
            animation: story-rise linear both;
            animation-timeline: view();
            animation-range: entry 0% cover 46%;
          }
          [data-story-snap] [data-reveal="side"][data-from="left"] {
            animation-name: story-from-left;
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            animation-fill-mode: both;
            animation-timeline: view();
            animation-range: entry 2% cover 52%;
          }
          [data-story-snap] [data-reveal="side"][data-from="right"] {
            animation-name: story-from-right;
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            animation-fill-mode: both;
            animation-timeline: view();
            animation-range: entry 2% cover 52%;
          }
          [data-story-snap] [data-reveal="photo"] {
            animation-name: story-photo;
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            animation-fill-mode: both;
            animation-timeline: view();
            animation-range: entry 0% cover 44%;
          }
          [data-story-snap] [data-bar] {
            animation: story-bar linear both;
            animation-timeline: view();
            animation-range: entry 8% cover 50%;
          }
          [data-glide] [data-piece],
          [data-glide] [data-reveal="up"],
          [data-glide] [data-reveal="left"] {
            animation: story-glide cubic-bezier(0.16, 1, 0.3, 1) both;
            animation-timeline: view();
            animation-range: entry 0% cover 34%;
          }
          [data-glide] [data-bar] {
            animation: story-glide-bar cubic-bezier(0.16, 1, 0.3, 1) both;
            animation-timeline: view();
            animation-range: entry 0% cover 38%;
          }
        }
        @keyframes story-glide {
          from { opacity: 0; transform: translate3d(0, 1.15rem, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes story-glide-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        html:has([data-glide]) {
          scroll-behavior: auto;
        }
        @media (prefers-reduced-motion: reduce) {
          html:has([data-story-snap]) {
            scroll-snap-type: none;
            scroll-behavior: auto;
          }
          [data-piece], [data-reveal], [data-bar] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
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
        const onPhoto = Boolean(chapter.image);
        const ctaOnImage = Boolean(chapter.cta && !hasCopy);
        const eyebrowInCopy = Boolean(chapter.eyebrow && onPhoto);
        return (
        <article
          key={`${chapter.line}-${chapter.word}-${index}`}
          className={!onPhoto && snap ? "snap-start" : undefined}
        >
          <section
            className={
              onPhoto
                ? `relative h-[calc(100svh-4.5rem)] overflow-hidden bg-black md:h-[calc(100svh-5rem)]${snap ? " snap-start" : ""}`
                : `relative bg-white px-5 text-black ${heavyTitle ? "py-8 md:py-12" : "py-16 md:py-24"}${snap ? " snap-start" : ""}`
            }
          >
            {chapter.image ? (
              <>
                <div data-parallax className="absolute inset-x-0 -top-24 -bottom-24">
                  <Image
                    src={chapter.image}
                    alt={chapter.imageAlt ?? ""}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className={`object-cover ${chapter.position ?? ""}`}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/45" />
              </>
            ) : null}
            <div
              className={`relative flex items-center justify-center text-center ${
                onPhoto ? "h-full px-5 text-white" : ""
              }`}
            >
              <div
                data-reveal="lockup"
                {...(glide ? { "data-drift": "" } : {})}
                className="flex items-center justify-center gap-3 sm:gap-6"
              >
                <span
                  data-bar
                  className={`hidden origin-right bg-[#e10600] sm:block ${heavyTitle ? "h-1.5 w-8 md:w-14" : onPhoto ? "h-1.5 w-12 md:w-28" : "h-2 w-14 md:w-28"}`}
                  style={
                    glide
                      ? { animationRange: "entry 0% cover 36%" }
                      : { transform: "scaleX(0)", transition: `transform 0.9s ${ease} 0.28s` }
                  }
                />
                <div className={chapter.featured ? "max-w-4xl" : undefined}>
                  {chapter.line ? (
                    <p
                      data-piece
                      className={`font-display uppercase leading-none tracking-[0.18em] ${
                        onPhoto ? "text-[clamp(1.6rem,4vw,3.5rem)]" : "text-[clamp(1.45rem,3.6vw,2.75rem)] !font-bold"
                      }`}
                      style={motionStyle(glide, "0.05s", "entry 0% cover 22%")}
                    >
                      {chapter.line}
                    </p>
                  ) : null}
                  <h2
                    data-piece
                    className={
                      chapter.featured
                        ? "font-display text-[clamp(3.4rem,14vw,9rem)] font-semibold uppercase leading-[0.78] tracking-wide [text-shadow:0_8px_32px_rgba(0,0,0,0.45)]"
                        : `mt-1 font-display uppercase ${
                            heavyTitle
                              ? "text-[clamp(2rem,4.6vw,3.4rem)] leading-[0.9]"
                              : onPhoto
                                ? "text-[clamp(3.6rem,12vw,9.25rem)] leading-[0.78] tracking-wide"
                                : "text-[clamp(4.25rem,13vw,8.5rem)] !font-bold leading-[0.76] tracking-wide"
                          }`
                    }
                    style={motionStyle(
                      glide,
                      "0.16s",
                      "entry 0% cover 30%",
                      chapter.featured
                        ? {
                            WebkitTextStroke: "0.012em currentColor",
                            paintOrder: "stroke fill",
                          }
                        : heavyTitle
                          ? {
                              fontWeight: 700,
                              letterSpacing: "-0.03em",
                              WebkitTextStroke: "0.018em currentColor",
                              paintOrder: "stroke fill",
                            }
                          : undefined,
                    )}
                  >
                    {chapter.word}
                  </h2>
                  {chapter.featured ? (
                    <span
                      data-bar
                      aria-hidden
                      className="mx-auto mt-4 block h-1 w-16 origin-center bg-[#e10600]"
                      style={
                        glide
                          ? { animationRange: "entry 0% cover 36%" }
                          : { transform: "scaleX(0)", transition: `transform 0.9s ${ease} 0.28s` }
                      }
                    />
                  ) : null}
                  {!onPhoto && chapter.eyebrow ? (
                    <p
                      data-piece
                      className="mt-5 text-sm font-semibold uppercase tracking-[0.32em] text-[#e10600] md:text-base"
                      style={motionStyle(glide, "0.26s", "entry 8% cover 30%")}
                    >
                      {chapter.eyebrow}
                    </p>
                  ) : null}
                  {chapter.closer ? (
                    <p
                      data-piece
                      className={
                        chapter.featured
                          ? "mx-auto mt-5 max-w-3xl text-balance font-display text-[clamp(1.05rem,2.5vw,1.85rem)] font-semibold uppercase leading-snug tracking-[0.14em] text-white [text-shadow:0_8px_24px_rgba(0,0,0,0.45)]"
                          : `mx-auto mt-6 max-w-md text-sm uppercase tracking-[0.22em] md:text-base ${
                              onPhoto ? "text-white/80" : "text-black/60"
                            }`
                      }
                      style={motionStyle(glide, "0.28s", "entry 8% cover 32%")}
                    >
                      {chapter.closer}
                    </p>
                  ) : null}
                  {ctaOnImage && chapter.cta ? <ChapterCta cta={chapter.cta} onImage /> : null}
                </div>
                <span
                  data-bar
                  className={`hidden origin-left bg-[#e10600] sm:block ${heavyTitle ? "h-1.5 w-8 md:w-14" : onPhoto ? "h-1.5 w-12 md:w-28" : "h-2 w-14 md:w-28"}`}
                  style={
                    glide
                      ? { animationRange: "entry 0% cover 36%" }
                      : { transform: "scaleX(0)", transition: `transform 0.9s ${ease} 0.28s` }
                  }
                />
              </div>
            </div>
            {onPhoto && chapter.credit ? (
              <a
                href={chapter.credit.href}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-4 z-10 text-[11px] text-white/70 underline decoration-white/30 underline-offset-2"
              >
                {chapter.credit.label}
              </a>
            ) : null}
            {onPhoto ? <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#e10600]" /> : null}
          </section>

          {hasCopy ? (
            <section className="bg-white">
              {chapter.paragraphs?.length || eyebrowInCopy || chapter.aside || (chapter.cta && !ctaOnImage) ? (
                <div
                  data-reveal="left"
                  className={`mx-auto w-full max-w-3xl px-6 text-center ${
                    chapter.paragraphs?.length
                      ? chapter.list?.length
                        ? onPhoto
                          ? "pt-16 pb-4 md:pt-24 md:pb-6"
                          : "pt-4 pb-2 md:pt-5"
                        : onPhoto
                          ? "py-16 md:py-24"
                          : "py-6 md:py-8"
                      : onPhoto
                        ? "px-6 pt-14 pb-2 md:pt-20"
                        : "px-6 pt-3 pb-1"
                  }`}
                  style={glide ? { animationRange: "entry 4% cover 30%" } : blockStyle(true)}
                >
                  {eyebrowInCopy ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e10600]">{chapter.eyebrow}</p>
                  ) : null}
                  {chapter.paragraphs?.length ? (
                    <div
                      className={`space-y-5 text-lg leading-8 text-black/80 md:text-xl md:leading-9 ${
                        eyebrowInCopy ? "mt-5" : ""
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
                <div className={`mx-auto w-full max-w-xl px-6 ${onPhoto ? "pb-16 md:pb-24" : "pb-8 md:pb-10"}`}>
                  {chapter.listLabel ? (
                    <p
                      data-reveal="up"
                      className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-black/45"
                      style={glide ? { animationRange: "entry 6% cover 28%" } : blockStyle(false)}
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
                        style={
                          glide
                            ? { animationRange: `entry ${8 + itemIndex * 3}% cover ${28 + itemIndex * 3}%` }
                            : blockStyle(false, `${itemIndex * 70}ms`)
                        }
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {chapter.quotes?.length ? (
                <ul className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 pt-8 pb-16 md:pb-24">
                  {chapter.quotes.map((item, itemIndex) => (
                    <li
                      key={item.name}
                      data-reveal="up"
                      className="border-t-2 border-black pt-5"
                      style={
                        glide
                          ? { animationRange: `entry ${6 + itemIndex * 4}% cover ${30 + itemIndex * 4}%` }
                          : blockStyle(false, `${itemIndex * 90}ms`)
                      }
                    >
                      <p className="text-lg leading-7">“{item.quote}”</p>
                      <p className="mt-5 font-display text-xl uppercase">{item.name}</p>
                      <p className="text-sm text-black/50">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {chapter.points?.length ? (
                chapter.points.some((point) => point.image) ? (
                  <div className="mx-auto flex w-full max-w-6xl flex-col overflow-x-clip px-5 pb-6 md:px-8 md:pb-10">
                    {chapter.points.map((point, pointIndex) => {
                      const imageLeft = pointIndex % 2 === 0;
                      const from = imageLeft ? "right" : "left";
                      return (
                        <article
                          key={point.title}
                          data-reason=""
                          className="grid items-center gap-7 py-12 md:grid-cols-12 md:gap-x-8 md:py-16 lg:py-24"
                        >
                          <div
                            data-reveal="photo"
                            className={`relative aspect-[3/2] overflow-hidden md:col-span-5 ${
                              imageLeft ? "md:col-start-1" : "md:col-start-8"
                            }`}
                            style={photoStyle()}
                          >
                            <div data-drift className="absolute inset-x-0 -top-12 -bottom-12">
                              <Image
                                src={point.image ?? ""}
                                alt={point.imageAlt ?? point.title}
                                fill
                                sizes="(min-width: 768px) 36rem, 100vw"
                                className={`object-cover ${point.imagePosition ?? "object-center"}`}
                              />
                            </div>
                          </div>
                          <div
                            data-reveal="side"
                            data-from={from}
                            className={`md:col-span-7 ${imageLeft ? "md:col-start-6" : "md:col-start-1 md:row-start-1"}`}
                            style={blockStyle(false, "80ms", from)}
                          >
                            <p className="font-display text-[clamp(3.4rem,7vw,5.75rem)] leading-none text-[#e10600]">
                              {String(pointIndex + 1).padStart(2, "0")}
                            </p>
                            <h3 className="mt-2 max-w-lg font-display text-[clamp(2.6rem,4.8vw,4.25rem)] uppercase leading-[0.88]">
                              {point.title}
                            </h3>
                            <p className="mt-5 max-w-xl text-lg leading-8 text-black/75">{point.body}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-7xl px-6 pb-16 md:pb-24">
                    <ul
                      className={`grid gap-px bg-black/10 sm:grid-cols-2 ${
                        chapter.points.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"
                      }`}
                    >
                      {chapter.points.map((point, pointIndex) => (
                        <li
                          key={point.title}
                          data-reveal="up"
                          className="bg-white p-6"
                          style={
                            glide
                              ? { animationRange: `entry ${6 + pointIndex * 4}% cover ${30 + pointIndex * 4}%` }
                              : blockStyle(false, `${pointIndex * 80}ms`)
                          }
                        >
                          <h3 className="font-display text-2xl uppercase leading-none">{point.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-black/70">{point.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ) : null}
            </section>
          ) : null}
        </article>
        );
      })}
    </div>
  );
}
