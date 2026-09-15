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

function humanizeFieldName(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

/** The submit route returns `{ error: "some string" }` for most failures,
 * but `{ error: zodError.flatten() }` — an object, not a string — when the
 * form data fails Zod validation. The old logic only handled the string
 * case, so a validation failure (the actual, useful reason a submission
 * was rejected) silently collapsed into a bare "Submission failed" with no
 * way to tell what was wrong — found live when a real test submission
 * failed with zero indication of which field. This surfaces the first
 * real field error instead. */
function extractErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as { error?: unknown };
    if (typeof b.error === "string") return b.error;
    if (b.error && typeof b.error === "object") {
      const flat = b.error as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      const firstField = flat.fieldErrors
        ? Object.entries(flat.fieldErrors).find(([, msgs]) => msgs?.length)
        : undefined;
      if (firstField) {
        const [field, msgs] = firstField;
        return `${humanizeFieldName(field)}: ${msgs[0]}`;
      }
      if (flat.formErrors?.length) return flat.formErrors[0];
    }
  }
  return "Submission failed — please check the form and try again.";
}

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
  // Which required Yes/No/N-A question (by its FormData field name) failed
  // the pre-submit check below, if any — drives the red ring around that
  // specific question so it's actually findable in a form this long, not
  // just named in a message at the bottom. Cleared at the top of every
  // submit attempt and only set again if that attempt still finds a gap.
  const [invalidField, setInvalidField] = useState<string | null>(null);

  function fieldHighlightClass(name: string) {
    return invalidField === name ? "rounded-lg ring-2 ring-red-400 ring-offset-2 -mx-2 px-2 py-1" : "";
  }

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
    setErrorMsg("");
    setInvalidField(null);

    // Every other required field here is a real (visible) input, so the
    // browser's own constraint validation already blocked submission
    // before this handler could even run if one of those were empty. The
    // one gap: the HTML spec explicitly exempts type="hidden" inputs from
    // `required` validation — and every one of these 16 Yes/No/Not
    // Applicable questions is backed by exactly that (a hidden input
    // carries the pill's value into FormData, since a <button> has no
    // native form value). So it's entirely possible to click through the
    // form skipping one of these with nothing visibly stopping you — found
    // live, where it silently reached the server and came back as a bare
    // "Submission failed" with no indication which question. This check
    // catches it here instead, names the exact question, and highlights it.
    const requiredPills: Array<{ name: string; value: YesNoNA; label: string }> = [
      { name: "leaseholderOrApprovedOccupant", value: leaseholder, label: "Can you confirm that this tenant is/was a leaseholder or an approved occupant at the mentioned property?" },
      { name: "tenancyTerminatedByOffice", value: terminatedByOffice, label: "Did your office terminate the tenancy?" },
      { name: "rentPaidOnTime", value: rentPaidOnTime, label: "Was rent paid on time?" },
      { name: "rentDefaultNoticeIssued", value: rentDefaultNoticeIssued, label: "During their tenancy was a Rent Default Notice issued?" },
      { name: "noticesIssuedByOffice", value: noticesIssuedByOffice, label: "Were any Notices ever issued by your office?" },
      { name: "tenantServedNotices", value: tenantServedNotices, label: "Has the tenant served any Notices on the landlord?" },
      { name: "routineInspectionsConducted", value: routineInspectionsConducted, label: "Did you carry out periodic/routine inspections?" },
      { name: "tenantCaredForProperty", value: tenantCared, label: "Did they care for the property?" },
      { name: "gardensKeptNeat", value: gardensNeat, label: "Were the gardens kept neat and tidy?" },
      { name: "complaintsReceived", value: complaintsReceived, label: "Did you receive any complaints during the tenancy?" },
      { name: "tenantKeptPets", value: tenantKeptPets, label: "Did the tenant keep any pets on the property?" },
      { name: "fullBondRefundReceived", value: fullBondRefundReceived, label: "Did they/will they receive a full bond refund?" },
      { name: "vacateInspectionDone", value: vacateInspectionDone, label: "Has the Vacate Inspection been done?" },
      { name: "tenantCooperative", value: tenantCooperative, label: "Was/is the tenant co-operative and pleasant to deal with?" },
      { name: "wouldRentAgain", value: wouldRentAgain, label: "Would you rent a property to the tenant again?" },
      { name: "socialMediaNegativePosts", value: socialMediaNegativePosts, label: "Have the tenants been known to post comments on social media that could damage the landlord or agent's reputation?" },
    ];
    const unanswered = requiredPills.find((f) => !f.value);
    if (unanswered) {
      setInvalidField(unanswered.name);
      setErrorMsg(`Please answer: "${unanswered.label}"`);
      document.getElementById(`field-${unanswered.name}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setStatus("submitting");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/property-reference-request/${token}/submit`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(extractErrorMessage(body));
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
        {/* "Visible to Agents only" notice — same icon/meaning as the old
            Laravel site's div-note block (folder-lock.svg, stroke #333333,
            reproduced inline below rather than as a static asset since it's
            the only place this icon is used), but split into a proper
            label + sentence: the old site's own copy ran "Visible to
            Agents only" straight into "Please note, ..." with no
            punctuation between them — a genuine grammar bug there, not
            something worth reproducing just to match exactly. */}
        <div className="flex items-start gap-4 pb-4">
          <svg width="28" height="28" viewBox="0 0 50 50" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
            <path d="M41.0715 30.357V17.857C41.0715 16.9098 40.6952 16.0014 40.0254 15.3317C39.3556 14.6619 38.4472 14.2856 37.5 14.2856H21.4286L17.8572 8.92847H8.92861C7.9814 8.92847 7.073 9.30474 6.40322 9.97451C5.73345 10.6443 5.35718 11.5527 5.35718 12.4999V37.4999C5.35718 38.4471 5.73345 39.3555 6.40322 40.0253C7.073 40.6951 7.9814 41.0713 8.92861 41.0713H20.5358" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M26.0205 29.9802V25.3884C26.0191 23.965 26.5466 22.5918 27.5007 21.5355C28.4548 20.4791 29.7673 19.8149 31.1835 19.6719C32.5997 19.5288 34.0185 19.9171 35.1646 20.7613C36.3106 21.6056 37.1021 22.8455 37.3853 24.2404V29.9802M37.3853 29.9802H23.7246C22.4566 29.9802 21.4287 31.0082 21.4287 32.2762V40.3119C21.4287 41.5799 22.4566 42.6078 23.7246 42.6078H39.7961C41.0641 42.6078 42.092 41.5799 42.092 40.3119V32.2762C42.092 31.0082 41.0641 29.9802 39.7961 29.9802H37.3853Z" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-[#333333]">Visible to Agents only</p>
            <p className="text-sm text-slate-700">
              Please note, your reference response is only visible to agents and will{" "}
              <u>not</u> be visible to the applicant.
            </p>
          </div>
        </div>

        {/* Matches the old Laravel site's intro sentence — present there,
            missing from this rebuild's first pass, restored per the user's
            direct comparison request. Uses COMPANY.address (the correct
            current address) rather than copying the old site's own slightly
            wrong "Suite – 7" text verbatim. */}
        <p className="mb-4 text-sm text-slate-600">
          Please complete this property reference request from Home7 Real Estate | {COMPANY.address}:
        </p>

        {/* main-section box: old CSS is background:#F5F5F5; border:1px solid
            #CED4DA; border-radius:5px — same values here via arbitrary
            classes rather than the Tailwind slate-50/200 approximation this
            previously used. */}
        <div className="rounded-[5px] bg-[#F5F5F5] border border-[#CED4DA] p-5 grid gap-3">
          <div>
            <p className="text-sm text-slate-700">Applicant Name</p>
            <p className="text-[16px] font-semibold text-[#333333]">{tenantName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-700">Address</p>
            <p className="text-[16px] font-semibold text-[#333333]">{tenantAddress}</p>
          </div>
          <div>
            <p className="text-sm text-slate-700">Date Requested</p>
            <p className="text-[16px] font-semibold text-[#333333]">{requestedAt}</p>
          </div>
        </div>

        {/* div-info box: old CSS is background: rgba(208,98,41,0.1);
            color: #D06229 — reproduced exactly, with the lightball.svg
            lightbulb icon (fill #D06229) inline. */}
        <div className="mt-5 flex items-center gap-2.5 rounded-[5px] bg-[#D06229]/10 px-6 py-3 text-[#D06229] text-sm">
          <svg width="20" height="23" viewBox="0 0 29 33" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M14.5252 7.11279C9.85449 7.11279 6.03857 10.9287 6.03857 15.5994C6.03857 18.0416 7.10703 20.3922 8.90814 21.9796C10.2513 23.3228 10.1292 26.1924 10.0987 26.2229C10.0987 26.3755 10.1292 26.4976 10.2513 26.6197C10.3429 26.7113 10.4956 26.7724 10.6177 26.7724H18.4021C18.5548 26.7724 18.6769 26.7113 18.7685 26.6197C18.86 26.5282 18.9211 26.3755 18.9211 26.2229C18.9211 26.1924 18.7685 23.3228 20.1117 21.9796C20.1422 21.9491 20.1727 21.9185 20.2032 21.888C21.9738 20.2701 23.0117 17.9805 23.0117 15.5994C23.0117 10.9287 19.1958 7.11279 14.5252 7.11279ZM19.4095 21.1859C19.379 21.2164 19.3179 21.2775 19.3179 21.308C18.1274 22.5901 17.9137 24.6965 17.8832 25.7039H11.1366C11.1061 24.6965 10.8924 22.4986 9.61027 21.1859C7.99232 19.7816 7.04597 17.7363 7.04597 15.5689C7.04597 11.4477 10.3734 8.12019 14.4946 8.12019C18.6158 8.12019 21.9433 11.4477 21.9433 15.5689C21.9433 17.7363 21.0275 19.7816 19.4095 21.1859Z" fill="#D06229" />
            <path d="M14.4946 9.28027C14.2198 9.28027 13.9756 9.52449 13.9756 9.79924C13.9756 10.074 14.2198 10.3182 14.4946 10.3182C17.5778 10.3182 20.0505 12.8214 20.0505 15.8742C20.0505 16.1489 20.2947 16.3931 20.5695 16.3931C20.8442 16.3931 21.0884 16.1489 21.0884 15.8742C21.119 12.2414 18.1578 9.28027 14.4946 9.28027Z" fill="#D06229" />
            <path d="M17.8832 27.3525H11.1061C10.404 27.3525 9.82397 27.9326 9.82397 28.6347C9.82397 29.3368 10.404 29.9168 11.1061 29.9168H17.8526C18.5853 29.8863 19.1653 29.3368 19.1653 28.6347C19.1653 27.9326 18.5853 27.3525 17.8832 27.3525ZM17.8832 28.8484H11.1061C10.984 28.8484 10.8619 28.7568 10.8619 28.6042C10.8619 28.4515 10.9535 28.3599 11.1061 28.3599H17.8526C17.9748 28.3599 18.0969 28.4515 18.0969 28.6042C18.0969 28.7568 18.0053 28.8484 17.8832 28.8484Z" fill="#D06229" />
            <path d="M16.8757 30.4358H12.1134C11.4113 30.4358 10.8313 31.0158 10.8313 31.7179C10.8313 32.4201 11.4113 33.0001 12.1134 33.0001H16.8757C17.5778 33.0001 18.1578 32.4201 18.1578 31.7179C18.1578 30.9853 17.5778 30.4358 16.8757 30.4358ZM16.8757 31.9316H12.1134C11.9913 31.9316 11.8692 31.84 11.8692 31.6874C11.8692 31.5348 11.9608 31.4432 12.1134 31.4432H16.8757C16.9978 31.4432 17.1199 31.5348 17.1199 31.6874C17.1199 31.84 16.9978 31.9316 16.8757 31.9316Z" fill="#D06229" />
            <path d="M14.4946 4.5791C14.7998 4.5791 15.0135 4.33488 15.0135 4.06013V0.518964C15.0135 0.244218 14.7693 0 14.4946 0C14.2198 0 13.9756 0.244218 13.9756 0.518964V4.06013C13.9756 4.33488 14.2198 4.5791 14.4946 4.5791Z" fill="#D06229" />
            <path d="M23.1339 2.62531C22.8897 2.44214 22.5845 2.53372 22.4318 2.74742L20.4781 5.67804C20.2949 5.92225 20.356 6.25805 20.6002 6.41069C20.6918 6.47175 20.7834 6.50227 20.8749 6.50227C21.0581 6.50227 21.2107 6.41069 21.3023 6.25805L23.2561 3.32743C23.4392 3.11374 23.3782 2.77794 23.1339 2.62531Z" fill="#D06229" />
            <path d="M8.29759 6.38012C8.38917 6.38012 8.48075 6.3496 8.57233 6.28854C8.81655 6.13591 8.87761 5.80011 8.72497 5.55589L6.83228 2.59474C6.67964 2.35052 6.34384 2.28947 6.09962 2.4421C5.8554 2.59474 5.79435 2.93054 5.94699 3.17476L7.83968 6.13591C7.96179 6.31907 8.11442 6.38012 8.29759 6.38012Z" fill="#D06229" />
            <path d="M4.60379 9.61615L1.52053 7.93715C1.27631 7.81504 0.940512 7.90663 0.818403 8.15084C0.665767 8.39506 0.757349 8.73086 1.03209 8.85297L4.11535 10.532C4.20693 10.5625 4.26799 10.593 4.35957 10.593C4.54273 10.593 4.7259 10.5014 4.81748 10.3183C4.93959 10.0741 4.84801 9.73826 4.60379 9.61615Z" fill="#D06229" />
            <path d="M28.2014 8.15084C28.0793 7.90663 27.7435 7.81504 27.4992 7.93715L24.3855 9.61615C24.1412 9.73826 24.0497 10.0741 24.1718 10.3183C24.2634 10.5014 24.4465 10.593 24.6297 10.593C24.7213 10.593 24.8128 10.5625 24.8739 10.532L27.9877 8.85297C28.2319 8.73086 28.3235 8.39506 28.2014 8.15084Z" fill="#D06229" />
          </svg>
          <p>
            The information you provide will be used in assessing <span className="font-medium">{tenantName}</span>&apos;s
            application for rental with{" "}
            <span className="font-medium">Home7 Real Estate | {COMPANY.address}</span>
          </p>
        </div>

        {/* Button row: colors match the old site's actual rendered buttons —
            Start Reference is Bootstrap's .btn-info (#0dcaf0, white text via
            .text-light) since .btn-green (also on that element) was never a
            defined class there; "I don't know" is Bootstrap's .bg-light +
            .border-black + .text-dark; "Call Me instead" is a bare,
            unstyled .btn (its own .btn-callMe class was likewise never
            defined) — i.e. plain dark text with the call.svg icon, no
            background or border. */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setScreen("form")}
              className="rounded px-6 py-2.5 font-medium text-white bg-[#0dcaf0] hover:bg-[#31d2f2] transition cursor-pointer"
            >
              Start Reference
            </button>
            <button
              type="button"
              disabled={status === "submitting"}
              onClick={() => handleDecline("call_me_instead")}
              className="inline-flex items-center gap-1.5 rounded px-3 py-2.5 font-semibold text-[#333333] hover:text-brand-navy transition cursor-pointer disabled:opacity-50"
            >
              <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.50893 8.84036C9.50893 8.84036 4.60646 13.0746 1.8435 11.7398C1.8435 11.7398 1.07991 11.1479 1.00596 10.5664C0.932 9.98485 1.5664 9.59482 1.81156 9.46229C2.39849 9.14354 3.00219 8.84654 3.60109 8.5441C3.79035 8.44827 3.99557 8.34021 4.21917 8.39322C4.34853 8.42448 4.48189 8.45846 4.60007 8.51148C5.0217 8.69906 5.36747 8.87576 5.82424 9.05179C5.82424 9.05179 6.29046 8.9228 8.02968 7.4242C9.87751 5.83181 9.62779 5.23973 9.62779 5.23973C9.38743 4.94953 9.16863 4.64573 8.98656 4.32562C8.9083 4.18765 8.8005 4.05444 8.75498 3.90424C8.70867 3.75337 8.80369 3.6453 8.88355 3.51277C9.06082 3.21645 9.25008 2.92557 9.44652 2.63808C9.7851 2.14127 10.1309 1.62338 10.5629 1.17958C10.6084 1.13336 10.7146 0.994718 10.8016 1.00016C11.7623 1.05521 12.7086 1.87281 12.7086 1.87281C14.1955 4.18629 9.50893 8.84036 9.50893 8.84036Z" stroke="#333333" />
              </svg>
              Call Me instead
            </button>
          </div>

          {/* "OR" divider: matches the old .line-seperator (two 125px lines
              flanking centered text) via flex instead of the original's
              absolutely-positioned pseudo-elements — same visual result. */}
          <div className="flex items-center gap-4 my-4 max-w-xs mx-auto">
            <div className="flex-1 h-px bg-[#CED4DA]" />
            <span className="text-sm font-semibold text-slate-500">OR</span>
            <div className="flex-1 h-px bg-[#CED4DA]" />
          </div>

          <button
            type="button"
            disabled={status === "submitting"}
            onClick={() => handleDecline("unknown_contact")}
            className="rounded px-6 py-2.5 font-medium text-[#212529] bg-[#f8f9fa] border border-black hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            I don&apos;t know {tenantName}
          </button>

          {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
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
          <label className={labelClass}>What is your name? <span className="text-red-600">*</span></label>
          <input name="agentName" defaultValue={agentName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>What is your job position? <span className="text-red-600">*</span></label>
          <input name="jobPosition" defaultValue={jobPosition} required className={inputClass} />
        </div>
        <div id="field-leaseholderOrApprovedOccupant" className={fieldHighlightClass("leaseholderOrApprovedOccupant")}>
          <label className={labelClass}>
            Can you confirm that this tenant is/was a leaseholder or an approved occupant at the
            mentioned property? <span className="text-red-600">*</span>
          </label>
          <YesNoPills value={leaseholder} onChange={setLeaseholder} />
          <input type="hidden" name="leaseholderOrApprovedOccupant" value={leaseholder} required />
        </div>
        <div>
          <label className={labelClass}>Name of Real Estate Agency <span className="text-red-600">*</span></label>
          <input name="agencyName" defaultValue={agencyName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email of Agent <span className="text-red-600">*</span></label>
          <input name="agentEmail" type="email" defaultValue={agentEmail} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            What kind of property were/are they renting? (house/apartment/any gardens/old/new){" "}
            <span className="text-red-600">*</span>
          </label>
          <input name="propertyType" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Lease Type <span className="text-red-600">*</span></label>
          <select name="leaseType" required className={inputClass}>
            <option value="">Select…</option>
            <option value="Fixed Term">Fixed Term</option>
            <option value="Periodic">Periodic</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date tenancy agreement commenced <span className="text-red-600">*</span></label>
            <DateInput name="tenancyAgreementCommencedDate" required />
          </div>
          <div>
            <label className={labelClass}>Date tenancy agreement expires <span className="text-red-600">*</span></label>
            <DateInput name="tenancyAgreementExpiresDate" required />
          </div>
        </div>
        <div id="field-tenancyTerminatedByOffice" className={fieldHighlightClass("tenancyTerminatedByOffice")}>
          <label className={labelClass}>Did your office terminate the tenancy? <span className="text-red-600">*</span></label>
          <YesNoPills value={terminatedByOffice} onChange={setTerminatedByOffice} />
          <input type="hidden" name="tenancyTerminatedByOffice" value={terminatedByOffice} required />
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <label className={labelClass}>Can you confirm the weekly rent paid? <span className="text-red-600">*</span></label>
          <input name="weeklyRentPaid" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>When is their rent paid to? <span className="text-red-600">*</span></label>
          <DateInput name="rentPaidTo" required />
        </div>
        <div id="field-rentPaidOnTime" className={fieldHighlightClass("rentPaidOnTime")}>
          <label className={labelClass}>Was rent paid on time? <span className="text-red-600">*</span></label>
          <YesNoPills value={rentPaidOnTime} onChange={setRentPaidOnTime} />
          <input type="hidden" name="rentPaidOnTime" value={rentPaidOnTime} required />
          {rentPaidOnTime === "No" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>How often was the rent paid late? <span className="text-red-600">*</span></label>
                <input name="rentPaidLateCount" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max. period of arrears in days <span className="text-red-600">*</span></label>
                <input name="rentLateFrequency" required className={inputClass} />
              </div>
            </div>
          )}
        </div>
        <div id="field-rentDefaultNoticeIssued" className={fieldHighlightClass("rentDefaultNoticeIssued")}>
          <label className={labelClass}>During their tenancy was a Rent Default Notice issued? <span className="text-red-600">*</span></label>
          <YesNoPills value={rentDefaultNoticeIssued} onChange={setRentDefaultNoticeIssued} />
          <input type="hidden" name="rentDefaultNoticeIssued" value={rentDefaultNoticeIssued} required />
          {rentDefaultNoticeIssued === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason <span className="text-red-600">*</span></label>
              <input name="rentDefaultNoticeIssuedReason" required className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div id="field-noticesIssuedByOffice" className={fieldHighlightClass("noticesIssuedByOffice")}>
          <label className={labelClass}>Were any Notices ever issued by your office? <span className="text-red-600">*</span></label>
          <YesNoPills value={noticesIssuedByOffice} onChange={setNoticesIssuedByOffice} />
          <input type="hidden" name="noticesIssuedByOffice" value={noticesIssuedByOffice} required />
          {noticesIssuedByOffice === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason <span className="text-red-600">*</span></label>
              <input name="noticesIssuedByOfficeReason" required className={inputClass} />
            </div>
          )}
        </div>
        <div id="field-tenantServedNotices" className={fieldHighlightClass("tenantServedNotices")}>
          <label className={labelClass}>Has the tenant served any Notices on the landlord? <span className="text-red-600">*</span></label>
          <YesNoPills value={tenantServedNotices} onChange={setTenantServedNotices} />
          <input type="hidden" name="tenantServedNotices" value={tenantServedNotices} required />
          {tenantServedNotices === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Reason <span className="text-red-600">*</span></label>
              <input name="tenantServedNoticesReason" required className={inputClass} />
            </div>
          )}
        </div>
        <div id="field-routineInspectionsConducted" className={fieldHighlightClass("routineInspectionsConducted")}>
          <label className={labelClass}>Did you carry out periodic/routine inspections? <span className="text-red-600">*</span></label>
          <YesNoPills value={routineInspectionsConducted} onChange={setRoutineInspectionsConducted} />
          <input type="hidden" name="routineInspectionsConducted" value={routineInspectionsConducted} required />
          {routineInspectionsConducted === "Yes" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>When was the last routine inspection conducted? <span className="text-red-600">*</span></label>
                <DateInput name="lastRoutineInspectionDate" required />
              </div>
              <div>
                <label className={labelClass}>How did you find the routine inspections? <span className="text-red-600">*</span></label>
                <input name="routineInspectionFeedback" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Was the property found to be clean, undamaged and well maintained? <span className="text-red-600">*</span></label>
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
        <div id="field-tenantCaredForProperty" className={fieldHighlightClass("tenantCaredForProperty")}>
          <label className={labelClass}>Did they care for the property? <span className="text-red-600">*</span></label>
          <YesNoPills value={tenantCared} onChange={setTenantCared} />
          <input type="hidden" name="tenantCaredForProperty" value={tenantCared} required />
          <div className="mt-3">
            <label className={labelClass}>Comments</label>
            <input name="tenantCaredForPropertyComments" className={inputClass} />
          </div>
        </div>
        <div id="field-gardensKeptNeat" className={fieldHighlightClass("gardensKeptNeat")}>
          <label className={labelClass}>Were the gardens kept neat and tidy? <span className="text-red-600">*</span></label>
          <YesNoPills value={gardensNeat} onChange={setGardensNeat} />
          <input type="hidden" name="gardensKeptNeat" value={gardensNeat} required />
        </div>
        <div id="field-complaintsReceived" className={fieldHighlightClass("complaintsReceived")}>
          <label className={labelClass}>Did you receive any complaints during the tenancy? <span className="text-red-600">*</span></label>
          <YesNoPills value={complaintsReceived} onChange={setComplaintsReceived} />
          <input type="hidden" name="complaintsReceived" value={complaintsReceived} required />
          {complaintsReceived === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Comments</label>
              <input name="complaintsReceivedComments" className={inputClass} />
            </div>
          )}
        </div>
        <div id="field-tenantKeptPets" className={fieldHighlightClass("tenantKeptPets")}>
          <label className={labelClass}>Did the tenant keep any pets on the property? <span className="text-red-600">*</span></label>
          <YesNoPills value={tenantKeptPets} onChange={setTenantKeptPets} />
          <input type="hidden" name="tenantKeptPets" value={tenantKeptPets} required />
          {tenantKeptPets === "Yes" && (
            <div className="mt-3 ml-2 space-y-3">
              <div>
                <label className={labelClass}>If yes, what kind/breed, how many, and how was/is the behaviour of the pet/s? <span className="text-red-600">*</span></label>
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
        <div id="field-fullBondRefundReceived" className={fieldHighlightClass("fullBondRefundReceived")}>
          <label className={labelClass}>Did they/will they receive a full bond refund? <span className="text-red-600">*</span></label>
          <YesNoPills value={fullBondRefundReceived} onChange={setFullBondRefundReceived} />
          <input type="hidden" name="fullBondRefundReceived" value={fullBondRefundReceived} required />
          {fullBondRefundReceived === "No" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Why not? List deductions <span className="text-red-600">*</span></label>
              <input name="whyNotListDeductions" required className={inputClass} />
            </div>
          )}
        </div>
        <div id="field-vacateInspectionDone" className={fieldHighlightClass("vacateInspectionDone")}>
          <label className={labelClass}>Has the Vacate Inspection been done? <span className="text-red-600">*</span></label>
          <YesNoPills value={vacateInspectionDone} onChange={setVacateInspectionDone} />
          <input type="hidden" name="vacateInspectionDone" value={vacateInspectionDone} required />
          {vacateInspectionDone === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>What was the condition of the property when they vacated? <span className="text-red-600">*</span></label>
              <input name="propertyConditionOnVacate" required className={inputClass} />
            </div>
          )}
        </div>
        <div id="field-tenantCooperative" className={fieldHighlightClass("tenantCooperative")}>
          <label className={labelClass}>Was/is the tenant co-operative and pleasant to deal with? <span className="text-red-600">*</span></label>
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
          <label className={labelClass}>How would you rate this tenant? 1 (Poor) – 5 (Great) <span className="text-red-600">*</span></label>
          <input name="tenantRating" type="number" min={1} max={5} required className={inputClass} />
        </div>
        <div id="field-wouldRentAgain" className={fieldHighlightClass("wouldRentAgain")}>
          <label className={labelClass}>Would you rent a property to the tenant again? <span className="text-red-600">*</span></label>
          <YesNoPills value={wouldRentAgain} onChange={setWouldRentAgain} />
          <input type="hidden" name="wouldRentAgain" value={wouldRentAgain} required />
          {wouldRentAgain === "No" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Why not? <span className="text-red-600">*</span></label>
              <input name="wouldRentAgainWhyNot" required className={inputClass} />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>What is/was the reason for the tenant leaving this property? <span className="text-red-600">*</span></label>
          <input name="tenantLeavingReason" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Do you have plans to list or have you listed this person as a defaulter? <span className="text-red-600">*</span></label>
          <input name="listedAsDefaulter" required className={inputClass} />
        </div>
        <div id="field-socialMediaNegativePosts" className={fieldHighlightClass("socialMediaNegativePosts")}>
          <label className={labelClass}>
            Have the tenants been known to post comments on social media that could damage the
            landlord or agent&apos;s reputation? <span className="text-red-600">*</span>
          </label>
          <YesNoPills value={socialMediaNegativePosts} onChange={setSocialMediaNegativePosts} />
          <input type="hidden" name="socialMediaNegativePosts" value={socialMediaNegativePosts} required />
          {socialMediaNegativePosts === "Yes" && (
            <div className="mt-3 ml-2">
              <label className={labelClass}>Please provide an example <span className="text-red-600">*</span></label>
              <input name="socialMediaNegativePostsExample" required className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-slate-100">
        <p className="text-red-600 text-sm font-medium">Please provide the following</p>
        <div>
          <label className={labelClass}>Tenant Ledger <span className="text-red-600">*</span></label>
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
