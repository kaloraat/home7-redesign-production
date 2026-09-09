import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { getPropertyBySlug } from "@/lib/queries";
import TenancyApplicationForm from "@/components/TenancyApplicationForm";

const TITLE = "Tenant Application Form";
const DESCRIPTION = "Apply online for a Home7 Real Estate rental property — the full Residential Tenancy Application.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/property-tenant-application-download"),
};

// This URL previously force-downloaded a blank PDF on the old Laravel
// site (see TenancyApplication.ts's own comment for the full story) — kept
// exactly as-is per the zero-broken-links constraint, now rendering a real
// online version of that same form instead of a download. `?property=`
// (set by the rental-listing sidebar link, see property/[slug]/page.tsx)
// pre-fills and locks the "First Preference" address; reached from the
// nav with no query param, the field is blank and editable.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property: propertySlug } = await searchParams;
  const property = propertySlug ? await getPropertyBySlug(propertySlug) : null;
  const propertyAddress = property ? `${property.address}, ${property.suburb} NSW ${property.postcode}` : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <TenancyApplicationForm propertyAddress={propertyAddress} propertySlug={property?.slug} />
    </div>
  );
}
