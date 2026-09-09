"use client";

import { useEffect, useRef, useState } from "react";

type CountUpStatProps = { value: string; className?: string };

// Splits e.g. "12+" into { target: 12, suffix: "+" } — anything without a
// leading number (there isn't one today, but stays safe if a stat ever
// changes) just skips the animation and renders as-is.
function parseValue(value: string) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return null;
  return { target: parseInt(match[1], 10), suffix: match[2] };
}

// Server-rendered with the real final value (`value`, not "0") so the HTML
// that search engines and no-JS visitors get is correct and complete on
// first paint — the count-up is a client-only progressive enhancement layered
// on top after hydration, not something the page's SEO content depends on.
// It only starts once this element actually scrolls into view (mobile users
// who land lower on the page, or short viewports where this section is
// below the fold, get the animation when they reach it, not before), and
// runs once.
export function CountUpStat({ value, className }: CountUpStatProps) {
  const parsed = parseValue(value);
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLParagraphElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!parsed) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        const durationMs = 2600;
        const startTime = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - startTime) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          if (progress < 1) {
            setDisplay(`${Math.round(parsed!.target * eased)}${parsed!.suffix}`);
            requestAnimationFrame(tick);
          } else {
            setDisplay(value); // exact original string, no rounding drift
          }
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [parsed, value]);

  return (
    <p ref={ref} className={className}>
      {display}
    </p>
  );
}

export default CountUpStat;
