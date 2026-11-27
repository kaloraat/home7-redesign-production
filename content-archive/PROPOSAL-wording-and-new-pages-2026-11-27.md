# Proposed DB changes: new pages + wording cleanup, 2026-11-27

Nothing here has been applied. Each part needs a yes.

## 1. Insert 3 new blog posts as DRAFT (not live until you publish in /admin)

| Slug (/blog/...) | Targets | Draft file |
|---|---|---|
| real-estate-agent-fees-liverpool-campbelltown | cheap / affordable / low commission agent | DRAFT-blog-real-estate-agent-fees-liverpool-campbelltown.html |
| real-estate-agent-campbelltown | best / reliable agent Campbelltown | DRAFT-blog-real-estate-agent-campbelltown.html |
| family-owned-vs-franchise-real-estate-agent | reliable agent, small vs big names | DRAFT-blog-family-owned-vs-franchise-real-estate-agent.html |

Fields (title, seoTitle, seoDescription, excerpt) are in each file's header comment.
`status: "draft"`, `source: "ai"`. No cover images yet (pick one each, or I find CC0 photos).
Previews: DRAFT-preview-agent-fees.html, DRAFT-preview-agent-campbelltown.html, DRAFT-preview-family-vs-franchise.html.

## 2. Wording cleanup on live pages (script: scripts/wording-cleanup-2026-11-27.ts)

A. Invented testimonials ("Sarah", "James", "Priya", "Michael L.", "Jennifer L.", "David K.",
"The Nguyen Family") replaced with real Google reviews on 3 pages.
B. Unbackable claims ("record-breaking", "leading agency", "unmatched", "almost guaranteed",
"Future Billionaire" title) reworded on 6 pages.
Backup of every touched doc first; updatedAt untouched. Exact before/after below.

C. (Separate decision) 138 em dashes on 26 pages. A mechanical swap to commas creates
run-on sentences in many places (see samples). Recommended: hand-edit per sentence instead.

## Dry run output

