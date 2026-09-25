import Image from "next/image";
import type { LpCopy } from "@/lib/lp/content";
import { TEAM } from "@/lib/lp/content";
import LeadForm from "./LeadForm";
import TrustRow from "./TrustRow";

export function Hero({ copy, rating, count }: { copy: LpCopy; rating: number; count: number }) {
  const principal = TEAM.find((t) => t.role === "Principal")!;
  return (
    <section className="bg-[linear-gradient(145deg,#071048_0%,#0a0e34_55%,#123a63_100%)] text-white">
      <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-7 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold sm:text-sm">{copy.eyebrow}</p>
          <h1 className="mt-2 font-display text-[1.75rem] leading-[1.15] sm:text-4xl md:text-[3.1rem] md:leading-[1.08]">{copy.h1}</h1>
          <p className="mt-3 text-[1.05rem] leading-snug text-slate-200 md:mt-5 md:text-lg">{copy.subheading}</p>
          <div className="mt-4 md:mt-6"><TrustRow rating={rating} count={count} /></div>
          {/* Real face of the principal — desktop only so the form stays high on phones. */}
          <div className="mt-8 hidden items-center gap-4 md:flex">
            <Image src={principal.photo} alt={principal.name} width={64} height={64} priority className="h-16 w-16 rounded-full border-2 border-brand-gold object-cover" />
            <p className="text-base text-slate-200">
              <strong className="text-white">{principal.name}</strong>
              <br />
              {principal.role}, Home7 Real Estate
            </p>
          </div>
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
