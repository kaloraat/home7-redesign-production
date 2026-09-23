import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { TenancyCheckPdf } from "@/lib/pdf/TenancyCheckPdf";

// @react-pdf/renderer needs real Node APIs (Buffer, streams) — not
// Edge-compatible, so this is pinned to the Node runtime explicitly rather
// than relying on it being the (current) default.
export const runtime = "nodejs";

/**
 * Admin-only PDF export of a single tenancy reference check — same auth
 * check as the other admin Route Handler (api/admin/upload), no owner-role
 * restriction since viewing this page itself has none either (only
 * deleting does, per lib/authz.ts).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;

  await dbConnect();
  const reference = await PropertyReference.findById(id).lean();
  if (!reference) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<TenancyCheckPdf reference={reference} />);

  // Filename: tenant name, slugified, so a downloaded file reads as
  // "tenancy-check-jane-smith.pdf" rather than a bare Mongo ObjectId.
  const filenameSlug = reference.tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tenancy-check-${filenameSlug || id}.pdf"`,
    },
  });
}
