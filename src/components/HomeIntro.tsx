import Link from "next/link";
import {
  COMPANY,
  GOOGLE_RATING,
  MESH_NAVY_BASE,
  MESH_GLOW_BRIGHT_BLUE,
  MESH_GLOW_LIGHT_BLUE,
  MESH_GLOW_DEEP_BLUE,
} from "@/lib/constants";
import MeshBackground from "@/components/MeshBackground";

type Props = { sold: number; leased: number };

/**
 * Plain-text "who we are" block for the homepage. The page is otherwise
 * mostly listing cards, so this is the main copy Google reads when deciding
 * what the homepage (our page for "real estate agents liverpool") is about.
 * Counts come from the DB so they stay true as listings change.
 *
 * Styled like BrandStory ("Real Estate is in our blood"): navy backdrop,
 * rounded blurred-blue mesh card, white text. Blob positions are mirrored
 * so the two sections don't look like copies of each other.
 */
export function HomeIntro({ sold, leased }: Props) {
  return (
    <section style={{ backgroundColor: MESH_NAVY_BASE }}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16"
          style={{ backgroundColor: MESH_NAVY_BASE }}
        >
          <MeshBackground
            blobs={[
              {
                className: "-right-20 -top-24 h-80 w-96 opacity-80 blur-3xl",
                color: MESH_GLOW_BRIGHT_BLUE,
              },
              {
                className: "-top-16 right-1/3 h-64 w-64 opacity-50 blur-3xl",
                color: MESH_GLOW_LIGHT_BLUE,
              },
              {
                className: "-bottom-28 -left-10 h-80 w-96 opacity-70 blur-3xl",
                color: MESH_GLOW_DEEP_BLUE,
              },
              {
                className: "-left-16 top-0 h-48 w-48 opacity-40 blur-3xl",
                color: MESH_GLOW_LIGHT_BLUE,
              },
            ]}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_340px] items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
                About Home7
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl text-white leading-tight">
                Local Real Estate Agents in{" "}
                <span className="text-brand-gold">Liverpool</span>
              </h2>
              <div className="mt-6 space-y-4 text-lg text-white/90 leading-relaxed">
                <p>
                  Home7 Real Estate is a family-owned real estate agency in the
                  Liverpool CBD, at{" "}
                  {COMPANY.address.replace(", Liverpool NSW 2170", "")}. We help
                  people sell, buy, rent out and manage property across
                  Liverpool and South West Sydney, from units near Liverpool
                  station to family homes in Casula, Prestons and Warwick Farm
                  and new builds in Austral and Leppington.
                </p>
                <p>
                  Our principal, Mohammed Islam, works directly with clients.
                  You deal with the same people from your first appraisal to
                  settlement or lease signing, you get honest pricing based on
                  real local sales, and someone picks up the phone. Our fees are
                  low and negotiable, and every cost is in writing before you
                  sign.
                </p>
                <p>
                  Thinking of selling or renting out your property? Start with a{" "}
                  <Link
                    href="/free-market-appraisal"
                    className="font-semibold text-brand-gold underline underline-offset-4 hover:text-white"
                  >
                    free market appraisal
                  </Link>
                  , or meet{" "}
                  <Link
                    href="/agents"
                    className="font-semibold text-brand-gold underline underline-offset-4 hover:text-white"
                  >
                    our team
                  </Link>
                  .
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              {sold > 0 && (
                <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <dt className="text-sm text-white/70">Properties sold</dt>
                  <dd className="font-display text-3xl text-white">{sold}</dd>
                </div>
              )}
              {leased > 0 && (
                <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <dt className="text-sm text-white/70">Properties leased</dt>
                  <dd className="font-display text-3xl text-white">{leased}</dd>
                </div>
              )}
              <div className="col-span-2 rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <dt className="text-sm text-white/70">Google rating</dt>
                <dd className="font-display text-3xl text-white">
                  {GOOGLE_RATING.value}{" "}
                  <span className="text-base text-white/70">
                    from {GOOGLE_RATING.count} reviews
                  </span>
                </dd>
              </div>
              <div className="col-span-2 rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <dt className="text-sm text-white/70">Office</dt>
                <dd className="mt-1 text-white">{COMPANY.address}</dd>
                <dd className="mt-1">
                  <a
                    href={`tel:${COMPANY.phone.replace(/[^\d]/g, "")}`}
                    className="font-semibold text-brand-gold hover:text-white"
                  >
                    {COMPANY.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeIntro;
