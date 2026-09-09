"use client";

import { useEffect, useRef, useState } from "react";
import { saveFormDraft, loadFormDraft, clearFormDraft } from "@/lib/formDraft";

/**
 * Shared create-form draft autosave — saves the whole form to localStorage
 * every 2s (plus once more, synchronously, right as the tab is hidden or
 * about to unload — see below) and restores it after a reload/coming back
 * later, until the form is actually submitted. Used by both PropertyForm
 * and ContentForm
 * (blog); extracted here rather than duplicated once a second form needed
 * the exact same behavior.
 *
 * Deliberately create-only (`isCreate`) — an edit form's already-saved DB
 * record is the real source of truth; overlaying a stale local draft on
 * top of it risks clobbering a real edit rather than helping.
 *
 * `mapRawToDefaults` converts the raw `{fieldName: string}` FormData
 * snapshot back into whatever shape the calling form's own `defaultValues`
 * prop expects — each form owns that mapping since the fields differ.
 */
export function useDraftAutosave<T>(
  key: string,
  isCreate: boolean,
  mapRawToDefaults: (raw: Record<string, string>) => T
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Starts null so the very first render (server, and the client's
  // hydration-matching first render) has no draft, matching server output
  // exactly — the effect below then loads any saved draft, exactly once,
  // right after mount.
  //
  // This intentionally does NOT read localStorage via useSyncExternalStore
  // on every render (the usual suggestion for avoiding a "setState in an
  // effect" lint warning) — that caused a real bug here: the autosave
  // effect below writes to localStorage a couple of seconds after mount,
  // and a live-reading snapshot picks that up as "a draft just appeared,"
  // triggering a remount of the whole form mid-session and wiping out
  // whatever was already filled in. A plain effect with an empty
  // dependency array reads localStorage exactly once, at mount, and never
  // reacts to this same session's own later writes to it.
  const [draftValues, setDraftValues] = useState<T | null>(null);
  useEffect(() => {
    if (!isCreate) return;
    const raw = loadFormDraft(key);
    if (raw && Object.keys(raw).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only load, see comment above
      setDraftValues(mapRawToDefaults(raw));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polls on an interval rather than wiring a change handler to every
  // field — several fields (rich text, image gallery, land size) only
  // expose their value through a hidden input that React updates
  // programmatically, which never fires a native input/change event for a
  // form-level listener to catch in the first place. Reading the live DOM
  // via FormData every couple of seconds is simple and catches all of
  // them uniformly.
  useEffect(() => {
    if (!isCreate) return;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      if (!formRef.current) return;
      saveFormDraft(key, formRef.current);
      setShowSavedIndicator(true);
      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setShowSavedIndicator(false), 900);
    }, 2000);
    return () => {
      clearInterval(interval);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isCreate, key]);

  // The interval above leaves a real gap: something that just finished
  // (an image upload completing, a checkbox flip) can sit unsaved for up
  // to ~2s — if the admin reloads inside that window (e.g. uploads a
  // photo, then reloads right away to check something), it's genuinely
  // not in localStorage yet, so it doesn't come back. Reported by the
  // user after images specifically went missing on reload while typed
  // text survived — text fields getting *some* earlier tick made it look
  // saved, the just-added image just hadn't hit a tick yet. Rather than
  // shortening the interval (still just narrows the window, doesn't close
  // it), save synchronously the moment the tab is actually about to leave
  // — localStorage.setItem is synchronous, so this reliably lands before
  // a reload/close/navigate-away completes. visibilitychange (fires on a
  // tab switch or reload alike) is the primary hook; beforeunload is a
  // second one for browsers/cases where that doesn't fire in time.
  useEffect(() => {
    if (!isCreate) return;
    function saveNow() {
      if (formRef.current) saveFormDraft(key, formRef.current);
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") saveNow();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", saveNow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", saveNow);
    };
  }, [isCreate, key]);

  function clearDraftOnSubmit() {
    // Native required-field validation has already passed by the time
    // onSubmit fires, so a server-side validation failure past this point
    // is the rare exception rather than the normal path — acceptable
    // trade-off against the complexity of only clearing after a
    // *confirmed* successful save (the server action redirects on
    // success, which a form component can't distinguish from a thrown
    // validation error without reaching into Next's internals).
    if (isCreate) clearFormDraft(key);
  }

  return { formRef, draftValues, showSavedIndicator, clearDraftOnSubmit };
}
