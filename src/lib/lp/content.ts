import { SITE } from "./site";
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
    description: fill("Family-owned local property managers in {region}. Low, negotiable fees, real support and a free rental appraisal. Talk to a real person today.", region),
    eyebrow: fill("{region} property management", region),
    h1: isSwitch
      ? "Unhappy with your property manager? Just say yes. We handle the switch."
      : region === "all"
        ? "Property management that actually picks up the phone."
        : fill("{region} property management that actually picks up the phone.", region),
    subheading: isSwitch
      ? "You don't have to deal with your current agent or work out the paperwork. We take care of everything, and your tenant and rent carry on as normal."
      : "A small, family-owned local team that looks after your investment like it's our own. Low, negotiable fees. Free rental appraisal, no obligation.",
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
      { title: "Low fees, and they're negotiable.", body: "We keep our fees low because we'd rather grow by looking after owners well than by charging more. Tell us what you pay now and let's talk." },
      { title: "Support that doesn't stop after the lease is signed.", body: "Routine inspections with photos, rent arrears followed up fast, repairs handled with your approval, and monthly statements plus an end-of-year summary for your accountant." },
    ],
    included: {
      heading: "Full management, all included",
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
      text: "Our fees are low, and they're negotiable. We'd rather earn your trust and keep you for years than squeeze you on price. Tell us what you're paying now and we'll give you a straight answer, in writing, with no pressure to sign.",
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
      { q: "How much do you charge?", a: "Our fees are low and negotiable. Tell us what you pay now and we'll give you a straight answer, in writing." },
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
    description: fill("Selling in {region}? Honest price advice, low commission and a local agent who keeps you updated. Free, no-obligation market appraisal.", region),
    eyebrow: fill("Selling in {region}", region),
    h1: "Honest price advice, a lower commission, and an agent who picks up the phone.",
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
      { title: "Lower commission, and it's negotiable.", body: "Low commission, agreed in writing up front. Got another agent's quote? Show us and let's talk." },
      { title: "You'll always know what's happening.", body: "Regular updates after every open home and every offer, from the same person, from appraisal to settlement." },
    ],
    included: null,
    feesHeading: "What it costs to sell",
    fees: {
      text: "Our commission is low, and it's negotiable. It's agreed in writing before anything starts, and marketing costs are quoted up front, so you'll know every cost before you decide.",
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
      { q: "How much commission do you charge?", a: "Our commission is low and negotiable, and agreed in writing up front. If you have another quote, show us." },
      { q: "Do I have to sign anything at the appraisal?", a: "No. An appraisal is free and there's no obligation at all." },
      { q: "How long will it take to sell?", a: "It depends on your property and the market. We'll give you a realistic timeframe at the appraisal based on recent local sales." },
      { q: "Auction or private treaty?", a: "We'll recommend what suits your property and your timeline, and explain the trade-offs honestly." },
      { q: "Which suburbs do you cover?", a: COVERAGE_SELL },
    ],
    finalHeading: "Find out what your home is worth",
    finalSub: "A free, honest appraisal from a friendly local team. No obligation.",
  };
}

export function getContent(type: LpLeadType, region: RegionKey, intent?: LpIntent): LpCopy {
  return type === "pm" ? pmContent(region, intent) : sellContent(region);
}

export const THANK_YOU = {
  pmSwitchFirst: "We'll take care of the switch with your current agent. You don't need to contact them.",
  pm: ["We'll ask a few quick questions about your property.", "We'll arrange a time for your free rental appraisal.", "You'll get an honest rent estimate and our fees in writing."],
  sell: ["We'll ask a few quick questions about your home.", "We'll book your free market appraisal at a time that suits you.", "You'll get an honest price range backed by recent local sales."],
} as const;
