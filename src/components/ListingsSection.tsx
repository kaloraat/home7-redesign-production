import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";
import type { IProperty } from "@/models/Property";

export function ListingsSection({
  title,
  properties,
  viewAllLabel,
  viewAllHref,
  emptyMessage,
}: {
  title: string;
  properties: IProperty[];
  viewAllLabel: string;
  viewAllHref: string;
  emptyMessage: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
        <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">{title}</h2>
      </div>

      {properties.length === 0 ? (
        <p className="mt-8 text-slate-500 text-lg">{emptyMessage}</p>
      ) : (
        <>
          <div className="mt-8">
            <ResponsiveCardGrid
              items={properties}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
              wide4up
            />
          </div>
          <div className="mt-10 text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand-navy px-8 py-3 text-lg font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
            >
              {viewAllLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default ListingsSection;
