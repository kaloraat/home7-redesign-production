import { createHash } from "node:crypto";
import { uploadFileDirectly } from "@/lib/s3";

/**
 * Copies REA's listing photos into our own S3/CloudFront, so pages never
 * depend on REA's image servers (and keep working if REA access ends).
 *
 * The S3 key is derived from the source URL, so copying the same photo
 * twice overwrites one object instead of piling up copies — re-runs are
 * safe. REA's own URLs change whenever a photo is replaced, which gives a
 * new key, exactly as wanted.
 */
/** S3 key for an REA photo, minus the extension: "properties/<slug>/rea-<hash>." */
function keyPrefix(slug: string, url: string): string {
  return `properties/${slug}/rea-${createHash("sha1").update(url).digest("hex").slice(0, 16)}.`;
}

/**
 * Whether a page's photos are already exactly REA's photos, in REA's order
 * — checked from the S3 keys alone, so an unchanged gallery is never
 * downloaded again.
 */
export function imagesMatchRea(stored: string[], slug: string, reaUrls: string[]): boolean {
  return (
    stored.length === reaUrls.length &&
    reaUrls.every((url, i) => stored[i]?.includes(`/${keyPrefix(slug, url)}`))
  );
}

export async function copyReaImages(slug: string, urls: string[]): Promise<Map<string, string>> {
  const copied = new Map<string, string>();
  for (const url of urls) {
    // REA's export lists http:// URLs; the same host serves https.
    const res = await fetch(url.replace(/^http:\/\//, "https://"), { cache: "no-store" });
    if (!res.ok) throw new Error(`Couldn't download REA photo (HTTP ${res.status}): ${url}`);
    const body = Buffer.from(await res.arrayBuffer());
    // REA serves photos as application/octet-stream, which browsers may
    // download instead of display — so the type comes from the file itself.
    const { ext, contentType } = imageType(body, url);
    const key = `${keyPrefix(slug, url)}${ext}`;
    copied.set(url, await uploadFileDirectly(key, body, contentType));
  }
  return copied;
}

function imageType(body: Buffer, url: string): { ext: string; contentType: string } {
  if (body[0] === 0x89 && body[1] === 0x50) return { ext: "png", contentType: "image/png" };
  if (body.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", contentType: "image/webp" };
  if (body[0] === 0xff && body[1] === 0xd8) return { ext: "jpg", contentType: "image/jpeg" };
  throw new Error(`REA file isn't a JPEG, PNG or WebP image: ${url}`);
}
