"use client";

// Shared by AddressAutocomplete and ContactMap — both need
// google.maps.importLibrary available, and ContactForm (which renders
// AddressAutocomplete) can be mounted more than once on the same page (the
// blog sidebar form, the mobile inline copy, and the FAB modal all exist in
// the DOM simultaneously). A module-level `installed` flag means the
// bootstrap loader is only ever injected once, no matter how many
// components ask for it.
let installed = false;
const authFailureListeners = new Set<() => void>();

/**
 * A misconfigured/restricted key (e.g. the current origin isn't in the
 * key's allowed HTTP referrers) does NOT reject anything or throw a
 * catchable exception — Google instead reports it by calling a global
 * `window.gm_authFailure()` callback (if defined) and logging to the
 * console. Register a listener here to actually surface that failure
 * instead of leaving the UI blank with no explanation.
 */
export function onGoogleMapsAuthFailure(listener: () => void): () => void {
  authFailureListeners.add(listener);
  return () => authFailureListeners.delete(listener);
}

/**
 * Defines `google.maps.importLibrary`, which AddressAutocomplete and
 * ContactMap both call directly. This used to instead inject a plain
 * `<script src="https://maps.googleapis.com/maps/api/js?...">` tag — that
 * loads the classic API bundle and populates `google.maps.*` directly
 * (Map, Marker, places.Autocomplete all work), but it does NOT define
 * `google.maps.importLibrary` — that function is only ever set up by
 * Google's own "dynamic library import" bootstrap loader, a genuinely
 * different loading mechanism. Calling importLibrary without it throws
 * `TypeError: google.maps.importLibrary is not a function` — the actual
 * bug behind the address dropdown/map not working, found by adding
 * console.error logging and reading the real console output.
 *
 * Reproduced verbatim (not reimplemented) from Google's own docs —
 * https://developers.google.com/maps/documentation/javascript/load-maps-js-api
 * — since its callback/promise wiring is load-bearing for how the real
 * Maps script (loaded lazily on first importLibrary() call) reports back.
 */
function installBootstrapLoader(apiKey: string) {
  if (installed) return;
  installed = true;

  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    authFailureListeners.forEach((listener) => listener());
  };

  const script = document.createElement("script");
  script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await(a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})(${JSON.stringify({ key: apiKey, v: "weekly" })});`;
  document.head.appendChild(script);
}

/**
 * Ensures `google.maps.importLibrary` is defined. Callers (AddressAutocomplete,
 * ContactMap) then call `google.maps.importLibrary("places" | "maps")`
 * themselves — that call is what actually triggers the real network load,
 * lazily and only for the libraries actually requested.
 */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  installBootstrapLoader(apiKey);
  return Promise.resolve();
}
