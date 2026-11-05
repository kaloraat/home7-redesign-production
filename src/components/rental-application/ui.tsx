"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ALLOWED_UPLOADS, MAX_FILE_BYTES, MONTHS } from "@/lib/rentalApplication/constants";
import type { FileRef } from "@/lib/rentalApplication/types";

/* ---------- styles ---------- */

export const inputCls =
  "block w-full min-h-12 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/30 aria-[invalid=true]:border-red-600";
export const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-gold px-6 py-3 text-base font-bold text-brand-navy shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/40 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand-navy bg-white px-5 py-2.5 text-base font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/30";
export const textBtn =
  "inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-base font-semibold text-brand-navy underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/30";
export const linkBtn =
  "text-base font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/40 rounded";
export const cardCls = "rounded-xl bg-white shadow-[0_2px_12px_rgba(8,19,73,0.08)] ring-1 ring-slate-200/70";
export const shadedBox = "rounded-xl bg-slate-100 p-4 sm:p-5 space-y-4";

/* ---------- field ---------- */

export function Field({
  label,
  error,
  hint,
  optional,
  children,
  id,
}: {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.95rem] font-semibold text-slate-800">
        {label}
        {optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-slate-500">{hint}</p>}
      {children}
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="mt-0.5 shrink-0"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" /></svg>
      {error}
    </p>
  );
}

/** aria props for an input inside <Field id=...>. */
export const aria = (id: string, error?: string, hint?: boolean) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined,
});

export function TextInput({
  label, value, onChange, error, hint, optional, type = "text", inputMode, autoComplete, placeholder, maxLength = 200,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; optional?: boolean;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; placeholder?: string; maxLength?: number;
}) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        {...aria(id, error, !!hint)}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

export function SelectInput({
  label, value, onChange, options, error, optional, placeholder = "Select",
}: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; error?: string; optional?: boolean; placeholder?: string;
}) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} optional={optional}>
      <select {...aria(id, error)} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

/* ---------- segmented / radios ---------- */

