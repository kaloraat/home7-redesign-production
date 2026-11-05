import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ALLOWED_UPLOADS, MAX_FILE_BYTES } from "@/lib/rentalApplication/constants";
import { isPrivateStorageConfigured, presignPrivateUpload } from "@/lib/s3Private";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * Hands the rental-application form a 10-minute presigned PUT into the
 * private bucket's pending/ folder. The file name is replaced with a random
 * id (the original name only travels in the submitted JSON), and the
 * submit route re-checks every file's real size and bytes before accepting it.
 */
const limited = createRateLimiter(60, 10 * 60 * 1000);

const Body = z.object({
  uploadSession: z.string().uuid(),
  filename: z.string().min(1).max(200),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes and try again." }, { status: 429 });
  }
  if (!isPrivateStorageConfigured()) {
    return NextResponse.json({ error: "Uploads are unavailable right now. Please call us." }, { status: 503 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Files must be 10MB or smaller." }, { status: 400 });
  }
  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = ALLOWED_UPLOADS[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Use a PDF, JPG, PNG or HEIC file." }, { status: 400 });
  }

  const key = `pending/${parsed.data.uploadSession}/${randomUUID()}.${ext}`;
  const url = await presignPrivateUpload(key, contentType);
  return NextResponse.json({ url, key, contentType });
}
