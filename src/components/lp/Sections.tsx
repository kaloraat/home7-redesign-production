import Image from "next/image";
import type { LpCopy } from "@/lib/lp/content";
import type { IAgent } from "@/models/Agent";
import { SwitchButton } from "./SwitchCta";
import type { RecentProperty } from "@/lib/lp/recent";
import { SITE } from "@/lib/lp/site";
import LeadForm from "./LeadForm";
import PhoneLink from "./PhoneLink";

const wrap = "mx-auto max-w-[1120px] px-4";
const h2 = "font-display text-2xl leading-tight text-brand-navy md:text-4xl";
const scrollBtn =
  "inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-brand-gold-dark bg-brand-gold px-7 py-3 text-lg font-bold text-brand-navy shadow-sm hover:bg-[#f0bd55] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-navy/40";

export function WhyCards({ copy }: { copy: LpCopy }) {
  return (
    <section className="bg-[#f6f7f9] py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>{copy.whyHeading}</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
          {copy.why.map((w) => (
            <li key={w.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-display text-xl leading-snug text-brand-navy">{w.title}</h3>
              <p className="mt-2 text-[1.05rem] leading-relaxed text-slate-700">{w.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FeesBlock({ copy }: { copy: LpCopy }) {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className={h2}>{copy.feesHeading}</h2>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-700 md:text-lg">{copy.fees.text}</p>
        <a href="#lp-hero-card" className={`${scrollBtn} mt-6`}>{copy.fees.button}</a>
      </div>
    </section>
  );
}

export function IncludedChecklist({ copy }: { copy: LpCopy }) {
  if (!copy.included) return null;
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className={`${h2} text-center`}>{copy.included.heading}</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {copy.included.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[1.05rem] text-slate-800">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks({ copy }: { copy: LpCopy }) {
  return (
    <section className="bg-[#f6f7f9] py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>{copy.howHeading}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {copy.how.map((s, i) => (
            <li key={s.title} className="flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-navy font-display text-xl text-white" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl text-brand-navy">{s.title}</h3>
                <p className="mt-1 text-[1.05rem] leading-relaxed text-slate-700">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SwitchSection({ type }: { type: "pm" | "sell" }) {
  if (type !== "pm") return null;
  return (
    <section className="bg-brand-gold/20 py-12 md:py-20">
      <div className="mx-auto grid max-w-[1120px] items-center gap-8 px-4 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="flex flex-col items-center text-center">
          <Image src={SITE.principal.photo} alt={SITE.principal.name} width={160} height={160} className="h-32 w-32 rounded-full border-4 border-brand-gold object-cover shadow-lg md:h-40 md:w-40" />
          <p className="mt-3 font-display text-lg text-brand-navy">{SITE.principal.name}</p>
          <p className="text-base text-slate-600">{SITE.principal.role}</p>
        </div>
        <div>
          <h2 className={h2}>Just say yes. We handle the switch.</h2>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-800 md:text-lg">
            Unhappy with your current property manager? You don&apos;t have to chase them, argue, or work out any paperwork. Say yes, and we take care of everything with your current agent: the notice, the keys, the tenant file and the bond details. We also let your tenant know, so your rent keeps coming in as normal.
          </p>
          <ul className="mt-5 space-y-2 text-[1.05rem] font-semibold text-brand-navy">
            {["No awkward conversations with your old agent", "No paperwork to work out yourself", "No break in your rent"].map((t) => (
              <li key={t}><span aria-hidden="true">✓ </span>{t}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <SwitchButton className={`${scrollBtn} w-full sm:w-auto`}>Yes, handle my switch</SwitchButton>
            <PhoneLink location="switch" number="mohammed" label="Or call Mohammed on" className="text-lg font-bold text-brand-navy underline underline-offset-2" />
          </div>
          <p className="mt-4 text-xs text-slate-600">Your current agreement&apos;s notice period still applies. We&apos;ll check it for you.</p>
        </div>
      </div>
    </section>
  );
}

const PRINCIPAL_SLUG = "mohammed-r-islam";

/**
 * Same team data as the homepage (getAgents(), passed in) — no copy here.
 * Cards are deliberately not links: they'd take people off the page.
 */
export function Team({ agents }: { agents: IAgent[] }) {
  const others = agents.filter((a) => a.slug !== PRINCIPAL_SLUG);
  const principal = agents.find((a) => a.slug === PRINCIPAL_SLUG);
  return (
    <section className="bg-[#f6f7f9] py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>Meet the people you&apos;ll actually deal with</h2>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:flex-row sm:text-left md:p-8">
          <Image src={principal?.photo || SITE.principal.photo} alt={SITE.principal.name} width={160} height={160} className="h-36 w-36 shrink-0 rounded-full border-4 border-brand-gold object-cover" />
          <div>
            <p className="font-display text-2xl text-brand-navy">{SITE.principal.name}</p>
            <p className="text-lg text-slate-600">{SITE.principal.role}</p>
            <p className="mt-3 text-[1.05rem] italic text-slate-800">&ldquo;I&apos;ll look after your property like it&apos;s my own. Call me any time.&rdquo;</p>
            <PhoneLink
              location="team"
              number="mohammed"
              icon
              label="Call Mohammed"
              className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-gold-dark bg-brand-gold px-5 text-lg font-bold text-brand-navy hover:bg-[#f0bd55]"
            />
          </div>
        </div>

        {others.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {others.map((m) => (
              <li key={m.slug} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                {m.photo && <Image src={m.photo} alt={m.name} width={80} height={80} className="mx-auto h-20 w-20 rounded-full object-cover" />}
                <p className="mt-3 font-display text-lg leading-tight text-brand-navy">{m.name}</p>
                <p className="text-base text-slate-600">{m.role}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-center text-lg text-slate-700">
          Prefer the office? Call <PhoneLink location="team" className="font-bold text-brand-navy underline underline-offset-2" />
        </p>
      </div>
    </section>
  );
}

export function RecentProperties({ copy, properties }: { copy: LpCopy; properties: RecentProperty[] }) {
  if (properties.length < 3) return null;
  return (
    <section className="bg-white py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>{copy.recentHeading}</h2>
        {/* Cards are deliberately not links: they'd take people off the page. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {properties.map((p) => {
            const facts = [p.bedrooms && `${p.bedrooms} bed`, p.bathrooms && `${p.bathrooms} bath`, p.carSpaces && `${p.carSpaces} car`].filter(Boolean);
            return (
              <li key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image src={p.image} alt={`${copy.recentBadge} property in ${p.suburb}`} fill sizes="(min-width:1024px) 360px, (min-width:640px) 50vw, 100vw" className="object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-brand-navy px-3 py-1 text-sm font-bold text-white">{copy.recentBadge}</span>
                </div>
                <div className="p-4">
                  <p className="font-display text-lg text-brand-navy">{p.suburb}</p>
                  {facts.length > 0 && <p className="text-base text-slate-600">{facts.join(" · ")}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Faq({ copy }: { copy: LpCopy }) {
  return (
    <section className="bg-[#f6f7f9] py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className={`${h2} text-center`}>{copy.faqHeading}</h2>
        <div className="mt-8 space-y-3">
          {copy.faq.map((f) => (
            <details key={f.q} className="group rounded-xl bg-white ring-1 ring-slate-200">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-3 text-lg font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-[1.05rem] leading-relaxed text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ copy }: { copy: LpCopy }) {
  return (
    <section className="bg-[linear-gradient(145deg,#071048_0%,#0a0e34_55%,#123a63_100%)] py-12 text-white md:py-20">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-4 md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <h2 className="font-display text-3xl leading-tight md:text-4xl">{copy.finalHeading}</h2>
          <p className="mt-3 text-lg text-slate-200">{copy.finalSub}</p>
          <p className="mt-6 hidden text-lg md:block">
            Or call us now: <PhoneLink location="footer" className="font-bold text-brand-gold underline underline-offset-4" />
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
          <LeadForm copy={copy} instance="footer" />
        </div>
      </div>
    </section>
  );
}

export function LpFooter() {
  return (
    <footer className="bg-white py-8 text-center text-sm text-slate-600">
      <div className="mx-auto max-w-[1120px] space-y-1 px-4">
        <p className="font-semibold text-slate-800">{SITE.name}</p>
        <p>{SITE.address}</p>
        {SITE.officeHours && <p>Office hours: {SITE.officeHours}</p>}
        {SITE.licensee.name && (
          <p>{SITE.licensee.name}{SITE.licensee.licenceNumber && ` · Licence No. ${SITE.licensee.licenceNumber}`}</p>
        )}
        <p>
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacy Policy</a>
          {" · "}© {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
