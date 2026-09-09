/**
 * One-off backfill: adds propertyType/amenities/mapEmbedUrl/videoEmbedUrl to
 * existing Property records from the same Laravel export migrate-laravel-data.ts
 * used — these fields didn't exist on the Property model when that script ran,
 * so ~150 real listings were missing a Google Maps embed, a structured
 * amenities list, and a property-type label despite the source data having
 * all three (see PROJECT_BRIEF.md-adjacent investigation, 2026-09-01: map
 * present on 147/153, features on 148/153, categories_id on 134/153 of the
 * raw export).
 *
 * Deliberately NOT a re-run of the full migration — this only ever `$set`s
 * these four new fields, keyed on slug, and touches nothing else. The full
 * migration upserts every field, which would silently overwrite real admin
 * edits made since the original import (including the seoTitle/seoDescription
 * fixes made directly in this same session).
 *
 * Run with:
 *   npx tsx scripts/backfill-property-details.ts
 * Requires MONGODB_URI in .env.local. Idempotent — safe to re-run.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";

const DATA_DIR = path.join(__dirname, "data", "laravel-export");

function loadJSON<T = unknown>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), "utf-8"));
}

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

// From property_categories in the SQL dump — never had a model/field to
// migrate into before now.
const CATEGORY_NAMES: Record<number, string> = {
  1: "Residential",
  2: "Villa",
  3: "Townhouse",
  4: "Single Family",
  5: "Land",
  6: "House & Land Package",
  7: "House",
  8: "Flat",
  9: "Condominium",
  10: "Apartment Building",
  11: "Apartment",
  12: "Acreage",
  13: "Commercial",
  14: "Shop",
  15: "Office",
  16: "Unit",
  18: "Room",
};

function extractIframeSrc(html: string | null | undefined): string | undefined {
  if (!html) return undefined;
  const match = /<iframe[^>]*\ssrc="([^"]+)"/i.exec(html);
  return match ? match[1] : undefined;
}

// Most `video` values in the source data are just the property's own
// address typed as plain text (an apparent data-entry habit, not a real
// value) — only ~3% are an actual embed. Only ever keep a genuine one.
function extractVideoEmbedUrl(raw: string | null | undefined): string | undefined {
  if (!raw || !/iframe|youtube|vimeo/i.test(raw)) return undefined;
  return extractIframeSrc(raw);
}

async function main() {
  await dbConnect();

  type LaravelProperty = {
    slug: string;
    categories_id: string | null;
    features: string | null;
    map: string | null;
    video: string | null;
  };
  const properties = loadJSON<LaravelProperty[]>("properties");

  let updated = 0;
  let skipped = 0;
  let strippedDescriptions = 0;

  for (const p of properties) {
    const propertyType = p.categories_id ? CATEGORY_NAMES[Number(p.categories_id)] : undefined;
    const amenities = phpSerializedStrings(p.features);
    const mapEmbedUrl = extractIframeSrc(p.map);
    const videoEmbedUrl = extractVideoEmbedUrl(p.video);

    if (!propertyType && amenities.length === 0 && !mapEmbedUrl && !videoEmbedUrl) {
      skipped++;
      continue;
    }

    const set: Record<string, unknown> = {};
    if (propertyType) set.propertyType = propertyType;
    if (amenities.length > 0) set.amenities = amenities;
    if (mapEmbedUrl) set.mapEmbedUrl = mapEmbedUrl;
    if (videoEmbedUrl) set.videoEmbedUrl = videoEmbedUrl;

    // Amenities now render as their own section — the exact
    // "<p><b>Features:</b></p><ul>...</ul>" block migrate-laravel-data.ts
    // appended to the end of `description` for this same data would
    // otherwise show it twice. Only strips that literal, script-generated
    // trailing block (built from the SAME featureList as `amenities`
    // above) — never touches hand-written content, and only fires when
    // amenities were actually found for this property.
    if (amenities.length > 0) {
      const existing = await Property.findOne({ slug: p.slug }).select("description").lean();
      if (existing?.description) {
        const featuresBlock =
          "<p><b>Features:</b></p><ul>" + amenities.map((f) => `<li>${f}</li>`).join("") + "</ul>";
        if (existing.description.endsWith(featuresBlock)) {
          set.description = existing.description.slice(0, -featuresBlock.length);
          strippedDescriptions++;
        }
      }
    }

    const result = await Property.updateOne({ slug: p.slug }, { $set: set });
    if (result.matchedCount > 0) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Stripped duplicate Features block from ${strippedDescriptions} descriptions.`);

  console.log(`Backfilled ${updated} properties, skipped ${skipped} (no new data or slug not found).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
