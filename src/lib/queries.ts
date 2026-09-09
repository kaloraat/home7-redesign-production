import dbConnect from "@/lib/db";
import Property, { type IProperty } from "@/models/Property";
import Agent, { type IAgent } from "@/models/Agent";
import Content, { type IContent } from "@/models/Content";
import Redirect, { type IRedirect } from "@/models/Redirect";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A case-insensitive-exact-match RegExp for a slug, e.g. "/^foo-bar$/i" — a
 * fallback tried only after a normal case-sensitive lookup misses. The old
 * Laravel site lowercased a slug automatically when a record was first
 * created, but NOT on edit — `PropertyController.php`'s update path saved
 * whatever casing was typed verbatim. So it's entirely possible Google
 * indexed a mixed-case URL for a record whose slug is lowercase today (or
 * vice versa), with no way to know in advance which ones. Rather than
 * needing every such case discovered and hand-fixed via the Redirect
 * table, every by-slug lookup below falls back to this so ANY casing of an
 * existing slug resolves — the calling page is then responsible for
 * permanentRedirect()-ing to the canonically-cased URL rather than serving
 * the same content at two live URLs.
 */
function caseInsensitiveSlug(slug: string): RegExp {
  return new RegExp(`^${escapeRegex(slug)}$`, "i");
}

/**
 * The list/collection queries below fail soft (return an empty array)
 * instead of throwing when the database isn't reachable — e.g. at build
 * time in an environment with no MONGODB_URI configured yet, since the
 * pages that call them (/, /properties-for-sale, /agents, etc.) are
 * statically generated. That keeps `next build` green even before the real
 * database is wired up.
 *
 * The single-item "by slug" lookups below do NOT do this — they're used
 * only by dynamic, per-request routes (never build-time), and their `null`
 * return value is what triggers notFound() in the calling page. Swallowing
 * a transient DB error into `null` there would serve Googlebot a real 404
 * for a page that actually exists, which repeated over time reads as an
 * intentional removal and gets the URL deindexed. A genuine DB error should
 * surface as a thrown error (→ error.tsx, HTTP 500) instead, since search
 * engines retry a 5xx but treat a 404 as final.
 */

export async function getPropertiesByType(
  listingType: IProperty["listingType"],
  limit = 24
): Promise<IProperty[]> {
  try {
    await dbConnect();
    const docs = await Property.find({ listingType })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IProperty[]>();
    return docs;
  } catch {
    return [];
  }
}

export async function getFeaturedProperties(limit = 6): Promise<IProperty[]> {
  try {
    await dbConnect();
    const docs = await Property.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IProperty[]>();
    return docs;
  } catch {
    return [];
  }
}

export async function getPropertyBySlug(slug: string): Promise<IProperty | null> {
  await dbConnect();
  const exact = await Property.findOne({ slug }).lean<IProperty>();
  if (exact) return exact;
  return await Property.findOne({ slug: caseInsensitiveSlug(slug) }).lean<IProperty>();
}

/**
 * Current (for sale / for rent only — not sold/leased history) listings in
 * a given suburb, for the suburb landing pages. Case-insensitive exact
 * match: `Property.suburb` is free-text from the legacy import and has
 * real casing inconsistencies (e.g. "Liverpool" and "LIVERPOOL" both exist
 * for the same suburb) — an exact case-sensitive match would silently miss
 * some listings.
 */
