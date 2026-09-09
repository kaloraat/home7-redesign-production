import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Redirect from "@/models/Redirect";

/**
 * Serves the data-driven redirects managed at /admin/redirects — the
 * Redirect model existed before this file did (see models/Redirect.ts's own
 * comment: "for anything the route structure alone can't handle 1:1"), but
 * nothing actually read from it. An admin UI for creating redirect rules
 * that don't redirect anything would be worse than no UI at all, so this is
 * the other half of that feature.
 *
 * Named `proxy.ts`, not `middleware.ts` — Next.js 16 deprecated and renamed
 * the file convention (middleware.ts still works but is the old name).
 * Proxy defaults to the Node.js runtime in v16 (previously Edge, which
 * can't run Mongoose — no raw TCP), so this can query MongoDB directly.
 *
 * In-memory cache, not a DB query per request: this runs on every matched
 * page view across the whole public site, and the redirect table is small
 * and changes rarely — querying MongoDB on literally every request would
 * add a DB round-trip to every page load for a feature that matches on
 * maybe a handful of legacy URLs. Node.js runtime keeps this module-level
 * cache alive across requests within the same server process.
 */
const CACHE_TTL_MS = 60_000;
type RedirectEntry = { toPath: string; statusCode: 301 | 302 };
let cache: Map<string, RedirectEntry> | null = null;
let cacheLoadedAt = 0;

async function getRedirectMap(): Promise<Map<string, RedirectEntry>> {
  const now = Date.now();
  if (cache && now - cacheLoadedAt < CACHE_TTL_MS) return cache;

  try {
    await dbConnect();
    const rows = await Redirect.find({}).lean();
    cache = new Map(rows.map((r) => [r.fromPath, { toPath: r.toPath, statusCode: r.statusCode }]));
    cacheLoadedAt = now;
  } catch {
    // DB unavailable — keep serving the last-known cache (even if stale)
    // rather than breaking every page load; if there's no cache yet, an
    // empty map just means no redirects fire until the DB comes back.
    if (!cache) cache = new Map();
  }
  return cache;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const map = await getRedirectMap();
  const match = map.get(pathname);

  if (match) {
    return NextResponse.redirect(new URL(match.toPath, request.url), match.statusCode);
  }
  return NextResponse.next();
}

export const config = {
  // Admin/API routes don't participate in the redirect table — it's a
  // public-site URL-migration tool, not a general routing layer, and
  // skipping them avoids an unnecessary map lookup on every admin page.
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
