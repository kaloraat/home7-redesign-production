/**
 * Closes the gap left by upload-images-to-s3.ts + repoint-images-to-cloudfront.ts:
 * those two scripts only migrate images that were present in the developer's
 * home7_web.zip export. Any image uploaded to the live site *after* that zip
 * was taken (confirmed cause: e.g. 22a-acre-street-oran-park-nsw-2570's
 * photos are dated 2026-08-03, newer than the zip) has no local file to
 * upload, so it gets left on the old home7.com.au hotlink.
 *
 * This script closes that gap directly: for every Property/Agent/Content
 * image still pointing at the home7.com.au hotlink, it fetches the file
 * from that still-live URL, uploads it to S3, and repoints the field —
 * no dependency on a fresher zip from the developer.
 *
 * Run with:
 *   npx tsx scripts/migrate-remaining-hotlinks.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";
import Agent from "../src/models/Agent";
import Content from "../src/models/Content";

const LEGACY_BASE = "https://home7.com.au/public/assets/uploads/media-uploader/";

const { AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NEXT_PUBLIC_CLOUDFRONT_DOMAIN } =
  process.env;

if (!AWS_REGION || !AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !NEXT_PUBLIC_CLOUDFRONT_DOMAIN) {
  console.error(
    "Missing AWS_REGION / AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / NEXT_PUBLIC_CLOUDFRONT_DOMAIN in .env.local"
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function extOf(url: string) {
  const m = url.match(/\.[a-zA-Z0-9]+$/);
  return m ? m[0].toLowerCase() : ".jpg";
}

async function migrateOne(url: string, cache: Map<string, string>): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached;

  const filename = url.slice(LEGACY_BASE.length);
  const key = `legacy/${filename}`;
  const contentType = CONTENT_TYPES[extOf(filename)] ?? "image/jpeg";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const body = Buffer.from(await res.arrayBuffer());

  await s3.send(new PutObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key, Body: body, ContentType: contentType }));

  const newUrl = `https://${NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${key}`;
  cache.set(url, newUrl);
  return newUrl;
}

async function main() {
  await dbConnect();
  const cache = new Map<string, string>(); // avoid re-fetching the same URL twice
  let migrated = 0;
  let failed = 0;
  const failures: string[] = [];

  async function migrateField(url: string | undefined): Promise<string | undefined> {
    if (!url || !url.startsWith(LEGACY_BASE)) return url;
    try {
      const newUrl = await migrateOne(url, cache);
      migrated++;
      if (migrated % 50 === 0) console.log(`  ${migrated} migrated so far...`);
      return newUrl;
    } catch (err) {
      failed++;
      failures.push(`${url} — ${err instanceof Error ? err.message : "unknown error"}`);
      return url; // leave on the working hotlink rather than break it
    }
  }

  const properties = await Property.find({});
  for (const p of properties) {
    let changed = false;
    const newImages: string[] = [];
    for (const img of p.images) {
      const result = await migrateField(img);
      if (result !== img) changed = true;
      if (result) newImages.push(result);
    }
    if (changed) {
      p.images = newImages;
      await p.save();
    }
  }

  const agents = await Agent.find({});
  for (const a of agents) {
    const newPhoto = await migrateField(a.photo);
    if (newPhoto !== a.photo) {
      a.photo = newPhoto;
      await a.save();
    }
  }

  const contents = await Content.find({});
  for (const c of contents) {
    const newCover = await migrateField(c.coverImage);
    if (newCover !== c.coverImage) {
      c.coverImage = newCover;
      await c.save();
    }
  }

  console.log(`\nMigrated: ${migrated}`);
  if (failed > 0) {
    console.log(`Failed (left on old hotlink): ${failed}`);
    for (const f of failures.slice(0, 20)) console.log(`  - ${f}`);
    if (failures.length > 20) console.log(`  ...and ${failures.length - 20} more`);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
