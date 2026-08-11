# VisuTry Sales Readiness Audit & Launch Plan

**Date:** 2026-08-12
**Scope:** Reference Factory → founder-led merchant outreach
**Decision:** Ready for a controlled first batch of founder-led outreach; not yet ready for a scaled, fully measured inbound funnel.

## A. Current readiness verdict

### READY: controlled founder-led outreach

The current product can show a real hosted Store/Campaign workflow for five merchant archetypes. The production tree already contains the Framed EWE merge (`origin/main` includes commit `8749afa`), and the current live smoke check returned HTTP 200 for `/en/store` plus all 15 Reference Store/Campaign routes.

The demoable workflow is real and merchant-scoped:

```text
catalog → Store/Campaign → shopper photo → recommendation → Try-On → Compare → product click/favorite/inquiry → merchant insight
```

### NOT READY: scaled inbound or evidence-heavy sales

The public `/en/store` page has a lead form, but submission currently opens a `mailto:` URL. It does not create a durable lead record containing the submitted fields, source/campaign, landing route and `submittedAt`. The page is therefore usable as a manual contact surface, not as a reliable measured B2B acquisition funnel.

The current portfolio also has production QA evidence for all five references but committed entry screenshots only for ello. That is a content/evidence gap, not a Factory-core blocker.

## B. Sales-readiness audit

| Area | What can be shown today | What can be promised today | What must not be claimed | Gap / treatment |
| --- | --- | --- | --- | --- |
| Public surface | `/en/store`, 5 Store routes, 10 Campaign routes, product links | Hosted Store/Campaign built from merchant catalog | A full ecommerce replacement | Add direct Reference links and clearer pilot CTA copy (CONTENT) |
| Shopper workflow | Photo upload, merchant-scoped recommendation, Try-On, Compare | A guided frame-decision experience | Guaranteed fit, medical/PD measurement, AI accuracy percentage | Use prepared demo inputs and fallback captures (CONTENT) |
| Merchant workflow | Auth-protected Admin, catalog, Experience pages, insights | Review of engagement/intent by Experience | Revenue attribution, uplift, incremental GMV | Keep metrics at observed intent level (CONTENT) |
| Delivery | Shared importer, CSV/catalog normalization, production publish, route smoke | Assisted onboarding of a reviewed frame set | One-click self-service onboarding or generic crawler | Use assisted onboarding checklist (DATA/OPS) |
| Commercial | Founding Merchant Pilot v8 internal baseline | $149 / 30 days, 8–50 frames, 1,500 AI-assisted shoppers, 3,500 Standard Try-On generations, assisted setup, weekly review | Lifetime pricing, default 5,000-render bonus, surprise overage promise | Align old sales copy and LP wording (CONTENT/CONFIG) |
| Lead capture | Form fields, B2B analytics events, mailto handoff | A prospect can contact VisuTry | Durable lead persistence or CRM workflow | Minimal Merchant Lead endpoint/table later (PRODUCT CODE) |
| Reference proof | Public routes and QA/read-back docs | A Reference Experience demonstrates a pattern | Customer, partner, client, case study, live performance | Use portfolio index and disclosure on every card (CONTENT) |

## C. Positioning statement

> **VisuTry turns your eyewear catalog into measurable AI shopping experiences.** Shoppers get a guided shortlist, Try-On and Compare; merchants get product links plus recommendation, favorite, inquiry and source/Experience intent signals. It runs as a hosted Store or Campaign first, so the merchant does not need to rebuild ecommerce or build AI internally.

Use this shorter version in first-touch outreach:

> **We turn an eyewear catalog into a hosted recommendation + Try-On + Compare experience that sends shoppers back to your product pages and shows which frames create intent.**

Do not lead with “AI virtual try-on tool.” The buyer problem is frame choice and measurable intent, with VTO as one step in the decision journey.

## D. Recommended entry offer

