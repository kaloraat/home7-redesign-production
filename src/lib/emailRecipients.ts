import { COMPANY } from "@/lib/constants";

/**
 * The notification recipient(s) for both lead emails (notifyLead.ts) and
 * reference-check emails (notifyTenancyReference.ts) — one shared parser so
 * both stay in sync. `LEAD_NOTIFICATION_EMAIL` normally holds a single
 * address (the real production recipient), but also accepts a
 * comma-separated list — used right now to send to both `admin@home7.com.au`
 * and a personal inbox in parallel while the home7.com.au sending domain is
 * still being verified in Resend, so nothing gets missed during that
 * transition. Falls back to `COMPANY.email` alone if the env var is unset.
 */
export function getNotificationRecipients(): string[] {
  const raw = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!raw) return [COMPANY.email];
  const addresses = raw.split(",").map((e) => e.trim()).filter(Boolean);
  return addresses.length > 0 ? addresses : [COMPANY.email];
}
