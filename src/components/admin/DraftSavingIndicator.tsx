/** Floating "saving…" pulse for useDraftAutosave — fixed (not absolute) +
 * a z-index above the admin chrome (sidebar/topbar) so it's visible over
 * everything regardless of scroll position, not just something that
 * scrolls out of view partway down a long form. */
export function DraftSavingIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-label="Saving draft"
      className="fixed top-4 right-4 z-60 w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"
    />
  );
}

export default DraftSavingIndicator;
