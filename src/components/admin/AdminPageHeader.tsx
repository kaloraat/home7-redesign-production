import Link from "next/link";
import { ADMIN_GRADIENT, ADMIN_BUTTON_GRADIENT, ADMIN_ACCENT_BLUE } from "@/lib/constants";

/**
 * Shared page-header pattern for every admin list/detail page — title +
 * optional description on the left, one primary action (usually "+ New X")
 * on the right. Kept as one component so every admin page's header reads
 * identically rather than each page hand-rolling its own spacing/sizing.
 *
 * Styled as a gradient banner (ADMIN_GRADIENT) with a pill-shaped gradient
 * action button — matching the REB Dealmakers 2026 promo card the client
 * sent as a design reference, deliberately more prominent than the previous
 * plain-text heading + flat gold button.
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
      className="relative flex items-start justify-between gap-4 rounded-2xl p-6 sm:p-8 text-white"
      style={{ background: ADMIN_GRADIENT }}
    >
      <div>
        <h1 className="font-display text-2xl">{title}</h1>
        {description && <p className="mt-1 text-white/70">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 rounded-full px-5 py-2.5 text-sm font-display font-semibold text-white shadow-lg transition-[transform,box-shadow] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5fc7] focus-visible:ring-offset-2"
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
