import { SITE } from "./site";
import { REGIONS, type RegionKey } from "./regions";
import type { LpLeadType } from "./validation";

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
  fees: {
    rows: { label: string; value: string }[] | null;
    fallback: string;
    button: string;
  };
  howHeading: string;
  how: { title: string; body: string }[];
  switching: { heading: string; steps: { title: string; body: string }[]; footnote: string } | null;
  recentHeading: string;
  recentBadge: "Leased" | "Sold";
  faqHeading: string;
  faq: { q: string; a: string }[];
  finalHeading: string;
  finalSub: string;
};

export const TEAM = [
  { slug: "tunajjina-islam", name: "Tunajjina Islam", role: "Property Manager", photo: "/images/team/tunajjina-islam.jpg", group: "pm" },
  { slug: "mohammed-r-islam", name: "Mohammed R Islam", role: "Principal", photo: "/images/team/mohammed-r-islam.png", group: "both" },
  { slug: "ahmad-mehmood", name: "Ahmad Mehmood", role: "Sales Consultant", photo: "/images/team/ahmad-mehmood.png", group: "sell" },
  { slug: "anju-gurung", name: "Anju Gurung", role: "Sales Consultant", photo: "/images/team/anju-gurung.jpg", group: "sell" },
] as const;
// CONFIRM: which direct mobile belongs to whom before showing any. Until then
// only the main office number is shown.

export function teamFor(type: LpLeadType) {
  const rank = (g: string) => (g === type ? 0 : g === "both" ? 1 : 2);
  return [...TEAM].sort((a, b) => rank(a.group) - rank(b.group));
}

function fill(str: string, region: RegionKey) {
  const r = REGIONS[region];
  return str.replaceAll("{region}", r.name).replaceAll("{label}", r.label);
}

const first8 = (region: RegionKey) => REGIONS[region].suburbs.slice(0, 8).join(", ");

const MICROCOPY = `No obligation. No spam. A real person from our Liverpool office calls you back ${SITE.callbackPromise}.`;

function pmFeeSentence() {
  const { managementPercent: m, lettingFeeWeeks: w } = SITE.fees;
  if (m != null && w != null) {
    return `${m}% management fee and a ${w}-week letting fee. That's it. No surprise charges on your statement.`;
  }
  return "Low, transparent fees in writing before you sign anything. Ask us for our fee sheet and compare.";
}

function sellFeeSentence() {
  const c = SITE.fees.salesCommissionFrom;
  // CONFIRM what's included in the commission before publishing a number.
  if (c) return `Commission from ${c}, with full marketing and negotiation included.`;
  return "Low commission, agreed in writing up front. Ask us to compare it with the other quotes you've received.";
}

