import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentBySlug, getPropertiesBySuburb } from "@/lib/queries";
import { normalizeLegacyHtml } from "@/lib/legacyContent";
import { RICH_TEXT_CLASSNAME } from "@/lib/richTextClassName";
import { SITE_URL } from "@/lib/constants";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";

/**
 * The site's core local-SEO play (PROJECT_BRIEF.md Phase 4) — one page per
 * target suburb pairing genuinely local content with that suburb's actual
 * current listings, so the site can compete for "houses for sale in
 * {suburb}"-style searches instead of only matching realestate.com.au on
 * generic terms. Content lives in the Content model (urlPath: "suburb"),
 * admin-editable the same way as blog posts; listings are always queried
 * live from Property, never stored on the Content doc, so a suburb page
 * never goes stale as the actual listings change.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentBySlug(slug, "suburb");
  if (!page) return {};

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.excerpt;
  const url = `${SITE_URL}/suburb/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function SuburbPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getContentBySlug(slug, "suburb");
  if (!page) notFound();

  const suburbName = page.targetSuburb || page.title;
  const properties = await getPropertiesBySuburb(suburbName, 12);
  const cleanedBody = normalizeLegacyHtml(page.bodyHtml);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: `${suburbName} Real Estate`, item: `${SITE_URL}/suburb/${page.slug}` },
    ],
  };

  // schema.org Place — identifies the page as being genuinely about this
  // suburb specifically (distinct from a generic listings page), which is
  // what local-SEO structured data is for.
  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: suburbName,
    address: {
      "@type": "PostalAddress",
      addressLocality: suburbName,
      addressRegion: "NSW",
      addressCountry: "AU",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />

      {/* Same hero technique as the other listing/utility pages — see
          properties-for-sale/page.tsx for the full sizing writeup. */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / {suburbName} Real Estate
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">
            {suburbName} Real Estate
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 py-16 sm:py-20">
        {page.excerpt && (
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">{page.excerpt}</p>
        )}

        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-2xl text-brand-navy">
              Current Listings in {suburbName}
            </h2>
            <div className="flex gap-3 text-sm font-medium">
              <Link href="/properties-for-sale" className="text-brand-gold-dark hover:underline">
                All properties for sale →
              </Link>
              <Link href="/properties-for-rent" className="text-brand-gold-dark hover:underline">
                All properties for rent →
              </Link>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-slate-600 text-lg">
                We don&apos;t have a current listing in {suburbName} on the site right now — but
                we&apos;re active in this market and new stock moves fast.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition"
              >
                Get in touch about {suburbName}
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <ResponsiveCardGrid
                items={properties}
                renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
                wide4up
              />
            </div>
          )}
        </div>

        <div className={`mt-16 ${RICH_TEXT_CLASSNAME}`} dangerouslySetInnerHTML={{ __html: cleanedBody }} />

        <div className="mt-16 rounded-lg border border-slate-200 bg-slate-50 px-6 py-8 text-center">
          <h2 className="font-display text-2xl text-brand-navy">
            Thinking of buying or selling in {suburbName}?
          </h2>
          <p className="mt-2 text-slate-600">
            Our local team can give you an honest, up-to-date read on the {suburbName} market.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/free-market-appraisal"
              className="bg-brand-gold text-brand-navy rounded px-5 py-2.5 font-semibold hover:brightness-95 transition"
            >
              Free Market Appraisal
            </Link>
            <Link
              href="/contact"
              className="border border-brand-navy text-brand-navy rounded px-5 py-2.5 font-semibold hover:bg-brand-navy hover:text-white transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
