import Link from "next/link";

const BUTTONS = [
  // shortLabel now consistently "[verb] a Property" — "Sell Property" /
  // "Lease Property" (no article) read like nav-category labels rather
  // than a call to action; "Buy a Property" already had the article, so
  // this makes all three grammatically parallel.
  { label: "Sell My Property", shortLabel: "Sell a Property", href: "/free-market-appraisal?key=selling", tone: "gold" as const },
  { label: "Lease My Property", shortLabel: "Lease a Property", href: "/free-market-appraisal?key=renting", tone: "gold" as const },
  { label: "Buy a Property for Me", shortLabel: "Buy a Property", href: "/free-market-appraisal?key=buying", tone: "gold" as const },
  { label: "Contact Us", shortLabel: "Contact Us", href: "/contact", tone: "navy" as const },
];

const TONE_CLASSES = {
  gold: "bg-brand-gold text-brand-navy hover:brightness-95 hover:shadow-brand-gold-dark/40",
  navy: "bg-brand-navy text-white hover:brightness-110 hover:shadow-brand-navy/40",
};

export function CTAButtons() {
  return (
    <section className="bg-slate-50 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center font-display text-xl text-brand-navy">
          Request your free property price estimate and market guide
        </h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BUTTONS.map((button) => (
            <Link
              key={button.label}
              href={button.href}
              className={`text-center rounded px-4 py-3 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${TONE_CLASSES[button.tone]}`}
            >
              <span className="sm:hidden">{button.shortLabel}</span>
              <span className="hidden sm:inline">{button.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CTAButtons;
