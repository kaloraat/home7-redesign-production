/**
 * realestate.com.au → Property sync, run by hand.
 *
 * For now it only has a dry run: it fetches every Home7 listing from REA,
 * compares them with the properties collection, and prints what a real
 * sync WOULD do (link / update / create / superseded). It reads MongoDB
 * but writes nothing. The full plan is also saved to
 * rea-probe-output/dry-run-report.json (gitignored) for review.
 *
 * Run: npx tsx scripts/rea-sync.ts --dry-run
 * Requires in .env.local: MONGODB_URI, REA_CLIENT_ID, REA_CLIENT_SECRET, REA_AGENCY_ID.
 */
import fs from "node:fs";
import path from "node:path";

process.loadEnvFile(".env.local");

import mongoose from "mongoose";
import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";
import Agent from "../src/models/Agent";
import { exportListings } from "../src/lib/rea/client";
import { parseReaXml } from "../src/lib/rea/parse";
import { LISTING_TYPE_LABEL, streetAddress, suburbName } from "../src/lib/rea/map";
import { buildPlan, describeChange, type PlanAgent, type PlanProperty } from "../src/lib/rea/plan";

async function main() {
  if (!process.argv.includes("--dry-run")) {
    console.error("Only --dry-run is available yet. Run: npx tsx scripts/rea-sync.ts --dry-run");
    process.exit(1);
  }

  const pages = await exportListings();
  const listings = pages.flatMap(parseReaXml);
  console.log(`REA: ${listings.length} listings (${pages.length} page${pages.length === 1 ? "" : "s"})`);

  // A dry run must not change the database at all — not even the new
  // reaListingId index Mongoose would otherwise build on first use.
  mongoose.set("autoIndex", false);
  await dbConnect();
  const props = (await Property.find({}).lean()).map((p) => ({ ...p, _id: String(p._id) })) as unknown as PlanProperty[];
  const agents = (await Agent.find({}, { name: 1 }).lean()).map((a) => ({ _id: String(a._id), name: a.name })) as PlanAgent[];
  console.log(`Database: ${props.length} properties, ${agents.length} agents\n`);

  const plan = buildPlan(listings, props, agents);
  const label = (l: (typeof listings)[number]) =>
    `${streetAddress(l)}, ${suburbName(l)} [REA ${l.listingId}, ${l.status}]`;

  const by = <A extends string>(a: A) => plan.items.filter((i) => i.action === a);
  const links = plan.items.flatMap((i) => (i.action === "link" ? [i] : []));
  const updates = plan.items.flatMap((i) => (i.action === "update" ? [i] : []));
  const creates = plan.items.flatMap((i) => (i.action === "create" ? [i] : []));
  const superseded = plan.items.flatMap((i) => (i.action === "superseded" ? [i] : []));

  console.log(`=== LINK to an existing page (${links.length}) — page stays as it is, gets the REA ID ===`);
  for (const i of links) {
    console.log(`\n• ${label(i.listing)}\n  → /property/${i.property.slug}`);
    for (const c of i.changes) console.log(`    differs: ${describeChange(c)}`);
    for (const d of i.duplicates) console.log(`    DUPLICATE page: /property/${d.slug} (${LISTING_TYPE_LABEL[d.listingType]})`);
  }

  if (updates.length) {
    console.log(`\n=== UPDATE an already-linked page (${updates.length}) ===`);
    for (const i of updates) {
      console.log(`• ${label(i.listing)} → /property/${i.property.slug}`);
      for (const c of i.changes) console.log(`    ${describeChange(c)}`);
    }
  }

  console.log(`\n=== CREATE a new page (${creates.length}) ===`);
  for (const i of creates) {
    const photos = i.content.images.length;
    console.log(
      `• ${label(i.listing)}\n  → /property/${i.slug}  (${LISTING_TYPE_LABEL[i.facts.listingType]}, ` +
        `${i.facts.priceDisplay ?? "no price"}, ${photos} photo${photos === 1 ? "" : "s"}, ` +
        `agent ${i.agentId ? "matched" : `UNKNOWN (${i.listing.agents[0]?.name ?? "none"})`})`
    );
  }

  console.log(`\n=== SUPERSEDED (${superseded.length}) — older REA listing for an address that has a newer one ===`);
  for (const i of superseded) console.log(`• ${label(i.listing)} (newer: REA ${i.newerListingId})`);

  const statusFixes = links.filter((i) => i.changes.some((c) => c.field === "listingType"));
  const withDuplicates = links.filter((i) => i.duplicates.length);
  console.log(`\n=== SUMMARY ===`);
  console.log(`REA listings:        ${listings.length}`);
  console.log(`  link existing:     ${links.length}  (status differs on ${statusFixes.length})`);
  console.log(`  already linked:    ${by("update").length}`);
  console.log(`  create new:        ${creates.length}`);
  console.log(`  superseded:        ${superseded.length}`);
  console.log(`Addresses with duplicate pages: ${withDuplicates.length}`);
  console.log(`Unknown REA agents:  ${plan.unknownAgents.join(", ") || "none"}`);
  console.log(`\nNothing was written to the database.`);

  const out = path.resolve("rea-probe-output");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "dry-run-report.json"), JSON.stringify(plan, null, 2));
  console.log(`Full plan: ${path.relative(".", path.join(out, "dry-run-report.json"))}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
