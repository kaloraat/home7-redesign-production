import Image from "next/image";
import Link from "next/link";
import { BRAND_GRADIENT } from "@/lib/constants";
import type { IAgent } from "@/models/Agent";

/**
 * Was entirely hardcoded (a static PRINCIPAL/TEAM array, local
 * /images/team/*.png files) — an explicit "for now, real data once the
 * migration runs" placeholder from early in the rebuild that never got
 * swapped over. That meant two real problems, not just "not clickable":
 * editing an agent via /admin/agents (name, role, photo, even removing
 * someone) never showed up here, and there was no slug to link to anyway
 * since none of this came from the database. Now takes real Agent
 * records — `agents[0]` (order 0, Mohammed as Principal) gets the
 * featured card, the rest render in the grid, both link to their real
 * /agent/[slug] profile.
 */
export function TeamGrid({ agents }: { agents: IAgent[] }) {
  if (agents.length === 0) return null;
  const [principal, ...team] = agents;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">
          Our people
        </p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">
          Meet the Home7 Team
        </h2>
        <p className="mt-3 text-lg text-slate-600 leading-relaxed">
          Local agents in Liverpool NSW, ready to help you buy, sell or lease.
        </p>
      </div>

      {/*
       * Mohammed, as Principal, gets a taller featured card spanning both
       * rows on the left (col-span-2 on mobile — its own full-width row
       * instead — since a row-span only reads as "featured" once there's
       * enough width for the other six to actually form two rows beside
       * it). The other six sit 3-per-row to its right, unchanged in style.
       */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Link
          href={`/agent/${principal.slug}`}
          className="col-span-2 sm:col-span-1 sm:row-span-2 relative overflow-hidden rounded-2xl border-2 border-brand-gold-dark p-6 sm:p-8 flex flex-col items-center justify-center text-center hover:brightness-105 transition"
          style={{ background: BRAND_GRADIENT }}
        >
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-brand-gold/20 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand-gold/10 blur-2xl" aria-hidden="true" />

          <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden ring-4 ring-brand-gold shadow-lg">
            {principal.photo && (
              <Image
                src={principal.photo}
                alt={principal.name}
                fill
                sizes="144px"
                className="object-cover"
              />
            )}
          </div>
          <span className="relative mt-4 inline-block rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
            Principal
          </span>
          <p className="relative mt-3 font-display text-xl text-white">{principal.name}</p>
          <p className="relative mt-1 text-lg text-brand-gold-dark">{principal.role}</p>
        </Link>

        {team.map((member) => (
          <Link
            key={member.slug}
            href={`/agent/${member.slug}`}
            className="flex flex-col items-center justify-center text-center hover:text-brand-gold-dark transition-colors"
          >
            <div className="h-20 w-20 rounded-full overflow-hidden ring-1 ring-slate-200">
              {member.photo && (
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <p className="mt-3 font-medium text-lg text-brand-navy">{member.name}</p>
            <p className="text-lg text-slate-500">{member.role}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default TeamGrid;
