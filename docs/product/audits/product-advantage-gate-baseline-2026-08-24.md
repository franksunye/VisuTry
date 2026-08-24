# Product Advantage Gate Baseline

**Audit date:** 2026-08-24
**Branch:** `codex/product-advantage-gate-baseline-2026-08-24`
**Starting SHA:** `3699f57a0d0cd8ba38f4d84de9412e987568658d`

## Executive Verdict

Gate A: PARTIAL
Gate B: PARTIAL
Gate C: PARTIAL

Overall Outreach Gate: GATED

The Consumer public surfaces and much of the Merchant / MCP foundation are
implemented and visually credible in the inspected paths. The gates do not pass
because Gate A distribution outcomes are not proven, Gate B still lacks an
authenticated merchant-readable insight review, and current-SHA Codex/Cursor
Golden Paths have not completed. Real-merchant acceptance is intentionally not
used in these verdicts; it is the first post-outreach Merchant Validation gate.
No agent traffic or merchant conversion outcome is proven by the current data.

## Gate A

### Proven

- **Implemented and objectively proven — public route quality:** live browser
  checks on `/en`, `/en/face-shape-detector`, `/en/face-analysis`,
  `/en/try-on/glasses`, and `/en/try-on/glasses/compare` showed the intended
  route titles/H1s, canonical URLs, index/follow policy, visible continuation
  links, and no horizontal overflow at a 390px viewport. The inspected routes
  rendered their expected Organization/WebSite plus tool-specific
  SoftwareApplication/FAQPage/HowTo structured data.
- **Implemented and objectively proven — core journey entry points:**
  `src/app/[locale]/(main)/page.tsx` exposes Detector, Advisor, Try-On, and
  Compare as a connected four-step path. The live homepage has a primary
  Detector CTA and secondary Try-On CTA; the Detector initial state is private,
  no-login, on-device, and has no dead-end in the first view.
- **Implemented and objectively proven — Detector measurement:**
  `src/components/face-shape/FreeFaceShapeDetector.tsx` records start, upload,
  completion, and failure events through `src/lib/analytics.ts`; the result
  records continuation CTA and photo-handoff events.
- **Implemented and objectively proven — Detector → Try-On handoff:**
  `src/components/face-shape/FreeFaceShapeResult.tsx` now provides a direct
  “Try on your photo” action, reuses the private IndexedDB photo handoff, and
  routes to `/en/try-on/glasses`. The Try-On route preserves the whitelisted
  handoff query through sign-in, and `TryOnInterface` restores the photo after
  authentication. The regression test covers the route and CTA event.
- **Implemented and objectively proven — technical discoverability:**
  `/sitemap.xml` and `/robots.txt` returned HTTP 200 in the production check;
  `src/app/sitemaps/core.xml/route.ts`, `src/lib/sitemap-static.ts`, and
  `src/app/robots.ts` provide canonical, sitemap, crawler, and bot policy
  behavior. The live Consumer routes have canonical/indexability metadata.
- **Implemented and objectively proven — first-touch persistence foundation:**
  `src/lib/analytics.ts` freezes UTM/referrer attribution in session storage;
  Store sessions persist sanitized `source`, `medium`, `campaign`, `referrer`,
  `landingUrl`, `acquisitionSurface`, and `aiAgentSource` through
  `src/modules/store/application/create-store-session.ts` and
  `MerchantSession`.

### Partial

- **Implemented but not yet proven — known AI referral attribution:**
  `src/modules/store/domain/session-acquisition.ts` now separately classifies
  ChatGPT, OpenAI, Perplexity, Gemini, Copilot, and Claude from explicit source
  or trusted referrer host; `getMerchantAttributionBreakdown` exposes
  `aiAgentSource`. There is no current production evidence slice proving counts
  for those sources. The consumer analytics path still stores normalized
  first-touch source/medium rather than one shared channel schema.
- **Partial — journey continuity:**
  Detector → Advisor and Detector → Try-On now preserve state in the tested
  handoffs; the full authenticated Try-On → Compare and downstream intent path
  still needs a browser run with a real or approved isolated account.
