"use client";

import { useSyncExternalStore } from "react";

const KEY = "h7_first_name";
let cached = "";

/**
 * LeadForm leaves the first name in sessionStorage; take it and clear it.
 * Cached so re-renders (and Strict Mode's double reads) keep the name.
 */
function readName() {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      cached = saved.slice(0, 40).trim();
      sessionStorage.removeItem(KEY);
    }
  } catch {
    // Storage blocked: generic greeting.
  }
  return cached;
}

const subscribe = () => () => {};

export default function ThankYouHeading() {
  const name = useSyncExternalStore(subscribe, readName, () => "");
  return (
    <h1 className="font-display text-3xl leading-tight text-brand-navy md:text-4xl">
      Thanks{name ? ` ${name}` : ""}, we&apos;ve got your details.
    </h1>
  );
}
