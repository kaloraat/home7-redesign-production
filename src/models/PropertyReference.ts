import { Schema, models, model, type Document, type Model } from "mongoose";

// Ported from the live site's tenancy reference check — an agent (the
// property manager, from the admin dashboard) requests a rental reference
// from a tenant applicant's PREVIOUS agent via a unique tokenized link;
// that previous agent fills out a questionnaire on a public (token-gated,
// not admin-auth-gated) page.
//
// The live site's PropertyReference table only ever stored a status flag —
// the actual questionnaire answers and uploaded files were emailed and
// never persisted anywhere, so there was no way to go back and review a
// past reference check. This rebuild fixes that: the full response is
// saved here, not just a completion flag.
type YesNoNA = "Yes" | "No" | "Not Applicable";

export interface IPropertyReferenceResponse {
  agentName: string;
  jobPosition: string;
  leaseholderOrApprovedOccupant: YesNoNA;
  agencyName: string;
  agentEmail: string;
  propertyType: string;
  leaseType: "Fixed Term" | "Periodic";
  tenancyAgreementCommencedDate: Date;
  tenancyAgreementExpiresDate: Date;
  tenancyTerminatedByOffice: YesNoNA;
  weeklyRentPaid: string;
  rentPaidTo: Date;
  rentPaidOnTime: YesNoNA;
  rentPaidLateCount?: string;
  rentLateFrequency?: string;
  rentDefaultNoticeIssued: YesNoNA;
  rentDefaultNoticeIssuedReason?: string;
  noticesIssuedByOffice: YesNoNA;
  noticesIssuedByOfficeReason?: string;
  tenantServedNotices: YesNoNA;
  tenantServedNoticesReason?: string;
  routineInspectionsConducted: YesNoNA;
  lastRoutineInspectionDate?: Date;
  routineInspectionFeedback?: string;
  propertyCleanAndWellMaintained?: YesNoNA;
  routineInspectionsComments?: string;
  tenantCaredForProperty: YesNoNA;
  tenantCaredForPropertyComments?: string;
  gardensKeptNeat: YesNoNA;
  complaintsReceived: YesNoNA;
  complaintsReceivedComments?: string;
  tenantKeptPets: YesNoNA;
  petDetails?: string;
  petsCausedDamage?: YesNoNA;
  fullBondRefundReceived: YesNoNA;
  whyNotListDeductions?: string;
  vacateInspectionDone: YesNoNA;
  propertyConditionOnVacate?: string;
  tenantCooperative: YesNoNA;
  tenantCooperativeComments?: string;
  tenantRating: number; // 1 (Poor) – 5 (Great)
  wouldRentAgain: YesNoNA;
  wouldRentAgainWhyNot?: string;
  tenantLeavingReason: string;
  listedAsDefaulter: string;
  socialMediaNegativePosts: YesNoNA;
  socialMediaNegativePostsExample?: string;
  tenantLedgerUrl: string;
  inspectionReportUrl?: string;
  additionalComments?: string;
}

export interface IPropertyReference extends Document {
  tenantName: string;
  tenantAddress: string;
  agentEmail: string; // previous agent's email — where the request is sent
  agentName: string;
  jobPosition?: string;
  agencyName: string;
  token: string;
  // "declined" covers both "Call Me Instead" and "I don't know this
  // tenant" — the live site marked both simply "completed" indistinguishably
  // from an actual filled-out questionnaire, losing the distinction. Kept
  // separate here so an admin reviewing the list can tell them apart.
  status: "pending" | "completed" | "declined";
  declineReason?: "call_me_instead" | "unknown_contact";
  response?: IPropertyReferenceResponse;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const YES_NO_NA = ["Yes", "No", "Not Applicable"];

const ResponseSchema = new Schema<IPropertyReferenceResponse>(
  {
    agentName: { type: String, required: true },
    jobPosition: { type: String, required: true },
    leaseholderOrApprovedOccupant: { type: String, enum: YES_NO_NA, required: true },
    agencyName: { type: String, required: true },
    agentEmail: { type: String, required: true },
    propertyType: { type: String, required: true },
    leaseType: { type: String, enum: ["Fixed Term", "Periodic"], required: true },
    tenancyAgreementCommencedDate: { type: Date, required: true },
    tenancyAgreementExpiresDate: { type: Date, required: true },
    tenancyTerminatedByOffice: { type: String, enum: YES_NO_NA, required: true },
    weeklyRentPaid: { type: String, required: true },
    rentPaidTo: { type: Date, required: true },
    rentPaidOnTime: { type: String, enum: YES_NO_NA, required: true },
    rentPaidLateCount: String,
    rentLateFrequency: String,
    rentDefaultNoticeIssued: { type: String, enum: YES_NO_NA, required: true },
    rentDefaultNoticeIssuedReason: String,
    noticesIssuedByOffice: { type: String, enum: YES_NO_NA, required: true },
    noticesIssuedByOfficeReason: String,
    tenantServedNotices: { type: String, enum: YES_NO_NA, required: true },
    tenantServedNoticesReason: String,
    routineInspectionsConducted: { type: String, enum: YES_NO_NA, required: true },
    lastRoutineInspectionDate: Date,
    routineInspectionFeedback: String,
    propertyCleanAndWellMaintained: { type: String, enum: YES_NO_NA },
    routineInspectionsComments: String,
    tenantCaredForProperty: { type: String, enum: YES_NO_NA, required: true },
    tenantCaredForPropertyComments: String,
    gardensKeptNeat: { type: String, enum: YES_NO_NA, required: true },
    complaintsReceived: { type: String, enum: YES_NO_NA, required: true },
    complaintsReceivedComments: String,
    tenantKeptPets: { type: String, enum: YES_NO_NA, required: true },
    petDetails: String,
    petsCausedDamage: { type: String, enum: YES_NO_NA },
    fullBondRefundReceived: { type: String, enum: YES_NO_NA, required: true },
    whyNotListDeductions: String,
    vacateInspectionDone: { type: String, enum: YES_NO_NA, required: true },
    propertyConditionOnVacate: String,
    tenantCooperative: { type: String, enum: YES_NO_NA, required: true },
    tenantCooperativeComments: String,
    tenantRating: { type: Number, min: 1, max: 5, required: true },
    wouldRentAgain: { type: String, enum: YES_NO_NA, required: true },
    wouldRentAgainWhyNot: String,
    tenantLeavingReason: { type: String, required: true },
    listedAsDefaulter: { type: String, required: true },
    socialMediaNegativePosts: { type: String, enum: YES_NO_NA, required: true },
    socialMediaNegativePostsExample: String,
    tenantLedgerUrl: { type: String, required: true },
    inspectionReportUrl: String,
    additionalComments: String,
  },
  { _id: false }
);

const PropertyReferenceSchema = new Schema<IPropertyReference>(
  {
    tenantName: { type: String, required: true },
    tenantAddress: { type: String, required: true },
    agentEmail: { type: String, required: true },
    agentName: { type: String, required: true },
    jobPosition: String,
    agencyName: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["pending", "completed", "declined"], default: "pending" },
    declineReason: { type: String, enum: ["call_me_instead", "unknown_contact"] },
    response: ResponseSchema,
    submittedAt: Date,
  },
  { timestamps: true }
);

export const PropertyReference: Model<IPropertyReference> =
  models.PropertyReference || model<IPropertyReference>("PropertyReference", PropertyReferenceSchema);

export default PropertyReference;
