import { GOOGLE_RATING, GOOGLE_REVIEWS_URL, TESTIMONIALS } from "@/lib/constants";
import { StarIcon } from "@/components/icons";
import ResponsiveCardGrid from "@/components/ResponsiveCardGrid";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="bg-slate-50 border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-brand-gold-dark font-semibold">
            What our clients say
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-brand-navy">
            Real Reviews From Real Clients
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-0.5 text-brand-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} size={16} />
              ))}
            </div>
            <p className="text-lg text-slate-500">
              {GOOGLE_RATING.value} from {GOOGLE_RATING.count} Google reviews
            </p>
          </div>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-lg font-medium text-brand-gold-dark hover:text-brand-navy underline underline-offset-2"
          >
            See all reviews on Google
          </a>
        </div>

        <div className="mt-10">
          <ResponsiveCardGrid
            items={[...TESTIMONIALS]}
            renderItem={(testimonial) => (
              <div
                key={testimonial.name}
                className="h-full flex flex-col rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center gap-0.5 text-brand-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} size={14} />
                  ))}
                </div>
                <p className="mt-3 text-lg text-slate-600 leading-relaxed flex-1">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy/5 text-xs font-semibold text-brand-navy">
                    {initials(testimonial.name)}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-brand-navy">{testimonial.name}</p>
                    <a
                      href={testimonial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-slate-400 hover:text-brand-gold-dark hover:underline"
                    >
                      Google review
                    </a>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
