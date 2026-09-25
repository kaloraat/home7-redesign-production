import { COMPANY, GOOGLE_RATING, GOOGLE_REVIEWS_URL } from "@/lib/constants";

/**
 * Single source of truth for the Google Ads landing pages (/lp/*).
 * Anything marked CONFIRM is a business fact we don't have yet — the page
 * is written so it reads fine without it, and never shows an invented value.
 */
export const SITE = {
  name: "Home7 Real Estate",
  // MUST be written exactly like this everywhere: Google's website call
  // tracking swaps this exact string for a forwarding number on ad visits.
  phoneDisplay: COMPANY.phone, // "(02) 8729 7753"
  phoneHref: "tel:+61287297753",
  address: COMPANY.address,
  googleReviewsUrl: GOOGLE_REVIEWS_URL,
  ratingFallback: { rating: GOOGLE_RATING.value, count: GOOGLE_RATING.count },
  since: 2020,
  // CONFIRM: real NSW agency licence number. Footer omits the line while empty.
  licenceNumber: "",
  // CONFIRM: how fast staff really call back. Kept deliberately non-specific.
  callbackPromise: "as soon as we can during business hours",
  fees: {
    // CONFIRM: leave null until Home7 confirms. While null the pages show the
    // "ask for our fee sheet" wording, never a made-up number.
    managementPercent: null as number | null, // e.g. 5.5 (inc GST?)
    lettingFeeWeeks: null as number | null, // e.g. 1
    salesCommissionFrom: null as string | null, // e.g. "1.5%"
  },
};
