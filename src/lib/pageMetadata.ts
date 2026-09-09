import { SITE_URL } from "./constants";

/**
 * Shared openGraph/twitter block for every static page (About, Contact,
 * the listing-type pages, etc). Without this, a page that doesn't set its
 * own `openGraph` inherits the root layout's ENTIRE generic block wholesale
 * — Next.js metadata doesn't merge these objects key-by-key across
 * layout→page, so omitting one isn't "inherit title, keep my own image",
 * it's "inherit everything, including a title that isn't this page's."
 * Every static page was doing exactly that before this existed — shared
 * externally, every one of them showed the homepage's title/description.
 *
 * `path` is the page's own path (e.g. "/about-us") — used to build both
 * `og:url` and the canonical, so a page only ever has to state its path
 * once alongside its title/description.
 */
export function pageMetadata(title: string, description: string, path: string) {
  const url = `${SITE_URL}${path}`;
  return {
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      url,
      title,
      description,
    },
    twitter: {
      card: "summary" as const,
      title,
      description,
    },
  };
}
