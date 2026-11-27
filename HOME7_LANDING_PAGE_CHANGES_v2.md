# Home7 landing pages: changes since the first brief (v2)

> Paste this into Claude in VS Code. The pages under `/lp` were built from the first version of the brief. Apply every change below, then re-run the QA checklist at the end. The full updated brief is `HOME7_LANDING_PAGE_BRIEF.md`. Where this file and your current code disagree, this file wins.

## 1. `lib/lp/site.ts`

- **Remove** the `fees` object (`managementPercent`, `lettingFeeWeeks`, `salesCommissionFrom`) and all code that branches on it. Pages never show a fee % or commission %.
- **Add** `feesLine: "Low fees, and yes, they're negotiable."`
- **Set** `callbackPromise: "today, usually within minutes"`
- **Add** the principal, and use it everywhere below:
  ```ts
  principal: {
    name: "Mohammed R Islam",
    firstName: "Mohammed",
    role: "Principal",
    mobileDisplay: "0430 303 059",
    mobileHref: "tel:+61430303059",
    photo: "/images/team/mohammed-r-islam.png",   // existing image, reuse it
    profileUrl: "/agent/mohammed-r-islam",
  },
  ```
- **Replace** `licenceNumber` with `licensee`: reuse the licensee name and licence number the main site footer already shows. If they don't exist anywhere in the project, leave a `[CONFIRM]` placeholder and tell me.
- **Set** `officeHours` from the opening hours already on the site (contact page/footer). If there are none, leave it empty and tell me.

## 2. Hero (both page types)

- Hero photo = **Mohammed's existing photo** (`SITE.principal.photo`) as a friendly portrait card, captioned `Mohammed R Islam, Principal. "Call me any time."`. Remove any "Team photo goes here" placeholder.
- Under-button microcopy: `No obligation. No spam. Mohammed or one of our team will call you back today, usually within minutes.`
- Secondary link under the form: `Rather talk now? Call (02) 8729 7753 or Mohammed directly on 0430 303 059`
- PM subheading: change "Low, clear fees." to **"Low, negotiable fees."**

## 3. "We handle the switch" (landlord pages only, the biggest change)

**a) Switch banner:** a slim, full-width strip directly under the TrustRow, in a soft brand tint:
`Unhappy with your current agent? Just say yes and we handle the switch. →`
Clicking it smooth-scrolls to the hero form, pre-selects the "Switch from my current agent" chip and focuses the Name field.

**b) `?intent=switch` variant** of `/lp/property-management` (the "Switch Agent" ad now points here):
- H1: `Unhappy with your property manager? Just say yes. We handle the switch.`
- Subheading: `You don't have to deal with your current agent or work out the paperwork. We take care of everything, and your tenant and rent carry on as normal.`
- "Switch from my current agent" chip pre-selected, and the button reads `Yes, handle my switch`
- Read the param server-side from `searchParams` so there's no flicker. If the project needs these pages fully static, read it client-side in the hero and form only.

