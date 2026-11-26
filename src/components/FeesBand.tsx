import Link from "next/link";
import { FEES, FEE_BENCHMARKS, FEE_EXAMPLE_SALE_PRICE, formatAud, saleFee } from "@/lib/fees";

function ArrowRight() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Homepage fee section: Home7's published fees are its main differentiator,
 * so they sit near the top. The full table, calculator and fee terms live
 * on /fees; this links there rather than repeating it (so /fees, not the
 * homepage, ranks for the fee searches).
 */
export default function FeesBand() {
  const ours = saleFee(FEE_EXAMPLE_SALE_PRICE);
  const typical = saleFee(FEE_EXAMPLE_SALE_PRICE, FEE_BENCHMARKS.saleAvgPercentInclGst);
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">Our fees, published upfront</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">Low, Clear Fees. No Guesswork.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Most agents won&apos;t tell you their fees until they visit. Here are ours.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link href="/fees" className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-gold transition-colors">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">Sell your property</p>
          <p className="mt-2 font-display text-5xl text-brand-navy">{FEES.sale.inclLabel}</p>
          <p className="mt-1 text-lg text-slate-600">{FEES.sale.label} sales commission</p>
          <p className="mt-4 text-lg text-slate-600">
            On a {formatAud(FEE_EXAMPLE_SALE_PRICE)} sale: <strong className="text-brand-navy">{formatAud(ours)}</strong>, compared
            with about {formatAud(typical)} at a typical 2%.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-gold-dark transition-colors group-hover:text-brand-navy">
            See fees and calculate your saving
            <ArrowRight />
          </span>
        </Link>
        <Link href="/property-management" className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-gold transition-colors">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">Property management</p>
          <p className="mt-2 font-display text-5xl text-brand-navy">{FEES.management.inclLabel}</p>
          <p className="mt-1 text-lg text-slate-600">{FEES.management.label} of rent collected</p>
          <p className="mt-4 text-lg text-slate-600">
            Sydney property managers typically charge {FEE_BENCHMARKS.mgmtRangeLabel}. Switching to us is easy.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-gold-dark transition-colors group-hover:text-brand-navy">
            About our property management
            <ArrowRight />
          </span>
        </Link>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        Agent fees only. Marketing, advertising and letting costs are separate. See our{" "}
        <Link href="/terms-and-conditions" className="underline hover:text-brand-navy">fee terms</Link>.
      </p>
    </section>
  );
}
