import { Schema, models, model, type Document, type Model } from "mongoose";
import type { ApplicationData } from "@/lib/rentalApplication/types";

// The old Laravel site's /property-tenant-application-download route never
// rendered a page at all — it generated and force-downloaded a blank,
// printable "Residential Tenancy Application" PDF (see
// old_laravel_site/.../pdf/tenancy_application_download.blade.php), meant
// to be filled by hand and returned separately (email/in-person/fax). This
// is that same field set rebuilt as a real, submittable online form —
// every field below traces to a labeled cell in that exact PDF, not
// approximated. The PDF's own note ("one application form has to be
// completed per person applying") made it a single-applicant form; the
// online version also lets a couple apply together on one form, with the
// second person's own details in `coApplicant` below.
type YesNo = "Yes" | "No";

// Optional second applicant on the same application (a couple applying
// together, e.g. husband and wife). The PDF's "one form per person" rule
// meant partners had to fill in everything twice even though they share
// the property, addresses, references and household answers. This holds
// only what is genuinely per-person: identity, contact, ID, employment,
// their own documents and their own signature. Everything else on the
// application is shared by both.
export interface ICoApplicant {
  relationshipToApplicant?: string; // "Spouse", "Partner", ...
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  mobilePhone: string;
  workPhone?: string;
  driversLicenceNumber?: string;
  driversLicenceExpiry?: Date;
  passportNumber?: string;
  passportExpiry?: Date;
  passportCountry?: string;
  presentOccupation?: string;
  natureOfEmployment?: "Full Time" | "Part Time" | "Casual";
  employerName?: string;
  employerPhone?: string;
  lengthOfEmployment?: string;
  weeklyIncome?: string;
  idDocumentUrls: string[];
  proofOfIncomeUrls: string[];
  signatureName: string;
}

export interface ITenancyApplication extends Document {
  // Property/tenancy preference
  propertyAddress: string; // "First Preference"
  propertySlug?: string; // set when submitted from a specific property page
  commencementDate?: Date;
  rentPerWeek?: string;
  rentPerMonth?: string;
  bond?: string;
  leaseTermYears?: string;
  leaseTermMonths?: string;
  occupantsAdults?: string;
  occupantsChildrenAges?: string;

  // Applicant details
  title?: string;
  firstName: string;
  lastName: string;
  knownByOtherName: YesNo;
  otherName?: string;
  hasDependents: YesNo;
  dependentsAges?: string;
  totalApplicants?: string;
  dependentsNames?: string;
  dateOfBirth: Date;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  workPhone?: string;
  driversLicenceNumber?: string;
  driversLicenceExpiry?: Date;
  vehicleRegistration?: string;
  vehicleRegistrationState?: string;
  passportNumber?: string;
  passportExpiry?: Date;
  passportCountry?: string;
  pensionMedicareNumber?: string;
  pensionType?: string;

  // 100-points ID + supporting documents — idDocumentsProvided is which
  // items from the PDF's own checklist the applicant says they're
  // providing; the *Urls are the actual uploaded files (grouped into 3
  // practical slots rather than one upload per individual checklist line,
  // which the PDF's own "attach the following" framing doesn't strictly
  // require file-by-file either).
  idDocumentsProvided: string[];
  idDocumentUrls: string[];
  proofOfIncomeUrls: string[];
  rentalHistoryUrls: string[];

  // Current address
  currentAddress: string;
  currentPostcode?: string;
  currentLengthOfStay?: string;
  currentRent?: string;
  currentReasonForLeaving?: string;
  currentBondRefundedInFull?: YesNo;
  currentBondRefundReason?: string;
  currentLandlordAgent?: string;
  currentLandlordContact?: string;

  // Previous address (optional — not everyone has one on file)
  previousAddress?: string;
  previousPostcode?: string;
  previousLengthOfStay?: string;
  previousRent?: string;
  previousReasonForLeaving?: string;
  previousBondRefundedInFull?: YesNo;
  previousBondRefundReason?: string;
  previousLandlordAgent?: string;
  previousLandlordContact?: string;

