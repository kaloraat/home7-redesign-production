import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
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

  try {
    const { error } = await client.resend.emails.send({
      from: client.from,
      to: reference.agentEmail,
      subject: `Rental reference request — ${reference.tenantName}`,
      text: [
        `Hi ${reference.agentName},`,
        "",
        `${SITE_NAME} is assessing a rental application from ${reference.tenantName} (${reference.tenantAddress}), who has listed you as a previous agent.`,
        "",
        `Please complete a short reference check here: ${link}`,
        "",
        "This should take about 5 minutes. Your response is only visible to agents assessing the application, not to the applicant.",
        "",
        `Thanks,`,
        SITE_NAME,
      ].join("\n"),
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
