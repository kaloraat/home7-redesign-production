"use client";

import { useId, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  ACCEPT_ALL, ACCEPT_IMAGES, ADDRESS_REF_TYPES, AU_STATES, EMPLOYMENT_TYPES, INCOME_TYPES, INTRO_MAX, PAY_FREQUENCIES,
  PET_COUNTS, PHOTO_ID_TYPES, RELATIONSHIPS, REQUIRE_ID_AT_APPLICATION, SECOND_APPLICANT_RELATIONSHIPS, SECOND_ID_TYPES,
} from "@/lib/rentalApplication/constants";
import { addressText } from "@/lib/rentalApplication/summary";
import { coversTwoYears, validateAddress, type Errors } from "@/lib/rentalApplication/validate";
import { emptyAddress, emptyPerson, type Address, type ApplicationData, type IdDoc, type Income, type Person, type SectionId } from "@/lib/rentalApplication/types";
import {
  Checkbox, DobSelects, Field, FieldError, FileUpload, InfoBox, ItemCard, Modal, MonthYear, RadioList, Segmented, SelectInput,
  TextInput, aria, inputCls, secondaryBtn, shadedBox,
} from "./ui";

export type Update = (fn: (d: ApplicationData) => void) => void;
export type SectionProps = { draft: ApplicationData; update: Update; errors: Errors; session: string };

