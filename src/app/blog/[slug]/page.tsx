import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getContentBySlug } from "@/lib/queries";
import { normalizeLegacyHtml, stripDuplicateTitle } from "@/lib/legacyContent";
import { RICH_TEXT_CLASSNAME } from "@/lib/richTextClassName";
import { SITE_URL, SITE_NAME, BLOG_CONTACT_FORM_HEADING, BLOG_CONTACT_FORM_INTRO } from "@/lib/constants";
import ContactForm from "@/components/ContactForm";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogContactFab from "@/components/blog/BlogContactFab";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getContentBySlug(slug, "blog");
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // See property/[slug]/page.tsx's generateMetadata for why this can't
    // just be title/image — a page-level `openGraph` replaces the root
    // layout's entirely rather than merging into it.
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

const END_OF_ARTICLE_ID = "blog-end-of-article";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getContentBySlug(slug, "blog");
  if (!post) notFound();

  // getContentBySlug() falls back to a case-insensitive match — if a
  // mixed-case URL is what actually matched, canonicalize rather than
  // rendering the same post live at two URLs.
  if (post.slug !== slug) {
    permanentRedirect(`/blog/${post.slug}`);
  }

  // This legacy content (migrated from the old Laravel `blogs` table) has
  // two recurring issues: some posts repeat the title as their own leading
  // heading inside bodyHtml (shown twice against the page's own <h1>), and
  // almost every paragraph arrived wrapped in a Word/Google-Docs-style
  // <span style="font-size:..."> that silently overrides the page's own
  // text-lg styling. Both are cleaned up server-side before rendering — see
  // lib/legacyContent.ts for exactly what each does and why.
  const cleanedBody = normalizeLegacyHtml(stripDuplicateTitle(post.bodyHtml, post.title));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  // Missing before — no datePublished/author meant this content wasn't
  // eligible for article rich results at all. dateModified is included
  // since updatedAt always exists (set on create, same as publishedAt in
  // practice); publishedAt is technically optional on the model but always
  // set alongside status: "published" (see content.actions.ts), so a post
  // that reaches this page always has one.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    // No background here — the site's own light-grey textured background
    // (globals.css, on <body>) already shows through everywhere else;
    // this used to paint a flat bg-slate-100 over it, hiding it on this
    // page specifically.
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* max-w-7xl, matching the property detail page's overall width
          (was max-w-6xl) — the 128px gained (7xl - 6xl = 1280px - 1152px)
          goes entirely to the sidebar column below, not the article
          column, per an explicit request to widen the contact form. */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-gold-dark">Home</Link> /{" "}
          <Link href="/blog" className="hover:text-brand-gold-dark">Blog</Link> / {post.title}
        </p>

        {/* Main article column + sticky contact sidebar (desktop only — the
            sidebar's `sticky top-20` needs no JS, it just floats under
            SiteNav's fixed header as the reader scrolls; the equivalent
            mobile behavior is the floating BlogContactFab below). Same
            grid-cols-3 (2fr article / 1fr sidebar) as the property detail
            page's own two-column layout — was a fixed 508px sidebar
            column, which read noticeably wider than property's sidebar
            once both pages sit in the same max-w-7xl container; this
            makes the two actually match instead of just coincidentally
            being close. */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <article className="lg:col-span-2 text-xl font-medium text-slate-600">
            {post.coverImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 mb-6">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <h1 className="font-display text-3xl sm:text-4xl text-brand-navy">{post.title}</h1>
            {/* RICH_TEXT_CLASSNAME applies here, not on <article> above, so
                its heading styles only ever reach headings inside the saved
                HTML — never the page's own <h1> just above. See
                lib/richTextClassName.ts for the full rule set, and
                lib/legacyContent.ts for why legacy content needed its own
                inline margins stripped for the uniform mb-8 rhythm to
                actually take effect. */}
            <div
              className={`mt-6 ${RICH_TEXT_CLASSNAME}`}
              dangerouslySetInnerHTML={{ __html: cleanedBody }}
            />
          </article>

          {/* max-h + overflow-y-auto: without a height cap, a sticky
              sidebar taller than the viewport (a short intro plus a
              lengthy article, or just a shorter screen) pins at top-20 and
              its own overflow runs off the bottom with no way to reach it
              — the submit button ends up reachable only once the reader
              scrolls all the way down the whole article, since that's the
              only thing that unsticks it. Same fix as the property page's
              sidebar, which has the identical sticky-taller-than-viewport
              problem. */}
          <aside className="hidden lg:block sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <BlogSidebar currentSlug={post.slug} postTitle={post.title} />
          </aside>
        </div>

        {/* Mobile-only: the form also appears inline at the end of the
            article (desktop readers already have it in the sidebar the
            whole time). BlogContactFab watches this element and hides its
            floating button once it scrolls into view. */}
        <div id={END_OF_ARTICLE_ID} className="lg:hidden mt-8 max-w-3xl">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ContactForm
              leadType="blog"
              heading={BLOG_CONTACT_FORM_HEADING}
              intro={BLOG_CONTACT_FORM_INTRO}
              fallbackMessage={`Reader enquiry from blog post: ${post.title}`}
            />
          </div>
        </div>
      </div>

      <BlogContactFab postTitle={post.title} endOfArticleId={END_OF_ARTICLE_ID} />
    </div>
  );
}
