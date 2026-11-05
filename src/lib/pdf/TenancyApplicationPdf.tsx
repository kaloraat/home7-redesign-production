import { Document, Page, View, Text, Link, Image, StyleSheet } from "@react-pdf/renderer";
import type { ITenancyApplication, ICoApplicant } from "@/models/TenancyApplication";
import { applicationView } from "@/lib/rentalApplication/summary";

// Same look as TenancyCheckPdf.tsx (brand hex values duplicated on purpose:
// react-pdf has its own styling system and can't read the site's CSS vars).
const COLOR = {
  navy: "#081349",
  goldDark: "#c18847",
  slate900: "#0f172a",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
};

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontSize: 10, fontFamily: "Helvetica", color: COLOR.slate900 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLOR.navy,
    paddingBottom: 14,
    marginBottom: 20,
  },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLOR.navy },
  docTitle: { fontSize: 9, color: COLOR.goldDark, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 },
  meta: { fontSize: 8, color: COLOR.slate500, textAlign: "right" },
  applicantName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLOR.navy },
  applicantSub: { fontSize: 10, color: COLOR.slate500, marginTop: 3, marginBottom: 18 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.navy,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.slate200,
  },
  subTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLOR.slate500, width: "100%", marginBottom: 6, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", marginBottom: 8, paddingRight: 14 },
  fieldFull: { width: "100%", marginBottom: 8 },
  fieldLabel: { fontSize: 8, color: COLOR.slate500, marginBottom: 2 },
  fieldValue: { fontSize: 10, color: COLOR.slate900, lineHeight: 1.4 },
  docGroup: { width: "100%", marginBottom: 6 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  link: { fontSize: 9.5, color: COLOR.goldDark, textDecoration: "none" },
  attachmentTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR.navy, marginBottom: 10 },
  attachmentImage: { width: "100%", maxHeight: 680, objectFit: "contain" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLOR.slate400,
    borderTopWidth: 1,
    borderTopColor: COLOR.slate200,
    paddingTop: 6,
  },
});

/** An uploaded JPG/PNG fetched by the route ahead of rendering. */
export interface PdfAttachment {
  label: string; // e.g. "Applicant 1: ID Documents, file 2"
  data: Buffer;
  format: "jpg" | "png";
}

function fmtDate(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString("en-AU");
}

