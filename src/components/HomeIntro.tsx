import Link from "next/link";
import { COMPANY, GOOGLE_RATING } from "@/lib/constants";

type Props = { sold: number; leased: number };

/**
 * Plain-text "who we are" block for the homepage. The page is otherwise
 * mostly listing cards, so this is the main copy Google reads when deciding
 * what the homepage (our page for "real estate agents liverpool") is about.
 * Counts come from the DB so they stay true as listings change.
 */
export function HomeIntro({ sold, leased }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_340px] items-start">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">
            About Home7
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">
            Local Real Estate Agents in Liverpool
          </h2>
          <div className="mt-5 space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              Home7 Real Estate is a family-owned real estate agency in the Liverpool CBD, at{" "}
              {COMPANY.address.replace(", Liverpool NSW 2170", "")}. We help people sell, buy, rent out
              and manage property across Liverpool and South West Sydney, from units near Liverpool
              station to family homes in Casula, Prestons and Warwick Farm and new builds in Austral
              and Leppington.
            </p>
            <p>
              Our principal, Mohammed Islam, works directly with clients. You deal with the same
              people from your first appraisal to settlement or lease signing, you get honest pricing
              based on real local sales, and someone picks up the phone. Our fees are low and
              negotiable, and every cost is in writing before you sign.
            </p>
            <p>
              Thinking of selling or renting out your property? Start with a{" "}
              <Link href="/free-market-appraisal" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
                free market appraisal
              </Link>
              , or meet{" "}
              <Link href="/agents" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
                our team
              </Link>
              .
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          {sold > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <dt className="text-sm text-slate-500">Properties sold</dt>
              <dd className="font-display text-3xl text-brand-navy">{sold}</dd>
            </div>
          )}
          {leased > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <dt className="text-sm text-slate-500">Properties leased</dt>
              <dd className="font-display text-3xl text-brand-navy">{leased}</dd>
            </div>
          )}
          <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">Google rating</dt>
            <dd className="font-display text-3xl text-brand-navy">
              {GOOGLE_RATING.value} <span className="text-base text-slate-500">from {GOOGLE_RATING.count} reviews</span>
            </dd>
          </div>
          <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">Office</dt>
            <dd className="mt-1 text-slate-700">{COMPANY.address}</dd>
            <dd className="mt-1">
              <a href={`tel:${COMPANY.phone.replace(/[^\d]/g, "")}`} className="font-semibold text-brand-navy hover:text-brand-gold-dark">
                {COMPANY.phone}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export default HomeIntro;
