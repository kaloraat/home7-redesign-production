import type { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Agent from "@/models/Agent";
import Content from "@/models/Content";
import { SITE_URL } from "@/lib/constants";

const STATIC_PATHS = [
  "/",
  "/about-us",
  "/agents",
  "/properties-for-sale",
  "/properties-for-rent",
  "/sold-properties",
  "/leased-properties",
  "/properties",
  "/other-properties",
  "/open-for-inspection",
  "/buyers-advisory",
  "/free-market-appraisal",
  "/contact",
  "/blog",
  "/privacy-policy",
  "/property-tenant-application-download",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    await dbConnect();

    const [properties, agents, content] = await Promise.all([
      Property.find({}, "slug updatedAt").lean(),
      Agent.find({ active: true }, "slug").lean(),
      Content.find({ status: "published" }, "slug urlPath updatedAt").lean(),
    ]);

    for (const p of properties) {
      entries.push({
        url: `${SITE_URL}/property/${p.slug}`,
        lastModified: p.updatedAt,
      });
    }
    for (const a of agents) {
      entries.push({ url: `${SITE_URL}/agent/${a.slug}` });
    }
    for (const c of content) {
      const path =
        c.urlPath === "blog" ? `/blog/${c.slug}` : c.urlPath === "suburb" ? `/suburb/${c.slug}` : `/${c.slug}`;
      entries.push({ url: `${SITE_URL}${path}`, lastModified: c.updatedAt });
    }
  } catch {
    // Build/deploy without a live DB yet — ship the static paths only.
  }

  return entries;
}
