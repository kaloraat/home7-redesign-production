/**
 * Second half of the legacy image migration. Run this AFTER
 * upload-images-to-s3.ts has finished and produced legacy-image-url-map.json
 * in the project root.
 *
 * upload-images-to-s3.ts only copies files to S3 — it doesn't touch the
 * database. This script goes through every Property/Agent/Content document,
 * finds image fields still pointing at the old home7.com.au hotlink, and
 * rewrites them to the matching CloudFront URL from the map. Anything it
 * can't find a mapping for is left untouched and logged, rather than
 * breaking the field.
 *
 * Run with:
 *   npx tsx scripts/repoint-images-to-cloudfront.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";
import Agent from "../src/models/Agent";
import Content from "../src/models/Content";

const MAP_PATH = path.join(process.cwd(), "legacy-image-url-map.json");
const LEGACY_BASE = "https://home7.com.au/public/assets/uploads/media-uploader/";

function loadMap(): Record<string, string> {
  if (!fs.existsSync(MAP_PATH)) {
    console.error(
      `Missing ${MAP_PATH} — run "npx tsx scripts/upload-images-to-s3.ts <path-to-media-uploader-folder>" first.`
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));
}

function rewriteUrl(url: string | undefined, map: Record<string, string>, misses: Set<string>): string | undefined {
  if (!url || !url.startsWith(LEGACY_BASE)) return url; // not a legacy hotlink — leave as-is
  const filename = url.slice(LEGACY_BASE.length);
  const replacement = map[filename];
  if (!replacement) {
    misses.add(filename);
    return url; // leave the old (still-working) hotlink rather than break it
  }
  return replacement;
}

// This script originally only ever touched single-URL fields
// (Property.images[], Agent.photo, Content.coverImage) — it never rewrote
// <img src="..."> tags embedded INSIDE bodyHtml, so any inline image in a
// blog post's actual content was left hotlinking to the old Laravel host
// indefinitely, with no plan to ever fix it. Rewrites every occurrence
// found, in place, leaving anything already migrated (or already
// unmapped) untouched.
function rewriteInlineImages(
  html: string,
  map: Record<string, string>,
  misses: Set<string>
): { html: string; changed: boolean } {
  let changed = false;
  const rewritten = html.replace(/(<img\b[^>]*\ssrc=")([^"]*)(")/gi, (match, pre, url, post) => {
    const replacement = rewriteUrl(url, map, misses);
    if (replacement && replacement !== url) {
      changed = true;
      return `${pre}${replacement}${post}`;
    }
    return match;
  });
  return { html: rewritten, changed };
}

async function main() {
  await dbConnect();
  const map = loadMap();
  const misses = new Set<string>();

  let propertyCount = 0;
  const properties = await Property.find({});
  for (const p of properties) {
    const newImages = p.images.map((u) => rewriteUrl(u, map, misses)!).filter(Boolean);
    const changed = JSON.stringify(newImages) !== JSON.stringify(p.images);
    if (changed) {
      p.images = newImages;
      await p.save();
      propertyCount++;
    }
  }
  console.log(`Properties repointed: ${propertyCount}/${properties.length}`);

  let agentCount = 0;
  const agents = await Agent.find({});
  for (const a of agents) {
    const newPhoto = rewriteUrl(a.photo, map, misses);
    if (newPhoto !== a.photo) {
      a.photo = newPhoto;
      await a.save();
      agentCount++;
    }
  }
  console.log(`Agents repointed: ${agentCount}/${agents.length}`);

  let contentCount = 0;
  let contentBodyCount = 0;
  const contents = await Content.find({});
  for (const c of contents) {
    let dirty = false;

    const newCover = rewriteUrl(c.coverImage, map, misses);
    if (newCover !== c.coverImage) {
      c.coverImage = newCover;
      dirty = true;
      contentCount++;
    }

    const { html: newBody, changed: bodyChanged } = rewriteInlineImages(c.bodyHtml, map, misses);
    if (bodyChanged) {
      c.bodyHtml = newBody;
      dirty = true;
      contentBodyCount++;
    }

    if (dirty) await c.save();
  }
  console.log(`Content cover images repointed: ${contentCount}/${contents.length}`);
  console.log(`Content posts with inline body images repointed: ${contentBodyCount}/${contents.length}`);

  if (misses.size > 0) {
    console.log(`\n${misses.size} filenames had no match in legacy-image-url-map.json (left as old hotlinks):`);
    for (const m of Array.from(misses).slice(0, 20)) console.log(`  - ${m}`);
    if (misses.size > 20) console.log(`  ...and ${misses.size - 20} more`);
  }

  console.log("\nDone. Once you've spot-checked a few pages, you can remove the");
  console.log('"home7.com.au" entry from next.config.ts\'s images.remotePatterns —');
  console.log("it was only needed for the interim hotlinking this replaces.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
