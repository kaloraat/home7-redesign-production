# Home7 Next.js — Setup

Read `PROJECT_BRIEF.md` and `home7-url-inventory-and-migration-notes.md` in this same
folder before making any scope decisions — they're the north star for this rebuild.

## Stack

Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS v4, MongoDB via Mongoose,
Auth.js v5 (Credentials provider) for the admin login.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI at minimum
npx auth secret               # should write AUTH_SECRET into .env.local
SEED_ADMIN_PASSWORD=changeme npm run seed   # creates admin@home7.com.au + sample data
npm run dev
```

The variable this project reads is **`AUTH_SECRET`**. On some machines `npx auth secret`
resolves to an unrelated package and writes `BETTER_AUTH_SECRET` instead — if that
happens, just rename the key in `.env.local` to `AUTH_SECRET` (the random value itself
is fine to reuse, no need to regenerate).

Admin dashboard: http://localhost:3000/admin/login — sign in with the seeded admin
account.

## Architecture decisions worth knowing before extending this

**Server Actions vs. a dedicated API — this project uses both, deliberately:**

- `src/actions/*.ts` (Server Actions) handle admin form submissions — creating and
  editing properties, agents, content. These are same-app, form-triggered mutations
  with no need for an external caller, so a Server Action is less code than a hand-
  rolled API route + fetch call, and you get CSRF protection for free. This is what
  keeps the admin "simple" as more CRUD gets added.
- `src/app/api/*` (Route Handlers) exist for anything that needs to be called from
  *outside* this app's own React tree: `POST /api/leads` is what public forms submit
  to (and could later be hit by a separate landing page or ad-platform integration);
  `GET /api/feed/reaxml` and `POST /api/webhooks/property-management` are placeholders
  for realestate.com.au/domain.com.au portal syndication and property-management-system
  webhooks — both patterns the old site's "partners" section (Inspection Manager, MRI)
  suggest will matter eventually. Server Actions cannot serve any of these callers;
  they're React-only RPC, not a stable public contract.

Rule of thumb going forward: if the caller is a form inside this app's own admin UI,
use a Server Action. If the caller is or might ever be something else, use a Route
Handler under `/api`.

**Content model:** blog posts and the old site's root-level SEO landing pages
(`/{slug}` with no `/blog/` prefix — see the URL inventory notes) share one `Content`
model, distinguished by `urlPath: "blog" | "root"`. This mirrors what's actually on
the live site instead of forcing everything under `/blog/`.

**Redirects:** the `Redirect` model plus the `/[slug]` catch-all route is where legacy
URL quirks (mixed-case old property slugs, the old site's duplicate blog/root URLs)
get resolved without a code deploy — add a row, not a route.

## Images: S3 + CloudFront setup checklist

Property/agent photos live in S3, served through CloudFront, not committed to this repo
or dumped in `/public` — the old site's export alone is 3,008 files / 338MB, and that
only grows. `next/image` is already wired up against this (see `PropertyCard.tsx`,
`property/[slug]/page.tsx`) via `images.remotePatterns` in `next.config.ts`.

To finish the setup (AWS Console, one-time):

1. Create an S3 bucket (e.g. `home7-property-images`), block public ACLs, keep it
   private — CloudFront will access it via Origin Access Control, not public bucket
   policy.
2. Create a CloudFront distribution with that bucket as the origin, Origin Access
   Control enabled, and caching optimized for static images.
3. Create an IAM user (or role) with a policy scoped to `s3:PutObject` on just that
   bucket — not full S3 access. Generate an access key for it.
4. Fill in `.env.local`: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_CLOUDFRONT_DOMAIN` (the CloudFront
   distribution's domain, or a custom domain mapped to it — e.g. `cdn.home7.com.au`).

Once that's done:

- New uploads: the admin property form's image picker
  (`src/components/admin/ImageUploader.tsx`) resizes and re-encodes each photo in the
  browser first — capped at 2000px on the long edge, WebP at ~88% quality, skipped for
  files already under 300KB — then calls `POST /api/admin/upload` for a presigned S3
  URL and PUTs the compressed file directly to S3 (never through our server, and never
  the raw original). The resulting CloudFront URL is what gets saved on the property
  record. This keeps storage/egress costs down and avoids slow cold-cache page loads
  from `next/image` having to fetch and decode an oversized original on first request.
- Migrating the old site's images: `npx tsx scripts/upload-images-to-s3.ts
  <path-to-extracted-media-uploader-folder>` bulk-uploads the originals (skipping the
  old site's `thumb-`/`grid-` pre-generated variants — `next/image` does that job
  on-demand now, no need to carry the old multi-file-per-photo approach forward) and
  writes `legacy-image-url-map.json` mapping old filenames to new CloudFront URLs, for
  the property import script to rewrite references against.

## Migrating the real Laravel data

`scripts/migrate-laravel-data.ts` imports the real data pulled from the old
site's database export — 7 agents, ~150 properties, 30 blog posts, and 18
root-level SEO pages (the `other_blogs` table) — preserving every existing
slug so no URLs break. Source JSON lives in `scripts/data/laravel-export/`
(already in the repo, no need to regenerate).

```bash
npx tsx scripts/migrate-laravel-data.ts
```

Idempotent (upserts by slug + urlPath), so it's safe to re-run whenever a
fresher export comes in. It logs any properties it couldn't parse an
address out of.

Properties carry a 5th `listingType`, `"other"` — off-market/land/
development listings, shown only on `/other-properties` and excluded from
`/properties` and `/properties-for-sale`, matching the live Laravel site's
own behavior (confirmed in `FrontendController.php`).

A handful of slugs (e.g. `real-estate-in-liverpool`) legitimately exist as
both a blog post and a root page on the live site — `Content`'s uniqueness
is `(slug, urlPath)`, not `slug` alone, so both import without conflict.

Property/agent photos are hotlinked from `home7.com.au` as an interim
measure (`next.config.ts` allows that hostname) until
`scripts/upload-images-to-s3.ts` migrates the full image set to CloudFront.

**Not migrated yet:** the 16 `other_blogs` root-level pages the developer is
still tracking down, and the site-wide copy in `static_options` (About Us
copy, home page section text) — that's already hand-matched into the
relevant pages from the same source data, verified word-for-word against the
DB during this pass except one live-site typo ("Achivement" → "Achievement",
already corrected here).

## Not done yet (by design — see PROJECT_BRIEF.md phasing)

- Design is intentionally minimal/unstyled beyond basic Tailwind — the brief is to
  match the current site's look before improving it, not to design from scratch here.
- Rich text editor for Content and full property fields (floorplans, virtual tour
  links) aren't built yet.
- The AI blog-generation pipeline (Claude API) is deliberately not wired up — Phase 4.
- Portal syndication feed and inbound PM-system webhooks are stubbed (501) only.
