import { StarIcon, PinIcon } from "@/components/icons";
import { SITE } from "@/lib/lp/site";

export function TrustRow({ rating, count }: { rating: number; count: number }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-200 sm:text-base">
      <li className="flex items-center gap-1.5">
        <StarIcon size={16} className="shrink-0 text-brand-gold" />
        <span><strong className="text-white">{rating.toFixed(1)}</strong> · {count} Google reviews</span>
      </li>
      <li>Family-owned since {SITE.since}</li>
      <li className="flex items-center gap-1.5">
        <PinIcon size={14} className="shrink-0 text-brand-gold" />
        <span>209 Macquarie St, Liverpool</span>
      </li>
    </ul>
  );
}

export default TrustRow;
