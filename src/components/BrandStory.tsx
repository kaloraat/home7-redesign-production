import {
  BRAND_STORY,
  BRAND_STORY_PULLQUOTE,
  MESH_NAVY_BASE,
  MESH_SECTION_BACKDROP,
  MESH_GLOW_BRIGHT_BLUE,
  MESH_GLOW_LIGHT_BLUE,
  MESH_GLOW_DEEP_BLUE,
} from "@/lib/constants";
import MeshBackground from "@/components/MeshBackground";

/**
 * Matches the REB Dealmakers 2026 promo card the client sent as a design
 * reference: a near-black page backdrop (MESH_SECTION_BACKDROP) behind a
 * rounded, blurred-blue-mesh card (same MeshBackground/MESH_* palette as
 * AdminPageHeader), pure white text throughout.
 *
 * Typography is a magazine-spread experiment the client asked to try: the
 * "Real Estate is in our blood" line — which already appears in BRAND_STORY
 * below — is blown up as a large bold pull-quote above the smaller, lighter
 * body paragraphs, the way a print spread re-states a line from the body
 * copy at a much bigger size. Easy to revert to the plain single-weight
 * paragraphs (the previous version) if the client doesn't like it.
 */
export function BrandStory() {
  return (
    <section style={{ backgroundColor: MESH_SECTION_BACKDROP }}>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-14 sm:px-16 sm:py-20 text-center"
          style={{ backgroundColor: MESH_NAVY_BASE }}
        >
          <MeshBackground
            blobs={[
              { className: "-left-20 -top-24 h-80 w-96 opacity-80 blur-3xl", color: MESH_GLOW_BRIGHT_BLUE },
              { className: "-top-16 left-1/3 h-64 w-64 opacity-50 blur-3xl", color: MESH_GLOW_LIGHT_BLUE },
              { className: "-bottom-28 -right-10 h-80 w-96 opacity-70 blur-3xl", color: MESH_GLOW_DEEP_BLUE },
              { className: "-right-16 top-0 h-48 w-48 opacity-40 blur-3xl", color: MESH_GLOW_LIGHT_BLUE },
            ]}
          />

          <div className="relative">
            <svg
              width="40"
              height="28"
              viewBox="0 0 205 141"
              className="mx-auto text-brand-gold"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M69.8 60.7C82.9 69.1 89.4 80.4 89.4 94.7 89.4 108.9 85.2 120.1 76.8 128.3 68.4 136.4 57.9 140.5 45.3 140.5 32.7 140.5 22.1 136.5 13.5 128.6 4.8 120.7 0.5 110.3 0.5 97.5 0.5 84.6 4.7 72.1 13.1 60L54.4 0.5 97.1 0.5 69.8 60.7ZM176.9 60.7C190 69.1 196.5 80.4 196.5 94.7 196.5 108.9 192.3 120.1 183.9 128.3 175.5 136.4 165 140.5 152.4 140.5 139.8 140.5 129.2 136.5 120.6 128.6 111.9 120.7 107.6 110.3 107.6 97.5 107.6 84.6 111.8 72.1 120.2 60L161.5 0.5 204.2 0.5 176.9 60.7Z" />
            </svg>

            <p className="mt-6 font-display text-3xl sm:text-5xl uppercase leading-tight tracking-tight text-white">
              &lsquo;{BRAND_STORY_PULLQUOTE}&rsquo;
            </p>

            <div className="mt-8 space-y-4 max-w-3xl mx-auto">
              {BRAND_STORY.map((paragraph, i) => (
                <p key={i} className="font-display-light text-base sm:text-lg leading-relaxed text-white">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandStory;
