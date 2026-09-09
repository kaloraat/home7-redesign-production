import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import PropertyReference from "@/models/PropertyReference";
import { notifyReferenceOutcome } from "@/lib/notifyTenancyReference";

const BodySchema = z.object({
  reason: z.enum(["call_me_instead", "unknown_contact"]),
});

// Covers both "Call Me Instead" and "I don't know this tenant" — the two
// ways a previous agent can end the flow without filling out the full
// questionnaire. Public (token-gated, not admin-auth-gated) by design —
// the whole point is that the person filling this out is a *different*
// agency's staff member, not a Home7 admin.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const reference = await PropertyReference.findOne({ token });
  if (!reference) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reference.status !== "pending") {
    return NextResponse.json({ error: "This reference check is already closed." }, { status: 409 });
  }

  reference.status = "declined";
  reference.declineReason = parsed.data.reason;
  await reference.save();

  await notifyReferenceOutcome(reference, parsed.data.reason);

  return NextResponse.json({ ok: true });
}
