import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import PropertyCard from "@/components/PropertyCard";
import { pageMetadata } from "@/lib/pageMetadata";
import { SITE_URL } from "@/lib/constants";

const TITLE = "All Properties";
const DESCRIPTION = "Browse every current Home7 Real Estate listing across Western Sydney.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/properties"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "All Properties", item: `${SITE_URL}/properties` },
  ],
};

async function getAll() {
  try {
    await dbConnect();
    // Matches the live site's own behavior (FrontendController.php): the
    // "Other" status (off-market/land/development listings) is deliberately
    // excluded from the all-properties view and only shown on
    // /other-properties.
    return await Property.find({ listingType: { $ne: "other" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  } catch {
    return [];
  }
}

export default async function Page() {
  const properties = await getAll();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="font-display text-3xl text-slate-900">All Properties</h1>
      {properties.length === 0 ? (
        <p className="mt-10 text-slate-500">No listings yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={String(p._id)} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
