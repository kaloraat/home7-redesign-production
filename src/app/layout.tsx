import type { Metadata } from "next";
import { headers } from "next/headers";
import { Rethink_Sans, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { COMPANY, SITE_NAME, SITE_URL } from "@/lib/constants";
import { isCanonicalHost } from "@/lib/canonicalHost";
import { auth } from "@/auth";
import PublicChrome from "@/components/PublicChrome";
import { PhoneIcon, MobileIcon, PinIcon, EmailIcon, FacebookIcon, LinkedInIcon } from "@/components/icons";

// Rethink Sans (titles) + Inter (body) — matching upmind.com's exact pairing,
// which is what the user pointed to as the reference look. Rethink Sans
// ships as a variable font on Google Fonts (no fixed weight array needed);
// its boldest cut is 800, not 900, so .font-display's font-weight in
// globals.css moved back down from 900 (Lato's ceiling) to 800.
const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

// Inter for body copy (paragraphs, card text, etc.) — same family upmind.com
// uses for its own paragraph text. Variable font, so no `weight` array
// needed; any weight a component requests is available from this one loader.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const DEFAULT_TITLE = "The Best Real Estate in Liverpool, New South Wales";
const DEFAULT_DESCRIPTION =
  "Find the best real estate in Liverpool, NSW. Explore top properties for sale or rent today.";

// Dynamic (not a static `export const metadata`) specifically so this can
// read the request's Host header — same reasoning and same host-check
// logic as robots.ts's own `isCanonicalHost` check, applied here too as a
// second, independent layer: robots.txt's disallow only asks crawlers not
// to CRAWL a non-canonical host (a Vercel preview URL, a staging deploy),
// it doesn't guarantee they won't still INDEX a URL they discover some
// other way (e.g. a link posted somewhere Google can see). A `noindex`
// meta tag is the actual definitive instruction Google respects for
// exclusion from the index — this adds it site-wide (via inheritance; no
// public page sets its own `robots` to override it, confirmed via a
// repo-wide search first) whenever the request isn't arriving on the real
// production domain, so a `*.vercel.app` preview used for internal
// testing can't end up indexed even if robots.txt alone gets bypassed.
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "";
  const canonical = isCanonicalHost(host);

  return {
    metadataBase: new URL(SITE_URL),
    ...(!canonical && { robots: { index: false, follow: false } }),
    title: {
      // Matches the live site's indexed title verbatim ("The Best Real
      // Estate in Liverpool, New South Wales") rather than a from-scratch
      // rewrite — preserving ranking equity while the rest of the
      // homepage is redesigned.
      default: DEFAULT_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    // Root-level fallback canonical (resolves to SITE_URL via metadataBase
    // above) — every real page route now sets its own via its own metadata
    // export, so in practice this only ever applies to the homepage itself.
    alternates: { canonical: "/" },
    // Previously unset — every shared link (Facebook, LinkedIn, Slack,
    // iMessage) rendered with no image and a bare preview. Root-level, so
    // it's the fallback for every page; individual pages can still
    // override title/description via their own metadata export.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_AU",
      url: SITE_URL,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: "/images/logo-footer.png",
          width: 333,
          height: 309,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      // "summary" (small thumbnail), not "summary_large_image" — the only
      // image available right now is the near-square logo, not a wide
      // banner; summary_large_image would crop/stretch it. Swap to a
      // dedicated 1200x630 branded image later and switch this to
      // summary_large_image.
      card: "summary",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: ["/images/logo-footer.png"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Whether to show SiteNav's admin quick-access nub — checked here
  // (Server Component, so this never ships an extra client-side session
  // fetch just for a button) and threaded down through PublicChrome into
  // SiteNav. Temporary: hardcoded to this one email rather than a real
  // role check, until the planned admin/author role system exists (the
  // current Admin.role enum is just "owner"/"editor" — neither maps to
  // "should see this button" yet). Swap this for a real role check
  // (session?.user?.role === "admin" or similar) once that's built.
  const session = await auth();
  const isAdmin = session?.user?.email === "admin@home7.com.au";

  return (
    <html lang="en" className={`${rethinkSans.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased text-foreground font-sans">
        {/* Top loading progress bar (YouTube-style) — without it, a click
            on a dynamic route gives no feedback until the new page's HTML
            actually arrives, which reads as "did my click even register?"
            on anything slower than instant. nextjs-toploader is NProgress
            adapted for the App Router specifically — it starts on Link
            clicks/programmatic navigation and history changes (things
            next/navigation doesn't expose router events for directly the
            way the old Pages Router did) and finishes once the new route
            has rendered. Self-contained — no provider wrapping needed. */}
        <NextTopLoader color="#c18847" height={3} showSpinner={false} />
        {/* SiteNav/main/footer all live inside PublicChrome now — it skips
            all three entirely on /admin routes, which have their own
            separate shell (AdminSidebar). See that component for why. */}
        <PublicChrome
          isAdmin={isAdmin}
          footer={
            <footer className="relative overflow-hidden text-slate-300 mt-16">
              {/*
               * Semi-transparent background photo, matching the live site's
               * footer treatment — a navy tint over the image rather than a
               * flat color, so the footer isn't just a plain dark bar.
               */}
              <Image
                src="/images/footer-bg.jpg"
                alt=""
                fill
                aria-hidden="true"
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-brand-navy/85" />

              {/*
               * Four columns, matching the live site's footer.blade.php exactly
               * (fetched from the rendered production HTML, since this content
               * is admin-editable in their DB, not in the Laravel codebase
               * itself): About/social, Quick Link, Properties, Office. "Office"
               * (not "Corporate Office", which is what production actually
               * says) is a deliberate earlier instruction, kept as an override.
               */}
              <div className="relative mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-lg">
                <div>
                  <Image
                    src="/images/logo-footer.png"
                    alt={SITE_NAME}
                    width={140}
                    height={130}
                    className="h-16 w-auto"
                  />
                  <p className="mt-3"><strong className="text-white">Your Trust is our achievement</strong></p>
                  <p className="mt-1">We help ensure that we are best placed to serve our customers and deliver on their needs.</p>
                  <div className="mt-4 flex items-center gap-3">
                    {/* Was a numeric facebook.com/profile.php?id=... URL plus
                        an individual agent's own personal LinkedIn — wrong
                        both as a general site-wide footer link and for
                        consistency with COMPANY.facebook/linkedin (constants.ts,
                        confirmed against the Laravel export's team_members
                        data) used everywhere else this now appears. */}
                    <a
                      href={COMPANY.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Home7 Facebook Profile"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
                    >
                      <FacebookIcon />
                    </a>
                    <a
                      href={COMPANY.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Home7 LinkedIn Profile"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
                    >
                      <LinkedInIcon />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Quick Link</p>
                  <ul className="space-y-1">
                    <li><Link href="/" className="hover:text-brand-gold">Home</Link></li>
                    <li><Link href="/about-us" className="hover:text-brand-gold">About Home7</Link></li>
                    <li><Link href="/buyers-advisory" className="hover:text-brand-gold">Buyers Advisory</Link></li>
                    <li><Link href="/agents" className="hover:text-brand-gold">Our Team</Link></li>
                    <li><Link href="/privacy-policy" className="hover:text-brand-gold">Privacy Policy</Link></li>
                    <li><Link href="/contact" className="hover:text-brand-gold">Contact</Link></li>
                    <li><Link href="/sitemap.xml" className="hover:text-brand-gold">Sitemap</Link></li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Properties</p>
                  <ul className="space-y-1">
                    <li><Link href="/properties-for-rent" className="hover:text-brand-gold">Properties for Rent</Link></li>
                    <li><Link href="/properties-for-sale" className="hover:text-brand-gold">Properties for Sale</Link></li>
                    <li><Link href="/sold-properties" className="hover:text-brand-gold">Sold Properties</Link></li>
                    <li><Link href="/properties" className="hover:text-brand-gold">All Properties</Link></li>
                    <li><Link href="/free-market-appraisal" className="hover:text-brand-gold">Get Your Property Appraisal</Link></li>
                    <li><Link href="/other-properties" className="hover:text-brand-gold">Other Properties</Link></li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Office</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <PinIcon size={14} className="shrink-0 mt-0.5 text-brand-gold" />
                      <span>{COMPANY.address}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PhoneIcon size={14} className="shrink-0 text-brand-gold" />
                      <span>{COMPANY.phone}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MobileIcon size={14} className="shrink-0 text-brand-gold" />
                      <span>{COMPANY.mobileSecondary}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MobileIcon size={14} className="shrink-0 text-brand-gold" />
                      <span>{COMPANY.mobile}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <EmailIcon size={14} className="shrink-0 text-brand-gold" />
                      <span>{COMPANY.email}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="relative text-center text-xs text-slate-400 border-t border-white/10 py-4">
                © {new Date().getFullYear()} All rights reserved by {SITE_NAME}.
              </p>
            </footer>
          }
        >
          {children}
        </PublicChrome>
      </body>
    </html>
  );
}
