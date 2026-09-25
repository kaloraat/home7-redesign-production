"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { leadSchema } from "@/lib/lp/validation";
import { toE164 } from "@/lib/lp/phone";
import { REGIONS } from "@/lib/lp/regions";
import { SITE } from "@/lib/lp/site";
import { getAttribution, trackFormStart, trackLeadConversion } from "@/lib/lp/tracking";
import type { LpCopy } from "@/lib/lp/content";
import { useLp } from "./LpContext";
import PhoneLink from "./PhoneLink";

type Field = "name" | "phone" | "suburb";
type Errors = Partial<Record<Field, string>>;

const inputCls =
  "block w-full min-h-12 rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/40";

export const primaryBtn =
  "inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-brand-gold-dark bg-brand-gold px-6 py-3.5 text-lg font-bold text-brand-navy shadow-sm transition-colors hover:bg-[#f0bd55] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/40 disabled:cursor-not-allowed disabled:opacity-70";

export function LeadForm({ copy, instance }: { copy: LpCopy; instance: "hero" | "footer" }) {
  const { leadType, region } = useLp();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState(false);
  const id = (s: string) => `lp-${instance}-${s}`;

  const read = (fd: FormData) => ({
    name: String(fd.get("name") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    suburb: String(fd.get("suburb") ?? ""),
    choice: String(fd.get("choice") ?? ""),
    company: String(fd.get("company") ?? ""),
  });

  function validateField(field: Field) {
    const fd = new FormData(formRef.current!);
    const result = leadSchema.shape[field].safeParse(read(fd)[field]);
    setErrors((prev) => ({ ...prev, [field]: result.success ? undefined : result.error.issues[0].message }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setServerError(false);

    const values = read(new FormData(e.currentTarget));
    const payload = {
      ...values,
      lead_type: leadType,
      region,
      form_instance: instance,
      form_started_at: startedAt.current,
      ...getAttribution(),
    };
    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (["name", "phone", "suburb"].includes(key) && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const firstBad = (["name", "phone", "suburb"] as Field[]).find((f) => next[f]);
      if (firstBad) formRef.current?.querySelector<HTMLInputElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; leadId?: string } | null;
      if (!res.ok || !data?.ok || !data.leadId) throw new Error("bad response");

      const firstName = parsed.data.name.split(/\s+/)[0];
      trackLeadConversion({
        leadId: data.leadId,
        phoneE164: toE164(parsed.data.phone),
        firstName,
        leadType,
        region,
        instance,
        done: () => router.push(`/lp/thank-you?type=${leadType}&n=${encodeURIComponent(firstName)}`),
      });
      // Stay in the "sending" state: the button must never be clickable twice.
    } catch {
      setServerError(true);
      setSending(false);
    }
  }

  const describedBy = (f: Field) => (errors[f] ? id(`${f}-err`) : undefined);
  const err = (f: Field) =>
    errors[f] ? (
      <p id={id(`${f}-err`)} className="mt-1.5 text-sm font-medium text-red-700">
        {errors[f]}
      </p>
    ) : null;
  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-800";

  return (
    <form
      ref={formRef}
      id={id("form")}
      data-lp-form={instance}
      onSubmit={onSubmit}
      onFocusCapture={() => trackFormStart(leadType, region, instance)}
      noValidate
      data-clarity-mask="true"
      className="space-y-4"
    >
      <div>
        <label htmlFor={id("name")} className={labelCls}>Your name</label>
        <input
          id={id("name")} name="name" type="text" autoComplete="name" required
          aria-invalid={!!errors.name} aria-describedby={describedBy("name")}
          onBlur={() => validateField("name")} className={inputCls}
        />
        {err("name")}
      </div>

      <div>
        <label htmlFor={id("phone")} className={labelCls}>Mobile</label>
        <input
          id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required
          placeholder="04xx xxx xxx"
          aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")}
          onBlur={() => validateField("phone")} className={inputCls}
        />
        {err("phone")}
      </div>

      <div>
        <label htmlFor={id("suburb")} className={labelCls}>{copy.form.suburbLabel}</label>
        <input
          id={id("suburb")} name="suburb" type="text" required list={id("suburbs")}
          autoComplete={copy.form.suburbAutocomplete}
          aria-invalid={!!errors.suburb} aria-describedby={describedBy("suburb")}
          onBlur={() => validateField("suburb")} className={inputCls}
        />
        <datalist id={id("suburbs")}>
          {REGIONS[region].suburbs.map((s) => <option key={s} value={s} />)}
        </datalist>
        {err("suburb")}
      </div>

      <fieldset>
        <legend className={labelCls}>
          {copy.form.chipsLabel} <span className="font-normal text-slate-500">(optional)</span>
        </legend>
        <div role="radiogroup" aria-label={copy.form.chipsLabel} className="flex flex-wrap gap-2">
          {copy.form.chips.map((chip, i) => (
            <div key={chip}>
              <input id={id(`chip-${i}`)} type="radio" name="choice" value={chip} className="peer sr-only" />
              <label
                htmlFor={id(`chip-${i}`)}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-navy peer-checked:border-brand-navy peer-checked:bg-brand-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-navy/50"
              >
                {chip}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Honeypot: real people never see or fill this. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" disabled={sending} className={primaryBtn}>
        {sending ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Sending…
          </>
        ) : (
          copy.form.button
        )}
      </button>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          Sorry, something went wrong. Please call us on {SITE.phoneDisplay} and we&apos;ll help straight away.
        </p>
      )}

      <p className="text-sm leading-snug text-slate-600">{copy.microcopy}</p>
      <p className="text-base text-slate-700">
        Rather talk now?{" "}
        <PhoneLink location={instance === "hero" ? "hero" : "footer"} label="Call" className="font-bold text-brand-navy underline underline-offset-2" />
      </p>
    </form>
  );
}

export default LeadForm;
