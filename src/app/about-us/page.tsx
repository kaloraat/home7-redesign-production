import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { getAgents } from "@/lib/queries";
import { PlayIcon } from "@/components/icons";
import ServiceAreaTabs from "@/components/ServiceAreaTabs";
import TeamGrid from "@/components/TeamGrid";

// Matches the live site's indexed title/description verbatim — preserves
// ranking equity for this page the same way the homepage's metadata does.
const TITLE = "Home7 Real Estate | Best Real Estate in Liverpool, NSW";
const DESCRIPTION =
  "Home7 Real Estate offers top-quality property services in Liverpool, NSW, specializing in buying, selling, and leasing homes with a commitment to client satisfaction";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/about-us"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "About Us", item: `${SITE_URL}/about-us` },
  ],
};

// Body paragraphs are the live page's own text (fetched from the rendered
// HTML, since this content is admin-editable in their DB, not in the
// Laravel codebase) with only light grammar/typo cleanup — "we goes about",
// "vendors expectations", inconsistent "Home 7"/"Home7" spacing — the same
// treatment given Mohammed's bio on the homepage. Substance and keywords
// are unchanged.
const ABOUT_PARAGRAPHS = [
  "Home7 Real Estate consistently exceeds vendor expectations, including recent record sales in Sydney, Liverpool, Minto, Campbelltown, Glenfield, Oran Park, Bardia, Denham Court, Willowdale, Prestons, Bankstown, and across South West Sydney and Rockdale.",
  "As a Sydney resident, we have a great appreciation for the history of the area and share a love of the vibrant lifestyle on offer. A proven high achiever, Home7's proficiency in a broad range of property — stretching from apartments to multi-million dollar homes — ensures that all our clients receive knowledgeable and genuine advice appropriate to current market conditions.",
  "An outstanding communicator with exceptional local knowledge, Home7 consistently achieves extraordinary results with honesty and tenacity — the building blocks from which we go about our day-to-day business.",
];

