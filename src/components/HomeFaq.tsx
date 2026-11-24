import Link from "next/link";

/**
 * Short homepage FAQ. Kept to agency questions (areas, fees, appraisal,
 * management, office) so it doesn't repeat the longer "how to choose an
 * agent" FAQ on /blog/real-estate-agent-liverpool. FAQPage rich results are
 * limited to government/health sites since 2023, so the markup is for
 * understanding only; the visible text is what counts.
 */
export const HOME_FAQ = [
  {
    q: "Which areas do you cover?",
    a: "We are based in the Liverpool CBD and work across Liverpool and South West Sydney, including Warwick Farm, Casula, Prestons, Moorebank, Edmondson Park, Austral, Leppington, Minto, Ingleburn, Leumeah and Campbelltown.",
  },
  {
    q: "How much do you charge to sell a property?",
    a: "Our fees are low and negotiable. We agree them with you in writing before you sign anything, and we give you a full breakdown of commission and marketing costs at your free appraisal. There are no hidden costs.",
  },
  {
    q: "Is the market appraisal really free?",
    a: "Yes. There is no cost and no obligation. We look at your property and recent comparable sales nearby, then give you an honest price range for selling or renting.",
  },
  {
    q: "Do you manage rental properties?",
    a: "Yes. Our property management covers tenant screening, leases, rent collection, routine inspections and repairs with trusted local tradespeople, so your investment is looked after.",
  },
  {
    q: "Where is your office and when are you open?",
    a: "Our office is at Suite 1/209 Macquarie Street, Liverpool NSW 2170. We are open Monday to Friday 9am to 5pm and Saturday 9am to 4pm. Call us on (02) 8729 7753.",
  },
];

export function HomeFaq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">FAQ</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">Common Questions</h2>
      </div>
      <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {HOME_FAQ.map(({ q, a }) => (
          <details key={q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy text-lg">
              {q}
              <span aria-hidden="true" className="text-brand-gold-dark transition-transform group-open:rotate-45 text-2xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-center text-lg text-slate-600">
        More questions about choosing an agent? Read our{" "}
        <Link href="/blog/real-estate-agent-liverpool" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
          guide to real estate agents in Liverpool
        </Link>
        .
      </p>
    </section>
  );
}

export default HomeFaq;
