import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { uploadFileDirectly, buildImageKey } from "@/lib/s3";
import { notifyReferenceOutcome } from "@/lib/notifyTenancyReference";

const YES_NO_NA = z.enum(["Yes", "No", "Not Applicable"]);

// Mirrors the live site's validation (FrontendController@submit_agent_form)
// for the fields that are always required regardless of any conditional
// follow-up (e.g. "why was rent paid late" only matters if rent WASN'T
// paid on time). The conditional sub-fields are left optional here — the
// public questionnaire page already shows/requires them client-side to
// match, and this is an internal business tool (an agent responding to a
// reference request), not adversarial public input, so trusting the
// client's conditional logic is a reasonable trade-off against replicating
// ~10 conditional-required rules server-side too.
const FieldsSchema = z.object({
  agentName: z.string().min(1),
  jobPosition: z.string().min(1),
  leaseholderOrApprovedOccupant: YES_NO_NA,
  agencyName: z.string().min(1),
  agentEmail: z.string().email(),
  propertyType: z.string().min(1),
  leaseType: z.enum(["Fixed Term", "Periodic"]),
  tenancyAgreementCommencedDate: z.coerce.date(),
  tenancyAgreementExpiresDate: z.coerce.date(),
  tenancyTerminatedByOffice: YES_NO_NA,
  weeklyRentPaid: z.string().min(1),
  rentPaidTo: z.coerce.date(),
  rentPaidOnTime: YES_NO_NA,
  rentPaidLateCount: z.string().optional(),
  rentLateFrequency: z.string().optional(),
  rentDefaultNoticeIssued: YES_NO_NA,
  rentDefaultNoticeIssuedReason: z.string().optional(),
  noticesIssuedByOffice: YES_NO_NA,
  noticesIssuedByOfficeReason: z.string().optional(),
  tenantServedNotices: YES_NO_NA,
  tenantServedNoticesReason: z.string().optional(),
  routineInspectionsConducted: YES_NO_NA,
  lastRoutineInspectionDate: z.coerce.date().optional(),
  routineInspectionFeedback: z.string().optional(),
  propertyCleanAndWellMaintained: YES_NO_NA.optional(),
  routineInspectionsComments: z.string().optional(),
  tenantCaredForProperty: YES_NO_NA,
  tenantCaredForPropertyComments: z.string().optional(),
  gardensKeptNeat: YES_NO_NA,
  complaintsReceived: YES_NO_NA,
  complaintsReceivedComments: z.string().optional(),
  tenantKeptPets: YES_NO_NA,
  petDetails: z.string().optional(),
  petsCausedDamage: YES_NO_NA.optional(),
  fullBondRefundReceived: YES_NO_NA,
  whyNotListDeductions: z.string().optional(),
  vacateInspectionDone: YES_NO_NA,
  propertyConditionOnVacate: z.string().optional(),
  tenantCooperative: YES_NO_NA,
  tenantCooperativeComments: z.string().optional(),
  tenantRating: z.coerce.number().int().min(1).max(5),
  wouldRentAgain: YES_NO_NA,
  wouldRentAgainWhyNot: z.string().optional(),
  tenantLeavingReason: z.string().min(1),
  listedAsDefaulter: z.string().min(1),
  socialMediaNegativePosts: YES_NO_NA,
  socialMediaNegativePostsExample: z.string().optional(),
  additionalComments: z.string().optional(),
});

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB, matches the live site's limit

async function uploadIfPresent(file: File | null, token: string, label: string) {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error(`${label}: unsupported file type — use PDF, JPG, PNG, DOC or DOCX`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${label}: file is too large (max 2MB)`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = buildImageKey("tenancy-references", token, file.name);
  return uploadFileDirectly(key, buffer, file.type);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  await dbConnect();
  const reference = await PropertyReference.findOne({ token });
  if (!reference) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reference.status !== "pending") {
    return NextResponse.json({ error: "This reference check is already closed." }, { status: 409 });
  }

  const formData = await request.formData();
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string")
  );
  const parsed = FieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let tenantLedgerUrl: string | undefined;
  let inspectionReportUrl: string | undefined;
  try {
    tenantLedgerUrl = await uploadIfPresent(formData.get("tenantLedger") as File | null, token, "Tenant Ledger");
    inspectionReportUrl = await uploadIfPresent(
      formData.get("inspectionReport") as File | null,
      token,
      "Inspection Report"
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "File upload failed" },
      { status: 400 }
    );
  }
  if (!tenantLedgerUrl) {
    return NextResponse.json({ error: "Tenant Ledger is required" }, { status: 400 });
  }

  reference.status = "completed";
  reference.submittedAt = new Date();
  reference.response = { ...parsed.data, tenantLedgerUrl, inspectionReportUrl };
  await reference.save();

  await notifyReferenceOutcome(reference, "submitted");

  return NextResponse.json({ ok: true });
}
