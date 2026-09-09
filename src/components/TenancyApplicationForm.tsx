"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/DateInput";

type YesNo = "Yes" | "No" | "";

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";
const labelClass = "block text-sm font-medium text-brand-navy mb-1.5";
const sectionHeadingClass = "font-display text-lg text-brand-navy pb-2 border-b border-slate-200";

const ID_DOCUMENT_OPTIONS = [
  "Passport",
  "Current Drivers Licence",
  "Proof of age card",
  "Student ID",
  "Tenancy History Ledger",
  "Previous 4 rent receipts",
  "Bank or Credit Card Statements",
  "Recent Telephone Account",
  "Recent Electricity Account",
  "Recent Gas Account",
  "Medicare Card",
  "Birth Certificate",
];

function YesNoPills({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex gap-2">
      {(["Yes", "No"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
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

function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-4`}>{children}</div>;
}

/**
 * The site's "Residential Tenancy Application" — previously a blank,
 * printable PDF (see TenancyApplication.ts's own comment for the full
 * migration story) that had to be filled by hand and returned separately.
 * This is that same field set as a real, submittable online form. One
 * application per person, matching the source PDF's own instruction — not
 * a household-wide multi-applicant form.
 *
 * `propertyAddress`/`propertySlug` are pre-filled (and, when present,
 * read-only) when this is reached from a specific rental listing's
 * sidebar; blank and editable when reached from the general nav link.
 */
export function TenancyApplicationForm({
  propertyAddress,
  propertySlug,
}: {
  propertyAddress?: string;
  propertySlug?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [knownByOtherName, setKnownByOtherName] = useState<YesNo>("");
  const [hasDependents, setHasDependents] = useState<YesNo>("");
  const [currentBondRefundedInFull, setCurrentBondRefundedInFull] = useState<YesNo>("");
  const [previousBondRefundedInFull, setPreviousBondRefundedInFull] = useState<YesNo>("");
  const [everEvicted, setEverEvicted] = useState<YesNo>("");
  const [reasonAffectingRentAbility, setReasonAffectingRentAbility] = useState<YesNo>("");
  const [lastBondRefundedInFull, setLastBondRefundedInFull] = useState<YesNo>("");
  const [inDebtToAgent, setInDebtToAgent] = useState<YesNo>("");
  const [smoker, setSmoker] = useState<YesNo>("");
  const [overseasStudent, setOverseasStudent] = useState<YesNo>("");
  const [selfEmployed, setSelfEmployed] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [idDocumentsProvided, setIdDocumentsProvided] = useState<string[]>([]);

  function toggleIdDoc(doc: string) {
    setIdDocumentsProvided((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    idDocumentsProvided.forEach((d) => formData.append("idDocumentsProvided", d));

    try {
      const res = await fetch("/api/property-tenant-application-download/submit", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "Submission failed");
      }
      setStatus("success");
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-xl text-brand-navy">Application received</p>
        <p className="mt-2 text-slate-500">
          Thank you — we&apos;ve received your rental application and will be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brand-navy">Residential Tenancy Application</h1>
        <p className="mt-2 text-slate-500">
          One application per person applying for the property. Fields marked{" "}
          <span className="text-red-500">*</span> are required.
        </p>
      </div>

      {/* Property / tenancy preference */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Property You&apos;d Like to Rent</h2>
        <div>
          <label className={labelClass}>
            First Preference — Address of the Property <span className="text-red-500">*</span>
          </label>
          <input
            name="propertyAddress"
            defaultValue={propertyAddress}
            readOnly={!!propertyAddress}
            required
            className={`${inputClass} ${propertyAddress ? "bg-slate-100 text-slate-600" : ""}`}
          />
          {propertySlug && <input type="hidden" name="propertySlug" value={propertySlug} />}
        </div>
        <FieldGrid cols={3}>
          <div>
            <label className={labelClass}>Commencement Date</label>
            <DateInput name="commencementDate" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rent Per Week ($)</label>
            <input name="rentPerWeek" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bond ($)</label>
            <input name="bond" className={inputClass} />
          </div>
        </FieldGrid>
        <FieldGrid cols={3}>
          <div>
            <label className={labelClass}>Lease Term — Years</label>
            <input name="leaseTermYears" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lease Term — Months</label>
            <input name="leaseTermMonths" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Adults Occupying</label>
            <input name="occupantsAdults" className={inputClass} />
          </div>
        </FieldGrid>
        <div>
          <label className={labelClass}>Children &amp; Ages (if any occupants)</label>
          <input name="occupantsChildrenAges" className={inputClass} />
        </div>
      </section>

      {/* Applicant details */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Applicant Details</h2>
        <FieldGrid cols={3}>
          <div>
            <label className={labelClass}>Title</label>
            <input name="title" placeholder="Mr / Mrs / Ms / Dr" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input name="firstName" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Family/Last Name <span className="text-red-500">*</span>
            </label>
            <input name="lastName" required className={inputClass} />
          </div>
        </FieldGrid>

        <div>
          <label className={labelClass}>
            Have you been known by any other name? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={knownByOtherName} onChange={setKnownByOtherName} />
          <input type="hidden" name="knownByOtherName" value={knownByOtherName} required />
          {knownByOtherName === "Yes" && (
            <input name="otherName" placeholder="What other name?" className={`${inputClass} mt-2`} />
          )}
        </div>

        <div>
          <label className={labelClass}>
            Do you have any dependents? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={hasDependents} onChange={setHasDependents} />
          <input type="hidden" name="hasDependents" value={hasDependents} required />
          {hasDependents === "Yes" && (
            <FieldGrid>
              <input name="dependentsAges" placeholder="Age/s of dependents" className={`${inputClass} mt-2`} />
              <input name="dependentsNames" placeholder="Dependents' name/s" className={`${inputClass} mt-2`} />
            </FieldGrid>
          )}
        </div>

        <div>
          <label className={labelClass}>Total Number of Applicants Applying for This Property</label>
          <input name="totalApplicants" type="number" min="1" className={inputClass} />
        </div>

        <FieldGrid>
          <div>
            <label className={labelClass}>
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <DateInput name="dateOfBirth" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" required className={inputClass} />
          </div>
        </FieldGrid>

        <FieldGrid cols={3}>
          <div>
            <label className={labelClass}>
              Mobile Phone <span className="text-red-500">*</span>
            </label>
            <input name="mobilePhone" type="tel" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Home Phone</label>
            <input name="homePhone" type="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Work Phone</label>
            <input name="workPhone" type="tel" className={inputClass} />
          </div>
        </FieldGrid>

        <FieldGrid>
          <div>
            <label className={labelClass}>Driver&apos;s Licence Number</label>
            <input name="driversLicenceNumber" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Licence Expiry Date</label>
            <DateInput name="driversLicenceExpiry" className={inputClass} />
          </div>
        </FieldGrid>

        <FieldGrid>
          <div>
            <label className={labelClass}>Vehicle Registration</label>
            <input name="vehicleRegistration" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Registration State</label>
            <input name="vehicleRegistrationState" className={inputClass} />
          </div>
        </FieldGrid>

        <FieldGrid cols={3}>
          <div>
            <label className={labelClass}>Passport Number</label>
            <input name="passportNumber" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Passport Expiry Date</label>
            <DateInput name="passportExpiry" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Passport Country</label>
            <input name="passportCountry" className={inputClass} />
          </div>
        </FieldGrid>

        <FieldGrid>
          <div>
            <label className={labelClass}>Pension/Medicare No. (if applicable)</label>
            <input name="pensionMedicareNumber" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pension Type</label>
            <input name="pensionType" className={inputClass} />
          </div>
        </FieldGrid>
      </section>

      {/* 100 points + documents */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Identification &amp; Supporting Documents</h2>
        <p className="text-sm text-slate-500">
          Tick everything you&apos;re providing as part of your 100 points of ID and supporting documents (passport,
          driver&apos;s licence, tenancy ledger, rent receipts, bank statements, utility accounts, Medicare card,
          birth certificate, etc.), then attach the actual files below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {ID_DOCUMENT_OPTIONS.map((doc) => (
            <label key={doc} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={idDocumentsProvided.includes(doc)}
                onChange={() => toggleIdDoc(doc)}
                className="h-4 w-4"
              />
              {doc}
            </label>
          ))}
        </div>

        <div>
          <label className={labelClass}>
            ID Documents (passport, licence, Medicare card, etc.) <span className="text-red-500">*</span>
          </label>
          <input name="idDocuments" type="file" multiple required accept=".pdf,.jpg,.jpeg,.png" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            Proof of Income (payslips, bank statement, tax return) <span className="text-red-500">*</span>
          </label>
          <input name="proofOfIncome" type="file" multiple required accept=".pdf,.jpg,.jpeg,.png" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rental History (tenancy ledger, rent receipts) — optional</label>
          <input name="rentalHistory" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className={inputClass} />
        </div>
      </section>

      {/* Current address */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Current Address</h2>
        <FieldGrid>
          <div>
            <label className={labelClass}>
              Current Address <span className="text-red-500">*</span>
            </label>
            <input name="currentAddress" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Post Code</label>
            <input name="currentPostcode" className={inputClass} />
          </div>
        </FieldGrid>
        <FieldGrid>
          <div>
            <label className={labelClass}>Length of Stay (years/months)</label>
            <input name="currentLengthOfStay" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rent</label>
            <input name="currentRent" className={inputClass} />
          </div>
        </FieldGrid>
        <div>
          <label className={labelClass}>Reason for Leaving</label>
          <input name="currentReasonForLeaving" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Was Your Bond Refunded in Full?</label>
          <YesNoPills value={currentBondRefundedInFull} onChange={setCurrentBondRefundedInFull} />
          <input type="hidden" name="currentBondRefundedInFull" value={currentBondRefundedInFull} />
          {currentBondRefundedInFull === "No" && (
            <input
              name="currentBondRefundReason"
              placeholder="Please state the reason"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <FieldGrid>
          <div>
            <label className={labelClass}>Landlord/Agent</label>
            <input name="currentLandlordAgent" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Number</label>
            <input name="currentLandlordContact" type="tel" className={inputClass} />
          </div>
        </FieldGrid>
      </section>

      {/* Previous address */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Previous Address (if applicable)</h2>
        <FieldGrid>
          <div>
            <label className={labelClass}>Previous Address</label>
            <input name="previousAddress" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Post Code</label>
            <input name="previousPostcode" className={inputClass} />
          </div>
        </FieldGrid>
        <FieldGrid>
          <div>
            <label className={labelClass}>Length of Stay (years/months)</label>
            <input name="previousLengthOfStay" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rent</label>
            <input name="previousRent" className={inputClass} />
          </div>
        </FieldGrid>
        <div>
          <label className={labelClass}>Reason for Leaving</label>
          <input name="previousReasonForLeaving" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Was Your Bond Refunded in Full?</label>
          <YesNoPills value={previousBondRefundedInFull} onChange={setPreviousBondRefundedInFull} />
          <input type="hidden" name="previousBondRefundedInFull" value={previousBondRefundedInFull} />
          {previousBondRefundedInFull === "No" && (
            <input
              name="previousBondRefundReason"
              placeholder="Please state the reason"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <FieldGrid>
          <div>
            <label className={labelClass}>Landlord/Agent</label>
            <input name="previousLandlordAgent" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Number</label>
            <input name="previousLandlordContact" type="tel" className={inputClass} />
          </div>
        </FieldGrid>
      </section>

      {/* Employment */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Employment</h2>
        <div>
          <label className={labelClass}>Present Occupation</label>
          <input name="presentOccupation" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nature of Employment</label>
          <select name="natureOfEmployment" className={inputClass} defaultValue="">
            <option value="">— Select —</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Casual">Casual</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Employer&apos;s Name</label>
          <input name="employerName" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Employer&apos;s Address</label>
          <input name="employerAddress" className={inputClass} />
        </div>
        <FieldGrid>
          <div>
            <label className={labelClass}>Employer Contact Name</label>
            <input name="employerContactName" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Employer Phone</label>
            <input name="employerPhone" type="tel" className={inputClass} />
          </div>
        </FieldGrid>
        <FieldGrid>
          <div>
            <label className={labelClass}>Length of Employment (years/months)</label>
            <input name="lengthOfEmployment" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Weekly Income ($)</label>
            <input name="weeklyIncome" className={inputClass} />
          </div>
        </FieldGrid>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="selfEmployed"
            checked={selfEmployed}
            onChange={(e) => setSelfEmployed(e.target.checked)}
            className="h-4 w-4"
          />
          I am self-employed
        </label>
        {selfEmployed && (
          <div className="ml-2 space-y-4 border-l-2 border-slate-100 pl-4">
            <div>
              <label className={labelClass}>Business Name</label>
              <input name="businessName" className={inputClass} />
            </div>
            <FieldGrid>
              <div>
                <label className={labelClass}>How Long Self-Employed?</label>
                <input name="selfEmployedDuration" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>ABN</label>
                <input name="abn" className={inputClass} />
              </div>
            </FieldGrid>
            <div>
              <label className={labelClass}>Address of Business</label>
              <input name="businessAddress" className={inputClass} />
            </div>
            <FieldGrid>
              <div>
                <label className={labelClass}>Accountant&apos;s Name</label>
                <input name="accountantName" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Accountant&apos;s Phone</label>
                <input name="accountantPhone" type="tel" className={inputClass} />
              </div>
            </FieldGrid>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isStudent"
            checked={isStudent}
            onChange={(e) => setIsStudent(e.target.checked)}
            className="h-4 w-4"
          />
          I am a student
        </label>
        {isStudent && (
          <div className="ml-2 space-y-4 border-l-2 border-slate-100 pl-4">
            <FieldGrid>
              <div>
                <label className={labelClass}>Student Identification Number</label>
                <input name="studentIdNumber" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Overseas Student?</label>
                <YesNoPills value={overseasStudent} onChange={setOverseasStudent} />
                <input type="hidden" name="overseasStudent" value={overseasStudent} />
              </div>
            </FieldGrid>
            <div>
              <label className={labelClass}>Visa Expiry Date</label>
              <DateInput name="visaExpiry" className={inputClass} />
            </div>
          </div>
        )}
      </section>

      {/* Next of kin */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Next of Kin (not residing with you)</h2>
        <FieldGrid>
          <div>
            <label className={labelClass}>Last Name</label>
            <input name="nextOfKinLastName" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Given Name</label>
            <input name="nextOfKinGivenName" className={inputClass} />
          </div>
        </FieldGrid>
        <FieldGrid>
          <div>
            <label className={labelClass}>Home Number</label>
            <input name="nextOfKinHomeNumber" type="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Work/Mobile Number</label>
            <input name="nextOfKinMobileNumber" type="tel" className={inputClass} />
          </div>
        </FieldGrid>
        <div>
          <label className={labelClass}>Relationship</label>
          <input name="nextOfKinRelationship" className={inputClass} />
        </div>
      </section>

      {/* Personal references */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>
          Personal References <span className="font-normal text-sm text-slate-400">(not related to you)</span>
        </h2>
        {[1, 2].map((n) => (
          <div key={n} className="space-y-4">
            <p className="text-sm font-semibold text-brand-navy">Reference {n}</p>
            <FieldGrid>
              <div>
                <label className={labelClass}>Last Name</label>
                <input name={`reference${n}LastName`} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Given Name</label>
                <input name={`reference${n}GivenName`} className={inputClass} />
              </div>
            </FieldGrid>
            <FieldGrid>
              <div>
                <label className={labelClass}>Home Number</label>
                <input name={`reference${n}HomeNumber`} type="tel" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Work/Mobile Number</label>
                <input name={`reference${n}MobileNumber`} type="tel" className={inputClass} />
              </div>
            </FieldGrid>
            <FieldGrid>
              <div>
                <label className={labelClass}>Relationship</label>
                <input name={`reference${n}Relationship`} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input name={`reference${n}Address`} className={inputClass} />
              </div>
            </FieldGrid>
          </div>
        ))}
      </section>

      {/* Disclosures */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Please Advise the Following</h2>
        <div>
          <label className={labelClass}>
            Have you ever been evicted by any agent/lessor? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={everEvicted} onChange={setEverEvicted} />
          <input type="hidden" name="everEvicted" value={everEvicted} required />
        </div>
        <div>
          <label className={labelClass}>
            Is there any reason known to you that would affect your ability to pay rent?{" "}
            <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={reasonAffectingRentAbility} onChange={setReasonAffectingRentAbility} />
          <input type="hidden" name="reasonAffectingRentAbility" value={reasonAffectingRentAbility} required />
        </div>
        <div>
          <label className={labelClass}>
            Was your rental bond at your last address refunded in full? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={lastBondRefundedInFull} onChange={setLastBondRefundedInFull} />
          <input type="hidden" name="lastBondRefundedInFull" value={lastBondRefundedInFull} required />
        </div>
        <div>
          <label className={labelClass}>
            Are you in debt to another agent/lessor? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={inDebtToAgent} onChange={setInDebtToAgent} />
          <input type="hidden" name="inDebtToAgent" value={inDebtToAgent} required />
        </div>
        <div>
          <label className={labelClass}>
            If you answered Yes to any of the above, please explain (bond deductions, debt reason, etc.)
          </label>
          <textarea name="bondDeductionsOrDebtExplanation" rows={3} className={inputClass} />
        </div>
      </section>

      {/* Other information */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Other Information</h2>
        <div>
          <label className={labelClass}>Children (how many and ages)</label>
          <input name="childrenCountAges" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Pets (number, age, breed, council registration number)</label>
          <input name="pets" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Make/Type of Car / Registration Number</label>
          <input name="vehicleMakeTypeRego" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>
            Smoker? <span className="text-red-500">*</span>
          </label>
          <YesNoPills value={smoker} onChange={setSmoker} />
          <input type="hidden" name="smoker" value={smoker} required />
        </div>
      </section>

      {/* Consents + signature */}
      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Declaration &amp; Signature</h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consentOneFormPerApplicant" required className="mt-0.5 h-4 w-4" />
          I acknowledge that one application form has to be completed per person applying.
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consentPrivacyPolicyReceived" required className="mt-0.5 h-4 w-4" />
          I acknowledge that I have received Home7 Real Estate&apos;s Privacy Policy.
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consentBindingApplication" required className="mt-0.5 h-4 w-4" />
          I acknowledge that both the lessor and I are bound by this application immediately upon the lessor or
          their agent communicating its acceptance.
        </label>

        <div>
          <label className={labelClass}>
            Type your full name to sign this application <span className="text-red-500">*</span>
          </label>
          <input name="signatureName" required placeholder="Full name" className={inputClass} />
        </div>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
        >
          {status === "submitting" ? "Submitting…" : "Submit Application"}
        </button>
      </section>
    </form>
  );
}

export default TenancyApplicationForm;
