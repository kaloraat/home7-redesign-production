import Link from "next/link";

/**
 * Shared page-header pattern for every admin list/detail page — title +
 * optional description on the left, one primary action (usually "+ New X")
 * on the right. Kept as one component so every admin page's header reads
 * identically rather than each page hand-rolling its own spacing/sizing.
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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-brand-navy">{title}</h1>
        {description && <p className="mt-1 text-slate-500">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 bg-brand-gold text-brand-navy rounded px-4 py-2 text-sm font-semibold hover:brightness-95 transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default AdminPageHeader;