  // Employment
  presentOccupation?: string;
  natureOfEmployment?: "Full Time" | "Part Time" | "Casual";
  employerName?: string;
  employerAddress?: string;
  employerContactName?: string;
  employerPhone?: string;
  lengthOfEmployment?: string;
  weeklyIncome?: string;

  // Next of kin (not residing with the applicant)
  nextOfKinLastName?: string;
  nextOfKinGivenName?: string;
  nextOfKinHomeNumber?: string;
  nextOfKinMobileNumber?: string;
  nextOfKinRelationship?: string;

  // Personal references — the PDF asks for exactly 2
  reference1LastName?: string;
  reference1GivenName?: string;
  reference1HomeNumber?: string;
  reference1MobileNumber?: string;
  reference1Relationship?: string;
  reference1Address?: string;
  reference2LastName?: string;
  reference2GivenName?: string;
  reference2HomeNumber?: string;
  reference2MobileNumber?: string;
  reference2Relationship?: string;
  reference2Address?: string;

  // Only relevant if self-employed
  selfEmployed: boolean;
  businessName?: string;
  selfEmployedDuration?: string;
  abn?: string;
  businessAddress?: string;
  accountantName?: string;
  accountantPhone?: string;

  // Only relevant if a student
  isStudent: boolean;
  studentIdNumber?: string;
  overseasStudent?: YesNo;
  visaExpiry?: Date;

  // Disclosure questions (the PDF's own Yes/No list)
  everEvicted: YesNo;
  reasonAffectingRentAbility: YesNo;
  lastBondRefundedInFull: YesNo;
  inDebtToAgent: YesNo;
  bondDeductionsOrDebtExplanation?: string;

  // The PDF's last 3 "Yes/No" rows are really consent/acknowledgement
  // statements, not data questions — modeled as required checkboxes
  // rather than Yes/No pills, since "No" isn't a valid answer to any of
  // them for a submittable application.
  consentOneFormPerApplicant: boolean;
  consentPrivacyPolicyReceived: boolean;
  consentBindingApplication: boolean;

  // Other information
  childrenCountAges?: string;
  pets?: string;
  vehicleMakeTypeRego?: string;
  smoker: YesNo;

  // A typed-name + confirmation checkbox stands in for a wet/drawn
  // signature — a well-established, legally-accepted pattern for online
  // form submissions, and far simpler to build/use than a signature-pad
  // canvas component for what's ultimately the same legal intent.
  signatureName: string;
  signedAt: Date;

  coApplicant?: ICoApplicant;

  // v2 ("hub and sections" form, Nov 2026). Old applications have no
  // formVersion and keep using the flat fields above. v2 applications fill
  // only the summary fields above (names, email, mobile, property, rent,
  // signature) and keep the full answers in `v2`, with uploads stored as
  // private-bucket keys in v2's FileRefs (never public URLs).
  formVersion?: number;
  v2?: ApplicationData;
  coApplicantName?: string;

