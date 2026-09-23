import type { NextConfig } from "next";

const cloudfrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

const nextConfig: NextConfig = {
  // Lets deploy.sh build into a throwaway directory (NEXT_DIST_DIR=.next-new)
  // instead of overwriting the live `.next` in place while the old process
  // is still serving from it — see deploy.sh's own comment for the full
  // reasoning. `next start` always runs with this unset, so it always reads
  // the default `.next` — only the build step ever sets it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
