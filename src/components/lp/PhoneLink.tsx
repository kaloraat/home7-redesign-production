"use client";

import { SITE } from "@/lib/lp/site";
import { PhoneIcon } from "@/components/icons";
import { trackPhoneClick } from "@/lib/lp/tracking";
import { useLp } from "./LpContext";

/**
 * Every visible phone number on an LP goes through this so the text is
 * exactly what Google's call-tracking swap expects and every tap is tracked.
 * The office number "(02) 8729 7753" is the main call button (it's the one
 * Google swaps); `number="mohammed"` is his personal mobile, a secondary
 * option tracked as its own phone_click location.
 */
export function PhoneLink({
  location,
  className,
  icon = false,
  label,
  number = "office",
}: {
  location: string;
  className?: string;
  icon?: boolean;
  /** Text shown before the number, e.g. "Call". */
  label?: string;
  number?: "office" | "mohammed";
}) {
  const { leadType, region } = useLp();
  const isMo = number === "mohammed";
  return (
    <a
      href={isMo ? SITE.principal.mobileHref : SITE.phoneHref}
      onClick={() => trackPhoneClick(isMo ? `${location}-mohammed` : location, leadType, region)}
      className={className}
    >
      {icon && <PhoneIcon size={18} className="shrink-0" />}
      {label && <span>{label}&nbsp;</span>}
      <span>{isMo ? SITE.principal.mobileDisplay : SITE.phoneDisplay}</span>
    </a>
  );
}

export default PhoneLink;
