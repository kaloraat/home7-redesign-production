/**
 * realestate.com.au → Property sync, run by hand.
 *
 *   --dry-run          Fetch every Home7 listing from REA, compare with the
 *                      properties collection, print what a sync WOULD do.
 *                      Reads only. Full plan → rea-probe-output/dry-run-report.json
 *
 *   --link             Step B preview: exactly what --link --apply will change,
 *                      page by page. Reads only.
 *   --link --apply     Step B: back up all properties, then link existing
 *                      pages to REA (REA's status/price/facts + REA ID),
 *                      refresh the pages that had duplicates, and delete the
 *                      duplicates that already 301 to the kept page. Every
 *                      change goes in an undo journal first.
 *
 *   --create           Step C preview: the new pages --create --apply will add.
 *   --create --apply   Step C: back up all properties, copy each new REA
 *                      listing's photos to S3 and create its page. Journaled.
 *
 *   --unlock-content [--apply]
 *                      Clear "Keep my description and photos" on every
 *                      REA-linked page, so content follows REA by default
 *                      (2026-10-02 decision). Preview unless --apply; journaled.
 *
 *   --undo <journal>   Reverse a run, using the journal file it printed.
 *
 * Backups and journals: rea-probe-output/backups/ (gitignored).
 * Requires in .env.local: MONGODB_URI, REA_CLIENT_ID, REA_CLIENT_SECRET,
 * REA_AGENCY_ID; --link --apply also needs the AWS_* / CloudFront vars
 * (to copy REA photos to S3).
 */
import fs from "node:fs";
import path from "node:path";

process.loadEnvFile(".env.local");

import mongoose from "mongoose";
import dbConnect from "../src/lib/db";
import Property from "../src/models/Property";
import Agent from "../src/models/Agent";
import Redirect from "../src/models/Redirect";
import { exportListings } from "../src/lib/rea/client";
import { parseReaXml, type ReaListing } from "../src/lib/rea/parse";
import { factsFor, LISTING_TYPE_LABEL, streetAddress, suburbName } from "../src/lib/rea/map";
import { buildPlan, describeChange, type PlanAgent, type PlanProperty } from "../src/lib/rea/plan";
import { applyLinkSteps, linkSteps } from "../src/lib/rea/link";
import { backupProperties, Journal, undoJournal } from "../src/lib/rea/journal";
import { applyCreates, type CreateItem } from "../src/lib/rea/create";

const OUT_DIR = path.resolve("rea-probe-output");
const BACKUP_DIR = path.join(OUT_DIR, "backups");
const args = process.argv.slice(2);
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const rel = (p: string) => path.relative(".", p);

const label = (l: ReaListing) => `${streetAddress(l)}, ${suburbName(l)} [REA ${l.listingId}, ${l.status}]`;

async function load() {
  const pages = await exportListings();
  const listings = pages.flatMap(parseReaXml);
  console.log(`REA: ${listings.length} listings (${pages.length} page${pages.length === 1 ? "" : "s"})`);

  await dbConnect();
  const props = (await Property.find({}).lean()).map((p) => ({ ...p, _id: String(p._id) })) as unknown as PlanProperty[];
  const agents = (await Agent.find({}, { name: 1 }).lean()).map((a) => ({ _id: String(a._id), name: a.name })) as PlanAgent[];
  console.log(`Database: ${props.length} properties, ${agents.length} agents\n`);
  return { listings, plan: buildPlan(listings, props, agents) };
}

