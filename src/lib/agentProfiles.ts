import { GOOGLE_RATING, SITE_URL } from "./constants";
import { FEES } from "./fees";

/**
 * Extra, hand-written profile content for agents whose page should rank on
 * its own (title, meta description, services, FAQs, reviews). Everything
 * here is optional: an agent with no entry keeps the generic page built
 * from their DB record. The bio itself stays in the DB (admin-editable);
 * this holds the parts that need page structure, not just paragraphs.
 *
 * No em dashes in any visible string here (site copy rule).
 */
export interface AgentProfile {
  /** Name people actually search ("Mohammed Islam", not "Mohammed R Islam"). */
  alternateName?: string;
  /** Full <title>, used as-is (no " | Home7 Real Estate" suffix). Keep under ~60 chars. */
  seoTitle?: string;
  seoDescription?: string;
  /** One line under the role in the hero. */
  tagline?: string;
  /** Years in Sydney real estate, shown as "15+". */
  yearsExperience?: number;
  /** Shows the Google reviews section (every current review names Mohammed). */
  showReviews?: boolean;
  services?: { title: string; text: string; href: string; cta: string }[];
  faqs?: { q: string; a: string }[];
}

export const PRINCIPAL_SLUG = "mohammed-r-islam";

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  [PRINCIPAL_SLUG]: {
    alternateName: "Mohammed Islam",
    seoTitle: "Mohammed Islam | Real Estate Agent Liverpool & Campbelltown",
    seoDescription: `Mohammed Islam founded Home7 Real Estate in Liverpool after 15 years with Sydney agencies. Sell for ${FEES.sale.label}, management ${FEES.management.label}. Rated ${GOOGLE_RATING.value} on Google.`,
    tagline: "Real estate agent in Liverpool, Campbelltown and South West Sydney",
    yearsExperience: 15,
    showReviews: true,
    services: [
      {
        title: "Selling your property",
        text: `An honest price based on real local sales, a clear marketing plan, and a ${FEES.sale.label} commission (${FEES.sale.inclLabel}), in writing before you sign.`,
        href: "/free-market-appraisal",
        cta: "Get a free appraisal",
      },
      {
        title: "Leasing and property management",
        text: `Tenant screening, leases, rent collection, inspections and repairs for ${FEES.management.label} of rent, with one person you can actually reach.`,
        href: "/property-management",
        cta: "Talk about your rental",
      },
      {
        title: "Buying in South West Sydney",
        text: "Local advice on suburbs, prices and new estates from someone who has sold and leased homes across the area for years.",
        href: "/buyers-advisory",
        cta: "Buyer advice",
      },
    ],
    faqs: [
      {
        q: "How long has Mohammed Islam worked in real estate?",
        a: "More than 15 years. Mohammed spent 15 years working with real estate agencies across Sydney before founding Home7 Real Estate in Liverpool, where he now looks after sales, leasing and property management himself.",
      },
      {
        q: "Is Home7 Real Estate an affordable agent in Liverpool and Campbelltown?",
        a: `Yes. Home7 publishes its fees: ${FEES.sale.label} (${FEES.sale.inclLabel}) to sell and ${FEES.management.label} (${FEES.management.inclLabel}) for property management, compared with Liverpool averages of about 2% commission and 5% to 8% for management. As a small, independent family business there are no franchise overheads to pass on, and Google reviewers regularly mention the low cost and great value.`,
      },
      {
        q: "How is working with Mohammed different from a big-name agency?",
        a: "You deal with Mohammed directly, from the first appraisal through to settlement or the lease signing, instead of being passed between staff. He treats clients like close friends: honest advice, quick replies and regular updates. Many clients come back to him for their next sale or investment property.",
      },
      {
        q: "Which suburbs does Mohammed cover?",
        a: "Liverpool, Campbelltown and South West Sydney, including Warwick Farm, Casula, Prestons, Moorebank, Edmondson Park, Austral, Leppington, Oran Park, Minto, Ingleburn and Leumeah. The office is at Suite 1/209 Macquarie Street in the Liverpool CBD.",
      },
      {
        q: "How do I book a free appraisal with Mohammed?",
        a: "Call the office on (02) 8729 7753, message him on WhatsApp, or send the form on this page. The appraisal is free with no obligation, and you get an honest price range for selling or renting based on recent comparable results nearby.",
      },
    ],
  },
};

export function getAgentProfile(slug: string): AgentProfile {
  return AGENT_PROFILES[slug] ?? {};
}

/** Stable schema.org @id for an agent's Person entity. */
export function agentPersonId(slug: string) {
  return `${SITE_URL}/agent/${slug}#person`;
}