// The live page repeats this exact paragraph per suburb with only the name
// swapped — recognizable as templated local-SEO copy, not hand-written per
// suburb, but still real indexed text, so kept rather than rewritten. One
// suburb ("Bankstown") was listed twice with identical text on the live
// page — dropped here rather than carried forward as a duplicate.
//
// Extended with every suburb from the homepage's TARGET_SUBURBS list (see
// lib/constants.ts) that wasn't already covered above, so this "Our Service
// Area" list and the homepage's suburb list agree rather than reading as two
// different service footprints. The new entries reuse the same templated
// pattern as the live content above (generic service-quality copy, not a
// factual claim like a sales record) rather than introducing a new voice.
const SERVICE_AREAS = [
  {
    name: "Liverpool",
    description:
      "Our dedicated team of experienced professionals possesses an in-depth understanding of the Liverpool real estate market, providing you with invaluable insights and personalized guidance throughout your property journey. Whether you're buying, selling, or investing, our expansive service area allows us to tailor our expertise to meet your unique requirements. Experience the difference with Home7 Real Estate, where our commitment to excellence and extensive service area converge to offer you a superior real estate experience in Liverpool.",
  },
  {
    name: "Warwick Farm",
    description:
      "Our dedicated team of experienced professionals possesses an in-depth understanding of the Warwick Farm real estate market, providing you with invaluable insights and personalized guidance throughout your property journey. Whether you're buying, selling, or investing, our expansive service area allows us to tailor our expertise to meet your unique requirements. Experience the difference with Home7 Real Estate, where our commitment to excellence and extensive service area converge to offer you a superior real estate experience in Warwick Farm.",
  },
  {
    name: "Moorebank",
    description:
      "Home7 Real Estate, your premier real estate agency serving the dynamic community of Moorebank. Our dedicated team covers the entire locale, offering a diverse array of properties from upscale residences to cozy starter homes. With a commitment to excellence, our experienced professionals provide personalized guidance for all your real estate needs.",
  },
  {
    name: "Lurnea",
    description:
      "Home7 Real Estate, your trusted real estate agency dedicated to serving the vibrant community of Lurnea. Our experienced team covers the entire area, offering a diverse portfolio of properties ranging from luxurious residences to charming starter homes. With a commitment to excellence, we provide personalized guidance for all your real estate needs in Lurnea.",
  },
  {
    name: "Ashcroft",
    description:
      "Home7 Real Estate, your dedicated real estate agency, gives out tailored service in catering to the diverse community of Ashcroft. Our experienced team extends its reach throughout Ashcroft, presenting a unique array of properties, from modern residences to cozy starter homes. Committed to excellence, we offer personalized guidance to meet all your real estate needs in Ashcroft.",
  },
  {
    name: "Bankstown",
    description:
      "At Home7, we take pride in offering unparalleled service in this dynamic locale, known for its diverse neighborhoods and thriving real estate market. Our dedicated team of experts at Home7 Real Estate brings a wealth of local knowledge to the forefront, ensuring that your property needs are met with precision and insight. Whether you're looking to buy, sell, or invest in Bankstown, we provide personalized guidance to navigate the unique real estate landscape of this bustling suburb.",
  },
  {
    name: "Oran Park",
    description:
      "Home7 Real Estate, your trusted real estate agency specializing in the dynamic and growing community of Oran Park. As a homeowner or investor in Oran Park, you can rely on Home7 to strategically optimize our online presence with high keyword density. This ensures that our listings and services are easily discoverable, connecting you with the ideal property or buyer seamlessly.",
  },
  {
    name: "Minto",
    description:
      "At Home7, we pride ourselves on delivering exceptional service in this diverse and evolving suburb, known for its welcoming neighborhoods and thriving real estate market. Our experienced team at Home7 Real Estate possesses a deep understanding of Minto, ensuring that your property needs are met with expertise and personalized attention. Whether you're looking to buy, sell, or invest in Minto, we provide guidance tailored to the unique opportunities in this vibrant suburb.",
  },
  {
    name: "Edmondson Park",
    description:
      "Our experienced team at Home7 Real Estate brings a wealth of local knowledge to the forefront, ensuring that your property needs in Edmondson Park are met with precision and expertise. Whether you're in the market to buy, sell, or invest, we offer personalized guidance tailored to the distinctive opportunities available in this growing suburb.",
  },
  {
    name: "Casula",
    description:
      "Home7 Real Estate, your premier real estate agency in Casula. Our experienced team provides personalized guidance in this dynamic suburb, known for its diverse neighborhoods and growing real estate market. Trust Home7 to strategically optimize our online presence with high keyword density, ensuring seamless connections for buyers and sellers in Casula.",
  },
  {
    name: "Green Valley",
    description:
      "Our knowledgeable team at Home7 Real Estate is well-versed in the nuances of Green Valley, ensuring your property needs are met with precision and local insight. Whether you're buying, selling, or investing in Green Valley, we offer personalized guidance to navigate the unique real estate landscape of this welcoming community.",
  },
  {
    name: "Campbelltown",
    description:
      "Our dedicated team of experienced professionals possesses an in-depth understanding of the Campbelltown real estate market, providing you with invaluable insights and personalized guidance throughout your property journey. Whether you're buying, selling, or investing, our expansive service area allows us to tailor our expertise to meet your unique requirements. Experience the difference with Home7 Real Estate, where our commitment to excellence and extensive service area converge to offer you a superior real estate experience in Campbelltown.",
  },
  {
    name: "Blacktown",
    description:
      "Home7 Real Estate, your premier real estate agency serving the dynamic community of Blacktown. Our dedicated team covers the entire locale, offering a diverse array of properties from upscale residences to cozy starter homes. With a commitment to excellence, our experienced professionals provide personalized guidance for all your real estate needs.",
  },
  {
    name: "Parramatta",
    description:
      "Home7 Real Estate, your trusted real estate agency dedicated to serving the vibrant community of Parramatta. Our experienced team covers the entire area, offering a diverse portfolio of properties ranging from luxurious residences to charming starter homes. With a commitment to excellence, we provide personalized guidance for all your real estate needs in Parramatta.",
  },
  {
    name: "Leppington",
    description:
      "Home7 Real Estate, your dedicated real estate agency, gives out tailored service in catering to the diverse community of Leppington. Our experienced team extends its reach throughout Leppington, presenting a unique array of properties, from modern residences to cozy starter homes. Committed to excellence, we offer personalized guidance to meet all your real estate needs in Leppington.",
  },
  {
    name: "Austral",
    description:
      "At Home7, we take pride in offering unparalleled service in this dynamic locale, known for its diverse neighborhoods and thriving real estate market. Our dedicated team of experts at Home7 Real Estate brings a wealth of local knowledge to the forefront, ensuring that your property needs are met with precision and insight. Whether you're looking to buy, sell, or invest in Austral, we provide personalized guidance to navigate the unique real estate landscape of this growing suburb.",
  },
  {
    name: "Castle Hill",
    description:
      "Home7 Real Estate, your trusted real estate agency specializing in the dynamic and growing community of Castle Hill. As a homeowner or investor in Castle Hill, you can rely on Home7's local knowledge and market experience to connect you with the ideal property or buyer seamlessly.",
  },
  {
    name: "Baulkham Hills",
    description:
      "At Home7, we pride ourselves on delivering exceptional service in this well-established suburb, known for its welcoming neighborhoods and thriving real estate market. Our experienced team at Home7 Real Estate possesses a deep understanding of Baulkham Hills, ensuring that your property needs are met with expertise and personalized attention.",
  },
  {
    name: "Penrith",
    description:
      "Our experienced team at Home7 Real Estate brings a wealth of local knowledge to the forefront, ensuring that your property needs in Penrith are met with precision and expertise. Whether you're in the market to buy, sell, or invest, we offer personalized guidance tailored to the distinctive opportunities available in this growing region.",
  },
  {
    name: "Marsden Park",
    description:
      "Home7 Real Estate, your premier real estate agency in Marsden Park. Our experienced team provides personalized guidance in this fast-growing suburb, known for its new communities and expanding real estate market, ensuring seamless connections for buyers and sellers in Marsden Park.",
  },
  {
    name: "Box Hill",
    description:
      "Our knowledgeable team at Home7 Real Estate is well-versed in the nuances of Box Hill, ensuring your property needs are met with precision and local insight. Whether you're buying, selling, or investing in Box Hill, we offer personalized guidance to navigate the unique real estate landscape of this emerging community.",
  },
];