async function dryRun() {
  const { listings, plan } = await load();
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

  console.log(`\n=== UPDATE an already-linked page (${updates.length}) ===`);
  for (const i of updates) {
    if (!i.changes.length) continue;
    console.log(`• ${label(i.listing)} → /property/${i.property.slug}`);
    for (const c of i.changes) console.log(`    ${describeChange(c)}`);
  }
  const unchanged = updates.filter((i) => !i.changes.length).length;
  if (unchanged) console.log(`  (${unchanged} already up to date)`);

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
  console.log(`\n=== SUMMARY ===`);
  console.log(`REA listings:        ${listings.length}`);
  console.log(`  link existing:     ${links.length}  (status differs on ${statusFixes.length})`);
  console.log(`  already linked:    ${updates.length}  (${updates.length - unchanged} with changes)`);
  console.log(`  create new:        ${creates.length}`);
  console.log(`  superseded:        ${superseded.length}`);
  console.log(`Addresses with duplicate pages: ${links.filter((i) => i.duplicates.length).length}`);
  console.log(`Unknown REA agents:  ${plan.unknownAgents.join(", ") || "none"}`);
  console.log(`\nNothing was written to the database.`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "dry-run-report.json"), JSON.stringify(plan, null, 2));
  console.log(`Full plan: ${rel(path.join(OUT_DIR, "dry-run-report.json"))}`);
}

