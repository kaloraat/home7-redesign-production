import Image from "next/image";
import Link from "next/link";
import { COMPANY } from "@/lib/constants";
import { PhoneIcon } from "@/components/icons";
import type { IAgent } from "@/models/Agent";

const PRINCIPAL_SLUG = "mohammed-r-islam";

/**
 * Contact-page team section. Takes the same Agent records the homepage's
 * TeamGrid gets (getAgents()), so /admin/agents edits show up here too —
 * no second copy of the team data. Principal is featured first and larger;
 * everyone else is a smaller card linking to their agent page.
 */
export function MeetTheTeam({ agents }: { agents: IAgent[] }) {
  const principal = agents.find((a) => a.slug === PRINCIPAL_SLUG);
  if (!principal) return null;
  const team = agents.filter((a) => a.slug !== PRINCIPAL_SLUG);

  return (
    <section className="mt-16">
      <h3 className="font-display text-2xl text-brand-navy">Meet the team</h3>

      <div className="mt-6 flex flex-col items-center gap-6 rounded-lg border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Link href={`/agent/${principal.slug}`} className="shrink-0">
          <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-brand-gold shadow-lg sm:h-48 sm:w-48">
            {principal.photo && (
              <Image src={principal.photo} alt={principal.name} fill sizes="192px" className="object-cover" />
            )}
          </div>
        </Link>
        <div className="text-center sm:text-left">
          <span className="inline-block rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
            Principal
          </span>
          <p className="mt-2 font-display text-2xl text-brand-navy">{principal.name}</p>
          <p className="text-lg text-slate-500">{principal.role}</p>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            Mohammed founded Home7 and leads our Liverpool team. Call him directly to talk
            about buying, selling or leasing.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <a
              href={`tel:${COMPANY.mobileSecondary.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-3 text-lg font-semibold text-brand-navy hover:brightness-105 transition"
            >
              <PhoneIcon size={18} />
              {COMPANY.mobileSecondary}
            </a>
            <Link
              href={`/agent/${principal.slug}`}
              className="inline-flex items-center rounded-lg border border-brand-navy px-5 py-3 text-lg font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition-colors"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>

      {team.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((member) => (
            <li key={member.slug}>
              <Link
                href={`/agent/${member.slug}`}
                className="flex h-full flex-col items-center rounded-lg border border-slate-200 bg-white p-4 text-center hover:text-brand-gold-dark hover:shadow-md transition"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full ring-1 ring-slate-200">
                  {member.photo && (
                    <Image src={member.photo} alt={member.name} width={80} height={80} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-3 font-medium text-lg text-brand-navy">{member.name}</p>
                <p className="text-lg text-slate-500">{member.role}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MeetTheTeam;
