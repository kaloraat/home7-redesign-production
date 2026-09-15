import { Resend } from "resend";
import { COMPANY, SITE_NAME, SITE_URL } from "@/lib/constants";
import { getNotificationRecipients } from "@/lib/emailRecipients";
import type { IPropertyReference } from "@/models/PropertyReference";

// Same resilience pattern as notifyLead.ts — never throws, since both of
// these fire after the real work (creating/updating the DB record) already
// succeeded. An email hiccup here should never turn a successful request
// into an error for the person on the other end of it.
function getResend(): { resend: Resend; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("notifyTenancyReference: RESEND_API_KEY not set — skipping email.");
    return null;
  }
  const from = process.env.LEAD_NOTIFICATION_FROM || "Home7 <onboarding@resend.dev>";
  return { resend: new Resend(apiKey), from };
}

/** Sent to the tenant's PREVIOUS agent when a property manager starts a
 * reference check — the tokenized link they'll use to respond. */
export async function sendReferenceRequestEmail(reference: IPropertyReference) {
  const client = getResend();
  if (!client) return;

  // Matches the old Laravel site's real, currently-live route
  // (/property-reference-request/{token}) exactly — not a stylistic
  // choice. This is an active feature already emailing real links in
  // production today; any request sent before cutover has to keep
  // resolving after it, and a single-use token isn't something a Redirect
  // table entry could be pre-created for (the token doesn't exist until
  // the email is sent). Matching the path outright avoids the problem
  // entirely rather than working around it later.
  const link = `${SITE_URL}/property-reference-request/${reference.token}`;

  // HTML body matches the old Laravel site's mail/reference_request.blade.php
  // wording and layout (orange "Start Reference" button, same paragraphs,
  // same P/E/W footer) — the previous agent receiving this is used to that
  // format, so this rebuild reproduces it rather than the plain-text
  // notification-style email that shipped in the first pass. COMPANY.address
  // is used instead of the old template's own slightly-wrong "Suite – 7"
  // text, same reasoning as the intro screen on the landing page.
  const html = `<!doctype html>
<html lang="en">
  <body style="font-family:Helvetica,Arial,sans-serif;color:#1e293b;">
    <div style="max-width:560px;margin:0 auto;">
      <p style="margin:3px 0;">Dear ${reference.agentName},</p>
      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;"><strong>${reference.tenantName}</strong> is applying for tenancy with our agency and to fully process their application we require a reference from you.</p>
      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;"><strong>Could you please assist us by clicking the below link and completing the reference:</strong></p>
      <p style="margin:3px 0;">&nbsp;</p>

      <table role="presentation" style="border-radius:3px;background-color:#d75624;" border="0" cellspacing="0" cellpadding="0">
        <tbody>
          <tr>
            <td style="padding:15px 30px;" align="center" valign="middle">
              <a style="color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;" href="${link}">Start Reference</a>
            </td>
          </tr>
        </tbody>
      </table>

      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;"><em>Note: ${reference.tenantName} has given permission for this reference and signed consent is shown after clicking the link.</em></p>
      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;">If you would prefer us to call you, please reply with your best contact number or contact us direct.</p>
      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;">Thank you for your assistance.</p>
      <p style="margin:3px 0;">&nbsp;</p>

      <p style="margin:3px 0;">Regards,</p>
      <p style="margin:3px 0;"><strong>${SITE_NAME}</strong></p>
      <p style="margin:3px 0;">${COMPANY.address}</p>

      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;"><strong>P:&nbsp;</strong>${COMPANY.phone}</p>
      <p style="margin:3px 0;"><strong>E:&nbsp;</strong><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></p>
      <p style="margin:3px 0;"><strong>W:&nbsp;</strong><a href="${SITE_URL}" target="_blank">${SITE_URL}/</a></p>
      <p style="margin:3px 0;">&nbsp;</p>
      <p style="margin:3px 0;font-size:12px;color:#888888;">All rights reserved by ${SITE_NAME}.</p>
    </div>
  </body>
</html>`;

  const text = [
    `Dear ${reference.agentName},`,
    "",
    `${reference.tenantName} is applying for tenancy with our agency and to fully process their application we require a reference from you.`,
    "",
    `Could you please assist us by clicking the below link and completing the reference: ${link}`,
    "",
    `Note: ${reference.tenantName} has given permission for this reference and signed consent is shown after clicking the link.`,
    "",
    "If you would prefer us to call you, please reply with your best contact number or contact us direct.",
    "",
    "Thank you for your assistance.",
    "",
    "Regards,",
    SITE_NAME,
    COMPANY.address,
    "",
    `P: ${COMPANY.phone}`,
    `E: ${COMPANY.email}`,
    `W: ${SITE_URL}/`,
    "",
    `All rights reserved by ${SITE_NAME}.`,
  ].join("\n");

  try {
    const { error } = await client.resend.emails.send({
      from: client.from,
      to: reference.agentEmail,
      subject: `Property Reference Request for ${reference.tenantName}`,
      html,
      text,
    });
    if (error) console.error("sendReferenceRequestEmail: Resend rejected the email:", error);
  } catch (err) {
    console.error("sendReferenceRequestEmail: failed to send:", err);
  }
}

/** Sent to Home7 admin once a reference check reaches any final state —
 * submitted, or the previous agent declined via "Call Me Instead"/"I don't
 * know this tenant". */
export async function notifyReferenceOutcome(
  reference: IPropertyReference,
  outcome: "submitted" | "call_me_instead" | "unknown_contact"
) {
  const client = getResend();
  if (!client) return;

  const to = getNotificationRecipients();
  const subjectByOutcome: Record<typeof outcome, string> = {
    submitted: `Reference check completed — ${reference.tenantName}`,
    call_me_instead: `Reference check: agent asked to be called — ${reference.tenantName}`,
    unknown_contact: `Reference check: agent doesn't know this tenant — ${reference.tenantName}`,
  };

  try {
    const { error } = await client.resend.emails.send({
      from: client.from,
      to,
      subject: subjectByOutcome[outcome],
      text: [
        `Tenant: ${reference.tenantName}`,
        `Address: ${reference.tenantAddress}`,
        `Previous agent: ${reference.agentName} (${reference.agentEmail})`,
        "",
        outcome === "submitted"
          ? `Full response is in the admin dashboard: ${SITE_URL}/admin/tenancy-checks/${reference._id}`
          : outcome === "call_me_instead"
            ? "The agent asked to be called instead of filling out the form."
            : "The agent said they don't recognise this tenant.",
      ].join("\n"),
    });
    if (error) console.error("notifyReferenceOutcome: Resend rejected the email:", error);
  } catch (err) {
    console.error("notifyReferenceOutcome: failed to send:", err);
  }
}
