import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { uploadFileDirectly, buildImageKey } from "@/lib/s3";
import { notifyNewTenancyApplication } from "@/lib/notifyTenancyApplication";

const YES_NO = z.enum(["Yes", "No"]);

// Mirrors TenancyApplication.ts's schema. Same trade-off as the property
// reference submit route: conditional sub-fields (e.g. otherName only
// makes sense if knownByOtherName is "Yes") are left optional here rather
// than re-deriving ~8 conditional-required rules server-side — the public
// form already enforces/shows them client-side to match, and this is a
// straightforward lead-style submission, not adversarial input.
const FieldsSchema = z.object({
  propertyAddress: z.string().min(1),
  propertySlug: z.string().optional(),
  commencementDate: z.coerce.date().optional(),
  rentPerWeek: z.string().optional(),
  rentPerMonth: z.string().optional(),
  bond: z.string().optional(),
  leaseTermYears: z.string().optional(),
  leaseTermMonths: z.string().optional(),
  occupantsAdults: z.string().optional(),
  occupantsChildrenAges: z.string().optional(),

  title: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  knownByOtherName: YES_NO,
  otherName: z.string().optional(),
  hasDependents: YES_NO,
  dependentsAges: z.string().optional(),
  totalApplicants: z.string().optional(),
  dependentsNames: z.string().optional(),
  dateOfBirth: z.coerce.date(),
  email: z.string().email(),
  mobilePhone: z.string().min(1),
  homePhone: z.string().optional(),
  workPhone: z.string().optional(),
  driversLicenceNumber: z.string().optional(),
  driversLicenceExpiry: z.coerce.date().optional(),
  vehicleRegistration: z.string().optional(),
  vehicleRegistrationState: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.coerce.date().optional(),
  passportCountry: z.string().optional(),
  pensionMedicareNumber: z.string().optional(),
  pensionType: z.string().optional(),

  currentAddress: z.string().min(1),
  currentPostcode: z.string().optional(),
  currentLengthOfStay: z.string().optional(),
  currentRent: z.string().optional(),
  currentReasonForLeaving: z.string().optional(),
  currentBondRefundedInFull: YES_NO.optional(),
  currentBondRefundReason: z.string().optional(),
  currentLandlordAgent: z.string().optional(),
  currentLandlordContact: z.string().optional(),

  previousAddress: z.string().optional(),
  previousPostcode: z.string().optional(),
  previousLengthOfStay: z.string().optional(),
  previousRent: z.string().optional(),
  previousReasonForLeaving: z.string().optional(),
  previousBondRefundedInFull: YES_NO.optional(),
  previousBondRefundReason: z.string().optional(),
  previousLandlordAgent: z.string().optional(),
  previousLandlordContact: z.string().optional(),

  presentOccupation: z.string().optional(),
  natureOfEmployment: z.enum(["Full Time", "Part Time", "Casual"]).optional(),
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  employerContactName: z.string().optional(),
  employerPhone: z.string().optional(),
  lengthOfEmployment: z.string().optional(),
  weeklyIncome: z.string().optional(),

  nextOfKinLastName: z.string().optional(),
  nextOfKinGivenName: z.string().optional(),
  nextOfKinHomeNumber: z.string().optional(),
  nextOfKinMobileNumber: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),

  reference1LastName: z.string().optional(),
  reference1GivenName: z.string().optional(),
  reference1HomeNumber: z.string().optional(),
  reference1MobileNumber: z.string().optional(),
  reference1Relationship: z.string().optional(),
  reference1Address: z.string().optional(),
  reference2LastName: z.string().optional(),
  reference2GivenName: z.string().optional(),
  reference2HomeNumber: z.string().optional(),
  reference2MobileNumber: z.string().optional(),
  reference2Relationship: z.string().optional(),
  reference2Address: z.string().optional(),

  selfEmployed: z.coerce.boolean().optional(),
  businessName: z.string().optional(),
  selfEmployedDuration: z.string().optional(),
  abn: z.string().optional(),
  businessAddress: z.string().optional(),
  accountantName: z.string().optional(),
  accountantPhone: z.string().optional(),

  isStudent: z.coerce.boolean().optional(),
  studentIdNumber: z.string().optional(),
  overseasStudent: YES_NO.optional(),
  visaExpiry: z.coerce.date().optional(),

  everEvicted: YES_NO,
  reasonAffectingRentAbility: YES_NO,
  lastBondRefundedInFull: YES_NO,
  inDebtToAgent: YES_NO,
  bondDeductionsOrDebtExplanation: z.string().optional(),

  consentOneFormPerApplicant: z.coerce.boolean(),
  consentPrivacyPolicyReceived: z.coerce.boolean(),
  consentBindingApplication: z.coerce.boolean(),

  childrenCountAges: z.string().optional(),
  pets: z.string().optional(),
  vehicleMakeTypeRego: z.string().optional(),
  smoker: YES_NO,

  signatureName: z.string().min(1),
});

const ALLOWED_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB per file — several files expected per application

async function uploadMany(files: File[], applicationId: string, label: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      throw new Error(`${label}: unsupported file type — use PDF, JPG or PNG`);
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`${label}: a file is too large (max 5MB each)`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildImageKey("tenancy-applications", applicationId, file.name);
    urls.push(await uploadFileDirectly(key, buffer, file.type));
  }
  return urls;
}

export async function POST(request: Request) {
  await dbConnect();

  const formData = await request.formData();
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  // A left-blank optional field (a DateInput with nothing typed in, or a
  // <select> still on its placeholder option) submits as "" — Zod's
  // `.optional()` only treats an ABSENT key as "not provided", not an
  // empty string, so `z.coerce.date().optional()` was aggressively
  // coercing "" into an Invalid Date and `z.enum([...]).optional()` was
  // rejecting "" as not matching any option. Stripping empty strings
  // before validation makes "left blank" and "not sent at all" behave
  // identically, which is what every optional field here actually means.
  for (const key of Object.keys(raw)) {
    if (raw[key] === "") delete raw[key];
  }
  const parsed = FieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const idDocumentsProvided = formData.getAll("idDocumentsProvided").filter((v): v is string => typeof v === "string");

  // A stable id to namespace this application's uploaded files under,
  // generated before the DB write so file keys don't depend on the
  // eventual Mongo _id (simpler than a two-step "save, then re-key
  // uploads" dance).
  const uploadId = randomUUID();

  let idDocumentUrls: string[] = [];
  let proofOfIncomeUrls: string[] = [];
  let rentalHistoryUrls: string[] = [];
  try {
    idDocumentUrls = await uploadMany(formData.getAll("idDocuments") as File[], uploadId, "ID Documents");
    proofOfIncomeUrls = await uploadMany(formData.getAll("proofOfIncome") as File[], uploadId, "Proof of Income");
    rentalHistoryUrls = await uploadMany(formData.getAll("rentalHistory") as File[], uploadId, "Rental History");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "File upload failed" }, { status: 400 });
  }
  if (idDocumentUrls.length === 0) {
    return NextResponse.json({ error: "At least one ID document is required" }, { status: 400 });
  }
  if (proofOfIncomeUrls.length === 0) {
    return NextResponse.json({ error: "At least one proof of income document is required" }, { status: 400 });
  }

  const application = new TenancyApplication({
    ...parsed.data,
    idDocumentsProvided,
    idDocumentUrls,
    proofOfIncomeUrls,
    rentalHistoryUrls,
    signedAt: new Date(),
  });
  await application.save();

  await notifyNewTenancyApplication(application);

  return NextResponse.json({ ok: true });
}