Use the existing internal commercial baseline; do not invent a new price card.

### Founding Merchant Pilot v8

- **Price:** USD $149 for 30 days.
- **Included catalog:** 8–50 reviewed frames; recommend 8–20 for the first focused test.
- **Included:** catalog onboarding, one hosted Store or Campaign Experience, AI-assisted recommendation, Try-On, Compare, product click/favorite/inquiry signals where enabled, source/campaign context, merchant intent view, assisted setup and weekly review.
- **Capacity:** up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations.
- **Optional exception:** up to 5,000 Standard Try-On generations only as an approved, recorded Founding Launch Bonus; never state it as the default offer.
- **Free:** reference links, a short qualification/demo conversation, and review of whether the catalog is a fit. Do not promise a free custom catalog build.
- **Support:** founder-assisted onboarding and a weekly review during the 30-day pilot.
- **Integration:** hosted first; merchant keeps Shopify/BigCommerce/current commerce destination as the product and checkout source of truth.
- **Commercial boundary:** no lifetime price, no unapproved overage terms, no conversion/revenue guarantee. The $149 offer is a market-capture pricing version, not a permanent price card.

Recommended pilot close:

> “If this looks relevant, the smallest next step is a 30-day Founding Merchant Pilot for $149. We start with 8–50 of your frames, set up a hosted experience, and review recommendation, Try-On, Compare and intent behavior before you decide whether to continue.”

## E. Five prospect segments

| Segment | Target characteristics | Likely pain | Best reference | Outreach angle | Decision maker | Likely objection |
| --- | --- | --- | --- | --- | --- | --- |
| A. Small-face / fit-led DTC | Petite/small-face positioning, 20–200 frames, direct ecommerce | Shoppers need fit/proportion guidance before browsing everything | ello | “Turn your fit story into a guided shortlist.” | Founder, ecommerce lead, growth lead | “We already explain sizes on product pages.” |
| B. Premium independent | Design-led, independent brand, curated optical + sun catalog | Product identity is strong but selection is still high-friction | Lowercase NYC | “Preserve the point of view while helping shoppers choose.” | Founder, brand/ecommerce lead | “We do not want a generic AI layer.” |
| C. Fashion / design | Collection drops, editorial traffic, visually distinct silhouettes | Campaign traffic lands in a large catalog without enough context | AKILA | “Create collection-led shopping journeys, not another grid.” | Creative director, ecommerce/growth | “Our campaigns are about brand, not conversion tooling.” |
| D. Sport / performance | Active/technical metadata, existing VTO possible, use-case merchandising | VTO shows a frame but does not help compare or measure intent | Article One | “Add recommendation, Compare and intent around your existing VTO.” | Ecommerce, digital product, founder | “We already have VTO.” |
| E. Multi-brand retailer | Independent optical retailer, 30–500 frames, online inquiry/appointment or commerce | Cross-brand discovery and retailer-level follow-up | Framed EWE | “Guide discovery across brands while keeping the retailer catalog in control.” | Owner, retail/ecommerce lead, merchandising | “We cannot upload every brand / send shoppers away.” |

## F. Reference mapping rule

Select one Reference Experience by the prospect’s primary business problem, not by visual similarity alone:

1. Fit/proportion problem → ello Petite Fit.
2. Premium identity / broad curated catalog → Lowercase Find Your Frame.
3. Collection or style story → AKILA Statement Frames or Current Edit.
4. Existing VTO / technical product story → Article One Active Eyewear or Find Your Fit.
5. Cross-brand retailer discovery → Framed EWE Find Your Frames or Sunglasses Edit.

Every outbound message should link directly to one matching Experience and include one sentence based on the prospect’s site. The reference link is an example, never proof of the prospect’s future results.

## G. 3–5 minute demo flow

Use a deterministic prepared demo by default. The purpose is to show the decision journey, not to test live provider latency.

