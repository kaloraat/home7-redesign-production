/**
 * One-off bulk upload: pushes the extracted Laravel site's image files to
 * S3 and prints a mapping from old filename -> new CloudFront URL, so the
 * property/agent import script can rewrite image references to point at
 * the new host instead of the old Laravel server.
 *
 * Run with:
 *   AWS creds set in .env.local, then:
 *   npx tsx scripts/upload-images-to-s3.ts <path-to-media-uploader-folder>
 *
 * Deliberately skips the `thumb-` and `grid-` prefixed files — those were
 * the old site's manually pre-generated size variants. next/image + S3 +
 * CloudFront replaces that whole mechanism with on-demand resizing, so
 * only the originals need to make the trip.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SOURCE_DIR = process.argv[2];
if (!SOURCE_DIR) {
  console.error("Usage: npx tsx scripts/upload-images-to-s3.ts <path-to-media-uploader-folder>");
  process.exit(1);
}

const { AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NEXT_PUBLIC_CLOUDFRONT_DOMAIN } =
  process.env;

if (!AWS_REGION || !AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !NEXT_PUBLIC_CLOUDFRONT_DOMAIN) {
  console.error("Missing AWS_REGION / AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / NEXT_PUBLIC_CLOUDFRONT_DOMAIN in .env.local");
  process.exit(1);
}

const client = new S3Client({
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

async function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => !f.startsWith("thumb-") && !f.startsWith("grid-"))
    .filter((f) => Object.keys(CONTENT_TYPES).includes(path.extname(f).toLowerCase()));

  console.log(`Uploading ${files.length} original images (skipping thumb-/grid- variants)...`);

  const mapping: Record<string, string> = {};
  let done = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const body = fs.readFileSync(filePath);
    const key = `legacy/${file}`;
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];

    await client.send(
      new PutObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key, Body: body, ContentType: contentType })
    );

    mapping[file] = `https://${NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${key}`;
    done += 1;
    if (done % 100 === 0) console.log(`  ${done}/${files.length}`);
  }

  fs.writeFileSync("legacy-image-url-map.json", JSON.stringify(mapping, null, 2));
  console.log(`Done. ${done} images uploaded. Mapping written to legacy-image-url-map.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
