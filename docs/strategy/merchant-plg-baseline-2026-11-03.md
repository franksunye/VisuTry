# Merchant PLG Baseline & Three Work Packages — 2026-11-03

**Status:** Stage 1 in progress — first-party GSC URL Inspection, read-only live Demo UX, and Shopify policy audited; **not market validation or new-merchant E2E pass**
**Owner:** Product / Growth / Merchant Engineering
**Strategy:** [Merchant Self-Service Growth v1](merchant-plg-growth-v1.md)
**Evidence classes:** `CONFIRMED_SOURCE` (current repo or official platform), `MARKET_OBSERVATION` (external listings), `HYPOTHESIS`, `UNKNOWN`.

## Executive assessment

1. **A / Direct Merchant SEO-GEO: GO for measured opportunity discovery**, not yet for broad content production. The existing Business website has real product proof but still routes much copy toward a 30-day assisted Pilot.
2. **B / Shopify: GO for a gated feasibility study.** Eyewear try-on apps exist in the Shopify marketplace, so category demand is plausible but competition is real. An install is not automatically an activated or retained merchant; no public app build is authorized yet.
3. **C / Self-service: GO for a narrow activation improvement track.** A durable activation contract and first-product checklist already exist. The current report can count A6 Store previews, but the proposed 7-day A0→A6 rate, time to preview, human-support dependence and reliable acquisition-channel segmentation need verification or additions.

No new production traffic, revenue, merchant conversion rates, keyword volumes, or integration viability are claimed.

## A — Merchant SEO/GEO opportunity

### A1. Current assets / first pass (CONFIRMED_SOURCE)

- Public Business website contract: `docs/product/business-website-ia-and-copy.md`, covering Home, Platform, Store, Campaigns, Commerce Intelligence, Pricing, Examples, Resources, Integrations and Pilot.
- Existing proof must show the *actual* Merchant product and preserve Reference vs Customer separation: `docs/product/business-website-v1.3-visual-hierarchy-and-proof.md`.
- The site still contains `Start 30-Day Pilot` / `Request Pilot Review` calls-to-action in its canonical 2026-09-30 copy. This is **not aligned** with a self-service SMB primary funnel. A public copy/UX change requires a separately tested implementation.
- Consumer GSC/SEO material in `docs/project/seo-backlog.md` measures Consumer demand, not qualified Merchant search. Do not use Consumer clicks as the B2B acquisition denominator.
- The distinction matters: (a) VisuTry Business SEO drives *new merchant signups*; (b) Merchant Store/Campaign SEO/GEO drives *shoppers to merchants*. Do not mix attribution or count the latter as B2B acquisition.

### A2. First-party GSC baseline — measured 2026-11-03 (CONFIRMED_SOURCE)

Source: connected **Google Search Console**, property `https://www.visutry.com/`, Search Analytics, `page contains /business`; aggregated by page. Google can suppress anonymized query rows; query-detail aggregates need not sum to page totals.

| GSC Web window | Observed /business URLs with impressions | Impressions | Clicks | Interpretation |
| --- | ---: | ---: | ---: | --- |
| 2026-10-03 to 2026-10-30 (28d) | 3 | **4** | **0** | Practically no first-party Merchant organic entrance yet |
| 2026-08-02 to 2026-10-30 (90d) | 5 | **52** | **0** | Not evidence of sufficient qualified Merchant demand |

90d page breakdown:

| Page | Impressions | Clicks |
| --- | ---: | ---: |
| `/en/business/pricing` | 17 | 0 |
| `/en/business/platform` | 12 | 0 |
| `/ru/business` | 20 | 0 |
| `/ar/business` | 2 | 0 |
| `/pt/business` | 1 | 0 |

Query-level follow-up on the same page filter returned mostly **brand / ambiguous terms** (`visutry`, `visu commerce`, `launchgrowth`), not verified high-intent eyewear-SMB software searches. GSC query `contains shopify` across this site returned **zero rows** for 90d; this describes *current VisuTry impressions*, not total Shopify keyword demand. Standalone `virtual try on software` had 1 impression, `virtual try on software glasses` had 9, **both zero clicks** across the whole site; these are directional terms, not proven Merchant traffic.

**Decision implication:** investigate Merchant IA/index coverage and keyword-intent fit **before** content scale. Missing GSC rows do **not** prove non-indexation: use URL Inspection/sitemap/canonical checks separately. Do not convert Consumer keyword performance into Merchant market estimates.

