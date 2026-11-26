import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, ORG_ID, SITE_URL, TARGET_SUBURBS } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import {
  FEES,
  FEE_BENCHMARKS,
  FEE_EXAMPLE_SALE_PRICE,
  FEE_EXAMPLE_WEEKLY_RENT,
  MANAGEMENT_SEPARATE_COSTS,
  SALE_SEPARATE_COSTS,
  formatAud,
  managementFeeYearly,
  saleFee,
} from "@/lib/fees";
import PageHero from "@/components/PageHero";
import FeeCalculator from "@/components/FeeCalculator";
import FaqSection, { type FaqItem } from "@/components/FaqSection";
import Testimonials from "@/components/Testimonials";
import { getContentBySlug } from "@/lib/queries";

/*
 * /fees owns the fee searches ("real estate agent fees Liverpool",
 * "low commission real estate agent", "affordable agent"). Property
 * management fees get a short section here but /property-management owns
 * those searches, and the blog cost-to-sell guide is informational and
 * links here, so the three don't compete.
 */
const TITLE = `Real Estate Agent Fees Liverpool | ${FEES.sale.label} to Sell | Home7`;
const DESCRIPTION = `Home7 charges ${FEES.sale.label} (${FEES.sale.inclLabel}) to sell and ${FEES.management.label} to manage your property in Liverpool and South West Sydney. See our exact fees and work out your saving.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/fees"),
};

const exampleSale = saleFee(FEE_EXAMPLE_SALE_PRICE);
const exampleOther = saleFee(FEE_EXAMPLE_SALE_PRICE, FEE_BENCHMARKS.saleAvgPercentInclGst);
const exampleMgmt = managementFeeYearly(FEE_EXAMPLE_WEEKLY_RENT);

const FAQ: FaqItem[] = [
  {
    q: "How much does Home7 charge to sell a house?",
    a: `Our sales commission is ${FEES.sale.label}, which is ${FEES.sale.inclLabel}, of the sale price. On a ${formatAud(FEE_EXAMPLE_SALE_PRICE)} sale that is ${formatAud(exampleSale)}. At a typical Liverpool rate of 2%, the same sale would cost ${formatAud(exampleOther)} in commission.`,
  },
  {
    q: "Is the 1% fee really 1%, or is it a 'from' price?",
    a: `It is our standard fee, not a "from" price. Sellers across Liverpool, Campbelltown and South West Sydney pay ${FEES.sale.label}. In rare, unusual circumstances a different fee may apply, and if so we explain it and put it in writing before you sign anything.`,
  },
  {
    q: "What is not included in the commission?",
    a: `${SALE_SEPARATE_COSTS} Most agents charge marketing separately too, so compare commission with commission.`,
  },
  {
    q: "How much is property management?",
    a: `Our management fee is ${FEES.management.label} (${FEES.management.inclLabel}) of the rent we collect. On a ${formatAud(FEE_EXAMPLE_WEEKLY_RENT)} a week rental that is about ${formatAud(exampleMgmt)} a year. ${MANAGEMENT_SEPARATE_COSTS}`,
  },
  {
    q: "How can Home7 charge less than other agents?",
    a: "Home7 is a small, family-owned agency. We don't pay franchise fees to a head office, we run a lean office, and our principal Mohammed Islam works with clients directly. Lower overheads mean we can charge less and still give every client our full attention.",
  },
  {
    q: "Does a lower fee mean a lower level of service?",
    a: "No. You deal with Mohammed, who has more than 15 years in Sydney real estate, from the first appraisal to settlement. Our Google reviews regularly mention our communication, honesty and negotiation, as well as our low fees.",
  },
  {
    q: "Who is the most affordable real estate agent in Liverpool?",
    a: `Home7 Real Estate publishes its fees: ${FEES.sale.label} to sell and ${FEES.management.label} for property management, compared with Liverpool averages of ${FEE_BENCHMARKS.saleAvgLabel} commission and ${FEE_BENCHMARKS.mgmtRangeLabel} for management. Whichever agent you choose, compare written quotes and check their reviews and recent local results.`,
  },
];

const serviceJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Residential property sales",
    serviceType: "Real estate sales agent",
    provider: { "@type": "RealEstateAgent", "@id": ORG_ID, name: "Home7 Real Estate" },
    areaServed: TARGET_SUBURBS.map((s) => ({ "@type": "City", name: s })),
    offers: {
      "@type": "Offer",
      description: `Sales commission ${FEES.sale.label} (${FEES.sale.inclLabel}) of the sale price. Marketing and advertising are separate.`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: FEES.sale.percentInclGst,
        priceCurrency: "AUD",
        unitText: "percent of sale price, including GST",
        valueAddedTaxIncluded: true,
      },
    },
  },
  {
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
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Our Fees", item: `${SITE_URL}/fees` },
  ],
};

function PriceCard({ kicker, big, small, note, children }: { kicker: string; big: string; small: string; note: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold-dark">{kicker}</p>
      <p className="mt-3 font-display text-5xl text-brand-navy">{big}</p>
      <p className="mt-1 text-lg text-slate-600">{small}</p>
      <div className="mt-4 flex-1 text-lg text-slate-600 leading-relaxed">{children}</div>
      <p className="mt-4 text-sm text-slate-500">{note}</p>
    </div>
  );
}

// Informational companion post; only linked once it's published.
const COST_GUIDE_SLUG = "how-much-does-it-cost-to-sell-a-house-liverpool";

export default async function Page() {
  const costGuide = await getContentBySlug(COST_GUIDE_SLUG, "blog").catch(() => null);
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {serviceJsonLd.map((s) => (
        <script key={s.name} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <PageHero crumb="Our Fees" title={`Real Estate Agent Fees in Liverpool: Sell for ${FEES.sale.label}`}>
        Exact fees, published upfront. No &quot;call us for a quote&quot;.
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 py-14">
        <p className="mx-auto max-w-3xl text-center text-lg text-slate-600 leading-relaxed">
          Most agencies won&apos;t tell you their fees until you invite them round. We think you should know before you
          call. Home7 is a family-owned agency in the Liverpool CBD, and these are the fees we charge sellers and
          landlords across Liverpool, Campbelltown and South West Sydney.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <PriceCard
            kicker="Selling"
            big={FEES.sale.inclLabel}
            small={`${FEES.sale.label} sales commission`}
            note={SALE_SEPARATE_COSTS}
          >
            On a {formatAud(FEE_EXAMPLE_SALE_PRICE)} sale, our commission is <strong>{formatAud(exampleSale)}</strong>. At
            a typical Liverpool rate of 2% it would be {formatAud(exampleOther)}, so you keep{" "}
            <strong>{formatAud(exampleOther - exampleSale)}</strong> more.
          </PriceCard>
          <PriceCard
            kicker="Property management"
            big={FEES.management.inclLabel}
            small={`${FEES.management.label} of rent collected`}
            note={MANAGEMENT_SEPARATE_COSTS}
          >
            On a {formatAud(FEE_EXAMPLE_WEEKLY_RENT)} a week rental, our management fee is about{" "}
            <strong>{formatAud(exampleMgmt)} a year</strong>. Sydney agents typically charge {FEE_BENCHMARKS.mgmtRangeLabel}.{" "}
            <Link href="/property-management" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
              About our property management
            </Link>
          </PriceCard>
        </div>

        <h2 className="mt-16 text-center font-display text-3xl text-brand-navy">Work Out Your Saving</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-slate-600">
          Enter your price or rent, and the fee another agent has quoted you.
        </p>
        <div className="mx-auto mt-8 max-w-3xl">
          <FeeCalculator />
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-brand-navy">What you get when you sell</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-lg text-slate-600">
              <li>A free, honest appraisal based on real local sales</li>
              <li>Pricing and campaign advice for your property</li>
              <li>Open homes and private inspections</li>
              <li>Follow-up with every buyer enquiry</li>
              <li>Negotiation to get you the best price we can</li>
              <li>Support through exchange and settlement</li>
              <li>Mohammed looking after you personally, start to finish</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-brand-navy">Why our fees are lower</h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              We are a small, independent family business. There are no franchise fees going to a head office and no
              layers of staff to pay for. Our principal, Mohammed Islam, spent 15 years with agencies across Sydney
              before starting Home7 in 2020, and he built it to give clients the experience of a big agency without the
              big-agency fees. We grow through referrals and reviews, so we would rather charge fairly and keep you for
              years.
            </p>
          </div>
        </div>

        <div className="mt-16 overflow-x-auto">
          <h2 className="text-center font-display text-3xl text-brand-navy">Home7 Compared With Typical Fees</h2>
          <table className="mx-auto mt-8 w-full max-w-3xl border-collapse text-left text-lg">
            <thead>
              <tr className="border-b-2 border-brand-gold text-brand-navy">
                <th className="py-3 pr-4"></th>
                <th className="py-3 pr-4">Home7</th>
                <th className="py-3">Typical in Liverpool and Sydney</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 font-semibold text-brand-navy">Sales commission</td>
                <td className="py-3 pr-4">{FEES.sale.inclLabel}</td>
                <td className="py-3">{FEE_BENCHMARKS.saleAvgLabel}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 font-semibold text-brand-navy">On a {formatAud(FEE_EXAMPLE_SALE_PRICE)} sale</td>
                <td className="py-3 pr-4">{formatAud(exampleSale)}</td>
                <td className="py-3">about {formatAud(exampleOther)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 font-semibold text-brand-navy">Property management</td>
                <td className="py-3 pr-4">{FEES.management.inclLabel}</td>
                <td className="py-3">{FEE_BENCHMARKS.mgmtRangeLabel}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 font-semibold text-brand-navy">Fees published online</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3">Often only after an appraisal</td>
              </tr>
            </tbody>
          </table>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-500">
            Typical figures are averages reported by agent comparison sites (Liverpool commission about 1.9% to 2%
            including GST; Sydney management fees about 5% to 8%). Individual agents vary.
          </p>
        </div>
      </div>

      <Testimonials eyebrow="Google reviews" heading="Low Fees, Great Service: Real Reviews" />

      <FaqSection
        heading="Questions About Our Fees"
        items={FAQ}
        footer={
          <>
            Full details are in our{" "}
            <Link href="/terms-and-conditions" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
              fee terms
            </Link>
.
            {costGuide && (
              <>
                {" "}Want the full picture of selling costs? Read{" "}
                <Link href={`/blog/${COST_GUIDE_SLUG}`} className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
                  how much it costs to sell a house in Liverpool
                </Link>
                .
              </>
            )}
          </>
        }
      />

      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="font-display text-3xl">Get a Free Appraisal and a Written Quote</h2>
          <p className="mt-3 text-lg text-white/85">
            Find out what your property is worth and exactly what you will pay. No obligation.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/free-market-appraisal" className="rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy hover:bg-white">
              Book a free appraisal
            </Link>
            <a href={`tel:${COMPANY.phone.replace(/[^\d]/g, "")}`} className="rounded-md border border-white/40 px-6 py-3 font-semibold hover:border-brand-gold hover:text-brand-gold">
              Call {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
