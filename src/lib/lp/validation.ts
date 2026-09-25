import { z } from "zod";
import { isValidAuPhone } from "./phone";

export const LEAD_TYPES = ["pm", "sell"] as const;
export type LpLeadType = (typeof LEAD_TYPES)[number];

const attrib = z.string().max(500).optional().default("");

/** Shared by the LeadForm (client) and POST /api/lead (server). */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80, "That name is a bit long"),
  phone: z
    .string()
    .trim()
    .refine(isValidAuPhone, "Please enter a mobile number like 0412 345 678"),
  suburb: z.string().trim().min(2, "Please enter the property's suburb").max(120, "That's a bit long"),
  // pm: intent chips, sell: timeframe chips — both optional.
  choice: z.string().max(80).optional().default(""),
  lead_type: z.enum(LEAD_TYPES),
  region: z.enum(["all", "liverpool", "campbelltown", "parramatta"]),
  form_instance: z.enum(["hero", "footer"]),
  // Spam traps
  company: z.string().max(200).optional().default(""),
  form_started_at: z.number().optional().default(0),
  turnstile_token: z.string().max(4000).optional(),
  // Attribution (see ClickIdCapture)
  gclid: attrib,
  gbraid: attrib,
  wbraid: attrib,
  utm_source: attrib,
  utm_medium: attrib,
  utm_campaign: attrib,
  utm_term: attrib,
  utm_content: attrib,
  landing_url: attrib,
  referrer: attrib,
});

export type LeadInput = z.infer<typeof leadSchema>;
