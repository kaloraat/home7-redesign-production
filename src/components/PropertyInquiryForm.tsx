"use client";

import { useState } from "react";
import type { LeadType } from "@/lib/constants";

/**
 * The sidebar "Request Inquiry" form on a property page — the old site had
 * this (propertySinglePage.blade.php) but it was never rebuilt; property
 * pages had no lead-capture path of their own at all. Posts to the same
 * /api/leads endpoint every other form on the site uses, tagged with this
 * specific property (Lead.property already existed as a ref field — this
 * is the first caller to actually set it) so an admin reviewing the Leads
 * inbox can see exactly which listing an enquiry was about.
 */
export function PropertyInquiryForm({
  propertyId,
  propertyAddress,
  leadType,
}: {
  propertyId: string;
  propertyAddress: string;
  leadType: LeadType;
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
          message: formData.get("message") || `Enquiry about ${propertyAddress}`,
          type: leadType,
          property: propertyId,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        <p className="font-display text-brand-navy">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ve received your enquiry and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-display text-lg text-brand-navy">Request Inquiry</h3>
      <input
        name="name"
        type="text"
        required
        placeholder="Full Name"
        className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone Number"
        className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email Address"
        className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
      />
      <textarea
        name="message"
        placeholder="Message"
        rows={4}
        className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
      />
      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong — please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition disabled:opacity-60 cursor-pointer"
      >
        {status === "submitting" ? "Sending…" : "Submit Request"}
      </button>
    </form>
  );
}

export default PropertyInquiryForm;