```

=== /blog/request-a-free-property-appraisal-with-home7-real-estate-in-liverpool
  - REMOVED: “Home7 Real Estate made the process of selling our home in Liverpool so easy. Their free appraisal was spot-on, and their communication was fantastic!” – Sarah, Liverpool “As a first-time buyer in Campbelltown, I was nervous, but the team at Home7 treated me like family. Their expertise and care are unmatched.” – James, Campbelltown “I got a free appraisal for my investment property in Oran Park, 
  + ADDED:   “Excellent experience with Home7 Real Estate. Mohammed is professional, honest, and highly knowledgeable about the local property market. His communication, negotiation skills, and attention to detail made the entire process smooth and stress-free.” (Google review) “The team at Home7 Real Estate is amazing. Fast service, low cost, and excellent communication. Mohammed is the best agent I've worked with.” (Google review) “Outstanding real estate service in the area! The team is professional, efficient, and always quick to respond. Mohammed brings deep expertise in property sales and is a highly effective negotiator.” (Google review)
  - "Unmatched Customer Service"
  + "Personal, Honest Service"

=== /blog/best-real-estate-agent-casula-nsw-home7
  title: "Best Real Estate Agent in Casula | Sell Your Home with Home7 Real Estate"
   -> "Best Real Estate Agent in Casula? Why Sellers Choose Home7"
  seoTitle: "Best Real Estate Agent in Casula | Sell Your Home with Home7 Real Estate"
   -> "Best Real Estate Agent in Casula? Meet Home7"
  - REMOVED: “Home7 Real Estate made selling our Casula home simple and stress-free. They handled everything—from marketing to final settlement—with total professionalism.” — Sarah &amp; David, Casula NSW “Mohammed and his team got us an incredible price for our property. Their knowledge of the Casula market is second to none!” — Michael L., Casula
  + ADDED:   “Excellent experience with Home7 Real Estate. Mohammed is professional, honest, and highly knowledgeable about the local property market. His communication, negotiation skills, and attention to detail made the entire process smooth and stress-free.” (Google review) “Outstanding real estate service in the area! The team is professional, efficient, and always quick to respond. Mohammed brings deep expertise in property sales and is a highly effective negotiator.” (Google review)
  - "leading real estate agencies in Casula"
  + "trusted local real estate agencies serving Casula"
  - "deliver record-breaking results"
  + "deliver the strongest result your property can achieve"

=== /blog/real-estate-in-liverpool-nsw
  - REMOVED: "The Home7 team made selling our Liverpool home completely stress-free. Their marketing was impressive and we received multiple offers within the first week." - Sarah &amp; Michael T. "As first-time buyers, we appreciated the patience and guidance from our Home7 agent. They helped us find the perfect family home in Casula." - Jennifer L. "I've used several agents for my investment properties, but 
  + ADDED:   “Excellent experience with Home7 Real Estate. Mohammed is professional, honest, and highly knowledgeable about the local property market. His communication, negotiation skills, and attention to detail made the entire process smooth and stress-free.” (Google review) “Home7 real estate and founder Mr Mohammad is a place of trust. I have been dealing with Mr Mohammad for past 6 years on various occasion. Mohammad has helped and still helping us in sales, managing my investment property.” (Google review) “Best property management service I've experienced! Home7 Real Estate offers great value with low charges and excellent communication. Mohammed is an expert in the property market.” (Google review)

=== /blog/how-to-sell-your-liverpool-home-fast-in-2025-expert-tips-from-home7-real-estate
  - "a track record of record-breaking sales across"
  + "a track record of sales and leases across"
  - "Recent record sales in South Western Sydney showcase our ability to deliver top outcomes."
  + "Recent sales across South Western Sydney show our ability to deliver strong outcomes."
  - "achieving extraordinary results"
  + "achieving strong results"

=== /blog/best-real-estate-agent-warwick-farm-nsw-home7
  seoTitle: "Top Real Estate Agent in Warwick Farm | Sell Your Home Fast with Home7 Real Estate"
   -> "Real Estate Agent Warwick Farm | Sell Fast with Home7"
  - "achieve record prices — often faster than expected"
  + "achieve strong prices, often faster than expected"

=== /austral-land-for-sale
  - "HOME7 Real Estate has established a strong reputation as Austral's leading agency for land and development property sales."
  + "Home7 Real Estate works with land and development properties in Austral and the surrounding growth area, and knows what developers and buyers look for."

=== /blog/acreage-land-for-sale-austral-nsw-developers-dual-frontage
  - "gives them unmatched expertise in guiding"
  + "gives them the local expertise needed for guiding"

=== /blog/why-acreage-land-in-austral-nsw-could-make-you-a-future-billionaire
  title: "Why Acreage Land in Austral, NSW Could Make You a Future Billionaire"
   -> "Why Acreage Land in Austral NSW Attracts Long-Term Investors"
  - "this isn’t wishful thinking—it’s almost guaranteed."
  + "nothing in property is guaranteed, but the long-term fundamentals are strong."
  em dash: /blog/redfern-house-price-record-smashed-as-luigi-rosselli-house-sells (2)  e.g. "gularly. The previous record was $4.65m — set by Longhurst late last month — for " -> "gularly. The previous record was $4.65m, set by Longhurst late last month, for "
  em dash: /blog/top-5-reasons-to-choose-home7-real-estate-for-selling-your-campbelltown-property (1)  e.g. "tate, you’re not just selling a property—you’re partnering with a team dedicated " -> "tate, you’re not just selling a property, you’re partnering with a team dedicated "
  em dash: /blog/request-a-free-property-appraisal-with-home7-real-estate-in-liverpool (2)  e.g. "e’re more than just a real estate agency—we’re a family-owned business that treat" -> "e’re more than just a real estate agency, we’re a family-owned business that treat"
  em dash: /blog/australias-5-deposit-scheme-a-game-changer-for-first-home-buyers-starting-october-2025 (8)  e.g. " Scheme, set to launch on 1 October 2025—three months earlier than initially plan" -> " Scheme, set to launch on 1 October 2025, three months earlier than initially plan"
  em dash: /blog/why-acreage-land-in-austral-nsw-could-make-you-a-future-billionaire (14)  e.g. "th. Acreage land here is not just a home—it’s a golden ticket. If you’ve ever tho" -> "th. Acreage land here is not just a home, it’s a golden ticket. If you’ve ever tho"
  em dash: /blog/why-home7-real-estate-is-the-name-everyone-trusts-in-sydney-property (4)  e.g. "a property in Sydney, Home7 Real Estate —also known as Home 7 Real Estate , Home7" -> "a property in Sydney, Home7 Real Estate, also known as Home 7 Real Estate , Home7"
  em dash: /blog/best-real-estate-agent-casula-nsw-home7 (14)  e.g. "home in Casula, now is the perfect time —and Home7 Real Estate is the partner you" -> "home in Casula, now is the perfect time, and Home7 Real Estate is the partner you"
  em dash: /blog/best-real-estate-agent-warwick-farm-nsw-home7 (12)  e.g. "rm, NSW, is one of Sydney’s hidden gems — a growing suburb loved for its leafy st" -> "rm, NSW, is one of Sydney’s hidden gems, a growing suburb loved for its leafy st"
  em dash: /blog/real-estate-agent-in-casula (5)  e.g. "t take an agent's word for their success—demand evidence. Top-performing agents i" -> "t take an agent's word for their success, demand evidence. Top-performing agents i"
  em dash: /blog/real-estate-liverpool2 (36)  e.g. "ies for Property Sales in Sydney (2025) — A Complete Guide Published: March 1, 20" -> "ies for Property Sales in Sydney (2025), A Complete Guide Published: March 1, 20"
  em dash: /210-thirteenth-avenue-austral-nsw-land-house-sale (1)  e.g. "179 represents more than just a property—it's an opportunity to join one of Sydne" -> "179 represents more than just a property, it's an opportunity to join one of Sydne"
  em dash: /top-real-estate-companies-in-liverpool (5)  e.g. "tor doesn't just accept the first offer — they work the campaign to generate comp" -> "tor doesn't just accept the first offer, they work the campaign to generate comp"
  em dash: /nsw-property-market-middle-east-war-2026 (1)  e.g. "operty market. 👉 The short answer: Yes — but mostly indirectly. Global tensions " -> "operty market. 👉 The short answer: Yes, but mostly indirectly. Global tensions "
  em dash: /suburb/liverpool (4)  e.g. "l isn't just another suburb on our list — it's where Home7 Real Estate is actuall" -> "l isn't just another suburb on our list, it's where Home7 Real Estate is actuall"
  em dash: /suburb/campbelltown (3)  e.g. "t Sydney's established regional centres — big enough to have its own CBD, shoppin" -> "t Sydney's established regional centres, big enough to have its own CBD, shoppin"
  em dash: /suburb/blacktown (4)  e.g. "ort and retail hub for the wider region — which is exactly what keeps rental dema" -> "ort and retail hub for the wider region, which is exactly what keeps rental dema"
  em dash: /suburb/parramatta (3)  e.g. "ears now, and the skyline backs that up — this is one of the most active commerci" -> "ears now, and the skyline backs that up, this is one of the most active commerci"
  em dash: /suburb/oran-park (2)  e.g. "ties in Sydney's South West Growth Area — a suburb genuinely designed from scratc" -> "ties in Sydney's South West Growth Area, a suburb genuinely designed from scratc"
  em dash: /suburb/leppington (1)  e.g. "iving direct rail access toward the CBD — a genuine point of difference from many" -> "iving direct rail access toward the CBD, a genuine point of difference from many"
  em dash: /suburb/austral (4)  e.g. "h Area, and its character reflects that — a suburb moving from semi-rural acreage" -> "h Area, and its character reflects that, a suburb moving from semi-rural acreage"
  em dash: /suburb/castle-hill (3)  e.g. "in-demand suburbs in the Hills District — a leafy, family-oriented area that's be" -> "in-demand suburbs in the Hills District, a leafy, family-oriented area that's be"
  em dash: /suburb/baulkham-hills (2)  e.g. "'s most established residential suburbs — quiet, leafy, and consistently popular " -> "'s most established residential suburbs, quiet, leafy, and consistently popular "
  em dash: /suburb/penrith (2)  e.g. "s its own city in every practical sense — a major regional centre on the Nepean R" -> "s its own city in every practical sense, a major regional centre on the Nepean R"
  em dash: /suburb/marsden-park (2)  e.g. "urbs in Sydney's North West Growth Area — a master-planned community built largel" -> "urbs in Sydney's North West Growth Area, a master-planned community built largel"
  em dash: /suburb/box-hill (2)  e.g. "onts in Sydney's North West Growth Area — greenfield land being progressively rel" -> "onts in Sydney's North West Growth Area, greenfield land being progressively rel"
  em dash: /blog/liverpool-south-west-sydney-property-prices-2027-will-they-actually-fall (1)  e.g. "uth West Sydney? Talk to the Home7 team — proudly based in Liverpool and working " -> "uth West Sydney? Talk to the Home7 team, proudly based in Liverpool and working "

Part C: 138 em dashes on 26 pages

DRY RUN: 30 docs would change. Nothing written.
```