async function link(apply: boolean) {
  const { listings, plan } = await load();
  const facts = new Map(listings.map((l) => [l.listingId, factsFor(l)]));
  const redirects = new Map(
    (await Redirect.find({ fromPath: /^\/property\// }).lean()).map((r) => [r.fromPath, r.toPath])
  );
  const { links, deletes } = linkSteps(plan, facts, redirects);

  console.log(`=== ${apply ? "APPLYING" : "PREVIEW"}: link ${links.length} pages to REA ===`);
  for (const s of links) {
    console.log(`\n• /property/${s.property.slug}  ←  ${label(s.listing)}`);
    for (const c of s.changes) console.log(`    ${describeChange(c)}`);
    if (!s.changes.length) console.log(`    (facts already match REA)`);
    console.log(
      s.refreshContent
        ? `    description + photos: REPLACED with REA's current ad (${s.listing.images.length + s.listing.floorplans.length} photos copied to S3)`
        : `    description + photos: kept, protected from future syncs`
    );
    if (s.unfeature) console.log(`    featured: switched off (now ${LISTING_TYPE_LABEL[s.facts.listingType]})`);
  }

  console.log(`\n=== ${apply ? "APPLYING" : "PREVIEW"}: delete ${deletes.length} duplicate pages ===`);
  for (const d of deletes) {
    console.log(
      `• /property/${d.property.slug} → 301 to /property/${d.keepSlug}: ` +
        (d.redirectOk ? "redirect in place, will delete" : "NO MATCHING REDIRECT — will be skipped")
    );
  }

  if (!apply) {
    console.log(`\nNothing was written. To apply: npx tsx scripts/rea-sync.ts --link --apply`);
    return;
  }

  const backup = path.join(BACKUP_DIR, `properties-${stamp()}.json`);
  console.log(`\nBackup: ${await backupProperties(backup)} properties → ${rel(backup)}`);
  // Builds the unique reaListingId index before any IDs are written; it
  // would otherwise be built implicitly the next time the app starts.
  await Property.collection.createIndex(
    { reaListingId: 1 },
    { unique: true, partialFilterExpression: { reaListingId: { $type: "string" } } }
  );
  const journal = new Journal(path.join(BACKUP_DIR, `journal-link-${stamp()}.json`), "step B: link existing pages");
  console.log(`Undo journal: ${rel(journal.file)}\n`);
  try {
    await applyLinkSteps(links, deletes, journal, (line) => console.log(`  ${line}`));
  } finally {
    console.log(`\n${journal.size} change(s) recorded. To reverse: npx tsx scripts/rea-sync.ts --undo ${rel(journal.file)}`);
  }
}

async function create(apply: boolean) {
  const { plan } = await load();
  const items = plan.items.filter((i): i is CreateItem => i.action === "create");
  const agentNames = new Map(
    (await Agent.find({}, { name: 1 }).lean()).map((a) => [String(a._id), a.name])
  );

  console.log(`=== ${apply ? "APPLYING" : "PREVIEW"}: create ${items.length} new pages ===`);
  for (const i of items) {
    const f = i.facts;
    const facts = [
      f.bedrooms && `${f.bedrooms} bed`,
      f.bathrooms && `${f.bathrooms} bath`,
      f.carSpaces && `${f.carSpaces} car`,
      f.landSize || f.floorSize,
    ].filter(Boolean);
    console.log(
      `\n• /property/${i.slug}\n` +
        `    ${LISTING_TYPE_LABEL[f.listingType]} · ${f.priceDisplay ?? "no price"} · ${facts.join(", ") || "no room counts"}\n` +
        `    ${i.content.images.length} photos → S3 · agent: ${i.agentId ? agentNames.get(i.agentId) : "NONE"} · ` +
        `date added: ${i.listing.modTime.toISOString().slice(0, 10)} · REA ${i.listing.listingId}`
    );
  }
  if (plan.unknownAgents.length) console.log(`\nUnknown REA agents (pages get no agent): ${plan.unknownAgents.join(", ")}`);

  if (!apply) {
    console.log(`\nNothing was written. To apply: npx tsx scripts/rea-sync.ts --create --apply`);
    return;
  }
  const backup = path.join(BACKUP_DIR, `properties-${stamp()}.json`);
  console.log(`\nBackup: ${await backupProperties(backup)} properties → ${rel(backup)}`);
  const journal = new Journal(path.join(BACKUP_DIR, `journal-create-${stamp()}.json`), "step C: create new pages");
  console.log(`Undo journal: ${rel(journal.file)}\n`);
  try {
    await applyCreates(items, journal, (line) => console.log(`  ${line}`));
  } finally {
    console.log(`\n${journal.size} page(s) created. To reverse: npx tsx scripts/rea-sync.ts --undo ${rel(journal.file)}`);
  }
}

async function unlockContent(apply: boolean) {
  await dbConnect();
  const locked = await mongoose.connection
    .collection("properties")
    .find({ reaListingId: { $type: "string" }, "reaLockedFields.0": { $exists: true } })
    .toArray();
  console.log(`${locked.length} REA-linked page(s) have "Keep my description and photos" on:`);
  for (const d of locked) console.log(`  /property/${d.slug}  (${(d.reaLockedFields as string[]).join(", ")})`);
  if (!apply) {
    console.log(`\nNothing was written. To apply: npx tsx scripts/rea-sync.ts --unlock-content --apply`);
    return;
  }
  const journal = new Journal(path.join(BACKUP_DIR, `journal-unlock-${stamp()}.json`), "clear content locks");
  for (const d of locked) {
    journal.record("update", d._id, d as never);
    await mongoose.connection.collection("properties").updateOne({ _id: d._id }, { $set: { reaLockedFields: [] } });
  }
  console.log(`\nCleared on ${journal.size} page(s). To reverse: npx tsx scripts/rea-sync.ts --undo ${rel(journal.file)}`);
}

async function undo(file: string) {
  await dbConnect();
  const { restored, removed } = await undoJournal(file);
  console.log(`Undo complete: ${restored} record(s) restored, ${removed} created record(s) removed.`);
}

async function main() {
  // Only --link --apply may change indexes, and it does so explicitly.
  mongoose.set("autoIndex", false);

  if (args.includes("--dry-run")) await dryRun();
  else if (args.includes("--link")) await link(args.includes("--apply"));
  else if (args.includes("--create")) await create(args.includes("--apply"));
  else if (args.includes("--unlock-content")) await unlockContent(args.includes("--apply"));
  else if (args[0] === "--undo" && args[1]) await undo(args[1]);
  else {
    console.error("Usage: npx tsx scripts/rea-sync.ts --dry-run | --link [--apply] | --create [--apply] | --unlock-content [--apply] | --undo <journal-file>");
    process.exit(1);
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await mongoose.disconnect();
  process.exit(1);
});
