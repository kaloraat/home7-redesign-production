# Home7 URL Inventory & Migration Notes

Compiled by crawling the live site (home7.com.au) on 2026-08-10. This is the working
reference for making sure the Next.js rebuild breaks zero existing URLs.

Note on completeness: the site's `/sitemap.xml` could not be parsed by the tools
available in this session (it kept timing out / returning as binary). The list below
was built by crawling the homepage, category pages, and blog index directly, plus spot
searches. It covers every *pattern* of URL on the site and a large sample of real
examples, but it is not a byte-for-byte dump of every single property/blog URL ever
published. **Before launch, pull the definitive, exhaustive URL list from Google
Search Console (Indexed Pages report) and/or Google Analytics landing pages** — that's
both more complete than the sitemap and tells you which URLs actually carry ranking
value, which is what really matters for "don't break links."

---

## 1. Static / utility pages (exact 1:1 replication required)

```
/
/about-us
/agents
/properties-for-sale
/properties-for-rent
/sold-properties
/leased-properties
/properties                    (all properties)
/other-properties
/open-for-inspection
/buyers-advisory
/free-market-appraisal              (also used with ?key=selling / ?key=renting / ?key=buying)
/contact
/blog
/privacy-policy
/property-tenant-application-download
/sitemap.xml
/robots.txt
```

robots.txt is currently wide open:
```
User-agent: *
Disallow:
```
No sitemap directive in robots.txt (sitemap is only linked from the footer). Easy to
replicate exactly — don't add new Disallow rules without checking with the user first.

## 2. Dynamic content patterns

**Property detail pages** — `/property/{slug}`
Slug is generally `{street-address}-{suburb}-nsw-{postcode}`, all lowercase, hyphenated.
Examples seen: `/property/62-newton-road-blacktown-nsw-2148`,
`/property/1106-6a-atkinson-street-liverpool-nsw-2170`,
`/property/gerbera-place-kellyville` (some older ones drop the postcode/street number).

⚠️ **Not all slugs are lowercase.** A handful of older property URLs use mixed case,
e.g. `/property/514A-Browns-Road-Austral-NSW-2179` and
`/property/80A-Croydon-Street-Lakemba-NSW-2195` and
`/property/302-1-Mill-Road-Liverpool-NSW-2170`. Next.js routing is case-sensitive by
default. If the rebuild normalizes all slugs to lowercase (recommended for future
listings), these specific old URLs need an explicit redirect/alias entry — they will
404 otherwise.

**Agent profile pages** — `/agent/{slug}`
Examples: `/agent/mohammed-r-islam`, `/agent/ahmad-mehmood`, `/agent/anju-gurung`,
`/agent/tunajjina-islam`, `/agent/abbie-kclk`, `/agent/william-scott`,
`/agent/ryan-dhungel`.

**Blog posts** — `/blog/{slug}`
Dozens of posts, e.g. `/blog/hidden-costs-buying-property-nsw`,
`/blog/real-estate-agent-liverpool-local-market-insights-you-need-to-know`,
`/blog/best-real-estate-agent-warwick-farm-nsw-home7`.

**Root-level SEO/landing pages — no `/blog/` prefix** — `/{slug}`
This is the important discovery: a large number of content pages live directly off the
root, not under `/blog/`. Examples: `/real-estate-agent-liverpool-nsw`,
`/top-real-estate-companies-in-liverpool`, `/liverpool-real-estate`,
`/real-estate-in-liverpool`, `/real-estate-prestons`, `/land-for-sale-in-austral`,
`/austral-land-for-sale`, `/development-land-for-sale-austral-nsw`,
`/australia-real-estate-market-2026`, `/is-now-a-good-time-to-invest-in-sydney-property`,
`/best-time-to-sell-house-liverpool-nsw`, `/renting-vs-buying-property-western-sydney`,
`/210-thirteenth-avenue-austral-nsw-land-house-sale`.

These look like programmatic SEO landing pages built outside the normal blog module —
exactly the kind of content that's driving the site's local rankings, so they matter
most for the "don't lose rankings" goal.

⚠️ **Duplicate-URL issue on the current site.** At least one piece of content is
reachable at two different URLs: "Best Suburbs to Buy Property in Liverpool NSW" is
linked as `/blog/best-suburbs-buy-property-liverpool-nsw` from the homepage, but as
`/best-suburbs-buy-property-liverpool-nsw` (no `/blog/`) from the blog index page
itself. This is almost certainly unintentional duplicate content on the current
Laravel site. For the rebuild: pick one canonical URL per article, 301 the other
pattern to it, and set a proper canonical tag — don't carry the duplication forward,
but do make sure both old variants resolve rather than 404.

## 3. Query parameters in use

`/free-market-appraisal?key=selling|renting|buying` — drives which form/copy variant
shows. Preserve this exact param handling.

## 4. Things worth fixing during the rebuild (not URL-related, but flagged since they hurt local SEO)

- The Blog index page's meta description/title is about "home improvement, interior
  design, DIY projects" — completely mismatched to the actual content, which is all
  Western Sydney real estate/local market articles. Templated, unedited meta tag.
- The About Us "Service Area" section has near-duplicate templated paragraphs per
  suburb, and one contains leftover brief text ("...you can rely on Home7 to
  strategically optimize our online presence with high keyword density") that reads as
  unedited AI/copywriter output. Worth a full rewrite — thin/duplicate boilerplate like
  this is the kind of content Google's spam policies increasingly discount.
- No suburb-specific landing pages with real local depth for Campbelltown, Blacktown,
  Parramatta, Oran Park, Leppington, Castle Hill, Baulkham Hills, or Penrith — Liverpool,
  Austral, Warwick Farm, Casula, and Prestons are already covered by blog/landing pages;
  the other target suburbs are not yet represented in content at all.

## 5. Recommended pre-launch QA steps

1. Export the full indexed URL list from Google Search Console + top landing pages
   from Analytics (last 12 months) — this is the authoritative "must not break" list,
   better than sitemap.xml alone.
2. Build the Next.js route map so every pattern above resolves identically
   (`/property/[slug]`, `/agent/[slug]`, `/blog/[slug]`, a catch-all `/[slug]` for the
   root-level landing pages, plus the static routes).
3. Decide the canonical URL for any duplicate-content pairs found in the GSC export,
   redirect the non-canonical variant.
4. Add explicit redirect/alias entries for any legacy mixed-case slugs if the new site
   normalizes to lowercase.
5. Run a diff crawl (Screaming Frog or similar) of staging vs. live before DNS cutover
   — every live URL should return 200 (or a deliberate 301) on staging, zero
   unplanned 404s.
6. Keep the same GSC property verified through the switch so ranking history isn't
   reset.
