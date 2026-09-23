import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { deleteReferenceRequest } from "@/actions/tenancyReference.actions";
import DeleteButton from "@/components/admin/DeleteButton";

async function getReference(id: string) {
  await dbConnect();
  return await PropertyReference.findById(id).lean();
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function fmtDate(d?: Date | string) {
  if (!d) return undefined;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString("en-AU");
}

export default async function TenancyCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, reference] = await Promise.all([auth(), getReference(id)]);
  if (!reference) notFound();
  // Deleting is owner-only — see lib/authz.ts.
  const isOwner = session?.user.role === "owner";

  const r = reference.response;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/tenancy-checks" className="text-sm text-slate-500 hover:text-brand-navy">
        ← Back to Tenancy Checks
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-brand-navy">{reference.tenantName}</h1>
          <p className="mt-1 text-slate-500">
            {reference.tenantAddress} · Requested {new Date(reference.createdAt).toLocaleDateString("en-AU")}
          </p>
        </div>
        {/* Plain <a> to the Route Handler, not a client-side fetch — the
            browser's own download handling (Content-Disposition: attachment)
            already does exactly what's needed here with zero JS. */}
        <a
          href={`/api/admin/tenancy-checks/${id}/pdf`}
          className="shrink-0 rounded border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition-colors"
        >
          Download PDF
        </a>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-900 mb-3">Requested from</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Agent" value={reference.agentName} />
          <Field label="Agency" value={reference.agencyName} />
          <Field label="Email" value={reference.agentEmail} />
          <Field label="Job position" value={reference.jobPosition} />
        </div>
      </div>

      {reference.status === "pending" && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-medium text-amber-800">Still pending</p>
          <p className="mt-1 text-sm text-amber-700">
            The previous agent hasn&apos;t responded yet — no reminder/resend feature exists yet, so
            if it&apos;s been a while, follow up with them directly.
          </p>
        </div>
      )}

      {reference.status === "declined" && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-medium text-slate-700">
            {reference.declineReason === "call_me_instead"
              ? "The agent asked to be called instead of filling out the form."
              : "The agent said they don't recognise this tenant."}
          </p>
        </div>
      )}

      {reference.status === "completed" && r && (
        <>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Lease</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Leaseholder / approved occupant" value={r.leaseholderOrApprovedOccupant} />
              <Field label="Property type" value={r.propertyType} />
              <Field label="Lease type" value={r.leaseType} />
              <Field label="Commenced" value={fmtDate(r.tenancyAgreementCommencedDate)} />
              <Field label="Expires" value={fmtDate(r.tenancyAgreementExpiresDate)} />
              <Field label="Terminated by office" value={r.tenancyTerminatedByOffice} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Rent</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weekly rent" value={r.weeklyRentPaid} />
              <Field label="Rent paid to" value={fmtDate(r.rentPaidTo)} />
              <Field label="Paid on time" value={r.rentPaidOnTime} />
              <Field label="How often paid late" value={r.rentPaidLateCount} />
              <Field label="Max arrears (days)" value={r.rentLateFrequency} />
              <Field label="Rent default notice issued" value={r.rentDefaultNoticeIssued} />
              <Field label="Default notice reason" value={r.rentDefaultNoticeIssuedReason} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Notices &amp; inspections</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Notices issued by office" value={r.noticesIssuedByOffice} />
              <Field label="Reason" value={r.noticesIssuedByOfficeReason} />
              <Field label="Tenant served notices" value={r.tenantServedNotices} />
              <Field label="Reason" value={r.tenantServedNoticesReason} />
              <Field label="Routine inspections conducted" value={r.routineInspectionsConducted} />
              <Field label="Last inspection" value={fmtDate(r.lastRoutineInspectionDate)} />
              <Field label="Inspection feedback" value={r.routineInspectionFeedback} />
              <Field label="Property clean & maintained" value={r.propertyCleanAndWellMaintained} />
              <Field label="Comments" value={r.routineInspectionsComments} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Tenant behaviour</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cared for property" value={r.tenantCaredForProperty} />
              <Field label="Comments" value={r.tenantCaredForPropertyComments} />
              <Field label="Gardens kept neat" value={r.gardensKeptNeat} />
              <Field label="Complaints received" value={r.complaintsReceived} />
              <Field label="Comments" value={r.complaintsReceivedComments} />
              <Field label="Kept pets" value={r.tenantKeptPets} />
              <Field label="Pet details" value={r.petDetails} />
              <Field label="Pets caused damage" value={r.petsCausedDamage} />
              <Field label="Cooperative" value={r.tenantCooperative} />
              <Field label="Comments" value={r.tenantCooperativeComments} />
              <Field label="Social media concerns" value={r.socialMediaNegativePosts} />
              <Field label="Example" value={r.socialMediaNegativePostsExample} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Bond &amp; vacate</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full bond refund" value={r.fullBondRefundReceived} />
              <Field label="Deductions" value={r.whyNotListDeductions} />
              <Field label="Vacate inspection done" value={r.vacateInspectionDone} />
              <Field label="Condition on vacate" value={r.propertyConditionOnVacate} />
              <Field label="Reason for leaving" value={r.tenantLeavingReason} />
              <Field label="Listed as defaulter" value={r.listedAsDefaulter} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Overall</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rating (1–5)" value={r.tenantRating} />
              <Field label="Would rent to again" value={r.wouldRentAgain} />
              <Field label="Why not" value={r.wouldRentAgainWhyNot} />
              <Field label="Additional comments" value={r.additionalComments} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-900 mb-3">Documents</p>
            <div className="flex gap-4">
              <a href={r.tenantLedgerUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                Tenant Ledger
              </a>
              {r.inspectionReportUrl && (
                <a href={r.inspectionReportUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold-dark hover:underline text-sm">
                  Inspection Report
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {isOwner && (
        <div className="mt-6">
          <DeleteButton
            onConfirm={deleteReferenceRequest.bind(null, id)}
            itemLabel={`the reference check for ${reference.tenantName}`}
            after={{ mode: "redirect", to: "/admin/tenancy-checks" }}
            className="text-sm text-red-600 hover:underline cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
