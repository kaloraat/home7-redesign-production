import Image from "next/image";
import { StarIcon } from "@/components/icons";
import { SITE } from "@/lib/lp/site";
import type { LpRatingData } from "@/lib/lp/reviews";

const clip = (s: string, n = 240) => {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
};

export function Reviews({ data }: { data: LpRatingData }) {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto max-w-[1120px] px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 text-brand-gold-dark" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} size={22} />)}
          </div>
          <h2 className="mt-2 font-display text-2xl text-brand-navy md:text-4xl">
            {data.rating.toFixed(1)} from {data.count} Google reviews
          </h2>
          <a href={SITE.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-lg font-medium text-brand-navy underline underline-offset-2">
            Read our reviews on Google
          </a>
        </div>

        {data.reviews.length > 0 && (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {data.reviews.map((r) => (
              <li key={r.author + r.url} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  {r.photo ? (
                    <Image src={r.photo} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white" aria-hidden="true">
                      {r.author.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{r.author}</p>
                    <p className="flex items-center gap-1 text-sm text-slate-600">
                      <span className="flex text-brand-gold-dark" aria-label={`${r.rating ?? 5} out of 5 stars`}>
                        {Array.from({ length: r.rating ?? 5 }).map((_, i) => <StarIcon key={i} size={13} />)}
                      </span>
                      {r.when && <span>{r.when}</span>}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-base leading-relaxed text-slate-700">&ldquo;{clip(r.text)}&rdquo;</p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-semibold text-brand-navy underline underline-offset-2">
                  Read on Google
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-center text-xs text-slate-500">Reviews from Google</p>
      </div>
    </section>
  );
}

export default Reviews;
