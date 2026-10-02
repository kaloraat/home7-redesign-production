"use client";

import { useState } from "react";

/**
 * Top of the edit form for a listing that comes from realestate.com.au —
 * says plainly what the sync will and won't change, and holds the "Keep my
 * description and photos" toggle (Property.reaLockedFields). The wording
 * follows the toggle, so what's on screen when Save is clicked is exactly
 * what will happen.
 */
export function ReaSyncBox({ reaListingId, defaultKeep }: { reaListingId: string; defaultKeep: boolean }) {
  const [keep, setKeep] = useState(defaultKeep);
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
      {/* Tells the save action this form had the toggle — an unticked
          checkbox sends nothing at all, which would otherwise look the
          same as a form without the box. */}
      <input type="hidden" name="reaSyncBox" value="1" />
      <p className="font-semibold text-slate-900">
        Synced from realestate.com.au{" "}
        <span className="font-normal text-slate-500">(REA listing {reaListingId})</span>
      </p>
      <p className="mt-1">
        <strong>Status, price, bedrooms, inspections and other details always follow realestate.com.au.</strong>{" "}
        If you change them here, they&apos;ll be put back the next time the listing is updated on REA.
        The page address (URL) never changes.
      </p>

      <label className="mt-3 flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="reaKeepContent"
          checked={keep}
          onChange={(e) => setKeep(e.target.checked)}
          className="mt-0.5"
        />
        <span className="font-medium text-slate-900">Keep my description and photos</span>
      </label>
      {keep ? (
        <p className="mt-1 ml-6 text-emerald-800">
          ✓ Your description and photos are protected. Updates on realestate.com.au won&apos;t change them.
        </p>
      ) : (
        <p className="mt-1 ml-6 text-amber-800">
          The description and photos follow realestate.com.au. When they change there, they&apos;ll
          replace what&apos;s here — including any edits you make now. Tick the box above to keep
          your own.
        </p>
      )}
    </div>
  );
}

export default ReaSyncBox;
