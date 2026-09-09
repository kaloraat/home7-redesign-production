"use client";

import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/constants";
import { loadGoogleMaps, onGoogleMapsAuthFailure } from "@/lib/googleMapsLoader";

// No @types/google.maps package is installed — see AddressAutocomplete.tsx
// for why; same minimal-local-types approach here, covering only the Map/
// Marker/InfoWindow surface actually used.
type LatLngLiteral = { lat: number; lng: number };
type GoogleMap = object;
type GoogleMarker = object;

interface MapsLibrary {
  Map: new (el: HTMLElement, opts: { center: LatLngLiteral; zoom: number; minZoom?: number }) => GoogleMap;
  InfoWindow: new (opts: { content: string }) => {
    open(opts: { map: GoogleMap; anchor: GoogleMarker }): void;
  };
}

interface GoogleMapsGlobal {
  maps: {
    importLibrary(name: "maps"): Promise<MapsLibrary>;
    Marker: new (opts: { position: LatLngLiteral; map: GoogleMap; title: string }) => GoogleMarker;
  };
}

// Same coordinates the old iframe embed used (decoded from its pb= param:
// !2d150.9208817756947!3d-33.922678721851504) — Home7 Real Estate, Suite
// 1/209 Macquarie Street, Liverpool NSW.
const HOME7_LOCATION: LatLngLiteral = { lat: -33.922678721851504, lng: 150.9208817756947 };

const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `Home7 Real Estate, ${COMPANY.address}`
)}`;

// This used to be a Maps Embed API iframe (a `place`-mode embed showing
// Google's own business card — name, rating, address, Directions button —
// top-left, matching the live site's old free iframe exactly). That
// requires a separate "Maps Embed API" toggle in Cloud Console beyond the
// Places/Maps JavaScript/Geocoding APIs already enabled, and left the map
// broken until that one extra step was done. Reverted to the interactive
// JS map (Maps JavaScript API only, already enabled and already verified
// working) with a custom InfoWindow standing in for that business card —
// opened by default so it's visible immediately, not on click.
export function ContactMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) {
      console.error("ContactMap bailed before loading:", {
        hasApiKey: !!apiKey,
        hasContainer: !!containerRef.current,
      });
      setFailed(true);
      return;
    }

    let cancelled = false;

    const unsubscribe = onGoogleMapsAuthFailure(() => {
      if (!cancelled) setFailed(true);
    });

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const google = (window as unknown as { google: GoogleMapsGlobal }).google;
        const { Map, InfoWindow } = await google.maps.importLibrary("maps");

        const map = new Map(containerRef.current, {
          center: HOME7_LOCATION,
          zoom: 15,
          // Zooming/panning an already-loaded map is free — Google bills
          // per map load (once, on page load), not per interaction — so
          // this isn't a cost control. It's a UX floor only: stops a
          // visitor zooming out past South West Sydney into a useless
          // world view. Full zoom-in is left uncapped.
          minZoom: 10,
        });

        const marker = new google.maps.Marker({
          position: HOME7_LOCATION,
          map,
          title: "Home7 Real Estate",
        });

        const infoWindow = new InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 2px; max-width: 220px;">
              <p style="margin: 0 0 4px; font-weight: 700; font-size: 14px;">Home7 Real Estate</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #444;">${COMPANY.address}</p>
              <a href="${DIRECTIONS_URL}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; color: #1a73e8; text-decoration: none;">Directions</a>
            </div>
          `,
        });
        infoWindow.open({ map, anchor: marker });
      })
      .catch((err) => {
        console.error("ContactMap failed to initialize:", err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (failed) {
    return (
      <div className="flex h-112.5 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        The map couldn&apos;t be loaded.
      </div>
    );
  }

  return <div ref={containerRef} className="h-112.5 w-full" />;
}

export default ContactMap;