| Time | Action | Talk track / fallback |
| --- | --- | --- |
| 0:00–0:30 | Open the closest Reference Campaign and point out the `Reference Pilot · Simulation` label | “This is a concept implementation using the same merchant/catalog/Experience structure we would use for your frames.” |
| 0:30–1:10 | Use a prepared front-facing sample photo | If upload or face analysis is slow, use the prepared recommendation state and say the input is pre-staged for demo reliability. |
| 1:10–1:50 | Show the merchant-catalog recommendation shortlist and reasons | “These are selected from this catalog, not a generic frame library.” |
| 1:50–2:35 | Select 2–4 frames and show Try-On | Use a pre-generated result or approved capture if provider latency/errors occur; do not imply the result was generated live. |
| 2:35–3:10 | Show Compare, Favorite and Product Click/inquiry path | Emphasize the handoff to the merchant’s product destination. |
| 3:10–4:15 | Switch to Merchant Admin and show Experience-level intent metrics | Show Campaign A vs Campaign B only as observed product signals; reference data is not merchant performance. |
| 4:15–5:00 | Close on the pilot | “The same merchant catalog can power multiple measurable shopping experiences.” Then ask for first traffic source and 8–50 frame set. |

Do not spend the first demo on all features, internal architecture, provider/model names, or unimplemented checkout integrations.

## H. Sales LP changes required

The current `/en/store` can be upgraded by content/configuration; a redesign is not required.

Required copy/config changes:

- Replace the generic “Create my sample store” promise with a choice between “See a Reference Experience,” “Book a demo,” and “Launch a Founding Pilot.” A custom sample should be described as a qualified/paid pilot deliverable.
- Add the positioning statement above and the explicit workflow: catalog → hosted Store/Campaign → recommendation → Try-On → Compare → product destination + intent.
- Add a compact Reference Portfolio section with five cards and direct deep links.
- Add pilot terms: `$149 / 30 days`, `8–50 reviewed frames`, `up to 1,500 AI-assisted shoppers`, `up to 3,500 Standard Try-On generations`, assisted setup, weekly review. Label the optional bonus as approval-only or omit it.
- Answer “What integrates?” with “hosted first; keep your current ecommerce/product pages.” Do not imply Shopify/BigCommerce sync.
- Add “What it does not claim”: no guaranteed physical fit, medical advice, conversion uplift or revenue attribution.
- Preserve the current privacy note, but ensure the sales page does not say “we will use your information only to respond” if a future persistence endpoint adds operational follow-up without updating consent copy.
- Add UTM/reference-source support to every founder message link: `utm_source=founder_outreach`, `utm_campaign=<batch>`, `reference=<slug>`, plus the destination route.

These are CONTENT/CONFIG changes. No new Store or Campaign runtime is required.

## I. Lead capture requirement

### Current state

The current form captures name, work email, business name, business type, website/link, frame-count band, desired action and notes. It fires B2B analytics events and opens a `mailto:` request to `support@visutry.com`.

### Minimum durable flow when inbound measurement is needed

Persist one minimal `MerchantLead` record, not a CRM:

```text
id
name
workEmail
company
website
role/businessType
note
intent
referenceSource
campaign
landingRoute
submittedAt
status (NEW | REVIEWED | QUALIFIED | DISQUALIFIED)
```

The endpoint should validate email, rate-limit or add a honeypot, normalize route/source/campaign, and send an internal notification. It should not store shopper photos, should not become a CRM, and should not claim attribution beyond the submitted source/campaign context.

This is a PRODUCT CODE item for inbound measurement. It is not required to send the first 20 direct founder messages if responses are logged in a controlled tracker.

## J. Founder-led outreach SOP

For each prospect:

