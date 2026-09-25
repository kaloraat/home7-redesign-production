import Image from "next/image";
import type { LpCopy } from "@/lib/lp/content";
import { SITE } from "@/lib/lp/site";
import LeadForm from "./LeadForm";
import TrustRow from "./TrustRow";

export function Hero({ copy, rating, count }: { copy: LpCopy; rating: number; count: number }) {
  return (
    <section className="bg-[linear-gradient(145deg,#071048_0%,#0a0e34_55%,#123a63_100%)] text-white">
      <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-7 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold sm:text-sm">{copy.eyebrow}</p>
          <h1 className="mt-2 font-display text-[1.75rem] leading-[1.15] sm:text-4xl md:text-[3.1rem] md:leading-[1.08]">{copy.h1}</h1>
          <p className="mt-3 text-[1.05rem] leading-snug text-slate-200 md:mt-5 md:text-lg">{copy.subheading}</p>
          <div className="mt-4 md:mt-6"><TrustRow rating={rating} count={count} /></div>
          {/* Mohammed's portrait: desktop only so the form stays high on phones. */}
          <figure className="mt-8 hidden w-fit items-center gap-4 rounded-2xl bg-white/10 p-3 pr-6 md:flex">
            <Image src={SITE.principal.photo} alt={SITE.principal.name} width={96} height={96} priority className="h-24 w-24 rounded-xl border-2 border-brand-gold object-cover" />
            <figcaption className="text-base text-slate-200">
              <strong className="text-white">{SITE.principal.name}, {SITE.principal.role}</strong>
              <br />
              &ldquo;Call me any time.&rdquo;
            </figcaption>
          </figure>
        </div>

        <div id="lp-hero-card" className="scroll-mt-4 rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
          <h2 className="mb-4 font-display text-xl leading-tight text-brand-navy sm:text-2xl">{copy.form.heading}</h2>
          <LeadForm copy={copy} instance="hero" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
