import type { ReaListing } from "./parse";
import {
  contentFor,
  factsFor,
  LISTING_TYPE_LABEL,
  slugFor,
  streetAddress,
  suburbName,
  type ReaContent,
  type ReaFacts,
} from "./map";

/**
 * Works out what the sync should do, without doing it. The same plan
 * drives the dry-run report and (from step B on) the real sync, so what
 * gets reviewed is exactly what gets applied.
 *
 * One page per address: REA can hold several listings for one address over
 * time (leased in 2024, sold in 2026...). The page follows the most recently
 * modified one, and the older listings are reported as "superseded" rather
 * than creating a second page for the same place.
 */

/** The parts of a Property the planner reads. */
export interface PlanProperty {
  _id: string;
  slug: string;
  address: string;
  suburb: string;
  listingType: ReaFacts["listingType"];
  reaListingId?: string;
  [field: string]: unknown;
}

export interface PlanAgent {
  _id: string;
  name: string;
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export type PlanItem =
  | {
      action: "link"; // existing page, not yet linked to REA
      listing: ReaListing;
      property: PlanProperty;
      changes: FieldChange[]; // facts that differ; applied only once approved
      duplicates: PlanProperty[]; // other pages that also match this address
    }
  | {
      action: "update"; // already linked
      listing: ReaListing;
      property: PlanProperty;
      changes: FieldChange[];
    }
  | {
      action: "create";
      listing: ReaListing;
      slug: string;
      facts: ReaFacts;
      content: ReaContent;
      agentId?: string;
    }
  | {
      action: "superseded"; // older REA listing for an address with a newer one
      listing: ReaListing;
      newerListingId: string;
    };

export interface Plan {
  items: PlanItem[];
  unknownAgents: string[]; // REA agent names with no matching Agent record
}

const STREET_TYPES: [RegExp, string][] = [
  [/\bstreet\b/g, "st"], [/\broad\b/g, "rd"], [/\bcrescent\b/g, "cres"],
  [/\bavenue\b/g, "ave"], [/\bcircuit\b/g, "cct"], [/\bparade\b/g, "pde"],
  [/\bdrive\b/g, "dr"], [/\bplace\b/g, "pl"], [/\bclose\b/g, "cl"],
  [/\bcourt\b/g, "ct"], [/\blane\b/g, "ln"], [/\bhighway\b/g, "hwy"],
  [/\bboulevard\b/g, "blvd"], [/\bgrove\b/g, "gr"], [/\bterrace\b/g, "tce"],
  [/\bway\b/g, "wy"],
];

/** "2/142 Haldon Street, LAKEMBA" → "2 142 haldon st lakemba" */
export function addressKey(s: string): string {
  let k = s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const [re, abbr] of STREET_TYPES) k = k.replace(re, abbr);
  return k;
}

const STREET_TYPE_WORDS = new Set(STREET_TYPES.map(([, abbr]) => abbr));

/**
 * Groups one address's REA listings together. Street types are dropped
 * because REA's own data isn't consistent ("88 Fieldhouse" and "88
 * Fieldhouse Circuit" are the same house).
 */
function groupKey(l: ReaListing): string {
  return addressKey(`${streetAddress(l)} ${suburbName(l)}`)
    .split(" ")
    .filter((w) => !STREET_TYPE_WORDS.has(w))
    .join(" ");
}

const startsWithWord = (s: string, prefix: string) => s === prefix || s.startsWith(`${prefix} `);

/**
 * Pages whose address matches the REA listing. Migrated data is messy
 * (suburb "Avenue Kirrawee 2232", slugs without a suburb), so each page is
 * tried both as address + suburb and as its slug.
 */
export function matchingProperties(l: ReaListing, props: PlanProperty[]): PlanProperty[] {
  const street = addressKey(streetAddress(l));
  const suburb = addressKey(suburbName(l));
  return props.filter((p) =>
    [addressKey(`${p.address} ${p.suburb}`), addressKey(p.slug)].some(
      (k) => startsWithWord(k, street) && ` ${k} `.includes(` ${suburb} `)
    )
  );
}

// REA names that refer to an existing Agent under another name. Both
// spellings come with the same REA login email (redwan@home7.com.au).
const AGENT_ALIASES: Record<string, string> = { "redwan islam": "mohammed r islam" };

function resolveAgent(l: ReaListing, agents: PlanAgent[]): { id?: string; unknown?: string } {
  const name = l.agents[0]?.name;
  if (!name) return {};
  const wanted = AGENT_ALIASES[name.toLowerCase()] ?? name.toLowerCase();
  const agent = agents.find((a) => a.name.toLowerCase() === wanted);
  return agent ? { id: agent._id } : { unknown: name };
}

