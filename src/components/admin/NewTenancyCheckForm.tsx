"use client";

import { useRef, useState } from "react";
import { createReferenceRequest } from "@/actions/tenancyReference.actions";
import SubmitButton from "@/components/admin/SubmitButton";

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

// Drives both the actual inputs and the review-modal summary, so the two
// never drift out of sync with each other.
const FIELDS = [
  { name: "tenantName", label: "Tenant's full name", placeholder: "Tenant's full name", required: true },
  {
    name: "tenantAddress",
    label: "Address of the property they're applying for",
    placeholder: "Address of the property they're applying for",
    required: true,
  },
  { name: "agentName", label: "Agent's name", placeholder: "Agent's name", required: true },
  { name: "jobPosition", label: "Job position", placeholder: "Job position (optional)", required: false },
  { name: "agencyName", label: "Agency name", placeholder: "Agency name", required: true },
  {
    name: "agentEmail",
    label: "Agent's email",
    placeholder: "Agent's email — the request goes here",
    required: true,
    type: "email",
  },
] as const;

/**
 * Two-step create flow: "Review Request" runs the browser's own validation
 * (reportValidity — same required/email checks the inputs already declare)
 * and, if it passes, snapshots the field values into a confirmation modal
 * rather than submitting immediately. Requested after a real mis-send (a
 * test entry to a genuine third-party agency's email address went out for
 * real, since the server action awaits and actually sends the email) — a
 * one-click "did I get everything right?" checkpoint before that happens.
 *
 * The modal renders *inside* the <form> (just positioned fixed/full-screen)
 * rather than as a sibling, so its own Confirm button — a SubmitButton —
 * stays a descendant of the form and can read real pending state via
 * useFormStatus, and so the underlying inputs are still present in the DOM
 * to be picked up by FormData on that real submit.
 */
export function NewTenancyCheckForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewValues, setReviewValues] = useState<Record<string, string> | null>(null);

  function handleReviewClick() {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return; // shows the browser's native "please fill this in" bubble

    const data = new FormData(form);
    const values: Record<string, string> = {};
    for (const f of FIELDS) values[f.name] = String(data.get(f.name) || "").trim();
    setReviewValues(values);
  }

  return (
    <form ref={formRef} action={createReferenceRequest} className="mt-6 space-y-4 max-w-lg">
      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Tenant / Applicant</legend>
        <input name="tenantName" placeholder="Tenant's full name" required className={inputClass} />
        <input
          name="tenantAddress"
          placeholder="Address of the property they're applying for"
          required
          className={inputClass}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-slate-900 mb-1">Previous Agent</legend>
        <input name="agentName" placeholder="Agent's name" required className={inputClass} />
        <input name="jobPosition" placeholder="Job position (optional)" className={inputClass} />
        <input name="agencyName" placeholder="Agency name" required className={inputClass} />
        <input
          name="agentEmail"
          type="email"
          placeholder="Agent's email — the request goes here"
          required
          className={inputClass}
        />
      </fieldset>

      <button
        type="button"
        onClick={handleReviewClick}
        className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold transition hover:brightness-95 active:brightness-90 cursor-pointer"
      >
        Review Request
      </button>

      {reviewValues && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setReviewValues(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-lg text-brand-navy">Review before sending</p>
            <p className="mt-1 text-sm text-slate-500">
              This emails the previous agent directly — double-check the details below.
            </p>

            <dl className="mt-4 space-y-3 text-sm max-h-[50vh] overflow-y-auto">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <dt className="text-slate-400">{f.label}</dt>
                  <dd className="font-medium text-slate-900 break-words">
                    {reviewValues[f.name] || <span className="text-slate-400 italic font-normal">— not provided —</span>}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewValues(null)}
                className="rounded px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
              >
                Edit
              </button>
              <SubmitButton pendingChildren="Sending...">Confirm & Send</SubmitButton>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default NewTenancyCheckForm;