export default async function Page() {
  const agents = await getAgents();
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/*
       * The real about-us banner (public/images/about/banner.jpg) — confirmed
       * via curl content-length against the live 41765566073.jpg that our
       * local copy IS the actual full-resolution source (native 1903x247),
       * not a resized thumbnail; no larger version exists anywhere
       * (old_laravel_site only has smaller "thumb-"/"grid-" derivatives).
       * Box height here matches the homepage hero's (~440px at lg) per an
       * explicit request to prioritize matching height over avoiding the
       * resulting ~1.8x upscale — this is the one image on the site that's
       * deliberately allowed to soften slightly for that reason.
       */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/about/banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />

        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / About Us
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">About Us</h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {/* Heading spans the full container width, above the two-column
            body — at the same text-4xl sm:text-5xl size as "Our Service
            Area" below, it wraps to an orphaned second line if squeezed into
            just the left half of the grid (measured: 2 lines at 48px in a
            ~556px column). Full width gives it room for one line while
            keeping the two headings visually consistent. */}
        <h2 className="font-display text-4xl sm:text-5xl text-brand-navy">
          About <span className="text-brand-gold-dark">Home7 Real Estate</span>
        </h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-lg text-slate-600 leading-relaxed">{ABOUT_PARAGRAPHS[0]}</p>
          </div>
          <div className="relative aspect-3/2 rounded-xl overflow-hidden group">
            <Image
              src="/images/about/section-1.jpg"
              alt="Home7 Real Estate"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <a
              href="https://www.youtube.com/watch?v=9MwMwi_Hx0A&ab_channel=Home7RealEstate"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch Home7 Real Estate on YouTube"
              className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors"
            >
              {/* Two rings pulsing outward on a staggered delay — the custom
                  slower .animate-ripple keyframe (globals.css, scaling up to
                  2.6x), not Tailwind's built-in animate-ping, which reads as
                  too fast/jerky and too small at this size. Delay is half
                  the animation's duration so the two rings stay evenly
                  spaced. Navy button + teal icon, matching the site's own
                  nav gradient colors, rather than the plain white/navy
                  button used before. */}
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-white/15 animate-ripple" />
                <span className="absolute inset-0 rounded-full bg-slate-200/60 animate-ripple [animation-delay:1.4s]" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy shadow-lg group-hover:scale-110 transition-transform">
                  <PlayIcon size={26} className="ml-[-5.4px] text-brand-teal" />
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="relative aspect-3/2 rounded-xl overflow-hidden order-2 lg:order-1">
              <Image
                src="/images/about/section-2.jpg"
                alt="Home7 Real Estate team"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-lg text-slate-600 leading-relaxed">{ABOUT_PARAGRAPHS[1]}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-lg text-slate-600 leading-relaxed">{ABOUT_PARAGRAPHS[2]}</p>
          </div>
          <div className="relative aspect-4/3 rounded-xl overflow-hidden">
            <Image
              src="/images/about/section-3.jpg"
              alt="Home7 Real Estate"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-brand-gold-dark font-semibold">
              Where we work
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl text-brand-navy">
              Our Service Area
            </h2>
          </div>
          <div className="mt-10">
            <ServiceAreaTabs areas={SERVICE_AREAS} />
          </div>
        </div>
      </section>

      <TeamGrid agents={agents} />
    </div>
  );
}
