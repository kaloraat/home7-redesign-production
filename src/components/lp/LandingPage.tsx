import { getContent } from "@/lib/lp/content";
import { getRatingData } from "@/lib/lp/reviews";
import { getRecentProperties } from "@/lib/lp/recent";
import type { RegionKey } from "@/lib/lp/regions";
import type { LpLeadType } from "@/lib/lp/validation";
import { LpProvider } from "./LpContext";
import LpHeader from "./LpHeader";
import Hero from "./Hero";
import Reviews from "./Reviews";
import StickyCallBar from "./StickyCallBar";
import { WhyCards, FeesBlock, HowItWorks, SwitchingBlock, Team, RecentProperties, Faq, FinalCta, LpFooter } from "./Sections";

export async function LandingPage({ type, region }: { type: LpLeadType; region: RegionKey }) {
  const copy = getContent(type, region);
  const [ratingData, recent] = await Promise.all([
    getRatingData(),
    getRecentProperties(type === "pm" ? "leased" : "sold", region),
  ]);

  return (
    <LpProvider leadType={type} region={region}>
      <LpHeader />
      <Hero copy={copy} rating={ratingData.rating} count={ratingData.count} />
      <Reviews data={ratingData} />
      <WhyCards copy={copy} />
      <FeesBlock copy={copy} />
      <HowItWorks copy={copy} />
      <SwitchingBlock copy={copy} />
      <Team type={type} />
      <RecentProperties copy={copy} properties={recent} />
      <Faq copy={copy} />
      <FinalCta copy={copy} />
      <LpFooter />
      <StickyCallBar />
    </LpProvider>
  );
}

export default LandingPage;
