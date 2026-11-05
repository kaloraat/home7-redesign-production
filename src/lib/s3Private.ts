import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Private bucket for rental-application uploads (ID, payslips, bank
 * statements). Unlike lib/s3.ts (public listing photos via CloudFront),
 * nothing here ever has a public URL: the browser uploads with a short
 * presigned PUT, and staff read through /api/admin/... which checks the
 * session and then redirects to a 5-minute presigned GET.
 *
 * Layout:
 *   pending/<uploadSession>/<uuid>.<ext>   uploaded, not yet submitted (lifecycle rule expires these)
 *   applications/<applicationId>/<uuid>.<ext>   part of a submitted application
 */

let client: S3Client | null = null;

function s3() {
  if (client) return client;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) throw new Error("Missing AWS credentials");
  client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return client;
}

export function privateBucket(): string {
  const bucket = process.env.AWS_S3_PRIVATE_BUCKET;
  if (!bucket) throw new Error("Missing AWS_S3_PRIVATE_BUCKET");
  return bucket;
}

export const isPrivateStorageConfigured = () => !!process.env.AWS_S3_PRIVATE_BUCKET;

export async function presignPrivateUpload(key: string, contentType: string) {
  const cmd = new PutObjectCommand({ Bucket: privateBucket(), Key: key, ContentType: contentType });
  return getSignedUrl(s3(), cmd, { expiresIn: 60 * 10 });
}

export async function headPrivate(key: string) {
  try {
    const res = await s3().send(new HeadObjectCommand({ Bucket: privateBucket(), Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? "" };
  } catch {
    return null;
  }
}

/** First `n` bytes of an object, to check what the file really is. */
export async function readPrivateHead(key: string, n = 32): Promise<Uint8Array | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key, Range: `bytes=0-${n - 1}` }));
    return res.Body ? await res.Body.transformToByteArray() : null;
  } catch {
    return null;
  }
}

export async function readPrivate(key: string): Promise<Buffer | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
    return res.Body ? Buffer.from(await res.Body.transformToByteArray()) : null;
  } catch {
    return null;
  }
}

export async function copyPrivate(from: string, to: string, contentType: string) {
  await s3().send(
    new CopyObjectCommand({
      Bucket: privateBucket(),
      CopySource: `${privateBucket()}/${from}`,
      Key: to,
      ContentType: contentType,
      MetadataDirective: "REPLACE",
    })
  );
}

export async function deletePrivate(key: string) {
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: privateBucket(), Key: key }));
  } catch {
    // Best effort: pending/ objects also expire via the bucket lifecycle rule.
  }
}

/** Short-lived link for a logged-in staff member. */
export async function signedPrivateGet(key: string, filename: string, seconds = 300) {
  const safe = filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
  const cmd = new GetObjectCommand({
    Bucket: privateBucket(),
    Key: key,
    ResponseContentDisposition: `inline; filename="${safe}"`,
  });
  return getSignedUrl(s3(), cmd, { expiresIn: seconds });
}

/** What the bytes say the file is, regardless of its name. */
export function sniffType(bytes: Uint8Array): "pdf" | "jpg" | "png" | "heic" | null {
  const b = bytes;
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf"; // %PDF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  const ftyp = String.fromCharCode(...b.slice(4, 8));
  const brand = String.fromCharCode(...b.slice(8, 12));
  if (ftyp === "ftyp" && /^(heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/.test(brand)) return "heic";
  return null;
}
