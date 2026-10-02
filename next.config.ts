import type { NextConfig } from "next";

const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

const nextConfig: NextConfig = {
  // Lets a build go to a throwaway directory (NEXT_DIST_DIR=.next-check)
  // without touching `.next` — used for test builds. `next start` always
  // runs with this unset, so it always reads the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Deploys on the droplet run `SKIP_BUILD_TYPECHECK=1 npm run build`: a full type check
  // ran Node out of heap there ("JavaScript heap out of memory" during
  // "Running TypeScript", 2026-10-02, 2GB box). Types are still checked on
  // every change before it's committed (`npx tsc --noEmit`), so the server
  // build doesn't need to repeat it. Local builds keep checking.
  typescript: {
    ignoreBuildErrors: process.env.SKIP_BUILD_TYPECHECK === "1",
  },
  images: {
    remotePatterns: [
      // Property/agent/blog photos, served through CloudFront in front of
      // S3. Falls back to a harmless placeholder pattern when the env var
      // isn't set yet (e.g. fresh checkout, CI) so `next build` doesn't fail.
      //
      // The old home7.com.au hotlink host was removed once
      // upload-images-to-s3.ts + repoint-images-to-cloudfront.ts +
      // migrate-remaining-hotlinks.ts finished migrating every image —
      // deliberately, so any image still referencing the old host now fails
      // to load instead of silently working, making leftovers easy to spot.
      {
        protocol: "https",
        hostname: cloudfrontDomain || "images.example.invalid",
      },
    ],
  },
};

export default nextConfig;
