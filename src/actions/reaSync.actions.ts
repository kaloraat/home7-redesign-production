"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { ReaSync } from "@/models/ReaSync";
import { requireAdmin } from "@/lib/authz";
import { getSyncSettings, resetSync, runSync } from "@/lib/rea/sync";

/** Admin REA Sync page: on/off + interval. */
export async function saveSyncSettings(formData: FormData) {
  await requireAdmin();
  await dbConnect();
  const interval = Number(formData.get("intervalMinutes"));
  await getSyncSettings();
  await ReaSync.updateOne(
    { key: "rea" },
    {
      $set: {
        enabled: formData.get("enabled") === "on",
        intervalMinutes: [15, 30, 60].includes(interval) ? interval : 15,
      },
    }
  );
  revalidatePath("/admin/rea-sync");
}

/** "Sync now" (changes since the last run) and "Full re-check" (everything). */
export async function syncNow(formData: FormData) {
  await requireAdmin();
  await runSync({ trigger: "manual", full: formData.get("full") === "1" });
  revalidatePath("/admin/rea-sync");
}

export async function resetSyncLock() {
  await requireAdmin();
  await resetSync();
  revalidatePath("/admin/rea-sync");
}
