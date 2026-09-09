/**
 * One-off data fix: landSize and floorSize used to be a single field
 * (landSize) with a dynamically-changed display label depending on
 * property type — that approach was replaced with two genuinely
 * independent fields (a house can have both a land size and a floor size
 * at once), but every existing listing's value is still sitting in the old
 * `landSize` field regardless of what it actually represents. For property
 * types with no land of their own (Apartment, Unit, Flat, Condominium,
 * Room, Office, Shop — see NO_LAND_PROPERTY_TYPES), that value was always
 * really describing internal floor area (e.g. "88/1 Browne Parade", an
 * Apartment, has landSize "141 sq m" — that's its floor size, it doesn't
 * own any land) — so this moves it to `floorSize` and clears `landSize`
 * for exactly those listings. Every other property type is left untouched:
 * their landSize value genuinely is a land size.
 *
 * Run: npx tsx scripts/backfill-floor-size.ts
 * Requires MONGODB_URI in .env.local. Idempotent — a listing whose
 * landSize is already empty (already migrated, or never had one) is
 * skipped, never touched twice.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";
import { NO_LAND_PROPERTY_TYPES } from "../src/lib/constants";

async function main() {
  await dbConnect();

  const docs = await Property.find({
    landSize: { $exists: true, $ne: "" },
    propertyType: { $in: Array.from(NO_LAND_PROPERTY_TYPES) },
  }).lean();

  console.log(`Found ${docs.length} listing(s) with a landSize value under a no-land property type.`);

  for (const d of docs) {
    await Property.updateOne(
      { _id: d._id },
      { $set: { floorSize: d.landSize }, $unset: { landSize: "" } }
    );
    console.log(`  - ${d.slug} (${d.propertyType}): "${d.landSize}" moved landSize -> floorSize`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
