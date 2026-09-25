import { Resend } from "resend";
import { getNotificationRecipients } from "@/lib/emailRecipients";
import { SITE_NAME } from "@/lib/constants";
import type { ILead } from "@/models/Lead";

type LeadFields = Pick<ILead, "name" | "email" | "phone" | "message" | "type" | "suburb">;

// Inline styles throughout, deliberately — this is an actual transactional
// email (Gmail/Outlook/Apple Mail etc.), not a page in a browser, and a lot
// of mail clients strip or ignore a <style> block. Colors pulled from the
// site's own brand tokens (globals.css --brand-navy/--brand-gold) rather
// than a generic template, so this reads as a Home7 email specifically.
const NAVY = "#081349";
const GOLD = "#f4ca74";
const GOLD_DARK = "#c18847";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;vertical-align:top;">${value}</td>
    </tr>`;
}

function buildLeadEmailHtml(lead: LeadFields, typeLabel: string) {
  const submittedAt = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "short",
    timeStyle: "short",
  });

  const rows = [
    detailRow("Email", `<a href="mailto:${escapeHtml(lead.email)}" style="color:${GOLD_DARK};text-decoration:none;">${escapeHtml(lead.email)}</a>`),
    lead.phone &&
      detailRow("Phone", `<a href="tel:${escapeHtml(lead.phone)}" style="color:${GOLD_DARK};text-decoration:none;">${escapeHtml(lead.phone)}</a>`),
    lead.suburb && detailRow("Suburb/Address", escapeHtml(lead.suburb)),
  ]
    .filter(Boolean)
    .join("");

  return `
<div style="background:#f1f5f9;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 24px 20px;border-bottom:1px solid #e2e8f0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">New Lead</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${NAVY};">${escapeHtml(lead.name)}</p>
          </td>
          <td align="right" style="white-space:nowrap;vertical-align:top;padding-top:2px;">
            <span style="font-size:12px;color:#94a3b8;">${submittedAt}</span>
          </td>
        </tr>
      </table>
      <span style="display:inline-block;margin-top:12px;background:${GOLD};color:${NAVY};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;">${escapeHtml(typeLabel)}</span>
    </div>

    <div style="padding:20px 24px 4px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${NAVY};">Lead Details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        ${rows}
      </table>
    </div>

    ${
      lead.message
        ? `
    <div style="padding:20px 24px 24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${NAVY};">Message</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(lead.message)}</div>
    </div>`
        : `<div style="padding-bottom:8px;"></div>`
    }

    <div style="padding:14px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Sent from the ${escapeHtml(typeLabel)} form &middot; ${escapeHtml(SITE_NAME)}</p>
    </div>
  </div>
</div>`;
}

/**
 * Fires an email to Home7 staff when a new lead comes in — every form on
 * the site (contact, blog sidebar, appraisal, buyers agent request, etc.)
 * already writes durably to MongoDB via /api/leads, but until this, nothing
 * told anyone a lead had arrived: the admin dashboard only showed a *count*
 * of new leads, with no inbox to actually read one. For a lead-gen site, an
 * unnoticed lead is functionally the same as a lost one.
 *
 * Deliberately never throws — this runs after the lead is already saved, so
 * an email provider hiccup should never turn a successful submission into a
 * 500 for the visitor. Any failure is logged, not surfaced to the caller.
 */
export async function notifyNewLead(lead: LeadFields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Not configured yet — expected until RESEND_API_KEY is set in
    // .env.local (see .env.example). Logged once per attempt rather than
    // silently doing nothing, so this gap stays visible in server logs
    // instead of just quietly never sending anything.
    console.warn("notifyNewLead: RESEND_API_KEY not set — skipping email notification.");
    return;
  }

  const to = getNotificationRecipients();
  // Resend's shared sandbox sender — works immediately with zero setup, but
  // only actually delivers to the email address the Resend account itself
  // is signed up with. Verifying home7.com.au as a sending domain in Resend
  // (a few DNS records) lifts that restriction and lets `to` be any real
  // inbox — see the notification-setup guide.
  const from = process.env.LEAD_NOTIFICATION_FROM || "Home7 Leads <onboarding@resend.dev>";

  const typeLabel = lead.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  // Plain-text fallback — sent alongside the HTML version (a multipart
  // email), used by clients that don't render HTML and by spam filters that
  // weigh a missing text part negatively.
  const textLines = [
    `Type: ${typeLabel}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.suburb && `Suburb/Address: ${lead.suburb}`,
    lead.message && `\nMessage:\n${lead.message}`,
  ].filter(Boolean);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `New ${typeLabel} lead — ${lead.name}`,
      text: textLines.join("\n"),
      html: buildLeadEmailHtml(lead, typeLabel),
    });
    if (error) {
      console.error("notifyNewLead: Resend rejected the email:", error);
    }
  } catch (err) {
    console.error("notifyNewLead: failed to send lead notification email:", err);
  }
}

/**
 * Sends an already-built email through the same Resend config, sender and
 * recipients as the contact forms (RESEND_API_KEY, LEAD_NOTIFICATION_FROM,
 * LEAD_NOTIFICATION_EMAIL). Unlike notifyNewLead this REPORTS failure, since
 * the Google Ads landing-page endpoint must tell the visitor to call instead
 * of showing success for a lead nobody was emailed about.
 */
export async function sendNotificationEmail(mail: { subject: string; text: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.LEAD_NOTIFICATION_FROM || "Home7 Leads <onboarding@resend.dev>",
      to: getNotificationRecipients(),
      ...mail,
    });
    if (error) console.error("sendNotificationEmail: Resend rejected the email:", error);
    return !error;
  } catch (err) {
    console.error("sendNotificationEmail: failed:", err);
    return false;
  }
}
