import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { SITE_URL } from "@/lib/constants";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";

const TITLE = "Other Properties";
const DESCRIPTION = "Other Home7 Real Estate property listings.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/other-properties"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Other Properties", item: `${SITE_URL}/other-properties` },
  ],
};

// Mirrors the Laravel site's own "Other" property_status — off-market,
// land, and development listings that don't fit the sale/rent/sold/leased
// buckets. Confirmed via FrontendController.php: this is its own dedicated
// listing category on the live site, not a placeholder.
export default async function Page() {
  const properties = await getPropertiesByType("other", 100);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="font-display text-3xl text-brand-navy">Other Properties</h1>
      {properties.length === 0 ? (
        <p className="mt-10 text-slate-500">No listings in this category right now.</p>
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
