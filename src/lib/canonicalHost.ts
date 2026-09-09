import { SITE_URL } from "@/lib/constants";

/**
 * Whether a request's Host header matches the real production domain —
 * used by both robots.ts (whether to allow crawling at all) and
 * layout.tsx (whether to add a site-wide noindex meta tag) so the two
 * checks can't drift apart into two independently-maintained copies of
 * the same logic.
 *
 * Two things a naive `host === new URL(SITE_URL).host` string comparison
 * gets wrong, either of which would incorrectly noindex/block-crawling
 * REAL production traffic, not just catch a preview deployment:
 *
 * - Case: HTTP Host headers are case-insensitive per spec; a strict
 *   string comparison isn't.
 * - The `www.` subdomain: whether home7.com.au's real traffic ever
 *   arrives as `www.home7.com.au` depends entirely on how the domain is
 *   configured in Vercel/DNS (which variant redirects to which) — not
 *   something this app's code controls or should assume one way about.
 *   Treating both as canonical here is a safety net regardless of how
 *   that's configured; a www→apex (or apex→www) redirect should still
 *   happen at the edge before this ever runs, this just means a gap in
 *   that configuration can't silently noindex the live site.
 */
export function isCanonicalHost(requestHost: string): boolean {
  const host = requestHost.toLowerCase();
  const canonical = new URL(SITE_URL).host.toLowerCase();
  return host === canonical || host === `www.${canonical}`;
}
