import mongoose from "mongoose";
import Property from "@/models/Property";
import { contentFor, type ReaFacts } from "./map";
import { copyReaImages } from "./images";
import type { Journal } from "./journal";
import type { FieldChange, Plan, PlanProperty } from "./plan";
import type { ReaListing } from "./parse";

/**
 * Step B: connect existing pages to their REA listings.
 *
 * Every linked page takes REA's facts (status, price wording, beds...) and
 * gets its REA ID. Its description and photos stay as they are and are
 * protected from future syncs — except on pages that had duplicates, which
 * get REA's current ad and photos, because their own copy is an older ad
 * for the same address (e.g. a rental ad on a property now for sale).
 *
 * Duplicate pages are deleted only when the matching 301 redirect already
 * exists, so their URL never stops working.
 */

export interface LinkStep {
  property: PlanProperty;
  listing: ReaListing;
  changes: FieldChange[];
  facts: ReaFacts;
  refreshContent: boolean;
  unfeature: boolean; // a featured listing that's now sold/leased, as the admin form does
}

export interface DeleteStep {
  property: PlanProperty;
  keepSlug: string;
  redirectOk: boolean;
}

export function linkSteps(
  plan: Plan,
  factsByListing: Map<string, ReaFacts>,
  redirects: Map<string, string>
): { links: LinkStep[]; deletes: DeleteStep[] } {
  const links: LinkStep[] = [];
  const deletes: DeleteStep[] = [];
  for (const item of plan.items) {
    if (item.action !== "link") continue;
    const facts = factsByListing.get(item.listing.listingId)!;
    const closesOut =
      item.property.featured === true &&
      item.property.listingType !== facts.listingType &&
      (facts.listingType === "sold" || facts.listingType === "leased");
    links.push({
      property: item.property,
      listing: item.listing,
      changes: item.changes,
      facts,
      refreshContent: item.duplicates.length > 0,
      unfeature: closesOut,
    });
    for (const dup of item.duplicates) {
      const target = redirects.get(`/property/${dup.slug}`);
      deletes.push({
        property: dup,
        keepSlug: item.property.slug,
        redirectOk: target === `/property/${item.property.slug}`,
      });
    }
  }
  return { links, deletes };
}

const raw = () => mongoose.connection.collection("properties");

export async function applyLinkSteps(
  links: LinkStep[],
  deletes: DeleteStep[],
  journal: Journal,
  log: (line: string) => void
) {
  const now = new Date();
  for (const step of links) {
    const set: Record<string, unknown> = {
      ...step.facts,
      reaListingId: step.listing.listingId,
      reaSyncedAt: now,
      reaLockedFields: step.refreshContent ? [] : ["description", "images"],
      reaResyncRequested: false,
    };
    const unset: Record<string, ""> = {};
    if (step.unfeature) Object.assign(set, { featured: false, featuredUntil: null });

    if (step.refreshContent) {
      const content = contentFor(step.listing);
      const copied = await copyReaImages(step.property.slug, content.images);
      set.description = content.description;
      set.images = content.images.map((u) => copied.get(u)!);
      if (content.floorPlanImage) set.floorPlanImage = copied.get(content.floorPlanImage);
      else unset.floorPlanImage = ""; // the old floor plan belonged to the old ad
    }

    const before = await raw().findOne({ _id: new mongoose.Types.ObjectId(step.property._id) });
    if (!before) throw new Error(`Property vanished mid-run: ${step.property.slug}`);
    journal.record("update", before._id, before);
    await Property.updateOne({ _id: before._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    log(`linked  /property/${step.property.slug}`);
  }

  for (const step of deletes) {
    if (!step.redirectOk) {
      log(`SKIPPED delete of /property/${step.property.slug} — no 301 to /property/${step.keepSlug}`);
      continue;
    }
    const before = await raw().findOne({ _id: new mongoose.Types.ObjectId(step.property._id) });
    if (!before) continue;
    journal.record("delete", before._id, before);
    await raw().deleteOne({ _id: before._id });
    log(`deleted /property/${step.property.slug} (redirects to /property/${step.keepSlug})`);
  }
}