Next read-only technical checks: verify `/en/business`, `/en/business/store`, `/en/business/integrations`, `/en/business/pricing` canonical, robots/noindex, sitemap inclusion and crawl/render; then map query → page → self-service CTA with accurate pricing/product proof.

### A3. Initial query-intent map — research candidates, no verified volumes (HYPOTHESIS)

| Cluster | Example English query | Intent | Candidate Business destination | Validation |
| --- | --- | --- | --- | --- |
| Commerce integration | `virtual try on glasses shopify` / `shopify eyewear try on app` | Merchant solution comparison | Dedicated Shopify integration/solution page **only after viable integration exists**; until then research article with no availability claim | GSC, keyword/competition research, Shopify App Store language |
| Merchant VTO | `eyewear virtual try on software` / `AI glasses try on for ecommerce` | Merchant software selection | Business Store/Platform with actual outcome demo | Query intent and serp competitors |
| Conversion/decision | `eyewear product recommendations for online store` | Merchants seeking decision help | Store + recommendation/compare proof | SERP relevance and qualified signup rate |
| SMB onboarding | `virtual try on for small optical shop` | Low-support small retailer | Self-service how-it-works/pricing, **after copy and onboarding truth** | Qualitative merchant interviews/search tests |
| Discovery for eyewear merchants | `eyewear store AI search visibility` | Discoverability question | Merchant discovery/intent explanation; no guaranteed AI rankings | Query existence and credibility of merchant value |

**Content rule:** Two genuinely different intents merit two genuinely different helpful pages; keyword permutations alone do not. Google says AI-search discoverability uses existing people-first SEO practices, not a special GEO markup scheme.

### A4. Current public landing-path check — observed 2026-11-03 (CONFIRMED_SOURCE)