export async function getPropertiesBySuburb(suburb: string, limit = 12): Promise<IProperty[]> {
  try {
    await dbConnect();
    return await Property.find({
      suburb: new RegExp(`^${suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      listingType: { $in: ["sale", "rent"] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IProperty[]>();
  } catch {
    return [];
  }
}

/** Current (sale/rent only) listings assigned to one agent — for "listings
 * by this agent" on their profile page. */
export async function getPropertiesByAgent(agentId: string, limit = 6): Promise<IProperty[]> {
  try {
    await dbConnect();
    return await Property.find({ agent: agentId, listingType: { $in: ["sale", "rent"] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IProperty[]>();
  } catch {
    return [];
  }
}

export async function getAgents(): Promise<IAgent[]> {
  try {
    await dbConnect();
    return await Agent.find({ active: true }).sort({ order: 1 }).lean<IAgent[]>();
  } catch {
    return [];
  }
}

export async function getAgentBySlug(slug: string): Promise<IAgent | null> {
  await dbConnect();
  const exact = await Agent.findOne({ slug, active: true }).lean<IAgent>();
  if (exact) return exact;
  return await Agent.findOne({ slug: caseInsensitiveSlug(slug), active: true }).lean<IAgent>();
}

/**
 * For "Listed by {agent}" on a property page — a plain lookup by the
 * `Property.agent` ObjectId reference, not a public-facing slug route.
 */
export async function getAgentById(id: string): Promise<IAgent | null> {
  try {
    await dbConnect();
    return await Agent.findOne({ _id: id, active: true }).lean<IAgent>();
  } catch {
    return null;
  }
}

export async function getPublishedContent(
  urlPath: IContent["urlPath"],
  limit = 50
): Promise<IContent[]> {
  try {
    await dbConnect();
    return await Content.find({ urlPath, status: "published" })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean<IContent[]>();
  } catch {
    return [];
  }
}

export type BlogListItem = Pick<IContent, "slug" | "title" | "excerpt" | "coverImage" | "publishedAt"> & {
  href: string;
};

export type BlogListPage = {
  items: BlogListItem[];
  page: number;
  totalPages: number;
  total: number;
};

/**
 * Shared by getBlogListPage and getLatestBlogPosts below. The live site's
 * /blog page has no pagination at all — every post (48 and growing) renders
 * in one request, split across two separately-labelled "Blog" and "Other
 * Blog" sections purely because they came from two different legacy
 * Laravel tables (blogs / other_blogs → urlPath "blog" / "root"). That
 * distinction is invisible and meaningless to a reader, so this merges both
 * into one list, sorted by publish date.
 *
 * A handful of slugs (confirmed: 4) exist in BOTH tables with near-identical
 * content — shown here once, linking to the /blog/{slug} URL, matching the
 * canonical preference the [slug]/page.tsx catch-all already uses (it
 * redirects bare /{slug} to /blog/{slug} when both could apply). Both URLs
 * stay live/crawlable either way — this only affects which single link
 * appears in this list, not routing.
 *
 * Fetches all published rows (lightweight fields only) and merges in memory
 * rather than at the DB level — at today's ~50-row scale that's negligible,
 * and it's what makes merging/deduping two separate urlPath values into one
 * sorted list straightforward. Revisit (a real DB-level query, or a
 * precomputed merged view) if the content library grows into the many
 * hundreds.
 */
async function getMergedBlogItems(): Promise<BlogListItem[]> {
  await dbConnect();
  const projection = "slug title excerpt coverImage publishedAt urlPath";
  const [blogDocs, rootDocs] = await Promise.all([
    Content.find({ urlPath: "blog", status: "published" }, projection).lean<IContent[]>(),
    Content.find({ urlPath: "root", status: "published" }, projection).lean<IContent[]>(),
  ]);

  const blogSlugs = new Set(blogDocs.map((d) => d.slug));
  const merged: BlogListItem[] = [
    ...blogDocs.map((d) => ({ ...d, href: `/blog/${d.slug}` })),
    ...rootDocs.filter((d) => !blogSlugs.has(d.slug)).map((d) => ({ ...d, href: `/${d.slug}` })),
  ];
  merged.sort(
    (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
  );
  return merged;
}

export async function getBlogListPage(page: number, limit = 24): Promise<BlogListPage> {
  try {
    const merged = await getMergedBlogItems();
    const total = merged.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;

    return { items: merged.slice(start, start + limit), page: safePage, totalPages, total };
  } catch {
    return { items: [], page: 1, totalPages: 1, total: 0 };
  }
}

/**
 * Powers the "Recent Posts" widget under the sticky contact-form sidebar on
 * an individual article (both /blog/[slug] and the root [slug] catch-all —
 * see that shared BlogSidebar component). `excludeSlug` leaves the post
 * currently being read out of its own "recent posts" list.
 */
export async function getLatestBlogPosts(excludeSlug: string, limit = 5): Promise<BlogListItem[]> {
  try {
    const merged = await getMergedBlogItems();
    return merged.filter((item) => item.slug !== excludeSlug).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getContentBySlug(
  slug: string,
  urlPath: IContent["urlPath"]
): Promise<IContent | null> {
  await dbConnect();
  const exact = await Content.findOne({ slug, urlPath, status: "published" }).lean<IContent>();
  if (exact) return exact;
  return await Content.findOne({
    slug: caseInsensitiveSlug(slug),
    urlPath,
    status: "published",
  }).lean<IContent>();
}

export async function getRedirect(fromPath: string): Promise<IRedirect | null> {
  await dbConnect();
  return await Redirect.findOne({ fromPath }).lean<IRedirect>();
}
