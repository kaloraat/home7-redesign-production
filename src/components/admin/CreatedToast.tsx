"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Success notification after a create action redirects back to a list
 * page — e.g. createProperty()/createContent() both `redirect(...)` to
 * their list page on success; passing `?created=1` on that redirect is
 * what tells this component to show the toast (no other signal is
 * available here: a Server Action's redirect is a real navigation, not
 * something a client callback can hook into after the fact).
 *
 * Auto-dismisses after a few seconds, and strips `created` from the URL
 * via history.replaceState (router.replace) so refreshing the list page
 * afterward doesn't keep re-showing it.
 */
export function CreatedToast({ message }: { message: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const created = searchParams.get("created") === "1";
  const [visible, setVisible] = useState(created);

  useEffect(() => {
    if (!created) return;
    const hideTimeout = setTimeout(() => setVisible(false), 4000);

    // Drop the query param so a manual refresh of this same URL doesn't
    // keep re-triggering the toast — scroll:false since this is purely a
    // URL cleanup, not a real navigation the page should jump for.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("created");
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });

    return () => clearTimeout(hideTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [created]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-4 right-4 z-60 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="ml-1 cursor-pointer text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

export default CreatedToast;