- [Business Home](https://www.visutry.com/en/business) publicly leads with `Start 30-Day Pilot` (header, hero and footer), with product proof focused on Merchant Store/Commerce and the 30-day Pilot.
- [Business Pricing](https://www.visutry.com/en/business/pricing) has a real `Start Free` CTA in addition to Pilot, with the current **Free $0** offering and **Launch $199/mo** paid offering. The Free column lists one Store/50 products/Basic Recommendation but **no generative Try-On**. This does **not** validate the eventual paid decision product before payment; packaging and demo proof must be assessed.
- `Start Free` lands on [Merchant signup/sign-in](https://www.visutry.com/en/auth/signin?callbackUrl=/en/merchant?commercialIntent%3DFREE), whose visible guidance emphasizes creating an Agent Key and pasting Key + Skill into ChatGPT/Claude. We have **not verified whether the GUI manual-add journey is obvious from signup**, so mark as a first-use UX risk, not a proven onboarding failure.
- `Start 30-Day Pilot` lands on [Pilot application](https://www.visutry.com/en/business/pilot), asking for contact/business/catalog information and manual review. It is a **separate assisted funnel**, not self-serve.

**First proposed landing experiment:** validate the actual manual First Item → Preview path; then make a truthful self-service CTA prominent on Business Home while keeping assisted Pilot secondary. Explicitly test on mobile and desktop; do not change live copy in this docs PR.

### A5a. Full English Business URL Inspection — 2026-11-03 (CONFIRMED_SOURCE)

**Source:** signed-in GSC property `https://www.visutry.com/`, URL Inspection *indexed data*, plus direct public DOM and XML sitemap. No indexing requests or Live URL Tests.

| English Business URL | GSC indexed-data status | Last crawl / source detail |
| --- | --- | --- |
| `/en/business` | **INDEXED** | Googlebot Smartphone successful crawl 2026-11-02 01:49:54; user and Google canonical = inspected URL |
| `/en/business/platform` | **INDEXED** | Crawl details not separately expanded |
| `/en/business/pricing` | **INDEXED** | Crawl details not separately expanded |
| `/en/business/store` | **DISCOVERED_NOT_INDEXED** | No crawl date; GSC lists `/sitemap.xml` |
| `/en/business/campaigns` | **DISCOVERED_NOT_INDEXED** | No crawl date; GSC lists `/sitemap.xml` |
| `/en/business/examples` | **DISCOVERED_NOT_INDEXED** | No crawl date; GSC lists `/sitemap.xml` |
| `/en/business/integrations` | **DISCOVERED_NOT_INDEXED** | No crawl date; GSC lists `/sitemap.xml` |
| `/en/business/commerce-intelligence` | **UNKNOWN_TO_GOOGLE** | GSC reports no referring sitemap and no crawl date |
| `/en/business/pilot` | **UNKNOWN_TO_GOOGLE** | GSC reports no referring sitemap and no crawl date |

**Count: 3 indexed / 4 discovered-not-indexed / 2 unknown, 9/9 checked.** Important nuance: all nine URLs **do currently appear** in public `/sitemaps/core.xml` (683 `loc` entries when read). The current XML's nine Business entries **do not include `lastmod`**; this is an optional update signal, not proof of why two are unknown. GSC's submitted `/sitemap.xml` index shows **Success**, submitted 2026-07-27, last read 2026-10-30, **749 pages discovered** in the Google report. A successful sitemap index is not proof every nested URL has been consumed or selected for crawling. GSC discovery is asynchronous; do not claim those two have necessarily been blocked by the site.

Public DOM sampled `/en/business`, Store and Integrations with self canonical and `robots=index, follow`. Business Home contains ordinary crawlable `<a href>` links to key pages. The three sampled heads lacked `hreflang`; review multilingual setup as possible hygiene, **not** root cause.

**Technical diagnosis:** no evidence of a blanket Business `noindex` or sitemap omission. However, five of the six pages that are *not indexed* are important Merchant solution pages; four are discovered-but-not-crawled and two are not yet in Google's known-URL inspection data. Separately, already-indexed Home/Pricing/Platform have very low Merchant impressions. Investigate **(1) discoverability/crawl prioritization, site reliability, content distinctness, server responses, render and Googlebot logs** and **(2) merchant query-intent fit/relevance/authority** as distinct hypotheses. Prior CPU/crawl-budget concerns remain **unproven** until logs/Crawl Stats evidence. Official references: [Page Indexing](https://support.google.com/webmasters/answer/10264824), [crawl troubleshooting](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors).

**Bounded next changes:** Business Home honest self-service CTA and merchant-intent content; strongest Store/Platform proof with meaningful internal links; technical review of 6 unindexed URLs including existence and unique value before any index requests. No premature generic `Shopify integration available` page or guaranteed GEO placement claims.

### A5. Remaining baseline checklist (UNKNOWN until independently measured)

- GSC 28/90d page and initial query baseline **captured above**; remaining: country/device segmentation, remaining URL Inspection cases, crawl stats, keyword/competitor SERP and cannibalization.
- GA4: Business landing → self-service signup start → workspace created attribution; paid/employee/bot exclusions; landing-to-A0 join coverage. GA4 cannot substitute for durable A0.
- Inspect indexed competitor pages and true backlinks/citations; validate each proposed topic against actual Merchant search results.
- Public CTA inventory and event baseline: current Pilot clicks vs direct signup; do not invent event histories.
- Output: **top 2 page opportunities**, one current-page fix, anticipated qualified traffic and measurable experiment criteria.

**A gate to Stage 2:** verified intent and search opportunity, real product proof, accurate CTA into existing self-service, analytics ready, no paid acquisition requirements.

## B — Shopify App Store growth feasibility

### B1. Marketplace reality (MARKET_OBSERVATION)

Independent eyewear VTO options were visible in Shopify App Store research, including GlassOn, Specfit, Fittingbox and Touchtry EyeFit. The existence of direct substitutes validates *category participation*, not that VisuTry can acquire merchants profitably.

Source samples (open each listing again when pricing or reviews influence a decision):

- [Shopify App Store](https://apps.shopify.com/)
- [GlassOn](https://apps.shopify.com/glasson)
- [Specfit](https://apps.shopify.com/specfit-eyewear-live-try-on)
- [Shopify App Store listing requirements](https://shopify.dev/docs/apps/launch/app-store-review)

Record exact present-day plan limits, visible reviews, positioning, surface (AR/live 3D vs AI image try-on), onboarding steps and evidence in a follow-up competitor matrix; do not rely on unverified search-result price snippets as canonical.

### B2. Five-app competitive snapshot — Shopify App Store, checked 2026-11-03 (MARKET_OBSERVATION)

These are **public listing claims and displayed prices**, not independently verified merchant outcomes. Review counts are not app installations or a market-size estimate. Pricing and reviews can change.

| Native listing | Displayed entry and sample paid tier | Visible review count | Primary shopper/merchant pitch | Our implication |
| --- | --- | ---: | --- | --- |
| [GlassOn](https://apps.shopify.com/glasson) | Free-to-install limited Starter; Growth **$49/mo**, up to 50 models | 3 | Real-time VTO, 360° view, facial measurement, *no-code* | Simpler immediate shopper experience; model setup includes human adjustment option |
| [Specfit — Eyewear Live Try-On](https://apps.shopify.com/specfit-eyewear-live-try-on) | Free up to 5 products; Launch **$19/mo**, 50 products; Growth $49/mo | 3 | Selfie collection-level multi-frame comparison + live 3D PDP | Direct overlap with VisuTry **Compare**; important low-end price anchor |
| [Fittingbox Virtual Try-On](https://apps.shopify.com/glasses-virtual-try-on-by-fittingbox) | Bronze **$59/mo** / 10 active products / 500 monthly unique users; Silver $99/mo | 13 | Real-time face tracking, 3D asset library/sync | Hardware-accurate real-time fit benchmark, different economics |
| [Touchtry EyeFit](https://apps.shopify.com/eye-fit) | Production Starter **$199/mo** / 300 AR SKUs; development stores free | 0 | AR try-on embedded on product pages, no-code merchandising | Higher price tier possible, but not evidence that SMBs buy at this price |
| [TryOn Virtual: AR & AI Try-On](https://apps.shopify.com/virtualtryon) | Free **25 monthly sessions**; Essentials **$15/mo** / 150 sessions; Growth $49/mo / 500 sessions (extra session fee) | 8 | Product-page AI photo try-on and real-time eyewear AR; four-step installed-app onboarding, product select/sync, theme block; vendor docs state Photo Try-on can cover eyewear | **Direct image-try-on substitute and low-end pricing anchor**; a standalone AI photo feature is not defensible differentiation |

**Competitive interpretation:** The fifth competitor, TryOn Virtual, contradicts the simpler hypothesis that photo-based AI try-on is an empty Shopify niche. Its public [App Store listing](https://apps.shopify.com/virtualtryon) claims free 25-session entry, $15/mo plan and a photo/AR product; its [own onboarding docs](https://docs.tryonvirtual.com/shopify/install/) specify guided install → mode → products → theme block plus product-update webhooks. These are vendor claims, **not** verified result quality or independent outcomes. Prioritize competitor's real first-product UX and use as an adverse case in unit economics.

**Competitive interpretation (revised):** A generic “we have virtual try-on” Shopify listing is unlikely to be distinctive. VisuTry should test **the full decision journey** — import → recommendation / try-on / compare → merchant action and observable intent — and verify that its asynchronous AI-image UX can meet a Shopify product-page shopper's latency expectations. A 3D real-time AR competitor and VisuTry's AI-generated photographic try-on are **not directly identical services**. Do not infer achievable paid price or retention from listing prices.

### B3. Required integration design — feasibility hypothesis, not implemented

1. Discovery → listing → Shopify managed install and token exchange if embedded (or auth-code grant for standalone), minimal **read_products** permission.
2. Authorized product selection/import → existing VisuTry catalog and readiness contract; no bulk import or editing without merchant choice.
3. **Private Store preview** (same A6 definition as direct signup). Merchant identity must remain tenant-scoped and deduplicated across re-install and direct accounts.
4. Merchant-controlled **Theme App Extension**: app block or app embed enabled in theme editor; preview/status must explain an unactivated block rather than silently altering storefront themes.
5. Guest shopper interactions with consent, privacy boundaries, quota protection, stable performance and observable decision actions.
6. Storefront/cart handoff to Shopify where appropriate; distinguish handoff from observed purchase. Never infer revenue from a click.
7. App billing (Shopify-approved subscription/usage terms where required) via a **channel-specific adapter**, shared product entitlements and metering, direct Stripe path unchanged.
8. Webhook product update/delete, app/uninstall lifecycle, data retention/privacy, consent handling, safe sync retry and rate-limit reconciliation.

Official technical anchors: [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions), [Admin GraphQL products](https://shopify.dev/docs/api/admin-graphql/latest/queries/products), [Shopify Billing](https://shopify.dev/docs/apps/launch/billing), [App Store Review](https://shopify.dev/docs/apps/launch/app-store-review).

### B3a. Shopify platform gates — official docs, 2026-11-03 (CONFIRMED_SOURCE)

- Live Catalog `Store URL` tries public Shopify/ecommerce URL extraction; **not** merchant-authorized Shopify Admin integration/sync/App Store install.
- [Authentication](https://shopify.dev/docs/apps/build/authentication-authorization): Shopify CLI **embedded** app normally uses managed installation + **token exchange**; standalone app may use authorization-code grant. Least-privilege product scopes, appropriate offline access and tenant/store binding are mandatory.
- [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store) are required for a new App Store app integrating with storefront themes. Merchant must explicitly enable/save blocks or embeds in theme editor; deep links reduce friction but do not remove consent.
- [Shopify App Pricing](https://shopify.dev/docs/apps/launch/billing) is default for new public apps; keep channel billing separate from current direct Stripe, with shared entitlements and metering.
- [Privacy compliance webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance): `customers/data_request`, `customers/redact`, `shop/redact`, plus uninstall/product reconciliation and consent/retention plan.
- **Open product gate:** asynchronous AI-photo generation delay and quotas versus real-time 3D/AR competitors on Shopify PDP.

Result: technical architecture pattern identified; **no Shopify app implementation, dev-store authorization, production billing or public listing performed**. Research GO, build HOLD.

### B3b. Simple margin stress test — assumptions, NOT observed Merchant economics

A competing public tier of **$15/month for up to 150 sessions** and **$49/month for up to 500 sessions** makes usage-to-image cost critical. Apply VisuTry's current **$0.03 per generated image** planning assumption *only as a sensitivity test*, assuming each permitted session generates the stated average images and 100% of sessions are used:

| Hypothetical revenue ceiling | Average AI images/session | Model cost at full allowance | Remaining before platform fee, infra, support, refunds |
| --- | ---: | ---: | ---: |
| $15 for 150 sessions | 1 | $4.50 | $10.50 (70%) |
| $15 for 150 sessions | 3 | $13.50 | $1.50 (10%) |
| $49 for 500 sessions | 1 | $15.00 | $34.00 (69.4%) |
| $49 for 500 sessions | 3 | $45.00 | $4.00 (8.2%) |

**Not a price recommendation:** these are not VisuTry's existing plans, session usage or realized KIE invoices. Shopify competitors use different models, metering and marginal costs; Shopify platform fees and app support still need verification. The point is structural: **do not copy a competitor's low session price without enforcing an image-generation budget and observable trial-to-paid behavior**. Model image/session p50/p95 and active store distribution, not just an average.

### B4. Unresolved risks and Go/No-Go

| Risk / question | Current evidence | Gate |
| --- | --- | --- |
| Does App Store organic discovery bring eyewear SMBs? | Competing apps exist; no verified category search volume or qualified install rate | Competing app review/query analysis + listing acquisition assumptions |
| Is asynchronous AI image try-on the right Shopify shopper UX vs photo/AR rivals? | TryOn Virtual publicly offers photo try-on plus eyewear AR and a guided sync/theme flow; VisuTry image generation remains untested on Shopify PDP | Side-by-side product page response, decision outcome, cost, permission and privacy UX |
| Can 1–10 product import be effortless? | Shared Catalog/First Item exists; authorized Shopify adapter not verified | Dev-store OAuth → import/preview test, no prod writes |
| Can app run economically? | AI image cost hypothesis exists; merchant usage distribution and support cost are unknown | Base/high usage contribution with fees, support and abuse limits |
| Is public app policy/compliance achievable? | Shopify platform docs provide review, Theme App Extensions, billing requirements | Explicit policy/design checklist and secure uninstall/privacy plan |
| Can we operate without tech support? | Current direct First Value exists; Shopify handoff not tested | Merchant completes install → A6 without engineer |

**B decision now:** research/prototype design **GO**. Public listing, app development scope, billing commitment, and production rollout **HOLD** pending all gates.

## C — Self-Service Activation audit (first code pass)

### C1. Verified current implementation

| Component | Evidence | Initial assessment |
| --- | --- | --- |
| Durable activation denominator | `src/modules/merchant/application/merchant-activation-report.ts`: `MERCHANT_WORKSPACE_CREATED`, `classificationSource=SELF_SERVICE_SIGNUP`, REAL/POSSIBLE_EXTERNAL, excludes reference | **Strength**: avoids test/seed merchant inflation |
| Canonical event taxonomy | `src/modules/merchant/domain/merchant-activation.ts`, `docs/merchant-activation-v1.md` | **Strength**: A0, A3, A4, A6, A7, A9, A11, A12 observable |
| First Value UX | `docs/merchant-activation-v1.md`: first product → private Store preview | **Strength**: publishing is separate, avoids premature public exposure |
| Current report fields | Code exposes counts: firstItem, catalogReady, storePreviewed, storePublished, firstShopperSession, intent, checkout; rates for return, first item, catalog ready, Store published; average time to first item | **Gap**: no published A0→A6 7-day rate and time-to-preview on this report interface |
| Current cohort validity | `docs/merchant-activation-v1.md` §8–9 explicitly distinguishes REAL and POSSIBLE_EXTERNAL; historical activation pre-instrumentation | **Strength**: do not relabel pre-instrumentation histories as observed funnel |
| Channel attribution | `docs/merchant-activation-v1.md` §5 specifies first-touch snapshot; audit of capture/join by distinct Shopify/direct channel still outstanding | **To verify**: end-to-end event join, no duplicate source |
| Assisted/manual intervention | No durable intervention flag identified in the reviewed report/event taxonomy | **Gap**: cannot yet calculate unassisted First Value rate |
| Error recovery | Catalog inspection attempt/ready/empty/failed events exist | **To verify**: actual browser journey, copy, unsupported source recovery |

Current historical baseline in `docs/merchant-activation-v1.md` §9: **41 confirmed historical self-service Merchants, 2 reached Catalog/Store (2/41=4.9% first-item baseline)**. This is **pre-instrumentation and not A6 activation**, not a current channel conversion rate.

### C2. Public onboarding entry risk — observed, not yet E2E verified

The live public `Start Free` route displays an **agent-key-first** explanation; the implementation contract simultaneously specifies an in-product manual first-product path. This may be intentional Agent-first positioning, but SMB onboarding should not *require* understanding external AI Agent key/skill operations to achieve A6. Audit both entry paths and decide whether the human-readable, no-agent fallback is sufficiently prominent.

The paid Merchant Launch plan currently starts at **$199/mo** while publicly listed Shopify eyewear apps include lower entry tiers ($19 Specfit, $49 GlassOn, $59 Fittingbox). These are non-equivalent plans and **not grounds for immediate repricing**, but they create an activation→upgrade proof burden: our free plan excludes generative Try-On while the differentiated value proposition includes it. Stage 1 must evaluate a bounded product-proof/try-on evaluation path, entitlement safety, and contribution economics before a pricing or trial change.

### C2a. Live owned Demo Merchant UX — read-only 2026-11-03 (CONFIRMED_SOURCE)

- In already signed-in `VisuTry Demo`, Business Pricing `Start Free` goes to its **existing** Merchant Home. Six ready products and active Store are Demo/reference assets, **not** a fresh signup → A6 outcome.
- `Catalog → Add products` offers **Store URL** (default), **Upload CSV**, **Add manually**. The URL flow mentions Shopify, structured ecommerce data, sitemap, product pages and rendering; it promises no imported product write before approval. This is **not** Shopify OAuth integration.
- Manual item needs **name + usable image + SKU or product URL**. The Review button is gated until valid. A GUI fallback exists but fresh-user prominence and full Private Preview were **not tested**.
- **P0 friction / media lifecycle:** live UI warns, “Uploading creates a public image before you save the product. Remove unneeded images through merchant support.” Pre-save publicly stored images and support-only deletion undermine no-human self-service; review orphan retention, ownership, safe delete and security before changing behavior. **No image uploaded or data written**.
- Existing Store visible; A0→A6 new merchant, intervention-free first value and event joins still **UNKNOWN** until controlled nonproduction fixture and ledger trace.

Stage 2 candidates, not approved for shipping: manual first-item visibility, safe image cleanup UX, and durable 7d A0→A6 + median/p90 + intervention measurement.

### C3. Priority audit steps (no production writes)

1. Review live Business CTAs and real direct-signup route; test one bounded local/Preview merchant using approved existing TEST fixtures: start → A0 → A3/A4 → A6 and capture friction/screenshots.
2. Reconcile GA4 landing source → signup correlation → Postgres `MerchantActivationEvent`, without raw PII and without using GA4 as durable source.
3. Add a *read-only analytical definition* of 7-day A0→A6, median/p90 time-to-A6 and classification splits; **implement only after validating ledger timestamps and existing report use**.
4. Define minimum human-intervention counter: support contact, manual data setup, engineer action, with a privacy-safe tag. Don't treat an absent tag as proof of “unassisted”.
5. Select **top two measured blockers** in onboarding/import/preview/error recovery; fix via separate bounded PR with local browser E2E and no billing or publish semantics changes.
6. Test multi-entry consistency: directly signed-up merchant versus Shopify-authorized install should converge on same A6 and product state, while preserving safe merchant identity isolation.

### C4. Proposed acceptance criteria (targets, not observed outcomes)

- A0→A6 source events are joinable by merchant, timestamp, and channel, with test/reference exclusions; 0 denominators display `N/A` rather than 0%.
- Merchant can reach private Preview without contacting staff in the controlled local/Preview path.
- No invalid catalog rows counted as A4; no private draft published automatically.
- All changed UX covered by desktop/mobile or relevant app browser E2E and tenant isolation tests.
- Human support tickets and assisted sessions become measurable before claiming “self-service at scale”.

> **PO sequencing update, 2026-11-03:** The initial A/B/C rows below are a historical Stage 1 *discovery inventory*, **not an instruction to execute them in parallel**. From now on **A Merchant SEO/GEO = ACTIVE**, **C self-service = HOLD until A engineering/evidence exit gate**, **B Shopify = HOLD until C validation**. Canonical gate: [Merchant PLG strategy](merchant-plg-growth-v1.md#po-execution-priority--sequential-depth-2026-11-03).

### A-only active checklist (single-threaded focus)

| ID | Target artifact | Readiness condition |
| --- | --- | --- |
| A-01 | Nine-page Business GSC inspection matrix and crawl/render diagnosis | 9/9 classified by evidence; sitemap/canonical/robots/crawl log inconsistencies prioritized |
| A-02 | Real merchant query, country/device, competitors and SERP map | Two or three distinct query intents backed by search and honest current product value |
| A-03 | Business landing / Store proof / self-service CTA changes | Mobile+desktop UX, accurate plan/feature claims, links, CI, no Consumer regression |
| A-04 | Source-qualified acquisition measurement | Business entrance → signup intent, dedup/internal exclusion, clear GA4 vs durable-event boundary |
| A-05 | Release and observation report | Exact SHA, reproducible checks, 7/14/28-day scorecard; technical closure distinct from traffic validation |

**No blocking need to begin fresh Merchant creation or Shopify installation during A.** Publishing, billing, payment and shopper data behavior remain unchanged unless separately scoped and tested.

## Stage 1 next decision package

| Priority | Next deliverable | Gate |
| --- | --- | --- |
| P0-A1 | Verified 28/90d Merchant GSC + GA4 acquisition table | Real access and query/page segment |
| P0-A2 | Two Merchant page/topic briefs and current CTA fix spec | Search intent and product truth |
| P0-B1 | 4–6 Shopify eyewear app competitor matrix with exact app-store evidence | Current listings, differentiation |
| P0-B2 | Dev-store integration / billing / unit-economics Go-NoGo memo | No external writes or public app |
| P0-C1 | Local/Preview direct signup → A6 audited screenshots + event trace | Existing authorized test fixture |
| P0-C2 | 7-day A0→A6 / time to A6 / intervention instrumentation design | Cohort filters, no data backfill |

### Decision checkpoint

Do **not** advance to Stage 2 from documents alone. Stage 1 completes only when qualified demand, user journey evidence, cost and technical blockers have been tested. Until then, verdict is **RESEARCH IN PROGRESS**, not Merchant PLG product-market fit.

## External research links (official or native app listings)

- [Google Search Central — people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Search Central — AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Shopify App Store](https://apps.shopify.com/)
- [Shopify Dev — Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Shopify Dev — App Store review](https://shopify.dev/docs/apps/launch/app-store-review)
- [Shopify Dev — Billing](https://shopify.dev/docs/apps/launch/billing)


## Merchant SEO/GEO Wave 1 — 2026-11-03 implementation record

**Scope:** A-only first bounded release candidate; code [PR #512](https://github.com/franksunye/VisuTry/pull/512) is **DRAFT, not merged or deployed**. Strategy [PR #511](https://github.com/franksunye/VisuTry/pull/511) is separately DRAFT. Do not label any A exit gate PASS before exact-HEAD CI, preview E2E and production validation.

### A-01 — Technical hypothesis separation

- All nine EN Business URLs were inspected individually via GSC. Core-sitemap presence is verified for 9/9; three indexed, four discovered-but-not-indexed, two Google-unknown.
- The implementation `src/lib/sitemap-static.ts` intentionally emits English-only Business URLs, while `BusinessMarketingPage` redirects other locale variants to `/en`. Therefore no supported claim of nine-locale duplicate Business pages.
- `businessPageMetadata` supplies per-page self-canonical and OpenGraph data; sampled live URLs are indexable. **Neither missing sitemap nor robots/noindex explains the nine-page pattern.**
- Actual Googlebot access/crawl demand and quality/index selection remain partially unknown; no user-agent access logs or GSC Crawl Stats route breakdown were available in this pass.
- Found a bounded omission: the **Business Resources** page links to a real ungated demo/white paper but is absent from the core sitemap. PR #512 adds just this EN URL, without fake lastmod or claiming this fixes the other nine.

### A-02 — Three buyer-intent hypotheses (qualitative SERP, not search volume)

| Intent | Current destination | Specific answer and evidence | Boundary |
| --- | --- | --- | --- |
| AI eyewear shopping / guided product discovery for optical retailers | `/en/business` | What an eyewear brand/store gains from catalog-based recommendations, comparisons and a hosted decision journey. Product-specific H1/meta and action path in #512. | Not a claim of SEO/GEO referral traffic delivered to a merchant or guaranteed conversion lift. |
| Virtual try-on for eyewear stores / hosted eyewear storefront | `/en/business/store` | What shopper experience can be hosted; how to bring own frames, preview and continue to merchant product pages; practical common questions added in #512. | **Not** real-time AR, PD/physical-fit accuracy, native Shopify app, automatic catalog sync or free generative photo Try-On. |
| Eyewear virtual try-on pricing / compare merchant plans | `/en/business/pricing` | Clear Free vs paid entitlement and pilot options; #512 updates metadata/intro while leaving Stripe/prices unchanged. | Distinct consumer credits pricing; $0 does **not** include generative Try-On. |

Primary competitive SERP spot check: vendor-owned official product/plan pages such as [Banuba](https://www.banuba.com/glasses-virtual-try-on), [Perfect Corp AI Glasses Picker](https://www.perfectcorp.com/business/products/ai-glasses-picker), and [Fittingbox](https://fittingbox.com/en/glasses-virtual-try-on/standard-instore) confirm merchant buyer language emphasizes website integration, product catalog, VTO and recommendation. These observations **do not establish query volume or rank difficulty**. No keyword-volume provider data was available; re-evaluate in GSC when genuine Business queries appear.

### A-03 — Code candidate #512 (review required)

- Business Home/Store buyer-facing metadata, H1, merchant setup steps and visible feature limits, without fabricated customer proof.
- Business primary CTA → existing `/en/merchant?commercialIntent=FREE` across pages/header/closing/footer; Pilot retained as optional path. This is an acquisition-entry change **not** proof that unaided A0→A6 has passed.
- Existing GA4 B2B event `b2b_sales_intent_clicked` gains a distinct `intent_type=self_service_start`; pilot retains `pilot_request`. No new database schema or billing behavior.
- Unit and Playwright expectations updated for copy, canonical Store link, feature truth, free CTA, and separate pilot event. Build/unit tests and real preview E2E pending CI evidence.

### A-04/A-05 — Acceptance and observation

1. **Before merge:** CI on exact PR HEAD; click anonymous Start Free and confirm signin continuation and separate Pilot; verify 390px mobile and desktop; verify generated title/description/H1, canonical, indexable 200 on representative Home/Store/Pricing/Resources; no Consumer or paid-plan mutation.
2. **After deploy:** record production SHA/deploy ID, check CDN HTML freshness vs code; inspect Business Resources in sitemap; independently verify Analytics consent and self_service_start event delivery without sending fake production conversions.
3. **+7 days** after observed crawl/visibility: Business page/query impressions, indexed count (9-page matrix), first organic Merchant landing and CTA intent split, with GA4 sampling/attribution caveats.
4. **+14 days:** update long-tail query evidence and detect self-brand/nonbrand coverage, pagination/canonical/indexing regressions.
5. **+28 days after recrawl:** compare complete matched 28-day GSC windows by page×query×country/device; report ranking/impressions/clicks separately from source-qualified Merchant starts. Zero historical clicks means a 10x ratio is meaningless: report absolute qualified volume instead.
6. **Decision:** A engineering closure is possible after technical gates; external search growth/AI citation impact remains **OBSERVATION**, never claimed at code-release time. C stays HOLD until A closure is reviewed.
