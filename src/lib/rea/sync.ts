import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Agent from "@/models/Agent";
import { ReaSync, ReaSyncLog, type IReaSync, type IReaSyncChange } from "@/models/ReaSync";
import { exportListings } from "./client";
import { parseReaXml } from "./parse";
import { contentFor, LISTING_TYPE_LABEL } from "./map";
import { buildPlan, describeChange, type PlanAgent, type PlanProperty } from "./plan";
import { applyCreates, type CreateItem } from "./create";
import { copyReaImages, imagesMatchRea } from "./images";

/**
 * One sync run: ask REA what changed, bring the site in line.
 *
 *  - Facts (status, price, beds...) always follow REA.
 *  - Description and photos follow REA too, but only when REA itself
 *    changed the listing since our last sync, and never on a page whose
 *    "Keep my description and photos" toggle is on. (Older pages carry
 *    migrated text that differs slightly from REA's; without the "REA
 *    changed it" rule, the first run would rewrite all of them.)
 *  - New REA listings get a page; a manual page at the same address gets
 *    linked rather than duplicated. An address with several candidate
 *    pages is left for a person to sort out.
 *  - URLs never change. Nothing is ever deleted.
 *
 * Runs are serialized by a lock on the ReaSync document, which expires on
 * its own after LOCK_MINUTES so a crashed run can't block the next one.
 * Every run writes a ReaSyncLog, success or failure.
 */

const LOCK_MINUTES = 10;
// A full check (no `since` filter) once a day catches anything an
// incremental run missed.
const FULL_EVERY_HOURS = 24;
// Incremental runs ask for changes since the last run's START, minus a
// margin for clock differences between us and REA.
const SINCE_OVERLAP_MINUTES = 10;

export type SyncTrigger = "cron" | "manual" | "script";

export interface SyncResult {
  skipped?: string;
  ok?: boolean;
  error?: string;
  changes?: IReaSyncChange[];
}

export async function getSyncSettings(): Promise<IReaSync> {
  await dbConnect();
  return ReaSync.findOneAndUpdate(
    { key: "rea" },
    { $setOnInsert: { key: "rea" } },
    { upsert: true, new: true }
  ) as Promise<IReaSync>;
}

/** Whether cron should run now, given the admin's on/off and interval settings. */
function isDue(s: IReaSync, now: Date): boolean {
  if (!s.enabled) return false;
  if (!s.lastRunAt) return true;
  return now.getTime() - s.lastRunAt.getTime() >= s.intervalMinutes * 60_000 - 30_000;
}

export async function runSync(opts: { trigger: SyncTrigger; full?: boolean }): Promise<SyncResult> {
  const settings = await getSyncSettings();
  const now = new Date();
  if (opts.trigger === "cron" && !isDue(settings, now)) {
    return { skipped: settings.enabled ? "not due yet" : "auto-sync is off" };
  }

  // Take the lock only if nobody holds it (or it has expired).
  const locked = await ReaSync.findOneAndUpdate(
    { key: "rea", $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }] },
    { $set: { lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000), lastRunAt: now } },
    { new: true }
  );
  if (!locked) return { skipped: "another sync is already running" };

  const full =
    opts.full ||
    !locked.syncedThrough ||
    !locked.lastFullRunAt ||
    now.getTime() - locked.lastFullRunAt.getTime() > FULL_EVERY_HOURS * 3_600_000;
  const since = full
    ? undefined
    : new Date(locked.syncedThrough!.getTime() - SINCE_OVERLAP_MINUTES * 60_000);

  const changes: IReaSyncChange[] = [];
  let listingsSeen = 0;
  try {
    const listings = (await exportListings({ since })).flatMap(parseReaXml);
    listingsSeen = listings.length;
    await applyListings(listings, now, changes);

    await ReaSync.updateOne(
      { key: "rea" },
      {
        $set: {
          lockedUntil: null,
          lastSuccessAt: new Date(),
          lastError: null,
          syncedThrough: now,
          ...(full ? { lastFullRunAt: now } : {}),
        },
      }
    );
    await ReaSyncLog.create({
      kind: full ? "full" : "incremental",
      trigger: opts.trigger,
      ok: true,
      listingsSeen,
      changes,
      durationMs: Date.now() - now.getTime(),
    });
    return { ok: true, changes };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await ReaSync.updateOne({ key: "rea" }, { $set: { lockedUntil: null, lastError: error } });
    await ReaSyncLog.create({
      kind: full ? "full" : "incremental",
      trigger: opts.trigger,
      ok: false,
      error,
      listingsSeen,
      changes,
      durationMs: Date.now() - now.getTime(),
    });
    return { ok: false, error, changes };
  }
}

