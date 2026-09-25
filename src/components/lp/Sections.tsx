import Image from "next/image";
import type { LpCopy } from "@/lib/lp/content";
import { teamFor } from "@/lib/lp/content";
import type { LpLeadType } from "@/lib/lp/validation";
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
        {copy.fees.rows ? (
          <table className="mx-auto mt-6 w-full max-w-xl text-left text-lg">
            <tbody>
              {copy.fees.rows.map((r) => (
                <tr key={r.label} className="border-b border-slate-200">
                  <th scope="row" className="py-3 pr-4 font-semibold text-slate-800">{r.label}</th>
                  <td className="py-3 text-slate-700">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-700 md:text-lg">{copy.fees.fallback}</p>
        )}
        <a href="#lp-hero-card" className={`${scrollBtn} mt-6`}>{copy.fees.button}</a>
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

export function SwitchingBlock({ copy }: { copy: LpCopy }) {
  if (!copy.switching) return null;
  const s = copy.switching;
  return (
    <section className="bg-white py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>{s.heading}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
          {s.steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-slate-200 p-6">
              <p className="font-display text-sm uppercase tracking-widest text-brand-gold-dark">Step {i + 1}</p>
              <h3 className="mt-1 font-display text-xl text-brand-navy">{step.title}</h3>
              <p className="mt-2 text-[1.05rem] leading-relaxed text-slate-700">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-slate-500">{s.footnote}</p>
      </div>
    </section>
  );
}

export function Team({ type }: { type: LpLeadType }) {
  const members = teamFor(type);
  return (
    <section className="bg-[#f6f7f9] py-12 md:py-20">
      <div className={wrap}>
        <h2 className={`${h2} text-center`}>The people you&apos;ll deal with</h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {members.map((m) => (
            <li key={m.slug} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
              <Image src={m.photo} alt={m.name} width={96} height={96} className="mx-auto h-24 w-24 rounded-full object-cover" />
              <p className="mt-3 font-display text-lg leading-tight text-brand-navy">{m.name}</p>
              <p className="text-base text-slate-600">{m.role}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-lg text-slate-700">
          Prefer to talk? Call the office on <PhoneLink location="hero" className="font-bold text-brand-navy underline underline-offset-2" />
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
        {SITE.licenceNumber && <p>{SITE.licenceNumber}</p>}
        <p>
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacy Policy</a>
          {" · "}© {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