function Field({ label, value, full }: { label: string; value?: string | number | boolean | null; full?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View style={full ? styles.fieldFull : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

function FileLinks({ label, urls }: { label: string; urls?: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <View style={styles.docGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.linkRow}>
        {urls.map((url, i) => (
          <Link key={url} src={url} style={styles.link}>
            File {i + 1}
          </Link>
        ))}
      </View>
    </View>
  );
}

function CoApplicantSection({ co }: { co: ICoApplicant }) {
  return (
    <>
      <Section title="Applicant 2 Details">
        <Field label="Relationship to applicant 1" value={co.relationshipToApplicant} />
        <Field label="Title" value={co.title} />
        <Field label="Full name" value={`${co.firstName} ${co.lastName}`} />
        <Field label="Date of birth" value={fmtDate(co.dateOfBirth)} />
        <Field label="Email" value={co.email} />
        <Field label="Mobile" value={co.mobilePhone} />
        <Field label="Work phone" value={co.workPhone} />
        <Field label="Driver's licence" value={co.driversLicenceNumber} />
        <Field label="Licence expiry" value={fmtDate(co.driversLicenceExpiry)} />
        <Field label="Passport number" value={co.passportNumber} />
        <Field label="Passport expiry" value={fmtDate(co.passportExpiry)} />
        <Field label="Passport country" value={co.passportCountry} />
      </Section>
      <Section title="Applicant 2 Employment">
        <Field label="Present occupation" value={co.presentOccupation} />
        <Field label="Nature of employment" value={co.natureOfEmployment} />
        <Field label="Employer" value={co.employerName} />
        <Field label="Employer phone" value={co.employerPhone} />
        <Field label="Length of employment" value={co.lengthOfEmployment} />
        <Field label="Weekly income" value={co.weeklyIncome} />
      </Section>
    </>
  );
}

/**
 * Mirrors admin/rental-applications/[id]/page.tsx's sections and labels so
 * the PDF and the on-screen view stay in step. Uploaded JPG/PNG documents
 * are embedded as attachment pages at the end so the PDF is a complete,
 * printable record; uploaded PDFs can't be embedded by react-pdf and are
 * listed as clickable links instead.
 */
export function TenancyApplicationPdf({
  application: a,
  attachments,
}: {
  application: ITenancyApplication;
  attachments: PdfAttachment[];
}) {
  const co = a.coApplicant;
  const coName = co ? `${co.firstName} ${co.lastName}` : a.coApplicantName;
  const names = `${a.firstName} ${a.lastName}${coName ? ` & ${coName}` : ""}`;
  const generatedAt = new Date().toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const footer = (
    <View style={styles.footer} fixed>
      <Text>Home7 Real Estate · Confidential rental application</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );

  // v2 (hub form): generic label/value groups from the shared view model.
  if (a.formVersion === 2 && a.v2) {
    const view = applicationView(a.v2, { propertyAddress: a.propertyAddress, rentPerWeek: a.rentPerWeek ? Number(a.rentPerWeek) : null });
    return (
      <Document title={`Rental Application: ${names}`}>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View>
              <Text style={styles.companyName}>Home7 Real Estate</Text>
              <Text style={styles.docTitle}>Rental Application</Text>
            </View>
            <Text style={styles.meta}>Generated {generatedAt}</Text>
          </View>
          <Text style={styles.applicantName}>{names}</Text>
          <Text style={styles.applicantSub}>
            {a.propertyAddress} · Submitted {fmtDate(a.createdAt)} · Status: {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
          </Text>
          {view.groups.map((g) => (
            <Section key={g.title} title={g.title}>
              {g.fields.map((f) => (
                <Field key={f.label} label={f.label} value={f.value} full={f.value.length > 60} />
              ))}
            </Section>
          ))}
          <Section title="Uploaded documents">
            {view.files.length === 0 && <Field label="Files" value="None uploaded" full />}
            {view.files.map((g) => (
              <Field key={g.label} label={g.label} value={g.files.map((f) => f.name).join(", ")} full />
            ))}
            <Field label="Note" value="Files are stored privately. Open them from the admin page (staff login required). JPG and PNG images are included as pages at the end of this PDF." full />
          </Section>
          {footer}
        </Page>
        {attachments.map((att, i) => (
          <Page key={i} size="A4" style={styles.page}>
            <Text style={styles.attachmentTitle}>{att.label}</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
            <Image src={{ data: att.data, format: att.format }} style={styles.attachmentImage} />
            {footer}
          </Page>
        ))}
      </Document>
    );
  }

  return (
    <Document title={`Rental Application: ${names}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Home7 Real Estate</Text>
            <Text style={styles.docTitle}>Residential Tenancy Application</Text>
          </View>
          <Text style={styles.meta}>Generated {generatedAt}</Text>
        </View>

        <Text style={styles.applicantName}>{names}</Text>
        <Text style={styles.applicantSub}>
          {a.propertyAddress} · Submitted {fmtDate(a.createdAt)} · Status: {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
        </Text>

        <Section title="Property & Tenancy">
          <Field label="Property" value={a.propertyAddress} />
          <Field label="Commencement date" value={fmtDate(a.commencementDate)} />
          <Field label="Rent per week" value={a.rentPerWeek} />
          <Field label="Rent per month" value={a.rentPerMonth} />
          <Field label="Bond" value={a.bond} />
          <Field
            label="Lease term"
            value={[a.leaseTermYears && `${a.leaseTermYears}y`, a.leaseTermMonths && `${a.leaseTermMonths}m`].filter(Boolean).join(" ")}
          />
          <Field label="Adults occupying" value={a.occupantsAdults} />
          <Field label="Children & ages" value={a.occupantsChildrenAges} />
        </Section>

        <Section title={co ? "Applicant 1 Details" : "Applicant Details"}>
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
        </Section>

        {co && <CoApplicantSection co={co} />}

        <Section title="Current Address">
          <Field label="Address" value={a.currentAddress} />
          <Field label="Post code" value={a.currentPostcode} />
          <Field label="Length of stay" value={a.currentLengthOfStay} />
          <Field label="Rent" value={a.currentRent} />
          <Field label="Reason for leaving" value={a.currentReasonForLeaving} />
          <Field label="Bond refunded in full" value={a.currentBondRefundedInFull} />
          <Field label="Bond refund reason" value={a.currentBondRefundReason} />
          <Field label="Landlord/agent" value={a.currentLandlordAgent} />
          <Field label="Contact number" value={a.currentLandlordContact} />
        </Section>

        {a.previousAddress && (
          <Section title="Previous Address">
            <Field label="Address" value={a.previousAddress} />
            <Field label="Post code" value={a.previousPostcode} />
            <Field label="Length of stay" value={a.previousLengthOfStay} />
            <Field label="Rent" value={a.previousRent} />
            <Field label="Reason for leaving" value={a.previousReasonForLeaving} />
            <Field label="Bond refunded in full" value={a.previousBondRefundedInFull} />
            <Field label="Bond refund reason" value={a.previousBondRefundReason} />
            <Field label="Landlord/agent" value={a.previousLandlordAgent} />
            <Field label="Contact number" value={a.previousLandlordContact} />
          </Section>
        )}

        <Section title={co ? "Employment (Applicant 1)" : "Employment"}>
          <Field label="Present occupation" value={a.presentOccupation} />
          <Field label="Nature of employment" value={a.natureOfEmployment} />
          <Field label="Employer" value={a.employerName} />
          <Field label="Employer address" value={a.employerAddress} />
          <Field label="Employer contact" value={a.employerContactName} />
          <Field label="Employer phone" value={a.employerPhone} />
          <Field label="Length of employment" value={a.lengthOfEmployment} />
          <Field label="Weekly income" value={a.weeklyIncome} />
          {a.selfEmployed && (
            <>
              <Text style={styles.subTitle}>Self-employed</Text>
              <Field label="Business name" value={a.businessName} />
              <Field label="Self-employed duration" value={a.selfEmployedDuration} />
              <Field label="ABN" value={a.abn} />
              <Field label="Business address" value={a.businessAddress} />
              <Field label="Accountant" value={a.accountantName} />
              <Field label="Accountant phone" value={a.accountantPhone} />
            </>
          )}
          {a.isStudent && (
            <>
              <Text style={styles.subTitle}>Student</Text>
              <Field label="Student ID number" value={a.studentIdNumber} />
              <Field label="Overseas student" value={a.overseasStudent} />
              <Field label="Visa expiry" value={fmtDate(a.visaExpiry)} />
            </>
          )}
        </Section>

        <Section title="Next of Kin">
          <Field label="Name" value={[a.nextOfKinGivenName, a.nextOfKinLastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.nextOfKinRelationship} />
          <Field label="Home number" value={a.nextOfKinHomeNumber} />
          <Field label="Work/mobile number" value={a.nextOfKinMobileNumber} />
        </Section>

        <Section title="Personal References">
          <Field label="Reference 1" value={[a.reference1GivenName, a.reference1LastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.reference1Relationship} />
          <Field label="Home number" value={a.reference1HomeNumber} />
          <Field label="Mobile number" value={a.reference1MobileNumber} />
          <Field label="Address" value={a.reference1Address} full />
          <Field label="Reference 2" value={[a.reference2GivenName, a.reference2LastName].filter(Boolean).join(" ")} />
          <Field label="Relationship" value={a.reference2Relationship} />
          <Field label="Home number" value={a.reference2HomeNumber} />
          <Field label="Mobile number" value={a.reference2MobileNumber} />
          <Field label="Address" value={a.reference2Address} full />
        </Section>

        <Section title="Disclosures">
          <Field label="Ever evicted" value={a.everEvicted} />
          <Field label="Reason may affect rent ability" value={a.reasonAffectingRentAbility} />
          <Field label="Last bond refunded in full" value={a.lastBondRefundedInFull} />
          <Field label="In debt to another agent" value={a.inDebtToAgent} />
          <Field label="Explanation" value={a.bondDeductionsOrDebtExplanation} full />
        </Section>

        <Section title="Other Information">
          <Field label="Children" value={a.childrenCountAges} />
          <Field label="Pets" value={a.pets} />
          <Field label="Vehicle" value={a.vehicleMakeTypeRego} />
          <Field label="Smoker" value={a.smoker} />
        </Section>

        <Section title="Uploaded Documents">
          {a.idDocumentsProvided?.length > 0 && (
            <Field label="ID provided (applicant 1)" value={a.idDocumentsProvided.join(", ")} full />
          )}
          <FileLinks label={co ? "Applicant 1: ID Documents" : "ID Documents"} urls={a.idDocumentUrls} />
          <FileLinks label={co ? "Applicant 1: Proof of Income" : "Proof of Income"} urls={a.proofOfIncomeUrls} />
          <FileLinks label="Rental History" urls={a.rentalHistoryUrls} />
          {co && <FileLinks label="Applicant 2: ID Documents" urls={co.idDocumentUrls} />}
          {co && <FileLinks label="Applicant 2: Proof of Income" urls={co.proofOfIncomeUrls} />}
          {attachments.length > 0 && (
            <Field label="Note" value="Image uploads are also included as pages at the end of this PDF." full />
          )}
        </Section>

        <Section title="Declaration & Signature">
          <Field label="Every adult named or applying separately" value={a.consentOneFormPerApplicant} />
          <Field label="Privacy policy received" value={a.consentPrivacyPolicyReceived} />
          <Field label="Bound on acceptance" value={a.consentBindingApplication} />
          <Field label={co ? "Signed by applicant 1" : "Signed by"} value={a.signatureName} />
          {co && <Field label="Signed by applicant 2" value={co.signatureName} />}
          <Field label="Signed at" value={fmtDate(a.signedAt)} />
        </Section>

        {footer}
      </Page>

      {attachments.map((att, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <Text style={styles.attachmentTitle}>{att.label}</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
          <Image src={{ data: att.data, format: att.format }} style={styles.attachmentImage} />
          {footer}
        </Page>
      ))}
    </Document>
  );
}

export default TenancyApplicationPdf;
