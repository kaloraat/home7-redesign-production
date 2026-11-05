import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { getPropertyBySlug } from "@/lib/queries";
import { notifyNewTenancyApplication } from "@/lib/notifyTenancyApplication";
import { submitSchema } from "@/lib/rentalApplication/schema";
import { validateAll } from "@/lib/rentalApplication/validate";
import { personName } from "@/lib/rentalApplication/summary";
import { ALLOWED_UPLOADS, MAX_FILE_BYTES, MAX_FILES_PER_APPLICATION } from "@/lib/rentalApplication/constants";
import type { ApplicationData } from "@/lib/rentalApplication/types";
import { applicationFiles } from "@/lib/rentalApplication/files";
import { copyPrivate, deletePrivate, headPrivate, isPrivateStorageConfigured, readPrivateHead, sniffType } from "@/lib/s3Private";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * Rental application submit (v2 form). Same URL as before so nothing that
 * links here breaks. Steps:
 *  1. rate limit, honeypot and "filled in too fast" checks
 *  2. strict shape check (schema.ts), then the same completeness rules the
 *     form uses (validate.ts)
 *  3. every uploaded file: must belong to this upload session, exist, be
 *     ≤10MB, and its first bytes must really be a PDF/JPG/PNG
 *  4. files move from pending/ to applications/<id>/ in the private bucket
 *  5. save, then email staff a link to the admin page (no attachments)
 * Nothing personal is logged.
 */
const limited = createRateLimiter(5, 10 * 60 * 1000);

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Some answers aren't in the expected format. Please check the form and try again." }, { status: 400 });
  }
  const { data, propertySlug, uploadSession, startedAt, website } = parsed.data;
  const app = data as ApplicationData;

  // Bots: pretend it worked so they learn nothing.
  if (website || Date.now() - startedAt < 8_000) return NextResponse.json({ ok: true });

  // The listing decides the address and rent, never the browser.
  await dbConnect();
  const property = propertySlug ? await getPropertyBySlug(propertySlug) : null;
  const listing = property && property.listingType === "rent" ? property : null;
  const propertyAddress = listing ? `${listing.address}, ${listing.suburb} ${listing.state || "NSW"} ${listing.postcode}` : app.propertyAddress.trim();

  const problems = validateAll(app, !!listing);
  const missing = [...Object.keys(problems.sections), ...(Object.keys(problems.lease).length ? ["lease"] : []), ...(Object.keys(problems.declaration).length ? ["declaration"] : [])];
  if (missing.length) {
    return NextResponse.json({ error: "Some sections are incomplete.", missing }, { status: 400 });
  }

  const files = applicationFiles(app);
  if (files.length > MAX_FILES_PER_APPLICATION) {
    return NextResponse.json({ error: "Too many files attached." }, { status: 400 });
  }
  if (files.length > 0 && !isPrivateStorageConfigured()) {
    return NextResponse.json({ error: "Uploads are unavailable right now. Please call us." }, { status: 503 });
  }

  // Check every file before moving any of them.
  for (const file of files) {
    if (!file.key.startsWith(`pending/${uploadSession}/`)) {
      return NextResponse.json({ error: "A file doesn't belong to this application. Please upload it again." }, { status: 400 });
    }
    const [head, bytes] = await Promise.all([headPrivate(file.key), readPrivateHead(file.key)]);
    const ext = file.key.split(".").pop()!;
    const real = bytes ? sniffType(bytes) : null;
    const expected = ext === "jpeg" ? "jpg" : ext;
    if (!head || head.size === 0 || head.size > MAX_FILE_BYTES || real !== expected) {
      return NextResponse.json({ error: `"${file.name}" couldn't be verified. Please remove it and upload it again (PDF, JPG or PNG, up to 10MB).` }, { status: 400 });
    }
    file.size = head.size;
    file.type = ALLOWED_UPLOADS[ext];
  }

  const doc = new TenancyApplication({ formVersion: 2 });
  const id = String(doc._id);
  try {
    for (const file of files) {
      const finalKey = `applications/${id}/${randomUUID()}.${file.key.split(".").pop()}`;
      await copyPrivate(file.key, finalKey, file.type);
      await deletePrivate(file.key);
      file.key = finalKey;
    }
  } catch {
    console.error("[rental-application] moving uploads failed");
    return NextResponse.json({ error: "We couldn't save your files. Please try again, or call us." }, { status: 500 });
  }

  const a = app.applicant.personal;
  const dob = new Date(Number(a.dobYear), Number(a.dobMonth) - 1, Number(a.dobDay));
  doc.set({
    propertyAddress,
    propertySlug: listing?.slug,
    rentPerWeek: listing?.rentPerWeek ? String(listing.rentPerWeek) : undefined,
    commencementDate: app.lease.startDate ? new Date(app.lease.startDate) : undefined,
    leaseTermMonths: app.lease.termMonths,
    firstName: a.firstName.trim(),
    lastName: a.lastName.trim(),
    dateOfBirth: dob,
    email: a.email.trim(),
    mobilePhone: a.mobile.replace(/\D/g, ""),
    coApplicantName: app.second ? personName(app.second.personal) : undefined,
    signatureName: app.declaration.signature.trim(),
    signedAt: new Date(),
    v2: { ...app, propertyAddress },
  });

  try {
    await doc.save();
  } catch {
    console.error("[rental-application] save failed");
    return NextResponse.json({ error: "We couldn't save your application. Please try again, or call us." }, { status: 500 });
  }

  await notifyNewTenancyApplication(doc);
  return NextResponse.json({ ok: true });
}
