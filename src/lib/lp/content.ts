import { SITE } from "./site";
import { FEES } from "@/lib/fees";
import { REGIONS, type RegionKey } from "./regions";
import type { LpLeadType } from "./validation";

export const SWITCH_CHIP = "Switch from my current agent";
export type LpIntent = "switch" | undefined;

/**
 * All landing-page copy lives here so it can be edited in one place.
 * Copy rules: never "lowest"/"cheapest" (can't be proven under Australian
 * Consumer Law — "low"/"lower" is fine), and never invent reviews, results,
 * numbers of properties managed or percentages.
 */

export type LpCopy = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  subheading: string;
  form: {
    heading: string;
    chipsLabel: string;
    chips: string[];
    chipsName: "intent" | "timeframe";
    suburbLabel: string;
    suburbAutocomplete: string;
    button: string;
  };
  microcopy: string;
  whyHeading: string;
  why: { title: string; body: string }[];
  feesHeading: string;
  fees: { text: string; button: string };
  /** Chip pre-selected in every form on the page (the ?intent=switch variant). */
  defaultChoice: string | null;
  howHeading: string;
  how: { title: string; body: string }[];
  included: { heading: string; items: string[] } | null;
  recentHeading: string;
  recentBadge: "Leased" | "Sold";
  faqHeading: string;
  faq: { q: string; a: string }[];
  finalHeading: string;
  finalSub: string;
};

function fill(str: string, region: RegionKey) {
  const r = REGIONS[region];
  return str.replaceAll("{region}", r.name).replaceAll("{label}", r.label);
}

const COVERAGE_AREAS = "pretty much all of South West and Western Sydney, including the main council areas of Liverpool, Campbelltown, Parramatta and Penrith, and suburbs such as Kellyville and Marsden Park";
const COVERAGE_PM = `We manage properties across ${COVERAGE_AREAS}. Not sure if you're in our area? Just ask.`;
const COVERAGE_SELL = `We sell homes across ${COVERAGE_AREAS}. Not sure if you're in our area? Just ask.`;

const MICROCOPY = `No obligation. No spam. Mohammed or one of our team will call you back ${SITE.callbackPromise}.`;

function pmContent(region: RegionKey, intent: LpIntent): LpCopy {
  const isSwitch = intent === "switch";
  return {
    title: fill("Property Management {region} | Home7 Real Estate", region),
    description: fill(`Family-owned local property managers in {region}. ${FEES.management.label} management fee, real support and a free rental appraisal. Talk to a real person today.`, region),
    eyebrow: fill("{region} property management", region),
    h1: isSwitch
      ? "Unhappy with your property manager? Just say yes. We handle the switch."
      : region === "all"
        ? "Property management that actually picks up the phone."
        : fill("{region} property management that actually picks up the phone.", region),
    subheading: isSwitch
      ? "You don't have to deal with your current agent or work out the paperwork. We take care of everything, and your tenant and rent carry on as normal."
      : `A small, family-owned local team that looks after your investment like it's our own. ${FEES.management.label} management fee. Free rental appraisal, no obligation.`,
    form: {
      heading: "Find out what your property should rent for",
      chipsLabel: "What do you need?",
      chips: ["Rent out my property", SWITCH_CHIP, "Just an appraisal"],
      chipsName: "intent",
      suburbLabel: "Property suburb",
      suburbAutocomplete: "address-level2",
      button: isSwitch ? "Yes, handle my switch" : "Get my free rental appraisal",
    },
    defaultChoice: isSwitch ? SWITCH_CHIP : null,
    microcopy: MICROCOPY,
    whyHeading: fill("Why landlords in {label} switch to Home7", region),
    why: [
      { title: "We answer. Every time.", body: "Call, text or email and you'll hear back the same day from the person who actually looks after your property. No call centres, no being passed around." },
      { title: `${FEES.management.label}. Published, not hidden.`, body: `Our management fee is ${FEES.management.label} (${FEES.management.inclLabel}) of rent collected. We keep it low because we'd rather grow by looking after owners well than by charging more.` },
      { title: "Support that doesn't stop after the lease is signed.", body: "Routine inspections with photos, rent arrears followed up fast, repairs handled with your approval, and monthly statements plus an end-of-year summary for your accountant." },
    ],
    included: {
      heading: "What we look after",
      items: [
        "Rental appraisal and marketing",
        "Open inspections and tenant screening",
        "Lease preparation and bond lodgement",
        "Ingoing and outgoing condition reports",
        "Rent collection and arrears follow-up",
        "Routine inspections with photo reports",
        "Repairs and maintenance, with your approval",
        "Rent reviews and lease renewals",
        "NCAT representation if ever needed",
        "Monthly and end-of-financial-year statements",
      ],
    },
    feesHeading: "What it costs",
    fees: {
      text: `Management fee: ${FEES.management.label} (${FEES.management.inclLabel}) of rent collected. That is well below the 5% to 8% many Sydney agents charge. Letting and leasing costs are separate and listed in writing before you sign. Tell us what you pay now and we'll show you the difference.`,
      button: "Compare my fees",
    },
    howHeading: "How it works",
    how: [
      { title: "Tell us about your property", body: "Fill in the form or call us. It takes 30 seconds." },
      { title: "Free rental appraisal", body: "We look at your property and tell you honestly what it should rent for in today's market." },
      { title: "We lease it and look after it", body: "We find a quality tenant and manage everything from there, and you always have someone to call." },
    ],
    recentHeading: "Recently leased by Home7",
    recentBadge: "Leased",
    faqHeading: "Common questions",
    faq: [
      { q: "How much do you charge?", a: `${FEES.management.label} (${FEES.management.inclLabel}) of rent collected. Letting and leasing costs are separate and set out in writing before you sign.` },
      { q: "How do I switch from my current agent?", a: "Just say yes. We handle the whole switch with your current agent, including the notice, keys, tenant file and bond details, so you don't have to do anything." },
      { q: "How quickly can you find a tenant?", a: "Quickly. Rental demand across Sydney is strong, so we move fast to get your property leased as soon as it's vacant, or on the timing that suits you. We still do our due diligence on every applicant, so you get the best tenant, not just the first one." },
      { q: "What happens if my tenant stops paying?", a: "We follow up arrears quickly and keep you informed at every step, including the NSW Civil and Administrative Tribunal (NCAT) process if it ever comes to that." },
      { q: "Am I locked into a long contract?", a: "No long lock-ins. Our management agreement has a standard notice period, and we'll walk you through it before you sign anything." },
      { q: "Which suburbs do you cover?", a: COVERAGE_PM },
      { q: "Can I talk to my property manager directly?", a: "Yes. You'll have their direct number. That's the point of a small local team." },
    ],
    finalHeading: "Get your free rental appraisal",
    finalSub: "A friendly local team, low fees and real support. Let's talk about your property.",
  };
}

