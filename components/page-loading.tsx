"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WaterDropIcon } from "@/components/ui";

export function startPageLoading(timeoutMs = 15000) {
  window.dispatchEvent(new CustomEvent("page-loading:start", { detail: timeoutMs }));
}

export default function PageLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [isLoading, setIsLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (loadingStartedAt.current === null) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const minimumVisibleTime = 450;
    const elapsed = performance.now() - loadingStartedAt.current;
    hideTimer.current = setTimeout(() => {
      loadingStartedAt.current = null;
      setIsLoading(false);
    }, Math.max(0, minimumVisibleTime - elapsed));
  }, [pathname, search]);

  useEffect(() => {
    function showLoading(event?: Event) {
      const timeoutMs = event instanceof CustomEvent && typeof event.detail === "number" ? event.detail : 15000;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      loadingStartedAt.current = performance.now();
      setIsLoading(true);
      hideTimer.current = setTimeout(() => {
        loadingStartedAt.current = null;
        setIsLoading(false);
      }, timeoutMs);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (`${nextUrl.pathname}${nextUrl.search}` === `${window.location.pathname}${window.location.search}`) return;

      showLoading();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("page-loading:start", showLoading);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("page-loading:start", showLoading);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="page-loading-backdrop"
      aria-busy="true"
      aria-label="Page loading"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
        background: "rgba(213, 239, 249, 0.22)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="page-loading-dialog"
        role="status"
        aria-live="polite"
        aria-label="Loading page"
      >
        <div className="page-loading-icon" aria-hidden="true">
          <span className="page-loading-orbit page-loading-orbit-one" />
          <span className="page-loading-orbit page-loading-orbit-two" />
          <WaterDropIcon
            className="page-loading-drop"
            style={{ width: "1.5rem", height: "1.5rem", color: "#e10600" }}
          />
        </div>
        <span className="page-loading-eyebrow">HYDROFIT</span>
        <span className="page-loading-title">Making waves</span>
        <span className="page-loading-message">Your next moment is flowing in.</span>
      </div>
    </div>
  );
}
