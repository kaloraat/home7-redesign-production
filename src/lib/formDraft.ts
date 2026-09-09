"use client";

/**
 * Generic localStorage-backed draft autosave for a *create* form — so a
 * page reload, an accidental back-navigation, or coming back later doesn't
 * lose what was already typed in. Deliberately only ever wired up on create
 * forms, never edit ones: an edit form's already-saved DB record is the
 * real source of truth there, and silently overlaying a stale local draft
 * on top of it would risk clobbering a real edit rather than helping.
 *
 * Reads/writes via `new FormData(form)`, so it captures whatever the form
 * would actually submit — including subcomponents that expose their state
 * through a hidden input (address autocomplete, land size, images, rich
 * text) — without needing to know each field's own internal shape.
 */
export function saveFormDraft(key: string, form: HTMLFormElement) {
  try {
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage can throw (private browsing, storage full/disabled) —
    // autosave is a convenience, never something a save should fail over.
  }
}

export function loadFormDraft(key: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearFormDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing meaningful to do if this fails — worst case a stale draft
    // lingers until it's overwritten by the next autosave tick anyway.
  }
}
