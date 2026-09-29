import Image from "next/image";
import Link from "next/link";
import type { IProperty } from "@/models/Property";

// How long a sale/rent listing counts as "New" after it's added. Anything
// longer and the label stops meaning anything — if every active listing
// says New, the cards read as stale all over again.
const NEW_LISTING_DAYS = 14;

const RIBBONS: Partial<Record<IProperty["listingType"], { label: string; className: string }>> = {
  sale: { label: "For Sale", className: "ribbon-sale" },
  rent: { label: "For Rent", className: "ribbon-rent" },
  sold: { label: "Sold", className: "ribbon-sold" },
  leased: { label: "Leased", className: "ribbon-leased" },
};

function isNewListing(property: IProperty) {
  if (property.listingType !== "sale" && property.listingType !== "rent") return false;
  if (!property.createdAt) return false;
  const ageMs = Date.now() - new Date(property.createdAt).getTime();
  return ageMs < NEW_LISTING_DAYS * 24 * 60 * 60 * 1000;
}

// A single dollar figure (e.g. "$ 1,450,000") — as opposed to a range or
// free text like "Contact Agent", which reads wrongly after a "Sold" prefix.
const SINGLE_PRICE = /^\$\s?[\d,]+$/;

function priceLine(property: IProperty) {
  const price = property.priceDisplay?.trim();
  if (property.listingType === "sold") {
    // Sold listings keep whatever guide/auction text they were advertised
    // with — showing "Auction: Sat 14 March" under a SOLD ribbon is what
    // made the sections look stale. Only a single figure is shown as the
    // result; ranges and free text collapse to just "Sold".
    return price && SINGLE_PRICE.test(price) ? `Sold ${price}` : "Sold";
  }
  if (property.listingType === "leased") {
    return property.rentPerWeek ? `Leased $${property.rentPerWeek} P/W` : "Leased";
  }
  return price || (property.rentPerWeek ? `$${property.rentPerWeek} P/W` : "Contact Agent");
}

/**
 * `showRibbon` defaults on — the corner status ribbon is what tells a sold
 * card apart from an active one wherever types sit together (homepage,
 * search, suburb/agent pages). Pages that only ever list one type
 * (/sold-properties, /properties-for-rent, ...) turn it off, since there
 * the page heading already says it on every card.
 */
export function PropertyCard({
  property,
  showRibbon = true,
}: {
  property: IProperty;
  showRibbon?: boolean;
}) {
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

  const ribbon = showRibbon ? RIBBONS[property.listingType] : undefined;
  const isNew = isNewListing(property);

  // No overflow-hidden on the card itself — the ribbon's folded ends sit
  // just outside the card's top and right edges. The image box clips its
  // own photo to the card's rounded top corners instead.
  return (
    <Link
      href={`/property/${property.slug}`}
      className="relative isolate block rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative z-[1] aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
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
        {isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-navy shadow">
            New
          </span>
        )}
      </div>
      {ribbon && (
        <div className={`ribbon ${ribbon.className}`}>
          <span>{ribbon.label}</span>
        </div>
      )}
      <div className="p-4">
        <p className="font-display text-lg text-brand-navy">{property.address}</p>
        <p className="text-lg text-slate-500">
          {property.suburb} {property.state} {property.postcode}
        </p>
        <p className="mt-2 text-brand-gold-dark font-medium">{priceLine(property)}</p>
        {facts.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{facts.join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}

export default PropertyCard;
