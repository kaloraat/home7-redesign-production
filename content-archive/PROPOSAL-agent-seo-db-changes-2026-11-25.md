# Proposed database changes (agent SEO), 2026-11-25

Nothing here has been applied. Each part needs a yes.

## A. Assign 6 listings with no agent to Mohammed (agent = mohammed-r-islam)

| Type | Listing |
|---|---|
| sold | 52-cropton-street-jordan-springs-nsw-2747 |
| leased | 62a-newton-road-blacktown-nsw-2148 |
| leased | 68-stansmore-avenue-prestons-nsw-2170 |
| leased | 137a-longhurst-road-minto-nsw-2566 |
| other | 27-marie-street-lurnea-nsw-2170 |
| other | 24-daintree-drive-wattle-grove-nsw-2173 |

Effect: his profile goes from 13 sold / 63 leased to 14 / 66 (matching the homepage
totals), and the property pages show "Listed by Mohammed".

## B. Mohammed's bio (agents, slug mohammed-r-islam, field `bio` only)

Current bio stays in the backup before writing. Proposed (blank lines = paragraphs):

> Mohammed Islam is the founder and principal of Home7 Real Estate, a family-owned agency based on Macquarie Street in the Liverpool CBD. He looks after sales, leasing and property management for clients across Liverpool and South West Sydney, and works with each client directly rather than handing them on to someone else.
>
> Mohammed has sold and leased homes in Warwick Farm, Liverpool, Ingleburn, Leumeah, Minto, Campbelltown, Austral, Oran Park, Parramatta and surrounding suburbs, from one-bedroom units to family homes and acreage. Clients often mention his honesty, quick replies and strong negotiation in their Google reviews, and some have worked with him for years across several sales and investment properties.
>
> His approach is simple: price property honestly using real local sales, keep owners updated throughout, and put every fee in writing before anything is signed. If you are thinking of selling, renting out or buying in South West Sydney, Mohammed is happy to give you a free, no-obligation appraisal.

Removed from the old bio: "record sales in ... Mittagong, Bankstown and Rockdale" and
"multi-million dollar homes" (not backed by listings on the site).

## C. Licence numbers (agents, field `licence`)

Needs the numbers from you (NSW Fair Trading licence or certificate of registration),
one per agent who has one. Can also be typed in at /admin/agents → Edit after deploy.

## D. Links to the homepage from posts (bodyHtml, first plain-text mention only)

Phrase links (link the exact words to `/`):
1. /liverpool-real-estate: "Choosing the right **Liverpool real estate agent** means..."
2. /blog/australian-property-market-2027-predictions: "...choosing a **real estate agent in Liverpool** who knows what buyers are paying..."

Brand links (link the first plain "Home7 Real Estate" to `/`):
3. /blog/real-estate-agent-liverpool (the guide): "...how we work at **Home7 Real Estate**, a family-owned agency..."
4. /blog/real-estate-liverpool: "...**Home7 Real Estate** has the local knowledge to help."
5. /blog/real-estate-liverpool2: "...**Home7 Real Estate** stands out as the region's most results-focused agency..."
6. /blog/best-real-estate-agent-casula-nsw-home7: "...and **Home7 Real Estate** is the partner you need..."
7. /blog/best-real-estate-agent-warwick-farm-nsw-home7: "Local homeowners often describe **Home7 Real Estate** as..."
8. /blog/real-estate-agent-in-casula: "At **Home7 Real Estate**, we understand that choosing the right agent..."
9. /real-estate-prestons: "...the team at **Home7 Real Estate** brings deep local knowledge..."
10. /suburb/liverpool: "...it's where **Home7 Real Estate** is actually based, on Macquarie Street..."

Only the anchor is added; no other text changes, updatedAt untouched, bodyHtml of each
page backed up first.
