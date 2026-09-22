import Link from "next/link";
import {
  ADMIN_NAVY_BASE,
  ADMIN_GLOW_BRIGHT_BLUE,
  ADMIN_GLOW_LIGHT_BLUE,
  ADMIN_GLOW_DEEP_BLUE,
  ADMIN_BUTTON_GRADIENT,
  ADMIN_ACCENT_BLUE,
  ADMIN_TEXT_BLUE,
} from "@/lib/constants";

/**
 * Shared page-header pattern for every admin list/detail page — title +
 * optional description on the left, one primary action (usually "+ New X")
 * on the right. Kept as one component so every admin page's header reads
 * identically rather than each page hand-rolling its own spacing/sizing.
 *
 * Styled to match the REB Dealmakers 2026 promo card the client sent as a
 * design reference. First pass used one smooth radial gradient; the
 * client's follow-up was that the reference isn't clean like that — it
 * reads as several soft blurred patches of different blue shades bleeding
 * into each other. Reproduced here as actual blurred, overlapping divs
 * (filter: blur) over a dark navy base rather than more gradient color
 * stops — a blur filter gives the irregular, photographic softness a
 * radial-gradient's clean rings can't.
 */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      className="relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
      style={{ backgroundColor: ADMIN_NAVY_BASE }}
    >
      {/* The blurred-patch background. Each blob is deliberately an odd
          size/opacity and off the edge on at least one side — perfectly
          centered, evenly-sized blobs read as "gradient" again rather than
          the organic, uneven patches in the reference. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-16 -top-20 h-72 w-80 rounded-full opacity-80 blur-3xl"
          style={{ backgroundColor: ADMIN_GLOW_BRIGHT_BLUE }}
        />
        <div
          className="absolute -top-10 left-1/3 h-56 w-56 rounded-full opacity-60 blur-3xl"
          style={{ backgroundColor: ADMIN_GLOW_LIGHT_BLUE }}
        />
        <div
          className="absolute -bottom-24 right-0 h-64 w-72 rounded-full opacity-70 blur-3xl"
          style={{ backgroundColor: ADMIN_GLOW_DEEP_BLUE }}
        />
        <div
          className="absolute -right-10 top-0 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: ADMIN_GLOW_LIGHT_BLUE }}
        />
      </div>

      <div className="relative">
        <h1 className="font-display text-2xl uppercase tracking-wide text-white">{title}</h1>
        {description && (
          <p className="mt-1" style={{ color: ADMIN_TEXT_BLUE }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="relative shrink-0 rounded-full px-5 py-2.5 text-sm font-display font-semibold text-white shadow-lg transition-[transform,box-shadow] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5fc7] focus-visible:ring-offset-2"
          style={{
            background: ADMIN_BUTTON_GRADIENT,
            boxShadow: `0 8px 24px -6px ${ADMIN_ACCENT_BLUE}99`,
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default AdminPageHeader;
