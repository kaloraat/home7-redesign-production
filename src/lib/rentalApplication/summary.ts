import { MONTHS } from "./constants";
import type { Address, ApplicationData, FileRef, Person, SectionId } from "./types";

export function addressText(a: Address): string {
  if (!a.manual) return a.full;
  return [a.street, a.suburb, [a.state, a.postcode].filter(Boolean).join(" "), a.country !== "Australia" ? a.country : ""]
    .filter(Boolean)
    .join(", ");
}

export const personName = (p: Person["personal"]) => [p.firstName, p.lastName].filter(Boolean).join(" ");

export function peopleSummary(app: ApplicationData): string {
  const leaseholders = app.second ? 2 : 1;
  const extra = app.people.others === "Yes" ? Number(app.people.adults || 0) + Number(app.people.children || 0) : 0;
  const total = leaseholders + extra;
  return `${total} ${total === 1 ? "person" : "people"} (${leaseholders} leaseholder${leaseholders > 1 ? "s" : ""})`;
}

/** One line under a completed hub row. */
export function sectionSummary(id: SectionId, app: ApplicationData): string {
  const a = app.applicant;
  switch (id) {
    case "personal":
      return [personName(a.personal), a.personal.email].filter(Boolean).join(" · ");
    case "about":
      return app.about.intro ? `${app.about.intro.slice(0, 60)}${app.about.intro.length > 60 ? "…" : ""}` : `${app.about.docs.length} document(s)`;
    case "addresses":
      return app.addresses[0] ? `${addressText(app.addresses[0])}${app.addresses.length > 1 ? ` + ${app.addresses.length - 1} previous` : ""}` : "";
    case "employment":
      return [a.employment.type, a.employment.company].filter(Boolean).join(" · ");
    case "finances":
      return a.finances.noIncome ? "No current income" : `${a.finances.incomes.length} income source(s) · ${a.finances.proof.length} file(s)`;
    case "ids": {
      const n = [a.ids.photo, a.ids.second].filter((d) => d && d.files.length).length;
      return n ? `${n} of 2 IDs uploaded` : "Not provided yet";
    }
    case "emergency":
      return [app.emergency.name, app.emergency.relationship].filter(Boolean).join(" · ");
    case "people":
      return peopleSummary(app);
    case "pets": {
      const names = { dogs: ["dog", "dogs"], cats: ["cat", "cats"], other: ["other pet", "other pets"] } as const;
      const parts = (["dogs", "cats", "other"] as const)
        .filter((k) => app.pets[k] !== "0")
        .map((k) => `${app.pets[k]} ${names[k][app.pets[k] === "1" ? 0 : 1]}`);
      return parts.length ? parts.join(", ") : "No pets";
    }
    case "second":
      return app.second ? personName(app.second.personal) || "Second leaseholder" : "";
  }
}

/* ---------- Admin / PDF view: label-value groups ---------- */

export type ViewField = { label: string; value: string };
export type ViewGroup = { title: string; fields: ViewField[] };
export type ViewFiles = { label: string; files: FileRef[] };

const f = (label: string, value: string | number | undefined | null): ViewField | null =>
  value === undefined || value === null || String(value).trim() === "" ? null : { label, value: String(value) };
const keep = (arr: (ViewField | null)[]) => arr.filter((x): x is ViewField => x !== null);

function dob(p: Person["personal"]) {
  return p.dobDay && p.dobMonth && p.dobYear ? `${p.dobDay.padStart(2, "0")}/${p.dobMonth.padStart(2, "0")}/${p.dobYear}` : "";
}

function personGroups(p: Person, who: string): ViewGroup[] {
  const e = p.employment;
  const isStudent = e.type === "Student";
  return [
    {
      title: `${who}: personal details`,
      fields: keep([f("Name", personName(p.personal)), f("Date of birth", dob(p.personal)), f("Mobile", p.personal.mobile), f("Email", p.personal.email)]),
    },
    {
      title: `${who}: employment`,
      fields: keep([
        f("Type", e.type),
        f(isStudent ? "Institution" : "Company", e.company),
        f(isStudent ? "Course" : "Role", e.role),
        f("Started", [e.startMonth, e.startYear].filter(Boolean).join(" ")),
        f("Reference", e.refName),
        f("Reference phone", e.refPhone),
        f("Reference email", e.refEmail),
      ]),
    },
    {
      title: `${who}: finances`,
      fields: p.finances.noIncome
        ? [{ label: "Income", value: "Currently doesn't receive any income" }]
        : p.finances.incomes.map((i, n) => ({ label: `Income ${n + 1}`, value: `${i.type}: $${i.amount} ${i.frequency.toLowerCase()} (after tax)` })),
    },
  ];
}

