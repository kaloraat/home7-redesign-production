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
  // The `images` field is what produces the <image:image><image:loc>...
  // entries Google's Image Sitemaps extension reads — the old Laravel
  // site's sitemap had these on every URL, this rebuild's never did. Not
  // just cosmetic parity: it's what lets Google discover/index property
  // photos it might otherwise miss from crawling alone (e.g. anything
  // below the fold in a gallery), and for a real-estate site, individual
  // listing photos ranking in Google Images is a genuine secondary
  // traffic channel — worth restoring, not just matching the old site.
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    ...(path === "/" ? { images: [`${SITE_URL}/images/logo.png`, `${SITE_URL}/images/hero-banner.webp`] } : {}),
  }));

  try {
    await dbConnect();

    const [properties, agents, content] = await Promise.all([
      Property.find({}, "slug updatedAt images").lean(),
      Agent.find({ active: true }, "slug photo").lean(),
      Content.find({ status: "published" }, "slug urlPath updatedAt coverImage").lean(),
    ]);

    for (const p of properties) {
      entries.push({
        url: `${SITE_URL}/property/${p.slug}`,
        lastModified: p.updatedAt,
        ...(p.images?.length ? { images: p.images } : {}),
      });
    }
    for (const a of agents) {
      entries.push({
        url: `${SITE_URL}/agent/${a.slug}`,
        ...(a.photo ? { images: [a.photo] } : {}),
      });
    }
    for (const c of content) {
      const path =
        c.urlPath === "blog" ? `/blog/${c.slug}` : c.urlPath === "suburb" ? `/suburb/${c.slug}` : `/${c.slug}`;
      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: c.updatedAt,
        ...(c.coverImage ? { images: [c.coverImage] } : {}),
      });
    }
  } catch {
    // Build/deploy without a live DB yet — ship the static paths only.
  }

  return entries;
}
