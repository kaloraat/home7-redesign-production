import type { ReactNode } from "react";

export type FaqItem = { q: string; a: string };

/**
 * Accordion FAQ plus matching FAQPage JSON-LD (same visual style as
 * HomeFaq). The markup is for machine understanding (Google, Bing, AI
 * answer engines); FAQ rich results are limited to gov/health sites.
 */
export default function FaqSection({ heading, items, footer }: { heading: string; items: FaqItem[]; footer?: ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="text-center font-display text-3xl text-brand-navy">{heading}</h2>
      <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {items.map(({ q, a }) => (
          <details key={q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy text-lg">
              {q}
              <span aria-hidden="true" className="text-brand-gold-dark transition-transform group-open:rotate-45 text-2xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      {footer && <div className="mt-6 text-center text-lg text-slate-600">{footer}</div>}
    </section>
  );
}
