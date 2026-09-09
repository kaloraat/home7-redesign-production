import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import AppraisalForm from "@/components/AppraisalForm";

const TITLE = "Free Market Appraisal";
const DESCRIPTION = "Request a free property price estimate and market guide from Home7 Real Estate.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/free-market-appraisal"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Free Market Appraisal", item: `${SITE_URL}/free-market-appraisal` },
  ],
};

const COPY: Record<string, { heading: string; blurb: string }> = {
  selling: {
    heading: "Sell My Property",
    blurb: "Get a free, no-obligation appraisal before you list.",
  },
  renting: {
    heading: "Lease My Property",
    blurb: "Find out what your property could rent for.",
  },
  buying: {
    heading: "Buy a Property for Me",
    blurb: "Tell us what you're after and we'll help you find it.",
  },
};

const TABS = ["selling", "renting", "buying"] as const;
type Tab = (typeof TABS)[number];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const defaultTab: Tab = key && (TABS as readonly string[]).includes(key) ? (key as Tab) : "selling";
  const variant = COPY[defaultTab];

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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Free Market Appraisal
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">{variant.heading}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="text-lg text-slate-600 leading-relaxed text-center">
          As the real estate market twists and turns, it pays to keep an eye on the value of your
          property — so you always know where you stand. By contacting one of our property
          experts, you can receive a no-obligation appraisal advising you of your investment&apos;s
          worth in today&apos;s market. Simply fill out the form below and we&apos;ll be in touch.
        </p>

        {/* Multi-step Selling/Renting/Buying form — rebuilt from the live
            site's 3-tab/3-step appraisal form (old_laravel_site/…/
            appraisalPage.blade.php). See AppraisalForm.tsx for the full
            writeup on the rebuild decisions. `?key=` (set by the Rent nav
            dropdown's own appraisal link, e.g. ?key=renting) drives which
            tab starts selected — "selling" otherwise, same default as the
            live site. */}
        {/* key={defaultTab} forces a full remount when the ?key= param
            changes — without it, navigating here via the Buy/Rent/Sold nav
            dropdowns (client-side navigation between ?key= variants of this
            same route) left the form's tab state stale from its first
            mount, only picking up the new default on a hard refresh. */}
        <div className="mt-8">
          <AppraisalForm key={defaultTab} defaultTab={defaultTab} />
        </div>
      </div>
    </div>
  );
}