function sellContent(region: RegionKey): LpCopy {
  return {
    title: fill("Sell Your Home in {region} | Home7 Real Estate", region),
    description: fill(`Selling in {region}? Honest price advice, ${FEES.sale.label} commission and a local agent who keeps you updated. Free, no-obligation market appraisal.`, region),
    eyebrow: fill("Selling in {region}", region),
    h1: `Sell for ${FEES.sale.label}. Honest price advice, and an agent who picks up the phone.`,
    subheading: "Family-owned local agency. Get a free, no-obligation market appraisal. We'll tell you what your home is really worth, not just what you want to hear.",
    form: {
      heading: "What's your home worth?",
      chipsLabel: "When are you thinking of selling?",
      chips: ["In the next 3 months", "3–6 months", "Just curious"],
      chipsName: "timeframe",
      suburbLabel: "Property address or suburb",
      suburbAutocomplete: "street-address",
      button: "Get my free market appraisal",
    },
    defaultChoice: null,
    microcopy: MICROCOPY,
    whyHeading: fill("Why owners in {label} sell with Home7", region),
    why: [
      { title: "An honest price, not an inflated one.", body: "We won't overquote to win your listing. You'll get a realistic price range backed by recent local sales." },
      { title: `${FEES.sale.label} commission. In writing.`, body: `Our commission is ${FEES.sale.label} (${FEES.sale.inclLabel}). On a $900,000 sale that's $9,900, compared with about $18,000 at a typical 2%.` },
      { title: "You'll always know what's happening.", body: "Regular updates after every open home and every offer, from the same person, from appraisal to settlement." },
    ],
    included: null,
    feesHeading: "What it costs to sell",
    fees: {
      text: `Our commission is ${FEES.sale.label} (${FEES.sale.inclLabel}) of the sale price. Marketing costs are separate and quoted up front, so you'll know every cost before you decide. Got another agent's quote? Compare it with ours.`,
      button: "Compare my quote",
    },
    howHeading: "How it works",
    how: [
      { title: "Free market appraisal", body: "We visit, look at recent sales nearby and give you an honest price range." },
      { title: "Your selling plan", body: "Price, marketing and timing, with every cost agreed up front." },
      { title: "Sold, with updates all the way", body: "We negotiate hard for you and keep you informed at every step." },
    ],
    recentHeading: "Recently sold by Home7",
    recentBadge: "Sold",
    faqHeading: "Common questions",
    faq: [
      { q: "How much commission do you charge?", a: `${FEES.sale.label} (${FEES.sale.inclLabel}) of the sale price, in writing up front. Marketing costs are separate and quoted before your campaign starts.` },
      { q: "Do I have to sign anything at the appraisal?", a: "No. An appraisal is free and there's no obligation at all." },
      { q: "How long will it take to sell?", a: "It depends on your property and the market. We'll give you a realistic timeframe at the appraisal based on recent local sales." },
      { q: "Auction or private treaty?", a: "We'll recommend what suits your property and your timeline, and explain the trade-offs honestly." },
      { q: "Which suburbs do you cover?", a: COVERAGE_SELL },
    ],
    finalHeading: "Find out what your home is worth",
    finalSub: "A free, honest appraisal from a friendly local team. No obligation.",
  };
}

