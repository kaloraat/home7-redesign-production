import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runSync } from "@/lib/rea/sync";

/**
 * Called by the droplet's crontab every 5 minutes:
 *
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rea-sync
 *
 * Cron only knocks; whether a sync actually runs is decided by the admin's
 * REA Sync settings (on/off, every 15/30/60 minutes), so changing the
 * interval never means editing the crontab. Requires CRON_SECRET in
 * .env.local — without it the endpoint refuses every call.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runSync({ trigger: "cron" });
  const summary = result.skipped
    ? { skipped: result.skipped }
    : { ok: result.ok, error: result.error, changes: result.changes?.length ?? 0 };
  return NextResponse.json(summary, { status: result.ok === false ? 500 : 200 });
}
