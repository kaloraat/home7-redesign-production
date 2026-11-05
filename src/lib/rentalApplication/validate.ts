import { REQUIRE_ID_AT_APPLICATION, INTRO_MAX, MONTHS } from "./constants";
import type { Address, ApplicationData, Person, SectionId } from "./types";

/**
 * One set of rules for the browser and the server. Each validator returns
 * { "field.path": "message" }; an empty object means the section is OK.
 * The submit route runs validateAll() on the parsed body, so nothing the
 * browser skips gets through.
 */
export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const digits = (s: string) => s.replace(/\D/g, "");
const isMobile = (s: string) => /^0\d{9}$/.test(digits(s));
const isPhone = (s: string) => /^\d{8,15}$/.test(digits(s));
const blank = (s: string | undefined | null) => !s || !s.trim();

function req(errors: Errors, path: string, value: string, msg: string) {
  if (blank(value)) errors[path] = msg;
}
function optEmail(errors: Errors, path: string, value: string) {
  if (!blank(value) && !EMAIL.test(value.trim())) errors[path] = "Enter a valid email address";
}

/** Months between a Month/Year move-in and today (0 if blank or invalid). */
export function monthsSince(month: string, year: string, now = new Date()): number {
  const m = MONTHS.indexOf(month);
  const y = Number(year);
  if (m < 0 || !y) return 0;
  return (now.getFullYear() - y) * 12 + (now.getMonth() - m);
}

/** Does the address list cover at least two years? */
export function coversTwoYears(addresses: Address[]): boolean {
  const oldest = addresses[addresses.length - 1];
  return !!oldest && monthsSince(oldest.moveInMonth, oldest.moveInYear) >= 24;
}

export function validatePersonal(p: Person["personal"], prefix = ""): Errors {
  const e: Errors = {};
  req(e, `${prefix}firstName`, p.firstName, "Enter a first name");
  req(e, `${prefix}lastName`, p.lastName, "Enter a last name");
  const d = Number(p.dobDay), m = Number(p.dobMonth), y = Number(p.dobYear);
  const date = new Date(y, m - 1, d);
  const valid = d && m && y && date.getDate() === d && date.getMonth() === m - 1;
  const age = valid ? (Date.now() - date.getTime()) / (365.25 * 864e5) : 0;
  if (!valid) e[`${prefix}dob`] = "Select a date of birth";
  else if (age < 16 || age > 110) e[`${prefix}dob`] = "Check the date of birth";
  if (blank(p.mobile)) e[`${prefix}mobile`] = "Enter a mobile number";
  else if (!isMobile(p.mobile)) e[`${prefix}mobile`] = "Enter 10 digits, starting with 0";
  if (blank(p.email)) e[`${prefix}email`] = "Enter an email address";
  else optEmail(e, `${prefix}email`, p.email);
  return e;
}

export function validateEmployment(emp: Person["employment"], prefix = ""): Errors {
  const e: Errors = {};
  if (!emp.type) {
    e[`${prefix}type`] = "Choose an employment type";
    return e;
  }
  if (emp.type === "Not employed") return e;
  const isStudent = emp.type === "Student";
  req(e, `${prefix}company`, emp.company, isStudent ? "Enter your school or institution" : "Enter the company name");
  req(e, `${prefix}role`, emp.role, isStudent ? "Enter your course" : "Enter your role or title");
  if (!emp.startMonth || !emp.startYear) e[`${prefix}start`] = "Select a start month and year";
  if (emp.type === "Employed") {
    req(e, `${prefix}refName`, emp.refName, "Enter the reference's full name");
    if (blank(emp.refPhone)) e[`${prefix}refPhone`] = "Enter the reference's phone";
    else if (!isPhone(emp.refPhone)) e[`${prefix}refPhone`] = "Enter a valid phone number";
  } else if (!blank(emp.refPhone) && !isPhone(emp.refPhone)) {
    e[`${prefix}refPhone`] = "Enter a valid phone number";
  }
  optEmail(e, `${prefix}refEmail`, emp.refEmail);
  return e;
}

export function validateFinances(f: Person["finances"], prefix = ""): Errors {
  const e: Errors = {};
  if (!f.noIncome && f.incomes.length === 0) {
    e[`${prefix}incomes`] = "Add at least one income source, or tick that you don't receive any income";
  }
  if (!f.noIncome && f.proof.length === 0) e[`${prefix}proof`] = "Upload proof you can pay rent";
  return e;
}

export function validateIds(ids: Person["ids"], prefix = ""): Errors {
  const e: Errors = {};
  const check = (doc: Person["ids"]["photo"], path: string, label: string) => {
    if (!doc) {
      if (REQUIRE_ID_AT_APPLICATION) e[path] = `Add your ${label}`;
      return;
    }
    if (!doc.type) e[path] = `Choose the type of ${label}`;
    else if (doc.files.length === 0) e[path] = `Upload your ${label}`;
  };
  check(ids.photo, `${prefix}photo`, "photo ID");
  check(ids.second, `${prefix}second`, "second ID");
  return e;
}

