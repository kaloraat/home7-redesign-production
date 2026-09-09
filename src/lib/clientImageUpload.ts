// Shared by ImageUploader.tsx (property/agent/blog-cover photo pickers) and
// RichTextEditor.tsx (inline images dropped/pasted/picked into content) —
// one upload pipeline, not two slightly-different copies of it.

export type UploadFolder = "properties" | "agents" | "blog";

// Resized/re-encoded client-side before the file ever reaches S3 — see
// SETUP.md. 2000px covers every real display size next/image will ever
// request (full-bleed hero images included), and 0.88 WebP quality is
// visually indistinguishable from the original at a fraction of the size.
const MAX_DIMENSION = 2000;
const QUALITY = 0.88;
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024;

async function compressImage(
  file: File
): Promise<{ blob: Blob; contentType: string; filename: string }> {
  // Already small (e.g. a photo already exported/compressed elsewhere) —
  // re-encoding would only cost quality for no real size win.
  if (file.size < SKIP_COMPRESSION_UNDER_BYTES || !file.type.startsWith("image/")) {
    return { blob: file, contentType: file.type || "image/jpeg", filename: file.name };
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    let { width, height } = bitmap;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", QUALITY)
    );
    if (!blob) throw new Error("canvas encode failed");

    const filename = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".webp";
    return { blob, contentType: "image/webp", filename };
  } catch {
    // Any failure (unsupported format, decode error, etc.) — fall back to
    // uploading the original rather than losing the photo entirely.
    return { blob: file, contentType: file.type || "image/jpeg", filename: file.name };
  }
}

/**
 * Compresses then uploads one image file via the presigned-URL flow
 * (/api/admin/upload → PUT straight to S3), returning the public CloudFront
 * URL. This is the ONLY way an image ever gets into a form's saved
 * content/fields — there is no path (toolbar button, drag-drop, or paste)
 * that embeds a file as a base64 data URI, which would bloat the stored
 * HTML with the full image bytes on every load of the page.
 */
export async function uploadImageFile(
  file: File,
  folder: UploadFolder,
  slug: string
): Promise<string> {
  const { blob, contentType, filename } = await compressImage(file);

  const presignRes = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, slug, filename, contentType }),
  });
  if (!presignRes.ok) {
    const body = await presignRes.json().catch(() => null);
    throw new Error(body?.error ? JSON.stringify(body.error) : "Failed to get upload URL");
  }
  const { uploadUrl, publicUrl } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error("Upload to S3 failed");

  return publicUrl;
}
