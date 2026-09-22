/**
 * Local SEO target suburbs — see PROJECT_BRIEF.md. Every one of these should
 * eventually have a dedicated, genuinely useful landing page. Liverpool is
 * home base; the rest are the expansion targets.
 */
export const TARGET_SUBURBS = [
  "Liverpool",
  "Campbelltown",
  "Blacktown",
  "Parramatta",
  "Oran Park",
  "Leppington",
  "Austral",
  "Castle Hill",
  "Baulkham Hills",
  "Penrith",
  "Marsden Park",
  "Box Hill",
] as const;

/** "Oran Park" -> "oran-park" — the /suburb/[slug] URL for a target suburb.
 * Shared by SuburbShowcase, the suburb route, sitemap.ts, and the content
 * seed so all four always agree on the same slug for a given suburb name. */
export function suburbSlug(suburb: string): string {
  return suburb.toLowerCase().replace(/\s+/g, "-");
}

export const SITE_NAME = "Home7 Real Estate";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://home7.com.au";

// Shared across SiteNav, the agent profile hero, and the featured team-grid
// card — kept as one constant so all three stay in sync if the brand
// gradient ever changes, rather than three copies of the same CSS string.
export const BRAND_GRADIENT = "linear-gradient(145deg, #071048 0%, #228599 100%)";

// A distinct, more saturated blue palette than the public BRAND_GRADIENT
// above (that one stays as-is everywhere it was already used). Colors
// picked by sampling the REB Dealmakers 2026 promo card the client sent as
// a design reference. The client's follow-up feedback: their card isn't a
// single clean gradient, it's several soft blurred patches of different
// blue shades overlapping (a "mesh gradient" look) — so this is a dark navy
// base plus a handful of blurred glow colors that get layered as separate
// blurred divs (filter: blur), rather than more gradient stops. Started
// admin-only (AdminPageHeader, AdminSidebar's Home7/Admin pill) and then
// reused for BrandStory on the public homepage, so named generically
// ("MESH_", not "ADMIN_") rather than implying it's admin-scoped.
export const MESH_NAVY_BASE = "#0a0e34";
export const MESH_GLOW_BRIGHT_BLUE = "#3f7de5";
export const MESH_GLOW_LIGHT_BLUE = "#6cc4f2";
export const MESH_GLOW_DEEP_BLUE = "#16227a";

// The reference card also sits on its own near-black backdrop, distinct
// from the card itself (MESH_NAVY_BASE above) — sampled from the same
// image. Used behind BrandStory's rounded mesh card on the public
// homepage, matching that two-layer "dark page, lighter rounded card on
// top" structure rather than the card filling the full section width.
export const MESH_SECTION_BACKDROP = "#060a1c";

// Same reference card's pill button — light sky-blue fading to a darker
// teal-blue, white text (not a light pill with dark text, which is what an
// earlier admin prototype used before the client pointed at this image).
export const ADMIN_BUTTON_GRADIENT = "linear-gradient(135deg, #5cbff0 0%, #3b7e9e 100%)";

// A flat (non-gradient) mid-tone pulled from the same glow, for spots where
// a solid blue reads better than a full gradient — e.g. a focus ring or
// hover glow on the pill button above.
export const ADMIN_ACCENT_BLUE = "#2f5fc7";

// Light blue-white for header description text — a step down from the
// title's pure white per the client's ask ("paragraph text white with that
// strong blue"), so title and description read as two distinct weights
// against the busier blurred background.
export const ADMIN_TEXT_BLUE = "#bcdcfb";

export const COMPANY = {
  // Verified against the live site's actual rendered footer (contact_info_items
  // DB row export used earlier had this slightly wrong — "Suite-7, 209
  // Macquarie St" — the live HTML is the more authoritative source since it's
  // what's actually indexed).
  address: "Suite 1/209 Macquarie Street, Liverpool NSW 2170",
  // Used ONLY for the Google Maps link (SiteNav) — "Suite 1/209" (a unit
  // number) geocodes/pin-drops unreliably, since Maps treats the "1/" as
  // part of a unit lookup rather than the building itself; the plain
  // street number takes users straight to the right building. The full
  // `address` above (with the unit) is still what's displayed and what
  // schema.org markup uses — those need the precise address, this is
  // purely a navigation aid.
  mapAddress: "209 Macquarie Street, Liverpool NSW 2170",
  // Structured components of the same address, kept alongside the display
  // string above rather than parsed out of it at render time — string-split
  // parsing of "Suite 1/209 Macquarie Street, Liverpool NSW 2170" is fragile
  // (silently wrong if the format ever changes) and this is used directly
  // for schema.org PostalAddress markup, where a wrong value is worse than
  // an obviously broken one.
  addressParts: {
    streetAddress: "Suite 1/209 Macquarie Street",
    addressLocality: "Liverpool",
    addressRegion: "NSW",
    postalCode: "2170",
    addressCountry: "AU",
  },
  phone: "(02) 8729 7753",
  mobile: "0424 955 108",
  // The live footer lists both numbers (0430 303 059 is the older one, still
  // shown there alongside the newer 0424 955 108) — kept only for the footer,
  // which mirrors production exactly; the nav intentionally shows just the
  // one current number per an earlier explicit instruction.
  mobileSecondary: "0430 303 059",
  email: "admin@home7.com.au",
  // Official Home7 pages — confirmed against the Laravel export
  // (team_members.json): every team member's social icon pointed at one
  // of these same two URLs (nobody had a genuinely personal profile
  // linked), so this is the real fallback for any agent without their
  // own. Both verified live (200 with a browser user-agent — LinkedIn
  // returns its bot-detection 999 to a plain curl request, not a real
  // error).
  facebook: "https://www.facebook.com/Home7-Real-Estate-101028595284471",
  linkedin: "https://www.linkedin.com/company/home7sas/",
};

