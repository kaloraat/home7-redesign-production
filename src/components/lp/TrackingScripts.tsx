import Script from "next/script";
import { SITE } from "@/lib/lp/site";

/**
 * Loads Google Ads (+ optional GA4 and Clarity) for /lp/* only, and only
 * when the env vars are set. The root layout may already have defined
 * `gtag` for the site's own GA4, so this reuses it if present.
 */
export function TrackingScripts({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  const gads = process.env.NEXT_PUBLIC_GADS_ID;
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const callLabel = process.env.NEXT_PUBLIC_GADS_CALL_LABEL;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const loadId = gads || ga4;

  return (
    <>
      {loadId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${loadId}`} strategy="afterInteractive" />
          <Script id="lp-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){dataLayer.push(arguments);};
              gtag('js', new Date());
              ${ga4 ? `gtag('config', ${JSON.stringify(ga4)});` : ""}
              ${gads ? `gtag('config', ${JSON.stringify(gads)}, { allow_enhanced_conversions: true });` : ""}
              ${gads && callLabel ? `gtag('config', ${JSON.stringify(`${gads}/${callLabel}`)}, { phone_conversion_number: ${JSON.stringify(SITE.phoneDisplay)} });` : ""}
            `}
          </Script>
        </>
      )}
      {clarity && (
        <Script id="lp-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(clarity)});`}
        </Script>
      )}
    </>
  );
}

export default TrackingScripts;
