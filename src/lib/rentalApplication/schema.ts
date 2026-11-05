import { z } from "zod";
import { ADDRESS_REF_TYPES, EMPLOYMENT_TYPES, INCOME_TYPES, INTRO_MAX, LEASE_TERMS, MONTHS, PAY_FREQUENCIES, PET_COUNTS, PHOTO_ID_TYPES, SECOND_ID_TYPES } from "./constants";

/**
 * Strict shape check for a submitted application (server side). Every
 * string is length-capped and every choice is an enum; validate.ts then
 * applies the "is it complete" rules on top.
 */
const s = (max = 200) => z.string().trim().max(max);
const opt = <T extends readonly [string, ...string[]]>(values: T) => z.union([z.enum(values), z.literal("")]);
const yesNo = opt(["Yes", "No"] as const);
const month = opt(MONTHS as unknown as [string, ...string[]]);
const year = z.string().regex(/^(|\d{4})$/);

const fileRef = z.object({
  key: z.string().regex(/^pending\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$/),
  name: s(200),
  size: z.number().int().nonnegative(),
  type: s(50),
});

const idDoc = (types: string[]) =>
  z.object({ type: opt(types as unknown as [string, ...string[]]), files: z.array(fileRef).max(4) }).nullable();

const person = z.object({
  personal: z.object({
    firstName: s(80),
    lastName: s(80),
    dobDay: z.string().regex(/^(|\d{1,2})$/),
    dobMonth: z.string().regex(/^(|\d{1,2})$/),
    dobYear: year,
    mobile: s(20),
    email: s(200),
  }),
  employment: z.object({
    type: opt(EMPLOYMENT_TYPES),
    company: s(),
    role: s(),
    startMonth: month,
    startYear: year,
    refName: s(120),
    refEmail: s(200),
    refPhone: s(20),
  }),
  finances: z.object({
    incomes: z
      .array(
        z.object({
          id: s(40),
          type: z.enum(INCOME_TYPES as unknown as [string, ...string[]]),
          frequency: z.enum(PAY_FREQUENCIES as unknown as [string, ...string[]]),
          amount: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter an amount"),
        })
      )
      .max(15),
    noIncome: z.boolean(),
    proof: z.array(fileRef).max(10),
  }),
  ids: z.object({ photo: idDoc(PHOTO_ID_TYPES), second: idDoc(SECOND_ID_TYPES) }),
});

const address = z.object({
  id: s(40),
  full: s(300),
  manual: z.boolean(),
  street: s(),
  suburb: s(100),
  state: s(40),
  postcode: s(10),
  country: s(80),
  moveInMonth: month,
  moveInYear: year,
  owned: yesNo,
  refType: opt(ADDRESS_REF_TYPES),
  refName: s(120),
  refEmail: s(200),
  refPhone: s(20),
});

const petCount = z.enum(PET_COUNTS);

export const applicationSchema = z.object({
  propertyAddress: s(300),
  lease: z.object({
    inspected: opt(["yes", "no"] as const),
    startDate: z.string().regex(/^(|\d{4}-\d{2}-\d{2})$/),
    termMonths: opt(LEASE_TERMS as unknown as [string, ...string[]]),
  }),
  applicant: person,
  second: person.extend({ relationship: s(60) }).nullable(),
  about: z.object({ intro: z.string().max(INTRO_MAX), docs: z.array(fileRef).max(5) }),
  addresses: z.array(address).max(6),
  history: z.object({ evicted: yesNo, owesMoney: yesNo, explanation: s(2000) }),
  emergency: z.object({ name: s(120), relationship: s(60), mobile: s(20), email: s(200) }),
  people: z.object({ others: yesNo, adults: z.string().regex(/^\d{1,2}$/), children: z.string().regex(/^\d{1,2}$/) }),
  pets: z.object({ dogs: petCount, cats: petCount, other: petCount, details: s(1000) }),
  declaration: z.object({ c1: z.boolean(), c2: z.boolean(), c3: z.boolean(), signature: s(160), coSignature: s(160) }),
  saved: z.record(z.string(), z.boolean()),
});

export const submitSchema = z.object({
  propertySlug: s(200).optional(),
  uploadSession: z.string().uuid(),
  startedAt: z.number(),
  website: z.string().max(200).optional(), // honeypot
  data: applicationSchema,
});
