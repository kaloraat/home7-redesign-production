"use client";

import { useState } from "react";
import type { LeadType } from "@/lib/constants";
import AddressAutocomplete from "@/components/AddressAutocomplete";

/**
 * Shared by the /contact page, the blog sidebar/mobile FAB, and the
 * agent-page sidebar — `leadType` tags which one a submission came from
 * (still visible per-lead in /admin), and `fallbackMessage` lets a usage
 * default the message when the reader leaves the Message field blank,
 * without changing the form itself.
 *
 * `heading`/`intro` are optional and rendered inside the form card itself —
 * /contact leaves them unset since that page already has its own external
 * "Contact Home7" H2 above the form; the blog sidebar/FAB and the agent
 * page pass them (the agent page reuses BLOG_CONTACT_FORM_INTRO verbatim
 * with just its own heading, so the same form reads identically wherever
 * it appears on the site).
 */
export function ContactForm({
  leadType = "general-contact",
  fallbackMessage,
  heading,
  intro,
  compact = false,
}: {
  leadType?: LeadType;
  fallbackMessage?: string;
  heading?: string;
  intro?: string;
  /** Matches PropertyInquiryForm's minimal look (no visible field labels,
   * tighter spacing, full-width button) — used specifically in the blog
   * sidebar, which now sits in the same width column the property page's
   * inquiry form does and is meant to read as the same kind of form.
   * Every other usage (/contact, agent page, buyers-agent-request, the
   * blog mobile FAB/end-of-article forms) omits this and keeps its
   * existing labeled, more spacious appearance unchanged. */
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone") || undefined,
          message: formData.get("message") || fallbackMessage || undefined,
          suburb: formData.get("address") || undefined,
          type: leadType,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return compact ? (
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        <p className="font-display text-brand-navy">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ve received your message and will get back to you shortly.
        </p>
      </div>
    ) : (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-display text-xl text-brand-navy">Thanks for reaching out!</p>
        <p className="mt-2 text-slate-500">
          We&apos;ve received your message and will get back to you shortly.
        </p>
      </div>
    );
  }

  // compact drops the visible field labels (placeholder text carries the
  // same information, matching PropertyInquiryForm's look exactly) and
  // tightens spacing — every input's own classes stay identical either
  // way, which is what actually makes the two forms read as the same kind
  // of thing once this sits in the same width column the property page's
  // form does. `required` stays on regardless of the label being hidden.
  const field = (label: string, required: boolean, input: React.ReactNode) =>
    compact ? (
      input
    ) : (
      <div>
        <label className="block text-lg font-medium text-brand-navy mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {input}
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {heading && (
        <div>
          <p className="font-display text-lg text-brand-navy">{heading}</p>
          {intro && <p className="mt-1 text-lg text-slate-500">{intro}</p>}
        </div>
      )}

      {field(
        "Name",
        true,
        <input
          name="name"
          type="text"
          required
          placeholder="Full Name"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      )}

      {field(
        "Email Address",
        true,
        <input
          name="email"
          type="email"
          required
          placeholder="Email Address"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      )}

      {field(
        "Phone",
        false,
        <input
          name="phone"
          type="tel"
          placeholder="Phone"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      )}

      {field("Address", false, <AddressAutocomplete name="address" />)}

      {field(
        "Message",
        true,
        <textarea
          name="message"
          rows={4}
          required
          placeholder={compact ? "Message" : undefined}
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong — please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={
          compact
            ? "w-full bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition disabled:opacity-60 cursor-pointer"
            : "bg-brand-gold text-brand-navy rounded px-8 py-3 font-semibold hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
        }
      >
        {status === "submitting" ? "Sending..." : "Submit"}
      </button>
    </form>
  );
}

export default ContactForm;
