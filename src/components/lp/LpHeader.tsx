import Image from "next/image";
import { SITE } from "@/lib/lp/site";
import PhoneLink from "./PhoneLink";

/** Logo is deliberately not a link: nobody should leave the page from here. */
export function LpHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-3 px-4">
        <Image src="/images/logo.png" alt={SITE.name} width={132} height={47} priority className="h-10 w-auto" />
        <PhoneLink
          location="header"
          icon
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-brand-navy px-3.5 text-base font-bold text-brand-navy hover:bg-brand-navy hover:text-white sm:px-4"
        />
      </div>
    </header>
  );
}

export default LpHeader;