export const LISTING_TYPES = ["sale", "rent", "sold", "leased", "other"] as const;

// The old site's real property_categories taxonomy (property_categories
// table) — used for the admin "Property Type" field and the public
// listing page's Property Details card. Not an enum on the Property model
// itself (kept as free-text `propertyType?: string`) since this list may
// need a new entry later without a schema migration.
export const PROPERTY_TYPES = [
  "House",
  "Apartment",
  "Apartment Building",
  "Unit",
  "Townhouse",
  "Villa",
  "Flat",
  "Condominium",
  "Single Family",
  "Land",
  "House & Land Package",
  "Acreage",
  "Commercial",
  "Shop",
  "Office",
  "Room",
] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

// Property types with no land of their own — a unit in a building has an
// internal floor size (Property.floorSize) but no actual land size
// (Property.landSize) to speak of. Exported for the one-off migration that
// moved pre-existing landSize values on these types over to floorSize (see
// scripts/backfill-floor-size.ts) — the two are genuinely independent
// fields now (a house can have both at once), not one field with a
// type-dependent label.
export const NO_LAND_PROPERTY_TYPES = new Set<string>([
  "Apartment",
  "Apartment Building",
  "Unit",
  "Flat",
  "Condominium",
  "Room",
  "Office",
  "Shop",
]);

export const LEAD_TYPES = [
  "selling",
  "renting",
  "buying",
  "tenant-application",
  "general-contact",
  "blog",
] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

// Shared across the blog sidebar, the mobile end-of-article form, and the
// mobile floating-button modal (all three render the same ContactForm) —
// one source so the copy can't drift between them.
export const BLOG_CONTACT_FORM_HEADING = "Talk to a Local Property Expert";
export const BLOG_CONTACT_FORM_INTRO =
  "Got a question about buying, selling or renting in Liverpool? Leave your details and a local property expert will get back to you personally — no call centres, no pressure.";

/**
 * Brand story copy, kept verbatim from the live site's homepage blockquote
 * (indexed, distinctive text — not template boilerplate) rather than
 * rewritten, so the homepage redesign doesn't lose existing ranking equity
 * for this passage. See PROJECT_BRIEF.md "Design" section.
 */
export const BRAND_STORY = [
  `You might say 'Real Estate is in our blood'. As proudly 100% Australian owned family business, we've been at the forefront of real estate in Australia since 2020. We continue today with the same focus, culture and ethics that has helped build our reputation as an Australian Super brand. We are continually evolving to ensure we remain ahead of the pack and leaders within the market.`,
  `To this day, Home7 brand continues to strengthen, grow and evolve. We are specialist for Sydney Real Estate Market. Property Selling, management, Auction we handle with our highly skilled. Mind it… Our priority is your satisfaction and this will help us to become the best real estate agent in Liverpool NSW.`,
] as const;

// Pulled out of BRAND_STORY[0] above (it already appears there, in context)
// for BrandStory's magazine-style pull-quote treatment — a short line blown
// up large/bold above the smaller body paragraphs, the way a print
// magazine spread re-states a line from the body copy as a big pull-quote.
// An experiment per the client's request; easy to drop if they don't like
// the repetition of the same line at two sizes.
export const BRAND_STORY_PULLQUOTE = "Real Estate is in our blood";

/**
 * Rewritten from the live site's generic "Customer Service / Professionalism
 * / Respect Feedback / Google & Open Street Maps / Customer Comments" service
 * blurbs — that copy is template boilerplate (not indexed as distinctive
 * content), so it's fair game to improve rather than preserve verbatim.
 */
export const WHY_HOME7 = [
  {
    title: "Local Market Expertise",
    description:
      "Deep, street-by-street knowledge of Liverpool and South West Sydney — not a generic citywide view.",
  },
  {
    title: "Dedicated Communication",
    description:
      "Punctual, responsive and respectful at every step, from first enquiry to settlement.",
  },
  {
    title: "Client-First Service",
    description:
      "We act on feedback and hold ourselves to a high standard of service on every transaction.",
  },
  {
    title: "Smart Property Search",
    description:
      "Map-based listings make it easy to browse property by location across the suburbs we serve.",
  },
  {
    title: "Genuinely Approachable",
    description:
      "No corporate scripts or sales pressure — straight-talking advice from people who treat you like a friend, not a file number.",
  },
  {
    title: "Small Team, Big Heart",
    description:
      "Not a big franchise machine — a close-knit local team that treats every sale like it's for our own family.",
  },
] as const;

