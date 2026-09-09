/**
 * One-off backfill: derives a real numeric value from each existing
 * listing's free-text `priceDisplay` (e.g. "$590,000 - $640,000", "$650
 * P/W", "$1,320,000- $1,400,000") so historical listings aren't a gap once
 * price-based sorting/filtering gets built — see PropertyForm.tsx's
 * "Price value" field, added for the same reason going forward.
 *
 * Where the number ends up depends on listing type, matching the existing
 * split between priceDisplay's two numeric siblings:
 *   - sale / sold / other  -> priceValue   (a sale-price-scale number)
 *   - rent / leased        -> rentPerWeek  (a weekly-rent-scale number,
 *                              same field "rent" listings already use —
 *                              only backfilled where it's not already set,
 *                              never overwriting a real value)
 *
 * Parsing: every `$<digits>` occurrence in the string is extracted (handles
 * "$ 650", "$600,000", "$570.00 P/W", "Rent $500 P/W", "$680 Per week",
 * "$1,320,000- $1,400,000" — verified against every distinct format
 * actually present in the current data, not assumed). For a range, the
 * LOWER number is used, per the same convention documented on the
 * PropertyForm.tsx priceValue field. Text with no "$" at all (e.g. "Contact
 * Agent", "Auction: Sat 14 March 2026 at 11:30 am") has no derivable number
 * and is deliberately left untouched — logged at the end so it can be
 * filled in by hand instead of being guessed at.
 *
 * Run: npx tsx scripts/backfill-price-value.ts
 * Requires MONGODB_URI in .env.local. Idempotent — safe to re-run (never
 * overwrites a priceValue/rentPerWeek that's already set).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";

function extractNumbers(str: string): number[] {
  const matches = [...str.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g)];
  return matches
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
}

async function main() {
  await dbConnect();

  const docs = await Property.find({ priceDisplay: { $exists: true, $ne: "" } }).lean();

  let priceValueSet = 0;
  let rentPerWeekSet = 0;
  let skippedAlreadySet = 0;
  const unparseable: { slug: string; priceDisplay: string }[] = [];

  for (const d of docs) {
    const nums = extractNumbers(d.priceDisplay ?? "");
    const isRentSide = d.listingType === "rent" || d.listingType === "leased";

    if (nums.length === 0) {
      unparseable.push({ slug: d.slug, priceDisplay: d.priceDisplay ?? "" });
      continue;
    }

    const value = Math.min(...nums);

    if (isRentSide) {
      if (d.rentPerWeek) {
        skippedAlreadySet++;
        continue;
      }
      await Property.updateOne({ _id: d._id }, { $set: { rentPerWeek: value } });
      rentPerWeekSet++;
    } else {
      if (d.priceValue) {
        skippedAlreadySet++;
        continue;
      }
      await Property.updateOne({ _id: d._id }, { $set: { priceValue: value } });
      priceValueSet++;
    }
  }

  console.log(`priceValue set: ${priceValueSet}`);
  console.log(`rentPerWeek set: ${rentPerWeekSet}`);
  console.log(`skipped (rentPerWeek already set): ${skippedAlreadySet}`);
  console.log(`unparseable (left untouched, needs manual entry): ${unparseable.length}`);
  unparseable.forEach((u) => console.log(`  - ${u.slug}: "${u.priceDisplay}"`));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
