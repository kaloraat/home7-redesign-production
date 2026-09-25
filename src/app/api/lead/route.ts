import { NextResponse } from "next/server";
import { leadSchema, type LeadInput } from "@/lib/lp/validation";
import { toE164 } from "@/lib/lp/phone";
import { REGIONS } from "@/lib/lp/regions";
import { sendNotificationEmail } from "@/lib/notifyLead";

/**
 * Lead endpoint for the Google Ads landing pages (/lp/*). Sent via the
 * contact forms' mailer (lib/notifyLead.ts). Email-only for launch: the office gets an instant "call within 5 minutes" email with the
 * tap-to-call number and the Google click ids needed for offline conversion
 * uploads. (Deliberately not written to the Lead collection yet — that model
 * requires an email address, which these 3-field forms don't collect.)
 */

// In-memory limiter: fine for a single Node process (this deploys via
// deploy.sh on one droplet). Swap for Redis if that ever changes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

async function turnstileOk(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not enabled
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildEmail(lead: LeadInput, leadId: string, phoneE164: string) {
  const isPm = lead.lead_type === "pm";
  const kind = isPm ? "LANDLORD" : "SELLER";
  const subject = `🔥 NEW ${kind} LEAD – ${lead.suburb} – call within 5 minutes`;
  const received = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" });
  const choiceLabel = isPm ? "Needs" : "Selling in";
  const page = `${isPm ? "Property management" : "Sell"} – ${REGIONS[lead.region].name} (${lead.form_instance} form)`;

  const tracking: [string, string][] = [
    ["leadId", leadId], ["gclid", lead.gclid], ["gbraid", lead.gbraid], ["wbraid", lead.wbraid],
    ["utm_source", lead.utm_source], ["utm_medium", lead.utm_medium], ["utm_campaign", lead.utm_campaign],
    ["utm_term", lead.utm_term], ["utm_content", lead.utm_content], ["landing_url", lead.landing_url], ["referrer", lead.referrer],
  ];

  const text = [
    `${kind} LEAD — call within 5 minutes`,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone} (${phoneE164})`,
    `${isPm ? "Suburb" : "Address/suburb"}: ${lead.suburb}`,
    lead.choice ? `${choiceLabel}: ${lead.choice}` : undefined,
    `Page: ${page}`,
    `Received: ${received}`,
    "",
    "Tracking",
    ...tracking.map(([k, v]) => `${k}: ${v || "-"}`),
  ].filter((l): l is string => l !== undefined).join("\n");

  const row = (l: string, v: string) =>
    `<tr><td style="padding:8px 12px;color:#64748b;font-size:13px;width:110px;border-bottom:1px solid #e2e8f0">${l}</td><td style="padding:8px 12px;font-size:15px;color:#0f172a;border-bottom:1px solid #e2e8f0">${v}</td></tr>`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 4px;color:#081349">🔥 New ${kind.toLowerCase()} lead</h2>
<p style="margin:0 0 16px;color:#64748b;font-size:13px">Call within 5 minutes · ${esc(received)}</p>
<p style="margin:0 0 16px"><a href="tel:${esc(phoneE164)}" style="display:inline-block;background:#f4ca74;color:#081349;font-weight:700;font-size:18px;padding:14px 22px;border-radius:10px;text-decoration:none">📞 Call ${esc(lead.name)}: ${esc(lead.phone)}</a></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px">
${row("Name", esc(lead.name))}${row(isPm ? "Suburb" : "Address", esc(lead.suburb))}${lead.choice ? row(choiceLabel, esc(lead.choice)) : ""}${row("Page", esc(page))}
</table>
<p style="margin:20px 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;color:#94a3b8;text-transform:uppercase">Tracking</p>
<div style="font-size:12px;color:#64748b;line-height:1.6;word-break:break-all">${tracking.map(([k, v]) => `${k}: ${esc(v || "-")}`).join("<br>")}</div>
</div>`;

  return { subject, text, html };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const lead = parsed.data;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  // Bots get a fake success so they don't learn what tripped the trap.
  const fakeOk = NextResponse.json({ ok: true, leadId: crypto.randomUUID() });
  if (lead.company) return fakeOk;
  if (Date.now() - lead.form_started_at < 3000) return fakeOk;
  if (!(await turnstileOk(lead.turnstile_token, ip))) return fakeOk;

  const leadId = crypto.randomUUID();
  const phoneE164 = toE164(lead.phone);
  const { subject, text, html } = buildEmail(lead, leadId, phoneE164);

  const sent = await sendNotificationEmail({ subject, text, html });
  if (!sent) {
    // Keep the lead recoverable from server logs even though the visitor
    // sees the "please call us" message.
    console.error("[lp-lead] email not sent. Payload:", JSON.stringify({ leadId, ...lead }));
    // Dev without RESEND_API_KEY: let the form flow be testable.
    if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, leadId });
    }
    return NextResponse.json({ ok: false, error: "Could not send" }, { status: 500 });
  }

  // TODO: also persist to MongoDB once the Lead model allows email-less leads.
  return NextResponse.json({ ok: true, leadId });
}
