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
          className={`relative col-start-1 row-start-1 flex min-h-[24rem] items-end overflow-hidden px-8 pb-10 pt-10 transition-opacity duration-500 motion-reduce:transition-none md:aspect-video md:min-h-0 md:px-12 md:pb-14 md:pt-14 ${
            index === 0 ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
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
          className={`col-start-1 row-start-1 flex items-center px-8 py-10 transition-opacity duration-500 motion-reduce:transition-none md:px-12 md:py-12 ${
            index === 1 ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
          }`}
        >
          <div className="flex w-full flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">Find us</p>
              <h2 className="mt-3 max-w-xl text-5xl uppercase tracking-[0.04em] text-white md:text-6xl">
                {street}
              </h2>
              <p className="mt-4 text-lg text-white/80">{city}</p>
              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-lagoon shadow-sm transition hover:bg-foam"
              >
                Get directions
              </a>
            </div>
            <figure className="w-full md:w-96 md:shrink-0">
              <div className="relative h-56 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ring-4 ring-white/25 md:h-64">
                <iframe
                  title={`Map to ${address}`}
                  src={mapSrc}
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-x-0 top-0 h-[calc(100%+4.75rem)] w-full border-0"
                />
              </div>
              <figcaption className="mt-2 text-center text-[11px] text-white/60">
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
