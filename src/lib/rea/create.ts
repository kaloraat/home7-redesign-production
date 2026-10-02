import mongoose from "mongoose";
import Property from "@/models/Property";
import { copyReaImages } from "./images";
import { streetAddress, suburbName } from "./map";
import type { Journal } from "./journal";
import type { PlanItem } from "./plan";

/**
 * Step C (and, later, every sync that finds a new REA listing): create a
 * page for an REA listing that isn't on the site yet.
 *
 * Photos are copied to our S3 first, so a page never goes live pointing
 * at REA's image servers. "Date added" is REA's own date for the listing,
 * so the page sorts where it belongs among older results instead of
 * jumping to the top of every list as if it were brand new.
 */

export type CreateItem = Extract<PlanItem, { action: "create" }>;

const raw = () => mongoose.connection.collection("properties");

export async function applyCreates(items: CreateItem[], journal: Journal, log: (line: string) => void) {
  const now = new Date();
  for (const item of items) {
    const { listing, facts, content } = item;
    const copied = await copyReaImages(item.slug, content.images);

    const doc = new Property({
      ...facts,
      slug: item.slug,
      address: streetAddress(listing),
      suburb: suburbName(listing),
      state: listing.address.state,
      postcode: listing.address.postcode,
      description: content.description,
      images: content.images.map((u) => copied.get(u)!),
      floorPlanImage: content.floorPlanImage ? copied.get(content.floorPlanImage) : undefined,
      agent: item.agentId,
      featured: false,
      source: "rea",
      reaListingId: listing.listingId,
      reaSyncedAt: now,
      reaLockedFields: [],
    });
    await doc.validate();

    // Inserted directly so createdAt can be REA's date — Mongoose's own
    // timestamps would stamp it with today.
    const record = { ...doc.toObject(), createdAt: listing.modTime, updatedAt: now };
    journal.record("insert", record._id, null);
    await raw().insertOne(record);
    log(`created /property/${item.slug} (${content.images.length} photos)`);
  }
}
