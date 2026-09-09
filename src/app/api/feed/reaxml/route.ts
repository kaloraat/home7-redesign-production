import { NextResponse } from "next/server";

/**
 * Placeholder for portal syndication (realestate.com.au / domain.com.au
 * typically consume a REAXML or JSON feed of current listings). Not wired
 * up yet — the old site integrated with these portals directly, so this
 * endpoint exists as the obvious place to generate that feed from the
 * Property collection once syndication is prioritized.
 */
export async function GET() {
  return NextResponse.json({ status: "not implemented yet" }, { status: 501 });
}
