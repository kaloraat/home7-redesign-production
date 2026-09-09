import Link from "next/link";
import { TARGET_SUBURBS, suburbSlug } from "@/lib/constants";

/**
 * Each card links to its /suburb/[slug] landing page (PROJECT_BRIEF.md
 * Phase 4 — see src/app/suburb/[slug]/page.tsx). All 12 target suburbs now
 * have a page, so every card is a real link — nothing here points at a
 * URL that doesn't resolve.
 */
export function SuburbShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">
          Where we work
        </p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">
          Local Experts Across South West Sydney
        </h2>
        <p className="mt-3 text-lg text-slate-600 leading-relaxed">
          From our Liverpool home base out to the growth corridors — we know these
          streets, these buyers, and these markets.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TARGET_SUBURBS.map((suburb) => (
          <Link
            key={suburb}
            href={`/suburb/${suburbSlug(suburb)}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center hover:border-brand-gold-dark hover:bg-white transition-colors"
          >
            <p className="font-medium text-brand-navy text-lg">{suburb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default SuburbShowcase;
