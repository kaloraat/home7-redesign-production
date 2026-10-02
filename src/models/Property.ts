import mongoose, { Schema, models, model, type Document, type Model } from "mongoose";

export interface IProperty extends Document {
  slug: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  // "other" mirrors the Laravel site's own "Other" status — off-market /
  // land / development listings shown only on /other-properties and
  // explicitly excluded from /properties and /properties-for-sale on the
  // live site (see FrontendController.php).
  listingType: "sale" | "rent" | "sold" | "leased" | "other";
  priceDisplay?: string; // e.g. "$590,000 - $640,000" or "Contact Agent"
  // Plain number, admin-entered alongside priceDisplay — not shown anywhere
  // on the site (priceDisplay is what visitors see). Exists purely so a
  // real number is already on file for sale/sold/other listings once
  // price-based sorting/filtering gets built later — priceDisplay's free
  // text ("$590,000 - $640,000", "Contact Agent") can't be sorted on. Rent
  // listings don't need this: rentPerWeek below is already numeric.
  priceValue?: number;
  rentPerWeek?: number;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  carSpaces?: number;
  landSize?: string; // free text: old site mixes m², sq m, acres
  // Internal floor/living area — genuinely independent of landSize: a house
  // can (and often does) have both a land size and its own floor size, so
  // this isn't just landSize relabeled for apartments (an earlier version
  // of this field tried that single-field-dynamic-label approach — wrong,
  // since it can't represent a house having both at once). Every property
  // type can have a floorSize; only types with no land of their own
  // (Apartment, Unit, etc.) meaningfully skip landSize.
  floorSize?: string;
  description?: string;
  images: string[];
  // One of the URLs in `images` (or any other uploaded image), marked via
  // ImageUploader's "Set as floor plan" quick-action — kept as its own
  // field rather than inferred from position/naming so a future floor-plan
  // viewer has one reliable value to read regardless of gallery order.
  floorPlanImage?: string;
  agent?: mongoose.Types.ObjectId;
  featured: boolean;
  // Optional last day a featured listing stays in the homepage Featured
  // section — past it, getFeaturedProperties skips the listing without
  // anyone having to untick it. Unset = featured until unticked.
  featuredUntil?: Date | null;
  auctionDate?: Date;
  seoTitle?: string;
  seoDescription?: string;
  // e.g. "Apartment Building", "House", "Unit" — from the old site's real
  // property_categories taxonomy (10 categories, set on ~90% of listings),
  // never migrated as a field before now (categories_id existed in the
  // source data but nothing in this app read it).
  propertyType?: string;
  // Structured feature list ("Parking Area", "Laundry Room", ...) — the old
  // site had this as its own field too; the original migration flattened
  // it into a "Features:" block inside `description` HTML instead of
  // keeping it separate, which is why there was never a distinct Amenities
  // section to render.
  amenities?: string[];
  // Google Maps embed src URL (not the full iframe HTML — storing just the
  // URL and building the iframe ourselves keeps this from being an
  // arbitrary-HTML injection surface and lets every listing's map render
  // consistently). Present on ~96% of old listings.
  mapEmbedUrl?: string;
  // YouTube (or similar) embed src URL. Rare — only ~3% of old listings
  // actually had a real video; most had this field populated with just the
  // property's own address as plain text (apparently a data-entry habit,
  // not a real value), which is why this is validated as a genuine embed
  // URL at backfill time rather than carried over verbatim.
  videoEmbedUrl?: string;
  // From realestate.com.au's listing export (see src/lib/rea/). Rendered
  // later; stored now so the sync has a home for REA facts the old site
  // never had.
  inspectionTimes?: string[]; // REA's own text, e.g. "22-Aug-2026 10:30AM to 11:00AM"
  dateAvailable?: Date; // rentals
  soldPrice?: number; // only when REA says the sold price may be shown
  soldDate?: Date;
  // --- REA sync ---
  // "rea" = created by the sync; "manual" = entered in admin or migrated
  // from the old site (it may still be linked to REA via reaListingId).
  source: "manual" | "rea";
  // REA's listing ID — the link between this record and REA. Set once,
  // never changed; every future sync finds the record by it, which is what
  // keeps re-syncs from creating duplicates.
  reaListingId?: string;
  reaStatus?: "current" | "offmarket" | "sold" | "leased";
  reaModTime?: Date; // REA's last-modified time for the listing
  reaSyncedAt?: Date;
  // Fields a person edited by hand that the sync must leave alone
  // ("description", "images"). Facts (status, price, beds...) always
  // follow REA, so they're never in here.
  reaLockedFields: string[];
  // The edit form's "Replace my edits on the next sync" toggle: the next
  // sync overwrites the locked fields from REA, then clears both.
  reaResyncRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    address: { type: String, required: true },
    suburb: { type: String, required: true, index: true },
    state: { type: String, default: "NSW" },
    postcode: { type: String, required: true },
    listingType: {
      type: String,
      enum: ["sale", "rent", "sold", "leased", "other"],
      required: true,
      index: true,
    },
    priceDisplay: String,
    priceValue: { type: Number, index: true },
    rentPerWeek: Number,
    bedrooms: Number,
    bathrooms: Number,
    toilets: Number,
    carSpaces: Number,
    landSize: String,
    floorSize: String,
    description: String,
    images: { type: [String], default: [] },
    floorPlanImage: String,
    agent: { type: Schema.Types.ObjectId, ref: "Agent" },
    featured: { type: Boolean, default: false },
    featuredUntil: Date,
    auctionDate: Date,
    seoTitle: String,
    seoDescription: String,
    propertyType: String,
    amenities: { type: [String], default: [] },
    mapEmbedUrl: String,
    videoEmbedUrl: String,
    inspectionTimes: { type: [String], default: undefined },
    dateAvailable: Date,
    soldPrice: Number,
    soldDate: Date,
    source: { type: String, enum: ["manual", "rea"], default: "manual" },
    reaListingId: String,
    reaStatus: { type: String, enum: ["current", "offmarket", "sold", "leased"] },
    reaModTime: Date,
    reaSyncedAt: Date,
    reaLockedFields: { type: [String], default: [] },
    reaResyncRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique only among linked records — the ~100 records with no REA listing
// (building profiles, old manual entries) don't collide on "missing".
PropertySchema.index(
  { reaListingId: 1 },
  { unique: true, partialFilterExpression: { reaListingId: { $type: "string" } } }
);

export const Property: Model<IProperty> =
  models.Property || model<IProperty>("Property", PropertySchema);

export default Property;
