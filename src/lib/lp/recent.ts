import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { REGIONS, type RegionKey } from "./regions";

export type RecentProperty = {
  id: string;
  suburb: string;
  image: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
};

/** Newest sold/leased listings in a region's suburbs (no prices, by design). */
export async function getRecentProperties(kind: "sold" | "leased", region: RegionKey): Promise<RecentProperty[]> {
  try {
    await dbConnect();
    const escaped = REGIONS[region].suburbs.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const docs = await Property.find({
      listingType: kind,
      suburb: new RegExp(`^(${escaped.join("|")})$`, "i"),
      "images.0": { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("suburb images bedrooms bathrooms carSpaces")
      .lean();
    return docs.map((d) => ({
      id: String(d._id),
      suburb: d.suburb,
      image: d.images[0],
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      carSpaces: d.carSpaces,
    }));
  } catch {
    return [];
  }
}
