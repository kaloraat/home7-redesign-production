/**
 * One-off migration: imports the old Laravel site's real data (agents,
 * properties, blog posts) into MongoDB, preserving exact slugs so no URLs
 * break. Source data is the parsed JSON export in scripts/data/laravel-export/
 * (produced from the Laravel team's mysqldump — see PROJECT_BRIEF.md).
 *
 * Run with:
 *   npx tsx scripts/migrate-laravel-data.ts
 * Requires MONGODB_URI in .env.local.
 *
 * Idempotent: every write is an upsert keyed on slug, so re-running after
 * fixing source data or adding the still-missing `other_blogs` rows is safe.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import dbConnect from "../src/lib/db";
import Agent from "../src/models/Agent";
import Property from "../src/models/Property";
import Content from "../src/models/Content";

const DATA_DIR = path.join(__dirname, "data", "laravel-export");

// Old site's image path convention — interim hotlink target until
// scripts/upload-images-to-s3.ts has migrated the full export to CloudFront.
const LEGACY_IMAGE_BASE = "https://home7.com.au/public/assets/uploads/media-uploader/";

function loadJSON<T = unknown>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), "utf-8"));
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// --- PHP serialize() deserializer, narrow case: single-element string array
// like a:1:{i:0;s:6:"Leased";} which is how the Laravel export stores each
// property's sale/rent/sold/leased status. Also handles the multi-element
// feature lists like a:3:{i:0;s:9:"Broadband";...} by returning all values.
function phpSerializedStrings(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  const re = /s:\d+:"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    out.push(m[1]);
  }
  return out;
}

const AU_STATES = ["NSW", "QLD", "VIC", "WA", "SA", "TAS", "ACT", "NT"];
const STATE_RE = AU_STATES.join("|");

function parseAddress(rawTitle: string): {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
} | null {
  // Some rows have unrelated blurb text appended after a newline (data-entry
  // mistakes in the Laravel admin) — only the first line is ever the address.
  const firstLine = rawTitle.split(/\r?\n/)[0] ?? "";
  const t = firstLine.replace(/[\s ]+/g, " ").trim();

  let m = t.match(new RegExp(`(${STATE_RE})[\\s.\\-]*?(\\d{4})`, "i"));
  let state: string | undefined;
  let postcode: string | undefined;
  let pre: string;

  if (m && m.index !== undefined) {
    state = m[1].toUpperCase();
    postcode = m[2];
    pre = t.slice(0, m.index);
  } else {
    m = t.match(new RegExp(`(\\d{4})[\\s.\\-]*?(${STATE_RE})`, "i"));
    if (m && m.index !== undefined) {
      postcode = m[1];
      state = m[2].toUpperCase();
      pre = t.slice(0, m.index);
    } else {
      // No state token at all (a handful of rows just end in a bare
      // postcode, e.g. "1A Burkhart Place Minto 2566") — every listing on
      // this site is in NSW, so default rather than drop the row.
      const pc = t.match(/(\d{4})\s*$/);
      if (!pc || pc.index === undefined) return null;
      postcode = pc[1];
      state = "NSW";
      pre = t.slice(0, pc.index);
    }
  }

  pre = pre.trim().replace(/,$/, "").trim();
  if (!pre) return null;

  let street: string;
  let suburb: string;
  if (pre.includes(",")) {
    const parts = pre.split(",").map((s) => s.trim());
    suburb = parts[parts.length - 1];
    street = parts.slice(0, -1).join(", ");
  } else {
    const words = pre.split(" ");
    if (words.length >= 2) {
      suburb = words.slice(-2).join(" ");
      street = words.slice(0, -2).join(" ");
    } else {
      suburb = words[0] ?? "";
      street = "";
    }
  }

  if (!street) street = pre;
  return { street, suburb, state, postcode };
}

async function main() {
  await dbConnect();

  // Reconcile indexes with the current schema — Content's uniqueness moved
  // from slug-alone to a (slug, urlPath) compound index (see Content.ts),
  // and Mongoose doesn't drop stale indexes on its own. Without this, the
  // old slug-only unique index (created by an earlier run of this script)
  // would reject the handful of slugs that legitimately exist as both a
  // blog post and a root page.
  await Content.syncIndexes();

  // --- Media map: Laravel media_upload id -> old-site relative path ---
  const mediaUploads = loadJSON<Array<{ id: number; path: string }>>("media_uploads");
  const mediaMap = new Map<number, string>();
  for (const m of mediaUploads) mediaMap.set(m.id, m.path);

  function resolveImage(id: unknown): string | null {
    if (id === null || id === undefined || id === "") return null;
    const n = Number(id);
    if (Number.isNaN(n)) return null;
    const p = mediaMap.get(n);
    return p ? `${LEGACY_IMAGE_BASE}${p}` : null;
  }

  function resolveGallery(pipeList: string | null | undefined): string[] {
    if (!pipeList) return [];
    return pipeList
      .split("|")
      .map((s) => resolveImage(s.trim()))
      .filter((u): u is string => Boolean(u));
  }

  // --- Agents ---
  type TeamMember = {
    id: number;
    name: string;
    designation: string;
    description: string | null;
    image: string | null;
    office: string | null;
    mobile: string | null;
    whats_app: string | null;
    email: string | null;
    status: string;
  };
  const teamMembers = loadJSON<TeamMember[]>("team_members");
  const laravelAgentIdToSlug = new Map<number, string>();

  let agentCount = 0;
  for (const t of teamMembers) {
    const slug = slugify(t.name);
    laravelAgentIdToSlug.set(t.id, slug);
    await Agent.findOneAndUpdate(
      { slug },
      {
        slug,
        name: t.name,
        role: t.designation || "Agent",
        phone: t.office || undefined,
        mobile: t.mobile || undefined,
        whatsapp: t.whats_app || undefined,
        email: t.email || undefined,
        photo: resolveImage(t.image) || undefined,
        bio: t.description || undefined,
        active: t.status === "publish",
      },
      { upsert: true }
    );
    agentCount++;
  }
  console.log(`Agents upserted: ${agentCount}`);

  const agentDocs = await Agent.find({});
  const slugToAgentId = new Map(agentDocs.map((a) => [a.slug, a._id]));

  // --- Properties ---
  type LaravelProperty = {
    id: number;
    title: string;
    slug: string;
    price: string | null;
    price_postfix: string | null;
    categories_id: string | null;
    agent_id: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    toilet: string | null;
    garage: string | null;
    house_area: string | null;
    area: string | null;
    description: string | null;
    property_status: string | null;
    features: string | null;
    image: string | null;
    gallery: string | null;
    address: string | null;
    meta_title: string | null;
    meta_description: string | null;
  };
  const properties = loadJSON<LaravelProperty[]>("properties");

  const statusMap: Record<string, "sale" | "rent" | "sold" | "leased" | "other"> = {
    "For Sale": "sale",
    "For Rent": "rent",
    Sold: "sold",
    Leased: "leased",
    // The Laravel data has a genuine 5th status, literally the string
    // "Other" — off-market/land/development listings. Confirmed against
    // FrontendController.php: shown only on /other-properties, explicitly
    // excluded from /properties and /properties-for-sale on the live site.
    // Falling back unmapped statuses to "sale" (as this used to do) was
    // silently miscategorizing every one of these.
    Other: "other",
  };

  let propertyCount = 0;
  const skipped: string[] = [];

  for (const p of properties) {
    const parsed = parseAddress(p.address || p.title || "");
    if (!parsed) {
      skipped.push(`#${p.id} "${p.title}" — could not parse a suburb/state/postcode, skipped`);
      continue;
    }

    const [statusWord] = phpSerializedStrings(p.property_status);
    const listingType = (statusMap[statusWord ?? ""] ?? "sale") as
      | "sale"
      | "rent"
      | "sold"
      | "leased"
      | "other";

    const featureList = phpSerializedStrings(p.features);

    let description = p.description || "";
    if (featureList.length > 0) {
      description += `<p><b>Features:</b></p><ul>${featureList
        .map((f) => `<li>${f}</li>`)
        .join("")}</ul>`;
    }

    const images = [resolveImage(p.image), ...resolveGallery(p.gallery)].filter(
      (u): u is string => Boolean(u)
    );

    const agentSlug = p.agent_id ? laravelAgentIdToSlug.get(Number(p.agent_id)) : undefined;
    const agentId = agentSlug ? slugToAgentId.get(agentSlug) : undefined;

    const rawPrice = (p.price || "").trim();
    const isWeekly = (p.price_postfix || "").toLowerCase().includes("week");

    const doc: Record<string, unknown> = {
      slug: p.slug,
      address: parsed.street,
      suburb: parsed.suburb,
      state: parsed.state,
      postcode: parsed.postcode,
      listingType,
      description: description || undefined,
      images,
      agent: agentId,
      featured: false,
      seoTitle: p.meta_title || undefined,
      seoDescription: p.meta_description || undefined,
      bedrooms: p.bedrooms ? parseInt(p.bedrooms, 10) || undefined : undefined,
      bathrooms: p.bathrooms ? parseInt(p.bathrooms, 10) || undefined : undefined,
      toilets: p.toilet ? parseInt(p.toilet, 10) || undefined : undefined,
      carSpaces: p.garage ? parseInt(p.garage, 10) || undefined : undefined,
      landSize: p.area || p.house_area || undefined,
    };

    if (listingType === "rent" && isWeekly) {
      const n = parseInt(rawPrice.replace(/[^\d]/g, ""), 10);
      if (!Number.isNaN(n)) doc.rentPerWeek = n;
      doc.priceDisplay = rawPrice ? `${rawPrice} P/W` : undefined;
    } else {
      doc.priceDisplay = rawPrice || undefined;
    }

    await Property.findOneAndUpdate({ slug: p.slug }, doc, { upsert: true });
    propertyCount++;
  }
  console.log(`Properties upserted: ${propertyCount}`);
  if (skipped.length > 0) {
    console.log(`Properties skipped (${skipped.length}):`);
    for (const s of skipped) console.log(`  - ${s}`);
  }

  // --- Blog content ---
  type LaravelBlog = {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    image: string | null;
    status: string;
    meta_title: string | null;
    meta_description: string | null;
    created_at: string;
  };
  const blogs = loadJSON<LaravelBlog[]>("blogs");

  let blogCount = 0;
  for (const b of blogs) {
    await Content.findOneAndUpdate(
      { slug: b.slug, urlPath: "blog" },
      {
        slug: b.slug,
        urlPath: "blog",
        title: b.title,
        excerpt: b.excerpt || undefined,
        bodyHtml: b.content,
        coverImage: resolveImage(b.image) || undefined,
        status: b.status === "publish" ? "published" : "draft",
        publishedAt: b.created_at ? new Date(b.created_at) : undefined,
        seoTitle: b.meta_title || undefined,
        seoDescription: b.meta_description || undefined,
        source: "manual",
      },
      { upsert: true }
    );
    blogCount++;
  }
  console.log(`Blog posts upserted: ${blogCount}`);

  // --- Root-level SEO landing pages (the site's `other_blogs` table) ---
  // This is the data source for the ~16-18 root-level pages (no /blog/
  // prefix) that were missing from the first export — the developer's
  // second export includes them. These render at /{slug} via the catch-all.
  type LaravelOtherBlog = {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    image: string | null;
    status: string;
    meta_title: string | null;
    meta_description: string | null;
    created_at: string;
  };
  const otherBlogs = loadJSON<LaravelOtherBlog[]>("other_blogs");

  let rootCount = 0;
  for (const o of otherBlogs) {
    await Content.findOneAndUpdate(
      { slug: o.slug, urlPath: "root" },
      {
        slug: o.slug,
        urlPath: "root",
        title: o.title,
        excerpt: o.excerpt || undefined,
        bodyHtml: o.content,
        coverImage: resolveImage(o.image) || undefined,
        status: o.status === "publish" ? "published" : "draft",
        publishedAt: o.created_at ? new Date(o.created_at) : undefined,
        seoTitle: o.meta_title || undefined,
        seoDescription: o.meta_description || undefined,
        source: "manual",
      },
      { upsert: true }
    );
    rootCount++;
  }
  console.log(`Root-level SEO pages upserted: ${rootCount}`);

  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
