import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { normalizeLegacyHtml } from "@/lib/legacyContent";

const TITLE = "Home7 Real Estate Open for Inspection";
const DESCRIPTION = "Checkout Home7 Real Estate Open for Inspection";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/open-for-inspection"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Open For Inspection", item: `${SITE_URL}/open-for-inspection` },
  ],
};

// Intro copy, originally migrated from the Laravel site's `pages` table
// (slug: open-for-inspection); rewritten 2026-11-27 (it described US-style
// features the site doesn't have: condos, square footage filters) — same legacy CMS export as the blog/property
// content, so it gets the same normalizeLegacyHtml() cleanup (strips the
// Word/Google-Docs paste artifacts — stray margins, empty <p><br></p>
// spacers — that content otherwise carries).
const CONTENT = "<p>Welcome to Home7 Real Estate's open for inspection page. Here you can find upcoming open homes for properties we are selling or leasing across Liverpool, Campbelltown and South West Sydney.</p><p>Our listings include houses, units, townhouses, duplexes and land, from first homes and rentals to family homes and investment properties. Each listing has photos, a full description, the number of bedrooms, bathrooms and car spaces, and the inspection times.</p><p>If none of the times suit you, call us on (02) 8729 7753 and we will arrange a private inspection. We are a small, family-owned agency, so you will speak to someone who knows the property and can answer your questions honestly.</p><p>Thinking of selling or renting out your own property? Book a free, no-obligation market appraisal and we will give you an honest price based on recent local results.</p>";
const cleanedContent = normalizeLegacyHtml(CONTENT);

export default function Page() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique/height as About/Contact — see those pages'
          hero comments. Reuses the homepage's hero-banner.webp, same as the
          other "Buy" utility pages (no dedicated banner photo exists yet
          for any of these). */}
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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Open For Inspection
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Open For Inspection</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 py-16 sm:py-20">
        {/* Same typography treatment as blog/property content — text-xl/
            font-medium/leading-[1.85], one uniform mb-8 per block. The
            block fills the page's already-centered container width (no
            narrower max-w pinching it into a slim column) — text stays
            normally left-aligned; only the block's position is centered,
            not each line of text (same fix as properties-for-sale/
            buyers-advisory — text-align:center was centering every line,
            not what was wanted). No longer duplicates the property grid
            that already lives on /properties-for-sale — this page is just
            the "what Open for Inspection means" explainer now. */}
        <div
          className="text-xl font-medium text-slate-600 leading-[1.85] [&_:is(p,li,h1,h2,h3,h4,h5,h6)]:mb-8"
          dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
      </div>
    </div>
  );
}
