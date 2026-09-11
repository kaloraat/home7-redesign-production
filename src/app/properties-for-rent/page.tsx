import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";

const TITLE = "Best Properties for Rent in Liverpool, NSW";
const DESCRIPTION = "Discover the best properties for rent in Liverpool, NSW and Western Sydney.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/properties-for-rent"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Properties For Rent", item: `${SITE_URL}/properties-for-rent` },
  ],
};

export default async function Page() {
  const properties = await getPropertiesByType("rent", 100);

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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Properties For Rent
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Properties For Rent</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          Discover the best properties for rent in Liverpool, NSW and Western Sydney.
        </p>

        {properties.length === 0 ? (
          <p className="mt-10 text-slate-500 text-lg">
            No listings yet — connect MONGODB_URI and add properties from the admin dashboard.
          </p>
        ) : (
          // Plain grid, not ResponsiveCardGrid — see sold-properties/page.tsx
          // for the full writeup: that component hides trailing items so a
          // wide-screen row never ends up partial, right for a homepage
          // preview but not for this page, which IS the full list.
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={String(p._id)} property={p} />
            ))}
          </div>
        )}

        {/* SEO copy from the live site (property_rent_page_content) — its
            one internal link (originally an absolute home7.com.au URL back
            to this same page) is now a relative <Link> instead, since it's
            pointing within this same app. */}
        <div className="mt-16 text-xl font-medium text-slate-600 leading-[1.85]">
          <h2 className="font-display text-3xl text-brand-navy mb-6">
            Finding Your Ideal Rental Property with Home7
          </h2>
          <p className="mb-8">
            Looking for a rental home can be overwhelming, but Home7 simplifies the process with
            a comprehensive selection of properties for rent across Australia. Whether
            you&apos;re after an urban apartment or a spacious suburban house, the platform
            provides detailed listings tailored to meet various needs. With intuitive search
            filters for location, price, and property type, users can easily narrow down
            options. Each listing comes with essential details, photos, and contact
            information, allowing renters to inquire and arrange viewings conveniently.
          </p>
          <p>
            Explore more at{" "}
            <Link href="/properties-for-rent" className="text-brand-gold-dark hover:underline">
              Home7 Properties for Rent
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
