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

// Verbatim intro copy migrated from the Laravel site's `pages` table
// (slug: open-for-inspection) — same legacy CMS export as the blog/property
// content, so it gets the same normalizeLegacyHtml() cleanup (strips the
// Word/Google-Docs paste artifacts — stray margins, empty <p><br></p>
// spacers — that content otherwise carries).
const CONTENT = "<p>Welcome to our&nbsp; Home 7 real estate website, where you can find your dream home or investment property. We are committed to providing the best and most up-to-date listings and information to make your real estate search a breeze.</p><p><br></p><p>Our website offers a variety of properties for sale or rent, including houses, apartments, townhouses, condos, and commercial properties. Whether you’re looking for a cozy starter home, a luxurious estate, or an office space for your business, we have many options to fit your needs and budget.</p><p><br></p><p>To help you narrow your search, we offer filters such as location, price range, number of bedrooms and bathrooms, square footage, and more. We also provide detailed descriptions of each property, including features, amenities, and nearby attractions.</p><p><br></p><p>One of the unique features of our website is the “Open for Inspection” section, which provides information on upcoming open house events. You can easily find properties available for inspection in your desired area and schedule a visit to view the property in person.</p><p><br></p><p>Our experienced and knowledgeable real estate agents are always ready to help you with any questions. We understand that buying or renting a property can be daunting, but we are here to guide you every step of the way and help you make informed decisions.</p><p><br></p><p>In addition to our property listings, we offer valuable resources such as tips for buyers and renters, market updates, and real estate news. We want to ensure you have all the information you need to make the best decision.</p><p><br></p><p>Thank you for choosing our website for your real estate needs. We hope our listings and resources will help you find your perfect property. If you have any questions or feedback, please don’t hesitate to contact us.</p>";
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
