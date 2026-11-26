import { ORG_ID, SITE_NAME, SITE_URL, TARGET_SUBURBS } from "./constants";
import { FEES } from "./fees";

/**
 * schema.org markup for Home7's published fees, built once from FEES so the
 * homepage entity, /fees and /property-management all state the same
 * prices. There is no Google rich result for service prices; this is for
 * machine understanding (Google's knowledge of the business, Bing, and AI
 * answer engines that read structured data), backing up the visible text.
 */
const areaServed = TARGET_SUBURBS.map((s) => ({ "@type": "City", name: s }));
const provider = { "@type": "RealEstateAgent", "@id": ORG_ID, name: SITE_NAME };

export const SALES_SERVICE_ID = `${SITE_URL}/fees#sales`;
export const MANAGEMENT_SERVICE_ID = `${SITE_URL}/property-management#service`;

function offer(kind: "sale" | "management") {
  const f = FEES[kind];
  const isSale = kind === "sale";
  return {
    "@type": "Offer",
    name: `${f.name} ${f.label}`,
    description: isSale
      ? `Sales commission ${f.label} (${f.inclLabel}) of the sale price. Marketing and advertising are separate.`
      : `Management fee ${f.label} (${f.inclLabel}) of rent collected. Letting fees and leasing costs are separate.`,
    url: isSale ? `${SITE_URL}/fees` : `${SITE_URL}/property-management`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: f.percentInclGst,
      priceCurrency: "AUD",
      unitText: isSale ? "percent of sale price, including GST" : "percent of rent collected, including GST",
      valueAddedTaxIncluded: true,
    },
  };
}

export function salesServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": SALES_SERVICE_ID,
    name: "Residential property sales",
    serviceType: "Real estate sales agent",
    provider,
    areaServed,
    url: `${SITE_URL}/fees`,
    offers: offer("sale"),
  };
}

export function managementServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": MANAGEMENT_SERVICE_ID,
    name: "Property management",
    serviceType: "Residential property management",
    provider,
    areaServed,
    url: `${SITE_URL}/property-management`,
    offers: offer("management"),
  };
}

/** For the homepage RealEstateAgent: `makesOffer`, each offer pointing at its Service. */
export function orgOffers() {
  return [
    { ...offer("sale"), itemOffered: { "@type": "Service", "@id": SALES_SERVICE_ID, name: "Residential property sales" } },
    { ...offer("management"), itemOffered: { "@type": "Service", "@id": MANAGEMENT_SERVICE_ID, name: "Property management" } },
  ];
}
