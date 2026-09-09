"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BRAND_GRADIENT } from "@/lib/constants";

// Catches thrown errors (e.g. a genuine DB outage in queries.ts) so they
// render this branded page under an HTTP 500 instead of a false 404 —
// search engines retry a 5xx, but a repeated 404 reads as intentional
// removal and gets the URL deindexed.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ background: BRAND_GRADIENT }}
    >
      <div className="mx-auto max-w-2xl px-4 py-24 sm:py-32 text-center">
        <p className="text-brand-gold text-sm uppercase tracking-widest font-semibold">
          Something Went Wrong
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">We&rsquo;ll Be Right Back</h1>
        <p className="mt-4 text-slate-200 leading-relaxed">
          This page hit a temporary problem loading. Please try again, or head back to the
          homepage.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded bg-brand-gold px-6 py-3 font-semibold text-brand-navy hover:brightness-95 transition cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded border border-white/30 px-6 py-3 font-semibold hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
