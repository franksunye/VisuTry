# Merchant PLG Baseline & Three Work Packages — 2026-11-03

**Status:** Stage 1 in progress — first research and code-contract review only; **not a market validation or live E2E pass**
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

### A2. Initial query-intent map — research candidates, no verified volumes (HYPOTHESIS)

| Cluster | Example English query | Intent | Candidate Business destination | Validation |
| --- | --- | --- | --- | --- |
| Commerce integration | `virtual try on glasses shopify` / `shopify eyewear try on app` | Merchant solution comparison | Dedicated Shopify integration/solution page **only after viable integration exists**; until then research article with no availability claim | GSC, keyword/competition research, Shopify App Store language |
| Merchant VTO | `eyewear virtual try on software` / `AI glasses try on for ecommerce` | Merchant software selection | Business Store/Platform with actual outcome demo | Query intent and serp competitors |
| Conversion/decision | `eyewear product recommendations for online store` | Merchants seeking decision help | Store + recommendation/compare proof | SERP relevance and qualified signup rate |
| SMB onboarding | `virtual try on for small optical shop` | Low-support small retailer | Self-service how-it-works/pricing, **after copy and onboarding truth** | Qualitative merchant interviews/search tests |
| Discovery for eyewear merchants | `eyewear store AI search visibility` | Discoverability question | Merchant discovery/intent explanation; no guaranteed AI rankings | Query existence and credibility of merchant value |

**Content rule:** Two genuinely different intents merit two genuinely different helpful pages; keyword permutations alone do not. Google says AI-search discoverability uses existing people-first SEO practices, not a special GEO markup scheme.

### A3. Baseline capture checklist (UNKNOWN until independently measured)

- GSC property: last 28/90d `/business` page + query + country + device performance; nonbrand Merchant intent vs Consumer pages; indexing and cannibalization.
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
- [Specfit](https://apps.shopify.com/specfit)
- [Shopify App Store listing requirements](https://shopify.dev/docs/apps/launch/app-store-review)

Record exact present-day plan limits, visible reviews, positioning, surface (AR/live 3D vs AI image try-on), onboarding steps and evidence in a follow-up competitor matrix; do not rely on unverified search-result price snippets as canonical.

### B2. Required integration design — feasibility hypothesis, not implemented

1. Discovery → listing → approved Shopify install, OAuth, minimal **read_products** permission.
2. Authorized product selection/import → existing VisuTry catalog and readiness contract; no bulk import or editing without merchant choice.
3. **Private Store preview** (same A6 definition as direct signup). Merchant identity must remain tenant-scoped and deduplicated across re-install and direct accounts.
4. Merchant-controlled **Theme App Extension**: app block or app embed enabled in theme editor; preview/status must explain an unactivated block rather than silently altering storefront themes.
5. Guest shopper interactions with consent, privacy boundaries, quota protection, stable performance and observable decision actions.
6. Storefront/cart handoff to Shopify where appropriate; distinguish handoff from observed purchase. Never infer revenue from a click.
7. App billing (Shopify-approved subscription/usage terms where required) via a **channel-specific adapter**, shared product entitlements and metering, direct Stripe path unchanged.
8. Webhook product update/delete, app/uninstall lifecycle, data retention/privacy, consent handling, safe sync retry and rate-limit reconciliation.

Official technical anchors: [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions), [Admin GraphQL products](https://shopify.dev/docs/api/admin-graphql/latest/queries/products), [Shopify Billing](https://shopify.dev/docs/apps/launch/billing), [App Store Review](https://shopify.dev/docs/apps/launch/app-store-review).

### B3. Unresolved risks and Go/No-Go

| Risk / question | Current evidence | Gate |
| --- | --- | --- |
| Does App Store organic discovery bring eyewear SMBs? | Competing apps exist; no verified category search volume or qualified install rate | Competing app review/query analysis + listing acquisition assumptions |
| Is asynchronous AI image try-on the right Shopify shopper UX vs real-time AR? | VisuTry image-generation product proven only in its own surfaces; direct Shopify rivals offer AR/3D | Demo customer journey: delay, UX, fit expectations, first use |
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

### C2. Priority audit steps (no production writes)

1. Review live Business CTAs and real direct-signup route; test one bounded local/Preview merchant using approved existing TEST fixtures: start → A0 → A3/A4 → A6 and capture friction/screenshots.
2. Reconcile GA4 landing source → signup correlation → Postgres `MerchantActivationEvent`, without raw PII and without using GA4 as durable source.
3. Add a *read-only analytical definition* of 7-day A0→A6, median/p90 time-to-A6 and classification splits; **implement only after validating ledger timestamps and existing report use**.
4. Define minimum human-intervention counter: support contact, manual data setup, engineer action, with a privacy-safe tag. Don't treat an absent tag as proof of “unassisted”.
5. Select **top two measured blockers** in onboarding/import/preview/error recovery; fix via separate bounded PR with local browser E2E and no billing or publish semantics changes.
6. Test multi-entry consistency: directly signed-up merchant versus Shopify-authorized install should converge on same A6 and product state, while preserving safe merchant identity isolation.

### C3. Proposed acceptance criteria (targets, not observed outcomes)

- A0→A6 source events are joinable by merchant, timestamp, and channel, with test/reference exclusions; 0 denominators display `N/A` rather than 0%.
- Merchant can reach private Preview without contacting staff in the controlled local/Preview path.
- No invalid catalog rows counted as A4; no private draft published automatically.
- All changed UX covered by desktop/mobile or relevant app browser E2E and tenant isolation tests.
- Human support tickets and assisted sessions become measurable before claiming “self-service at scale”.

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
