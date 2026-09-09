"use client";

import { useRef, useState } from "react";

const DEFAULT_INPUT_CLASS = "w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white";

/**
 * A typeable DD/MM/YYYY date field, used anywhere a native
 * `<input type="date">` would otherwise sit — that's functional but
 * genuinely awkward to actually type into — segmented mm/dd/yyyy spinners
 * clicked through one piece at a time rather than a free-typed date, and
 * inconsistent between browsers. This auto-inserts the slashes as digits
 * are typed (type "15032026", see "15/03/2026" appear as you go), which is
 * both faster and matches the DD/MM/YYYY order Australians actually expect
 * (a native date input's own display format is locale/browser-dependent,
 * not guaranteed to be DD/MM/YYYY at all).
 *
 * Submits the exact same YYYY-MM-DD string under `name` a native date
 * input would have produced, via a hidden input — so callers (Zod
 * `z.coerce.date()`, a plain `new Date(formData.get(name))`, etc.) don't
 * need to change at all; this is a display/input-method change only.
 *
 * Originally built inline in TenancyReferenceForm.tsx, extracted here once
 * the admin Property form needed the exact same field for "Auction date"
 * rather than duplicating the logic a second time.
 */
export function DateInput({
  name,
  required,
  defaultValue,
  className = DEFAULT_INPUT_CLASS,
}: {
  name: string;
  required?: boolean;
  /** ISO "YYYY-MM-DD" (or anything `Date` can parse) — same shape a
   *  native `<input type="date">`'s defaultValue would take. */
  defaultValue?: string;
  className?: string;
}) {
  const initial = (() => {
    if (!defaultValue) return { display: "", iso: "" };
    const d = new Date(defaultValue);
    if (Number.isNaN(d.getTime())) return { display: "", iso: "" };
    const iso = d.toISOString().slice(0, 10);
    const [y, m, day] = iso.split("-");
    return { display: `${day}/${m}/${y}`, iso };
  })();

  const [display, setDisplay] = useState(initial.display);
  const [iso, setIso] = useState(initial.iso);
  const textRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    let formatted = day;
    if (digits.length > 2) formatted += `/${month}`;
    if (digits.length > 4) formatted += `/${year}`;
    setDisplay(formatted);

    if (digits.length === 8) {
      const dayNum = Number(day);
      const monthNum = Number(month);
      const yearNum = Number(year);
      const validDate = dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100;
      setIso(validDate ? `${year}-${month}-${day}` : "");
      // Only the partial/invalid case needs a custom message — an empty
      // field already gets the browser's own "required" message, and a
      // complete valid date needs no message at all.
      textRef.current?.setCustomValidity(validDate ? "" : "Enter a valid date as DD/MM/YYYY");
    } else {
      setIso("");
      textRef.current?.setCustomValidity(digits.length === 0 ? "" : "Enter the full date as DD/MM/YYYY");
    }
  }

  return (
    <div>
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={display}
        onChange={handleChange}
        maxLength={10}
        required={required}
        className={className}
      />
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

export default DateInput;
