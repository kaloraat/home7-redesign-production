import Image from "next/image";
import Link from "next/link";
import { getLatestBlogPosts } from "@/lib/queries";
import { BLOG_CONTACT_FORM_HEADING, BLOG_CONTACT_FORM_INTRO } from "@/lib/constants";
import ContactForm from "@/components/ContactForm";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Desktop sidebar for an individual article — the contact form plus a
 * "Recent Posts" widget beneath it (reference: home7.com.au/real-estate's
 * own "Recent Posts" widget, improved on here: rounded thumbnails, a
 * multi-line title instead of a hard single-line truncation, and the whole
 * row as one soft hover-highlighted pill rather than plain link text).
 *
 * Shared by both blog/[slug]/page.tsx and the root [slug]/page.tsx
 * catch-all — previously each page hand-built its own sidebar, and the
 * root one never got one at all, which is why the contact form only seemed
 * to show up on "some" articles: every /blog/{slug} post had it, but half
 * the site's articles are "other blog" posts living at the bare /{slug}
 * URL (see getMergedBlogItems in lib/queries.ts), and that page never had
 * this sidebar. One shared component now, so the two page types can't
 * drift apart like that again.
 */
export async function BlogSidebar({
  currentSlug,
  postTitle,
}: {
  currentSlug: string;
  postTitle: string;
}) {
  const recentPosts = await getLatestBlogPosts(currentSlug, 5);

  return (
    <div className="space-y-6">
      {/* Same card structure as the property page's sidebar (Agent
          Information up top, divider, form below) — heading + intro text
          stands in for the agent photo/name/contact details there, since
          a blog post isn't tied to one specific agent the way a listing
          is. ContactForm itself gets no heading/intro of its own here (it
          still takes them everywhere else it's used) — this one already
          establishes the context above the divider, and repeating it
          immediately below would just be the same line twice. */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl text-brand-navy pb-3 border-b border-slate-200">
          {BLOG_CONTACT_FORM_HEADING}
        </h2>
        <p className="mt-4 text-base text-slate-500">{BLOG_CONTACT_FORM_INTRO}</p>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <ContactForm
            compact
            leadType="blog"
            fallbackMessage={`Reader enquiry from blog post: ${postTitle}`}
          />
        </div>
      </div>

      {recentPosts.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="font-display text-lg text-brand-navy mb-3">Recent Posts</p>
          <div className="space-y-1">
            {recentPosts.map((post) => (
              <Link
                key={post.href}
                href={post.href}
                className="flex items-start gap-3 rounded-2xl p-2 -mx-2 hover:bg-slate-50 transition-colors"
              >
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 12 5-5 3 3 4-5 5 6"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="8" cy="9" r="1.4" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-lg font-medium text-brand-navy leading-snug line-clamp-3">
                    {post.title}
                  </p>
                  {post.publishedAt && (
                    <p className="mt-1.5 text-lg text-slate-400">
                      {dateFormatter.format(new Date(post.publishedAt))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogSidebar;
