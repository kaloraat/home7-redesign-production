/**
 * Rental application (v2, "hub and sections" form). Shared by the public
 * form, the submit route, the admin page and the PDF, so all four always
 * agree on the shape.
 */

export type YesNo = "Yes" | "No" | "";

/** A file already uploaded to the private bucket. `key` is never a public URL. */
export type FileRef = { key: string; name: string; size: number; type: string };

export type Income = { id: string; type: string; frequency: string; amount: string };

export type IdDoc = { type: string; files: FileRef[] };

export type EmploymentType = "" | "Employed" | "Self-employed" | "Student" | "Not employed";

export type Person = {
  personal: {
    firstName: string;
    lastName: string;
    dobDay: string;
    dobMonth: string;
    dobYear: string;
    mobile: string;
    email: string;
  };
  employment: {
    type: EmploymentType;
    company: string;
    role: string;
    startMonth: string;
    startYear: string;
    refName: string;
    refEmail: string;
    refPhone: string;
  };
  finances: { incomes: Income[]; noIncome: boolean; proof: FileRef[] };
  ids: { photo: IdDoc | null; second: IdDoc | null };
};

export type Address = {
  id: string;
  /** Free text from the address search, or built from the manual fields. */
  full: string;
  manual: boolean;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  moveInMonth: string;
  moveInYear: string;
  owned: YesNo;
  refType: "" | "Agent" | "Landlord" | "Other";
  refName: string;
  refEmail: string;
  refPhone: string;
};

export type PetCount = "0" | "1" | "2" | "3" | "4+";

export type SectionId =
  | "personal"
  | "about"
  | "addresses"
  | "employment"
  | "finances"
  | "ids"
  | "emergency"
  | "people"
  | "pets"
  | "second";

export type ApplicationData = {
  /** Only used when the page wasn't opened from a listing. */
  propertyAddress: string;
  lease: { inspected: "" | "yes" | "no"; startDate: string; termMonths: string };
  applicant: Person;
  second: (Person & { relationship: string }) | null;
  about: { intro: string; docs: FileRef[] };
  /** [0] is the current address, then previous ones, newest first. */
  addresses: Address[];
  history: { evicted: YesNo; owesMoney: YesNo; explanation: string };
  emergency: { name: string; relationship: string; mobile: string; email: string };
  people: { others: YesNo; adults: string; children: string };
  pets: { dogs: PetCount; cats: PetCount; other: PetCount; details: string };
  declaration: { c1: boolean; c2: boolean; c3: boolean; signature: string; coSignature: string };
  /** Sections the applicant has pressed "Save and back" on at least once. */
  saved: Partial<Record<SectionId, boolean>>;
};

export function emptyPerson(): Person {
  return {
    personal: { firstName: "", lastName: "", dobDay: "", dobMonth: "", dobYear: "", mobile: "", email: "" },
    employment: { type: "", company: "", role: "", startMonth: "", startYear: "", refName: "", refEmail: "", refPhone: "" },
    finances: { incomes: [], noIncome: false, proof: [] },
    ids: { photo: null, second: null },
  };
}

export function emptyAddress(id: string): Address {
  return {
    id,
    full: "",
    manual: false,
    street: "",
    suburb: "",
    state: "NSW",
    postcode: "",
    country: "Australia",
    moveInMonth: "",
    moveInYear: "",
    owned: "",
    refType: "",
    refName: "",
    refEmail: "",
    refPhone: "",
  };
}

export function emptyApplication(): ApplicationData {
  return {
    propertyAddress: "",
    lease: { inspected: "", startDate: "", termMonths: "" },
    applicant: emptyPerson(),
    second: null,
    about: { intro: "", docs: [] },
    addresses: [],
    history: { evicted: "", owesMoney: "", explanation: "" },
    emergency: { name: "", relationship: "", mobile: "", email: "" },
    people: { others: "", adults: "0", children: "0" },
    pets: { dogs: "0", cats: "0", other: "0", details: "" },
    declaration: { c1: false, c2: false, c3: false, signature: "", coSignature: "" },
    saved: {},
  };
}
