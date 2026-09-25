"use client";

/**
 * Client-side tracking helpers for the landing pages: gtag wrappers plus
 * the first-party attribution cookie (gclid/gbraid/wbraid/utm_*), which is
 * what lets "listing signed" outcomes be uploaded back to Google Ads later.
 */

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
export const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;
export const GADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GADS_LEAD_LABEL;
export const GADS_PHONE_CLICK_LABEL = process.env.NEXT_PUBLIC_GADS_PHONE_CLICK_LABEL;

type Gtag = (...args: unknown[]) => void;

export function gtag(...args: unknown[]) {
  const w = window as unknown as { gtag?: Gtag };
  try {
    w.gtag?.(...args);
  } catch {
    // Tracking must never break the page.
  }
}

const COOKIE = "h7_attrib";
const KEYS = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = Partial<Record<(typeof KEYS)[number] | "landing_url" | "referrer", string>>;

function readCookie(): Attribution {
  try {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
    if (!match) return {};
    return JSON.parse(decodeURIComponent(match.slice(COOKIE.length + 1)));
  } catch {
    return {};
  }
}

/** Called once per /lp page load. Never overwrites saved values with blanks. */
export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};
  for (const key of KEYS) {
    const v = params.get(key);
    if (v) fresh[key] = v.slice(0, 500);
  }
  if (Object.keys(fresh).length === 0) return;
  fresh.landing_url = window.location.href.slice(0, 500);
  fresh.referrer = document.referrer.slice(0, 500);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(fresh))}; max-age=${60 * 60 * 24 * 90}; path=/; SameSite=Lax${secure}`;
}

/** Saved click ids/UTMs (falls back to the current page for landing_url/referrer). */
export function getAttribution(): Attribution {
  const saved = readCookie();
  return {
    ...saved,
    landing_url: saved.landing_url || window.location.href.slice(0, 500),
    referrer: saved.referrer ?? document.referrer.slice(0, 500),
  };
}

export function trackPhoneClick(location: string, leadType: string, region: string) {
  if (GADS_ID && GADS_PHONE_CLICK_LABEL) {
    gtag("event", "conversion", { send_to: `${GADS_ID}/${GADS_PHONE_CLICK_LABEL}` });
  }
  gtag("event", "phone_click", { lead_type: leadType, region, location });
}

let formStartSent = false;
export function trackFormStart(leadType: string, region: string, instance: string) {
  if (formStartSent) return;
  formStartSent = true;
  gtag("event", "form_start", { lead_type: leadType, region, form_instance: instance });
}

/**
 * Fires the Google Ads lead conversion (+ enhanced conversion data) and
 * calls `done` once it's sent — or after 1s regardless, so the visitor is
 * never stuck on the form if the tag is blocked.
 */
export function trackLeadConversion(opts: {
  leadId: string;
  phoneE164: string;
  firstName: string;
  leadType: string;
  region: string;
  instance: string;
  done: () => void;
}) {
  let called = false;
  const go = () => {
    if (called) return;
    called = true;
    opts.done();
  };
  setTimeout(go, 1000);

  gtag("set", "user_data", {
    phone_number: opts.phoneE164,
    address: { first_name: opts.firstName.toLowerCase() },
  });
  if (GADS_ID && GADS_LEAD_LABEL) {
    gtag("event", "conversion", {
      send_to: `${GADS_ID}/${GADS_LEAD_LABEL}`,
      transaction_id: opts.leadId,
      event_callback: go,
    });
  }
  gtag("event", "generate_lead", { lead_type: opts.leadType, region: opts.region, form_instance: opts.instance });
  // No Ads label configured (or tag blocked): don't make the visitor wait the full second.
  if (!(GADS_ID && GADS_LEAD_LABEL)) go();
}
