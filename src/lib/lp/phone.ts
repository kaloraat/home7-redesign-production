/** Australian phone helpers shared by the form (client) and /api/lead (server). */

const AU_PHONE = /^(?:\+?61|0)[23478]\d{8}$/;

export function stripPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "");
}

export function isValidAuPhone(raw: string): boolean {
  return AU_PHONE.test(stripPhone(raw));
}

/** "0412 345 678" | "+61412345678" | "61412345678" -> "+61412345678" */
export function toE164(raw: string): string {
  const s = stripPhone(raw);
  if (s.startsWith("+61")) return s;
  if (s.startsWith("61")) return `+${s}`;
  return `+61${s.replace(/^0/, "")}`;
}
