"use client";

import { useState } from "react";
import type { LeadType } from "@/lib/constants";
import AddressAutocomplete from "@/components/AddressAutocomplete";

type Tab = "selling" | "renting" | "buying";

const TABS: { id: Tab; label: string }[] = [
  { id: "selling", label: "Selling" },
  { id: "renting", label: "Renting" },
  { id: "buying", label: "Buying" },
];

const TIMEFRAME_OPTIONS = ["1–3 months", "3–6 months", "Not sure", "Already on the market"];
const PROPERTY_TYPE_OPTIONS = ["House", "Apartment", "Unit", "Villa", "Land", "Rural", "Town House"];
const BUY_PROPERTY_TYPE_OPTIONS = ["House", "Apartment", "Land"];
const BED_BATH_OPTIONS = ["1", "2", "3", "4", "5+"];
const CAR_SPACE_OPTIONS = ["1", "2", "3", "4", "5"];

interface SellRentAnswers {
  timeframe: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  carSpaces: string;
}

interface BuyAnswers {
  propertyType: string;
  ownsHome: string;
  budgetRange: string;
  timeframe: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  carSpaces: string;
}

const EMPTY_SELL_RENT: SellRentAnswers = {
  timeframe: "",
  address: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  carSpaces: "",
};

const EMPTY_BUY: BuyAnswers = {
  propertyType: "",
  ownsHome: "",
  budgetRange: "",
  timeframe: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  carSpaces: "",
};

