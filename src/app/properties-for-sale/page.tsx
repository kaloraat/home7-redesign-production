import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { getPropertiesByType } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";

const TITLE = "Best Properties for Sale in Liverpool, NSW";
const DESCRIPTION = "Explore the best properties for sale in Liverpool, NSW and Western Sydney.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/properties-for-sale"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Properties For Sale", item: `${SITE_URL}/properties-for-sale` },
  ],
};

export default async function Page() {
  const properties = await getPropertiesByType("sale", 100);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique/height as About/Contact — see those pages'
          hero comments for the full writeup. No dedicated banner photo
          exists for this page, so it reuses the homepage's hero-banner.webp
          (same wide letterbox crop the technique expects) rather than
          leaving this and the other "Buy" utility pages without a hero at
          all, which is what made them feel inconsistent with the rest of
          the site. */}
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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Properties For Sale
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Properties For Sale</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl 2xl:max-w-384 px-4 py-16 sm:py-20">
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          Explore the best properties for sale in Liverpool, NSW and Western Sydney.
        </p>

        {properties.length === 0 ? (
          <p className="mt-10 text-slate-500 text-lg">
            No listings yet — connect MONGODB_URI and add properties from the admin dashboard.
          </p>
        ) : (
          <div className="mt-8">
            <ResponsiveCardGrid
              items={properties}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
              wide4up
            />
          </div>
        )}

        {/* SEO/guide copy from the live site — sits below the listings
            there too, not above them. */}
        <div className="mt-16 text-xl font-medium text-slate-600 leading-[1.85]">
          <h2 className="font-display text-3xl text-brand-navy mb-6">
            The Ultimate Guide to Finding Your Dream Property for Sale in Liverpool, NSW
          </h2>
          <p className="mb-8">
            Are you searching for the perfect property in the heart of Liverpool, NSW? Whether
            you&apos;re a first-time homebuyer, investor, or looking for an upgrade, Liverpool
            offers a diverse range of properties to fit every need. At Home7 Real Estate,
            we&apos;re committed to helping you find the best property for sale that matches your
            lifestyle and goals. In this guide, we&apos;ll walk you through the key steps to
            making a confident and informed purchase.
          </p>
          <p className="mb-8">
            Investing in real estate is one of life&apos;s biggest decisions, and Liverpool, NSW,
            offers a wealth of opportunities. With the right guidance from Home7 Real Estate, you
            can find the perfect property that meets your needs and fits your budget.
          </p>
          <p>
            Don&apos;t wait — start your journey today! <Link href="/contact" className="text-brand-gold-dark hover:underline">Contact us</Link> to
            discover more about the best properties for sale in Liverpool, NSW.
          </p>
        </div>
      </div>
    </div>
  );
}
