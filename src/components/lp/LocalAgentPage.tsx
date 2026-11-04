import Link from "next/link";
import { getContent, LOCAL_PATHS } from "@/lib/lp/content";
import { getAgents } from "@/lib/queries";
import { getRatingData } from "@/lib/lp/reviews";
import { LpProvider } from "./LpContext";
import LpHeader from "./LpHeader";
import Hero from "./Hero";
import Reviews from "./Reviews";
import StickyCallBar from "./StickyCallBar";
import { WhyCards, HowItWorks, Team, FinalCta, LpFooter } from "./Sections";

/**
 * /lp/local-agent: one page for general "real estate agent near me" ads, so
 * it serves sellers and landlords. Same sections as LandingPage; the chip
 * the visitor picks tells the office which they are (see /api/lead).
 */
export async function LocalAgentPage() {
  const region = "liverpool-campbelltown" as const;
  const copy = getContent("local", region);
  const [ratingData, agents] = await Promise.all([getRatingData(), getAgents()]);

  return (
    <LpProvider leadType="local" region={region}>
      <LpHeader />
      <Hero copy={copy} rating={ratingData.rating} count={ratingData.count} />
      <PathCards />
      <WhyCards copy={copy} />
      <HowItWorks copy={copy} />
      <Reviews data={ratingData} />
      <Team agents={agents} />
      <FinalCta copy={copy} />
      <LpFooter />
      <StickyCallBar />
    </LpProvider>
  );
}

function PathCards() {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto max-w-[1120px] px-4">
        <h2 className="text-center font-display text-2xl leading-tight text-brand-navy md:text-4xl">Selling or renting out? We do both.</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
          {LOCAL_PATHS.map((p) => (
            <li key={p.href} className="flex flex-col rounded-xl bg-[#f6f7f9] p-6 ring-1 ring-slate-200 md:p-8">
              <h3 className="font-display text-2xl leading-snug text-brand-navy">{p.title}</h3>
              <ul className="mt-4 flex-1 space-y-3">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-[1.05rem] text-slate-800">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white" aria-hidden="true">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-navy px-5 text-base font-bold text-brand-navy hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/40"
              >
                {p.cta} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default LocalAgentPage;
