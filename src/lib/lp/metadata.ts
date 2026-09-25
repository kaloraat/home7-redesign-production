import type { Metadata } from "next";
import { getContent } from "./content";
import type { RegionKey } from "./regions";
import type { LpLeadType } from "./validation";

/** Ad landing pages stay out of organic search (noindex) but must remain crawlable by AdsBot. */
export function lpMetadata(type: LpLeadType, region: RegionKey): Metadata {
  const { title, description } = getContent(type, region);
  const path = `/lp/${type === "pm" ? "property-management" : "sell"}${region === "all" ? "" : `/${region}`}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    robots: { index: false, follow: false },
    openGraph: { title, description, url: path },
  };
}