function personFiles(p: Person, who: string): ViewFiles[] {
  return [
    { label: `${who}: proof of income`, files: p.finances.proof },
    { label: `${who}: photo ID${p.ids.photo ? ` (${p.ids.photo.type})` : ""}`, files: p.ids.photo?.files ?? [] },
    { label: `${who}: second ID${p.ids.second ? ` (${p.ids.second.type})` : ""}`, files: p.ids.second?.files ?? [] },
  ];
}

export function applicationView(app: ApplicationData, extra: { propertyAddress: string; rentPerWeek?: number | null }) {
  const two = !!app.second;
  const who1 = two ? "Applicant 1" : "Applicant";
  const groups: ViewGroup[] = [
    {
      title: "Property and lease",
      fields: keep([
        f("Property", extra.propertyAddress),
        f("Rent per week (from listing)", extra.rentPerWeek ? `$${extra.rentPerWeek}` : ""),
        f("Inspected", app.lease.inspected === "yes" ? "Yes, has inspected or plans to" : app.lease.inspected === "no" ? "No, accepts it as is" : ""),
        f("Preferred start", app.lease.startDate ? new Date(app.lease.startDate).toLocaleDateString("en-AU") : ""),
        f("Lease term", app.lease.termMonths ? `${app.lease.termMonths} months` : ""),
      ]),
    },
    ...personGroups(app.applicant, who1),
    ...(app.second
      ? [
          { title: "Applicant 2: relationship", fields: keep([f("Relationship to applicant 1", app.second.relationship)]) },
          ...personGroups(app.second, "Applicant 2"),
        ]
      : []),
    { title: "About me", fields: keep([f("Introduction", app.about.intro)]) },
    ...app.addresses.map((a, i) => ({
      title: i === 0 ? "Current address" : `Previous address ${i}`,
      fields: keep([
        f("Address", addressText(a)),
        f("Moved in", [a.moveInMonth, a.moveInYear].filter(Boolean).join(" ")),
        f("Owns the property", a.owned),
        f("Reference type", a.owned === "No" ? a.refType : ""),
        f("Reference name", a.owned === "No" ? a.refName : ""),
        f("Reference phone", a.owned === "No" ? a.refPhone : ""),
        f("Reference email", a.owned === "No" ? a.refEmail : ""),
      ]),
    })),
    {
      title: "Rental history",
      fields: keep([
        f("Ever evicted by an agent or lessor", app.history.evicted),
        f("Owes money to another agent or lessor", app.history.owesMoney),
        f("Explanation", app.history.explanation),
      ]),
    },
    {
      title: "Emergency contact",
      fields: keep([f("Name", app.emergency.name), f("Relationship", app.emergency.relationship), f("Mobile", app.emergency.mobile), f("Email", app.emergency.email)]),
    },
    {
      title: "Household",
      fields: keep([
        f("Summary", peopleSummary(app)),
        f("Other adults (not on lease)", app.people.others === "Yes" ? app.people.adults : "0"),
        f("Children", app.people.others === "Yes" ? app.people.children : "0"),
        f("Dogs", app.pets.dogs),
        f("Cats", app.pets.cats),
        f("Other pets", app.pets.other),
        f("Pet details", app.pets.details),
      ]),
    },
    {
      title: "Declaration",
      fields: keep([f(two ? "Signed (applicant 1)" : "Signed", app.declaration.signature), f("Signed (applicant 2)", two ? app.declaration.coSignature : "")]),
    },
  ].filter((g) => g.fields.length > 0);

  const files: ViewFiles[] = [
    ...personFiles(app.applicant, who1),
    ...(app.second ? personFiles(app.second, "Applicant 2") : []),
    { label: "About me: supporting documents", files: app.about.docs },
  ].filter((g) => g.files.length > 0);

  return { groups, files };
}

export const monthName = (i: number) => MONTHS[i];
