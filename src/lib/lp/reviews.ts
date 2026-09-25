import { SITE } from "./site";
import { TESTIMONIALS } from "@/lib/constants";

export type LpReview = {
  author: string;
  photo?: string;
  rating?: number;
  when?: string;
  text: string;
  url: string;
};
export type LpRatingData = { rating: number; count: number; reviews: LpReview[]; live: boolean };

/**
 * Live Google rating + reviews via the Places API (New) when
 * GOOGLE_PLACES_API_KEY and NEXT_PUBLIC_GOOGLE_PLACE_ID are set (cached 24h).
 * Otherwise falls back to the rating in constants.ts and the real Google
 * reviews already curated on the main site (each links to its own Google
 * share URL) — never invented or edited copy.
 */
export async function getRatingData(): Promise<LpRatingData> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;

  if (key && placeId) {
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const d = (await res.json()) as {
          rating?: number;
          userRatingCount?: number;
          reviews?: {
            rating?: number;
            relativePublishTimeDescription?: string;
            text?: { text?: string };
            originalText?: { text?: string };
            googleMapsUri?: string;
            authorAttribution?: { displayName?: string; photoUri?: string };
          }[];
        };
        if (d.rating && d.userRatingCount) {
          const reviews = (d.reviews ?? [])
            .filter((r) => (r.text?.text || r.originalText?.text))
            .slice(0, 3)
            .map((r) => ({
              author: r.authorAttribution?.displayName ?? "Google reviewer",
              photo: r.authorAttribution?.photoUri,
              rating: r.rating,
              when: r.relativePublishTimeDescription,
              text: (r.text?.text || r.originalText?.text) as string,
              url: r.googleMapsUri ?? SITE.googleReviewsUrl,
            }));
          return { rating: d.rating, count: d.userRatingCount, reviews, live: true };
        }
      }
    } catch {
      // fall through to the fallback
    }
  }

  return {
    rating: SITE.ratingFallback.rating,
    count: SITE.ratingFallback.count,
    reviews: TESTIMONIALS.slice(0, 3).map((t) => ({ author: t.name, rating: 5, text: t.quote, url: t.url })),
    live: false,
  };
}
