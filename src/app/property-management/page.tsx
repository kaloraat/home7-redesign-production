import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, GOOGLE_RATING, ORG_ID, SITE_URL, TARGET_SUBURBS } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { FEES, FEE_BENCHMARKS, FEE_EXAMPLE_WEEKLY_RENT, MANAGEMENT_SEPARATE_COSTS, formatAud, managementFeeYearly } from "@/lib/fees";
import { getPropertiesByType, getResultCounts } from "@/lib/queries";
import PageHero from "@/components/PageHero";
import FeeCalculator from "@/components/FeeCalculator";
import FaqSection, { type FaqItem } from "@/components/FaqSection";
import Testimonials from "@/components/Testimonials";
import ContactForm from "@/components/ContactForm";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";

/*
 * Owns "property management Liverpool" and "property management fees
 * Liverpool". /fees mentions the management fee briefly and links here;
 * the ad landing page /lp/property-management is noindex, so no overlap.
 */
const TITLE = `Property Management Liverpool | ${FEES.management.label} Fee | Home7`;
const DESCRIPTION = `Local property management in Liverpool, Campbelltown and South West Sydney for ${FEES.management.label} (${FEES.management.inclLabel}). Family-owned, easy switching, rated ${GOOGLE_RATING.value} on Google.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/property-management"),
};

const exampleYear = managementFeeYearly(FEE_EXAMPLE_WEEKLY_RENT);
const exampleOther = managementFeeYearly(FEE_EXAMPLE_WEEKLY_RENT, FEE_BENCHMARKS.mgmtExamplePercentInclGst);

const SERVICES = [
  "Rental appraisal and advice on the right weekly rent",
  "Advertising, open inspections and tenant screening",
  "Lease preparation and bond lodgement",
  "Ingoing and outgoing condition reports",
  "Rent collection and fast arrears follow-up",
  "Routine inspections with photo reports",
  "Repairs and maintenance, with your approval",
  "Rent reviews and lease renewals",
  "Representation at the NSW Civil and Administrative Tribunal if needed",
  "Monthly and end of financial year statements",
];

const FAQ: FaqItem[] = [
  {
    q: "How much does Home7 charge for property management?",
    a: `Our management fee is ${FEES.management.label}, which is ${FEES.management.inclLabel}, of the rent we collect. On a ${formatAud(FEE_EXAMPLE_WEEKLY_RENT)} a week rental that is about ${formatAud(exampleYear)} a year. ${MANAGEMENT_SEPARATE_COSTS}`,
  },
  {
    q: "What do property managers usually charge in Liverpool?",
    a: `Sydney property managers typically charge ${FEE_BENCHMARKS.mgmtRangeLabel} of the rent, and some add GST on top. At 6% plus GST, a ${formatAud(FEE_EXAMPLE_WEEKLY_RENT)} a week rental costs about ${formatAud(exampleOther)} a year in management fees, compared with about ${formatAud(exampleYear)} with Home7.`,
  },
  {
    q: "How do I switch property managers?",
    a: "Tell us you want to switch and we handle it. We work through the notice period in your current agreement, collect the keys, tenant file and bond details from your current agent, and let your tenant know. The tenancy and rent carry on as normal.",
  },
  {
    q: "How often do you inspect my property?",
    a: "We carry out routine inspections with photo reports, within NSW rules, which allow up to four routine inspections in any 12 months. You get a report after each one.",
  },
  {
    q: "What happens if my tenant stops paying rent?",
    a: "We follow up arrears quickly and keep you informed at every step, including the NSW Civil and Administrative Tribunal process if it ever comes to that.",
  },
  {
    q: "Which areas do you manage properties in?",
    a: "Liverpool, Campbelltown and South West Sydney, including Warwick Farm, Casula, Prestons, Moorebank, Edmondson Park, Austral, Leppington, Ingleburn, Minto and Leumeah.",
  },
  {
    q: "Can I talk to my property manager directly?",
    a: "Yes. You will have a direct number, and you will hear back the same day. That is the point of a small, family-owned local team.",
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Property Management", item: `${SITE_URL}/property-management` },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Property management",
  serviceType: "Residential property management",
  provider: { "@type": "RealEstateAgent", "@id": ORG_ID, name: "Home7 Real Estate" },
  areaServed: TARGET_SUBURBS.map((s) => ({ "@type": "City", name: s })),
  url: `${SITE_URL}/property-management`,
  offers: {
    "@type": "Offer",
    description: `Management fee ${FEES.management.label} (${FEES.management.inclLabel}) of rent collected. Letting fees and leasing costs are separate.`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: FEES.management.percentInclGst,
      priceCurrency: "AUD",
      unitText: "percent of rent collected, including GST",
      valueAddedTaxIncluded: true,
    },
  },
};

export default async function Page() {
  const [leased, counts] = await Promise.all([
    getPropertiesByType("leased", 4).catch(() => []),
    getResultCounts().catch(() => ({ sold: 0, leased: 0 })),
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <PageHero crumb="Property Management" title="Property Management in Liverpool & South West Sydney">
        {FEES.management.inclLabel} ({FEES.management.label}) management fee. A local manager who picks up the phone.
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 lg:grid-cols-[1fr_440px] items-start">
        <div>
          <p className="text-lg text-slate-600 leading-relaxed">
            Home7 Real Estate looks after investment properties across Liverpool, Campbelltown and South West Sydney. We
            are a small, family-owned agency, so you deal with people who know your property, answer the phone and treat
            your investment like their own. Our principal, Mohammed Islam, has more than 15 years in Sydney real estate,
            and we have leased {counts.leased > 0 ? `${counts.leased}+` : "many"} properties across the region.
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">Management fee</p>
            <p className="mt-2 font-display text-5xl text-brand-navy">{FEES.management.inclLabel}</p>
            <p className="mt-1 text-lg text-slate-600">{FEES.management.label} of rent collected</p>
            <p className="mt-4 text-lg text-slate-600">
              On a {formatAud(FEE_EXAMPLE_WEEKLY_RENT)} a week rental, that is about <strong>{formatAud(exampleYear)} a year</strong>.
              Sydney agents typically charge {FEE_BENCHMARKS.mgmtRangeLabel}.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {MANAGEMENT_SEPARATE_COSTS}{" "}
              <Link href="/terms-and-conditions" className="underline hover:text-brand-navy">Fee terms</Link>
            </p>
          </div>

          <h2 className="mt-12 font-display text-2xl text-brand-navy">What we look after</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-lg text-slate-600">
            {SERVICES.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden="true" className="text-brand-gold-dark">✓</span>
                {s}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl text-brand-navy">Switching to Home7 is easy</h2>
          <ol className="mt-4 space-y-3 text-lg text-slate-600">
            <li><strong className="text-brand-navy">1. Tell us you want to switch.</strong> Call, email or send the form. It takes a minute.</li>
            <li><strong className="text-brand-navy">2. We handle the handover.</strong> We deal with your current agent for the keys, tenant file and bond details, and let your tenant know.</li>
            <li><strong className="text-brand-navy">3. Nothing changes for your tenant.</strong> The lease and rent carry on as normal, and you pay {FEES.management.label} from then on.</li>
          </ol>

          <h2 className="mt-12 font-display text-2xl text-brand-navy">Compare your current fee</h2>
          <div className="mt-4">
            <FeeCalculator initialMode="management" showTabs={false} />
          </div>
          <p className="mt-4 text-lg text-slate-600">
            Selling instead? See all our{" "}
            <Link href="/fees" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">fees</Link>
            , including our {FEES.sale.label} sales commission.
          </p>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <ContactForm
            leadType="renting"
            heading="Talk to us about your rental"
            intro="Tell us about your property and what you pay now. Mohammed or one of our team will call you back, no pressure."
            fallbackMessage="Property management enquiry"
          />
          <p className="mt-4 text-center text-lg text-slate-600">
            Or call{" "}
            <a href={`tel:${COMPANY.phone.replace(/[^\d]/g, "")}`} className="font-semibold text-brand-navy hover:text-brand-gold-dark">
              {COMPANY.phone}
            </a>
          </p>
        </aside>
      </div>

      {leased.length > 0 && (
        <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 pb-10">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">Recently Leased by Home7</h2>
            <Link href="/leased-properties" className="text-brand-navy font-semibold hover:text-brand-gold-dark">All leased</Link>
          </div>
          <div className="mt-8">
            <ResponsiveCardGrid items={leased} renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />} wide4up />
          </div>
        </div>
      )}

      <Testimonials eyebrow="Google reviews" heading="What Landlords Say About Home7" />

      <FaqSection
        heading="Property Management Questions"
        items={FAQ}
        footer={
          <>
            Ready to find out what your property should rent for?{" "}
            <Link href="/free-market-appraisal?key=renting" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
              Get a free rental appraisal
            </Link>
            .
          </>
        }
      />
    </div>
  );
}
