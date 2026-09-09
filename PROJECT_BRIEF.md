# Home7 Real Estate — Rebuild Project Brief

This is the north star doc. Read this before making any architectural or scope
decision during the build. If a decision conflicts with something here, stop and
flag it rather than quietly drifting.

## Who this is for

Home7 Real Estate, Liverpool NSW (western Sydney). Currently built on Laravel.
Rebuilding on Next.js + Tailwind + MongoDB so the owner's team can manage it
themselves, iterate fast, and keep adding features over time.

## The one goal that outranks all others

**Local SEO lead generation.** The entire point of this rebuild is to generate leads
from property owners who want to sell or rent in western Sydney — not to win generic
"real estate" search terms (realestate.com.au / domain.com.au own those and always
will). The winnable fight is the Google Business Profile map pack and long-tail local
search across these target suburbs:

Liverpool (home base), Campbelltown, Blacktown, Parramatta, Oran Park, Leppington,
Austral, Castle Hill, Baulkham Hills, Penrith.

Every architectural decision, page template, and content structure should be evaluated
against: **does this help us rank and convert in these suburbs?** If a feature doesn't
serve that, it's lower priority than one that does, regardless of how interesting it
is to build.

## The one constraint that is non-negotiable

**Zero broken links.** The user has said this is 100% important, more than once.
Every URL currently indexed on home7.com.au must resolve on the new site — either as
the exact same working page, or a deliberate 301 redirect. Never let a URL 404 that
used to work. See `home7-url-inventory-and-migration-notes.md` for the full URL
pattern audit; the short version:

- Static pages replicate exactly: `/about-us`, `/properties-for-sale`,
  `/properties-for-rent`, `/sold-properties`, `/leased-properties`, `/properties`,
  `/other-properties`, `/open-for-inspection`, `/buyers-advisory`,
  `/free-market-appraisal` (with `?key=selling|renting|buying`), `/contact`,
  `/blog`, `/privacy-policy`, `/property-tenant-application-download`, `/agents`.
- Dynamic patterns: `/property/{slug}`, `/agent/{slug}`, `/blog/{slug}`, and a
  root-level `/{slug}` catch-all for the site's programmatic SEO landing pages
  (these have no `/blog/` prefix — easy to forget and accidentally 404).
- Known landmines: a few legacy property slugs use mixed case
  (`/property/514A-Browns-Road-Austral-NSW-2179`) — Next.js routing is
  case-sensitive, so these need explicit handling if we normalize new slugs to
  lowercase. At least one article is currently duplicated at two URLs
  (`/blog/best-suburbs-buy-property-liverpool-nsw` and
  `/best-suburbs-buy-property-liverpool-nsw`) — pick one canonical, 301 the other,
  don't carry the duplication forward.
- Before cutover: pull the definitive indexed-URL list from Google Search Console
  (more reliable than sitemap.xml) and diff-crawl staging vs. live. Keep the same
  domain and the same verified GSC property through the switch.

## Design

**Updated 2026-08-16 — plan changed from the original phasing below.** Design
improvement no longer waits for post-launch: the homepage is being redesigned now
(luxury/modern direction, competing on UX against realestate.com.au) as part of the
active build, ahead of full content/data migration. The zero-broken-links and
content-parity constraints still apply in full — a page being visually redesigned
must still preserve every indexed URL and not silently drop content that has SEO
value (verbatim copy like meta titles/descriptions, testimonials, H1s). Generic
template boilerplate (e.g. the old site's "Customer Service / Professionalism"
service blurbs) is not indexed, distinctive, or ranking-relevant, so it's fair game
to rewrite. When in doubt about whether a piece of homepage content is safe to
rewrite vs. must be preserved verbatim, treat unique copy that could be indexed
(titles, meta descriptions, quotes, article text) as protected, and template
boilerplate as flexible.

Other pages default back to the original approach — visually close to the current
site until their own redesign pass is scoped — unless told otherwise per page.

## What "simplify the admin dashboard" means

The current Laravel admin is more than the team needs. The rebuild's admin should
cover, cleanly: property listings CRUD (sale/rent/sold/leased), agent profiles,
blog/landing page content, appraisal/lead form submissions, image uploads. No feature
bloat beyond what the team actually uses day to day.

## Future (not now, but don't build in a way that blocks it)

- **AI blog generation via Claude**, drafting SEO-focused local content, with a human
  review/approval step before publish — not fully automated publishing. For now,
  content is hand-written/hardcoded; the admin should be structured so slotting in an
  AI-draft step later doesn't require a rearchitecture.
- Ongoing feature additions — the whole reason for choosing Next.js/Tailwind/MongoDB
  over sticking with Laravel is so the team can keep shipping features themselves.
  Favor patterns that are easy to extend over clever ones that are hard to extend.

## Phasing (don't skip ahead)

0. URL/content inventory — **done**, see the migration notes doc.
1. Rebuild core: routing, data models, admin CRUD. Design matching current site
   *except* the homepage, which is being redesigned now (see Design section above).
2. Pre-launch QA: diff-crawl old vs. new, redirect map, structured data, sitemap.
3. Cutover on the same domain, monitor Search Console closely for a few weeks.
4. Iterate: suburb landing pages for the target list above, redesign remaining pages,
   AI blog pipeline, new features.

We are currently in **Phase 1**.
