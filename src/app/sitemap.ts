import type { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Agent from "@/models/Agent";
import Content from "@/models/Content";
import Redirect from "@/models/Redirect";
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
  "/fees",
  "/property-management",
  "/terms-and-conditions",
  "/contact",
  "/blog",
  "/privacy-policy",
  "/property-tenant-application-download",
];

// Rebuilt at most hourly. Without this the sitemap is generated once at
// build time and keeps listing deleted pages (and missing new ones) until
// the next deploy — which matters now that the REA sync adds, changes and
// removes listings between deploys.
export const revalidate = 3600;

// Sitemap <image:loc> must be an absolute URL. Agent photos (and some older
// images) are stored as site paths like "/images/team/x.png", which Search
// Console rejects as "Invalid URL". Resolve against SITE_URL (also
// percent-encodes spaces in legacy file names) and drop anything unparseable.
function absImages(urls: (string | undefined | null)[]): string[] {
  return urls.flatMap((u) => {
    if (!u) return [];
    try {
      return [new URL(u, SITE_URL).href];
    } catch {
      return [];
    }
  });
}

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

    const [properties, agents, content, redirects] = await Promise.all([
      Property.find({}, "slug updatedAt images").lean(),
      Agent.find({ active: true }, "slug photo").lean(),
      Content.find({ status: "published" }, "slug urlPath updatedAt coverImage").lean(),
      Redirect.find({}, "fromPath").lean(),
    ]);
    // A page that has a row in /admin/redirects never renders (proxy.ts
    // redirects it first), so listing it would send Google to a redirect.
    // This lets a consolidation be done with a redirect alone, without
    // also unpublishing the old Content row.
    const redirected = new Set(redirects.map((r) => r.fromPath));

    for (const p of properties) {
      if (redirected.has(`/property/${p.slug}`)) continue;
      entries.push({
        url: `${SITE_URL}/property/${p.slug}`,
        lastModified: p.updatedAt,
        ...(p.images?.length ? { images: absImages(p.images) } : {}),
      });
    }
    for (const a of agents) {
      if (redirected.has(`/agent/${a.slug}`)) continue;
      entries.push({
        url: `${SITE_URL}/agent/${a.slug}`,
        ...(a.photo ? { images: absImages([a.photo]) } : {}),
      });
    }
    for (const c of content) {
      const path =
        c.urlPath === "blog" ? `/blog/${c.slug}` : c.urlPath === "suburb" ? `/suburb/${c.slug}` : `/${c.slug}`;
      if (redirected.has(path)) continue;
      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: c.updatedAt,
        ...(c.coverImage ? { images: absImages([c.coverImage]) } : {}),
      });
    }
  } catch {
    // Build/deploy without a live DB yet — ship the static paths only.
  }

  return entries;
}
