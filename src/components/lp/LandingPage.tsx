import { getContent, type LpIntent } from "@/lib/lp/content";
import { getAgents } from "@/lib/queries";
import { getRatingData } from "@/lib/lp/reviews";
import { getRecentProperties } from "@/lib/lp/recent";
import type { RegionKey } from "@/lib/lp/regions";
import type { LpLeadType } from "@/lib/lp/validation";
import { LpProvider } from "./LpContext";
import LpHeader from "./LpHeader";
import Hero from "./Hero";
import Reviews from "./Reviews";
import { SwitchBanner } from "./SwitchCta";
import StickyCallBar from "./StickyCallBar";
import { WhyCards, IncludedChecklist, FeesBlock, HowItWorks, SwitchSection, Team, RecentProperties, Faq, FinalCta, LpFooter } from "./Sections";

export async function LandingPage({ type, region, intent }: { type: LpLeadType; region: RegionKey; intent?: LpIntent }) {
  const copy = getContent(type, region, intent);
  const [ratingData, recent, agents] = await Promise.all([
    getRatingData(),
    getRecentProperties(type === "pm" ? "leased" : "sold", region),
    getAgents(),
  ]);

  return (
    <LpProvider leadType={type} region={region}>
      <LpHeader />
      <Hero copy={copy} rating={ratingData.rating} count={ratingData.count} />
      {type === "pm" && <SwitchBanner />}
      <Reviews data={ratingData} />
      <WhyCards copy={copy} />
      <IncludedChecklist copy={copy} />
      <FeesBlock copy={copy} />
      <HowItWorks copy={copy} />
      <SwitchSection type={type} />
      <Team agents={agents} />
      <RecentProperties copy={copy} properties={recent} />
      <Faq copy={copy} />
      <FinalCta copy={copy} />
      <LpFooter />
      <StickyCallBar />
    </LpProvider>
  );
}

export default LandingPage;