export function Segmented({
  label, value, onChange, options, error, hint, labels,
}: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; error?: string; hint?: string; labels?: Record<string, string>;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = options.indexOf(value);
  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + options.length) % options.length;
    onChange(options[next]);
    refs.current[next]?.focus();
  }
  return (
    <div role="radiogroup" aria-labelledby={`${id}-l`} aria-describedby={error ? `${id}-err` : undefined}>
      <p id={`${id}-l`} className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">{label}</p>
      {hint && <p className="-mt-0.5 mb-1.5 text-sm text-slate-500">{hint}</p>}
      <div className={`flex w-full overflow-hidden rounded-lg border ${error ? "border-red-600" : "border-slate-300"}`}>
        {options.map((o, i) => {
          const on = o === value;
          return (
            <button
              key={o}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on || (idx === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(o)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-12 flex-1 px-2 text-base font-semibold transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-gold ${
                i > 0 ? "border-l border-slate-300" : ""
              } ${on ? "bg-brand-navy text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {labels?.[o] ?? o}
            </button>
          );
        })}
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

export function RadioList({
  label, value, onChange, options, error,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string;
}) {
  const name = useId();
  return (
    <fieldset aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">{label}</legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-base has-checked:border-brand-navy has-checked:bg-brand-navy/5 has-focus-visible:ring-4 has-focus-visible:ring-brand-navy/30 ${error ? "border-red-600" : "border-slate-300"}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="h-5 w-5 accent-brand-navy" />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError id={`${name}-err`} error={error} />
    </fieldset>
  );
}

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; error?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg p-2 text-base text-slate-800 has-focus-visible:ring-4 has-focus-visible:ring-brand-navy/30 ${error ? "bg-red-50" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-navy" />
      <span>{children}</span>
    </label>
  );
}

/* ---------- date pieces ---------- */

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function DobSelects({
  day, month, year, onChange, error,
}: {
  day: string; month: string; year: string; onChange: (p: { day?: string; month?: string; year?: string }) => void; error?: string;
}) {
  const id = useId();
  const thisYear = new Date().getFullYear();
  const sel = `${inputCls} pr-8`;
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">Date of birth</legend>
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-d`}>Day</label>
        <select id={`${id}-d`} aria-invalid={error ? true : undefined} value={day} onChange={(e) => onChange({ day: e.target.value })} className={sel}>
          <option value="">Day</option>
          {range(1, 31).map((d) => <option key={d} value={String(d)}>{d}</option>)}
        </select>
        <label className="sr-only" htmlFor={`${id}-m`}>Month</label>
        <select id={`${id}-m`} aria-invalid={error ? true : undefined} value={month} onChange={(e) => onChange({ month: e.target.value })} className={sel}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>
        <label className="sr-only" htmlFor={`${id}-y`}>Year</label>
        <select id={`${id}-y`} aria-invalid={error ? true : undefined} value={year} onChange={(e) => onChange({ year: e.target.value })} className={sel}>
          <option value="">Year</option>
          {range(thisYear - 100, thisYear - 16).reverse().map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </fieldset>
  );
}

export function MonthYear({
  label, month, year, onChange, error, yearsBack = 60,
}: {
  label: string; month: string; year: string; onChange: (p: { month?: string; year?: string }) => void; error?: string; yearsBack?: number;
}) {
  const id = useId();
  const thisYear = new Date().getFullYear();
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-1.5 text-[0.95rem] font-semibold text-slate-800">{label}</legend>
      <div className="grid grid-cols-[1.6fr_1fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-m`}>Month</label>
        <select id={`${id}-m`} aria-invalid={error ? true : undefined} value={month} onChange={(e) => onChange({ month: e.target.value })} className={inputCls}>
          <option value="">Month</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="sr-only" htmlFor={`${id}-y`}>Year</label>
        <select id={`${id}-y`} aria-invalid={error ? true : undefined} value={year} onChange={(e) => onChange({ year: e.target.value })} className={inputCls}>
          <option value="">Year</option>
          {range(thisYear - yearsBack, thisYear).reverse().map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </fieldset>
  );
}

/* ---------- info box ---------- */

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-sky-50 px-4 py-3 text-[0.95rem] text-slate-800 ring-1 ring-sky-100">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#081349" strokeWidth="2" aria-hidden="true" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

/* ---------- modal ---------- */

export function Modal({
  title, onClose, onSave, saveLabel = "Save", children,
}: {
  title: string; onClose: () => void; onSave: () => void; saveLabel?: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(
        ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-brand-navy/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-[560px] sm:rounded-xl sm:shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="font-display text-xl text-brand-navy">{title}</h2>
          <button type="button" data-close onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className={textBtn}>Cancel</button>
          <button type="button" onClick={onSave} className={primaryBtn}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- item card (added addresses, incomes, IDs) ---------- */

export function ItemCard({
  title, lines, onEdit, onRemove, error,
}: {
  title: string; lines: string[]; onEdit: () => void; onRemove: () => void; error?: string;
}) {
  return (
    <div className={`${cardCls} p-4 ${error ? "ring-2 ring-red-600" : ""}`}>
      <p className="font-semibold text-slate-900">{title}</p>
      {lines.filter(Boolean).map((l) => <p key={l} className="text-sm text-slate-600">{l}</p>)}
      <FieldError error={error} />
      <div className="mt-2 flex gap-4">
        <button type="button" onClick={onEdit} className={`${linkBtn} min-h-11`}>Edit</button>
        <button type="button" onClick={onRemove} className={`${linkBtn} min-h-11 text-red-700`}>Remove</button>
      </div>
    </div>
  );
}

/* ---------- uploads ---------- */

export const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

type Pending = { id: string; name: string; size: number; progress: number; error?: string };

/** Live count of uploads in flight, so "Save" can wait for them. */
export const uploadsInFlight = { count: 0 };

function putWithProgress(url: string, file: File, contentType: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload")));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function FileUpload({
  label, hint, files, onAdd, onRemove, session, accept, maxFiles = 10, error, optional,
}: {
  label: string; hint?: string; files: FileRef[]; onAdd: (file: FileRef) => void; onRemove: (key: string) => void; session: string;
  accept: string; maxFiles?: number; error?: string; optional?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const allowedExts = accept.split(",").map((a) => a.replace(".", ""));

  async function uploadOne(file: File) {
    const pid = crypto.randomUUID();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const fail = (msg: string) => setPending((p) => [...p.filter((x) => x.id !== pid), { id: pid, name: file.name, size: file.size, progress: 0, error: msg }]);
    if (!allowedExts.includes(ext) || !ALLOWED_UPLOADS[ext]) return fail(`Use ${accept.replaceAll(".", "").replaceAll(",", ", ").toUpperCase()} files`);
    if (file.size > MAX_FILE_BYTES) return fail("This file is over 10MB");
    if (file.size === 0) return fail("This file is empty");

    setPending((p) => [...p, { id: pid, name: file.name, size: file.size, progress: 0 }]);
    uploadsInFlight.count++;
    try {
      const res = await fetch("/api/rental-application/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadSession: session, filename: file.name, size: file.size }),
      });
      const body = (await res.json().catch(() => null)) as { url?: string; key?: string; contentType?: string; error?: string } | null;
      if (!res.ok || !body?.url || !body.key || !body.contentType) throw new Error(body?.error || "Upload failed");
      await putWithProgress(body.url, file, body.contentType, (progress) =>
        setPending((p) => p.map((x) => (x.id === pid ? { ...x, progress } : x)))
      );
      setPending((p) => p.filter((x) => x.id !== pid));
      onAdd({ key: body.key, name: file.name.slice(0, 200), size: file.size, type: body.contentType });
    } catch (err) {
      fail(err instanceof Error && err.message !== "upload" && err.message !== "network" ? err.message : "Upload failed. Check your connection and try again.");
    } finally {
      uploadsInFlight.count--;
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = maxFiles - files.length - pending.filter((p) => !p.error).length;
    list.slice(0, Math.max(0, room)).forEach(uploadOne);
  }

  const full = files.length + pending.filter((p) => !p.error).length >= maxFiles;

  return (
    <div>
      <p className="mb-1.5 text-[0.95rem] font-semibold text-slate-800" id={`${id}-l`}>
        {label}{optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </p>
      {hint && <p className="-mt-0.5 mb-2 text-sm text-slate-500">{hint}</p>}

      <ul className="space-y-2" aria-live="polite">
        {files.map((f) => (
          <li key={f.key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <FileGlyph />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
              <p className="text-xs text-slate-500">{fmtSize(f.size)} · Uploaded</p>
            </div>
            <button type="button" onClick={() => onRemove(f.key)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200" aria-label={`Remove ${f.name}`}>
              Remove
            </button>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${p.error ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
            <FileGlyph />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
              {p.error ? (
                <p className="text-xs font-medium text-red-700">{p.error}</p>
              ) : (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${p.name}`}>
                  <div className="h-full bg-brand-navy transition-[width]" style={{ width: `${p.progress}%` }} />
                </div>
              )}
            </div>
            {p.error && (
              <button type="button" onClick={() => setPending((x) => x.filter((y) => y.id !== p.id))} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white" aria-label={`Dismiss ${p.name}`}>
                Dismiss
              </button>
            )}
          </li>
        ))}
      </ul>

      {!full && (
        <>
          <input ref={inputRef} id={id} type="file" accept={accept} multiple={maxFiles > 1} onChange={onPick} className="sr-only" aria-labelledby={`${id}-l`} />
          <label
            htmlFor={id}
            className={`mt-2 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-base font-semibold text-brand-navy hover:bg-slate-50 has-focus-visible:ring-4 ${error ? "border-red-600" : "border-slate-300"}`}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
            tabIndex={0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {files.length ? "Add another file" : "Choose file"}
          </label>
          <p className="mt-1 text-xs text-slate-500">{accept.replaceAll(".", "").replaceAll(",", ", ").toUpperCase()} · up to 10MB each</p>
        </>
      )}
      <FieldError error={error} />
    </div>
  );
}

function FileGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#081349" strokeWidth="1.8" aria-hidden="true" className="shrink-0">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
    </svg>
  );
}