const comparable = (v: unknown): string =>
  v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.map(comparable).join("|") : String(v ?? "");

/** Facts that differ between REA and the page. Missing REA values never count. */
export function factChanges(facts: ReaFacts, p: PlanProperty): FieldChange[] {
  return Object.entries(facts)
    .filter(([field]) => field !== "reaModTime")
    .filter(([field, to]) => comparable(p[field]) !== comparable(to))
    // An empty REA list next to an empty/missing one isn't a change.
    .filter(([field, to]) => !(Array.isArray(to) && to.length === 0 && !p[field]))
    .map(([field, to]) => ({ field, from: p[field], to }));
}

export function buildPlan(
  listings: ReaListing[],
  props: PlanProperty[],
  agents: PlanAgent[]
): Plan {
  const items: PlanItem[] = [];
  const unknownAgents = new Set<string>();
  const takenSlugs = new Set(props.map((p) => p.slug.toLowerCase()));

  // Newest first, so the first listing seen for an address is the one the
  // page follows and any later one for the same address is superseded.
  const sorted = [...listings].sort((a, b) => b.modTime.getTime() - a.modTime.getTime());
  const newestByAddress = new Map<string, string>();
  // Page id → the REA listing that page now follows; a page is never
  // claimed twice, whatever spelling REA used for the address.
  const claimedBy = new Map<string, string>();

  for (const l of sorted) {
    const key = groupKey(l);
    const newer = newestByAddress.get(key);
    if (newer) {
      items.push({ action: "superseded", listing: l, newerListingId: newer });
      continue;
    }
    newestByAddress.set(key, l.listingId);

    const facts = factsFor(l);
    const linked =
      props.find((p) => p.reaListingId === l.listingId) ??
      // Re-listed address: the page already follows an older REA listing.
      matchingProperties(l, props).find((p) => p.reaListingId);
    if (linked && claimedBy.has(linked._id)) {
      items.push({ action: "superseded", listing: l, newerListingId: claimedBy.get(linked._id)! });
      continue;
    }
    if (linked) {
      claimedBy.set(linked._id, l.listingId);
      items.push({ action: "update", listing: l, property: linked, changes: factChanges(facts, linked) });
      continue;
    }

    const matches = matchingProperties(l, props);
    const claimer = matches.map((p) => claimedBy.get(p._id)).find(Boolean);
    if (claimer) {
      items.push({ action: "superseded", listing: l, newerListingId: claimer });
      continue;
    }
    if (matches.length) {
      // Which page to keep when an address has several: the one with the
      // clean expected slug, then one already showing the right status,
      // then the oldest. Only a suggestion — a person reviews duplicates
      // before anything is redirected.
      const expected = slugFor(l);
      const rank = (p: PlanProperty) => [
        p.slug.toLowerCase() === expected ? 0 : 1,
        p.listingType === facts.listingType ? 0 : 1,
        new Date(String(p.createdAt ?? 0)).getTime(),
      ];
      const [keep, ...duplicates] = [...matches].sort((a, b) => {
        const [ra, rb] = [rank(a), rank(b)];
        return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
      });
      claimedBy.set(keep._id, l.listingId);
      items.push({ action: "link", listing: l, property: keep, changes: factChanges(facts, keep), duplicates });
      continue;
    }

    const agent = resolveAgent(l, agents);
    if (agent.unknown) unknownAgents.add(agent.unknown);
    let slug = slugFor(l);
    for (let n = 2; takenSlugs.has(slug); n++) slug = `${slugFor(l)}-${n}`;
    takenSlugs.add(slug);
    items.push({ action: "create", listing: l, slug, facts, content: contentFor(l), agentId: agent.id });
  }

  return { items, unknownAgents: [...unknownAgents] };
}

/** One plain-English line per change, e.g. "For Rent → Leased". */
export function describeChange(c: FieldChange): string {
  if (c.field === "listingType") {
    const label = (v: unknown) => LISTING_TYPE_LABEL[v as ReaFacts["listingType"]] ?? String(v ?? "—");
    return `${label(c.from)} → ${label(c.to)}`;
  }
  const show = (v: unknown) => {
    const s = comparable(v);
    return s ? (s.length > 60 ? `${s.slice(0, 57)}...` : s) : "—";
  };
  return `${c.field}: ${show(c.from)} → ${show(c.to)}`;
}
