/**
 * Builds a key-less Google Maps embed URL for a plain address string — no
 * API key or GCP billing required (unlike the Maps Embed API), and no
 * setup risk from depending on whether "Maps Embed API" happens to be
 * enabled for the project's existing Maps key. Verified live: resolves
 * (301 → 200) into `google.com/maps/embed?...pb=...`, the same embed
 * family the manually-set URLs already use — a real interactive map with
 * a marker at the given address, not a placeholder.
 *
 * Used as the automatic fallback for a property's "Location" map when no
 * manually-set `mapEmbedUrl` override exists — the case for most new
 * listings going forward. The ~147/153 migrated listings that already
 * have a manually-set `mapEmbedUrl` came from Google Maps' own
 * "Share > Embed a map" UI, which produces a differently-shaped (but
 * functionally equivalent) URL keyed to an internal place ID rather than
 * a plain address — not something reconstructable from an address string
 * alone, which is why this is a fallback rather than a drop-in
 * replacement for those existing values.
 */
export function buildMapEmbedUrl(fullAddress: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
}
