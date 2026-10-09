"use client";

import { useCallback, useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/utils";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Runs `update` on every Lenis frame, once on mount and on resize. Updates write styles
 * directly so scrolling never re-renders React.
 */
export function useScrollFrame(update: (lenis: Lenis) => void) {
  const lenis = useLenis(update, [update]);
  useEffect(() => {
    if (!lenis) return;
    const run = () => update(lenis);
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [lenis, update]);
}

/**
 * Moves its content at a fraction of the scroll speed while it is near the top of the page,
 * optionally turning it by `rotate` degrees per 100px scrolled.
 */
export function Parallax({
  speed = 0.12,
  rotate = 0,
  className,
  children,
}: {
  speed?: number;
  rotate?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const update = useCallback(
    (lenis: Lenis) => {
      const el = ref.current;
      if (!el) return;
      if (lenis.prefersReducedMotion) {
        el.style.transform = "";
        return;
      }
      const y = Math.min(lenis.animatedScroll, window.innerHeight * 1.2);
      const turn = rotate ? ` rotate(${((y / 100) * rotate).toFixed(2)}deg)` : "";
      el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)${turn}`;
    },
    [speed, rotate]
  );
  useScrollFrame(update);
  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/** A hairline under the header that fills as the reader moves through `targetId`. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const update = useCallback(() => {
    const bar = ref.current;
    const target = document.getElementById(targetId);
    if (!bar || !target) return;
    const siteHeader = document.querySelector<HTMLElement>("[data-chrome='header']");
    if (siteHeader) bar.style.top = `${Math.max(0, siteHeader.getBoundingClientRect().bottom)}px`;
    const rect = target.getBoundingClientRect();
    const header = bar.getBoundingClientRect().top;
    const travel = rect.height - (window.innerHeight - header);
    bar.hidden = travel <= 0;
    const p = travel > 0 ? clamp01((header - rect.top) / travel) : 1;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }, [targetId]);
  useScrollFrame(update);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ transform: "scaleX(0)" }}
      className="pointer-events-none fixed inset-x-0 top-[var(--header-h)] z-40 h-[3px] origin-left bg-green"
    />
  );
}
