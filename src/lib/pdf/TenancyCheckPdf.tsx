import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer";
import type { IPropertyReference } from "@/models/PropertyReference";

// Hex values match the site's actual brand tokens (globals.css --brand-*) —
// @react-pdf/renderer has its own styling system, entirely separate from
// Tailwind/CSS custom properties, so these can't be shared/imported from
// there and are duplicated here deliberately.
const COLOR = {
  navy: "#081349",
  gold: "#f4ca74",
  goldDark: "#c18847",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate50: "#f8fafc",
  amber50: "#fffbeb",
  amber200: "#fde68a",
  amber800: "#92400e",
  green100: "#dcfce7",
  green700: "#15803d",
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
  tenantName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLOR.navy },
  tenantSub: { fontSize: 10, color: COLOR.slate500, marginTop: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 18 },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
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
  grid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", marginBottom: 8, paddingRight: 14 },
  fieldFull: { width: "100%", marginBottom: 8 },
  fieldLabel: { fontSize: 8, color: COLOR.slate500, marginBottom: 2 },
  fieldValue: { fontSize: 10, color: COLOR.slate900, lineHeight: 1.4 },
  noteBox: { padding: 10, borderRadius: 4, marginBottom: 18 },
  noteText: { fontSize: 9.5, lineHeight: 1.4 },
  link: { fontSize: 9.5, color: COLOR.goldDark, textDecoration: "none" },
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

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: COLOR.amber50, fg: COLOR.amber800, label: "Pending" },
  completed: { bg: COLOR.green100, fg: COLOR.green700, label: "Completed" },
  declined: { bg: COLOR.slate200, fg: COLOR.slate700, label: "Declined" },
};

function fmtDate(d?: Date | string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-AU");
}