// Re-styled, controlled-input port of the live site's 3-tab/3-step
// appraisal form (old_laravel_site/.../appraisalPage.blade.php) — same
// tabs, same fields per step, same "Selling" default — rebuilt as
// conditionally-rendered React steps rather than CSS display:none toggling
// (the original's approach), since a display:none'd `required` field is a
// known cross-browser footgun for the *other* visible step's validation.
// The Lead schema (models/Lead.ts) has no structured fields for "bedrooms",
// "timeframe" etc., so those get composed into one readable `message`
// string rather than a schema migration — same /api/leads endpoint and
// LeadSchema every other form on the site already uses.
export function AppraisalForm({ defaultTab = "selling" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [step, setStep] = useState(1);
  const [sell, setSell] = useState<SellRentAnswers>(EMPTY_SELL_RENT);
  const [rent, setRent] = useState<SellRentAnswers>(EMPTY_SELL_RENT);
  const [buy, setBuy] = useState<BuyAnswers>(EMPTY_BUY);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const totalSteps = 3;
  const answers = tab === "selling" ? sell : tab === "renting" ? rent : buy;
  const setAnswers = tab === "selling" ? setSell : tab === "renting" ? setRent : setBuy;

  function switchTab(next: Tab) {
    setTab(next);
    setStep(1);
  }

  function buildMessage(): string {
    if (tab === "buying") {
      const b = buy;
      return [
        "Buying inquiry",
        b.propertyType && `Looking for: ${b.propertyType}`,
        b.ownsHome && `Currently owns a home: ${b.ownsHome}`,
        b.budgetRange && `Budget range: ${b.budgetRange}`,
        b.timeframe && `Timeframe: ${b.timeframe}`,
        b.bedrooms && `Bedrooms: ${b.bedrooms}`,
        b.bathrooms && `Bathrooms: ${b.bathrooms}`,
        b.carSpaces && `Car spaces: ${b.carSpaces}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    const s = tab === "selling" ? sell : rent;
    const verb = tab === "selling" ? "Selling" : "Renting";
    return [
      `${verb} inquiry`,
      s.timeframe && `Timeframe: ${s.timeframe}`,
      s.propertyType && `Property type: ${s.propertyType}`,
      s.bedrooms && `Bedrooms: ${s.bedrooms}`,
      s.bathrooms && `Bathrooms: ${s.bathrooms}`,
      s.carSpaces && `Car spaces: ${s.carSpaces}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const suburb = tab === "buying" ? buy.area : tab === "selling" ? sell.address : rent.address;
    const leadType: LeadType = tab;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message: buildMessage(),
          suburb: suburb || undefined,
          type: leadType,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-xl text-brand-navy">Thanks — request received!</p>
        <p className="mt-2 text-slate-500">
          A local Home7 property expert will be in touch shortly with your appraisal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
      {/* Tab switcher — Selling highlighted by default, matching the live
          site's "keep selling as default/selected" behavior. */}
      <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`flex-1 rounded-full px-4 py-2.5 text-lg font-medium transition-colors cursor-pointer ${
              tab === id ? "bg-brand-navy text-white" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`h-2 rounded-full transition-all ${
              n === step ? "w-8 bg-brand-gold-dark" : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {step === 1 && tab !== "buying" && (
          <StepOneSellRent
            tab={tab}
            answers={answers as SellRentAnswers}
            setAnswers={setAnswers as React.Dispatch<React.SetStateAction<SellRentAnswers>>}
          />
        )}

        {step === 1 && tab === "buying" && <StepOneBuy answers={buy} setAnswers={setBuy} />}

        {step === 2 && tab !== "buying" && (
          <StepTwoSellRent
            answers={answers as SellRentAnswers}
            setAnswers={setAnswers as React.Dispatch<React.SetStateAction<SellRentAnswers>>}
          />
        )}

        {step === 2 && tab === "buying" && <StepTwoBuy answers={buy} setAnswers={setBuy} />}

        {step === 3 && (
          <StepThreeContact name={name} setName={setName} phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} />
        )}

        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong — please try again.</p>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded px-6 py-3 font-semibold text-brand-navy border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              Previous
            </button>
          ) : (
            <span />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition cursor-pointer"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={status === "submitting"}
              className="bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
            >
              {status === "submitting" ? "Sending..." : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** Clickable pill options standing in for the live site's radio buttons —
 * same single-choice behavior, easier to tap and visually scan. */
function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full px-4 py-2 text-lg font-medium border transition-colors cursor-pointer ${
            value === opt
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-slate-600 border-slate-300 hover:border-brand-gold-dark"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-lg font-medium text-brand-navy mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
      >
        <option value="">Please select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function StepOneSellRent({
  tab,
  answers,
  setAnswers,
}: {
  tab: "selling" | "renting";
  answers: SellRentAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<SellRentAnswers>>;
}) {
  const verb = tab === "selling" ? "sell" : "rent";
  return (
    <>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-2">
          When would you like to {verb}?
        </label>
        <PillGroup
          options={TIMEFRAME_OPTIONS}
          value={answers.timeframe}
          onChange={(v) => setAnswers((a) => ({ ...a, timeframe: v }))}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">
          What&apos;s the address of the property you want to {verb}?
        </label>
        <AddressAutocomplete name="step1_address" />
      </div>
    </>
  );
}

function StepOneBuy({
  answers,
  setAnswers,
}: {
  answers: BuyAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<BuyAnswers>>;
}) {
  return (
    <>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-2">What do you want to buy?</label>
        <PillGroup
          options={BUY_PROPERTY_TYPE_OPTIONS}
          value={answers.propertyType}
          onChange={(v) => setAnswers((a) => ({ ...a, propertyType: v }))}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-2">
          Do you currently own a home?
        </label>
        <PillGroup
          options={["Yes", "No"]}
          value={answers.ownsHome}
          onChange={(v) => setAnswers((a) => ({ ...a, ownsHome: v }))}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">What&apos;s your budget range?</label>
        <input
          type="text"
          value={answers.budgetRange}
          onChange={(e) => setAnswers((a) => ({ ...a, budgetRange: e.target.value }))}
          placeholder="e.g. $600,000 – $700,000"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-2">When would you like to buy?</label>
        <PillGroup
          options={TIMEFRAME_OPTIONS}
          value={answers.timeframe}
          onChange={(v) => setAnswers((a) => ({ ...a, timeframe: v }))}
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">
          Which area are you looking to buy in?
        </label>
        <AddressAutocomplete name="step1_area" />
      </div>
    </>
  );
}

function StepTwoSellRent({
  answers,
  setAnswers,
}: {
  answers: SellRentAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<SellRentAnswers>>;
}) {
  return (
    <>
      <SelectField
        label="Property type"
        value={answers.propertyType}
        onChange={(v) => setAnswers((a) => ({ ...a, propertyType: v }))}
        options={PROPERTY_TYPE_OPTIONS}
      />
      <div className="grid grid-cols-3 gap-3">
        <SelectField
          label="Bedrooms"
          value={answers.bedrooms}
          onChange={(v) => setAnswers((a) => ({ ...a, bedrooms: v }))}
          options={BED_BATH_OPTIONS}
        />
        <SelectField
          label="Bathrooms"
          value={answers.bathrooms}
          onChange={(v) => setAnswers((a) => ({ ...a, bathrooms: v }))}
          options={BED_BATH_OPTIONS}
        />
        <SelectField
          label="Car spaces"
          value={answers.carSpaces}
          onChange={(v) => setAnswers((a) => ({ ...a, carSpaces: v }))}
          options={CAR_SPACE_OPTIONS}
        />
      </div>
    </>
  );
}

function StepTwoBuy({
  answers,
  setAnswers,
}: {
  answers: BuyAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<BuyAnswers>>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <SelectField
        label="Bedrooms"
        value={answers.bedrooms}
        onChange={(v) => setAnswers((a) => ({ ...a, bedrooms: v }))}
        options={BED_BATH_OPTIONS}
      />
      <SelectField
        label="Bathrooms"
        value={answers.bathrooms}
        onChange={(v) => setAnswers((a) => ({ ...a, bathrooms: v }))}
        options={BED_BATH_OPTIONS}
      />
      <SelectField
        label="Car spaces"
        value={answers.carSpaces}
        onChange={(v) => setAnswers((a) => ({ ...a, carSpaces: v }))}
        options={CAR_SPACE_OPTIONS}
      />
    </div>
  );
}

function StepThreeContact({
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
}: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      </div>
    </>
  );
}

export default AppraisalForm;
