import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/constants";
import { isCanonicalHost } from "@/lib/canonicalHost";

// Matches the current live site's robots.txt on the real domain: everything
// crawlable except /admin. On any OTHER host — a Vercel preview URL, a
// staging deployment, an accidental duplicate — block crawling entirely.
// This is host-checked at request time rather than keyed off Vercel's
// VERCEL_ENV, since `vercel --prod` without a custom domain attached still
// reports env "production" despite not being the canonical site.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";

  if (!isCanonicalHost(host)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
