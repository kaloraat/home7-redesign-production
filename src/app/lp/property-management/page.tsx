import LandingPage from "@/components/lp/LandingPage";
import { lpMetadata } from "@/lib/lp/metadata";

export const metadata = lpMetadata("pm", "all");

export default function Page() {
  return <LandingPage type="pm" region="all" />;
}
