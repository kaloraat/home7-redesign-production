import { Resend } from "resend";
import { SITE_URL } from "@/lib/constants";
import { getNotificationRecipients } from "@/lib/emailRecipients";
import type { ITenancyApplication } from "@/models/TenancyApplication";

// Same never-throws resilience pattern as notifyLead.ts/notifyTenancyReference.ts.
function getResend(): { resend: Resend; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("notifyTenancyApplication: RESEND_API_KEY not set - skipping email.");
    return null;
  }
  const from = process.env.LEAD_NOTIFICATION_FROM || "Home7 <onboarding@resend.dev>";
  return { resend: new Resend(apiKey), from };
}

/** Sent to Home7 staff when a new rental application is submitted. */
export async function notifyNewTenancyApplication(application: ITenancyApplication) {
  const client = getResend();
  if (!client) return;

  const to = getNotificationRecipients();
  const co = application.coApplicant;
  const coName = co ? `${co.firstName} ${co.lastName}` : application.coApplicantName;
  const applicantName = `${application.firstName} ${application.lastName}${coName ? ` & ${coName}` : ""}`;
  const v2Second = application.v2?.second?.personal;

  try {
    const { error } = await client.resend.emails.send({
      from: client.from,
      to,
      subject: `New rental application - ${applicantName} (${application.propertyAddress})`,
      text: [
        `A new rental application has been submitted.`,
        "",
        `Applicant: ${applicantName}`,
        `Property: ${application.propertyAddress}`,
        `Email: ${application.email}`,
        `Mobile: ${application.mobilePhone}`,
        ...(co ? ["", `Second applicant: ${co.firstName} ${co.lastName}`, `Email: ${co.email}`, `Mobile: ${co.mobilePhone}`] : []),
        ...(v2Second ? ["", `Second applicant: ${coName}`, `Email: ${v2Second.email}`, `Mobile: ${v2Second.mobile}`] : []),
        "",
        "Documents are stored privately. Open them from the admin page (staff login required).",
        "",
        `Full application: ${SITE_URL}/admin/rental-applications/${application._id}`,
      ].join("\n"),
    });
    if (error) console.error("notifyNewTenancyApplication: Resend rejected the email:", error);
  } catch (err) {
    console.error("notifyNewTenancyApplication: failed to send:", err);
  }
}
