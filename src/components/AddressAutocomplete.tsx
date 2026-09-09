"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, onGoogleMapsAuthFailure } from "@/lib/googleMapsLoader";

// No @types/google.maps package is installed — these are minimal local
// types covering only the exact surface used below, rather than pulling in
// a new dependency for what's currently an experimental first pass at this
// integration. PlaceAutocompleteElement is typed as a plain HTMLElement
// (not a custom interface extending it) — extending HTMLElement with a
// narrower addEventListener("gmp-select", ...) overload conflicts with its
// own built-in overloaded signature; the "gmp-select" event's real payload
// shape is asserted at the listener callback instead, the standard pattern
// for a custom DOM event lib.dom.d.ts has no built-in type for.
interface GooglePlace {
  formattedAddress?: string;
  fetchFields(options: { fields: string[] }): Promise<void>;
}

interface GmpSelectEvent {
  placePrediction: { toPlace(): GooglePlace; text?: { text: string } };
}

interface PlacesLibrary {
  PlaceAutocompleteElement: new () => HTMLElement;
}

interface GoogleMapsGlobal {
  maps: { importLibrary(name: "places"): Promise<PlacesLibrary> };
}

/**
 * Drop-in replacement for a plain `<input name="address">` — same form
 * field name, so ContactForm's existing FormData-based submit handler needs
 * no changes. Uses google.maps.places.PlaceAutocompleteElement (the current
 * Places API — "New"), not the older google.maps.places.Autocomplete class:
 * this Cloud project can't even enable Places API (Legacy) on a new
 * project, so the old widget isn't an option here regardless of preference.
 *
 * Until the script has loaded, a plain text input (same name) is shown
 * instead — real fallback, not just a loading flicker: if the script fails
 * (network issue, ad blocker, revoked key), the field still works as an
 * ordinary optional text field rather than disappearing.
 */
export function AddressAutocomplete({ name = "address" }: { name?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) {
      console.error("AddressAutocomplete bailed before loading:", {
        hasApiKey: !!apiKey,
        hasContainer: !!containerRef.current,
      });
      return;
    }

    let cancelled = false;
    let element: HTMLElement | null = null;

    // See googleMapsLoader.ts — an auth/referrer failure doesn't throw or
    // reject, so without this the widget can end up mounted-but-silently-
    // nonfunctional (no suggestions ever appear) instead of falling back
    // to the plain input below.
    const unsubscribe = onGoogleMapsAuthFailure(() => {
      if (!cancelled) setReady(false);
    });

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const google = (window as unknown as { google: GoogleMapsGlobal }).google;
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

        const autocomplete = new PlaceAutocompleteElement();
        // The whole business operates exclusively in Australia — no
        // legitimate reason for this to ever suggest an overseas address.
        // includedRegionCodes takes CLDR two-character region codes;
        // verified against Google's own current docs (settable as either a
        // constructor option or, as here, a plain property on the
        // instance) before relying on it, not assumed from training data.
        (autocomplete as unknown as { includedRegionCodes: string[] }).includedRegionCodes = ["au"];
        // The element sets its own `color-scheme: light dark` internally
        // (confirmed via getComputedStyle), which is why it follows the
        // OS/browser dark-mode preference regardless of `color-scheme:
        // light` on :root — that inherited value never reaches it. An
        // inline style here has higher specificity than the component's own
        // internal :host rule, so it actually overrides it.
        autocomplete.style.colorScheme = "light";
        // The element ships with no border of its own, unlike the other
        // form fields' `border-slate-300` — it was blending into the page.
        // The wrapping div below now carries that same border/padding
        // treatment instead, so this element just needs to sit flush inside
        // it (full width, no border/padding of its own to avoid doubling up).
        autocomplete.style.width = "100%";
        autocomplete.setAttribute("placeholder", "Your Address");
        // Hides the built-in search-icon — documented attribute per Google's
        // reference (reflects the noInputIcon IDL property). The input
        // text/placeholder itself is styled to match the sibling fields via
        // the ::part(input) rule in globals.css (a shadow-DOM part Google
        // explicitly exposes for this), not attempted here.
        autocomplete.setAttribute("no-input-icon", "");
        containerRef.current.appendChild(autocomplete);
        element = autocomplete;

        // Confirmed real bug: `address` state previously only ever updated
        // inside "gmp-select" below — if someone types a real address but
        // never actually clicks a dropdown suggestion (ignores it, or
        // types something the widget has no match for), the hidden field
        // stayed permanently empty and their typed text was silently
        // dropped from both the email notification and the DB record.
        // Verified live via Playwright: typed a full custom address with
        // real keystrokes, never selected anything, hidden field read ""
        // both immediately after and after blurring away. `.value` (a
        // real, documented property on this element — verified against
        // Google's own current reference, part of the
        // PlaceAutocompleteElementOptions interface it implements) reads
        // back whatever text is actually in the box right now, selected
        // or not — syncing it on blur (fires reliably on the host element
        // for a focusable custom element, including e.g. when focus moves
        // to the Submit button) means whatever was typed is captured
        // either way, not just a formally "selected" prediction.
        autocomplete.addEventListener("blur", () => {
          const current = (autocomplete as unknown as { value?: string }).value;
          if (current) setAddress(current);
        });

        autocomplete.addEventListener("gmp-select", (async (event: Event) => {
          const { placePrediction } = event as unknown as GmpSelectEvent;
          // Prefer the PREDICTION's own full text over the resolved
          // place's formattedAddress — found via building the admin
          // Property form's address autocomplete that Google's resolved
          // place record can genuinely drop a unit/apartment number for a
          // real, valid address (confirmed live: "97/1 Browne Parade"
          // resolved to a place whose own formattedAddress came back as
          // just "Browne Parade, Warwick Farm NSW 2170, Australia", unit
          // number silently gone) even though the dropdown itself showed
          // the correct full text. This is the exact text the person saw
          // and clicked, which is what should end up in the field —
          // falling back to the resolved place only if that's ever absent.
          const predictionText = placePrediction.text?.text;
          if (predictionText) {
            setAddress(predictionText);
            return;
          }
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          setAddress(place.formattedAddress ?? "");
        }) as EventListener);

        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        // Leave `ready` false — the plain-input fallback below stays shown.
        // Logged (not silent) so a real failure here is actually visible
        // instead of just looking identical to "the key isn't set yet".
        console.error("AddressAutocomplete failed to initialize:", err);
      });

    return () => {
      cancelled = true;
      unsubscribe();
      element?.remove();
    };
  }, []);

  return (
    <div>
      {!ready && (
        <input
          name={name}
          type="text"
          placeholder="Your Address"
          className="w-full border border-slate-300 rounded px-3 py-2.5 text-xl bg-white"
        />
      )}
      <div
        ref={containerRef}
        className={
          ready
            ? "block w-full border border-slate-300 rounded bg-white [&_gmp-place-autocomplete]:block"
            : "hidden"
        }
      />
      {ready && <input type="hidden" name={name} value={address} />}
    </div>
  );
}

export default AddressAutocomplete;
