import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import { getAgents } from "@/lib/queries";

const TITLE = "Our Team";
const DESCRIPTION = "Meet the Home7 Real Estate team in Liverpool, NSW.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/agents"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Our Team", item: `${SITE_URL}/agents` },
  ],
};

export default async function Page() {
  const agents = await getAgents();
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Same hero technique/height as About/Contact — see those pages'
          hero comments. Reuses the homepage's hero-banner.webp, same as the
          other "Buy" utility pages (no dedicated banner photo exists yet
          for any of these). */}
      <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
        <Image
          src="/images/hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-shadow-hero text-sm text-white/80">
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Our Team
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Our Team</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {agents.length === 0 ? (
          <p className="text-slate-500 text-lg">No agents yet — add them from the admin dashboard.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <Link
                key={String(a._id)}
                href={`/agent/${a.slug}`}
                className="flex flex-col items-center text-center rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                {/* Same 80px circular photo treatment as the homepage/
                    about-page TeamGrid — this card previously had no photo
                    at all, unlike every other team-card pattern on the
                    site. Falls back to initials if an agent has none. */}
                <div className="h-20 w-20 rounded-full overflow-hidden ring-1 ring-slate-200 bg-brand-navy/5 flex items-center justify-center">
                  {a.photo ? (
                    <Image
                      src={a.photo}
                      alt={a.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-xl text-brand-navy">
                      {a.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="mt-3 font-medium text-lg text-brand-navy">{a.name}</p>
                <p className="text-lg text-slate-500">{a.role}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
