import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug, getPropertiesBySuburb, getAgentById } from "@/lib/queries";
import { normalizeLegacyHtml, htmlToPlainText } from "@/lib/legacyContent";
import { RICH_TEXT_CLASSNAME } from "@/lib/richTextClassName";
import { SITE_URL, suburbSlug, TARGET_SUBURBS } from "@/lib/constants";
import { buildMapEmbedUrl } from "@/lib/maps";
import { PhoneIcon, EmailIcon } from "@/components/icons";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyInquiryForm from "@/components/PropertyInquiryForm";

// For the fallback title/description below (separate from the more
// verbose LISTING_TYPE_LABELS the breadcrumb uses further down — "For
// Sale" reads naturally in a title, "Properties For Sale" doesn't).
const LISTING_ACTION_LABEL: Record<string, string> = {
  sale: "For Sale",
  rent: "For Rent",
  sold: "Sold",
  leased: "Leased",
  other: "",
};

/**
 * `priceDisplay` is free text migrated from the old CMS — "$650,000",
 * "$590,000 - $640,000", "Contact Agent", "Auction: Sat 14 March...".
 * Returns:
 *  - both `price` and `min`/`max` for a genuine range ("low - high") — the
 *    low end as `price` (for tools/consumers that only ever read the
 *    simple `Offer.price`), plus the real range for `priceSpecification`,
 *    which is schema.org's actual correct way to represent "somewhere
 *    between these two figures" rather than asserting one number as THE
 *    price.
 *  - just `price` for a single unambiguous figure.
 *  - nothing at all for "Contact Agent", an auction string, or anything
 *    else that isn't a real number — guessing there would be actively
 *    misleading structured data, worse than omitting it.
 */
