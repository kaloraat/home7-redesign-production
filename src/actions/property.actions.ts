"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { auth } from "@/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authorized");
  }
}

function numberOrUndefined(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return undefined;
  const n = Number(str);
  return Number.isFinite(n) ? n : undefined;
}

function dateOrUndefined(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return undefined;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Shared field parsing for create + edit. Images are a simple one-URL-per-line
 * textarea for now, not a file upload — no image host (S3/Cloudinary/Vercel
 * Blob) has been chosen yet, so this is the placeholder until that decision
 * is made. Paste hosted image URLs in the meantime.
 */
function parseFields(formData: FormData) {
  const address = String(formData.get("address") || "").trim();
  const suburb = String(formData.get("suburb") || "").trim();
  const postcode = String(formData.get("postcode") || "").trim();
  const listingType = String(formData.get("listingType") || "sale") as
    | "sale"
    | "rent"
    | "sold"
    | "leased"
    | "other";

  if (!address || !suburb || !postcode) {
    throw new Error("Address, suburb and postcode are required");
  }

  const imagesRaw = String(formData.get("images") || "");
  const images = imagesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const amenitiesRaw = String(formData.get("amenities") || "");
  const amenities = amenitiesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    address,
    suburb,
    postcode,
    listingType,
    priceDisplay: String(formData.get("priceDisplay") || "").trim() || undefined,
    priceValue: numberOrUndefined(formData.get("priceValue")),
    rentPerWeek: numberOrUndefined(formData.get("rentPerWeek")),
    bedrooms: numberOrUndefined(formData.get("bedrooms")),
    bathrooms: numberOrUndefined(formData.get("bathrooms")),
    toilets: numberOrUndefined(formData.get("toilets")),
    carSpaces: numberOrUndefined(formData.get("carSpaces")),
    landSize: String(formData.get("landSize") || "").trim() || undefined,
    floorSize: String(formData.get("floorSize") || "").trim() || undefined,
    description: String(formData.get("description") || "").trim() || undefined,
    images,
    floorPlanImage: String(formData.get("floorPlanImage") || "").trim() || undefined,
    agent: String(formData.get("agent") || "").trim() || undefined,
    featured: formData.get("featured") === "on",
    auctionDate: dateOrUndefined(formData.get("auctionDate")),
    seoTitle: String(formData.get("seoTitle") || "").trim() || undefined,
    seoDescription: String(formData.get("seoDescription") || "").trim() || undefined,
    propertyType: String(formData.get("propertyType") || "").trim() || undefined,
    amenities,
    mapEmbedUrl: String(formData.get("mapEmbedUrl") || "").trim() || undefined,
    videoEmbedUrl: String(formData.get("videoEmbedUrl") || "").trim() || undefined,
  };
}

function listingTypePath(listingType: string) {
  switch (listingType) {
    case "sale":
      return "/properties-for-sale";
    case "rent":
      return "/properties-for-rent";
    case "sold":
      return "/sold-properties";
    case "leased":
      return "/leased-properties";
    case "other":
      return "/other-properties";
    default:
      return "/properties";
  }
}

/**
 * Server Action — the admin listing form posts straight here. This is the
 * pattern for anything that's a same-app form submission: no separate API
 * endpoint to maintain, automatic CSRF protection, and it can call
 * revalidatePath/redirect directly. See SETUP.md for why this is paired with
 * a dedicated /api layer for anything external.
 */
export async function createProperty(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);
  const slug = slugify(`${fields.address}-${fields.suburb}-nsw-${fields.postcode}`);

  await Property.create({ slug, ...fields });

  revalidatePath("/admin/properties");
  revalidatePath(listingTypePath(fields.listingType));
  redirect("/admin/properties?created=1");
}

export async function updateProperty(id: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const fields = parseFields(formData);

  const existing = await Property.findById(id);
  if (!existing) {
    throw new Error("Property not found");
  }

  // Slug intentionally isn't regenerated on edit — the whole point of this
  // rebuild is that once a URL is live, it stays live. Editing the address
  // shouldn't silently change the URL and break whatever's linking to it.
  await Property.findByIdAndUpdate(id, fields);

  revalidatePath("/admin/properties");
  revalidatePath(listingTypePath(fields.listingType));
  revalidatePath(`/property/${existing.slug}`);
  redirect("/admin/properties");
}

export async function deleteProperty(id: string) {
  await requireAdmin();
  await dbConnect();
  await Property.findByIdAndDelete(id);
  revalidatePath("/admin/properties");
}
