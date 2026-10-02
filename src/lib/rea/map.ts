import type { IProperty } from "@/models/Property";
import { slugify } from "@/lib/slug";
import type { ReaListing } from "./parse";

/**
 * REA listing → our Property fields, in two groups:
 *
 *  - facts: always follow REA (status, price, beds, inspections...). The
 *    sync overwrites these on every change; a hand edit to them lasts only
 *    until REA's next update.
 *  - content: description and photos. Copied from REA when a listing is
 *    first created, then protected once someone edits them by hand (see
 *    Property.reaLockedFields).
 *
 * A fact REA leaves empty is left out rather than set to undefined, so the
 * sync never wipes a value we already hold just because REA's copy is blank.
 */

export type ListingType = IProperty["listingType"];

export interface ReaFacts {
  listingType: ListingType;
  reaStatus: ReaListing["status"];
  reaModTime: Date;
  priceDisplay?: string;
  priceValue?: number;
  rentPerWeek?: number;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  carSpaces?: number;
  landSize?: string;
  floorSize?: string;
  propertyType?: string;
  amenities?: string[];
  inspectionTimes: string[]; // always set: an empty list clears past inspections
  dateAvailable?: Date;
  soldPrice?: number;
  soldDate?: Date;
  auctionDate?: Date;
  videoEmbedUrl?: string;
}

export interface ReaContent {
  description?: string;
  images: string[]; // REA's URLs; copied to our S3 before saving
  floorPlanImage?: string;
}

/** Content fields a person can protect from the sync by editing them. */
export const LOCKABLE_FIELDS = ["description", "images"] as const;

/** REA status + kind → which of our listing pages it belongs on. */
export function listingTypeFor(l: ReaListing): ListingType {
  if (l.status === "sold") return "sold";
  if (l.status === "leased") return "leased";
  // Withdrawn on REA. "other" is the old site's own off-market bucket: the
  // page stays live (keeping its Google ranking) but leaves the For Sale /
  // For Rent lists.
  if (l.status === "offmarket") return "other";
  return l.kind === "rental" ? "rent" : "sale";
}

/** "CHAMBERLAIN STREET" → "Chamberlain Street"; mixed case is left as typed. */
function tidyCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function streetAddress(l: ReaListing): string {
  const { subNumber, streetNumber, street } = l.address;
  const num = subNumber ? `${subNumber}/${streetNumber}` : streetNumber;
  return tidyCase(`${num} ${street}`.trim());
}

export function suburbName(l: ReaListing): string {
  return tidyCase(l.address.suburb);
}

/** Same pattern the admin form uses for new listings (property.actions.ts). */
export function slugFor(l: ReaListing): string {
  return slugify(`${streetAddress(l)}-${suburbName(l)}-nsw-${l.address.postcode}`);
}

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

function priceDisplayFor(l: ReaListing): string | undefined {
  if (l.status === "sold" && l.soldPrice) return money(l.soldPrice);
  if (l.priceView) return l.priceView;
  if (l.rent) return `${money(l.rent.amount)} per ${l.rent.period === "monthly" ? "month" : "week"}`;
  return undefined;
}

function rentPerWeekFor(l: ReaListing): number | undefined {
  if (!l.rent) return undefined;
  if (l.rent.period === "weekly") return l.rent.amount;
  if (l.rent.period === "monthly") return Math.round((l.rent.amount * 12) / 52);
  return undefined;
}

function areaText(a: ReaListing["landArea"]): string | undefined {
  if (!a) return undefined;
  const value = Number(a.value.toFixed(2));
  if (a.unit === "acre") return `${value} acres`;
  if (a.unit === "hectare") return `${value} ha`;
  return `${value} sq m`;
}

// REA's feature flags in the wording already used by the site's amenities.
// Flags not listed fall back to splitting the camelCase name.
const FEATURE_LABELS: Record<string, string> = {
  airConditioning: "Air conditioning",
  alarmSystem: "Alarm system",
  balcony: "Balcony",
  broadband: "Broadband",
  builtInRobes: "Built-in wardrobes",
  courtyard: "Courtyard Area",
  deck: "Deck",
  dishwasher: "Dishwasher",
  ductedCooling: "Ducted cooling",
  ductedHeating: "Ducted heating",
  floorboards: "Floorboards",
  fullyFenced: "Fully fenced",
  furnished: "Furnished",
  gasHeating: "Gas heating",
  gym: "Gym",
  intercom: "Intercom",
  openFirePlace: "Fire Place",
  outdoorEnt: "Outdoor entertaining area",
  payTV: "Pay TV access",
  petFriendly: "Pets allowed",
  poolInGround: "Swimming Pool",
  poolAboveGround: "Above-ground pool",
  remoteGarage: "Remote garage",
  reverseCycleAirCon: "Reverse-cycle air con",
  rumpusRoom: "Rumpus room",
  secureParking: "Secure parking",
  shed: "Shed",
  solarHotWater: "Solar hot water",
  solarPanels: "Solar panels",
  splitSystemAirCon: "Split-system air con",
  splitSystemHeating: "Split-system heating",
  study: "Study",
  tennisCourt: "Tennis court",
  waterTank: "Water tank",
};

function featureLabel(flag: string): string {
  return (
    FEATURE_LABELS[flag] ??
    flag.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim()
  );
}

function youtubeEmbed(url?: string): string | undefined {
  const id = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : undefined;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** REA's plain text → the site's description HTML (<h2> headline + paragraphs). */
export function descriptionHtml(l: ReaListing): string | undefined {
  if (!l.headline && !l.description) return undefined;
  const parts: string[] = [];
  if (l.headline) parts.push(`<h2>${escapeHtml(l.headline)}</h2>`);
  for (const para of (l.description ?? "").replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = para.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.length) parts.push(`<p>${lines.map(escapeHtml).join("<br>")}</p>`);
  }
  return parts.join("");
}

function withoutUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

export function factsFor(l: ReaListing): ReaFacts {
  const amenities = [...new Set(l.features.map(featureLabel))];
  return withoutUndefined({
    listingType: listingTypeFor(l),
    reaStatus: l.status,
    reaModTime: l.modTime,
    priceDisplay: priceDisplayFor(l),
    priceValue: l.kind === "rental" ? undefined : (l.soldPrice ?? l.price),
    rentPerWeek: rentPerWeekFor(l),
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    toilets: l.toilets,
    carSpaces: l.carSpaces,
    landSize: areaText(l.landArea),
    floorSize: areaText(l.buildingArea),
    propertyType: l.category,
    amenities: amenities.length ? amenities : undefined,
    inspectionTimes: l.inspectionTimes,
    dateAvailable: l.dateAvailable,
    soldPrice: l.soldPrice,
    soldDate: l.soldDate,
    auctionDate: l.auctionDate,
    videoEmbedUrl: youtubeEmbed(l.videoUrl),
  });
}

export function contentFor(l: ReaListing): ReaContent {
  return withoutUndefined({
    description: descriptionHtml(l),
    images: [...l.images, ...l.floorplans],
    floorPlanImage: l.floorplans[0],
  });
}

/** Plain-English listing type, for logs and the admin activity list. */
export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  sale: "For Sale",
  rent: "For Rent",
  sold: "Sold",
  leased: "Leased",
  other: "Off-market",
};
