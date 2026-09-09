import { WHY_HOME7 } from "@/lib/constants";

export function WhyHome7() {
  return (
    <section className="bg-slate-50 border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">
            Why Home7
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">
            A Different Kind of Real Estate Experience
          </h2>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            We&apos;re not a big established name — working with us feels more like getting
            things done with a friend who happens to know real estate inside out.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_HOME7.map((item) => (
            <div key={item.title} className="rounded-lg bg-white border border-slate-200 p-6">
              <h3 className="font-display text-lg text-brand-navy">{item.title}</h3>
              <p className="mt-2 text-lg text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyHome7;
