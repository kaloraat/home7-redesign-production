import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { LEAD_TYPES } from "@/lib/constants";
import { notifyNewLead } from "@/lib/notifyLead";

/**
 * Dedicated Route Handler (not a Server Action) — this is intentional.
 * Public lead-capture forms (appraisal, contact, tenant application) POST
 * here as plain JSON, which means this same endpoint can also be hit by:
 *   - a future separate frontend or mobile app,
 *   - a static/AMP landing page that isn't part of this Next.js app,
 *   - a marketing automation tool posting leads in from an ad platform.
 * Server Actions can't serve any of those callers — they're React-only RPC,
 * not a stable public contract. Anything that needs to be called from
 * outside this app's own React tree belongs in /api, not in actions/.
 */
const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  type: z.enum(LEAD_TYPES),
  suburb: z.string().optional(),
  // Set by the property page's "Request Inquiry" form — the Lead model
  // already had this ref field, it just had no caller ever setting it
  // until now. A 24-hex-char check rather than a full ObjectId import
  // here keeps this route free of a Mongoose dependency for validation
  // alone; dbConnect()/Lead.create() below still reject a malformed id.
  property: z
    .string()
    .regex(/^[0-9a-f]{24}$/i)
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  // `new Lead(...).save()` rather than `Lead.create(...)` — with a
  // `property` field in the payload, every shape of create() call (a bare
  // object, an array-wrapped object) gets TypeScript to pick Mongoose's
  // SchemaDefinition-shaped overload instead of "create one document",
  // because SchemaDefinition's own values can structurally be almost
  // anything. The constructor has one unambiguous signature and sidesteps
  // this entirely.
  const lead = await new Lead(parsed.data).save();

  // Awaited (not fire-and-forget) — serverless functions can be frozen/
  // torn down the instant the response is sent, so an unawaited async call
  // here risks never actually completing. notifyNewLead never throws, so
  // this can't turn a successful save into an error response for the
  // visitor; it only adds the email round-trip to the response time.
  await notifyNewLead(lead);

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