- **Partial — indexable merchant distribution:**
  `src/modules/store/domain/experience-search-visibility.ts` and
  `src/lib/store-discovery-sitemap.ts` correctly gate public Store/Campaign
  indexing. The live `/sitemaps/dynamic.xml` is currently an empty URL set, so
  no public Merchant Experience distribution is proven. This is a consequence
  of the missing active/indexable Experience evidence, not a reason to create
  generic SEO pages.
- **Partial — SEO/GEO architecture reconciliation:**
  `src/lib/sitemap-static.ts` emits localized entries for the `staticPagePaths`
  consumer cluster, while
  `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` calls for
  reviewed English-first indexability for the new tool/content cluster. The
  route-by-route policy needs an explicit reconciliation.

### Missing

- A single durable, queryable Consumer funnel key connecting discovery/page
  view, useful decision interaction, recommendation, try-on/compare, and intent.
  Current sources are split between GA page views/events and Store
  `MerchantSession` / `MerchantEvent` / `MerchantIntent` records.
- A production evidence report separating ChatGPT, OpenAI, Perplexity, Gemini,
  Copilot, Claude, generic referral, organic, direct, social, and paid traffic.
  Raw UTM/source/medium persistence exists, but the data needed to claim agent
  distribution is not present in this audit.

### P0

- **A-P0-1 — Agent/distribution proof:** produce a read-only production or
  controlled analytics evidence slice for the required source classes and map
  each class to session, Experience, and intent records. Acceptance: counts and
  denominators are reproducible from named events/data fields; otherwise the
  gate remains unproven.
- **A-P0-2 — Public Experience distribution:** resolve the admitted live Store /
  Campaign data or entitlement state so the dynamic sitemap contains only a
  current, intentional public Experience. Acceptance: a published live
  Experience passes route admission, metadata, sitemap, browser journey, and
  measurable intent checks without changing the Consumer stability boundary.

### P1

- Normalize a shared acquisition-channel contract for organic, direct, social,
  paid, generic referral, and known AI referrals across `src/lib/analytics.ts`,
  `MerchantSession`, and Merchant / Experience reporting; retain raw UTM and
  referrer fields for auditability.
- Reconcile `src/lib/sitemap-static.ts` and route metadata with the English-first
  SEO/GEO policy, with a test for every route family rather than adding pages.
- Add an end-to-end funnel assertion covering Detector → Advisor → Try-On →
  Compare with preserved state and measured continuation events.

### Evidence

Minimum observable funnel at this baseline:

| Stage | Current source | Status / gap |
| --- | --- | --- |
| Discovery | Core sitemap, canonical/structured metadata, Search Console / GA page views | Technical surface proven; no current agent/referral outcome data. |
| Visit | GA automatic `page_view`; Store `MerchantSession` created by `/api/store/sessions` | Visit exists, but Consumer has no durable funnel record shared with later actions. |
| Useful Decision Interaction | Detector upload/complete/fail; Advisor analysis events; Store `merchant_page_viewed` and recommendation events | Implemented; cross-system join and current production counts are not proven. |
| Recommendation / Try-On / Compare | Consumer `recommendation_*`, `tryon_*`, `comparison_*`; Store MerchantEvents and usage records | Implemented in separate schemas; Detector direct Try-On handoff is covered by a regression test, but full authenticated continuation is not yet proven. |
| Intent | Consumer `purchase_intent_clicked` where applicable; Store `MerchantIntent`, product click/favorite/inquiry events | Store intent is durable; no unified Consumer-to-merchant intent proof. |

## Gate B

### Proven

- **Implemented and objectively proven — Business Website:** live browser
  checks on `/en/business`, `/en/business/pilot`, and `/en/business/examples`
  showed current supported copy, current product screenshot treatment, and a
  coherent Business visual hierarchy. The Pilot page exposes the durable form
  flow rather than only a `mailto` handoff.
- **Implemented and objectively proven — responsive first view:** the inspected
  Business and Campaign routes had `scrollWidth === innerWidth` at 390px; no
  horizontal overflow was detected. Desktop inspection at 1280px showed a
  premium, agency-facing Business hero.
