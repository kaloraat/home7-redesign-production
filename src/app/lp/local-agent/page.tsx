import LocalAgentPage from "@/components/lp/LocalAgentPage";
import { lpMetadata } from "@/lib/lp/metadata";

export const metadata = lpMetadata("local", "liverpool-campbelltown");

export default function Page() {
  return <LocalAgentPage />;
}
