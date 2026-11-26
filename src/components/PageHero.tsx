import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The banner hero used by the utility pages (same technique/heights as
 * /free-market-appraisal, /contact and /about-us: it slides under the
 * mobile nav bar below lg). Shared by /fees, /property-management and
 * /terms-and-conditions.
 */
export default function PageHero({ crumb, title, children }: { crumb: string; title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden h-72.75 -mt-14.25 min-[430px]:h-68.25 min-[430px]:-mt-7.25 sm:h-75.5 sm:-mt-8.25 lg:h-73.25 lg:mt-0">
      <Image src="/images/hero-banner.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/65 to-black/45" />
      <div className="absolute inset-x-0 bottom-0 h-58.5 min-[430px]:h-61 sm:h-67.25 lg:h-73.25 flex flex-col items-center justify-center text-center text-white px-4">
        <p className="text-shadow-hero text-sm text-white/80">
          <Link href="/" className="hover:text-brand-gold">Home</Link> / {crumb}
        </p>
        <h1 className="text-shadow-hero mt-3 font-display text-4xl sm:text-5xl max-w-4xl">{title}</h1>
        {children && <div className="text-shadow-hero mt-3 max-w-2xl text-base sm:text-lg text-white/90">{children}</div>}
      </div>
    </section>
  );
}