- **Implemented and objectively proven — Campaign presentation:**
  `/en/c/akila/statement-frames` and `/en/c/ello-sunglasses/petite-fit`
  rendered current editorial heroes, campaign narratives, selected catalog
  subsets, product CTAs, merchant CTAs, and source / UTM query continuity.
  These are visibly distinct from the default Store shell. Reference routes
  intentionally use `noindex, follow`; that is not a defect in Reference proof.
- **Implemented and objectively proven — canonical Reference Store runtime:**
  `/en/store/ello-sunglasses` is the active Reference Store named by
  `src/config/business-site.ts` and current operations documentation. Production
  browser inspection returned the branded catalog route with product-first
  presentation, products, Reference pilot disclosure, canonical metadata, and
  no horizontal overflow at 1280px. A fresh local server returned HTTP 200 with
  the same Store runtime. The old `/en/store/luna-optical` assumption is not
  canonical: its current data is absent and the route correctly renders the
  unavailable/not-found state.
- **Implemented and objectively proven — controlled shopper continuation:**
  the fresh Reference Store/Campaign Playwright run covers Store entry, Store
  hydration, Campaign shell, contextual handoff, mobile presentation, source
  continuity, and compare-policy behavior. The compare test uses an isolated
  controlled fixture and does not call an AI provider.
- **Implemented but not yet proven — merchant-readable analytics:**
  `src/modules/store/application/get-merchant-insights.ts`, Admin Experience
  surfaces, `get_experience_funnel`, `get_top_frames`, and
  `get_intent_summary` provide measurable recommendation, try-on, compare,
  product-click, and intent-oriented signals. A current authenticated browser
  review of the Admin / Workspace output was not available in this run.

### Partial

- **Partial — full shopper execution:** Reference routes prove the branded
  Store/Campaign shell, recommendation entry, try-on entry, compare policy, and
  attribution handoff. A provider-backed recommendation/try-on result and the
  full authenticated consumer-to-intent continuation still need a safe isolated
  account run; this is not a reason to resurrect Luna or require a real merchant
  before outreach.
- **Partial — Merchant Workspace quality:**
  `src/components/merchant/MerchantControlCenter.tsx` is functional and
  safety-conscious, but its visible center of gravity is Agent Key setup and
  startup instructions. Connected OAuth authorization visibility and a concise
  business-readable result summary are not yet present in the UI.

### Missing

- A current authenticated browser review of the merchant-readable Commerce
  Intelligence / Admin output against a controlled fixture. The application
  services and Admin views exist, but implementation existence is not visual
  proof.
- A safe isolated provider-backed Store shopper run covering recommendation,
  try-on, compare, and measurable product/inquiry intent end to end. Current
  controlled Playwright coverage proves the shell and compare policy, not
  provider output.

### P0

- **B-P0-1 — Merchant-readable insight proof:** the current authenticated
  `/en/merchant` browser surface exposes business-readable `Store`, `Campaigns`,
  and `Insights` states, but the visible workspace has `Insights: No data yet`
  and `/admin/store` redirects to the Consumer route with `error=Forbidden`.
  Acceptance: use a controlled, clearly labeled fixture (not a real merchant)
  to browser-prove the current `/en/merchant` or Admin Experience output with
  measured Visitors/Engaged Shoppers, Recommendation Rate, Try-On Rate,
  Compare Rate, Product Click, Inquiry/Lead where enabled, High-Intent
  Shoppers, and Acquisition Source fields; do not invent unavailable metrics.
- **No remaining canonical Store runtime P0 after this pass.** The old
  `/en/store/luna-optical` failure was a stale/deprecated Reference assumption,
  not a reason to add obsolete fixture data. The active canonical
  `/en/store/ello-sunglasses` route is production-valid and the fresh local
  Store/Campaign suite is green after correcting one stale presentation-mode
  assertion. If a future canonical Store fails route admission, that exact
  route/runtime/data regression returns as a Gate B P0.

### P1

- Add connected OAuth authorization list/revoke controls to the Merchant
  Workspace, alongside the existing Agent Key list/rotate/revoke controls.
