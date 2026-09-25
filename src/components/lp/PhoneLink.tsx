"use client";

import { SITE } from "@/lib/lp/site";
import { PhoneIcon } from "@/components/icons";
import { trackPhoneClick } from "@/lib/lp/tracking";
import { useLp } from "./LpContext";

/**
 * Every visible phone number on an LP goes through this so the text is
 * always exactly "(02) 8729 7753" in the DOM (Google's call-tracking swap
 * looks for that exact string) and every tap is tracked.
 */
export function PhoneLink({
  location,
  className,
  icon = false,
  label,
}: {
  location: "header" | "hero" | "sticky" | "footer" | "thank-you";
  className?: string;
  icon?: boolean;
  /** Text shown before the number, e.g. "Call". */
  label?: string;
}) {
  const { leadType, region } = useLp();
  return (
    <a
      href={SITE.phoneHref}
      onClick={() => trackPhoneClick(location, leadType, region)}
      className={className}
    >
      {icon && <PhoneIcon size={18} className="shrink-0" />}
      {label && <span>{label}&nbsp;</span>}
      <span>{SITE.phoneDisplay}</span>
    </a>
  );
}

export default PhoneLink;
