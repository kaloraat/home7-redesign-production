import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogListPage } from "@/lib/queries";
import { SITE_URL } from "@/lib/constants";

const PAGE_SIZE = 24;

function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const canonical = page > 1 ? `${SITE_URL}/blog?page=${page}` : `${SITE_URL}/blog`;
  const title = page > 1 ? `Blog — Page ${page}` : "Blog";
  const description = "Local property market insights for Liverpool and Western Sydney.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary", title, description },
  };
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
  ],
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const { items, totalPages, total } = await getBlogListPage(page, PAGE_SIZE);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same nav-overlap hero technique AND height as the About page (see
          page.tsx there for the full writeup) — matched on request, so this
          upscales blog/banner.png (native 300px) by ~1.5x rather than
          staying at its native-safe height, same trade-off already accepted
          for About's banner. */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/blog/banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Blog
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Blog</h1>
        </div>
      </section>

      {/* Subtitle + intro copy from the live site's blog page, sourced
          verbatim rather than paraphrased. */}
      <div className="mx-auto max-w-3xl px-4 pt-16 sm:pt-20 text-center">
        <p className="text-sm uppercase tracking-widest text-brand-gold-dark font-semibold">
          Know About The Properties
        </p>
        <p className="mt-3 text-lg text-slate-600 leading-relaxed">
          The Home7 blog covers a range of topics aimed at enhancing home living, including DIY
          projects, interior design tips, and sustainability practices. Articles provide practical
          advice on home renovations, organization hacks, and the benefits of eco-friendly
          products. The content is designed to inspire homeowners to create stylish and functional
          spaces while promoting a sustainable lifestyle. For more in-depth insights and tips.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {total === 0 ? (
          <p className="mt-10 text-lg text-slate-600 leading-relaxed">
            No posts yet — add them from the admin dashboard.
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post) => (
                <Link
                  key={`${post.href}`}
                  href={post.href}
                  className="block rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  {post.coverImage && (
                    <div className="relative aspect-video bg-slate-100">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-display text-xl text-brand-navy">{post.title}</p>
                    {post.excerpt && (
                      <p className="mt-2 text-lg text-slate-600 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {page > 1 && (
                  <Link
                    href={page - 1 === 1 ? "/blog" : `/blog?page=${page - 1}`}
                    className="rounded border border-slate-300 px-4 py-2 text-lg font-medium text-brand-navy hover:border-brand-gold-dark"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={n === 1 ? "/blog" : `/blog?page=${n}`}
                    aria-current={n === page ? "page" : undefined}
                    className={`rounded px-4 py-2 text-lg font-medium ${
                      n === page
                        ? "bg-brand-navy text-white"
                        : "border border-slate-300 text-brand-navy hover:border-brand-gold-dark"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className="rounded border border-slate-300 px-4 py-2 text-lg font-medium text-brand-navy hover:border-brand-gold-dark"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
