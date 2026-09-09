import Image from "next/image";
import { PARTNERS } from "@/lib/constants";
import CountUpStat from "@/components/CountUpStat";

const STATS = [
  { value: "2020", label: "Serving South West Sydney since" },
  { value: "100+", label: "Suburbs covered" },
  { value: "100%", label: "Family owned & operated" },
];

export function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-3 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <CountUpStat value={stat.value} className="font-display text-3xl sm:text-4xl text-brand-navy" />
              <p className="mt-1 text-lg text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <p className="text-center text-xs uppercase tracking-widest text-slate-400 mb-6">
            Connected to the platforms you already trust
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
            {PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="grayscale hover:grayscale-0 transition"
                aria-label={partner.name}
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={110}
                  height={40}
                  className="h-6 w-auto object-contain sm:h-7"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustBar;