function Field({ label, value, full }: { label: string; value?: string | number | null; full?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View style={full ? styles.fieldFull : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{String(value)}</Text>
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

/**
 * Mirrors admin/tenancy-checks/[id]/page.tsx's sections/fields exactly (same
 * labels, same grouping) so the PDF and the on-screen view never drift out
 * of sync with each other — this was built by translating that page's JSX
 * to react-pdf's View/Text primitives, not designed independently.
 */
export function TenancyCheckPdf({ reference }: { reference: IPropertyReference }) {
  const r = reference.response;
  const status = STATUS_STYLE[reference.status] ?? STATUS_STYLE.pending;
  const generatedAt = new Date().toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Document title={`Tenancy Reference Check — ${reference.tenantName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Home7 Real Estate</Text>
            <Text style={styles.docTitle}>Tenancy Reference Check</Text>
          </View>
          <Text style={styles.meta}>Generated {generatedAt}</Text>
        </View>

        <Text style={styles.tenantName}>{reference.tenantName}</Text>
        <Text style={styles.tenantSub}>
          {reference.tenantAddress} · Requested {fmtDate(reference.createdAt)}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={{ color: status.fg }}>{status.label}</Text>
          </View>
        </View>

        <Section title="Requested From">
          <Field label="Agent" value={reference.agentName} />
          <Field label="Agency" value={reference.agencyName} />
          <Field label="Email" value={reference.agentEmail} />
          <Field label="Job Position" value={reference.jobPosition} />
        </Section>

        {reference.status === "pending" && (
          <View style={[styles.noteBox, { backgroundColor: COLOR.amber50 }]} wrap={false}>
            <Text style={[styles.noteText, { color: COLOR.amber800 }]}>
              Still pending — the previous agent hadn&apos;t responded at the time this PDF was generated.
            </Text>
          </View>
        )}

        {reference.status === "declined" && (
          <View style={[styles.noteBox, { backgroundColor: COLOR.slate50 }]} wrap={false}>
            <Text style={[styles.noteText, { color: COLOR.slate700 }]}>
              {reference.declineReason === "call_me_instead"
                ? "The agent asked to be called instead of filling out the form."
                : "The agent said they don't recognise this tenant."}
            </Text>
          </View>
        )}

        {reference.status === "completed" && r && (
          <>
            <Section title="Lease">
              <Field label="Leaseholder / Approved Occupant" value={r.leaseholderOrApprovedOccupant} />
              <Field label="Property Type" value={r.propertyType} />
              <Field label="Lease Type" value={r.leaseType} />
              <Field label="Commenced" value={fmtDate(r.tenancyAgreementCommencedDate)} />
              <Field label="Expires" value={fmtDate(r.tenancyAgreementExpiresDate)} />
              <Field label="Terminated By Office" value={r.tenancyTerminatedByOffice} />
            </Section>

            <Section title="Rent">
              <Field label="Weekly Rent" value={r.weeklyRentPaid} />
              <Field label="Rent Paid To" value={fmtDate(r.rentPaidTo)} />
              <Field label="Paid On Time" value={r.rentPaidOnTime} />
              <Field label="How Often Paid Late" value={r.rentPaidLateCount} />
              <Field label="Max Arrears (days)" value={r.rentLateFrequency} />
              <Field label="Rent Default Notice Issued" value={r.rentDefaultNoticeIssued} />
              <Field label="Default Notice Reason" value={r.rentDefaultNoticeIssuedReason} full />
            </Section>

            <Section title="Notices & Inspections">
              <Field label="Notices Issued By Office" value={r.noticesIssuedByOffice} />
              <Field label="Reason" value={r.noticesIssuedByOfficeReason} />
              <Field label="Tenant Served Notices" value={r.tenantServedNotices} />
              <Field label="Reason" value={r.tenantServedNoticesReason} />
              <Field label="Routine Inspections Conducted" value={r.routineInspectionsConducted} />
              <Field label="Last Inspection" value={fmtDate(r.lastRoutineInspectionDate)} />
              <Field label="Inspection Feedback" value={r.routineInspectionFeedback} full />
              <Field label="Property Clean & Maintained" value={r.propertyCleanAndWellMaintained} />
              <Field label="Comments" value={r.routineInspectionsComments} full />
            </Section>

            <Section title="Tenant Behaviour">
              <Field label="Cared For Property" value={r.tenantCaredForProperty} />
              <Field label="Comments" value={r.tenantCaredForPropertyComments} full />
              <Field label="Gardens Kept Neat" value={r.gardensKeptNeat} />
              <Field label="Complaints Received" value={r.complaintsReceived} />
              <Field label="Comments" value={r.complaintsReceivedComments} full />
              <Field label="Kept Pets" value={r.tenantKeptPets} />
              <Field label="Pet Details" value={r.petDetails} />
              <Field label="Pets Caused Damage" value={r.petsCausedDamage} />
              <Field label="Cooperative" value={r.tenantCooperative} />
              <Field label="Comments" value={r.tenantCooperativeComments} full />
              <Field label="Social Media Concerns" value={r.socialMediaNegativePosts} />
              <Field label="Example" value={r.socialMediaNegativePostsExample} full />
            </Section>

            <Section title="Bond & Vacate">
              <Field label="Full Bond Refund" value={r.fullBondRefundReceived} />
              <Field label="Deductions" value={r.whyNotListDeductions} full />
              <Field label="Vacate Inspection Done" value={r.vacateInspectionDone} />
              <Field label="Condition On Vacate" value={r.propertyConditionOnVacate} />
              <Field label="Reason For Leaving" value={r.tenantLeavingReason} full />
              <Field label="Listed As Defaulter" value={r.listedAsDefaulter} />
            </Section>

            <Section title="Overall">
              <Field label="Rating (1–5)" value={r.tenantRating} />
              <Field label="Would Rent To Again" value={r.wouldRentAgain} />
              <Field label="Why Not" value={r.wouldRentAgainWhyNot} full />
              <Field label="Additional Comments" value={r.additionalComments} full />
            </Section>

            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Link src={r.tenantLedgerUrl} style={styles.link}>
                  Tenant Ledger
                </Link>
                {r.inspectionReportUrl && (
                  <Link src={r.inspectionReportUrl} style={styles.link}>
                    Inspection Report
                  </Link>
                )}
              </View>
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Home7 Real Estate — Confidential tenancy reference check</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export default TenancyCheckPdf;