// Pulled directly from Home7's actual Google Business Profile (screenshots
// of the live listing, Aug 2026) — real customer names and review text, not
// written/paraphrased. Deliberately NOT wrapped in Review/AggregateRating
// schema.org markup: Google explicitly excludes "self-serving" reviews
// (a business marking up ratings about itself) from star-rich-result
// eligibility, so the markup would carry manual-action risk for zero
// visible benefit. Shown as plain page content instead — real value there is
// trust/engagement, not a rich snippet. No reviewer photos are used either;
// a public Google review isn't consent to reuse someone's personal photo in
// commercial marketing, so testimonials use initials instead.
//
// `url` is that specific review's own Google-generated share link (each
// verified by curl before use — every one redirects to
// google.com/maps/reviews/... carrying the same place ID,
// 0xe6b905e70ea37b51, that identifies this exact business), so "Google
// review" under each card links straight to the real thing rather than
// asserting authenticity with nothing to back it up.
export const GOOGLE_RATING = { value: 4.7, count: 46 };

// The "#lrd=" fragment opens Google's local-reviews panel directly for this
// place — same place ID (0xe6b905e70ea37b51) as every testimonial's own
// share link above. Stripped of the personal session/tracking params
// (rlz, oq, gs_lcrp, sourceid, ...) that were on the original URL this came
// from — those are tied to one browser's search session and serve no
// purpose for other visitors, just clutter.
export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?q=home+7#lrd=0x6b129519b9b0156d:0xe6b905e70ea37b51,1,,,,";

export const TESTIMONIALS = [
  {
    name: "M S B Islam",
    quote:
      "Home7 real estate and founder Mr Mohammad is a place of trust. I have been dealing with Mr Mohammad for past 6 years on various occasion. Mohammad has helped and still helping us in sales, managing my investment property. He is honest, hard working, attentive and supportive. Most of all he is reachable and very cordial. Undoubtedly, we highly recommend Mohammad and his team at Home7 real estate.",
    url: "https://maps.app.goo.gl/xBzSLkc29ytvYZuB7",
  },
  {
    name: "James Smith",
    quote:
      "Excellent experience with Home7 Real Estate. Mohammed is professional, honest, and highly knowledgeable about the local property market. His communication, negotiation skills, and attention to detail made the entire process smooth and stress-free. Highly recommend Home7 for anyone looking for trusted real estate and property management services in Liverpool and Western Sydney.",
    url: "https://maps.app.goo.gl/kEY8U3ZPwPemgsDu6",
  },
  {
    name: "Jobaer Abu",
    quote:
      "The team at Home7 Real Estate is amazing. Fast service, low cost, and excellent communication. Mohammed is the best agent I've worked with.",
    url: "https://maps.app.goo.gl/ZHBWvkWRWreFY6QK6",
  },
  {
    name: "ZILANI GOLAM",
    quote:
      "Outstanding real estate service in the area! The team is professional, efficient, and always quick to respond. Mohammed brings deep expertise in property sales and is a highly effective negotiator.",
    url: "https://maps.app.goo.gl/jFUsFZwRz59QvURDA",
  },
  {
    name: "MD JUBAYER HOSSEN",
    quote:
      "Best property management service I've experienced! Home7 Real Estate offers great value with low charges and excellent communication. Mohammed is an expert in the property market.",
    url: "https://maps.app.goo.gl/ZzQcFaSLpmqXx4Dx5",
  },
  {
    name: "Mr Karim",
    quote:
      "Fantastic service from Home7 Real Estate. Best in the area for property management. Mohammed is honest, experienced, and always delivers great results.",
    url: "https://maps.app.goo.gl/fxSTwjZZNk1Rd9JS6",
  },
] as const;

export const PARTNERS = [
  { name: "realestate.com.au", href: "https://www.realestate.com.au/", logo: "/images/partners/realestate-com-au.png" },
  { name: "Domain.com.au", href: "http://www.domain.com.au/", logo: "/images/partners/domain-com-au.png" },
  { name: "CoreLogic", href: "http://www.corelogic.com.au/", logo: "/images/partners/corelogic.png" },
  { name: "MRI Software", href: "http://www.mrisoftware.com/", logo: "/images/partners/mri-software.png" },
  { name: "MyConnect", href: "https://www.myconnect.com.au/", logo: "/images/partners/myconnect.png" },
  { name: "Inspection Manager", href: "http://www.inspectionmanager.com/", logo: "/images/partners/inspection-manager.png" },
] as const;
