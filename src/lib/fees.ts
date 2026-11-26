/**
 * Home7's published fees: the single source of truth. Every page, FAQ,
 * landing page and JSON-LD block reads these, so a fee change is one edit
 * here and can never leave two pages disagreeing (which matters for
 * Google, AI answer engines and Australian Consumer Law alike).
 *
 * Approved for publication by Mohammed (principal) on 2026-11-27.
 * The GST-inclusive figure is always the prominent one (ACL single-price
 * rule); "1% + GST" sits beside it.
 *
 * These are agent fees only. Marketing/advertising (portal listings,
 * photography, signboards) and letting/leasing costs are separate, as set
 * out on /terms-and-conditions. Mention that wherever a fee is shown, but
 * don't headline it (client's instruction).
 */
export const FEES = {
  sale: {
    /** Commission, % of sale price, excl. GST. */
    percent: 1,
    percentInclGst: 1.1,
    label: "1% + GST",
    inclLabel: "1.1% incl. GST",
    name: "Sales commission",
  },
  management: {
    /** Management fee, % of rent collected, excl. GST. */
    percent: 4,
    percentInclGst: 4.4,
    label: "4% + GST",
    inclLabel: "4.4% incl. GST",
    name: "Property management fee",
  },
} as const;

/**
 * Market comparison points, sourced (checked 2026-11-27):
 * - Liverpool sales commission averages about 1.9% to 2% incl. GST
 *   (LocalAgentFinder Liverpool 2170; OpenAgent NSW average 1.85%).
 * - Sydney management fees typically 5% to 8% of rent
 *   (WhichRealEstateAgent; LocalAgentFinder), some agencies plus GST.
 * The calculator defaults are fair midpoints, and every comparison is
 * labelled as an example the visitor can change.
 */
export const FEE_BENCHMARKS = {
  saleAvgPercentInclGst: 2,
  saleAvgLabel: "about 1.9% to 2%",
  mgmtRangeLabel: "about 5% to 8%",
  mgmtExamplePercentInclGst: 6.6, // 6% + GST
} as const;

export const FEE_EXAMPLE_SALE_PRICE = 900_000;
export const FEE_EXAMPLE_WEEKLY_RENT = 650;
export const FEE_TERMS_UPDATED = "27 November 2026";

/** Separate costs, stated plainly (legal clarity, not a headline). */
export const SALE_SEPARATE_COSTS =
  "Marketing and advertising, such as realestate.com.au and Domain listings, photography, floor plans and signboards, are separate and quoted in writing before your campaign starts.";
export const MANAGEMENT_SEPARATE_COSTS =
  "Letting fees and other leasing costs, such as advertising a vacant property, are separate and set out in your management agreement before you sign.";

export function saleFee(price: number, percentInclGst: number = FEES.sale.percentInclGst) {
  return Math.round((price * percentInclGst) / 100);
}

/** Yearly management fee on a weekly rent (52 weeks). */
export function managementFeeYearly(weeklyRent: number, percentInclGst: number = FEES.management.percentInclGst) {
  return Math.round((weeklyRent * 52 * percentInclGst) / 100);
}

export function formatAud(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}
