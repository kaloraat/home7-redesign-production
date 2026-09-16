import Image from "next/image";
import Link from "next/link";
import { getPropertiesByType, getFeaturedProperties, getPublishedContent, getAgents } from "@/lib/queries";
import HeroSearch from "@/components/HeroSearch";
import HeroQuickLinks from "@/components/HeroQuickLinks";
import CTAButtons from "@/components/CTAButtons";
import ListingsSection from "@/components/ListingsSection";
import PropertyCard from "@/components/PropertyCard";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";
import TrustBar from "@/components/TrustBar";
import SuburbShowcase from "@/components/SuburbShowcase";
import WhyHome7 from "@/components/WhyHome7";
import BrandStory from "@/components/BrandStory";
import TeamGrid from "@/components/TeamGrid";
import Testimonials from "@/components/Testimonials";
import { COMPANY, SITE_NAME, SITE_URL, TARGET_SUBURBS, GOOGLE_RATING } from "@/lib/constants";

// JSON-LD structured data for the homepage — RealEstateAgent (a LocalBusiness
// subtype) is the single highest-leverage addition for the project's stated
// #1 goal (PROJECT_BRIEF.md): ranking in the local Google map pack, not
// generic "real estate" search. areaServed lists every target suburb
// explicitly rather than just the home-base address, since that's the actual
// local-SEO lever. WebSite is included without a SearchAction — there's no
// real query-based search endpoint yet (HeroSearch routes to fixed category
// pages, not a `?q=` search), and a SearchAction pointing at something that
// doesn't work would be worse than omitting it.
function buildJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: SITE_NAME,
      image: `${SITE_URL}/images/logo-footer.png`,
      url: SITE_URL,
      telephone: COMPANY.phone,
      email: COMPANY.email,
      address: {
        "@type": "PostalAddress",
        ...COMPANY.addressParts,
      },
      areaServed: TARGET_SUBURBS.map((suburb) => ({
        "@type": "City",
        name: suburb,
      })),
      // Was a numeric facebook.com/profile.php?id=... URL plus Mohammed's
      // own personal LinkedIn — the wrong kind of link for the BUSINESS's
      // own schema entity either way (a personal profile isn't "the same
      // as" the company), and inconsistent with COMPANY.facebook/linkedin
      // below anyway. See constants.ts for how these were confirmed.
      sameAs: [COMPANY.facebook, COMPANY.linkedin],
      // Real, sourced figures (Testimonials.tsx displays the same
      // GOOGLE_RATING to actual visitors on this same page) — not
      // fabricated, which matters: Google's structured-data guidelines
      // require review/rating markup to reflect genuine reviews visible
      // on the page, and this is one of the few schema types that can
      // produce an actual visible star-rating rich result in search
      // results, unlike RealEstateListing itself.
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: GOOGLE_RATING.value,
        reviewCount: GOOGLE_RATING.count,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  ];
}

