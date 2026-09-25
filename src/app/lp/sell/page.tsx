import LandingPage from "@/components/lp/LandingPage";
import { lpMetadata } from "@/lib/lp/metadata";

export const metadata = lpMetadata("sell", "all");

export default function Page() {
  return <LandingPage type="sell" region="all" />;
}