- Add a compact merchant-readable summary to the Store/Campaign preview and
  post-publish result surfaces using only currently measured fields:
  Visitors, Engaged Shoppers, Recommendation Rate, Try-On Rate, Compare Rate,
  Product Click, Inquiry/Lead where enabled, High-Intent Shoppers, and
  Acquisition Source.
- Add explicit loading, error, empty, and processing assertions for Store and
  Campaign at desktop and mobile widths.
- Re-run authenticated Admin / Commerce Intelligence screenshots against a
  current controlled fixture; current code existence is not visual proof.
- Run a provider-backed controlled Store shopper fixture through recommendation,
  try-on, compare, and measurable product/inquiry intent.

### Evidence

- Business, active Reference Store, and AKILA/ello Campaign route checks passed
  visually at desktop and mobile inspection; no stale screenshot was observed in
  the first view. The active Store has branded catalog content, product CTAs,
  recommendation/try-on entry, compare continuation, and Reference disclosure.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test
  tests/e2e/business.spec.ts tests/e2e/store-pilot.spec.ts --project=chromium`
  passed 12 tests after the test-contract correction. The initial fresh-server
  run was 11 passed / 1 failed; the only failure was the stale expectation that
  a configured `EDITORIAL_FIRST` Campaign changes to `ACTION_FIRST` after a
  contextual click. `resolvePresentationMode` and its unit tests intentionally
  preserve persisted merchant configuration.
- Production browser checks: `/en/store/ello-sunglasses` and both current
  Campaign References returned successfully with canonical metadata and no
  horizontal overflow at 1280px; `/en/store/luna-optical` returned the
  unavailable state with `noindex, nofollow` because its old fixture is absent.
- `tests/unit/modules/store/merchant-attribution.test.ts`, Store handoff/SEO
  tests, and Merchant Workspace/MCP route tests passed in the targeted unit
  run: 8 suites, 40 tests. Merchant-readable analytics remain implemented but
  not authenticated-browser-proven.

## Gate C

### Proven

- **Implemented and objectively proven — protocol discovery:** production
  `GET /api/mcp/.well-known/oauth-protected-resource`,
  `/.well-known/oauth-authorization-server`, and
  `/api/mcp/.well-known/oauth-authorization-server` returned valid discovery
  metadata. The advertised resource is `https://www.visutry.com/api/mcp` and
  the scopes include merchant, catalog, experience, and analytics read/write
  scopes as applicable.
- **Implemented and objectively proven — bounded tool surface:**
  `src/modules/merchant/mcp/server.ts` registers catalog inspection/intake,
  validation, Store/Campaign creation/configuration/preview/publish, and
  aggregate analytics tools. `publish_store` and `publish_campaign` require an
  explicit `approved` boolean; tool annotations and server instructions expose
  read-only, destructive, idempotent, tenant, and approval boundaries.
- **Implemented and objectively proven — catalog safety contract:**
  `inspect_catalog_source` is bounded and read-only; `import_frames` is a
  separate write after approval; source intake limits public HTTP/HTTPS scope,
  redirects, size, timeout, and candidate count. Tenant checks flow through the
  merchant actor and repository boundaries.
- **Implemented and objectively proven — credential primitives:** Agent Key
  create/rotate/revoke APIs and Merchant Workspace controls exist. OAuth
  authorization, token, revoke, and authorization-list APIs exist in
  `src/app/api/merchant/[merchantId]/oauth-authorizations`.
- **Implemented but not yet proven on this SHA — historical Codex evidence:**
  `docs/product/plans/universal-agent-access.md` records a production Codex
  Golden Path on an older deployment SHA. The repository and production MCP
  discovery have changed since that evidence, so it is retained as historical
  evidence, not a current PASS.

### Partial

- **Partial — commercial Golden Path coverage:** tools support
  inspect → intake/validate → create draft → configure → preview → explicit
  approval publish → analytics, but there is no dedicated `update_store` or
  generic `get_store`/`list_experiences` tool. `get_onboarding_status` and
  experience summary tools cover part of the inspection contract.
