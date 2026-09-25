import { notFound } from "next/navigation";
import LandingPage from "@/components/lp/LandingPage";
import { lpMetadata } from "@/lib/lp/metadata";
import { REGION_KEYS, isRegionKey } from "@/lib/lp/regions";

export const dynamicParams = false;

export function generateStaticParams() {
  return REGION_KEYS.map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  return isRegionKey(region) ? lpMetadata("sell", region) : {};
}

export default async function Page({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  if (!isRegionKey(region)) notFound();
  return <LandingPage type="sell" region={region} />;
}
