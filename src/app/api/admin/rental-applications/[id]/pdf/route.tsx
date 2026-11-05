import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import TenancyApplication, { type ITenancyApplication } from "@/models/TenancyApplication";
import { TenancyApplicationPdf, type PdfAttachment } from "@/lib/pdf/TenancyApplicationPdf";
import { applicationView } from "@/lib/rentalApplication/summary";
import { readPrivate } from "@/lib/s3Private";

// @react-pdf/renderer needs real Node APIs (Buffer, streams).
export const runtime = "nodejs";

// Caps the embedded-image work so one application with a huge pile of
// uploads can't make the download crawl. Anything past this is still
// listed as a link on the summary page.
const MAX_EMBEDDED_IMAGES = 20;

function imageFormat(url: string): "jpg" | "png" | null {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".png")) return "png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "jpg";
  return null; // PDFs etc: link only
}

/**
 * Fetches the application's JPG/PNG uploads so they can be embedded as
 * pages. Done here (not by react-pdf from a URL) so one unreachable file is
 * just skipped instead of failing the whole PDF.
 */
async function loadAttachments(a: ITenancyApplication): Promise<PdfAttachment[]> {
  if (a.formVersion === 2 && a.v2) return loadPrivateAttachments(a);
  const co = a.coApplicant;
  const p1 = co ? "Applicant 1: " : "";
  const groups: [string, string[] | undefined][] = [
    [`${p1}ID Documents`, a.idDocumentUrls],
    [`${p1}Proof of Income`, a.proofOfIncomeUrls],
    ["Rental History", a.rentalHistoryUrls],
    ["Applicant 2: ID Documents", co?.idDocumentUrls],
    ["Applicant 2: Proof of Income", co?.proofOfIncomeUrls],
  ];

  const wanted: { label: string; url: string; format: "jpg" | "png" }[] = [];
  for (const [label, urls] of groups) {
    (urls ?? []).forEach((url, i) => {
      const format = imageFormat(url);
      if (format) wanted.push({ label: `${label}, file ${i + 1}`, url, format });
    });
  }

  const results = await Promise.all(
    wanted.slice(0, MAX_EMBEDDED_IMAGES).map(async (w): Promise<PdfAttachment | null> => {
      try {
        const res = await fetch(w.url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return null;
        return { label: w.label, format: w.format, data: Buffer.from(await res.arrayBuffer()) };
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is PdfAttachment => r !== null);
}

/** v2: JPG/PNG uploads read straight from the private bucket (no public URLs). */
async function loadPrivateAttachments(a: ITenancyApplication): Promise<PdfAttachment[]> {
  const { files } = applicationView(a.v2!, { propertyAddress: a.propertyAddress });
  const wanted: { label: string; key: string; format: "jpg" | "png" }[] = [];
  for (const g of files) {
    g.files.forEach((f, i) => {
      const format = imageFormat(f.key);
      if (format) wanted.push({ label: `${g.label}, file ${i + 1}`, key: f.key, format });
    });
  }
  const results = await Promise.all(
    wanted.slice(0, MAX_EMBEDDED_IMAGES).map(async (w): Promise<PdfAttachment | null> => {
      const data = await readPrivate(w.key);
      return data ? { label: w.label, format: w.format, data } : null;
    })
  );
  return results.filter((r): r is PdfAttachment => r !== null);
}

/** Admin-only PDF export of one rental application (same auth as tenancy-checks/[id]/pdf). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;

  await dbConnect();
  const application = (await TenancyApplication.findById(id).lean()) as ITenancyApplication | null;
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachments = await loadAttachments(application);
  const buffer = await renderToBuffer(<TenancyApplicationPdf application={application} attachments={attachments} />);

  const filenameSlug = [application.firstName, application.lastName, application.coApplicant?.firstName ?? application.coApplicantName?.split(" ")[0]]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rental-application-${filenameSlug || id}.pdf"`,
    },
  });
}