**c) Replace the SwitchingBlock entirely** with a large CTA section (soft brand-tint background, Mohammed's photo on one side):
- Heading: `Just say yes. We handle the switch.`
- Text: `Unhappy with your current property manager? You don't have to chase them, argue, or work out any paperwork. Say yes, and we take care of everything with your current agent: the notice, the keys, the tenant file and the bond details. We also let your tenant know, so your rent keeps coming in as normal.`
- Ticks: `✓ No awkward conversations with your old agent` · `✓ No paperwork to work out yourself` · `✓ No break in your rent`
- Primary button `Yes, handle my switch` (same scroll + pre-select + focus behaviour as the banner)
- Secondary: `Or call Mohammed on 0430 303 059` (PhoneLink, mobile)
- Small muted footnote: `Your current agreement's notice period still applies. We'll check it for you.`
- Remove the old 3-step "check your agreement / give notice / we take it from there" content.

## 4. Fees and commission copy (no numbers, no "lowest")

- **PM WhyCard 2** → title `Low fees, and they're negotiable.` Text: `We keep our fees low because we'd rather grow by looking after owners well than by charging more. Tell us what you pay now and let's talk.`
- **PM WhyCard 3** → remove the `[CONFIRM services]` tag and keep the text.
- **PM FeesBlock** → `Our fees are low, and they're negotiable. We'd rather earn your trust and keep you for years than squeeze you on price. Tell us what you're paying now and we'll give you a straight answer, in writing, with no pressure to sign.` + button `Compare my fees` (scrolls to the form). No table.
- **Sell WhyCard 2** → title `Lower commission, and it's negotiable.` Text: `Low commission, agreed in writing up front. Got another agent's quote? Show us and let's talk.`
- **Sell FeesBlock** → `Our commission is low, and it's negotiable. It's agreed in writing before anything starts, and marketing costs are quoted up front, so you'll know every cost before you decide.` + button `Compare my quote`.
- Copy rule (enforce across all `/lp` files): never "lowest", "cheapest" or "one of the lowest". "Low", "lower" and "negotiable" only.

## 5. New "Full management, all included" checklist (PM pages)

Place it directly under the WhyCards. Heading `Full management, all included`, shown as two columns of ticks (one column on mobile):
`Rental appraisal and marketing` · `Open inspections and tenant screening` · `Lease preparation and bond lodgement` · `Ingoing and outgoing condition reports` · `Rent collection and arrears follow-up` · `Routine inspections with photo reports` · `Repairs and maintenance, with your approval` · `Rent reviews and lease renewals` · `NCAT representation if ever needed` · `Monthly and end-of-financial-year statements`

## 6. FAQ updates

PM:
- `How much do you charge?` → `Our fees are low and negotiable. Tell us what you pay now and we'll give you a straight answer, in writing.`
- **Add** `How do I switch from my current agent?` → `Just say yes. We handle the whole switch with your current agent, including the notice, keys, tenant file and bond details, so you don't have to do anything.`
- `How quickly can you find a tenant?` → remove the `[CONFIRM]` tag and keep the text.
- `Am I locked into a long contract?` → `No long lock-ins. Our management agreement has a standard notice period, and we'll walk you through it before you sign anything.`

Sell:
- `How much commission do you charge?` → `Our commission is low and negotiable, and agreed in writing up front. If you have another quote, show us.`

## 7. Team section on the landing pages

- **Reuse the team data and photos the homepage already uses.** Import them, and delete any duplicated `TEAM` array in `lib/lp/content.ts`. This should be the same source the new contact-page team section uses.
- Heading: `Meet the people you'll actually deal with`
- Mohammed first and larger: photo, name, role, intro `"I'll look after your property like it's my own. Call me any time."` and a tap-to-call button for 0430 303 059. The rest of the team as smaller cards (photo, name, role, no phone numbers).
- On `/lp` pages team cards are **not links**. (On the contact page they do link to agent pages, which is correct there.)
- Keep the **office number** (02) 8729 7753 as the main call button everywhere, because Google call tracking only swaps that number. Mohammed's mobile is the personal, secondary option and is tracked as a `phone_click` tap.

## 8. Thank-you page

- Text: `Mohammed or one of our team will call you today, usually within minutes.`
- Show Mohammed's photo with `Mohammed R Islam, Principal` beneath it (replace any placeholder).
- Under the call button, add the text link `or call Mohammed directly on 0430 303 059`.
- PM leads that picked "Switch from my current agent": the first "What happens next" bullet becomes `We'll take care of the switch with your current agent. You don't need to contact them.` Pass the chosen intent to the thank-you URL (`&intent=switch`) so the page knows.

## 9. Lead email (`/api/lead`)

- **Send through the project's existing contact-form mailer, using its existing `.env` variables and recipients.** Remove any Resend dependency, `RESEND_API_KEY`, `LEAD_TO_EMAIL` or `LEAD_FROM_EMAIL` that was added for the landing pages (unless the existing contact form already uses them), and update `.env.example` to match.
- Keep everything else: urgent subject line, tap-to-call link, intent/timeframe, region, Sydney time, and the tracking block (gclid/gbraid/wbraid/utm/landing_url/referrer/leadId).

## 10. Footer

`LpFooter`: Home7 Real Estate · `SITE.licensee` (name + licence number reused from the main footer) · address · privacy policy link · © year.

## 11. Re-run QA and report back

- [ ] No fee %, commission % or "lowest / cheapest / one of the lowest" anywhere under `/lp` (grep for it)
- [ ] `/lp/property-management?intent=switch` shows the switch H1, subheading and button, with the switch chip pre-selected
- [ ] The switch banner and both "Yes, handle my switch" buttons scroll to the form, pre-select the chip and focus Name
- [ ] Mohammed's photo shows in the hero, the switch section, the team section and the thank-you page; `0430 303 059` works as `tel:+61430303059` everywhere it appears
- [ ] The office number `(02) 8729 7753` is still the main call button and is written exactly like that
- [ ] Team data is imported from the homepage source, with no duplicate array; team cards on `/lp` are not links
- [ ] A test lead arrives at the existing contact-form inbox, with `gclid=TEST123` in the tracking block when you open the page with `?gclid=TEST123`
- [ ] A switch lead's thank-you page shows the switch bullet
- [ ] `npm run build` and lint pass, and Lighthouse mobile is still ≥ 90 performance / ≥ 95 accessibility
- [ ] Report: files changed, any remaining `[CONFIRM]` placeholders (licence and office hours only if they weren't found in the project), and anything you couldn't do
