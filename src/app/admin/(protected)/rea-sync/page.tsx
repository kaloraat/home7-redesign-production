import Link from "next/link";
import dbConnect from "@/lib/db";
import { ReaSyncLog, type IReaSync, type IReaSyncLog } from "@/models/ReaSync";
import { getSyncSettings } from "@/lib/rea/sync";
import { resetSyncLock, saveSyncSettings, syncNow } from "@/actions/reaSync.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SubmitButton from "@/components/admin/SubmitButton";

// `now` is read here, in the data loader, rather than during render.
async function load(): Promise<{ settings: IReaSync | null; logs: IReaSyncLog[]; now: number }> {
  const now = Date.now();
  try {
    await dbConnect();
    const [settings, logs] = await Promise.all([
      getSyncSettings(),
      ReaSyncLog.find({}).sort({ createdAt: -1 }).limit(40).lean<IReaSyncLog[]>(),
    ]);
    return { settings, logs, now };
  } catch {
    return { settings: null, logs: [], now };
  }
}

const sydney = (d?: Date | null) =>
  d
    ? new Date(d).toLocaleString("en-AU", {
        timeZone: "Australia/Sydney",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "never";

function nextRun(s: IReaSync, now: number): string {
  if (!s.enabled) return "auto-sync is off";
  if (!s.lastRunAt) return "within 5 minutes";
  const due = new Date(new Date(s.lastRunAt).getTime() + s.intervalMinutes * 60_000);
  return due.getTime() <= now ? "within 5 minutes" : `around ${sydney(due)}`;
}

const ACTION_STYLE: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700",
  updated: "bg-sky-50 text-sky-700",
  linked: "bg-indigo-50 text-indigo-700",
  skipped: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
};

const secondaryButton =
  "inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer";

export default async function ReaSyncPage() {
  const { settings: s, logs, now } = await load();

  if (!s) {
    return (
      <div>
        <AdminPageHeader title="REA Sync" description="realestate.com.au listing sync." />
        <p className="mt-8 text-slate-500">Couldn&apos;t reach the database.</p>
      </div>
    );
  }

  const running = !!s.lockedUntil && new Date(s.lockedUntil).getTime() > now;
  const lastLog = logs[0];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="REA Sync"
        description="Keeps listings in line with realestate.com.au: new listings get a page, status and price changes show on the site automatically."
      />

      {s.lastError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">The last sync failed</p>
          <p className="mt-1 font-mono text-xs break-all">{s.lastError}</p>
          <p className="mt-2">
            The site keeps showing the listings it already has. If the error says &ldquo;login
            failed&rdquo;, the REA credentials in <code>.env.local</code> need checking.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Status</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-slate-500">Auto-sync</dt>
            <dd className={s.enabled ? "font-medium text-emerald-700" : "font-medium text-slate-500"}>
              {s.enabled ? `On — every ${s.intervalMinutes} minutes` : "Off"}
            </dd>
            <dt className="text-slate-500">Right now</dt>
            <dd>{running ? "A sync is running…" : "Idle"}</dd>
            <dt className="text-slate-500">Last run</dt>
            <dd>
              {sydney(s.lastRunAt)}
              {lastLog && (
                <span className={lastLog.ok ? "text-emerald-700" : "text-rose-700"}>
                  {" "}
                  — {lastLog.ok ? `OK, ${lastLog.changes.length} change${lastLog.changes.length === 1 ? "" : "s"}` : "failed"}
                </span>
              )}
            </dd>
            <dt className="text-slate-500">Last success</dt>
            <dd>{sydney(s.lastSuccessAt)}</dd>
            <dt className="text-slate-500">Last full check</dt>
            <dd>{sydney(s.lastFullRunAt)}</dd>
            <dt className="text-slate-500">Next run</dt>
            <dd>{nextRun(s, now)}</dd>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Settings</h2>
          <form action={saveSyncSettings} className="mt-3 space-y-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="enabled" defaultChecked={s.enabled} />
              <span>Sync automatically</span>
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Check realestate.com.au every</span>
              <select
                name="intervalMinutes"
                defaultValue={String(s.intervalMinutes)}
                className="border border-slate-300 rounded px-3 py-2 bg-white"
              >
                <option value="15">15 minutes (recommended)</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </label>
            <SubmitButton pendingChildren="Saving…">Save settings</SubmitButton>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Run it yourself</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={syncNow}>
                <SubmitButton className={secondaryButton} pendingChildren="Syncing…">
                  Sync now
                </SubmitButton>
              </form>
              <form action={syncNow}>
                <input type="hidden" name="full" value="1" />
                <SubmitButton className={secondaryButton} pendingChildren="Checking everything…">
                  Full re-check
                </SubmitButton>
              </form>
              <form action={resetSyncLock}>
                <SubmitButton className={secondaryButton} pendingChildren="Resetting…">
                  Reset
                </SubmitButton>
              </form>
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              <strong>Sync now</strong> picks up whatever changed on realestate.com.au since the last
              run. <strong>Full re-check</strong> compares every listing (it also runs by itself once
              a day). <strong>Reset</strong> clears a sync that got stuck and the last error.
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <h2 className="px-5 pt-5 font-semibold text-slate-900">Recent activity</h2>
        {logs.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-slate-500">No syncs have run yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {logs.map((log) => (
              <li key={String(log._id)} className="px-5 py-3">
                <p className="flex flex-wrap items-baseline gap-x-2 text-slate-700">
                  <span className="font-medium">{sydney(log.createdAt)}</span>
                  <span className="text-slate-400">
                    {log.trigger === "cron" ? "automatic" : log.trigger} ·{" "}
                    {log.kind === "full" ? "full check" : "changes only"} · {log.listingsSeen} listing
                    {log.listingsSeen === 1 ? "" : "s"} from REA · {(log.durationMs / 1000).toFixed(1)}s
                  </span>
                  {!log.ok && <span className="font-medium text-rose-700">failed: {log.error}</span>}
                  {log.ok && log.changes.length === 0 && <span className="text-slate-400">— no changes</span>}
                </p>
                {log.changes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {log.changes.map((c, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ACTION_STYLE[c.action] ?? ""}`}>
                          {c.action}
                        </span>
                        {c.slug ? (
                          <Link href={`/property/${c.slug}`} target="_blank" className="text-brand-gold-dark hover:underline">
                            {c.slug}
                          </Link>
                        ) : (
                          <span>REA {c.reaListingId}</span>
                        )}
                        <span className="text-slate-500">{c.summary}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
