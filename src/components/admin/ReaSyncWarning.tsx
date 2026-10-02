import Link from "next/link";
import dbConnect from "@/lib/db";
import { ReaSync } from "@/models/ReaSync";

// Two missed hours at the default 15-minute interval is ~8 failed runs in
// a row — past the point of a blip, but still the same morning.
const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

async function staleSince(): Promise<Date | "never" | null> {
  try {
    await dbConnect();
    const s = await ReaSync.findOne({ key: "rea" }).lean();
    if (!s?.enabled || !s.lastRunAt) return null;
    if (!s.lastSuccessAt) return s.lastError ? "never" : null;
    return Date.now() - new Date(s.lastSuccessAt).getTime() > STALE_AFTER_MS ? s.lastSuccessAt : null;
  } catch {
    return null;
  }
}

/** Shown across the top of every admin page while auto-sync keeps failing. */
export async function ReaSyncWarning() {
  const since = await staleSince();
  if (!since) return null;
  const when =
    since === "never"
      ? "hasn't succeeded yet"
      : `hasn't succeeded since ${new Date(since).toLocaleString("en-AU", {
          timeZone: "Australia/Sydney",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })}`;
  return (
    <div role="alert" className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <strong>realestate.com.au sync {when}.</strong> Listings on the site may be out of date.{" "}
      <Link href="/admin/rea-sync" className="font-medium underline">
        See what went wrong
      </Link>
    </div>
  );
}

export default ReaSyncWarning;
