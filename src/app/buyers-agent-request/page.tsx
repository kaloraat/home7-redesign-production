import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { pageMetadata } from "@/lib/pageMetadata";
import ContactForm from "@/components/ContactForm";

const TITLE = "Buyers Agent Request";
const DESCRIPTION = "Request a Home7 buyers agent to help you find and negotiate your next property.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageMetadata(TITLE, DESCRIPTION, "/buyers-agent-request"),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Buyers Agent Request", item: `${SITE_URL}/buyers-agent-request` },
  ],
};

// Previously the "Buyers Agent Request" nav item just pointed straight at
// /contact — a generic form with no context on what was actually being
// requested. This gives it its own page (same hero/breadcrumb pattern as
// every other utility page, same shared ContactForm everything else uses)
// so the heading and lead type actually reflect what the visitor asked for.
export default function Page() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

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
            <Link href="/" className="hover:text-brand-gold">Home</Link> / Buyers Agent Request
          </p>
          <h1 className="text-shadow-hero mt-3 font-display text-5xl sm:text-6xl">Buyers Agent Request</h1>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="text-lg text-slate-600 leading-relaxed">
          Let a Home7 buyers agent do the searching, shortlisting and negotiating for you — tell
          us what you&apos;re after and we&apos;ll take it from there.
        </p>
        <div className="mt-8">
          <ContactForm leadType="buying" />
        </div>
      </div>
    </div>
  );
}
