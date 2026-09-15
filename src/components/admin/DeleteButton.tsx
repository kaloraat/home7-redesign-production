"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface Props {
  /** The server action to run on confirm — pass a closure, e.g.
   * `() => deleteAgent(id)`. */
  onConfirm: () => Promise<void>;
  /** What's being deleted, used in the modal copy — e.g. "this agent",
   * "this listing". */
  itemLabel: string;
  /** If set, the confirm button stays disabled until the admin types this
   * exact phrase — extra friction for the hardest-to-recover deletes
   * (currently just Properties). */
  requireTypedConfirmation?: string;
  /** After a successful delete: "refresh" re-fetches the current list page
   * (default — for delete-from-a-list-row), "redirect" navigates to `to`
   * instead (for delete-from-a-detail-page, where the row you were looking
   * at no longer exists to refresh into). */
  after?: { mode: "refresh" } | { mode: "redirect"; to: string };
  className?: string;
}

/**
 * Every "Delete" action in the admin used to be a bare form button — one
 * click, no confirmation, immediate and irreversible. This is the shared
 * fix, used everywhere a delete exists (Properties, Agents, Blog,
 * Redirects, Admin Users, Leads) rather than a one-off per page.
 */
export function DeleteButton({
  onConfirm,
  itemLabel,
  requireTypedConfirmation,
  after = { mode: "refresh" },
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const canConfirm = !requireTypedConfirmation || typed.trim() === requireTypedConfirmation;

  function close() {
    if (pending) return;
    setOpen(false);
    setTyped("");
    setError("");
  }

  async function handleConfirm() {
    setPending(true);
    setError("");
    try {
      await onConfirm();
      if (after.mode === "redirect") {
        router.push(after.to);
      } else {
        router.refresh();
      }
      setOpen(false);
      setTyped("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-red-600 hover:underline cursor-pointer"}
      >
        Delete
      </button>

      {open &&
        createPortal(
          // Rendered via a portal straight into <body> — this button lives
          // inside all sorts of ancestors across the admin (most commonly a
          // table wrapped in overflow-x-auto/overflow-hidden, for the
          // horizontal-scroll-on-mobile pattern used everywhere lists are).
          // A plain `fixed` child gets clipped to the nearest overflow:hidden
          // ancestor's box in every browser — the backdrop only dimmed that
          // table's own rectangle, so a row's own text right at the boundary
          // showed through un-dimmed instead of the overlay covering the
          // whole viewport. Escaping the DOM tree via the portal sidesteps
          // that entirely, regardless of where this button is used.
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={close}
          >
            <div
              className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-display text-lg text-brand-navy">Delete {itemLabel}?</p>
              <p className="mt-2 text-sm text-slate-500">This can&apos;t be undone.</p>

              {requireTypedConfirmation && (
                <div className="mt-4">
                  <label className="block text-sm text-slate-600 mb-1">
                    Type <span className="font-mono font-semibold text-slate-900">{requireTypedConfirmation}</span> to confirm
                  </label>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoFocus
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                  />
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm || pending}
                  className="rounded px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default DeleteButton;
