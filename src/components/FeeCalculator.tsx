"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FEES,
  FEE_BENCHMARKS,
  FEE_EXAMPLE_SALE_PRICE,
  FEE_EXAMPLE_WEEKLY_RENT,
  formatAud,
  managementFeeYearly,
  saleFee,
} from "@/lib/fees";

type Mode = "sale" | "management";

/**
 * Commission / management-fee savings calculator. Compares Home7's agent
 * fee with another agent's rate the visitor can change. Agent fees only,
 * GST inclusive on both sides; marketing and leasing costs are excluded
 * for both, which the footnote says.
 */
export default function FeeCalculator({ initialMode = "sale", showTabs = true }: { initialMode?: Mode; showTabs?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [price, setPrice] = useState(FEE_EXAMPLE_SALE_PRICE);
  const [saleRate, setSaleRate] = useState<number>(FEE_BENCHMARKS.saleAvgPercentInclGst);
  const [rent, setRent] = useState(FEE_EXAMPLE_WEEKLY_RENT);
  const [mgmtRate, setMgmtRate] = useState<number>(FEE_BENCHMARKS.mgmtExamplePercentInclGst);

  const isSale = mode === "sale";
  const ours = isSale ? saleFee(price) : managementFeeYearly(rent);
  const theirs = isSale ? saleFee(price, saleRate) : managementFeeYearly(rent, mgmtRate);
  const saving = theirs - ours;

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`flex-1 rounded-md px-4 py-2 text-base font-semibold transition-colors ${
        mode === m ? "bg-brand-navy text-white" : "text-brand-navy hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  const field = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-lg text-brand-navy focus:border-brand-navy focus:outline-none";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      {showTabs && (
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1" role="group" aria-label="Calculator type">
          {tab("sale", "Selling")}
          {tab("management", "Property management")}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {isSale ? (
          <>
            <label className="block text-sm font-medium text-slate-600">
              Sale price
              <input
                type="number"
                inputMode="numeric"
                min={100000}
                step={10000}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                className={field}
              />
              <input
                type="range"
                min={300000}
                max={3000000}
                step={10000}
                value={Math.min(Math.max(price, 300000), 3000000)}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-2 w-full accent-brand-navy"
                aria-label="Sale price slider"
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Other agent&apos;s commission (% incl. GST)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={5}
                step={0.1}
                value={saleRate}
                onChange={(e) => setSaleRate(Math.max(0, Number(e.target.value) || 0))}
                className={field}
              />
              <span className="mt-2 block text-xs text-slate-500">Liverpool average is {FEE_BENCHMARKS.saleAvgLabel}</span>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-600">
              Weekly rent
              <input
                type="number"
                inputMode="numeric"
                min={100}
                step={10}
                value={rent}
                onChange={(e) => setRent(Math.max(0, Number(e.target.value) || 0))}
                className={field}
              />
              <input
                type="range"
                min={300}
                max={2000}
                step={10}
                value={Math.min(Math.max(rent, 300), 2000)}
                onChange={(e) => setRent(Number(e.target.value))}
                className="mt-2 w-full accent-brand-navy"
                aria-label="Weekly rent slider"
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Other agent&apos;s management fee (% incl. GST)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={15}
                step={0.1}
                value={mgmtRate}
                onChange={(e) => setMgmtRate(Math.max(0, Number(e.target.value) || 0))}
                className={field}
              />
              <span className="mt-2 block text-xs text-slate-500">Sydney agents typically charge {FEE_BENCHMARKS.mgmtRangeLabel}</span>
            </label>
          </>
        )}
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{isSale ? "Other agent's commission" : "Other agent, per year"}</dt>
          <dd className="font-display text-2xl text-slate-700">{formatAud(theirs)}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">
            Home7 at {isSale ? FEES.sale.inclLabel : FEES.management.inclLabel}
            {isSale ? "" : ", per year"}
          </dt>
          <dd className="font-display text-2xl text-brand-navy">{formatAud(ours)}</dd>
        </div>
        <div className="rounded-lg bg-brand-navy p-4 text-white">
          <dt className="text-sm text-white/80">{saving >= 0 ? (isSale ? "You save" : "You save each year") : "Difference"}</dt>
          <dd className="font-display text-2xl text-brand-gold">{formatAud(Math.abs(saving))}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Example only. Compares agent {isSale ? "commission" : "management fees"} only, including GST for both agents.
        {isSale ? " Marketing and advertising costs are separate for any agent." : " Letting fees and other leasing costs are separate for any agent."}{" "}
        See our <Link href="/terms-and-conditions" className="underline hover:text-brand-navy">fee terms</Link>.
      </p>
    </div>
  );
}