/** Chips on /lp/local-agent. The choice tells the office seller vs landlord. */
export const LOCAL_CHIPS = {
  sell: "Sell my property",
  rent: "Rent out my property",
  switch: SWITCH_CHIP,
  appraisal: "Just an appraisal",
} as const;

/** Seller / landlord / not yet known, from a /lp/local-agent chip choice. */
export function localLeadKind(choice: string): "sell" | "pm" | null {
  if (choice === LOCAL_CHIPS.sell) return "sell";
  if (choice === LOCAL_CHIPS.rent) return "pm";
  return null;
}

/**
 * /lp/local-agent: general "real estate agent near me" searches, so it has
 * to work for sellers and landlords. Every line is reused (or lightly
 * combined) from the sell and PM copy above. Service area is Liverpool and
 * Campbelltown only on this page.
 */
function localContent(): LpCopy {
  return {
    title: "Local Real Estate Agent Liverpool & Campbelltown | Home7 Real Estate",
    description: `Selling or renting out your property in Liverpool or Campbelltown? Family-owned local agents. Sell for ${FEES.sale.label}, management ${FEES.management.label}. Free appraisal.`,
    eyebrow: "Liverpool & Campbelltown real estate",
    h1: "Selling or renting out your property? Talk to a local agent who picks up the phone.",
    subheading: `A small, family-owned local team. Sell for ${FEES.sale.label}, property management ${FEES.management.label}. Free appraisal, no obligation.`,
    form: {
      heading: "Get your free appraisal",
      chipsLabel: "What do you need?",
      chips: [LOCAL_CHIPS.sell, LOCAL_CHIPS.rent, LOCAL_CHIPS.switch, LOCAL_CHIPS.appraisal],
      chipsName: "intent",
      suburbLabel: "Property suburb",
      suburbAutocomplete: "address-level2",
      button: "Get my free appraisal",
    },
    defaultChoice: null,
    microcopy: MICROCOPY,
    whyHeading: "Why owners in Liverpool and Campbelltown choose Home7",
    why: [
      { title: "We answer. Every time.", body: "Call, text or email and you'll hear back the same day from the person who actually looks after your property. No call centres, no being passed around." },
      { title: "Low fees, published upfront.", body: `${FEES.sale.label} to sell and ${FEES.management.label} for property management. We keep our fees low because we'd rather grow by looking after owners well than by charging more.` },
      { title: "An honest price, not an inflated one.", body: "We won't overquote to win your listing. You'll get a realistic price range backed by recent local sales, or an honest rent estimate if you're leasing." },
    ],
    included: null,
    feesHeading: "What it costs",
    fees: {
      text: `Selling: ${FEES.sale.label} (${FEES.sale.inclLabel}) commission. Property management: ${FEES.management.label} (${FEES.management.inclLabel}) of rent collected. Marketing and letting costs are separate and quoted in writing before you sign.`,
      button: "Compare my fees",
    },
    howHeading: "How it works",
    how: [
      { title: "Tell us about your property", body: "Fill in the form or call us. It takes 30 seconds." },
      { title: "Free appraisal", body: "We look at your property and tell you honestly what it should sell or rent for in today's market." },
      { title: "We sell it or lease it", body: "We negotiate hard for you or find a quality tenant, keep you informed at every step, and you always have someone to call." },
    ],
    recentHeading: "",
    recentBadge: "Sold",
    faqHeading: "Common questions",
    faq: [],
    finalHeading: "Get your free appraisal",
    finalSub: "A friendly local team, low fees and real support. Let's talk about your property.",
  };
}

/** The two "which one are you?" cards on /lp/local-agent. Points come from the sell and PM pages. */
export const LOCAL_PATHS = [
  {
    title: "Selling your home",
    href: "/lp/sell",
    cta: "More about selling with Home7",
    points: [
      "Honest price advice, not an inflated one",
      `${FEES.sale.label} commission, in writing up front`,
      "Regular updates after every open home and offer",
      "Free, no-obligation market appraisal",
    ],
  },
  {
    title: "Renting out your property",
    href: "/lp/property-management",
    cta: "More about property management",
    points: [
      "Full management, all included",
      "Routine inspections with photo reports",
      "Rent arrears followed up fast",
      "Switching agents? Just say yes. We handle the switch.",
    ],
  },
] as const;

export function getContent(type: LpLeadType, region: RegionKey, intent?: LpIntent): LpCopy {
  if (type === "local") return localContent();
  return type === "pm" ? pmContent(region, intent) : sellContent(region);
}

export const THANK_YOU = {
  pmSwitchFirst: "We'll take care of the switch with your current agent. You don't need to contact them.",
  pm: ["We'll ask a few quick questions about your property.", "We'll arrange a time for your free rental appraisal.", "You'll get an honest rent estimate and our fees in writing."],
  sell: ["We'll ask a few quick questions about your home.", "We'll book your free market appraisal at a time that suits you.", "You'll get an honest price range backed by recent local sales."],
  local: ["We'll ask a few quick questions about your property.", "We'll arrange a time for your free appraisal.", "You'll get honest advice and our fees in writing."],
} as const;
