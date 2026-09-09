"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, onGoogleMapsAuthFailure } from "@/lib/googleMapsLoader";

// Same underlying widget as the public AddressAutocomplete.tsx (see that
// file's own comments for why PlaceAutocompleteElement — the "New" Places
// API — rather than the older Autocomplete class), but that component only
// ever fetches `formattedAddress` (one combined string), which is right
// for a single "address" form field but wrong here: Property stores
// address/suburb/postcode as separate fields (used separately all over —
// breadcrumbs, schema, the map embed fallback, page headers), so this
// fetches `addressComponents` instead and parses street number + route,
// locality, and postal code out of it individually. Verified the exact
// field shape (types/longText/shortText) and standard type strings
// (street_number/route/locality/postal_code) against Google's own current
// docs before relying on them, not assumed from training data.
interface AddressComponent {
  types: string[];
  longText: string;
  shortText: string;
}

interface GooglePlace {
  addressComponents?: AddressComponent[];
  formattedAddress?: string;
  fetchFields(options: { fields: string[] }): Promise<void>;
}

interface GmpSelectEvent {
  placePrediction: { toPlace(): GooglePlace; mainText?: { text: string } };
}

interface PlacesLibrary {
  PlaceAutocompleteElement: new () => HTMLElement;
}

interface GoogleMapsGlobal {
  maps: { importLibrary(name: "places"): Promise<PlacesLibrary> };
}

function findComponent(components: AddressComponent[], type: string): string | undefined {
  return components.find((c) => c.types.includes(type))?.longText;
}

/**
 * The Address fieldset for the admin Property form — a Google-powered
 * search box that auto-fills the three real, always-editable fields below
 * it (street address / suburb / postcode) when the admin picks a
 * suggestion. The three fields are genuine form inputs the whole time
 * (same `name`s the rest of the form/server action already expects) —
 * autocomplete is a convenience for filling them fast, not a replacement
 * for them; manually typing or correcting any of them afterward works
 * exactly as before.
 */
export function PropertyAddressFields({
  defaultAddress,
  defaultSuburb,
  defaultPostcode,
}: {
  defaultAddress?: string;
  defaultSuburb?: string;
  defaultPostcode?: string;
}) {
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [suburb, setSuburb] = useState(defaultSuburb ?? "");
  const [postcode, setPostcode] = useState(defaultPostcode ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) {
      console.error("PropertyAddressFields bailed before loading:", {
        hasApiKey: !!apiKey,
        hasContainer: !!containerRef.current,
      });
      return;
    }

    let cancelled = false;
    let element: HTMLElement | null = null;

    const unsubscribe = onGoogleMapsAuthFailure(() => {
      if (!cancelled) setReady(false);
    });

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const google = (window as unknown as { google: GoogleMapsGlobal }).google;
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

        const autocomplete = new PlaceAutocompleteElement();
        // Every listing is in Australia — no reason to ever suggest an
        // overseas address here. Same property, same verified-against-
        // Google's-current-docs approach as AddressAutocomplete.tsx.
        (autocomplete as unknown as { includedRegionCodes: string[] }).includedRegionCodes = ["au"];
        autocomplete.style.colorScheme = "light";
        autocomplete.style.width = "100%";
        autocomplete.setAttribute("placeholder", "Search for an address to auto-fill the fields below…");
        autocomplete.setAttribute("no-input-icon", "");
        containerRef.current.appendChild(autocomplete);
        element = autocomplete;

        autocomplete.addEventListener("gmp-select", (async (event: Event) => {
          const { placePrediction } = event as unknown as GmpSelectEvent;
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["addressComponents"] });
          const components = place.addressComponents ?? [];

          // Some AU addresses carry the suburb as "locality", others as a
          // sublocality — checked in that order, first match wins.
          const suburbComponent =
            findComponent(components, "locality") ||
            findComponent(components, "sublocality_level_1") ||
            findComponent(components, "sublocality");
          const postal = findComponent(components, "postal_code");

          // The street portion deliberately comes from the PREDICTION's own
          // mainText, not from the resolved place at all (addressComponents
          // or formattedAddress) — confirmed via two live debug dumps that
          // Google's resolved place record for a real unit address
          // ("97/1 Browne Parade") can genuinely omit the unit number from
          // BOTH addressComponents (no subpremise/street_number, only a
          // bare "route") AND formattedAddress ("Browne Parade, Warwick
          // Farm NSW 2170, Australia") — a real gap in the resolved place's
          // own data, not a parsing bug. The prediction's mainText is what
          // the dropdown actually displayed to the person who clicked it
          // ("97/1 Browne Parade"), which is the text that's actually
          // correct here.
          const streetPart = placePrediction.mainText?.text;
          if (streetPart) setAddress(streetPart);
          if (suburbComponent) setSuburb(suburbComponent);
          if (postal) setPostcode(postal);
        }) as EventListener);

        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.error("PropertyAddressFields failed to initialize:", err);
      });

    return () => {
      cancelled = true;
      unsubscribe();
      element?.remove();
    };
  }, []);

  return (
    <>
      <div>
        {ready && (
          <label className="block text-sm text-slate-600 mb-1">
            Search for an address — auto-fills the fields below
          </label>
        )}
        <div
          ref={containerRef}
          // admin-address-autocomplete: scopes the smaller ::part(input)
          // override in globals.css to just this context — the public
          // AddressAutocomplete.tsx's own text-xl sizing (this same
          // widget, different form) stays untouched.
          className={
            ready
              ? "admin-address-autocomplete block w-full border border-slate-300 rounded bg-white [&_gmp-place-autocomplete]:block"
              : "hidden"
          }
        />
      </div>

      <input
        name="address"
        placeholder="Street address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          name="suburb"
          placeholder="Suburb"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
        <input
          name="postcode"
          placeholder="Postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          required
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        />
      </div>
    </>
  );
}

export default PropertyAddressFields;
