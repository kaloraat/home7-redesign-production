"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY, SITE_URL } from "@/lib/constants";
import DateInput from "@/components/DateInput";

type YesNoNA = "Yes" | "No" | "Not Applicable" | "";

interface Props {
  token: string;
  tenantName: string;
  tenantAddress: string;
  requestedAt: string;
  // Captured up front by Home7 staff when the request was created (same
  // fields the old Laravel admin form collected) — pre-filled here so the
  // previous agent filling this out isn't re-typing their own details,
  // matching propertyReferenceAgentForm.blade.php's `old('agent_name',
  // $reference->agent_name ?? '')` pattern.
  agentName: string;
  jobPosition?: string;
  agencyName: string;
  agentEmail: string;
}

const YES_NO_NA_OPTIONS = ["Yes", "No", "Not Applicable"] as const;

/** Clickable pill options standing in for the live site's radio buttons —
 * same pattern as AppraisalForm.tsx's PillGroup. Kept local rather than
 * shared since this form's needs (typed to YesNoNA specifically) are
 * narrower than that one's generic string options. */
function YesNoPills({
  value,
  onChange,
  options = YES_NO_NA_OPTIONS,
}: {
  value: YesNoNA;
  onChange: (v: YesNoNA) => void;
  options?: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt as YesNoNA)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors cursor-pointer ${
            value === opt
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-slate-600 border-slate-300 hover:border-brand-gold-dark"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";
const labelClass = "block text-sm font-medium text-brand-navy mb-1.5";

export function TenancyReferenceForm({
  token,
  tenantName,
  tenantAddress,
  requestedAt,
  agentName,
  jobPosition,
  agencyName,
  agentEmail,
}: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<"intro" | "form" | "declined">("intro");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Only the fields that drive a conditional section need to be controlled
  // state — everything else is read straight out of FormData on submit.
  const [rentPaidOnTime, setRentPaidOnTime] = useState<YesNoNA>("");
  const [rentDefaultNoticeIssued, setRentDefaultNoticeIssued] = useState<YesNoNA>("");
  const [noticesIssuedByOffice, setNoticesIssuedByOffice] = useState<YesNoNA>("");
  const [tenantServedNotices, setTenantServedNotices] = useState<YesNoNA>("");
  const [routineInspectionsConducted, setRoutineInspectionsConducted] = useState<YesNoNA>("");
  const [complaintsReceived, setComplaintsReceived] = useState<YesNoNA>("");
  const [tenantKeptPets, setTenantKeptPets] = useState<YesNoNA>("");
  const [fullBondRefundReceived, setFullBondRefundReceived] = useState<YesNoNA>("");
  const [vacateInspectionDone, setVacateInspectionDone] = useState<YesNoNA>("");
  const [wouldRentAgain, setWouldRentAgain] = useState<YesNoNA>("");
  const [socialMediaNegativePosts, setSocialMediaNegativePosts] = useState<YesNoNA>("");
  // A handful of top-level pills also need controlled state simply because
  // a hidden input has to carry their value into FormData (no native name
  // attribute on a <button>).
  const [leaseholder, setLeaseholder] = useState<YesNoNA>("");
  const [terminatedByOffice, setTerminatedByOffice] = useState<YesNoNA>("");
  const [tenantCared, setTenantCared] = useState<YesNoNA>("");
  const [gardensNeat, setGardensNeat] = useState<YesNoNA>("");
  const [tenantCooperative, setTenantCooperative] = useState<YesNoNA>("");

  async function handleDecline(reason: "call_me_instead" | "unknown_contact") {
    setStatus("submitting");
    try {
      const res = await fetch(`/api/property-reference-request/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error();
      setScreen("declined");
    } catch {
      setErrorMsg("Something went wrong — please try again.");
      setStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/property-reference-request/${token}/submit`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "Submission failed");
      }
      router.push("/");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStatus("error");
    }
  }

  if (screen === "declined") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-xl text-brand-navy">Thank you</p>
        <p className="mt-2 text-slate-500">We&apos;ve recorded your response.</p>
      </div>
    );
  }

  if (screen === "intro") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        {/* Matches the old Laravel site's intro sentence — present there,
            missing from this rebuild's first pass, restored per the user's
            direct comparison request. Uses COMPANY.address (the correct
            current address) rather than copying the old site's own slightly
            wrong "Suite – 7" text verbatim. */}
        <p className="mb-4 text-sm text-slate-600">
          Please complete this property reference request from Home7 Real Estate | {COMPANY.address}:
        </p>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 grid gap-2">
          <div>
            <p className="text-xs text-slate-400">Applicant Name</p>
            <p className="text-sm font-medium text-slate-900">{tenantName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Address</p>
            <p className="text-sm font-medium text-slate-900">{tenantAddress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date Requested</p>
            <p className="text-sm font-medium text-slate-900">{requestedAt}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          The information you provide will be used in assessing {tenantName}&apos;s rental
          application. Your response is only visible to Home7 staff, not the applicant.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen("form")}
            className="bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition cursor-pointer"
          >
            Start Reference
          </button>
          <button
            type="button"
            disabled={status === "submitting"}
            onClick={() => handleDecline("call_me_instead")}
            className="text-sm text-brand-navy underline hover:no-underline cursor-pointer disabled:opacity-50"
          >
            Call me instead
          </button>
          <button
            type="button"
            disabled={status === "submitting"}
            onClick={() => handleDecline("unknown_contact")}
            className="text-sm text-slate-500 underline hover:no-underline cursor-pointer disabled:opacity-50"
          >
            I don&apos;t know {tenantName}
          </button>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </div>

        {/* Matches the old Laravel site's "requested by" footer — present
            there, missing from this rebuild's first pass. Gives the agent
            filling this out somewhere to go if they have a question about
            the request itself, rather than no contact info at all. */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500 space-y-1">
          <p>
            This reference is requested by: <span className="text-slate-700">Home7 Real Estate | {COMPANY.address}</span>
          </p>
          <p>
            From: <span className="text-slate-700">Home7 Real Estate</span>
          </p>
          <p>
            Email: <a href={`mailto:${COMPANY.email}`} className="text-brand-gold-dark hover:underline">{COMPANY.email}</a>
          </p>
          <p>
            Phone: <a href={`tel:${COMPANY.phone}`} className="text-brand-gold-dark hover:underline">{COMPANY.phone}</a>
          </p>
          <p>
            Website: <a href={SITE_URL} className="text-brand-gold-dark hover:underline">{SITE_URL.replace(/^https?:\/\//, "")}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 space-y-8">
      <section className="space-y-4">
        <p className="text-red-600 text-sm font-medium">Mandatory Questions</p>

        <div>
          <label className={labelClass}>What is your name? *</label>
          <input name="agentName" defaultValue={agentName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>What is your job position? *</label>
          <input name="jobPosition" defaultValue={jobPosition} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            Can you confirm that this tenant is/was a leaseholder or an approved occupant at the
            mentioned property? *
          </label>
          <YesNoPills value={leaseholder} onChange={setLeaseholder} />
          <input type="hidden" name="leaseholderOrApprovedOccupant" value={leaseholder} required />
        </div>
        <div>
          <label className={labelClass}>Name of Real Estate Agency *</label>
          <input name="agencyName" defaultValue={agencyName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email of Agent *</label>
          <input name="agentEmail" type="email" defaultValue={agentEmail} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            What kind of property were/are they renting? (house/apartment/any gardens/old/new) *
          </label>
          <input name="propertyType" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Lease Type *</label>
          <select name="leaseType" required className={inputClass}>
            <option value="">Select…</option>
            <option value="Fixed Term">Fixed Term</option>
            <option value="Periodic">Periodic</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date tenancy agreement commenced *</label>
            <DateInput name="tenancyAgreementCommencedDate" required />
          </div>
          <div>
            <label className={labelClass}>Date tenancy agreement expires *</label>
            <DateInput name="tenancyAgreementExpiresDate" required />
          </div>
        </div>
        <div>
          <label className={labelClass}>Did your office terminate the tenancy? *</label>
          <YesNoPills value={terminatedByOffice} onChange={setTerminatedByOffice} />
          <input type="hidden" name="tenancyTerminatedByOffice" value={terminatedByOffice} required />
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>Can you confirm the weekly rent paid? *</label>
          <input name="weeklyRentPaid" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>When is their rent paid to? *</label>
          <DateInput name="rentPaidTo" required />
        </div>
        <div>
          <label className={labelClass}>Was rent paid on time? *</label>
          <YesNoPills value={rentPaidOnTime} onChange={setRentPaidOnTime} />
          <input type="hidden" name="rentPaidOnTime" value={rentPaidOnTime} required />
          {rentPaidOnTime === "No" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>How often was the rent paid late? *</label>
                <input name="rentPaidLateCount" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max. period of arrears in days *</label>
                <input name="rentLateFrequency" required className={inputClass} />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>During their tenancy was a Rent Default Notice issued? *</label>
          <YesNoPills value={rentDefaultNoticeIssued} onChange={setRentDefaultNoticeIssued} />
          <input type="hidden" name="rentDefaultNoticeIssued" value={rentDefaultNoticeIssued} required />
          {rentDefaultNoticeIssued === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason *</label>
              <input name="rentDefaultNoticeIssuedReason" required className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>Were any Notices ever issued by your office? *</label>
          <YesNoPills value={noticesIssuedByOffice} onChange={setNoticesIssuedByOffice} />
          <input type="hidden" name="noticesIssuedByOffice" value={noticesIssuedByOffice} required />
          {noticesIssuedByOffice === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason *</label>
              <input name="noticesIssuedByOfficeReason" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Has the tenant served any Notices on the landlord? *</label>
          <YesNoPills value={tenantServedNotices} onChange={setTenantServedNotices} />
          <input type="hidden" name="tenantServedNotices" value={tenantServedNotices} required />
          {tenantServedNotices === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason *</label>
              <input name="tenantServedNoticesReason" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Did you carry out periodic/routine inspections? *</label>
          <YesNoPills value={routineInspectionsConducted} onChange={setRoutineInspectionsConducted} />
          <input type="hidden" name="routineInspectionsConducted" value={routineInspectionsConducted} required />
          {routineInspectionsConducted === "Yes" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>When was the last routine inspection conducted? *</label>
                <DateInput name="lastRoutineInspectionDate" required />
              </div>
              <div>
                <label className={labelClass}>How did you find the routine inspections? *</label>
                <input name="routineInspectionFeedback" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Was the property found to be clean, undamaged and well maintained? *</label>
                <select name="propertyCleanAndWellMaintained" required className={inputClass}>
                  <option value="">Select…</option>
                  {YES_NO_NA_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Comments</label>
                <input name="routineInspectionsComments" className={inputClass} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>Did they care for the property? *</label>
          <YesNoPills value={tenantCared} onChange={setTenantCared} />
          <input type="hidden" name="tenantCaredForProperty" value={tenantCared} required />
          <div className="mt-3">
            <label className={labelClass}>Comments</label>
            <input name="tenantCaredForPropertyComments" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Were the gardens kept neat and tidy? *</label>
          <YesNoPills value={gardensNeat} onChange={setGardensNeat} />
          <input type="hidden" name="gardensKeptNeat" value={gardensNeat} required />
        </div>
        <div>
          <label className={labelClass}>Did you receive any complaints during the tenancy? *</label>
          <YesNoPills value={complaintsReceived} onChange={setComplaintsReceived} />
          <input type="hidden" name="complaintsReceived" value={complaintsReceived} required />
          {complaintsReceived === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Comments</label>
              <input name="complaintsReceivedComments" className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Did the tenant keep any pets on the property? *</label>
          <YesNoPills value={tenantKeptPets} onChange={setTenantKeptPets} />
          <input type="hidden" name="tenantKeptPets" value={tenantKeptPets} required />
          {tenantKeptPets === "Yes" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>If yes, what kind/breed, how many, and how was/is the behaviour of the pet/s? *</label>
                <input name="petDetails" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Did the pets cause damage?</label>
                <select name="petsCausedDamage" className={inputClass}>
                  <option value="">Select…</option>
                  {YES_NO_NA_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>Did they/will they receive a full bond refund? *</label>
          <YesNoPills value={fullBondRefundReceived} onChange={setFullBondRefundReceived} />
          <input type="hidden" name="fullBondRefundReceived" value={fullBondRefundReceived} required />
          {fullBondRefundReceived === "No" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Why not? List deductions *</label>
              <input name="whyNotListDeductions" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Has the Vacate Inspection been done? *</label>
          <YesNoPills value={vacateInspectionDone} onChange={setVacateInspectionDone} />
          <input type="hidden" name="vacateInspectionDone" value={vacateInspectionDone} required />
          {vacateInspectionDone === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>What was the condition of the property when they vacated? *</label>
              <input name="propertyConditionOnVacate" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Was/is the tenant co-operative and pleasant to deal with? *</label>
          <YesNoPills value={tenantCooperative} onChange={setTenantCooperative} />
          <input type="hidden" name="tenantCooperative" value={tenantCooperative} required />
          <div className="mt-3">
            <label className={labelClass}>Comments</label>
            <input name="tenantCooperativeComments" className={inputClass} />
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>How would you rate this tenant? 1 (Poor) – 5 (Great) *</label>
          <input name="tenantRating" type="number" min={1} max={5} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Would you rent a property to the tenant again? *</label>
          <YesNoPills value={wouldRentAgain} onChange={setWouldRentAgain} />
          <input type="hidden" name="wouldRentAgain" value={wouldRentAgain} required />
          {wouldRentAgain === "No" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Why not? *</label>
              <input name="wouldRentAgainWhyNot" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>What is/was the reason for the tenant leaving this property? *</label>
          <input name="tenantLeavingReason" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Do you have plans to list or have you listed this person as a defaulter? *</label>
          <input name="listedAsDefaulter" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            Have the tenants been known to post comments on social media that could damage the
            landlord or agent&apos;s reputation? *
          </label>
          <YesNoPills value={socialMediaNegativePosts} onChange={setSocialMediaNegativePosts} />
          <input type="hidden" name="socialMediaNegativePosts" value={socialMediaNegativePosts} required />
          {socialMediaNegativePosts === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Please provide an example *</label>
              <input name="socialMediaNegativePostsExample" required className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <p className="text-red-600 text-sm font-medium">Please provide the following</p>
        <div>
          <label className={labelClass}>Tenant Ledger *</label>
          <input name="tenantLedger" type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Inspection Report</label>
          <input name="inspectionReport" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className={inputClass} />
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <p className="text-slate-400 text-sm font-medium">Non-mandatory</p>
        <div>
          <label className={labelClass}>Additional Comments</label>
          <textarea name="additionalComments" rows={3} className={inputClass} />
        </div>
      </section>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setScreen("intro")}
          className="text-sm text-slate-500 hover:text-brand-navy cursor-pointer"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
        >
          {status === "submitting" ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

export default TenancyReferenceForm;
