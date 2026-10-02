import { XMLParser } from "fast-xml-parser";
import type { ReaStatus } from "./client";

/**
 * REAXML (http://reaxml.realestate.com.au/propertyList.dtd) → one plain
 * object per listing, with only the fields the sync uses. Everything stays
 * REA's raw values here; turning them into our Property shape is map.ts.
 */

export type ReaKind = "residential" | "rental" | "land" | "rural" | "commercial";
const KINDS: ReaKind[] = ["residential", "rental", "land", "rural", "commercial"];

export interface ReaListing {
  kind: ReaKind;
  status: ReaStatus;
  listingId: string;
  uniqueId: string;
  modTime: Date;
  address: {
    subNumber: string;
    streetNumber: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  category?: string; // "House", "Apartment"...
  headline?: string;
  description?: string; // plain text with newlines
  price?: number;
  priceView?: string;
  rent?: { amount: number; period: string };
  bond?: number;
  dateAvailable?: Date;
  soldPrice?: number; // only when REA allows it to be displayed
  soldDate?: Date;
  auctionDate?: Date;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  carSpaces?: number;
  landArea?: { value: number; unit: string };
  buildingArea?: { value: number; unit: string };
  /** REA feature flags that are switched on, e.g. ["airConditioning", "builtInRobes"]. */
  features: string[];
  images: string[]; // main photo first
  floorplans: string[];
  videoUrl?: string;
  inspectionTimes: string[];
  agents: { name: string; email?: string; phone?: string }[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Keep every value a string: "41a", postcode "0870", "557.00000000".
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) =>
    [...KINDS, "img", "floorplan", "inspection", "listingAgent", "telephone"].includes(name),
});

// Parsed XML is untyped by nature; every read below goes through text()/num()/date().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = Record<string, any>;

/** Text of an element that may be "", a string, or an object with "#text". */
function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && "#text" in (v as Node)) return String((v as Node)["#text"]).trim();
  return "";
}

function num(v: unknown): number | undefined {
  const t = text(v);
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** REA dates come as "20260821T111123", "2026-09-07-00:00:00" or "2026-09-07". */
function date(v: unknown): Date | undefined {
  const t = text(v);
  if (!t) return undefined;
  let m = t.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?$/);
  if (!m) m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[-T ](\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return undefined;
  const [, y, mo, d, h = "00", mi = "00", s = "00"] = m;
  // REA times are Sydney local time; +10:00 is close enough for "which is
  // newer" comparisons (daylight saving shifts it by an hour at most).
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+10:00`);
}

function area(v: Node | undefined): { value: number; unit: string } | undefined {
  const a = v?.area;
  const value = num(a);
  return value ? { value, unit: a?.["@unit"] ?? "squareMeter" } : undefined;
}

// REA flags that aren't features a visitor cares about, or are covered by
// other fields already.
const NON_FEATURE_FLAGS = new Set([
  "bedrooms", "bathrooms", "toilets", "ensuite", "garages", "carports", "openSpaces",
  "livingAreas", "otherFeatures", "newConstruction", "multiDwelling", "smoker",
]);

function featureFlags(f: Node | undefined): string[] {
  if (!f) return [];
  return Object.entries(f)
    .filter(([k]) => !NON_FEATURE_FLAGS.has(k) && !k.startsWith("@"))
    .filter(([, v]) => {
      const t = text(v).toLowerCase();
      return t === "yes" || t === "true" || Number(t) > 0;
    })
    .map(([k]) => k);
}

/** "m" is REA's main photo, then "a".."z" in display order. */
function imageOrder(id: string): number {
  if (id === "m") return -1;
  return id.length === 1 ? id.charCodeAt(0) : 1000 + Number(id) || 2000;
}

function parseListing(kind: ReaKind, n: Node): ReaListing {
  const a: Node = n.address ?? {};
  const f: Node = n.features ?? {};
  const sold: Node = n.soldDetails ?? {};
  const soldPrice = sold.soldPrice;
  const rent = n.rent;
  const imgs = ((n.objects?.img ?? []) as Node[])
    .filter((i) => i["@url"])
    .sort((x, y) => imageOrder(x["@id"]) - imageOrder(y["@id"]));
  const carSpaces =
    (num(f.garages) ?? 0) + (num(f.carports) ?? 0) + (num(f.openSpaces) ?? 0);

  return {
    kind,
    status: n["@status"],
    listingId: text(n.listingId),
    uniqueId: text(n.uniqueID),
    modTime: date(n["@modTime"]) ?? new Date(0),
    address: {
      subNumber: text(a.subNumber),
      streetNumber: text(a.streetNumber),
      street: text(a.street),
      suburb: text(a.suburb),
      state: text(a.state) || "NSW",
      postcode: text(a.postcode),
    },
    category: n.category?.["@name"] || undefined,
    headline: text(n.headline) || undefined,
    description: text(n.description) || undefined,
    price: num(n.price),
    priceView: text(n.priceView) || undefined,
    rent: num(rent) ? { amount: num(rent)!, period: rent["@period"] ?? "weekly" } : undefined,
    bond: num(n.bond),
    dateAvailable: date(n.dateAvailable),
    soldPrice: soldPrice?.["@display"] === "no" ? undefined : num(soldPrice),
    soldDate: date(sold.soldDate),
    auctionDate: date(n.auction?.["@date"]),
    bedrooms: num(f.bedrooms),
    bathrooms: num(f.bathrooms),
    toilets: num(f.toilets),
    carSpaces: carSpaces || undefined,
    landArea: area(n.landDetails),
    buildingArea: area(n.buildingDetails),
    features: featureFlags(f),
    images: imgs.map((i) => i["@url"]),
    floorplans: ((n.objects?.floorplan ?? []) as Node[]).map((p) => p["@url"]).filter(Boolean),
    videoUrl: n.videoLink?.["@href"] || undefined,
    inspectionTimes: ((n.inspectionTimes?.inspection ?? []) as unknown[]).map(text).filter(Boolean),
    agents: ((n.listingAgent ?? []) as Node[])
      .map((ag) => ({
        name: text(ag.name),
        email: text(ag.email) || undefined,
        phone: text(ag.telephone?.[0]) || undefined,
      }))
      .filter((ag) => ag.name),
  };
}

/** Parses one export page. Listings of every kind come back in one list. */
export function parseReaXml(xml: string): ReaListing[] {
  const root: Node = parser.parse(xml)?.propertyList ?? {};
  return KINDS.flatMap((kind) => ((root[kind] ?? []) as Node[]).map((n) => parseListing(kind, n)));
}
