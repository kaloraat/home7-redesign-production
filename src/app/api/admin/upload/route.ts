import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { buildImageKey, createPresignedUpload } from "@/lib/s3";

const BodySchema = z.object({
  folder: z.enum(["properties", "agents", "blog"]),
  slug: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().startsWith("image/"),
});

/**
 * Admin-only Route Handler (not a Server Action) — the browser calls this
 * to get a presigned S3 URL, then uploads the file directly to S3 itself.
 * That two-step flow is exactly the kind of thing that belongs in /api: the
 * client needs a plain URL to hand off to the browser's own fetch/PUT, not
 * a React-only RPC call.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const key = buildImageKey(parsed.data.folder, parsed.data.slug, parsed.data.filename);
    const { uploadUrl, publicUrl } = await createPresignedUpload(key, parsed.data.contentType);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload URL generation failed" },
      { status: 500 }
    );
  }
}