1. Inspect the site and identify the active catalog, merchandising story, commerce destination and current VTO/recommendation behavior.
2. Assign exactly one archetype A–E.
3. Select exactly one matching Reference Experience.
4. Write one personalized sentence grounded in the prospect’s actual catalog/story.
5. Link the matching Experience route with source/campaign parameters.
6. Offer a 15-minute demo or a $149 Founding Merchant Pilot; do not offer a free custom build by default.
7. Log the outcome within the same day.
8. Follow up once after 4–5 business days, then stop unless the prospect engages.

Minimum tracker columns:

```text
prospect, website, segment, referenceUsed, referenceRoute, personalizedAngle,
decisionMaker, outreachDate, channel, response, demoDate, pilotRequested,
pilotOutcome, objection, nextAction, source, campaign, notes
```

Do not send outreach from this task. This is the operating procedure for the next explicitly authorized action.

## K. Funnel metrics

Track the first funnel without invented benchmarks:

```text
prospects researched
  → outreach sent
  → observable open / response
  → positive response
  → demo booked
  → own-frame sample requested
  → pilot requested
  → pilot launched
  → merchant live
  → paid / continued
```

Required dimensions: `segment`, `referenceUsed`, `referenceRoute`, `outreachAngle`, `source`, `campaign`, `response`, `demo`, `pilotOutcome`, `objection`.

For the first batch, treat counts as observations. Do not set conversion targets until 20 relevant prospects have been contacted and the response quality is understood.

## L. Objection handling

| Objection | Truthful response |
| --- | --- |
| “We already have virtual try-on.” | “That can coexist. VisuTry adds catalog narrowing, recommendation, Compare and intent signals around the VTO step. The Pilot tests whether that decision layer adds value.” |
| “We use Shopify.” | “Keep Shopify as product and checkout truth. VisuTry starts as a hosted decision experience; no Shopify migration or app is required for the Pilot.” |
| “We do not want to send customers away.” | “The hosted link is an entry surface for a campaign or high-intent audience, and product clicks return to your product destination. We should confirm the desired handoff before launch.” |
| “How accurate is AI?” | “We do not publish an accuracy percentage. Recommendations are decision support based on available shopper signals and catalog attributes; the visual result is not a physical-fit guarantee.” |
| “Does this replace our website?” | “No. Your existing site remains the commerce destination. VisuTry is a guided path for shoppers who need help narrowing choices.” |
| “How long does setup take?” | “The current offer is assisted onboarding. We start with a reviewed 8–50 frame set and confirm timing after checking image/product data; do not promise a fixed launch SLA before the catalog review.” |
| “Do we need engineering?” | “Not for the hosted Pilot. You provide a reviewed frame set and product destinations; deeper sync is not part of the current offer.” |
| “What shopper data do you collect?” | “The flow records merchant-scoped session, event and intent signals. Shopper photos follow the Store privacy/retention workflow; the merchant insight surface is designed not to expose raw shopper image URLs.” |
| “Can it use our own catalog?” | “Yes. The Pilot is built from your reviewed catalog, starting with 8–50 frames.” |
| “Can campaigns use different products?” | “Yes. Store and Campaign are sibling Experiences that select different subsets from the merchant catalog.” |
| “What happens to customer photos?” | “They are used for the try-on/analysis workflow and governed by the current Store asset retention/access policy. Do not promise a stronger deletion/privacy guarantee than the published implementation provides.” |

Never answer with conversion uplift, AI accuracy %, medical fit, production integrations, autonomous purchase, or revenue attribution claims.

## M. Two-week founder-led outreach plan

### Week 1 — prepare and learn

- **Day 1:** Freeze Factory scope; use the Reference Portfolio Index and claims boundary as the only reference language.
- **Day 2:** Prepare the 5-minute deterministic demo with one sample photo, one live Reference Campaign and prepared Try-On fallback states.
- **Day 3:** Build the 20-prospect tracker; select four prospects per segment A–E. No mass list building.
- **Day 4:** Inspect the first 10 sites, classify archetype, select reference, write the one-sentence angle and add the deep link.
- **Day 5:** Inspect the remaining 10; review all 20 messages for claims, personalization and route/source tagging. Do not send until outreach is explicitly authorized.

