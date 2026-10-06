import type { Metadata } from "next";

// Ad landing pages must not compete with the main site in organic search.
// Do NOT block /lp in robots.txt: Google's AdsBot has to crawl these.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Minimal chrome-free layout: PublicChrome skips the site nav/footer for
 * /lp paths, so this is the whole page. Bottom padding keeps the mobile
 * sticky call bar from covering the footer. Tracking (Ads tag + gclid
 * capture) comes from the root layout, site-wide.
 */
export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    // Tailwind v4's reset leaves <button> with the default arrow cursor, so
    // every enabled button on /lp gets the pointer hand here in one place.
    <div
      className="bg-white pb-16 text-foreground md:pb-0 [scroll-behavior:smooth] [&_button:not(:disabled)]:cursor-pointer">
      {children}
    </div>
  );
}
