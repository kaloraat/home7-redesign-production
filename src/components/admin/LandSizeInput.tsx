"use client";

import { useState } from "react";

const inputClass = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

type Unit = "sqm" | "acres" | "custom";

const SQM_RE = /^(\d+(?:\.\d+)?)\s*m²?$/i;
const ACRES_RE = /^(\d+(?:\.\d+)?)\s*acres?$/i;

/**
 * Land size entry — a plain number field plus a unit dropdown (m²/Acres)
 * instead of a single free-text field that expected the admin to type the
 * "m²" symbol by hand. A "Custom" option reveals a free-text field for
 * anything that doesn't fit that shape — a range, hectares, an "approx."
 * qualifier — the kind of value some of the migrated legacy listings
 * already have (e.g. "3 Acres (approx. 1.21 ha)").
 *
 * Still stores/submits the exact same single `landSize` string the model
 * always expected (e.g. "620m²" or "3 Acres") — this only changes how an
 * admin builds that string, not the schema.
 */
export function LandSizeInput({ name, defaultValue }: { name: string; defaultValue?: string }) {
  // Parse an existing plain "NNNm²"/"NNN Acres" value back into number+unit
  // so editing a normal listing shows the number field, not custom text.
  // Anything else falls back to custom mode so existing irregular data
  // (ranges, "approx." qualifiers, hectares) is never silently mangled.
  const parsed = (() => {
    if (!defaultValue) return { unit: "sqm" as Unit, num: "", custom: "" };
    const sqmMatch = defaultValue.match(SQM_RE);
    if (sqmMatch) return { unit: "sqm" as Unit, num: sqmMatch[1], custom: "" };
    const acresMatch = defaultValue.match(ACRES_RE);
    if (acresMatch) return { unit: "acres" as Unit, num: acresMatch[1], custom: "" };
    return { unit: "custom" as Unit, num: "", custom: defaultValue };
  })();

  const [unit, setUnit] = useState<Unit>(parsed.unit);
  const [num, setNum] = useState(parsed.num);
  const [custom, setCustom] = useState(parsed.custom);

  const combined = unit === "custom" ? custom : num ? `${num}${unit === "sqm" ? "m²" : " Acres"}` : "";

  return (
    <div>
      <div className="flex gap-2">
        {unit === "custom" ? (
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. 620m² - 700m² or 3 Acres (approx. 1.21 ha)"
            className={`${inputClass} flex-1`}
          />
        ) : (
          <input
            type="number"
            min="0"
            step="any"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="Land size"
            className={`${inputClass} flex-1`}
          />
        )}
        {/* The unit dropdown, on the right — switching to/from "Custom"
            keeps whatever was already typed in its own separate field
            rather than clearing it, in case the admin flips back. */}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className="w-28 shrink-0 border border-slate-300 rounded px-2 py-2 text-sm bg-white"
        >
          <option value="sqm">m²</option>
          <option value="acres">Acres</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}

export default LandSizeInput;
