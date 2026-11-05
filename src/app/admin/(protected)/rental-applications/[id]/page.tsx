import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { updateApplicationStatus, deleteApplication } from "@/actions/rentalApplication.actions";
import DeleteButton from "@/components/admin/DeleteButton";
import { applicationView } from "@/lib/rentalApplication/summary";
import type { ApplicationData } from "@/lib/rentalApplication/types";

async function getApplication(id: string) {
  await dbConnect();
  return await TenancyApplication.findById(id).lean();
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{typeof value === "boolean" ? (value ? "Yes" : "No") : value}</p>
    </div>
  );
}

function fmtDate(d?: Date | string) {
  if (!d) return undefined;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString("en-AU");
}

const STATUSES = ["new", "reviewed", "approved", "declined"] as const;

export default async function RentalApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, a] = await Promise.all([auth(), getApplication(id)]);
  if (!a) notFound();
  // Deleting is owner-only — see lib/authz.ts.
  const isOwner = session?.user.role === "owner";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/rental-applications" className="text-sm text-slate-500 hover:text-brand-navy">
        ← Back to Rental Applications
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-brand-navy">
            {a.firstName} {a.lastName}
            {a.coApplicant && ` & ${a.coApplicant.firstName} ${a.coApplicant.lastName}`}
            {!a.coApplicant && a.coApplicantName && ` & ${a.coApplicantName}`}
          </h1>
          <p className="mt-1 text-slate-500">
            {a.propertyAddress} · Submitted {new Date(a.createdAt).toLocaleDateString("en-AU")}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-3">
          {/* Plain <a> to the Route Handler: Content-Disposition: attachment
              makes the browser download it with no client JS. */}
          <a
            href={`/api/admin/rental-applications/${id}/pdf`}
            className="rounded border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition-colors"
          >
            Download PDF
          </a>
          {isOwner && (
            <DeleteButton
              onConfirm={deleteApplication.bind(null, String(a._id))}
              itemLabel="this application"
              requireTypedConfirmation="delete this application"
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <form
            key={s}
            action={async () => {
              "use server";
              await updateApplicationStatus(id, s);
            }}
          >
            <button
              type="submit"
              disabled={a.status === s}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${
                a.status === s
                  ? "bg-brand-navy text-white"
                  : "border border-slate-300 text-slate-600 hover:border-brand-gold-dark"
              }`}
            >
              {s === "new" ? "New" : s === "reviewed" ? "Reviewed" : s === "approved" ? "Approved" : "Declined"}
            </button>
          </form>
        ))}
      </div>

      {a.formVersion === 2 && a.v2 ? (
        <V2Details id={id} app={a.v2 as ApplicationData} propertyAddress={a.propertyAddress} rentPerWeek={a.rentPerWeek} />
      ) : (
        <>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Property &amp; Tenancy</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Property" value={a.propertyAddress} />
          <Field label="Commencement date" value={fmtDate(a.commencementDate)} />
          <Field label="Rent per week" value={a.rentPerWeek} />
          <Field label="Rent per month" value={a.rentPerMonth} />
          <Field label="Bond" value={a.bond} />
          <Field label="Lease term" value={[a.leaseTermYears && `${a.leaseTermYears}y`, a.leaseTermMonths && `${a.leaseTermMonths}m`].filter(Boolean).join(" ")} />
          <Field label="Adults occupying" value={a.occupantsAdults} />
          <Field label="Children & ages" value={a.occupantsChildrenAges} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">
          {a.coApplicant ? "Applicant 1 Details" : "Applicant Details"}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title" value={a.title} />
          <Field label="Full name" value={`${a.firstName} ${a.lastName}`} />
          <Field label="Known by other name" value={a.knownByOtherName} />
          <Field label="Other name" value={a.otherName} />
          <Field label="Has dependents" value={a.hasDependents} />
          <Field label="Dependents' ages" value={a.dependentsAges} />
          <Field label="Dependents' names" value={a.dependentsNames} />
          <Field label="Total applicants" value={a.totalApplicants} />
          <Field label="Date of birth" value={fmtDate(a.dateOfBirth)} />
          <Field label="Email" value={a.email} />
          <Field label="Mobile" value={a.mobilePhone} />
          <Field label="Home phone" value={a.homePhone} />
          <Field label="Work phone" value={a.workPhone} />
          <Field label="Driver's licence" value={a.driversLicenceNumber} />
          <Field label="Licence expiry" value={fmtDate(a.driversLicenceExpiry)} />
          <Field label="Vehicle registration" value={a.vehicleRegistration} />
          <Field label="Registration state" value={a.vehicleRegistrationState} />
          <Field label="Passport number" value={a.passportNumber} />
          <Field label="Passport expiry" value={fmtDate(a.passportExpiry)} />
          <Field label="Passport country" value={a.passportCountry} />
          <Field label="Pension/Medicare no." value={a.pensionMedicareNumber} />
          <Field label="Pension type" value={a.pensionType} />
        </div>
      </div>

      {a.coApplicant && (
        <div className="mt-6 rounded-lg border-2 border-brand-gold/60 bg-white p-6">
          <p className="text-sm font-medium text-slate-900 mb-3">Applicant 2 Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Relationship to applicant 1" value={a.coApplicant.relationshipToApplicant} />
            <Field label="Title" value={a.coApplicant.title} />
            <Field label="Full name" value={`${a.coApplicant.firstName} ${a.coApplicant.lastName}`} />
            <Field label="Date of birth" value={fmtDate(a.coApplicant.dateOfBirth)} />
            <Field label="Email" value={a.coApplicant.email} />
            <Field label="Mobile" value={a.coApplicant.mobilePhone} />
            <Field label="Work phone" value={a.coApplicant.workPhone} />
            <Field label="Driver's licence" value={a.coApplicant.driversLicenceNumber} />
            <Field label="Licence expiry" value={fmtDate(a.coApplicant.driversLicenceExpiry)} />
            <Field label="Passport number" value={a.coApplicant.passportNumber} />
            <Field label="Passport expiry" value={fmtDate(a.coApplicant.passportExpiry)} />
            <Field label="Passport country" value={a.coApplicant.passportCountry} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <Field label="Present occupation" value={a.coApplicant.presentOccupation} />
            <Field label="Nature of employment" value={a.coApplicant.natureOfEmployment} />
            <Field label="Employer" value={a.coApplicant.employerName} />
            <Field label="Employer phone" value={a.coApplicant.employerPhone} />
            <Field label="Length of employment" value={a.coApplicant.lengthOfEmployment} />
            <Field label="Weekly income" value={a.coApplicant.weeklyIncome} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {(
              [
                ["ID Documents", a.coApplicant.idDocumentUrls],
                ["Proof of Income", a.coApplicant.proofOfIncomeUrls],
              ] as const
            ).map(([label, urls]) =>
              urls?.length > 0 ? (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <div className="flex flex-wrap gap-3">
                    {urls.map((url: string, i: number) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                        File {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">
          Identification &amp; Documents{a.coApplicant ? " (Applicant 1)" : ""}
        </p>
        {a.idDocumentsProvided?.length > 0 && (
          <p className="text-sm text-slate-600 mb-3">Provided: {a.idDocumentsProvided.join(", ")}</p>
        )}
        <div className="space-y-3">
          {a.idDocumentUrls?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">ID Documents</p>
              <div className="flex flex-wrap gap-3">
                {a.idDocumentUrls.map((url: string, i: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                    File {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          {a.proofOfIncomeUrls?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Proof of Income</p>
              <div className="flex flex-wrap gap-3">
                {a.proofOfIncomeUrls.map((url: string, i: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                    File {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          {a.rentalHistoryUrls?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Rental History</p>
              <div className="flex flex-wrap gap-3">
                {a.rentalHistoryUrls.map((url: string, i: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                    File {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Current Address</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address" value={a.currentAddress} />
          <Field label="Post code" value={a.currentPostcode} />
          <Field label="Length of stay" value={a.currentLengthOfStay} />
          <Field label="Rent" value={a.currentRent} />
          <Field label="Reason for leaving" value={a.currentReasonForLeaving} />
          <Field label="Bond refunded in full" value={a.currentBondRefundedInFull} />
          <Field label="Bond refund reason" value={a.currentBondRefundReason} />
          <Field label="Landlord/agent" value={a.currentLandlordAgent} />
          <Field label="Contact number" value={a.currentLandlordContact} />
        </div>
      </div>

      {a.previousAddress && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-900 mb-3">Previous Address</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Address" value={a.previousAddress} />
            <Field label="Post code" value={a.previousPostcode} />
            <Field label="Length of stay" value={a.previousLengthOfStay} />
            <Field label="Rent" value={a.previousRent} />
            <Field label="Reason for leaving" value={a.previousReasonForLeaving} />
            <Field label="Bond refunded in full" value={a.previousBondRefundedInFull} />
            <Field label="Bond refund reason" value={a.previousBondRefundReason} />
            <Field label="Landlord/agent" value={a.previousLandlordAgent} />
            <Field label="Contact number" value={a.previousLandlordContact} />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">
          Employment{a.coApplicant ? " (Applicant 1)" : ""}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Present occupation" value={a.presentOccupation} />
          <Field label="Nature of employment" value={a.natureOfEmployment} />
          <Field label="Employer" value={a.employerName} />
          <Field label="Employer address" value={a.employerAddress} />
          <Field label="Employer contact" value={a.employerContactName} />
          <Field label="Employer phone" value={a.employerPhone} />
          <Field label="Length of employment" value={a.lengthOfEmployment} />
          <Field label="Weekly income" value={a.weeklyIncome} />
        </div>
        {a.selfEmployed && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <Field label="Business name" value={a.businessName} />
            <Field label="Self-employed duration" value={a.selfEmployedDuration} />
            <Field label="ABN" value={a.abn} />
            <Field label="Business address" value={a.businessAddress} />
            <Field label="Accountant" value={a.accountantName} />
            <Field label="Accountant phone" value={a.accountantPhone} />
          </div>
        )}
        {a.isStudent && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <Field label="Student ID number" value={a.studentIdNumber} />
            <Field label="Overseas student" value={a.overseasStudent} />
            <Field label="Visa expiry" value={fmtDate(a.visaExpiry)} />
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Next of Kin</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={[a.nextOfKinGivenName, a.nextOfKinLastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.nextOfKinRelationship} />
          <Field label="Home number" value={a.nextOfKinHomeNumber} />
          <Field label="Work/mobile number" value={a.nextOfKinMobileNumber} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Personal References</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reference 1" value={[a.reference1GivenName, a.reference1LastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.reference1Relationship} />
          <Field label="Home number" value={a.reference1HomeNumber} />
          <Field label="Mobile number" value={a.reference1MobileNumber} />
          <Field label="Address" value={a.reference1Address} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
          <Field label="Reference 2" value={[a.reference2GivenName, a.reference2LastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.reference2Relationship} />
          <Field label="Home number" value={a.reference2HomeNumber} />
          <Field label="Mobile number" value={a.reference2MobileNumber} />
          <Field label="Address" value={a.reference2Address} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Disclosures</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ever evicted" value={a.everEvicted} />
          <Field label="Reason may affect rent ability" value={a.reasonAffectingRentAbility} />
          <Field label="Last bond refunded in full" value={a.lastBondRefundedInFull} />
          <Field label="In debt to another agent" value={a.inDebtToAgent} />
          <Field label="Explanation" value={a.bondDeductionsOrDebtExplanation} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Other Information</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Children" value={a.childrenCountAges} />
          <Field label="Pets" value={a.pets} />
          <Field label="Vehicle" value={a.vehicleMakeTypeRego} />
          <Field label="Smoker" value={a.smoker} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Signature</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label={a.coApplicant ? "Signed by applicant 1" : "Signed by"} value={a.signatureName} />
          {a.coApplicant && <Field label="Signed by applicant 2" value={a.coApplicant.signatureName} />}
          <Field label="Signed at" value={fmtDate(a.signedAt)} />
        </div>
      </div>
        </>
      )}
    </div>
  );
}

/** v2 (hub form) applications: shared view model, files via the staff-only signed-link route. */
function V2Details({ id, app, propertyAddress, rentPerWeek }: { id: string; app: ApplicationData; propertyAddress: string; rentPerWeek?: string }) {
  const view = applicationView(app, { propertyAddress, rentPerWeek: rentPerWeek ? Number(rentPerWeek) : null });
  return (
    <>
      {view.groups.map((g) => (
        <div key={g.title} className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-900 mb-3">{g.title}</p>
          <div className="grid grid-cols-2 gap-4">
            {g.fields.map((f) => (
              <div key={f.label} className={f.value.length > 60 ? "col-span-2" : undefined}>
                <Field label={f.label} value={f.value} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-1">Uploaded documents</p>
        <p className="mb-3 text-xs text-slate-400">Stored privately. Each link opens a copy that expires after 5 minutes.</p>
        {view.files.length === 0 ? (
          <p className="text-sm text-slate-500">No files uploaded.</p>
        ) : (
          <div className="space-y-3">
            {view.files.map((g) => (
              <div key={g.label}>
                <p className="text-xs text-slate-400">{g.label}</p>
                <div className="flex flex-wrap gap-3">
                  {g.files.map((f) => (
                    <a
                      key={f.key}
                      href={`/api/admin/rental-applications/${id}/file?key=${encodeURIComponent(f.key)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-gold-dark hover:underline text-sm"
                    >
                      {f.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