- **Partial — OAuth lifecycle:** backend list/revoke endpoints exist, but the
  Merchant Workspace only loads Agent Keys; connected OAuth authorizations are
  not visible or revocable from the merchant UI, and expired request/code/token
  cleanup is not implemented.
- **Partial — database protocol proof:** the targeted MCP/OAuth tests passed but
  use mocked OAuth boundaries in the existing suite. A current DB-backed
  Streamable HTTP protocol run is not recorded.

### Missing

- Current-SHA Codex Golden Path evidence using an isolated merchant:
  authorization, workspace inspection, catalog validation/intake, draft
  Experience, preview, explicit approval, publish, analytics, and result
  summary. The local Codex CLI is configured for `visutry`, but its refresh
  token returned `invalid_grant`; reauthorization displayed `My Merchant
  Workspace (my-merchant-workspace-3 · OWNER)`. The standard reauthorization
  completed, but the next Codex run failed MCP handshake with `invalid_token`
  before `tools/list`; no catalog, Experience, publish, or analytics write was
  performed.
- Cursor Golden Path evidence. The exact remaining validation is to configure
  Cursor with the production MCP endpoint and OAuth/PKCE discovery, complete the
  same isolated-merchant read/write flow, and capture the tool transcript and
  resulting merchant/Experience IDs. No Cursor client/session is installed or
  authenticated in this environment.

### P0

- **C-P0-1 — Current Codex proof:** re-run the full Golden Path against the
  current deployed SHA or a production-equivalent isolated fixture. Acceptance:
  every step in the Gate C sequence succeeds through MCP, no manual DB/API
  intervention occurs, all writes are tenant-scoped/idempotent, and publish is
  impossible without `approved=true`.
- **C-P0-2 — Cursor proof:** execute the same flow from Cursor with the
  published endpoint and OAuth discovery. Acceptance: tool discovery,
  authorization, draft creation, preview, explicit-approval publish, and
  analytics all complete; otherwise record the exact client/protocol blocker.

### P1

- Add Merchant Workspace connected-OAuth list/revoke UI and expired artifact
  cleanup, as already scoped in `universal-agent-access.md`.
- Add DB-backed MCP protocol regression coverage rather than only mocked OAuth
  boundaries.
- Add explicit Store inspection/update tools or document the intended
  `get_onboarding_status` / summary contract and cover it with an acceptance
  test. This is P1 while `get_onboarding_status` plus `create_store`,
  `set_store_frames`, `preview_store`, and `publish_store` cover the current
  Store Golden Path; promote it to P0 if an isolated Golden Path run proves
  those capabilities cannot inspect or update the Store.
- Add a merchant-readable, machine-readable final result summary that includes
  Experience URL/status, catalog counts/validation state, traffic-source
  summary, and measurable funnel fields without claiming revenue attribution.

### Evidence

- The prior baseline targeted MCP/OAuth validation passed: 8 suites, 37 tests,
  including MCP route, OAuth HTTP contract, catalog intake, Store
  attribution/SEO, and Merchant Workspace tests. The current focused
  presentation/attribution/insight re-run passed 8 suites, 40 tests.
- Live MCP/OAuth discovery passed with HTTP 200 metadata; authenticated
  `tools/list` and write execution were not run in this environment. The
  first current Codex CLI attempt was blocked before tool enumeration by an
  expired OAuth refresh token (`invalid_grant`). Standard reauthorization
  completed against the visible no-data `My Merchant Workspace`, but a second
  run failed the MCP handshake with `invalid_token`; the current Codex Golden
  Path therefore remains unproven.
- The existing `docs/product/plans/universal-agent-access.md` is useful
  historical evidence but explicitly says Cursor/Claude are not confirmed and
  identifies OAuth UI/cleanup and DB protocol tests as remaining work.

## Cross-Gate Dependencies

- Store route admission controls both Gate B shopper availability and Gate A
  merchant distribution/sitemap evidence.
- `MerchantSession` acquisition fields feed Gate A attribution, Gate B
  Experience reporting, and Gate C analytics summaries; raw source persistence
  is not enough without a reproducible reporting slice.
