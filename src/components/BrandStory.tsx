import { BRAND_STORY } from "@/lib/constants";

export function BrandStory() {
  return (
    <section className="bg-brand-navy">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24 text-center">
        <svg width="40" height="28" viewBox="0 0 205 141" className="mx-auto text-brand-gold" aria-hidden="true" fill="currentColor">
          <path d="M69.8 60.7C82.9 69.1 89.4 80.4 89.4 94.7 89.4 108.9 85.2 120.1 76.8 128.3 68.4 136.4 57.9 140.5 45.3 140.5 32.7 140.5 22.1 136.5 13.5 128.6 4.8 120.7 0.5 110.3 0.5 97.5 0.5 84.6 4.7 72.1 13.1 60L54.4 0.5 97.1 0.5 69.8 60.7ZM176.9 60.7C190 69.1 196.5 80.4 196.5 94.7 196.5 108.9 192.3 120.1 183.9 128.3 175.5 136.4 165 140.5 152.4 140.5 139.8 140.5 129.2 136.5 120.6 128.6 111.9 120.7 107.6 110.3 107.6 97.5 107.6 84.6 111.8 72.1 120.2 60L161.5 0.5 204.2 0.5 176.9 60.7Z" />
        </svg>
        <div className="mt-6 space-y-4">
          {BRAND_STORY.map((paragraph, i) => (
            <p key={i} className="font-display-light text-lg sm:text-xl leading-relaxed text-white/90">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BrandStory;
