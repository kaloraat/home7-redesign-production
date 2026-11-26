/**
 * One-off wording cleanup for published Content (2026-11-27).
 * Dry run by default: prints every change and writes nothing.
 *   npx tsx scripts/wording-cleanup-2026-11-27.ts            # dry run
 *   flags pick parts: --a (invented testimonials), --b (claim rewording), --emdash (C)
 *   npx tsx scripts/wording-cleanup-2026-11-27.ts --a --emdash --apply
 * Backup of every touched doc goes to content-archive/BACKUP-wording-cleanup-2026-11-27.json.
 * updatedAt is left untouched (timestamps: false).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import type { Types } from "mongoose";
import dbConnect from "../src/lib/db";
import Content from "../src/models/Content";
import Redirect from "../src/models/Redirect";

const APPLY = process.argv.includes("--apply");
const EMDASH = process.argv.includes("--emdash");
const PARTS = new Set(["a", "b"].filter((p) => process.argv.includes(`--${p}`)));

// Real Google reviews (same as TESTIMONIALS in src/lib/constants.ts).
const R = {
  jobaer: "The team at Home7 Real Estate is amazing. Fast service, low cost, and excellent communication. Mohammed is the best agent I've worked with.",
  james: "Excellent experience with Home7 Real Estate. Mohammed is professional, honest, and highly knowledgeable about the local property market. His communication, negotiation skills, and attention to detail made the entire process smooth and stress-free.",
  msb: "Home7 real estate and founder Mr Mohammad is a place of trust. I have been dealing with Mr Mohammad for past 6 years on various occasion. Mohammad has helped and still helping us in sales, managing my investment property.",
  jubayer: "Best property management service I've experienced! Home7 Real Estate offers great value with low charges and excellent communication. Mohammed is an expert in the property market.",
  zilani: "Outstanding real estate service in the area! The team is professional, efficient, and always quick to respond. Mohammed brings deep expertise in property sales and is a highly effective negotiator.",
};
const quote = (q: string) => `<p><em>“${q}”</em> (Google review)</p>`;

type Op = ({ part?: "a" | "b" }) & (
  | { kind: "text"; find: string; replace: string }
  // Replace from the opening <tag> enclosing `startSnippet` to the closing </tag> enclosing `endSnippet`.
  | { kind: "block"; tag: string; startSnippet: string; endSnippet: string; replace: string });

interface Change {
  urlPath: "blog" | "root";
  slug: string;
  set?: { title?: string; seoTitle?: string }; // always part B
  ops?: Op[];
}

const CHANGES: Change[] = [
  // A. Invented testimonials -> real Google reviews
  {
    urlPath: "blog",
    slug: "request-a-free-property-appraisal-with-home7-real-estate-in-liverpool",
    ops: [
      { part: "a", kind: "block", tag: "ul", startSnippet: "– Sarah, Liverpool", endSnippet: "Highly recommend!", replace: quote(R.james) + quote(R.jobaer) + quote(R.zilani) },
      { kind: "text", find: "Unmatched Customer Service", replace: "Personal, Honest Service" },
    ],
  },
  {
    urlPath: "blog",
    slug: "best-real-estate-agent-casula-nsw-home7",
    set: {
      title: "Best Real Estate Agent in Casula? Why Sellers Choose Home7",
      seoTitle: "Best Real Estate Agent in Casula? Meet Home7",
    },
    ops: [
      { part: "a", kind: "block", tag: "blockquote", startSnippet: "made selling our Casula home simple", endSnippet: "Michael L., Casula", replace: quote(R.james) + quote(R.zilani) },
      { kind: "text", find: "leading real estate agencies in Casula", replace: "trusted local real estate agencies serving Casula" },
      { kind: "text", find: "deliver record-breaking results", replace: "deliver the strongest result your property can achieve" },
    ],
  },
  {
    urlPath: "blog",
    slug: "real-estate-in-liverpool-nsw",
    ops: [
      {
        part: "a",
        kind: "block",
        tag: "p",
        startSnippet: "The Home7 team made selling our Liverpool home completely stress-free",
        endSnippet: "The Nguyen Family",
        replace: quote(R.james) + quote(R.msb) + quote(R.jubayer),
      },
    ],
  },
  // B. Unbackable self-claims
  {
    urlPath: "blog",
    slug: "how-to-sell-your-liverpool-home-fast-in-2025-expert-tips-from-home7-real-estate",
    ops: [
      { kind: "text", find: "a track record of record-breaking sales across", replace: "a track record of sales and leases across" },
      { kind: "text", find: "Recent record sales in South Western Sydney showcase our ability to deliver top outcomes.", replace: "Recent sales across South Western Sydney show our ability to deliver strong outcomes." },
      { kind: "text", find: "achieving extraordinary results", replace: "achieving strong results" },
    ],
  },
  {
    urlPath: "blog",
    slug: "best-real-estate-agent-warwick-farm-nsw-home7",
    set: { seoTitle: "Real Estate Agent Warwick Farm | Sell Fast with Home7" },
    ops: [{ kind: "text", find: "achieve record prices —\noften faster than expected", replace: "achieve strong prices, often faster than expected" }],
  },
  {
    urlPath: "root",
    slug: "austral-land-for-sale",
    ops: [
      {
        kind: "text",
        find: "HOME7 Real Estate has established a strong reputation as Austral's leading agency for land and development property sales.",
        replace: "Home7 Real Estate works with land and development properties in Austral and the surrounding growth area, and knows what developers and buyers look for.",
      },
    ],
  },
  {
    urlPath: "blog",
    slug: "acreage-land-for-sale-austral-nsw-developers-dual-frontage",
    ops: [{ kind: "text", find: "gives them unmatched expertise in guiding", replace: "gives them the local expertise needed for guiding" }],
  },
  {
    urlPath: "blog",
    slug: "why-acreage-land-in-austral-nsw-could-make-you-a-future-billionaire",
    set: { title: "Why Acreage Land in Austral NSW Attracts Long-Term Investors" },
    ops: [
      {
        kind: "text",
        find: "this isn’t wishful\nthinking—it’s almost guaranteed.",
        replace: "nothing in property is guaranteed, but the long-term fundamentals are strong.",
      },
    ],
  },
];

function applyBlock(html: string, op: Extract<Op, { kind: "block" }>) {
  const a = html.indexOf(op.startSnippet);
  const b = html.indexOf(op.endSnippet, a);
  if (a < 0 || b < 0) return null;
  const start = html.lastIndexOf(`<${op.tag}`, a);
  const close = `</${op.tag}>`;
  const endTag = html.indexOf(close, b);
  if (start < 0 || endTag < 0) return null;
  return { html: html.slice(0, start) + op.replace + html.slice(endTag + close.length), removed: html.slice(start, endTag + close.length) };
}

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// C. Em dashes -> plain spaced hyphen (client's choice): "a—b" and "a — b"
// both become "a - b"; at the start of an element (">— x") it becomes ">- x".
function fixEmDashes(html: string) {
  return html.replace(/(^|>)\s*—\s*/g, "$1- ").replace(/[ \t]*\n?[ \t]*—[ \t]*\n?[ \t]*/g, " - ");
}