/** Errors under `prefix.` with the prefix removed. */
function scope(errors: Errors, prefix: string): Errors {
  const out: Errors = {};
  for (const [k, v] of Object.entries(errors)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  return out;
}

const H3 = ({ children }: { children: React.ReactNode }) => <h2 className="pt-2 font-display text-xl text-brand-navy">{children}</h2>;

/* ======================= person blocks ======================= */

type PersonProps = { person: Person; set: (fn: (p: Person) => void) => void; errors: Errors; session: string; who: "a" | "b" };

function PersonalFields({ person, set, errors }: PersonProps) {
  const p = person.personal;
  return (
    <div className="space-y-5">
      <TextInput label="First name" value={p.firstName} autoComplete="given-name" maxLength={80} error={errors.firstName} onChange={(v) => set((x) => { x.personal.firstName = v; })} />
      <TextInput label="Last name" value={p.lastName} autoComplete="family-name" maxLength={80} error={errors.lastName} onChange={(v) => set((x) => { x.personal.lastName = v; })} />
      <DobSelects
        day={p.dobDay} month={p.dobMonth} year={p.dobYear} error={errors.dob}
        onChange={(v) => set((x) => {
          if (v.day !== undefined) x.personal.dobDay = v.day;
          if (v.month !== undefined) x.personal.dobMonth = v.month;
          if (v.year !== undefined) x.personal.dobYear = v.year;
        })}
      />
      <TextInput
        label="Mobile" value={p.mobile} type="tel" inputMode="numeric" autoComplete="tel" maxLength={20} error={errors.mobile}
        hint="Numbers only, 10 digits, e.g. 0412345678"
        onChange={(v) => set((x) => { x.personal.mobile = v.replace(/\D/g, "").slice(0, 10); })}
      />
      <TextInput label="Email" value={p.email} type="email" inputMode="email" autoComplete="email" error={errors.email} onChange={(v) => set((x) => { x.personal.email = v; })} />
    </div>
  );
}

function ChoiceGrid({ label, value, options, onChange, error }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void; error?: string }) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label key={o} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-base font-semibold has-checked:border-brand-navy has-checked:bg-brand-navy has-checked:text-white has-focus-visible:ring-4 has-focus-visible:ring-brand-gold ${error ? "border-red-600" : "border-slate-300"}`}>
            <input type="radio" name={id} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </fieldset>
  );
}

function EmploymentFields({ person, set, errors }: PersonProps) {
  const e = person.employment;
  const isStudent = e.type === "Student";
  const working = e.type === "Employed" || e.type === "Self-employed";
  return (
    <div className="space-y-5">
      <ChoiceGrid label="Employment type" value={e.type} options={EMPLOYMENT_TYPES} error={errors.type} onChange={(v) => set((x) => { x.employment.type = v as Person["employment"]["type"]; })} />
      {(working || isStudent) && (
        <>
          <TextInput label={isStudent ? "School, university or institution" : e.type === "Self-employed" ? "Business name" : "Company name"} value={e.company} error={errors.company} onChange={(v) => set((x) => { x.employment.company = v; })} />
          <TextInput label={isStudent ? "Course" : "Role or title"} value={e.role} error={errors.role} onChange={(v) => set((x) => { x.employment.role = v; })} />
          <MonthYear
            label={isStudent ? "When did you start?" : "Start date"} month={e.startMonth} year={e.startYear} error={errors.start}
            onChange={(v) => set((x) => {
              if (v.month !== undefined) x.employment.startMonth = v.month;
              if (v.year !== undefined) x.employment.startYear = v.year;
            })}
          />
        </>
      )}
      {working && (
        <div className={shadedBox}>
          <p className="font-display text-lg text-brand-navy">
            {e.type === "Self-employed" ? "Business reference (e.g. your accountant)" : "Employment reference"}
            {e.type === "Self-employed" && <span className="font-sans text-base font-normal text-slate-500"> (optional)</span>}
          </p>
          <p className="text-sm text-slate-600">Only list someone who has agreed to be contacted about your application.</p>
          <TextInput label="Full name" value={e.refName} error={errors.refName} onChange={(v) => set((x) => { x.employment.refName = v; })} />
          <TextInput label="Email" optional type="email" inputMode="email" value={e.refEmail} error={errors.refEmail} onChange={(v) => set((x) => { x.employment.refEmail = v; })} />
          <TextInput label="Phone" type="tel" inputMode="tel" maxLength={20} value={e.refPhone} error={errors.refPhone} onChange={(v) => set((x) => { x.employment.refPhone = v; })} />
        </div>
      )}
    </div>
  );
}

function IncomeModal({ initial, onClose, onSave }: { initial: Income; onClose: () => void; onSave: (i: Income) => void }) {
  const [item, setItem] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  function save() {
    const e: Errors = {};
    if (!item.type) e.type = "Choose an income type";
    if (!item.frequency) e.frequency = "Choose how often you're paid";
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(item.amount)) e.amount = "Enter an amount in dollars, e.g. 1250";
    setErrors(e);
    if (!Object.keys(e).length) onSave(item);
  }
  return (
    <Modal title={initial.type ? "Edit income source" : "Add income source"} onClose={onClose} onSave={save}>
      <SelectInput label="Type" value={item.type} options={INCOME_TYPES} error={errors.type} onChange={(v) => setItem({ ...item, type: v })} />
      <SelectInput label="Pay frequency" value={item.frequency} options={PAY_FREQUENCIES} error={errors.frequency} onChange={(v) => setItem({ ...item, frequency: v })} />
      <TextInput label="Amount after tax ($)" inputMode="decimal" value={item.amount} error={errors.amount} maxLength={10} onChange={(v) => setItem({ ...item, amount: v.replace(/[^\d.]/g, "") })} />
    </Modal>
  );
}

function FinancesFields({ person, set, errors, session }: PersonProps) {
  const f = person.finances;
  const [editing, setEditing] = useState<Income | null>(null);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">Sources of income</p>
        <div className="space-y-3">
          {f.incomes.map((i) => (
            <ItemCard
              key={i.id}
              title={i.type}
              lines={[`$${i.amount} ${i.frequency.toLowerCase()}, after tax`]}
              onEdit={() => setEditing(i)}
              onRemove={() => set((x) => { x.finances.incomes = x.finances.incomes.filter((y) => y.id !== i.id); })}
            />
          ))}
        </div>
        {!f.noIncome && (
          <button type="button" className={`${secondaryBtn} mt-3 w-full sm:w-auto`} onClick={() => setEditing({ id: crypto.randomUUID(), type: "", frequency: "", amount: "" })}>
            + Add income source
          </button>
        )}
        <FieldError error={errors.incomes} />
      </div>
      <Checkbox checked={f.noIncome} onChange={(v) => set((x) => { x.finances.noIncome = v; if (v) x.finances.incomes = []; })}>
        I currently don&apos;t receive any income
      </Checkbox>
      <FileUpload
        label="Proof you can pay rent"
        optional={f.noIncome}
        hint="Upload your three most recent payslips, or other documents that show your income or savings. On bank statements, hide your account numbers first."
        files={f.proof}
        session={session}
        accept={ACCEPT_ALL}
        error={errors.proof}
        onAdd={(file) => set((x) => { x.finances.proof.push(file); })}
        onRemove={(key) => set((x) => { x.finances.proof = x.finances.proof.filter((y) => y.key !== key); })}
      />
      {editing && (
        <IncomeModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            set((x) => {
              const i = x.finances.incomes.findIndex((y) => y.id === item.id);
              if (i >= 0) x.finances.incomes[i] = item;
              else x.finances.incomes.push(item);
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function IdModal({ title, types, initial, session, onClose, onSave }: { title: string; types: string[]; initial: IdDoc; session: string; onClose: () => void; onSave: (d: IdDoc) => void }) {
  const [doc, setDoc] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  function save() {
    const e: Errors = {};
    if (!doc.type) e.type = "Choose the type of ID";
    if (!doc.files.length) e.files = "Upload a photo or scan of this ID";
    setErrors(e);
    if (!Object.keys(e).length) onSave(doc);
  }
  return (
    <Modal title={title} onClose={onClose} onSave={save}>
      <RadioList label="Type of ID" value={doc.type} options={types.map((t) => ({ value: t, label: t }))} error={errors.type} onChange={(v) => setDoc((d) => ({ ...d, type: v }))} />
      <FileUpload
        label="Upload"
        hint="A clear photo or scan. Add the back as a second image if it has details on it."
        files={doc.files}
        session={session}
        accept={ACCEPT_IMAGES}
        maxFiles={2}
        error={errors.files}
        onAdd={(file) => setDoc((d) => ({ ...d, files: [...d.files, file] }))}
        onRemove={(key) => setDoc((d) => ({ ...d, files: d.files.filter((f) => f.key !== key) }))}
      />
    </Modal>
  );
}

function IdsFields({ person, set, errors, session }: PersonProps) {
  const [open, setOpen] = useState<"photo" | "second" | null>(null);
  const slot = (key: "photo" | "second", label: string) => {
    const doc = person.ids[key];
    return (
      <div>
        <p className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">{label}</p>
        {doc ? (
          <ItemCard
            title={doc.type}
            lines={[`${doc.files.length} image${doc.files.length === 1 ? "" : "s"} uploaded`]}
            error={errors[key]}
            onEdit={() => setOpen(key)}
            onRemove={() => set((x) => { x.ids[key] = null; })}
          />
        ) : (
          <>
            <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={() => setOpen(key)}>
              + {key === "photo" ? "Add photo ID" : "Add second ID"}
            </button>
            <FieldError error={errors[key]} />
          </>
        )}
      </div>
    );
  };
  return (
    <div className="space-y-5">
      <p className="text-base text-slate-700">Upload two IDs. At least one must have your photo.</p>
      {!REQUIRE_ID_AT_APPLICATION && <InfoBox>This section is optional. You can provide ID later if your application is selected.</InfoBox>}
      {slot("photo", "Photo ID")}
      {slot("second", "Second ID")}
      {open && (
        <IdModal
          title={open === "photo" ? "Add photo ID" : "Add second ID"}
          types={open === "photo" ? PHOTO_ID_TYPES : SECOND_ID_TYPES}
          initial={person.ids[open] ?? { type: "", files: [] }}
          session={session}
          onClose={() => setOpen(null)}
          onSave={(doc) => { set((x) => { x.ids[open] = doc; }); setOpen(null); }}
        />
      )}
    </div>
  );
}

const personSetter = (update: Update, who: "a" | "b") => (fn: (p: Person) => void) =>
  update((d) => { const p = who === "a" ? d.applicant : d.second; if (p) fn(p); });

/* ======================= sections ======================= */

function Personal({ draft, update, errors, session }: SectionProps) {
  return <PersonalFields person={draft.applicant} set={personSetter(update, "a")} errors={errors} session={session} who="a" />;
}

function About({ draft, update, errors, session }: SectionProps) {
  const id = useId();
  return (
    <div className="space-y-5">
      <Field id={id} label="Introduce yourself" optional hint="Tell the owner a little about you and who will live at the property." error={errors.intro}>
        <textarea
          {...aria(id, errors.intro, true)}
          rows={8}
          maxLength={INTRO_MAX}
          value={draft.about.intro}
          onChange={(e) => update((d) => { d.about.intro = e.target.value; })}
          className={`${inputCls} min-h-40`}
        />
        <p className="mt-1 text-right text-sm text-slate-500" aria-live="polite">{draft.about.intro.length}/{INTRO_MAX}</p>
      </Field>
      <FileUpload
        label="Supporting documents"
        optional
        hint="For example, a reference letter or a rental ledger from your current agent."
        files={draft.about.docs}
        session={session}
        accept={ACCEPT_ALL}
        maxFiles={5}
        onAdd={(f) => update((d) => { d.about.docs.push(f); })}
        onRemove={(key) => update((d) => { d.about.docs = d.about.docs.filter((x) => x.key !== key); })}
      />
    </div>
  );
}

function AddressModal({ initial, isCurrent, onClose, onSave }: { initial: Address; isCurrent: boolean; onClose: () => void; onSave: (a: Address) => void }) {
  const [a, setA] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [searching, setSearching] = useState(!initial.full || initial.manual);
  const set = (patch: Partial<Address>) => setA((x) => ({ ...x, ...patch }));
  function save() {
    const e = validateAddress(a);
    setErrors(e);
    if (!Object.keys(e).length) onSave({ ...a, full: a.manual ? addressText(a) : a.full.trim() });
  }
  return (
    <Modal title={isCurrent ? "Current address" : "Previous address"} onClose={onClose} onSave={save}>
      {!a.manual ? (
        <div>
          <p className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">Address</p>
          {searching ? (
            <AddressAutocomplete name="ra-address" placeholder="Start typing an address" inputClassName={inputCls} onChange={(v) => set({ full: v })} />
          ) : (
            <p className="rounded-lg bg-slate-100 px-3.5 py-3 text-base text-slate-900">
              {a.full}{" "}
              <button type="button" className="ml-1 font-semibold text-brand-navy underline underline-offset-4" onClick={() => { set({ full: "" }); setSearching(true); }}>Change</button>
            </p>
          )}
          <FieldError error={errors.full} />
          <button type="button" className="mt-2 min-h-11 text-base font-semibold text-brand-navy underline underline-offset-4" onClick={() => set({ manual: true })}>
            Can&apos;t find it? Enter it manually
          </button>
        </div>
      ) : (
        <>
          <TextInput label="Street address" value={a.street} autoComplete="address-line1" error={errors.street} onChange={(v) => set({ street: v })} />
          <TextInput label="Suburb" value={a.suburb} autoComplete="address-level2" error={errors.suburb} onChange={(v) => set({ suburb: v })} />
          <div className="grid grid-cols-2 gap-3">
            {a.country === "Australia" ? (
              <SelectInput label="State" value={a.state} options={AU_STATES} onChange={(v) => set({ state: v })} />
            ) : (
              <TextInput label="State or region" value={a.state} onChange={(v) => set({ state: v })} />
            )}
            <TextInput label="Postcode" value={a.postcode} inputMode="numeric" autoComplete="postal-code" maxLength={10} error={errors.postcode} onChange={(v) => set({ postcode: v })} />
          </div>
          <TextInput label="Country" value={a.country} autoComplete="country-name" error={errors.country} onChange={(v) => set({ country: v })} />
          <button type="button" className="min-h-11 text-base font-semibold text-brand-navy underline underline-offset-4" onClick={() => { set({ manual: false, full: "" }); setSearching(true); }}>
            Search for the address instead
          </button>
        </>
      )}
      <MonthYear
        label="When did you move in?" month={a.moveInMonth} year={a.moveInYear} error={errors.moveIn}
        onChange={(v) => set({ ...(v.month !== undefined && { moveInMonth: v.month }), ...(v.year !== undefined && { moveInYear: v.year }) })}
      />
      <Segmented label="Do you own the property?" value={a.owned} options={["Yes", "No"]} error={errors.owned} onChange={(v) => set({ owned: v as Address["owned"] })} />
      {a.owned === "No" && (
        <div className={shadedBox}>
          <p className="font-display text-lg text-brand-navy">Address reference</p>
          <p className="text-sm text-slate-600">The agent or landlord for this address. Only list someone who has agreed to be contacted.</p>
          <Segmented label="Reference type" value={a.refType} options={ADDRESS_REF_TYPES} error={errors.refType} onChange={(v) => set({ refType: v as Address["refType"] })} />
          <TextInput label="Full name" value={a.refName} error={errors.refName} onChange={(v) => set({ refName: v })} />
          <TextInput label="Email" optional type="email" inputMode="email" value={a.refEmail} error={errors.refEmail} onChange={(v) => set({ refEmail: v })} />
          <TextInput label="Phone" type="tel" inputMode="tel" maxLength={20} value={a.refPhone} error={errors.refPhone} onChange={(v) => set({ refPhone: v })} />
        </div>
      )}
    </Modal>
  );
}

function Addresses({ draft, update, errors }: SectionProps) {
  const [editing, setEditing] = useState<{ addr: Address; index: number } | null>(null);
  const list = draft.addresses;
  const needsMore = list.length > 0 && !coversTwoYears(list);
  const h = draft.history;
  const explain = h.evicted === "Yes" || h.owesMoney === "Yes";
  const explainId = useId();
  return (
    <div className="space-y-5">
      <p className="text-base text-slate-700">Please give us at least two years of address history, starting with where you live now.</p>
      <div className="space-y-3">
        {list.map((a, i) => (
          <ItemCard
            key={a.id}
            title={i === 0 ? "Current address" : `Previous address${list.length > 2 ? ` ${i}` : ""}`}
            lines={[addressText(a), `Moved in ${a.moveInMonth} ${a.moveInYear}`, a.owned === "Yes" ? "Owned" : `Reference: ${a.refName} (${a.refType})`]}
            error={errors[`addresses.${i}`]}
            onEdit={() => setEditing({ addr: a, index: i })}
            onRemove={() => update((d) => { d.addresses.splice(i, 1); })}
          />
        ))}
      </div>
      {list.length === 0 && (
        <>
          <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={() => setEditing({ addr: emptyAddress(crypto.randomUUID()), index: 0 })}>
            + Add current address
          </button>
          <FieldError error={errors.addresses} />
        </>
      )}
      {needsMore && (
        <div className="space-y-3">
          <InfoBox>That&apos;s less than two years at your current address{list.length > 1 ? "es" : ""}. Please add where you lived before.</InfoBox>
          <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={() => setEditing({ addr: emptyAddress(crypto.randomUUID()), index: list.length })}>
            + Add previous address
          </button>
          <FieldError error={errors.coverage} />
        </div>
      )}

      <div className="space-y-5 border-t border-slate-200 pt-5">
        <Segmented label="Have you ever been evicted by an agent or lessor?" value={h.evicted} options={["Yes", "No"]} error={errors["history.evicted"]} onChange={(v) => update((d) => { d.history.evicted = v as typeof h.evicted; })} />
        <Segmented label="Do you owe money to another agent or lessor?" value={h.owesMoney} options={["Yes", "No"]} error={errors["history.owesMoney"]} onChange={(v) => update((d) => { d.history.owesMoney = v as typeof h.owesMoney; })} />
        {explain && (
          <Field id={explainId} label="Please explain" error={errors["history.explanation"]}>
            <textarea {...aria(explainId, errors["history.explanation"])} rows={4} maxLength={2000} value={h.explanation} onChange={(e) => update((d) => { d.history.explanation = e.target.value; })} className={inputCls} />
          </Field>
        )}
      </div>

      {editing && (
        <AddressModal
          initial={editing.addr}
          isCurrent={editing.index === 0}
          onClose={() => setEditing(null)}
          onSave={(addr) => {
            update((d) => { d.addresses[editing.index] = addr; });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Employment({ draft, update, errors, session }: SectionProps) {
  return <EmploymentFields person={draft.applicant} set={personSetter(update, "a")} errors={errors} session={session} who="a" />;
}

function Finances({ draft, update, errors, session }: SectionProps) {
  return <FinancesFields person={draft.applicant} set={personSetter(update, "a")} errors={errors} session={session} who="a" />;
}

function Ids({ draft, update, errors, session }: SectionProps) {
  return <IdsFields person={draft.applicant} set={personSetter(update, "a")} errors={errors} session={session} who="a" />;
}

function Emergency({ draft, update, errors }: SectionProps) {
  const c = draft.emergency;
  return (
    <div className="space-y-5">
      <p className="text-base text-slate-700">Someone we can contact in an emergency. They must not be living with you, and must have agreed to be your emergency contact.</p>
      <TextInput label="Full name" value={c.name} error={errors.name} onChange={(v) => update((d) => { d.emergency.name = v; })} />
      <SelectInput label="Relationship" value={c.relationship} options={RELATIONSHIPS} error={errors.relationship} onChange={(v) => update((d) => { d.emergency.relationship = v; })} />
      <TextInput label="Mobile" type="tel" inputMode="tel" maxLength={20} value={c.mobile} error={errors.mobile} onChange={(v) => update((d) => { d.emergency.mobile = v; })} />
      <TextInput label="Email" optional type="email" inputMode="email" value={c.email} error={errors.email} onChange={(v) => update((d) => { d.emergency.email = v; })} />
    </div>
  );
}

function People({ draft, update, errors }: SectionProps) {
  const p = draft.people;
  return (
    <div className="space-y-5">
      <Segmented label="Will anyone else be living with you?" value={p.others} options={["Yes", "No"]} error={errors.others} onChange={(v) => update((d) => { d.people.others = v as typeof p.others; })} />
      {p.others === "Yes" && (
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Other adults (not on the lease)" inputMode="numeric" maxLength={2} value={p.adults} error={errors.adults} onChange={(v) => update((d) => { d.people.adults = v.replace(/\D/g, ""); })} />
          <TextInput label="Children" inputMode="numeric" maxLength={2} value={p.children} error={errors.children} onChange={(v) => update((d) => { d.people.children = v.replace(/\D/g, ""); })} />
        </div>
      )}
      <div className="space-y-3 border-t border-slate-200 pt-5">
        <p className="font-display text-lg text-brand-navy">Applying with someone?</p>
        {draft.second ? (
          <>
            <InfoBox>A second leaseholder has been added. Complete their details from the &ldquo;Second applicant&rdquo; row on your application. Your address history, emergency contact and household answers are shared.</InfoBox>
            <button type="button" className="min-h-11 text-base font-semibold text-red-700 underline underline-offset-4" onClick={() => update((d) => { d.second = null; d.saved.second = false; d.declaration.coSignature = ""; })}>
              Remove second applicant
            </button>
          </>
        ) : (
          <>
            <p className="text-base text-slate-700">Add a partner or housemate who will also be on the lease. They&apos;ll give their own personal details, employment, income and ID.</p>
            <button type="button" className={`${secondaryBtn} w-full sm:w-auto`} onClick={() => update((d) => { d.second = { ...emptyPerson(), relationship: "" }; })}>
              + Add second applicant
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Pets({ draft, update, errors }: SectionProps) {
  const p = draft.pets;
  const any = p.dogs !== "0" || p.cats !== "0" || p.other !== "0";
  const id = useId();
  return (
    <div className="space-y-5">
      <p className="text-base text-slate-700">Let us know about any pets that will live at the property.</p>
      <Segmented label="Dogs" value={p.dogs} options={PET_COUNTS} onChange={(v) => update((d) => { d.pets.dogs = v as typeof p.dogs; })} />
      <Segmented label="Cats" value={p.cats} options={PET_COUNTS} onChange={(v) => update((d) => { d.pets.cats = v as typeof p.cats; })} />
      <Segmented label="Other pets" value={p.other} options={PET_COUNTS} onChange={(v) => update((d) => { d.pets.other = v as typeof p.other; })} />
      {any && (
        <Field id={id} label="Pet details" optional hint="Breed, size, age, and whether they're indoor or outdoor." error={errors.details}>
          <textarea {...aria(id, errors.details, true)} rows={4} maxLength={1000} value={p.details} onChange={(e) => update((d) => { d.pets.details = e.target.value; })} className={inputCls} />
        </Field>
      )}
    </div>
  );
}

function Second({ draft, update, errors, session }: SectionProps) {
  const s = draft.second;
  if (!s) return <p className="text-base text-slate-700">No second applicant has been added. You can add one under People.</p>;
  const set = personSetter(update, "b");
  return (
    <div className="space-y-6">
      <InfoBox>Your address history, emergency contact and household answers are shared with the second applicant.</InfoBox>
      <SelectInput label="Relationship to you" value={s.relationship} options={SECOND_APPLICANT_RELATIONSHIPS} error={errors.relationship} onChange={(v) => update((d) => { if (d.second) d.second.relationship = v; })} />
      <H3>Personal details</H3>
      <PersonalFields person={s} set={set} errors={scope(errors, "personal.")} session={session} who="b" />
      <H3>Employment</H3>
      <EmploymentFields person={s} set={set} errors={scope(errors, "employment.")} session={session} who="b" />
      <H3>Finances</H3>
      <FinancesFields person={s} set={set} errors={scope(errors, "finances.")} session={session} who="b" />
      <H3>Identity documents</H3>
      <IdsFields person={s} set={set} errors={scope(errors, "ids.")} session={session} who="b" />
    </div>
  );
}

export const SECTION_COMPONENTS: Record<SectionId, (p: SectionProps) => React.ReactNode> = {
  personal: Personal,
  about: About,
  addresses: Addresses,
  employment: Employment,
  finances: Finances,
  ids: Ids,
  emergency: Emergency,
  people: People,
  pets: Pets,
  second: Second,
};
