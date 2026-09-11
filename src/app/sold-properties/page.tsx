import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";

const TITLE = "Sold Properties in Liverpool, NSW";
const DESCRIPTION = "See recently sold properties across Liverpool and Western Sydney.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/sold-properties"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Sold Properties", item: `${SITE_URL}/sold-properties` },
  ],
};

export default async function Page() {
  const properties = await getPropertiesByType("sold", 100);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique as About/Contact, at the reduced (2/3) height
          used across every non-homepage hero. Reuses the homepage's
          hero-banner.webp — no dedicated banner photo exists for this page. */}
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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Sold Properties
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Sold Properties</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          See recently sold properties across Liverpool and Western Sydney.
        </p>

        {properties.length === 0 ? (
          <p className="mt-10 text-slate-500 text-lg">
            No listings yet — connect MONGODB_URI and add properties from the admin dashboard.
          </p>
        ) : (
          // Plain grid, not ResponsiveCardGrid — that component deliberately
          // hides trailing items so a wide-screen 4-column row never ends up
          // orphaned/partial (right for a "latest 4" homepage preview), but
          // this page IS the full list, not a preview — with 11 real sold
          // listings it was silently hiding 2-3 of them depending on
          // viewport width (found live: Math.floor(11/4)*4 = 8 shown on a
          // wide screen, real listings just missing with no way to see them
          // — a genuine SEO/trust-signal loss on a "sold properties" archive
          // page, not a cosmetic issue). Matches the same plain grid
          // /properties, /leased-properties, and /other-properties already
          // correctly use for exactly this reason.
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={String(p._id)} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
