import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { deleteProperty } from "@/actions/property.actions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CreatedToast from "@/components/admin/CreatedToast";
import DeleteButton from "@/components/admin/DeleteButton";

// shortLabel only differs from label for the two tabs long enough to
// matter on mobile ("For Sale"/"For Rent" — the rest are already short);
// omitted elsewhere so those tabs just render `label` at every width.
const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "sale", label: "For Sale", shortLabel: "Sale" },
  { value: "rent", label: "For Rent", shortLabel: "Rent" },
  { value: "sold", label: "Sold" },
  { value: "leased", label: "Leased" },
  { value: "other", label: "Other" },
] as const;

type ListingType = "sale" | "rent" | "sold" | "leased" | "other";
const VALID_TYPES: readonly ListingType[] = ["sale", "rent", "sold", "leased", "other"];

function isListingType(value: string | undefined): value is ListingType {
  return !!value && (VALID_TYPES as readonly string[]).includes(value);
}

async function getAll(listingType?: string) {
  try {
    await dbConnect();
    const filter = isListingType(listingType) ? { listingType } : {};
    return await Property.find(filter).sort({ createdAt: -1 }).lean();
  } catch {
    return [];
  }
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const [session, properties] = await Promise.all([auth(), getAll(type)]);
  // Deleting is owner-only — see lib/authz.ts.
  const isOwner = session?.user.role === "owner";

  return (
    <div>
      <Suspense fallback={null}>
        <CreatedToast message="Listing created." />
      </Suspense>
      <AdminPageHeader
        title="Properties"
        description="Every listing across buy, rent, sold and leased."
        action={{ label: "+ New Listing", href: "/admin/properties/new" }}
      />

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {TYPE_TABS.map((tab) => {
          const active = (type ?? "") === tab.value;
          const href = tab.value ? `/admin/properties?type=${tab.value}` : "/admin/properties";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-brand-gold-dark text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
            >
              {"shortLabel" in tab ? (
                <>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </Link>
          );
        })}
      </div>

      {properties.length === 0 ? (
        <p className="mt-8 text-slate-500">No listings here yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* overflow-x-auto on this inner wrapper (not the outer div,
              which needs overflow-hidden to clip the header row's bg
              color to the card's rounded corners) is what lets the table
              actually scroll sideways on a narrow screen — min-w-max on
              the table stops columns from squishing to fit instead. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 font-medium">Address</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Price</th>
                <th className="py-3 px-4 font-medium">Actions</th>
                <th className="py-3 px-4 font-medium">Featured</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={String(p._id)} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{p.address}</p>
                    <p className="text-slate-500">{p.suburb} {p.state} {p.postcode}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium capitalize">
                      {p.listingType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {p.priceDisplay || (p.rentPerWeek ? `$${p.rentPerWeek} P/W` : "—")}
                  </td>
                  <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                    <Link href={`/admin/properties/${p._id}/edit`} className="text-brand-gold-dark hover:underline">
                      Edit
                    </Link>
                    {isOwner && (
                      <DeleteButton
                        onConfirm={deleteProperty.bind(null, String(p._id))}
                        itemLabel="this listing"
                        requireTypedConfirmation="delete this post"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.featured && (
                      <span className="inline-block rounded-full bg-brand-gold/30 text-brand-navy px-2 py-0.5 text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
