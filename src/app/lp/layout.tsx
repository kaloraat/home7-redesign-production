import type { Metadata } from "next";
import { headers } from "next/headers";
import { isCanonicalHost } from "@/lib/canonicalHost";
import { ClickIdCapture } from "@/components/lp/ClickIdCapture";
import TrackingScripts from "@/components/lp/TrackingScripts";

// Ad landing pages must not compete with the main site in organic search.
// Do NOT block /lp in robots.txt: Google's AdsBot has to crawl these.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Minimal chrome-free layout: PublicChrome skips the site nav/footer for
 * /lp paths, so this is the whole page. Bottom padding keeps the mobile
 * sticky call bar from covering the footer.
 */
export default async function LpLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? "";
  return (
    // Tailwind v4's reset leaves <button> with the default arrow cursor, so
    // every enabled button on /lp gets the pointer hand here in one place.
    <div
      className="bg-white pb-16 text-foreground md:pb-0 [scroll-behavior:smooth] [&_button:not(:disabled)]:cursor-pointer">
      <TrackingScripts enabled={isCanonicalHost(host)} />
      <ClickIdCapture />
      {children}
    </div>
  );
}
