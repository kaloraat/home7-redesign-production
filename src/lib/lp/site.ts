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
  // CONFIRM: licensee name + licence number. Not found anywhere in the project
  // (the main footer doesn't show one). LpFooter hides the line while empty.
  licensee: { name: "", licenceNumber: "" },
  officeHours: "Mon–Fri 9am–5pm · Sat 9am–4pm · Sun closed", // keep in step with COMPANY.openingHours
  callbackPromise: "today, usually within minutes",
  feesLine: "Low fees, and yes, they're negotiable.",
  principal: {
    name: "Mohammed R Islam",
    firstName: "Mohammed",
    role: "Principal",
    mobileDisplay: COMPANY.mobileSecondary, // "0430 303 059"
    mobileHref: "tel:+61430303059",
    photo: "/images/team/mohammed-r-islam.png",
    profileUrl: "/agent/mohammed-r-islam",
  },
};
