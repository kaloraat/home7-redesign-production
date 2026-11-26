import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { FEES, FEE_TERMS_UPDATED, MANAGEMENT_SEPARATE_COSTS, SALE_SEPARATE_COSTS } from "@/lib/fees";
import PageHero from "@/components/PageHero";

const TITLE = "Terms and Conditions";
const DESCRIPTION = "Terms for Home7 Real Estate's published fees and for using this website.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/terms-and-conditions"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Terms and Conditions", item: `${SITE_URL}/terms-and-conditions` },
  ],
};

const h2 = "mt-10 font-display text-2xl text-brand-navy";
const p = "mt-4 text-lg text-slate-600 leading-relaxed";

export default function Page() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PageHero crumb="Terms and Conditions" title="Terms and Conditions" />

      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-sm text-slate-500">Last updated {FEE_TERMS_UPDATED}</p>

        <h2 id="fees" className={h2}>1. Our fees</h2>
        <p className={p}>
          The fees published on this website are Home7 Real Estate&apos;s standard agent fees for residential property
          in the areas we service.
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-lg text-slate-600 leading-relaxed">
          <li>
            <strong className="text-brand-navy">Sales commission:</strong> {FEES.sale.label} ({FEES.sale.inclLabel}) of the
            sale price, payable at settlement. {SALE_SEPARATE_COSTS} Auction costs, where you choose to sell by auction,
            are also separate.
          </li>
          <li>
            <strong className="text-brand-navy">Property management fee:</strong> {FEES.management.label} (
            {FEES.management.inclLabel}) of rent collected. {MANAGEMENT_SEPARATE_COSTS}
          </li>
        </ul>
        <p className={p}>
          These fees apply in normal circumstances. In some circumstances, for example a commercial or unusual property,
          a property outside our usual service area, or a campaign that needs significantly more work than usual, a
          different fee may apply. If so, we will explain it before you sign anything.
        </p>
        <p className={p}>
          In every case, the fees that apply to you are the ones set out in the agency agreement or management agreement
          you sign with us. That agreement includes all commission, fees and expenses, and it takes priority over
          anything on this website. NSW cooling-off rights apply to residential sales agency agreements.
        </p>
        <p className={p}>
          We may change our published fees from time to time. A change does not affect an agreement you have already
          signed.
        </p>

        <h2 className={h2}>2. Calculators and examples</h2>
        <p className={p}>
          Fee calculators and worked examples on this website are estimates only. They compare agent fees only and do not
          include marketing, advertising, leasing or other costs. Figures for other agents are averages reported by agent
          comparison websites and will vary.
        </p>

        <h2 className={h2}>3. Website information</h2>
        <p className={p}>
          We take care to keep information on this website accurate, but property details, prices and market information
          are provided as a guide and may change. Please make your own enquiries and get independent advice before making
          a property or financial decision.
        </p>

        <h2 className={h2}>4. Privacy</h2>
        <p className={p}>
          How we handle personal information is explained in our{" "}
          <Link href="/privacy-policy" className="font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark">
            privacy policy
          </Link>
          .
        </p>

        <h2 className={h2}>5. Contact</h2>
        <p className={p}>
          Questions about our fees or these terms? Call {COMPANY.phone}, email {COMPANY.email}, or visit us at{" "}
          {COMPANY.address}.
        </p>
      </div>
    </div>
  );
}