async function applyListings(
  listings: Awaited<ReturnType<typeof parseReaXml>>,
  now: Date,
  changes: IReaSyncChange[]
) {
  if (!listings.length) return;
  const props = (await Property.find({}).lean()).map((p) => ({ ...p, _id: String(p._id) })) as unknown as PlanProperty[];
  const agents = (await Agent.find({}, { name: 1 }).lean()).map((a) => ({ _id: String(a._id), name: a.name })) as PlanAgent[];
  const plan = buildPlan(listings, props, agents);

  for (const item of plan.items) {
    if (item.action === "superseded") continue;

    if (item.action === "create") {
      await applyCreates([item as CreateItem], null, () => {});
      changes.push({
        action: "created",
        reaListingId: item.listing.listingId,
        slug: item.slug,
        summary: `New page (${LISTING_TYPE_LABEL[item.facts.listingType]}, ${item.content.images.length} photos)`,
      });
      continue;
    }

    if (item.action === "link" && item.duplicates.length) {
      changes.push({
        action: "skipped",
        reaListingId: item.listing.listingId,
        slug: item.property.slug,
        summary: `Several pages match this address (${[item.property, ...item.duplicates].map((p) => p.slug).join(", ")}) — needs a person to pick one`,
      });
      continue;
    }

    // link (one matching manual page) or update (already linked)
    const p = item.property;
    const set: Record<string, unknown> = {};
    for (const c of item.changes) set[c.field] = c.to;
    const summary = item.changes.map(describeChange);

    // A featured listing that's now sold/leased drops off Featured, as
    // the admin form does on the same change.
    const closesOut =
      p.featured === true &&
      set.listingType !== undefined &&
      (set.listingType === "sold" || set.listingType === "leased");
    if (closesOut) {
      Object.assign(set, { featured: false, featuredUntil: null });
      summary.push("removed from Featured");
    }

    const reaChangedIt =
      !p.reaModTime || item.listing.modTime.getTime() > new Date(String(p.reaModTime)).getTime();
    const locked = (p.reaLockedFields as string[] | undefined) ?? [];
    if (reaChangedIt && item.action === "update") {
      const content = contentFor(item.listing);
      if (!locked.includes("description") && content.description && content.description !== p.description) {
        set.description = content.description;
        summary.push("description updated");
      }
      if (
        !locked.includes("images") &&
        content.images.length &&
        !imagesMatchRea((p.images as string[]) ?? [], p.slug, content.images)
      ) {
        const copied = await copyReaImages(p.slug, content.images);
        set.images = content.images.map((u) => copied.get(u)!);
        if (content.floorPlanImage) set.floorPlanImage = copied.get(content.floorPlanImage);
        summary.push(`photos updated (${content.images.length})`);
      }
    }

    if (item.action === "link") {
      set.reaListingId = item.listing.listingId;
      summary.unshift("linked to REA");
    }
    // Housekeeping fields aren't "changes" a person needs to read about,
    // and a listing with nothing new isn't written to at all.
    const meaningful = Object.keys(set).some((k) => k !== "reaStatus" && k !== "reaModTime");
    if (!meaningful && !reaChangedIt) continue;
    set.reaModTime = item.listing.modTime;
    set.reaSyncedAt = now;
    await Property.updateOne({ _id: new mongoose.Types.ObjectId(p._id) }, { $set: set });
    if (meaningful) {
      changes.push({
        action: item.action === "link" ? "linked" : "updated",
        reaListingId: item.listing.listingId,
        slug: p.slug,
        summary: summary.filter((s) => !s.startsWith("reaStatus") && !s.startsWith("reaModTime")).join("; "),
      });
    }
  }
}

/** Removes a stuck lock and the last error — the admin page's Reset button. */
export async function resetSync() {
  await getSyncSettings();
  await ReaSync.updateOne({ key: "rea" }, { $set: { lockedUntil: null, lastError: null } });
}