(async () => {
  await dbConnect();
  const redirected = new Set((await Redirect.find({}, "fromPath").lean()).map((r) => r.fromPath));
  const backup: unknown[] = [];
  let ok = true;

  const docsToWrite = new Map<string, { id: Types.ObjectId; set: Record<string, string> }>();

  for (const c of CHANGES) {
    const doc = await Content.findOne({ urlPath: c.urlPath, slug: c.slug }).lean();
    if (!doc) { console.log(`MISSING ${c.slug}`); ok = false; continue; }
    const ops = (c.ops ?? []).filter((o) => PARTS.has(o.part ?? "b"));
    const set = PARTS.has("b") ? c.set ?? {} : {};
    if (!ops.length && !Object.keys(set).length) continue;
    let html = doc.bodyHtml;
    console.log(`\n=== /${c.urlPath === "root" ? "" : c.urlPath + "/"}${c.slug}`);
    for (const [k, v] of Object.entries(set)) console.log(`  ${k}: "${(doc as unknown as Record<string, unknown>)[k]}"\n   -> "${v}"`);
    for (const op of ops) {
      if (op.kind === "text") {
        const n = html.split(op.find).length - 1;
        if (n !== 1) { console.log(`  !! text found ${n}x: ${op.find.slice(0, 60)}`); ok = false; continue; }
        html = html.replace(op.find, op.replace);
        console.log(`  - "${op.find.replace(/\n/g, " ")}"\n  + "${op.replace}"`);
      } else {
        const r = applyBlock(html, op);
        if (!r) { console.log(`  !! block not found: ${op.startSnippet}`); ok = false; continue; }
        html = r.html;
        console.log(`  - REMOVED: ${strip(r.removed).slice(0, 400)}\n  + ADDED:   ${strip(op.replace)}`);
      }
    }
    docsToWrite.set(String(doc._id), { id: doc._id, set: { ...set, bodyHtml: html } });
    backup.push(doc);
  }

  if (EMDASH) {
    const all = await Content.find({ status: "published" }).lean();
    let pages = 0, dashes = 0;
    for (const d of all) {
      const path = d.urlPath === "root" ? `/${d.slug}` : `/${d.urlPath}/${d.slug}`;
      if (redirected.has(path)) continue;
      const pending = docsToWrite.get(String(d._id));
      const body = pending?.set.bodyHtml ?? d.bodyHtml;
      const n = (body.match(/—/g) ?? []).length + (d.title.match(/—/g) ?? []).length + ((d.seoTitle ?? "").match(/—/g) ?? []).length;
      if (!n) continue;
      pages++; dashes += n;
      const set = { ...(pending?.set ?? {}), bodyHtml: fixEmDashes(body) } as Record<string, string>;
      if (d.title.includes("—")) set.title = fixEmDashes(pending?.set.title ?? d.title);
      if ((d.seoTitle ?? "").includes("—")) set.seoTitle = fixEmDashes(d.seoTitle!);
      docsToWrite.set(String(d._id), { id: d._id, set });
      if (!pending) backup.push(d);
      const sample = strip(body).match(/.{0,40}—.{0,40}/);
      console.log(`  em dash: ${path} (${n})${sample ? `  e.g. "${sample[0]}" -> "${fixEmDashes(sample[0])}"` : ""}`);
    }
    console.log(`\nPart C: ${dashes} em dashes on ${pages} pages`);
  }

  if (!ok) { console.log("\nSome changes did not match. Nothing written."); process.exit(1); }
  if (!APPLY) { console.log(`\nDRY RUN: ${docsToWrite.size} docs would change. Nothing written.`); process.exit(0); }

  fs.writeFileSync("content-archive/BACKUP-wording-cleanup-2026-11-27.json", JSON.stringify(backup, null, 2));
  for (const { id, set } of docsToWrite.values()) {
    await Content.updateOne({ _id: id }, { $set: set }, { timestamps: false });
  }
  console.log(`\nAPPLIED to ${docsToWrite.size} docs. Backup: content-archive/BACKUP-wording-cleanup-2026-11-27.json`);
  process.exit(0);
})();
