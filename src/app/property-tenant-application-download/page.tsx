import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { getPropertyBySlug } from "@/lib/queries";
import RentalApplication, { type Listing } from "@/components/rental-application/RentalApplication";

const TITLE = "Rental Application";
const DESCRIPTION = "Apply online for a Home7 Real Estate rental property.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/property-tenant-application-download"),
};

// Kept at this URL (the old Laravel site's blank-PDF download link) so
// existing links keep working. `?property=<slug>` loads the listing card;
// without it, or for a slug that isn't a current rental, the applicant
// types the address instead. `&step=<section>` is handled client-side.
export default async function Page({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property: slug } = await searchParams;
  const p = slug ? await getPropertyBySlug(slug) : null;
  const listing: Listing | null =
    p && p.listingType === "rent"
      ? {
          slug: p.slug,
          street: p.address,
          fullAddress: `${p.address}, ${p.suburb} ${p.state || "NSW"} ${p.postcode}`,
          image: p.images?.[0] ?? null,
          rentPerWeek: p.rentPerWeek ?? null,
          available: p.dateAvailable ? new Date(p.dateAvailable).toISOString() : null,
          beds: p.bedrooms ?? null,
          baths: p.bathrooms ?? null,
          cars: p.carSpaces ?? null,
        }
      : null;

  return (
    <Suspense fallback={<div className="mx-auto max-w-[900px] px-4 py-16 text-center text-slate-500">Loading your application…</div>}>
      <RentalApplication listing={listing} />
    </Suspense>
  );
}
