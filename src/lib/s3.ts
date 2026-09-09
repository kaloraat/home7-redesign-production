import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 + CloudFront for property/agent photos. Images are uploaded directly
 * from the browser to S3 via a short-lived presigned URL (so large photo
 * uploads never have to pass through our own server), then served publicly
 * through CloudFront rather than S3 directly — CloudFront gives caching at
 * the edge, which matters for a listings-heavy site where page speed is
 * itself an SEO signal.
 */

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY. See SETUP.md for the S3 setup checklist."
    );
  }

  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

/**
 * Uploads a file directly from the server (not a presigned browser URL) —
 * for the tenancy reference check's public, token-gated form, which has no
 * admin session to authenticate a presign request against. The server
 * already holds AWS credentials via env vars, so it can just PUT the file
 * itself after receiving it in the request body.
 */
export async function uploadFileDirectly(key: string, body: Buffer, contentType: string) {
  const bucket = process.env.AWS_S3_BUCKET;
  const cdnDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  if (!bucket) throw new Error("Missing AWS_S3_BUCKET.");
  if (!cdnDomain) throw new Error("Missing NEXT_PUBLIC_CLOUDFRONT_DOMAIN.");

  const client = getS3Client();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return `https://${cdnDomain}/${key}`;
}

/**
 * Returns a presigned URL the browser can PUT a file to directly, plus the
 * public CloudFront URL it'll be reachable at afterwards.
 */
export async function createPresignedUpload(key: string, contentType: string) {
  const bucket = process.env.AWS_S3_BUCKET;
  const cdnDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  if (!bucket) throw new Error("Missing AWS_S3_BUCKET.");
  if (!cdnDomain) throw new Error("Missing NEXT_PUBLIC_CLOUDFRONT_DOMAIN.");

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
  const publicUrl = `https://${cdnDomain}/${key}`;

  return { uploadUrl, publicUrl };
}

// `folder` groups uploads by what they belong to (properties/agents/blog),
// so an agent photo doesn't land under an S3 "properties/" prefix — this
// used to be hardcoded to "properties" before the admin rebuild started
// reusing ImageUploader for Agent/Blog uploads too.
export function buildImageKey(folder: string, slug: string, filename: string) {
  const safe = filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  return `${folder}/${slug}/${Date.now()}-${safe}`;
}
