import { Schema, models, model, type Document, type Model } from "mongoose";

/**
 * Settings + run state for the realestate.com.au listing sync — one
 * document (key "rea"), edited from the admin's REA Sync page. Lives in the
 * DB rather than env vars so the interval can change and a stuck sync can
 * be reset without touching the server.
 *
 * The droplet's cron calls the sync endpoint every few minutes; the
 * endpoint itself decides whether a run is due from `enabled` and
 * `intervalMinutes`, so cron never needs editing either.
 */
export interface IReaSync extends Document {
  key: "rea";
  enabled: boolean;
  intervalMinutes: 15 | 30 | 60;
  // While set and in the future, a run is in progress and others skip.
  // A crashed run's lock simply expires, so nothing stays stuck for long.
  lockedUntil?: Date | null;
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastFullRunAt?: Date;
  lastError?: string | null;
  // REA's `since` cursor: the start time of the last successful run, so the
  // next run only asks for listings modified after it.
  syncedThrough?: Date;
}

const ReaSyncSchema = new Schema<IReaSync>(
  {
    key: { type: String, enum: ["rea"], required: true, unique: true, default: "rea" },
    enabled: { type: Boolean, default: false },
    intervalMinutes: { type: Number, enum: [15, 30, 60], default: 15 },
    lockedUntil: Date,
    lastRunAt: Date,
    lastSuccessAt: Date,
    lastFullRunAt: Date,
    lastError: String,
    syncedThrough: Date,
  },
  { timestamps: true }
);

export const ReaSync: Model<IReaSync> =
  models.ReaSync || model<IReaSync>("ReaSync", ReaSyncSchema);

/** One line in the admin's "Recent activity" list. */
export interface IReaSyncChange {
  action: "linked" | "created" | "updated" | "skipped" | "error";
  reaListingId: string;
  slug?: string;
  summary: string; // plain English, e.g. "For Rent → Leased"
}

export interface IReaSyncLog extends Document {
  kind: "incremental" | "full";
  trigger: "cron" | "manual" | "script";
  dryRun: boolean;
  ok: boolean;
  error?: string;
  listingsSeen: number;
  changes: IReaSyncChange[];
  durationMs: number;
  createdAt: Date;
}

const ReaSyncLogSchema = new Schema<IReaSyncLog>(
  {
    kind: { type: String, enum: ["incremental", "full"], required: true },
    trigger: { type: String, enum: ["cron", "manual", "script"], required: true },
    dryRun: { type: Boolean, default: false },
    ok: { type: Boolean, required: true },
    error: String,
    listingsSeen: { type: Number, default: 0 },
    changes: [
      {
        _id: false,
        action: { type: String, required: true },
        reaListingId: { type: String, required: true },
        slug: String,
        summary: { type: String, required: true },
      },
    ],
    durationMs: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Keep ~90 days of history; a run every 15 minutes would otherwise grow forever.
ReaSyncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ReaSyncLog: Model<IReaSyncLog> =
  models.ReaSyncLog || model<IReaSyncLog>("ReaSyncLog", ReaSyncLogSchema);