function pmContent(region: RegionKey): LpCopy {
  const { managementPercent: m, lettingFeeWeeks: w } = SITE.fees;
  const feesSet = m != null && w != null;
  return {
    title: fill("Property Management {region} | Home7 Real Estate", region),
    description: fill("Family-owned local property managers in {region}. Low, clear fees, real support and a free rental appraisal. Talk to a real person today.", region),
    eyebrow: fill("{region} property management", region),
    h1: region === "all" ? "Property management that actually picks up the phone." : fill("{region} property management that actually picks up the phone.", region),
    subheading: "A small, family-owned local team that looks after your investment like it's our own. Low, clear fees. Free rental appraisal, no obligation.",
    form: {
      heading: "Find out what your property should rent for",
      chipsLabel: "What do you need?",
      chips: ["Rent out my property", "Switch from my current agent", "Just an appraisal"],
      chipsName: "intent",
      suburbLabel: "Property suburb",
      suburbAutocomplete: "address-level2",
      button: "Get my free rental appraisal",
    },
    microcopy: MICROCOPY,
    whyHeading: fill("Why landlords in {label} switch to Home7", region),
    why: [
      { title: "We answer. Every time.", body: "Call, text or email and you'll hear back the same day from the person who actually looks after your property. No call centres, no being passed around." },
      { title: "Low, clear fees.", body: pmFeeSentence() },
      // CONFIRM: that these are the services Home7 actually provides.
      { title: "Support that doesn't stop after the lease is signed.", body: "Routine inspections with photos, rent arrears followed up fast, repairs handled with your approval, and monthly statements plus an end-of-year summary for your accountant." },
    ],
    feesHeading: "What it costs",
    fees: {
      rows: feesSet
        ? [
            { label: "Management fee", value: `${m}% of rent collected` },
            { label: "Letting fee", value: `${w} week${w === 1 ? "" : "s"}' rent` },
            // CONFIRM: that there really are no other charges.
            { label: "Anything else", value: "No hidden extras" },
          ]
        : null,
      fallback: "We keep our fees low because we'd rather grow by looking after owners well. Tell us about your property and we'll send our full fee sheet in writing, with no pressure to sign.",
      button: "Get our fee sheet",
    },
    howHeading: "How it works",
    how: [
      { title: "Tell us about your property", body: "Fill in the form or call us. It takes 30 seconds." },
      { title: "Free rental appraisal", body: "We look at your property and tell you honestly what it should rent for in today's market." },
      { title: "We lease it and look after it", body: "We find a quality tenant and manage everything from there, and you always have someone to call." },
    ],
    switching: {
      heading: "Switching agents is easier than you think",
      steps: [
        { title: "Check your current agreement.", body: "Most management agreements have a notice period. We'll help you read yours." },
        { title: "Give notice.", body: "We'll give you simple wording to send to your current agent." },
        // CONFIRM: the exact handover process.
        { title: "We take it from there.", body: "We collect the keys, tenant file and bond details and let your tenant know, so there's no disruption to your rent." },
      ],
      footnote: "General information only. Your agreement's terms apply.",
    },
    recentHeading: "Recently leased by Home7",
    recentBadge: "Leased",
    faqHeading: "Common questions",
    faq: [
      { q: "How much do you charge?", a: pmFeeSentence() },
      // CONFIRM: typical timeframe.
      { q: "How quickly can you find a tenant?", a: "It depends on the property and the time of year, but we'll give you an honest timeframe at your appraisal, along with what we'll do to find the right tenant quickly." },
      { q: "What happens if my tenant stops paying?", a: "We follow up arrears quickly and keep you informed at every step, including the NSW Civil and Administrative Tribunal (NCAT) process if it ever comes to that." },
      // CONFIRM: the actual term / notice period.
      { q: "Am I locked into a long contract?", a: "Every agreement is different, so we'll walk you through the term and notice period in plain English before you sign anything." },
      { q: "Which suburbs do you cover?", a: fill(`We manage properties across {label}, including ${first8(region)}, and surrounding suburbs.`, region) },
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
    microcopy: MICROCOPY,
    whyHeading: fill("Why owners in {label} sell with Home7", region),
    why: [
      { title: "An honest price, not an inflated one.", body: "We won't overquote to win your listing. You'll get a realistic price range backed by recent local sales." },
      { title: "Lower commission, full service.", body: sellFeeSentence() },
      { title: "You'll always know what's happening.", body: "Regular updates after every open home and every offer, from the same person, from appraisal to settlement." },
    ],
    feesHeading: "What it costs to sell",
    fees: {
      rows: SITE.fees.salesCommissionFrom
        ? [{ label: "Commission", value: `From ${SITE.fees.salesCommissionFrom}` }]
        : null,
      fallback: "Our commission is low and agreed in writing before anything starts. Marketing costs are quoted up front, so you'll know every cost before you decide.",
      button: "Get my free appraisal",
    },
    howHeading: "How it works",
    how: [
      { title: "Free market appraisal", body: "We visit, look at recent sales nearby and give you an honest price range." },
      { title: "Your selling plan", body: "Price, marketing and timing, with every cost agreed up front." },
      { title: "Sold, with updates all the way", body: "We negotiate hard for you and keep you informed at every step." },
    ],
    switching: null,
    recentHeading: "Recently sold by Home7",
    recentBadge: "Sold",
    faqHeading: "Common questions",
    faq: [
      { q: "How much commission do you charge?", a: sellFeeSentence() },
      { q: "Do I have to sign anything at the appraisal?", a: "No. An appraisal is free and there's no obligation at all." },
      { q: "How long will it take to sell?", a: "It depends on your property and the market. We'll give you a realistic timeframe at the appraisal based on recent local sales." },
      { q: "Auction or private treaty?", a: "We'll recommend what suits your property and your timeline, and explain the trade-offs honestly." },
      { q: "Which suburbs do you cover?", a: fill(`We sell homes across {label}, including ${first8(region)}, and surrounding suburbs.`, region) },
    ],
    finalHeading: "Find out what your home is worth",
    finalSub: "A free, honest appraisal from a friendly local team. No obligation.",
  };
}

export function getContent(type: LpLeadType, region: RegionKey): LpCopy {
  return type === "pm" ? pmContent(region) : sellContent(region);
}

export const THANK_YOU = {
  pm: ["We'll ask a few quick questions about your property.", "We'll arrange a time for your free rental appraisal.", "You'll get an honest rent estimate and our fee sheet in writing."],
  sell: ["We'll ask a few quick questions about your home.", "We'll book your free market appraisal at a time that suits you.", "You'll get an honest price range backed by recent local sales."],
} as const;