- OAuth lifecycle and client compatibility are prerequisites for a credible
  Gate C merchant Golden Path; they must not be replaced by manual keys or DB
  setup in the evidence run.
- A controlled Reference/simulation fixture is valid for Gate B pre-outreach
  proof when it is clearly labeled. A dedicated isolated merchant/workspace is
  required for Gate C write evidence; it must not be confused with the
  post-outreach First Real Merchant validation gate.

## Post-Outreach Validation

This is deliberately outside the pre-outreach Product Advantage Gate and was
not run in this pass:

```text
First Real Merchant → own catalog → declared traffic source
→ live shopper activity → intent review → continuation / pricing evidence
```

It starts only after Gate A, Gate B, and Gate C are all `PASS` and Outreach
Ready has been declared. Real-merchant catalog, real traffic, and real intent
acceptance must not be used to fail Gate B before outreach.

## Cursor Golden Path Connection Instructions

Repository-side MCP compatibility is already in place. The remaining external
validation action is exactly:

1. In Cursor, open Settings → Tools & Integrations → add a custom remote MCP
   server named `visutry`.
2. Set the Streamable HTTP URL to
   `https://www.visutry.com/api/mcp`; do not paste a static Authorization
   header. Allow Cursor to use the advertised OAuth/PKCE discovery.
3. Authenticate and select only the dedicated isolated test Merchant/workspace;
   do not use a real customer merchant.
4. Run `tools/list`, then the same sequence:
   `get_merchant` → `get_onboarding_status` → `list_frames` /
   `inspect_catalog_source` → `validate_catalog` → `import_frames` (only after
   explicit catalog approval) → `create_store` or `create_campaign` → frame
   selection/configuration → `preview_*` → merchant-readable summary →
   `publish_*` with `approved: true` → `get_experience_summary`,
   `get_experience_funnel`, and `get_intent_summary`.
5. Capture the Cursor tool transcript, workspace ID, catalog validation result,
   Experience ID/URL, preview result, approval boundary, publish result, and
   analytics result. Revoke the test authorization and archive the test
   Experience after evidence capture if the isolated workspace policy requires
   cleanup.

The single remaining external action is completing that authenticated Cursor
session against a proven isolated workspace. Until then Gate C is `PARTIAL`,
not `PASS`.

## Explicit Non-Goals

- No Shopify public app, WooCommerce plugin, CRM integration, generalized
  Campaign Builder, revenue attribution system, broad public API, new Reference
  Brands, unrelated infrastructure rewrite, speculative agent feature, or
  generic programmatic SEO.
- No merchant outreach list, outreach message, or outbound communication.
- No weakening of the Consumer stability boundary.

## Recommended Execution Order

1. Keep the active canonical Reference Store/Campaign routes and their fresh
   browser suite green; do not restore the deprecated Luna fixture.
2. Browser-prove the full Detector → Advisor → Try-On → Compare continuity with
   the state-preserving handoff and regression assertions now in place.
3. Produce a current-SHA Codex MCP Golden Path, then complete the explicitly
   recorded Cursor validation with an isolated merchant.
4. Re-run authenticated merchant-readable Commerce Intelligence evidence and
   the controlled provider-backed Store shopper fixture.
5. Only after A, B, and C evidence is complete may the product plan authorize
   controlled outreach; then begin the separate First Real Merchant validation.

## Definition of Done Remaining

- Gate A has a browser-proven Detector → Advisor → Try-On → Compare continuation,
  current-source funnel events, reconciled SEO/GEO indexability, and a
  reproducible source-class evidence report.
- Gate B has a current available branded Store, a distinct Campaign path, green
  desktop/mobile loading/error/empty checks, a controlled provider-backed
  shopper run, and authenticated merchant-readable metrics from a Reference,
  simulation, or controlled fixture. Real-merchant acceptance is not a Gate B
  requirement.
- Gate C has current-SHA Codex and Cursor transcripts/results, DB-backed
  protocol coverage, visible OAuth lifecycle controls or a documented safe
  equivalent, and no manual intervention in the Golden Path.
- The three gate verdicts are all `PASS` in a subsequent dated baseline; until
  then the Outreach Gate remains `GATED`.
