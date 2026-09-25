"use client";

import { usePathname } from "next/navigation";
import SiteNav from "@/components/SiteNav";

/**
 * Wraps the public site's shared chrome (SiteNav header + the page's own
 * <main> wrapper + the site footer) so all three are skipped entirely on
 * /admin routes. The admin dashboard is a separate, app-like experience
 * with its own header/sidebar/nav (AdminSidebar) — it was never meant to
 * sit inside the public site's header/footer, and concretely, having a
 * real ~72px+ public header rendered ABOVE admin's own h-screen-tall shell
 * pushed part of that shell below the fold, requiring a page-level scroll
 * to reach it — which dragged the admin sidebar along with it, breaking
 * the "sidebar stays fixed while only the content scrolls" behavior the
 * admin shell is built around (worse on a small screen, where SiteNav's
 * extra mobile link row makes the header taller still).
 *
 * A client-side pathname check rather than Next's "multiple root layouts"
 * (each route group gets its own <html>/<body>) — that's the more
 * "correct" long-term structure, but requires moving every existing
 * public route into its own route-group folder, a large, unrelated
 * file-moving refactor. This is a minimal, contained fix for the actual
 * problem: admin gets `children` completely unwrapped (its own nested
 * layout provides every bit of chrome it needs), everything else gets
 * the same header/main/footer structure as before, unchanged.
 */
export function PublicChrome({
  children,
  footer,
  isAdmin,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  // /lp/* are the Google Ads landing pages: single-goal pages with their own
  // minimal header/footer (see app/lp/layout.tsx), so no site nav, no exits.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/lp/")) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteNav isAdmin={isAdmin} />
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}

export default PublicChrome;