### Week 2 — controlled execution and synthesis

- **Day 6:** Send the first 5 highly relevant messages after approval; log send time and reference route.
- **Day 7:** Send the next 5; review any replies and schedule demos.
- **Day 8:** Send the next 5; run demos using the prepared flow.
- **Day 9:** Send the final 5; follow up only with engaged prospects.
- **Day 10:** Summarize objections, demo requests, own-frame requests, pilot interest and which Reference Experience was most useful. Decide whether to continue, revise messaging or add the minimal lead-persistence item.

No benchmark or feature backlog should be created from a single reply. Look for repeated objections across segments.

## N. Asset requirements

| Asset | Minimum content | Current state | Classification |
| --- | --- | --- | --- |
| One-page sales page | Positioning, workflow, pilot, proof links, CTA, boundaries | `/en/store` exists; copy/Reference section needs refresh | CONTENT/CONFIG |
| 5 Reference cards | Archetype, problem, routes, proof, disclaimer | Covered by `visutry-reference-portfolio-index.md` | CONTENT/DATA |
| 60–90 sec demo video | Prepared shopper journey + Admin close | Not committed | CONTENT |
| 3–5 min live script | Script above with deterministic fallbacks | Specified here | CONTENT |
| Outreach email | Segment-specific one-liner + matching route + pilot ask | Existing templates need v8 price alignment | CONTENT |
| LinkedIn DM | 3–5 sentences, no inflated proof | To write from email variants | CONTENT |
| Founder message | Short plain-text ask | To write from email variants | CONTENT |
| FAQ/objections | Table above | Existing partial playbook; unified here | CONTENT |
| Pilot summary | $149/30d, scope, limits, support, no guarantees | Existing baseline; needs one-page export | CONTENT |
| Onboarding checklist | Catalog URL/CSV, 8–50 frame review, product URLs, CTA, traffic source, QA | Delivery Factory supports the work; sales checklist to package | DATA/OPS |

## O. Exact next implementation tasks

### P0 — do before the first approved 20-prospect batch

1. **CONTENT:** Use `visutry-reference-portfolio-index.md` as the sole Reference naming source; add the five cards and deep links to the sales asset.
2. **CONTENT:** Align every active sales-facing price mention to Founding Merchant Pilot v8; remove the old `$99–199/month` hypothesis from the active pitch.
3. **CONTENT:** Produce the deterministic 5-minute demo capture and one-page pilot summary; label all screenshots/metrics as Reference/Simulation where applicable.
4. **DATA/OPS:** Create the founder outreach tracker with the dimensions in section J; manually record replies and pilot outcomes.
5. **CONFIG:** Add source/campaign/reference parameters to founder links and define one batch identifier for the first 20.

### P1 — do before relying on inbound LP conversion or automated funnel reporting

6. **PRODUCT CODE:** Add the minimal Merchant Lead persistence flow in section I, including `submittedAt`, landing route, reference source and campaign. Keep it separate from Store shopper intents and do not build CRM.
7. **CONTENT/CONFIG:** Refresh `/en/store` copy to distinguish free demo/reference viewing from the paid custom pilot and include the current pilot limits.
8. **CONTENT:** Capture committed visual entry evidence for Lowercase NYC, AKILA, Article One and Framed EWE, subject to trademark/asset-use review.

### Explicitly deferred

No Brand 6, Campaign Builder, Shopify/BigCommerce integration, CRM, marketing automation, enterprise permissions, revenue attribution, agent API, recommendation-engine rewrite, Try-On-engine rewrite, crawler or self-service onboarding.

## Final decision

**Start controlled outreach after the P0 content/data pack is prepared and separately authorized.** The Factory phase is closed; the next learning loop is merchant response, demo engagement, own-frame willingness, pilot request and paid continuation—not another reference merchant.
