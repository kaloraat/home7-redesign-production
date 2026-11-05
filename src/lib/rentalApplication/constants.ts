/**
 * Set to true to make applicants upload two IDs before they can submit.
 * While false, ID is optional and can be collected later if the
 * application is selected.
 */
export const REQUIRE_ID_AT_APPLICATION = false;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB each
export const MAX_FILES_PER_APPLICATION = 40;

/** Extension → content type we sign uploads with. Anything else is refused. */
export const ALLOWED_UPLOADS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};
// No HEIC on purpose: when a page doesn't accept HEIC, iPhones convert
// photos to JPEG before uploading, so everything we store is JPG/PNG/PDF
// (and every image can be embedded in the admin PDF).
export const IMAGE_ONLY_EXTS = ["jpg", "jpeg", "png"];
export const ACCEPT_ALL = ".pdf,.jpg,.jpeg,.png";
export const ACCEPT_IMAGES = ".jpg,.jpeg,.png";

export type UploadCategory = "about" | "proof-a" | "proof-b" | "id-a" | "id-b";

export const LEASE_TERMS = ["6", "12", "18", "24"];

export const EMPLOYMENT_TYPES = ["Employed", "Self-employed", "Student", "Not employed"] as const;

export const INCOME_TYPES = [
  "Salary",
  "Overtime",
  "Commission",
  "Bonus",
  "Pension",
  "Family allowance",
  "Child support",
  "Existing rental income",
  "Superannuation",
  "Dividends",
  "Other",
];

export const PAY_FREQUENCIES = ["Weekly", "Fortnightly", "Monthly", "Yearly"];

export const PHOTO_ID_TYPES = ["Australian driver licence", "Australian passport", "Overseas passport", "Other photo ID"];
export const SECOND_ID_TYPES = ["Medicare card", "Birth certificate", "Student ID", "Proof of age card", "Other"];

export const RELATIONSHIPS = ["Parent", "Sibling", "Child", "Partner", "Relative", "Friend", "Colleague", "Other"];
export const SECOND_APPLICANT_RELATIONSHIPS = ["Partner", "Spouse", "Family member", "Friend", "Housemate", "Other"];

export const ADDRESS_REF_TYPES = ["Agent", "Landlord", "Other"] as const;

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export const PET_COUNTS = ["0", "1", "2", "3", "4+"] as const;

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const INTRO_MAX = 3000;

/** The existing declaration wording, word for word from the previous form. */
export const DECLARATION = {
  c1: "I acknowledge that every adult applying must be named on this application or complete their own.",
  c2Before: "I acknowledge that I have received Home7 Real Estate's ",
  c2Link: "Privacy Policy",
  c2After: ".",
  c3: "I acknowledge that both the lessor and I are bound by this application immediately upon the lessor or their agent communicating its acceptance.",
};
