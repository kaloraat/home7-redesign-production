import LandingPage from "@/components/lp/LandingPage";
import { lpMetadata } from "@/lib/lp/metadata";

export const metadata = lpMetadata("pm", "all");

export default async function Page({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  return <LandingPage type="pm" region="all" intent={intent === "switch" ? "switch" : undefined} />;
}
