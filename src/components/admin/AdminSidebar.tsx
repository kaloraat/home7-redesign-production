"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { PanelToggleIcon, SignOutIcon } from "@/components/admin/icons";
import MeshBackground from "@/components/MeshBackground";
import {
  MESH_NAVY_BASE,
  MESH_GLOW_BRIGHT_BLUE,
  MESH_GLOW_LIGHT_BLUE,
  ADMIN_BUTTON_GRADIENT,
  ADMIN_ACCENT_BLUE,
} from "@/lib/constants";

// Matches Tailwind's own `lg` breakpoint — "small screen" here means the
// same place every other responsive choice on this site switches.
const COLLAPSE_BREAKPOINT = 1024;
const STORAGE_KEY = "admin-sidebar-collapsed";
// No native browser event fires when THIS tab writes to its own
// localStorage (the "storage" event only fires in *other* tabs/windows) —
// dispatched manually after toggle() writes, so useSyncExternalStore's
// subscribe callback (and therefore a re-render) actually fires here too.
const CHANGE_EVENT = "admin-sidebar-collapsed-change";

function readStoredPreference(): boolean | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

// The collapsed/expanded value at this instant: the user's own explicit
// choice if they've ever toggled (persisted, so it wins over anything
// else — including a later resize), otherwise purely a function of the
// current viewport width. Read fresh on every call rather than cached in
// React state, which is what lets a plain "resize" event be enough to
// re-derive the right answer with no extra bookkeeping for "was this
// auto or manual" — that's implicit in whether localStorage has a value.
function getSnapshot(): boolean {
  const stored = readStoredPreference();
  if (stored !== null) return stored;
  return window.innerWidth < COLLAPSE_BREAKPOINT;
}

// The server can't know the visitor's real viewport width or localStorage,
// so it always renders expanded — matching what an unresolved client's
// FIRST paint must also show (see the hook call below) to avoid a
// hydration mismatch. Any small-screen visitor sees this correct itself
// to collapsed within the same effect pass useSyncExternalStore already
// performs post-hydration, same as any other viewport-dependent UI.
function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/**
 * The admin shell's sidebar — previously plain markup inside the (Server
 * Component) layout, now its own Client Component so it can track
 * collapsed/expanded state: auto-collapses to an icon-only rail on a small
 * screen, with a toggle to see the full labeled version regardless of
 * screen size. State lives in localStorage + viewport width via
 * useSyncExternalStore rather than component state, specifically so a
 * manual toggle persists across reloads and a plain window resize is
 * enough to pick the right default when the user hasn't chosen yet.
 */
export function AdminSidebar({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    try {
      localStorage.setItem(STORAGE_KEY, String(!isCollapsed));
    } catch {
      // Private-browsing/storage-blocked — the CHANGE_EVENT dispatch below
      // still flips the visible state for this page load, it just won't
      // persist across a reload.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <aside
      className={`${
        isCollapsed ? "w-18" : "w-64"
      } shrink-0 border-r border-slate-200 bg-white flex flex-col transition-[width] duration-200`}
    >
      <div
        className={`flex items-center border-b border-slate-100 py-6 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!isCollapsed && (
          // Two-segment pill (like an iOS/macOS segmented control) instead
          // of a separate icon-badge + text — "Home7" goes to the public
          // homepage, "Admin" stays on /admin and reads as the currently
          // "selected" segment, now the same blurred-blue-mesh + gradient
          // pill look as AdminPageHeader/BrandStory (MESH_* constants),
          // instead of a plain white/slate segmented control. Still reads
          // as a brand/header name (font-display), just in a pill rather
          // than plain text next to an icon.
          <div
            className="relative inline-flex items-center overflow-hidden rounded-full p-1 font-display text-base font-semibold"
            style={{ backgroundColor: MESH_NAVY_BASE }}
          >
            <MeshBackground
              blobs={[
                { className: "-left-3 -top-4 h-10 w-14 opacity-90 blur-md", color: MESH_GLOW_BRIGHT_BLUE },
                { className: "-right-3 -bottom-4 h-9 w-12 opacity-60 blur-md", color: MESH_GLOW_LIGHT_BLUE },
              ]}
            />
            <Link
              href="/"
              title="Visit the Home7 website"
              className="relative rounded-full px-3 py-1.5 text-white/60 transition-colors hover:text-white cursor-pointer"
            >
              Home7
            </Link>
            <Link
              href="/admin"
              title="Admin dashboard"
              className="relative rounded-full px-3 py-1.5 text-white shadow-sm cursor-pointer"
              style={{
                background: ADMIN_BUTTON_GRADIENT,
                boxShadow: `0 4px 12px -4px ${ADMIN_ACCENT_BLUE}99`,
              }}
            >
              Admin
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-brand-navy transition-colors cursor-pointer"
        >
          <PanelToggleIcon size={18} className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <AdminNav collapsed={isCollapsed} />
      </div>

      <div className={`border-t border-slate-100 py-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        {!isCollapsed && <p className="text-xs text-slate-400 truncate mb-2">{userEmail}</p>}
        <form action={signOutAction}>
          <button
            title={isCollapsed ? "Sign out" : undefined}
            aria-label={isCollapsed ? "Sign out" : undefined}
            className={`flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-navy transition-colors cursor-pointer ${
              isCollapsed ? "w-full justify-center" : ""
            }`}
          >
            <SignOutIcon size={14} />
            {!isCollapsed && "Sign out"}
          </button>
        </form>
      </div>
    </aside>
  );
}

export default AdminSidebar;