export function validateAddress(a: Address): Errors {
  const e: Errors = {};
  if (a.manual) {
    req(e, "street", a.street, "Enter the street address");
    req(e, "suburb", a.suburb, "Enter the suburb");
    req(e, "postcode", a.postcode, "Enter the postcode");
    req(e, "country", a.country, "Enter the country");
  } else {
    req(e, "full", a.full, "Search for the address, or enter it manually");
  }
  if (!a.moveInMonth || !a.moveInYear) e.moveIn = "Select when you moved in";
  else if (monthsSince(a.moveInMonth, a.moveInYear) < 0) e.moveIn = "The move-in date can't be in the future";
  if (!a.owned) e.owned = "Choose Yes or No";
  if (a.owned === "No") {
    if (!a.refType) e.refType = "Choose a reference type";
    req(e, "refName", a.refName, "Enter the reference's full name");
    if (blank(a.refPhone) && blank(a.refEmail)) e.refPhone = "Enter a phone number or email for the reference";
    else if (!blank(a.refPhone) && !isPhone(a.refPhone)) e.refPhone = "Enter a valid phone number";
    optEmail(e, "refEmail", a.refEmail);
  }
  return e;
}

export function validateAddresses(app: ApplicationData): Errors {
  const e: Errors = {};
  if (app.addresses.length === 0) e.addresses = "Add your current address";
  app.addresses.forEach((a, i) => {
    if (Object.keys(validateAddress(a)).length) e[`addresses.${i}`] = "This address is incomplete";
  });
  // Moving in order: each older address must start before the newer one.
  for (let i = 1; i < app.addresses.length; i++) {
    const newer = monthsSince(app.addresses[i - 1].moveInMonth, app.addresses[i - 1].moveInYear);
    const older = monthsSince(app.addresses[i].moveInMonth, app.addresses[i].moveInYear);
    if (older <= newer) e[`addresses.${i}`] = "A previous address must start before the one after it";
  }
  if (app.addresses.length > 0 && !e.addresses && !coversTwoYears(app.addresses)) {
    e.coverage = "Add your previous address so we have at least two years of history";
  }
  if (!app.history.evicted) e["history.evicted"] = "Choose Yes or No";
  if (!app.history.owesMoney) e["history.owesMoney"] = "Choose Yes or No";
  if ((app.history.evicted === "Yes" || app.history.owesMoney === "Yes") && blank(app.history.explanation)) {
    e["history.explanation"] = "Please explain";
  }
  return e;
}

export function validateSection(id: SectionId, app: ApplicationData): Errors {
  switch (id) {
    case "personal":
      return validatePersonal(app.applicant.personal);
    case "about": {
      const e: Errors = {};
      if (app.about.intro.length > INTRO_MAX) e.intro = `Keep it under ${INTRO_MAX} characters`;
      return e;
    }
    case "addresses":
      return validateAddresses(app);
    case "employment":
      return validateEmployment(app.applicant.employment);
    case "finances":
      return validateFinances(app.applicant.finances);
    case "ids":
      return validateIds(app.applicant.ids);
    case "emergency": {
      const e: Errors = {};
      const c = app.emergency;
      req(e, "name", c.name, "Enter their full name");
      req(e, "relationship", c.relationship, "Choose a relationship");
      if (blank(c.mobile)) e.mobile = "Enter their mobile";
      else if (!isPhone(c.mobile)) e.mobile = "Enter a valid phone number";
      optEmail(e, "email", c.email);
      return e;
    }
    case "people": {
      const e: Errors = {};
      const p = app.people;
      if (!p.others) e.others = "Choose Yes or No";
      if (p.others === "Yes") {
        const a = Number(p.adults), c = Number(p.children);
        if (!Number.isInteger(a) || a < 0 || a > 20) e.adults = "Enter a number";
        if (!Number.isInteger(c) || c < 0 || c > 20) e.children = "Enter a number";
      }
      return e;
    }
    case "pets":
      return app.pets.details.length > 1000 ? { details: "Keep it under 1000 characters" } : {};
    case "second": {
      const s = app.second;
      if (!s) return {};
      const e: Errors = {
        ...validatePersonal(s.personal, "personal."),
        ...validateEmployment(s.employment, "employment."),
        ...validateFinances(s.finances, "finances."),
        ...validateIds(s.ids, "ids."),
      };
      if (blank(s.relationship)) e.relationship = "Choose a relationship";
      return e;
    }
  }
}

/** Sections that can be left untouched and still submit. */
export function isOptional(id: SectionId): boolean {
  return id === "about" || id === "pets" || (id === "ids" && !REQUIRE_ID_AT_APPLICATION);
}

export function validateLease(app: ApplicationData, hasListing: boolean): Errors {
  const e: Errors = {};
  if (!hasListing) req(e, "propertyAddress", app.propertyAddress, "Enter the address of the property you're applying for");
  if (!app.lease.inspected) e.inspected = "Choose an option";
  if (!app.lease.startDate) e.startDate = "Choose a start date";
  if (!app.lease.termMonths) e.termMonths = "Choose a lease term";
  return e;
}

export function validateDeclaration(app: ApplicationData): Errors {
  const e: Errors = {};
  const d = app.declaration;
  if (!d.c1 || !d.c2 || !d.c3) e.checks = "Tick all three acknowledgements";
  req(e, "signature", d.signature, "Type your full name to sign");
  if (app.second) req(e, "coSignature", d.coSignature, "The second applicant must type their full name to sign");
  return e;
}

export const SECTION_ORDER: SectionId[] = ["personal", "about", "addresses", "employment", "finances", "ids", "emergency", "people", "second", "pets"];

/** Everything wrong with the application, grouped by where it's fixed. */
export function validateAll(app: ApplicationData, hasListing: boolean) {
  const sections: Partial<Record<SectionId, Errors>> = {};
  for (const id of SECTION_ORDER) {
    if (id === "second" && !app.second) continue;
    const errs = validateSection(id, app);
    const unsavedRequired = !isOptional(id) && !app.saved[id];
    if (Object.keys(errs).length || unsavedRequired) sections[id] = errs;
  }
  return { sections, lease: validateLease(app, hasListing), declaration: validateDeclaration(app) };
}