  status: "new" | "reviewed" | "approved" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const YES_NO = ["Yes", "No"];

// Only the old (v1) form collects these, so only v1 documents require them.
function legacyRequired(this: { formVersion?: number }) {
  return this.formVersion !== 2;
}

const CoApplicantSchema = new Schema<ICoApplicant>(
  {
    relationshipToApplicant: String,
    title: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    email: { type: String, required: true },
    mobilePhone: { type: String, required: true },
    workPhone: String,
    driversLicenceNumber: String,
    driversLicenceExpiry: Date,
    passportNumber: String,
    passportExpiry: Date,
    passportCountry: String,
    presentOccupation: String,
    natureOfEmployment: { type: String, enum: ["Full Time", "Part Time", "Casual"] },
    employerName: String,
    employerPhone: String,
    lengthOfEmployment: String,
    weeklyIncome: String,
    idDocumentUrls: [String],
    proofOfIncomeUrls: [String],
    signatureName: { type: String, required: true },
  },
  { _id: false }
);

const TenancyApplicationSchema = new Schema<ITenancyApplication>(
  {
    propertyAddress: { type: String, required: true },
    propertySlug: String,
    commencementDate: Date,
    rentPerWeek: String,
    rentPerMonth: String,
    bond: String,
    leaseTermYears: String,
    leaseTermMonths: String,
    occupantsAdults: String,
    occupantsChildrenAges: String,

    title: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    knownByOtherName: { type: String, enum: YES_NO, required: legacyRequired },
    otherName: String,
    hasDependents: { type: String, enum: YES_NO, required: legacyRequired },
    dependentsAges: String,
    totalApplicants: String,
    dependentsNames: String,
    dateOfBirth: { type: Date, required: legacyRequired },
    email: { type: String, required: true },
    mobilePhone: { type: String, required: true },
    homePhone: String,
    workPhone: String,
    driversLicenceNumber: String,
    driversLicenceExpiry: Date,
    vehicleRegistration: String,
    vehicleRegistrationState: String,
    passportNumber: String,
    passportExpiry: Date,
    passportCountry: String,
    pensionMedicareNumber: String,
    pensionType: String,

    idDocumentsProvided: [String],
    idDocumentUrls: [String],
    proofOfIncomeUrls: [String],
    rentalHistoryUrls: [String],

    currentAddress: { type: String, required: legacyRequired },
    currentPostcode: String,
    currentLengthOfStay: String,
    currentRent: String,
    currentReasonForLeaving: String,
    currentBondRefundedInFull: { type: String, enum: YES_NO },
    currentBondRefundReason: String,
    currentLandlordAgent: String,
    currentLandlordContact: String,

    previousAddress: String,
    previousPostcode: String,
    previousLengthOfStay: String,
    previousRent: String,
    previousReasonForLeaving: String,
    previousBondRefundedInFull: { type: String, enum: YES_NO },
    previousBondRefundReason: String,
    previousLandlordAgent: String,
    previousLandlordContact: String,

    presentOccupation: String,
    natureOfEmployment: { type: String, enum: ["Full Time", "Part Time", "Casual"] },
    employerName: String,
    employerAddress: String,
    employerContactName: String,
    employerPhone: String,
    lengthOfEmployment: String,
    weeklyIncome: String,

    nextOfKinLastName: String,
    nextOfKinGivenName: String,
    nextOfKinHomeNumber: String,
    nextOfKinMobileNumber: String,
    nextOfKinRelationship: String,

    reference1LastName: String,
    reference1GivenName: String,
    reference1HomeNumber: String,
    reference1MobileNumber: String,
    reference1Relationship: String,
    reference1Address: String,
    reference2LastName: String,
    reference2GivenName: String,
    reference2HomeNumber: String,
    reference2MobileNumber: String,
    reference2Relationship: String,
    reference2Address: String,

    selfEmployed: { type: Boolean, default: false },
    businessName: String,
    selfEmployedDuration: String,
    abn: String,
    businessAddress: String,
    accountantName: String,
    accountantPhone: String,

    isStudent: { type: Boolean, default: false },
    studentIdNumber: String,
    overseasStudent: { type: String, enum: YES_NO },
    visaExpiry: Date,

    everEvicted: { type: String, enum: YES_NO, required: legacyRequired },
    reasonAffectingRentAbility: { type: String, enum: YES_NO, required: legacyRequired },
    lastBondRefundedInFull: { type: String, enum: YES_NO, required: legacyRequired },
    inDebtToAgent: { type: String, enum: YES_NO, required: legacyRequired },
    bondDeductionsOrDebtExplanation: String,

    consentOneFormPerApplicant: { type: Boolean, required: legacyRequired },
    consentPrivacyPolicyReceived: { type: Boolean, required: legacyRequired },
    consentBindingApplication: { type: Boolean, required: legacyRequired },

    childrenCountAges: String,
    pets: String,
    vehicleMakeTypeRego: String,
    smoker: { type: String, enum: YES_NO, required: legacyRequired },

    signatureName: { type: String, required: true },
    signedAt: { type: Date, required: true },

    coApplicant: { type: CoApplicantSchema, required: false },

    formVersion: Number,
    v2: Schema.Types.Mixed,
    coApplicantName: String,

    status: { type: String, enum: ["new", "reviewed", "approved", "declined"], default: "new" },
  },
  { timestamps: true }
);

export const TenancyApplication: Model<ITenancyApplication> =
  models.TenancyApplication || model<ITenancyApplication>("TenancyApplication", TenancyApplicationSchema);

export default TenancyApplication;
