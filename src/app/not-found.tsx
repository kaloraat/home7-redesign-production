import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_GRADIENT } from "@/lib/constants";

// Defense in depth on top of the real HTTP 404 status Next.js already sends
// for this route (via notFound() elsewhere, or any unmatched path) — belt
// and braces against a CDN/proxy layer ever caching this as a 200.
export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ background: BRAND_GRADIENT }}
    >
      <div className="mx-auto max-w-2xl px-4 py-24 sm:py-32 text-center">
        <p className="text-brand-gold text-sm uppercase tracking-widest font-semibold">
          404 Error
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Page Not Found</h1>
        <p className="mt-4 text-slate-200 leading-relaxed">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Try one of the
          links below, or head back to the homepage.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded bg-brand-gold px-6 py-3 font-semibold text-brand-navy hover:brightness-95 transition"
          >
            Back to Homepage
          </Link>
          <Link
            href="/properties-for-sale"
            className="rounded border border-white/30 px-6 py-3 font-semibold hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            Properties for Sale
          </Link>
          <Link
            href="/contact"
            className="rounded border border-white/30 px-6 py-3 font-semibold hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
