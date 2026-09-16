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
  // limit was 100 — this is the full archive for the category, not a
  // preview, and "other" alone passed 100 real listings after importing
  // the legacy property pages found during the pre-domain-switch URL
  // audit (105 total), which silently dropped the 5 oldest off this page
  // entirely (confirmed live: getPropertiesByType sorts createdAt desc,
  // so a hard cap just truncates the tail rather than erroring). 10,000 is
  // a sentinel "no realistic cap" rather than swapping one arbitrary
  // number for another that will eventually run out again too — same fix
  // needed on /properties-for-sale, /properties-for-rent, /sold-properties
  // and /leased-properties, all of which share this same latent bug.
  const properties = await getPropertiesByType("other", 10000);
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
