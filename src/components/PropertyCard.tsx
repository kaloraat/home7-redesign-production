import Image from "next/image";
import Link from "next/link";
import type { IProperty } from "@/models/Property";

export function PropertyCard({ property }: { property: IProperty }) {
  const facts = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
    property.carSpaces ? `${property.carSpaces} car` : null,
    // Land size takes priority (matches what a buyer scanning cards for a
    // house usually wants first); floor size only shown here when there's
    // no land size to show instead (e.g. an apartment) — the card only has
    // room for one size figure, the property page itself shows both.
    property.landSize || property.floorSize || null,
  ].filter(Boolean);

  return (
    <Link
      href={`/property/${property.slug}`}
      className="block rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
        {property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.address}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          "No image"
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-lg text-brand-navy">{property.address}</p>
        <p className="text-lg text-slate-500">
          {property.suburb} {property.state} {property.postcode}
        </p>
        <p className="mt-2 text-brand-gold-dark font-medium">
          {property.priceDisplay ||
            (property.rentPerWeek ? `$${property.rentPerWeek} P/W` : "Contact Agent")}
        </p>
        {facts.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{facts.join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}

export default PropertyCard;