function parseDollarAmount(
  priceDisplay?: string
): { price: number; min?: number; max?: number } | undefined {
  if (!priceDisplay) return undefined;
  const trimmed = priceDisplay.trim();

  const range = /^\$\s?([\d,]+(?:\.\d+)?)\s*[-–—]\s*\$?\s?([\d,]+(?:\.\d+)?)$/.exec(trimmed);
  if (range) {
    const min = Number(range[1].replace(/,/g, ""));
    const max = Number(range[2].replace(/,/g, ""));
    if (Number.isFinite(min) && Number.isFinite(max)) return { price: min, min, max };
  }

  const single = /^\$\s?([\d,]+(?:\.\d+)?)$/.exec(trimmed);
  if (single) {
    const value = Number(single[1].replace(/,/g, ""));
    if (Number.isFinite(value)) return { price: value };
  }

  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};

  // Fallback used whenever an admin leaves the SEO override fields blank —
  // most existing listings already have a migrated seoTitle/seoDescription
  // (see PropertyForm's SEO fieldset), so this mainly matters for new
  // listings going forward. Previously just the bare address — no price,
  // beds, or buy/rent context, which is exactly the information someone
  // searching "3 bedroom house for sale liverpool nsw" is looking for in
  // the snippet. Kept short (titles get cut off past ~60 characters in
  // search results) — bed/bath count goes in the description instead,
  // where there's more room.
  const actionLabel = LISTING_ACTION_LABEL[property.listingType] || "";
  const bedBath = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const title =
    property.seoTitle ||
    [`${property.address}, ${property.suburb} NSW`, actionLabel].filter(Boolean).join(" — ");
  // Built as one flowing opening sentence plus trailing fragments —
  // joining "{bedBath} property" and "in {suburb}, NSW" as two SEPARATE
  // ". "-joined array entries (an earlier version of this did) produces
  // "2 bed, 1 bath property. in Liverpool, NSW." — a stray sentence break
  // mid-clause. They have to stay one sentence.
  const openingClause = bedBath
    ? `${bedBath} property in ${property.suburb}, NSW.`
    : `Property in ${property.suburb}, NSW.`;
  const description =
    property.seoDescription ||
    [
      openingClause,
      property.priceDisplay ? `${property.priceDisplay}.` : undefined,
      property.description ? htmlToPlainText(property.description, 80) : undefined,
      "Contact Home7 Real Estate today.",
    ]
      .filter(Boolean)
      .join(" ");
  const url = `${SITE_URL}/property/${property.slug}`;
  const image = property.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    // Without this, every property page shared anywhere (Facebook,
    // LinkedIn, Slack, iMessage) inherited the ROOT layout's generic
    // og:title/og:image — a real listing shared as "The Best Real Estate
    // in Liverpool" with the site logo instead of its own photo. Metadata
    // objects don't merge key-by-key across nested fields like `openGraph`
    // — a page that sets its own `openGraph` replaces the parent's
    // entirely, so `url`/`type` need repeating here too, not just title.
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  // getPropertyBySlug() falls back to a case-insensitive match — if that's
  // what actually matched (a legacy mixed-case indexed URL, say), send a
  // permanent redirect to the real, canonically-cased URL rather than
  // silently rendering the same listing at two different live URLs.
  if (property.slug !== slug) {
    permanentRedirect(`/property/${property.slug}`);
  }

  // Same legacy-content sanitizer the blog body goes through (see
  // lib/legacyContent.ts) — property descriptions come from the same old
  // CMS export and carry the identical Word/Google-Docs paste artifacts
  // (inline font-weight/font-size overrides, stray empty-paragraph spacers)
  // that made blog content look bolder/spacier than intended before it was
  // sanitized. This was never routed through that cleanup, which is exactly
  // why it still showed both symptoms here.
  const cleanedDescription = property.description ? normalizeLegacyHtml(property.description) : null;

  // Internal linking — neither of these existed before. Similar listings
  // keep a visitor on the site instead of bouncing after one property, and
  // they're real crawl paths INTO the suburb's other current listings, not
  // just user-facing convenience. Both suburb pages and agent profiles are
  // exactly the pages this site most needs incoming internal links to, per
  // the local-SEO goal — a property page is the highest-traffic page type
  // linking to both.
  const [similarProperties, agent] = await Promise.all([
    getPropertiesBySuburb(property.suburb, 5),
    property.agent ? getAgentById(property.agent.toString()) : Promise.resolve(null),
  ]);
  const otherSimilarProperties = similarProperties
    .filter((p) => p.slug !== property.slug)
    .slice(0, 4);

  // JSON-LD structured data — RealEstateListing, for general semantic/
  // Knowledge Graph understanding (Google doesn't currently have a
  // dedicated SERP rich-result for real estate listings the way it does
  // for Product/Recipe/Event, so this isn't chasing a specific visible
  // search feature — it's giving crawlers an unambiguous, complete read on
  // what the page is, which is still a real signal). Previously only had
  // name/description/address — bedrooms/bathrooms/price/images/buy-vs-rent
  // were all missing despite being exactly what a listing IS.
  const isRentalListing = property.listingType === "rent" || property.listingType === "leased";
  const salePrice = parseDollarAmount(property.priceDisplay);
  // The street address alone used to be the page's H1, with suburb/state/
  // postcode relegated to a smaller <p> underneath — real weight in
  // on-page SEO, and this site's #1 priority (PROJECT_BRIEF.md) is
  // ranking for local, suburb-specific search, which a street-only H1
  // does nothing for. Full address in the H1 matches how the <title> tag
  // here already builds itself, and how realestate.com.au/domain.com.au
  // format their own listing H1s.
  const fullAddress = `${property.address}, ${property.suburb} ${property.state} ${property.postcode}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: fullAddress,
    description: property.description,
    url: `${SITE_URL}/property/${property.slug}`,
    image: property.images?.length ? property.images : undefined,
    datePosted: property.createdAt.toISOString(),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.suburb,
      addressRegion: property.state,
      postalCode: property.postcode,
      addressCountry: "AU",
    },
    // The physical property being listed, distinct from the listing itself
    // — schema.org's own modelling for "a real estate ad about a place".
    about: {
      "@type": "Accommodation",
      numberOfBedrooms: property.bedrooms || undefined,
      numberOfBathroomsTotal: property.bathrooms || undefined,
      // Deliberately not attempting numberOfRooms (schema.org's total-room
      // count) — bedrooms/bathrooms/toilets/carSpaces are tracked
      // separately with no "living areas" count, so any total would be a
      // guess, not a real figure.
    },
    // businessFunction distinguishes "this is for sale" from "this is for
    // rent" per schema.org's GoodRelations vocabulary — the closest thing
    // to a structured buy-vs-rent signal this type supports. price is only
    // included when parseDollarAmount found a real figure — never a guess
    // off "Contact Agent" or an auction string, which would be worse than
    // no price at all. A genuine range ("$590,000 - $640,000") uses its
    // low end as `price` (for any consumer that only reads that field)
    // plus the real priceSpecification range for one that reads it
    // properly — schema.org's actual correct way to represent "somewhere
    // between these two figures" rather than asserting one number as THE
    // price.
    offers: {
      "@type": "Offer",
      priceCurrency: "AUD",
      price: isRentalListing ? property.rentPerWeek || undefined : salePrice?.price,
      priceSpecification:
        !isRentalListing && salePrice?.min !== undefined
          ? {
              "@type": "PriceSpecification",
              minPrice: salePrice.min,
              maxPrice: salePrice.max,
              priceCurrency: "AUD",
            }
          : undefined,
      businessFunction: isRentalListing
        ? "http://purl.org/goodrelations/v1#LeaseOut"
        : "http://purl.org/goodrelations/v1#Sell",
      availability:
        property.listingType === "sold" || property.listingType === "leased"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
    },
  };

  // Present on nearly every other page template (see richTextClassName.ts's
  // sibling pages) but was missing here — the highest-traffic dynamic page
  // type on the whole site, so the one place it mattered most.
  const LISTING_TYPE_LABELS: Record<string, { label: string; path: string }> = {
    sale: { label: "Properties For Sale", path: "/properties-for-sale" },
    rent: { label: "Properties For Rent", path: "/properties-for-rent" },
    sold: { label: "Sold Properties", path: "/sold-properties" },
    leased: { label: "Leased Properties", path: "/leased-properties" },
    other: { label: "Other Properties", path: "/other-properties" },
  };
  const listingCrumb = LISTING_TYPE_LABELS[property.listingType] ?? LISTING_TYPE_LABELS.other;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: listingCrumb.label, item: `${SITE_URL}${listingCrumb.path}` },
      { "@type": "ListItem", position: 3, name: property.address, item: `${SITE_URL}/property/${property.slug}` },
    ],
  };

  const priceText =
    property.priceDisplay || (property.rentPerWeek ? `$${property.rentPerWeek} P/W` : "Contact Agent");

  // Inline "label: value" facts for the Property Details card — only the
  // ones this specific listing actually has, same @if-style optionality
  // as the old site's own template (a listing missing "toilets" just
  // skips that one fact rather than showing "Toilet: —").
  const detailFacts: { label: string; value: string }[] = [
    property.propertyType ? { label: "Property Type", value: property.propertyType } : null,
    listingCrumb ? { label: "Property Status", value: LISTING_ACTION_LABEL[property.listingType] || property.listingType } : null,
    property.bedrooms ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
    property.bathrooms ? { label: "Bath", value: String(property.bathrooms) } : null,
    property.toilets ? { label: "Toilet", value: String(property.toilets) } : null,
    property.carSpaces ? { label: "Garages", value: String(property.carSpaces) } : null,
    property.landSize ? { label: "Land Size", value: property.landSize } : null,
    property.floorSize ? { label: "Floor Size", value: property.floorSize } : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  const isInTargetSuburb = TARGET_SUBURBS.some((s) => s.toLowerCase() === property.suburb.toLowerCase());

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* A real, visible trail matching breadcrumbJsonLd above exactly
          (same 3 levels, same labels) — the schema existed on its own
          for a while with nothing on the page actually backing it up,
          which is weaker structured data (Google's guidance leans toward
          visible content matching what's marked up) and wasted a free
          internal link back to the listing-type category page. */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-gold-dark hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={listingCrumb.path} className="hover:text-brand-gold-dark hover:underline">
          {listingCrumb.label}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-slate-700 truncate max-w-64 sm:max-w-none">
          {property.address}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-navy">{fullAddress}</h1>
        </div>
        {/* text-left on mobile — once this wraps below the address (the
            flex-wrap above), text-right kept it pinned to the right edge
            on its own line, which read as misaligned rather than as part
            of the same left-aligned page. Right-aligned again once there's
            room for both side by side. */}
        <div className="text-left sm:text-right">
          {LISTING_ACTION_LABEL[property.listingType] && (
            <span className="inline-block rounded-full bg-brand-gold px-4 py-1.5 text-sm font-semibold text-brand-navy">
              {LISTING_ACTION_LABEL[property.listingType]}
            </span>
          )}
          <p className="mt-2 text-2xl font-semibold text-brand-gold-dark">{priceText}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <PropertyGallery images={property.images || []} address={property.address} />

          {cleanedDescription && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Description
              </h2>
              {/* Same shared typography as the blog article body — see
                  lib/richTextClassName.ts — so a property description reads
                  with the same size/weight/rhythm as blog content instead of
                  the smaller, tighter default. The old site's migrated copy
                  for most listings ends with an h5 "contact the agent"
                  call-out and an h6 "Disclaimer:" block — both now styled
                  (bold+gold-underline / small muted label) instead of
                  rendering as invisible plain text. */}
              <div
                className={`mt-4 max-w-none ${RICH_TEXT_CLASSNAME}`}
                dangerouslySetInnerHTML={{ __html: cleanedDescription }}
              />
            </div>
          )}

          {detailFacts.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Property Details
              </h2>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                {detailFacts.map((f) => (
                  <p key={f.label} className="text-slate-600">
                    <span className="font-semibold text-brand-navy">{f.label}:</span> {f.value}
                  </p>
                ))}
              </div>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Amenities
              </h2>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {property.amenities.map((feature) => (
                  <span key={feature} className="flex items-center gap-2 text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-gold text-brand-navy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rare — only ~3% of migrated listings had a genuine video embed
              rather than the address typed into that field by habit (see
              scripts/backfill-property-details.ts), so this only ever
              renders when there's something real to show. */}
          {property.videoEmbedUrl && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
                Property Video
              </h2>
              <div className="mt-4 aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={property.videoEmbedUrl}
                  title={`Video for ${property.address}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Always shows a real map now — property.mapEmbedUrl (the
              ~147/153 migrated listings that have one, from Google Maps'
              own "Share > Embed a map" UI) if set, otherwise a key-less
              embed auto-built from the address itself (see lib/maps.ts —
              no API key/GCP billing needed, so this needs zero admin
              data entry for a new listing to get a working map). */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
              Location
            </h2>
            <div className="mt-4 aspect-video rounded-lg overflow-hidden">
              <iframe
                src={property.mapEmbedUrl || buildMapEmbedUrl(`${property.address}, ${property.suburb} NSW ${property.postcode}, Australia`)}
                title={`Map for ${property.address}`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {isInTargetSuburb && (
            <p>
              <Link
                href={`/suburb/${suburbSlug(property.suburb)}`}
                className="text-sm font-semibold text-brand-gold-dark hover:underline"
              >
                See more homes in {property.suburb} →
              </Link>
            </p>
          )}
        </div>

        {/* Sidebar — sticky so the agent card/inquiry form stays visible
            while scrolling through a long description/amenities list, same
            as the old site. top-24 clears SiteNav's sticky header.
            max-h + overflow-y-auto: on a shorter viewport (a laptop, or a
            tall description pushing this content taller than the screen),
            a plain sticky element with no height limit just pins at top-24
            and lets its own overflow run off the BOTTOM of the viewport
            with no way to reach it — sticky alone doesn't make an element
            scroll, it only stops it moving once pinned. The submit button
            was reachable only by scrolling all the way down the entire
            article, since that's the only thing that "unsticks" it. This
            caps the sidebar at the actual available viewport height (100vh
            minus the top-24 offset, minus a little breathing room) and
            lets it scroll internally past that, so every field down to the
            submit button is always reachable independent of how long the
            article is. */}
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl text-brand-navy pb-3 border-b border-slate-200">
              Agent Information
            </h2>
            {agent ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  {agent.photo && (
                    <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-slate-100">
                      <Image
                        src={agent.photo}
                        alt={agent.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/agent/${agent.slug}`}
                      className="font-display text-lg text-brand-navy hover:text-brand-gold-dark"
                    >
                      {agent.name}
                    </Link>
                    {/* text-lg — matches ContactForm's own heading/intro
                        size on the blog sidebar (both text-lg there), per
                        explicit request to replicate that "top text" feel
                        here too. agent.name above is already text-lg, so
                        only this line needed bumping (was text-sm). */}
                    <p className="text-lg text-slate-500">{agent.role}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-base">
                  {/* Mobile and office landline both shown when both exist
                      — not mobile-or-phone picking just one. Matches the
                      live site (every listing's agent card shows both
                      numbers), and the two genuinely mean different
                      things: mobile reaches the agent directly, the
                      landline reaches the office. Sized up a step (was
                      text-sm/14px icons) to match the larger-text feel of
                      the inquiry form directly below it. */}
                  {agent.mobile && (
                    <a
                      href={`tel:${agent.mobile}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-brand-gold-dark"
                    >
                      <PhoneIcon size={16} className="shrink-0 text-brand-navy" />
                      {agent.mobile}
                    </a>
                  )}
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-brand-gold-dark"
                    >
                      <PhoneIcon size={16} className="shrink-0 text-brand-navy" />
                      {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-brand-gold-dark"
                    >
                      <EmailIcon size={16} className="shrink-0 text-brand-navy" />
                      {agent.email}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Contact Home7 Real Estate for more information on this property.
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
              <PropertyInquiryForm
                propertyId={String(property._id)}
                propertyAddress={property.address}
                leadType={isRentalListing ? "renting" : "buying"}
              />
            </div>
          </div>

          {property.listingType === "rent" && (
            <Link
              href={`/property-tenant-application-download?property=${property.slug}`}
              className="block text-center bg-brand-navy text-white rounded px-5 py-3 font-semibold hover:brightness-110 transition"
            >
              Apply for This Property
            </Link>
          )}
        </aside>
      </div>
      </div>

      {/* Own, wider container — matching the homepage's ListingsSection
          container (max-w-6xl, 2xl:max-w-384) exactly, rather than sitting
          inside the max-w-7xl two-column layout above (2/3-width once the
          sidebar takes its third), which squeezed these cards narrower
          than they render everywhere else on the site. */}
      {otherSimilarProperties.length > 0 && (
        <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 mt-12">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">
              More Properties in {property.suburb}
            </h2>
          </div>
          <div className="mt-8">
            <ResponsiveCardGrid
              items={otherSimilarProperties}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
              wide4up
            />
          </div>
        </div>
      )}
    </>
  );
}
