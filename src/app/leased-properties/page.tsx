import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { SITE_URL } from "@/lib/constants";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";

const TITLE = "Leased Properties in Liverpool, NSW";
const DESCRIPTION = "See recently leased properties across Liverpool and Western Sydney.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/leased-properties"),
};

// Was missing on this page specifically (present on the other listing-type
// pages, e.g. properties-for-sale/page.tsx) — same gap on /properties and
// /other-properties, fixed alongside this one.
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Leased Properties", item: `${SITE_URL}/leased-properties` },
  ],
};

export default async function Page() {
  // limit was 100 — see sold-properties/page.tsx's comment for the full
  // writeup (same latent bug, fixed the same way across all five callers).
  const properties = await getPropertiesByType("leased", 10000);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="font-display text-3xl text-slate-900">Leased Properties in Liverpool, NSW</h1>
      <p className="mt-2 text-lg text-slate-600 leading-relaxed max-w-2xl">See recently leased properties across Liverpool and Western Sydney.</p>

      {properties.length === 0 ? (
        <p className="mt-10 text-slate-500">
          No listings yet — connect MONGODB_URI and add properties from the admin dashboard.
        </p>
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
