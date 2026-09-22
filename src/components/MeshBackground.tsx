/**
 * The blurred-blue-patches background used on admin headers, the admin
 * sidebar's Home7/Admin pill, and BrandStory on the public homepage —
 * matching the REB Dealmakers 2026 promo card the client sent as a design
 * reference (see MESH_* constants in lib/constants.ts for where the colors
 * came from). Each caller passes its own `blobs` since the right sizes/
 * positions differ a lot between a 36px-tall pill and a full hero section —
 * only the rendering pattern (absolute, blurred, rounded divs) is shared.
 *
 * Blur strength is part of each blob's own className (not hardcoded here)
 * because it doesn't scale down with the container: a small pill needs a
 * much lighter blur (e.g. blur-xl) than a full-size banner (blur-3xl), or
 * the same fixed-radius blur just washes a small blob out into flat color
 * and the patches stop being visible at all.
 */
export function MeshBackground({
  blobs,
}: {
  blobs: { className: string; color: string }[];
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${blob.className}`}
          style={{ backgroundColor: blob.color }}
        />
      ))}
    </div>
  );
}

export default MeshBackground;