export default async function Home() {
  const [featured, forSale, forRent, sold, leased, posts, agents] = await Promise.all([
    getFeaturedProperties(6),
    getPropertiesByType("sale", 6),
    getPropertiesByType("rent", 6),
    getPropertiesByType("sold", 6),
    getPropertiesByType("leased", 6),
    getPublishedContent("blog", 4),
    getAgents(),
  ]);

  const jsonLd = buildJsonLd();

  return (
    <div>
      {jsonLd.map((entry) => (
        <script
          key={entry["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      {/*
       * Heights kept at or below the source image's native 464px height
       * (see hero-banner.webp) so object-cover only ever downscales, never
       * upscales — upscaling a 464px-tall source is what was causing the
       * soft/blurry hero and the over-cropped, "zoomed in" framing.
       *
       * The negative top margin + matching height increase (base heights
       * 380/420px become 437/453px) pulls this section up to slide
       * underneath SiteNav's mobile-only link bar — transparent-ish (50%
       * black) so the hero photo shows through behind it rather than blank
       * space — below the lg breakpoint, where that bar actually renders
       * (lg:hidden on it; the desktop nav sits inline in Row 1 instead, so
       * there's nothing to overlap at lg and up — height/margin reset to
       * the original 440px/0 there). Height grows by the same amount the
       * margin subtracts, so the *bottom* edge (and everything below the
       * hero) doesn't move, only the top extends further up behind the
       * header. The extra step at 430px matches the exact width where the
       * link bar stops wrapping to two lines (57px tall below that, 29px
       * from 430px, 33px from 640px) — measured from the rendered header,
       * not guessed.
       *
       * The content wrapper below is bottom-anchored at the *original*
       * (pre-extension) heights rather than centered in the taller box —
       * centering in the taller box shifts content up by half the added
       * height, which at the 375px tier was enough to collide "Contact Us"
       * (the link bar's wrapped second line) with the eyebrow text.
       */}
      <section className="relative overflow-hidden h-109.25 -mt-14.25 min-[430px]:h-102.25 min-[430px]:-mt-7.25 sm:h-113.25 sm:-mt-8.25 lg:h-110 lg:mt-0">
        <Image
          src="/images/hero-banner.webp"
          alt="Home7 Real Estate — real estate agent in Liverpool, NSW"
          fill
          priority
          // The box is height-constrained (short and wide), not
          // width-constrained — Next's default 100vw sizing picks a
          // candidate scaled to viewport *width*, which for this ratio ends
          // up shorter than the box needs, forcing a second, worse upscale
          // on top of object-cover's. Requesting near the source's true
          // 2272px width keeps it at (or as close as possible to) native
          // resolution regardless of viewport.
          sizes="2272px"
          className="object-cover"
        />
        {/*
         * A flat navy tint plus a heavy top-to-bottom gradient here used to
         * compound to ~90% opacity at the bottom, muddying the photo's own
         * warm/bright tones into an overly blue, dark wash — the live site
         * barely tints the image at all. Kept light, but with more of a
         * lift than before now that the text also carries its own shadow
         * (.text-shadow-hero below) rather than relying on the overlay alone.
         */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/45" />

        {/* pt-16 below `md` (768px) — the mobile nav link bar sits
            directly above this vertically-centered content block below
            that width, and without this the eyebrow text's top edge
            touches it. Checked empirically across the full range
            (360–1023px), not just the one width in the original report —
            the touching wasn't confined to a narrow "small screen" band
            at all, it was present continuously from 360px up to around
            640-700px before naturally clearing on its own as the mobile
            link bar's own real height shrinks at wider mobile/tablet
            widths; `md` was picked as a cutoff with real margin past
            that natural clearing point rather than cutting it exactly at
            the edge. Padding on the CONTAINER, not margin on the first
            child (tried that first) — with justify-center, a child's own
            top margin gets folded into the centered content and roughly
            half-cancelled by the algorithm, so it barely moved anything;
            padding on the container itself isn't part of what gets
            centered, so it reliably shifts the whole block down by
            close to the full amount instead. */}
        <div className="absolute inset-x-0 bottom-0 h-95 sm:h-105 lg:h-110 mx-auto max-w-6xl px-4 pt-16 md:pt-0 flex flex-col items-center justify-center text-center text-white">
          <p className="text-shadow-hero text-brand-gold text-xs sm:text-sm uppercase tracking-[0.2em] font-medium">
            Liverpool &amp; South West Sydney
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-white">
            <span className="text-brand-gold">Home7</span> Real Estate
          </h1>
          <p className="text-shadow-hero mt-3 text-slate-200 max-w-2xl text-lg">
            Your local property experts across {TARGET_SUBURBS.slice(0, 4).join(", ")} and
            beyond — buying, selling, renting and property management.
          </p>

          <div className="mt-8 w-full">
            <HeroSearch />
          </div>

          <div className="mt-6">
            <HeroQuickLinks />
          </div>
        </div>
      </section>

      <CTAButtons />

      <TrustBar />

      {/* Only rendered when at least one listing is checked "Feature on home
          page" in the admin — this is a hand-picked, admin-curated set
          (any listing type mixed together), not a category page, so unlike
          the For Sale/Rent/Sold/Leased sections below it there's no single
          "View All" destination to link to and no empty-state message when
          there isn't one yet. Placed above those sections so a featured
          pick is genuinely the first listing content a visitor sees, ahead
          of the latest-4-per-type sections. */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:pt-20">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">Featured Properties</h2>
          </div>
          <div className="mt-8">
            <ResponsiveCardGrid
              items={featured}
              renderItem={(p) => <PropertyCard key={String(p._id)} property={p} />}
            />
          </div>
        </section>
      )}

      {/* Plain 3-column-max grid (no wide4up) — these sections fetch exactly
          6 items each. wide4up's 2xl 4th column would trim via
          floor(6/4)*4 = 4, showing FEWER cards at the widest tier than the
          3-column tier's floor(6/3)*3 = 6 already shows in full — a visible
          regression, not an improvement, at ultra-wide widths. Same
          reasoning ResponsiveCardGrid's own doc comment already gives for
          not using wide4up on Testimonials' 6 items. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20 space-y-16">
        <ListingsSection
          title="For Sale"
          properties={forSale}
          viewAllLabel="View All Properties For Sale"
          viewAllHref="/properties-for-sale"
          emptyMessage="No listings yet — this fills in once the property data migration runs."
        />
        <ListingsSection
          title="For Rent"
          properties={forRent}
          viewAllLabel="View All Properties For Rent"
          viewAllHref="/properties-for-rent"
          emptyMessage="No listings yet — this fills in once the property data migration runs."
        />
        <ListingsSection
          title="Sold"
          properties={sold}
          viewAllLabel="View All Sold Properties"
          viewAllHref="/sold-properties"
          emptyMessage="No sold listings yet — this fills in once the property data migration runs."
        />
        <ListingsSection
          title="Leased"
          properties={leased}
          viewAllLabel="View All Leased Properties"
          viewAllHref="/leased-properties"
          emptyMessage="No leased listings yet — this fills in once the property data migration runs."
        />
      </section>

      <SuburbShowcase />
      <WhyHome7 />
      <BrandStory />
      <TeamGrid agents={agents} />
      <Testimonials />

      <section className="mx-auto max-w-6xl 2xl:max-w-384 px-4 py-16 sm:py-20">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="font-display text-2xl sm:text-3xl text-brand-navy">Market Insights</h2>
        </div>
        {posts.length === 0 ? (
          <p className="mt-8 text-slate-500 text-lg">
            No posts yet — this fills in once the blog content migration runs.
          </p>
        ) : (
          <div className="mt-8">
            <ResponsiveCardGrid
              items={posts}
              wide4up
              renderItem={(post) => (
                <Link
                  key={String(post._id)}
                  href={`/blog/${post.slug}`}
                  className="block rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(min-width: 900px) 25vw, (min-width: 750px) 33vw, (min-width: 600px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 12 5-5 3 3 4-5 5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="8" cy="9" r="1.4" fill="currentColor" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-display text-xl text-brand-navy">{post.title}</p>
                    {post.excerpt && (
                      <p className="mt-2 text-lg text-slate-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              )}
            />
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand-navy px-8 py-3 text-lg font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
          >
            View All Articles
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="bg-brand-navy">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-white">
            Ready to make your next move?
          </h2>
          <p className="mt-2 text-slate-300 text-lg">
            Get a free, no-obligation appraisal from Liverpool&apos;s local property experts.
          </p>
          <Link
            href="/free-market-appraisal"
            className="mt-6 inline-block bg-brand-gold text-brand-navy rounded px-8 py-3 text-lg font-semibold hover:brightness-95 transition"
          >
            Get Your Free Appraisal
          </Link>
        </div>
      </section>
    </div>
  );
}
