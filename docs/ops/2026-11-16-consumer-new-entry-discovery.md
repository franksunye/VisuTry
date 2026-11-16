# Consumer New Entry Discovery · 2026-11-16

**Status:** Active research + Draft experiment; no new entry mechanism validated.  
**Owner:** Growth / Product / Engineering.  
**Canonical strategy:** [docs/strategy/analytics/gtm.md](../strategy/analytics/gtm.md); [tracking issue #529](https://github.com/franksunye/VisuTry/issues/529).  
**Supersedes:** Nothing. Continues 2026-11-02 Growth Discovery H3 (fit) and H4 (Compare/Share); do not create another GTM source of truth.

## 1. Decision

Explore **new qualified Consumer entry tasks**, not renamed funnels or mass SEO pages. Start E1 with a client-side two-pair size-marking comparison inside the *existing* English width guide, in Draft PR only. E2 is a **share security and observability audit**, not a social-launch approval. E3 image-to-style and E4 sunglasses exploration are discovery only. Do not change Detector, Advisor report unlock, Try-On credits, pricing, existing paid funnels, November Advisor experiment, or Provider. No new static URL, image inference, backend CPU, personal-image processing or database schema.

## 2. First-party GSC baseline (read 2026-11-16)

Property: `https://www.visutry.com/` (Windsor.ai Search Console `searchconsole`). Search type: Web/default. **2026-10-17 through 2026-11-13 inclusive**, 28 full days (allowing Google processing lag), all countries and devices. Exact existing English page URLs:

| Exact route | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| `/en/glasses-guide/how-wide-should-glasses-be-for-my-face` | 1 | 21 | 4.76% | 12.33 |
| `/en/compare-glasses-frames` | 2 | 57 | 3.51% | 6.33 |
| `/en/try-on/glasses/compare` | 0 | 36 | 0% | 7.81 |
| `/en/try-glasses-on-photo` | 8 | 552 | 1.45% | 16.84 |
| `/en/sunglasses-for-face-shape` | 0 | 22 | 0% | 8.41 |

Relevant **query examples** in this same window: `glasses finder from picture` 1 click /15 impressions; `find glasses from picture` 1/12; `identify glasses from photo` 0/12; `which glasses look best on me` 0/2; `compare glasses` 0/1; `how accurate is virtual try on for judging frame size?` 0/6; `which sunglasses suit my face upload photo` 7/145; `which sunglasses suit my face upload photo online free` 3/51. The last two have a **photo-personalization intent** already served by paid Advisor; no free Advisor equivalent.

Data boundaries: Query and page reports are separate aggregates, not additive cohorts. The sample does not measure global keyword search volume or demonstrate a growth winner. Previous complete 28d could not be fetched because this Windsor connection limits accessible history to the latest 30 days; do not invent period-over-period changes. Windsor Google Analytics 4 has **no selected account**, so current qualified GA4 sessions, event counts and payment joins are **UNAVAILABLE**, not zero. Authenticated GA4/GSC browser tabs were not available for a substitute read. Prior 2026-11-02 research baselines are historical, not current observations.

## 3. Product/engineering inventory (main @ 2026-11-16)

- Current `src/components/seo/FrameWidthBuyingGuide.tsx` already explains 52–18–145 and that `2 × lens + bridge` **is not outer width**; `/[locale]/glasses-guide/[slug]` gates the component to EN width route only. E1 can add true utility there without duplicate canonical pages.
- `src/app/[locale]/(public)/compare-glasses-frames/page.tsx` is an existing public search owner; `/[locale]/try-on/glasses/compare` requires sign-in and uses credit-gated up-to-four-frame generations. `FrameCompareInterface` tracks start/complete. No free render or new compare engine should be created.
- `src/components/share/ShareButton.tsx` constructs `/share/${taskId}`. `src/app/[locale]/(public)/share/[id]/page.tsx` renders the completed result with the task owner's name, optional profile image, and OG preview. `src/app/api/share/try-on/[id]/result/route.ts` treats the opaque task ID as a *public read capability*. The inspected files do **not visibly enforce** a distinct explicit-share grant, expiry, or revoke. This is a privacy review gate, not a proven unauthorized-data incident: validate actual reachability and use before security claims or feature release.
- `src/lib/analytics-events.ts` declares `tryon_shared`, `comparison_created`, `comparison_completed`, but registry existence does **not** prove live delivery. `src/lib/consumer-funnel.ts` deliberately allowlists only a subset and avoids a new backend event for free Detector. E1 `frame_size_compared` uses existing browser GA4/dataLayer transport; **not allowlisted for a new Vercel telemetry POST**.
- [PR #520](https://github.com/franksunye/VisuTry/pull/520) is an existing **Draft** same-face Guide editorial experiment whose release is on hold; do not merge, test against or combine it in this intervention.

## 4. Outside market counterevidence

| Job | Independent evidence | Implication |
| --- | --- | --- |
| Size/fit decoding | [Warby Parker frame measurements](https://www.warbyparker.com/learn/eyeglasses-measurements), [Zenni measure frame size](https://www.zennioptical.com/measure-eyeglass-frame-size-how-to) | Real user task; mature competitors already teach it; no unique feature claim and no millimetre fit promise |
| Find a frame from a picture | [Zenni Find By Image](https://www.zennioptical.com/blog/find-by-image-visual-search-tool/) finds its own catalog SKU matches | Independent high-level shape identification must not imply exact model/SKU recognition or a merchant catalog |
| Compare/share | [SpectacleX](https://play.google.com/store/apps/details?id=com.cspeed.spectacleX) advertises share/compare; limited online user discussions cited in earlier V2 report | Social sharing is not novel; viral coefficient unknown. Need opted-in share and verified inbound starts |
| Google SEO | [People-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [doorway policy](https://developers.google.com/search/docs/essentials/spam-policies) | Interactive utility can be worthwhile; multiple near-identical keyword landings are prohibited/low-value |

Research and competitor statements above are **external directional supply evidence**, not keyword planner volume, competitor effectiveness or confirmed growth.

## 5. Four candidate experiments (registered before release)

### E1 — Frame Size Interpreter · priority P1 / Draft prototype

**Question:** Can a visitor compare their familiar frame markings with a candidate pair, understand component differences and make a more informed decision without login or AI?  
**Current owner:** `/en/glasses-guide/how-wide-should-glasses-be-for-my-face`. No new URL.  
**Prototype:** a purely client-side calculator comparing lens width, bridge width and temple length, exposing signed differences only. Inputs are not stored or logged. It cannot determine actual overall front width, PD, prescription suitability, bridge comfort or physical fit. Keep existing Guide title, metadata, CTA ordering, SERP owners and page structure. Placement below the current size explanation and above physical-fit checks.  
**Signal:** if released after code/UX review, `frame_size_compared` (browser-side only), actual Guide-origin downstream `seo_funnel_click`, qualified organic first sessions and Try-On starts, independently. Compare next complete 28d GSC query×page; check after Google re-crawl, and 7d browser action quality.  
**Go/stop:** meaningful completed non-test comparisons with actual user continuation and rising incremental nonbrand visits in two comparable windows = consider extending. Data missing, tiny denominator or no qualified action = INCONCLUSIVE; if redundant/cannibalizing or misleading size advice = STOP. Do **not** use raw impressions or click count as an automatic success or 10× estimate.

### E2 — Compare → private sharing → new visitor · priority P1 / NO launch

**Question:** Does a user voluntarily sharing already-paid, completed results generate **new qualified users** who subsequently start a real eyewear-decision task?  
**Existing:** credit-gated Compare plus individual Try-On share route, no verified share-volume baseline or comparison-board sharing/voting.  
**First action:** read-only event audit for `comparison_created/completed`, `tryon_shared`, copy/share intents, share-link opens, and source-matched fresh legitimate users. Audit default visibility, opt-in, media ACL, safe OG, deletion, TTL, revocation and anti-abuse in a separate security review. **No public experiment until every privacy gate passes.**  
**Future minimum:** explicit opt-in; independently random high-entropy capability token, not raw task ID; short expiry + owner revocation; no public index; safe preview without private images/names unless consented; bounded analytics with no face geometry/image URL/user IDs; abuse/rate limits. Voting requires a separately approved consent and permission design.  
**Success measure:** users initiating voluntary share → unique human visitors on opt-in share link → real new Consumer task begins/completes. Track at cohort level where permitted; never divide unrelated global event totals.

### E3 — Identify frame style from image · priority P2 / research

**Question:** Do users who have a frame photo need *shape vocabulary* (browline, cat-eye, etc.) to proceed, independent from existing `/try-glasses-on-photo`?  
**First test:** static labeled style examples + existing image-upload discovery; use click/problem interviews/query research. No inferred official SKU/brand, scraped inventory, model call or free personalized Top Picks. Image ML is a separate feasibility gate requiring proof of incremental usage, cost and rights.

### E4 — Sunglasses / Color Explorer · priority P2 / reuse

**Question:** Can style/occasion and color exploratory intent produce a truly distinct query and conversion path from existing paid Advisor and Style Explorer?  
**First test:** query segmentation on existing owner/Style Explorer; no new personalized recommendation or mass landing pages.

## 6. Tracking, sequencing and release gates

1. **Now / research:** collect exact owner×query GSC, competition and connector gaps; retain this as supporting evidence and issue #529 as task ledger. No incremental traffic claim.
2. **Draft code/QA:** E1 parser and client tool + tests; TypeScript, scoped lint, unit, Next SSR/HTTP English/non-English, mobile 430×932/desktop, no new network call, privacy check. Do not auto-merge.
3. **E2 gate:** separately validate current share endpoint and revocation, consent and link-lifetime requirements before proposing any vote UI. Never expose user photos via public social surfaces by default.
4. **Approved future production release only:** verify exact main SHA, Vercel ready, original canonical www content and CDN freshness. Log Google recrawl independently; then 7d action, 28d Google impressions/qualified nonbrand clicks at same query×page, and verified first-party actions. Do not conflate GA4, GSC, Axiom and Stripe denominators.
5. **Scale gate:** repeatable net-new qualified first entries + completed eyewear decision actions and payment quality over at least two comparable periods; positive contribution and no paid Advisor/CPU/privacy regressions. Otherwise MODIFY, STOP or INCONCLUSIVE explicitly.

## 7. Out of scope / guardrails

No new free individualized Advisor, no change to 1-credit/paid entitlements, no Merchant catalog or official brand SKU masquerade, no URL importer revival, no photo-based PD/real fit promise, no broad syndication or programmatic page batches, no new server calls for free Detector, no risky Vercel/Cloudflare offload changes, and no uncontrolled public face-image sharing. This is a separate growth track, not a replacement for the current Guide 28-day observation or Merchant acquisition.
