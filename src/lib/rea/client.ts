/**
 * realestate.com.au Partner Platform client — just the two calls the
 * listing sync needs (docs: https://partner.realestate.com.au/listing-export/usage/).
 *
 *   1. POST /oauth/token (client-credentials) → bearer token, ~1 hour
 *   2. GET /listing/v1/export → REAXML, 200 listings per page, next page
 *      in the `x-next-link` response header
 *
 * Env: REA_CLIENT_ID, REA_CLIENT_SECRET, REA_AGENCY_ID (Home7 = EIWLKW),
 * optional REA_API_BASE. The token and secret are never logged.
 */

const DEFAULT_BASE = "https://api.realestate.com.au";
// Each export page is one request; Home7 has ~110 listings (one page), so
// this only guards against a paging loop, not a real limit.
const MAX_PAGES = 25;

export type ReaStatus = "current" | "offmarket" | "sold" | "leased";

let cachedToken: { value: string; expiresAt: number } | null = null;

function config() {
  const clientId = process.env.REA_CLIENT_ID;
  const clientSecret = process.env.REA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("REA_CLIENT_ID / REA_CLIENT_SECRET are not set.");
  }
  return {
    base: process.env.REA_API_BASE || DEFAULT_BASE,
    clientId,
    clientSecret,
    agencyId: process.env.REA_AGENCY_ID,
  };
}

async function getToken(): Promise<string> {
  // Reuse until a minute before expiry rather than logging in per request.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const { base, clientId, clientSecret } = config();
  const res = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`REA login failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export interface ExportOptions {
  /** Only listings REA modified after this time. Omit for everything. */
  since?: Date;
  statuses?: ReaStatus[];
}

/** Fetches every page of the listing export; returns each page's raw REAXML. */
export async function exportListings(opts: ExportOptions = {}): Promise<string[]> {
  const { base, agencyId } = config();
  const params = new URLSearchParams();
  if (agencyId) params.set("agency_id", agencyId);
  if (opts.statuses?.length) params.set("status", opts.statuses.join(","));
  if (opts.since) params.set("since", opts.since.toISOString());

  const pages: string[] = [];
  let url: string | null = `${base}/listing/v1/export?${params}`;
  while (url) {
    if (pages.length >= MAX_PAGES) throw new Error(`REA export exceeded ${MAX_PAGES} pages.`);
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${await getToken()}` },
      cache: "no-store",
    });
    // REA answers 404 when nothing matches, e.g. no changes since last run.
    if (res.status === 404) break;
    if (!res.ok) {
      throw new Error(`REA export failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    pages.push(await res.text());
    // The header is a path relative to the API version root, e.g.
    // "/v1/export?agency_id=AAAAAA&page=123948576".
    const next = res.headers.get("x-next-link")?.replace(/^"|"$/g, "");
    url = next ? new URL(next.replace(/^\/v1\//, "/listing/v1/"), base).toString() : null;
  }
  return pages;
}
