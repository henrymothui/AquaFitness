"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  { id: "classes", label: "Classes" },
  { id: "location", label: "Location" },
] as const;

const street = "12 Vo Truong Toan";
const city = "Ho Chi Minh City";
const address = `${street}, ${city}`;
const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=106.7410311%2C10.8004768%2C106.7550311%2C10.8104768&layer=mapnik&marker=10.8054768%2C106.7480311";
const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragStart = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeout = window.setTimeout(() => go(index + 1), 8000);
    return () => window.clearTimeout(timeout);
  }, [go, index, paused]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart.current = event.clientX;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStart.current == null) return;
    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) < 48) return;
    go(index + (distance < 0 ? 1 : -1));
  }

  return (
    <section aria-roledescription="carousel" aria-label="Hydrofit">
      <div
        className="relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#1a78d6_0%,#2f9eef_55%,#5ec8f5_100%)] text-white shadow-[0_24px_50px_-32px_rgba(26,120,214,0.7)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { dragStart.current = null; }}>
        <div
          role="group"
          aria-roledescription="slide"
          aria-label="Classes"
          aria-hidden={index !== 0}
          inert={index !== 0}
          className={`col-start-1 row-start-1 flex items-end overflow-hidden px-8 pb-10 pt-10 transition-opacity duration-500 motion-reduce:transition-none md:px-12 md:pb-14 md:pt-14 ${
            index === 0
              ? "relative z-10 min-h-[24rem] opacity-100 md:aspect-video md:min-h-0"
              : "pointer-events-none absolute inset-0 z-0 opacity-0"
          }`}
        >
          <Image
            src="/brand/banner.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 72rem) 72rem, 100vw"
            className="object-cover object-[center_42%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(12,86,176,0.5)_0%,rgba(20,120,200,0.22)_32%,rgba(255,255,255,0)_62%)]" />
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/75">Aquafitness</p>
            <h1 className="mt-3 text-5xl uppercase leading-[0.92] tracking-[0.03em] text-white md:text-7xl">
              Exercise that
              <br />
              feels good.
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/schedule"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-lagoon shadow-sm transition hover:bg-foam"
              >
                See the class
              </Link>
              <Link
                href="/packages"
                className="rounded-full border border-white/35 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
              >
                Class packs
              </Link>
            </div>
          </div>
        </div>

        <div
          role="group"
          aria-roledescription="slide"
          aria-label="Location"
          aria-hidden={index !== 1}
          inert={index !== 1}
          className={`col-start-1 row-start-1 flex overflow-hidden transition-opacity duration-500 motion-reduce:transition-none ${
            index === 1
              ? "relative z-10 min-h-[32rem] opacity-100 md:min-h-[36rem]"
              : "pointer-events-none absolute inset-0 z-0 opacity-0"
          }`}
        >
          <Image
            src="/brand/hcmc-skyline.jpg"
            alt=""
            fill
            sizes="(min-width: 72rem) 72rem, 100vw"
            className="object-cover object-[center_42%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,46,96,0.78)_0%,rgba(16,78,150,0.4)_38%,rgba(30,110,190,0.08)_68%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,32,64,0.28),transparent_36%)]" />

          <div className="relative z-10 flex w-full flex-col justify-center gap-8 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-12 md:py-12">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/75">The studio</p>
              <h2 className="mt-3 text-5xl uppercase leading-[0.9] tracking-[0.03em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] md:text-7xl">
                12 Vo
                <br />
                Truong Toan
              </h2>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/85">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-white">
                    <path d="M12 2.2c-3.7 0-6.7 2.9-6.7 6.6 0 4.9 6.7 12.9 6.7 12.9s6.7-8 6.7-12.9c0-3.7-3-6.6-6.7-6.6zm0 9a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8z" />
                  </svg>
                </span>
                {city}
              </p>
              <p className="mt-4 max-w-md text-base leading-7 text-white/80">
                The same pool the first groups trained in. Ask at the desk if you want to see the water before your first class.
              </p>
              <ul className="mt-6 grid max-w-md grid-cols-3 gap-2">
                {[
                  ["45 min", "Each class"],
                  ["Up to 10", "In a group"],
                  ["One pool", "Since day one"],
                ].map(([value, label]) => (
                  <li
                    key={label}
                    className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md"
                  >
                    <p className="font-display text-xl leading-none tracking-wide text-white md:text-2xl">{value}</p>
                    <p className="mt-1.5 text-[11px] leading-4 text-white/70">{label}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-lagoon shadow-sm transition hover:bg-foam"
                >
                  Get directions
                </a>
                <Link
                  href="/about"
                  className="rounded-full border border-white/35 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  Our story
                </Link>
              </div>
            </div>

            <figure className="w-full md:w-[22.5rem] md:shrink-0">
              <div className="overflow-hidden rounded-[1.35rem] bg-white text-ink shadow-[0_30px_60px_-28px_rgba(0,0,0,0.65)] ring-1 ring-white/80">
                <div className="relative h-36 overflow-hidden bg-sand md:h-52">
                  <iframe
                    title={`Map to ${address}`}
                    src={mapSrc}
                    referrerPolicy="no-referrer-when-downgrade"
                    className="pointer-events-none absolute inset-x-0 -top-16 h-[calc(100%+9rem)] w-full border-0 md:pointer-events-auto"
                  />
                </div>
                <div className="flex items-end justify-between gap-3 px-4 py-3.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-pool">Visit</p>
                    <p className="mt-1 font-display text-[1.55rem] leading-none tracking-wide text-lagoon">{street}</p>
                    <p className="mt-1 text-sm text-ink/60">{city}</p>
                  </div>
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-sm font-medium text-lagoon underline decoration-lagoon/30 underline-offset-4 hover:decoration-lagoon"
                  >
                    Directions
                  </a>
                </div>
              </div>
              <figcaption className="mt-2 text-right text-[11px] text-white/70">
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  Map data © OpenStreetMap
                </a>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(index - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            go(index + 1);
          }
        }}
      >
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show ${slide.label}`}
            aria-current={index === slideIndex ? "true" : undefined}
            onClick={() => go(slideIndex)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index === slideIndex ? "bg-lagoon" : "bg-lagoon/30 hover:bg-lagoon/55"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
