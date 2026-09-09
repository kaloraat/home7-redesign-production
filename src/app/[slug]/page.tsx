import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { getContentBySlug, getRedirect } from "@/lib/queries";
import { normalizeLegacyHtml, stripDuplicateTitle } from "@/lib/legacyContent";
import { SITE_URL, BLOG_CONTACT_FORM_HEADING, BLOG_CONTACT_FORM_INTRO } from "@/lib/constants";
import ContactForm from "@/components/ContactForm";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogContactFab from "@/components/blog/BlogContactFab";

/**
 * Catch-all for the site's root-level SEO landing pages (no /blog/ prefix —
 * see the URL inventory notes). Next.js resolves static route folders like
 * /about-us before falling back to this dynamic segment, so this only ever
 * fires for paths that don't match a real static route.
 *
 * Resolution order:
 * 1. A genuine root-level page (Content.urlPath === "root") — this is where
 *    the site's `other_blogs` table data lands after migration; it's the
 *    normal case for most of these URLs.
 * 2. An explicit Redirect row (legacy mixed-case slugs, one-off aliases).
 * 3. A blog post with this exact slug (Content.urlPath === "blog") — a
 *    fallback for any slug that has a /blog/{slug} article but no matching
 *    other_blogs row. The old Laravel site did sometimes link the same
 *    article at both /blog/{slug} and bare /{slug} without a real root
 *    page behind it; this 301s to the canonical /blog/{slug} URL so it
 *    doesn't 404 rather than requiring a hand-maintained list.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentBySlug(slug, "root");
  if (!page) return {};

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.excerpt;
  const url = `${SITE_URL}/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, images: page.coverImage ? [{ url: page.coverImage }] : undefined },
    twitter: { card: page.coverImage ? "summary_large_image" : "summary", title, description, images: page.coverImage ? [page.coverImage] : undefined },
  };
}

const END_OF_ARTICLE_ID = "root-page-end-of-article";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getContentBySlug(slug, "root");
  if (page) {
    // getContentBySlug() falls back to a case-insensitive match — if a
    // mixed-case URL is what actually matched, canonicalize rather than
    // rendering the same page live at two URLs.
    if (page.slug !== slug) {
      permanentRedirect(`/${page.slug}`);
    }

    // Same legacy-content cleanup as blog/[slug]/page.tsx — this content
    // came from the sibling `other_blogs` table via the same Word/Google
    // Docs paste pipeline, so it has the identical duplicate-title,
    // inconsistent-spacing, and undersized-bold-text issues. See
    // lib/legacyContent.ts.
    const cleanedBody = normalizeLegacyHtml(stripDuplicateTitle(page.bodyHtml, page.title));

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: page.title, item: `${SITE_URL}/${page.slug}` },
      ],
    };

    return (
      // No background here — the site's own light-grey textured background
      // (globals.css, on <body>) already shows through, matching every
      // other page including blog/[slug]/page.tsx.
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-gold-dark">Home</Link> / {page.title}
          </p>

          {/* Same 2-column layout as blog/[slug]/page.tsx — see that page's
              comment for the sticky-sidebar/mobile-FAB writeup. This page
              (the "other blog" root articles, ~half the site's posts) never
              had this sidebar at all before, which is exactly why the
              contact form seemed to show up on only *some* posts: every
              /blog/{slug} article had it, every bare /{slug} one didn't.
              max-w-7xl + grid-cols-3 (was max-w-6xl + a fixed 380px sidebar
              column) — matches blog/[slug]/page.tsx exactly, which had
              already picked up this same width/grid change but this page
              never did, so the two blog-post page types had quietly
              drifted apart again despite sharing BlogSidebar. */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <article className="lg:col-span-2 text-xl font-medium text-slate-600">
              {page.coverImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 mb-6">
                  <Image
                    src={page.coverImage}
                    alt={page.title}
                    fill
                    sizes="(min-width: 1024px) 720px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <h1 className="font-display text-3xl sm:text-4xl text-brand-navy">{page.title}</h1>
              <div
                className="mt-6 leading-[1.85] [&_:is(p,li,h1,h2,h3,h4,h5,h6)]:mb-8"
                dangerouslySetInnerHTML={{ __html: cleanedBody }}
              />
            </article>

            {/* max-h + overflow-y-auto — same sticky-taller-than-viewport
                fix as blog/[slug]/page.tsx's identical sidebar (see that
                page's comment): without it, the submit button is only
                reachable after scrolling the entire article. */}
            <aside className="hidden lg:block sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <BlogSidebar currentSlug={page.slug} postTitle={page.title} />
            </aside>
          </div>

          <div id={END_OF_ARTICLE_ID} className="lg:hidden mt-8 max-w-3xl">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <ContactForm
                leadType="blog"
                heading={BLOG_CONTACT_FORM_HEADING}
                intro={BLOG_CONTACT_FORM_INTRO}
                fallbackMessage={`Reader enquiry from post: ${page.title}`}
              />
            </div>
          </div>
        </div>

        <BlogContactFab postTitle={page.title} endOfArticleId={END_OF_ARTICLE_ID} />
      </div>
    );
  }

  // This is a backup layer, not the primary redirect path — proxy.ts
  // matches against the same Redirect table before a request ever reaches
  // this page, so normally a registered redirect never gets this far. This
  // exists for the ~60s window right after a redirect is added, while
  // proxy.ts's in-memory cache is still stale. next/navigation's redirect()
  // always sends a 307 regardless of statusCode, which would silently
  // downgrade an admin-configured 301 to a temporary redirect for anyone
  // who hits this fallback during that window — permanentRedirect() (308)
  // for a stored 301, matching proxy.ts's own use of the real status code.
  const redirectEntry = await getRedirect(`/${slug}`);
  if (redirectEntry) {
    if (redirectEntry.statusCode === 301) permanentRedirect(redirectEntry.toPath);
    redirect(redirectEntry.toPath);
  }

  // Duplicate-URL fallback: same article also lived at the site root on the
  // old Laravel site. Canonicalize to /blog/{slug} rather than serving the
  // same content at two URLs — permanent, since this is a genuine one-way
  // canonicalization, not a temporary redirect.
  const blogPost = await getContentBySlug(slug, "blog");
  if (blogPost) {
    permanentRedirect(`/blog/${slug}`);
  }

  notFound();
}
