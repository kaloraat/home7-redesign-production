import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { SITE_URL } from "@/lib/constants";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";

const TITLE = "Other Properties";
const DESCRIPTION = "Other Home7 Real Estate property listings.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/other-properties"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Other Properties", item: `${SITE_URL}/other-properties` },
  ],
};

// Copy + FAQ from the live site's own /other-properties page — present
// there, missing from this rebuild's first pass. FAQPage JSON-LD alongside
// the visible <details> list (not a duplicate — same Q&A, so Google can
// pick it up as an FAQ rich result without a separate content source to
// keep in sync).
const FAQS = [
  {
    q: "What types of properties are listed on the Other Properties page?",
    a: "Our Other Properties page includes a variety of residential listings, including houses, apartments, townhouses, duplexes, units, and investment properties located throughout Sydney and surrounding suburbs.",
  },
  {
    q: "Are the properties currently available?",
    a: "Yes. We regularly update our listings to reflect available properties. However, property availability may change quickly, so we recommend contacting our team for the latest information.",
  },
  {
    q: "Can I arrange a private inspection?",
    a: "Absolutely. You can contact Home7 Real Estate to arrange a private inspection or attend scheduled open homes where available.",
  },
  {
    q: "Do you help first-home buyers?",
    a: "Yes. Our experienced agents assist first-home buyers throughout the buying process, from selecting suitable properties to understanding the local market and completing the purchase.",
  },
  {
    q: "Do you sell investment properties?",
    a: "Yes. We offer a range of investment properties across Sydney, helping investors identify opportunities with strong rental demand and long-term growth potential.",
  },
  {
    q: "Which Sydney suburbs do you service?",
    a: "Home7 Real Estate works across many Sydney suburbs, including Liverpool, Moorebank, Chipping Norton, Edmondson Park, Parramatta, Harris Park, Pyrmont, North Sydney, Blacktown, Lurnea, Busby, Revesby, Hammondville, Wattle Grove, Holsworthy, Ashcroft, Cartwright, Heckenberg, Sadleir, and surrounding areas.",
  },
  {
    q: "Can Home7 Real Estate help me sell my property?",
    a: "Yes. We provide professional property sales services, including market appraisals, strategic marketing, buyer negotiations, and support throughout the sales process.",
  },
  {
    q: "How do I stay updated on new property listings?",
    a: "You can regularly visit our website or contact our team to learn about new properties that match your preferred location, budget, and lifestyle requirements.",
  },
];

const WHY_CHOOSE = [
  "Wide selection of properties across Sydney",
  "Houses, apartments, townhouses, duplexes, and units",
  "Experienced local real estate professionals",
  "Buyer support throughout the purchasing process",
  "Accurate market knowledge and property advice",
  "Regularly updated listings",
  "Assistance for first-home buyers, investors, and families",
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// Mirrors the Laravel site's own "Other" property_status — off-market,
// land, and development listings that don't fit the sale/rent/sold/leased
// buckets. Confirmed via FrontendController.php: this is its own dedicated
// listing category on the live site, not a placeholder.
export default async function Page() {
  // limit was 100 — this is the full archive for the category, not a
  // preview, and "other" alone passed 100 real listings after importing
  // the legacy property pages found during the pre-domain-switch URL
  // audit (105 total), which silently dropped the 5 oldest off this page
  // entirely (confirmed live: getPropertiesByType sorts createdAt desc,
  // so a hard cap just truncates the tail rather than erroring). 10,000 is
  // a sentinel "no realistic cap" rather than swapping one arbitrary
  // number for another that will eventually run out again too — same fix
  // needed on /properties-for-sale, /properties-for-rent, /sold-properties
  // and /leased-properties, all of which share this same latent bug.
  const properties = await getPropertiesByType("other", 10000);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="font-display text-3xl text-brand-navy">Other Properties</h1>
      {properties.length === 0 ? (
        <p className="mt-10 text-slate-500">No listings in this category right now.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={String(p._id)} property={p} />
          ))}
        </div>
      )}

      {/* SEO copy + FAQ from the live site's own /other-properties page. */}
      <div className="mt-16 text-xl font-medium text-slate-600 leading-[1.85]">
        <h2 className="font-display text-3xl text-brand-navy mb-6">
          Other Properties for Sale in Sydney
        </h2>
        <p className="mb-8">
          At Home7 Real Estate, we understand that every buyer has unique property requirements.
          Our Other Properties collection showcases a diverse range of residential opportunities
          across Sydney, including houses, apartments, townhouses, duplexes, units, and investment
          properties that may not fall into a specific suburb or category.
        </p>
        <p className="mb-8">
          Whether you&apos;re searching for your first home, upgrading to a larger family
          residence, downsizing, or looking for an investment property, our experienced team is
          here to help you find the right opportunity. We regularly update our listings to ensure
          buyers have access to quality properties throughout Liverpool, Western Sydney, North
          Sydney, Parramatta, Pyrmont, Harris Park, and many other sought-after suburbs.
        </p>
        <p className="mb-8">
          Every property listed by Home7 Real Estate is carefully presented with detailed
          descriptions, high-quality images, floor plans where available, and valuable local
          market information to help you make informed decisions.
        </p>
        <p className="mb-8">
          If you can&apos;t find the perfect property today, our team can also assist by notifying
          you when new listings become available that match your requirements.
        </p>
        <p>
          Explore our latest property listings and discover your next home or investment with
          confidence.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-3xl text-brand-navy mb-6">Why Choose Home7 Real Estate?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WHY_CHOOSE.map((item) => (
            <li key={item} className="flex items-start gap-2 text-lg text-slate-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0 text-brand-gold-dark" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-3xl text-brand-navy mb-6">Frequently Asked Questions (FAQs)</h2>
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-brand-navy">
                {f.q}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
