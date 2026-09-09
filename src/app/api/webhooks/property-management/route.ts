import { NextResponse } from "next/server";

/**
 * Placeholder inbound webhook — if a property management system (the old
 * site referenced Inspection Manager / MRI as partners) needs to push
 * listing or inspection updates in, this is where that lands. Route
 * Handlers are the right shape for inbound webhooks; Server Actions can't
 * receive calls from outside the app at all.
 */
export async function POST() {
  return NextResponse.json({ status: "not implemented yet" }, { status: 501 });
}
