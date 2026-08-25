# Product Advantage Gate Baseline

**Audit date:** 2026-08-25
**Branch:** `codex/product-advantage-gate-baseline-2026-08-24`
**Starting SHA:** `204573bf19959c80481ebfbb889045f25bb251f1`
**Evidence-closure pass started at:** `d809564a8562ede9341028998435fd43300f034a`
**Criteria-normalization pass started at:** `75f62c40164dfb42c2378ea7d49e44e47abab74f`
**Current observability pass started at:** `e2733f951c0c9e917df26547cf0280eb93634e51`

## Executive Verdict

Gate A: PARTIAL
Gate B: PASS
Gate C: PASS (Agent-Native Core; Cursor interoperability P1)

Overall Outreach Gate: GATED

The Consumer public surfaces and much of the Merchant / MCP foundation are
implemented and visually credible in the inspected paths. This evidence-closure
pass deployed SHA `84ed761393fa88c8228847fa556d2e42668679c8` to the production
Vercel environment, completed a fresh Codex OAuth/MCP/Golden Path run, and
browser-proved populated Merchant Workspace Commerce Intelligence on desktop
and mobile. Gate B now passes because the populated state is authenticated,
the empty state is deterministic component-tested through the same production
contract, and there is no remaining Gate B P0. Gate C Agent-Native Core and
standards-based MCP/OAuth pass on the current-SHA Codex evidence; Cursor's
localhost callback failure is an external client/environment interoperability
P1, not a VisuTry server defect. Gate A has a durable Store/Campaign
source-class → decision-action report, but the core Consumer GA4 join and
genuine production Agent referral evidence remain incomplete. Real-merchant
acceptance is intentionally not used in these verdicts; it is the first
post-outreach Merchant Validation gate. No agent traffic or merchant conversion
outcome is proven by the current data. Product has selected the active Hard
Distribution Gate: Outreach remains GATED until Gate A L3, Gate B, and Gate C
pass. The rolling 14-day threshold and weekly growth loop bound the waiting
risk without accepting technical readiness or synthetic traffic as proof.

## Gate A

### Agent-Native Core — Proven

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
- **Implemented and objectively proven — durable Store/Campaign source-action
  report:** `src/modules/store/domain/merchant-distribution-report.ts` classifies
  persisted sessions into ChatGPT, OpenAI, Perplexity, Gemini, Copilot, Claude,
  organic search, generic referral, paid, direct, social, and other. The
  Cloudflare Merchant Workspace read model joins those source classes to
  durable recommendation, Try-On, Compare, Product Click, Inquiry, engagement,
  and High-Intent signals without raw-log reconstruction. The UI renders this
  as `Source → decision actions` and labels the Consumer event boundary.

- **Implemented in this pass — privacy-safe Consumer action telemetry:**
  `src/lib/consumer-funnel.ts` creates an anonymous browser-session identifier
  and sends only allowlisted Store/Campaign shopper and standalone Consumer
  decision events to `/api/analytics/consumer-funnel`. The route strips
  unknown fields, derives the test boundary from the `test-session` cookie,
  and writes structured events to the existing Vercel/Axiom log stream. The
  server derives source_class and known agent_source from the allowlisted
  source/medium/referrer fields; the browser cannot self-label production
  evidence. No photo, face geometry, user ID, or free-form text is sent. This is
  implementation and regression-test evidence, not production distribution
  evidence.

### Partial

- **Implemented but not yet proven — known AI referral attribution:**
  `src/modules/store/domain/session-acquisition.ts` now separately classifies
  ChatGPT, OpenAI, Perplexity, Gemini, Copilot, and Claude from explicit source
  or trusted referrer host; `getMerchantAttributionBreakdown` exposes
  `aiAgentSource`. There is no current production evidence slice proving counts
  for those sources. The consumer analytics path still stores normalized
  first-touch source/medium rather than one shared channel schema.
- **Technical readiness boundary:** source parsing, persistence, the
  Store/Campaign source-action report, and Consumer decision events are
  implementation evidence. Synthetic attribution requests are labelled `TEST`
  and cannot satisfy real distribution proof. The report does not claim that
  GA4-only Detector or Advisor events are durably joined to Store sessions.
- **Partial — journey continuity:**
  Detector → Advisor and Detector → Try-On now preserve state in the tested
  handoffs; the full authenticated Try-On → Compare and downstream intent path
  still needs a browser run with a real or approved isolated account.
- **Partial — indexable merchant distribution:**
  `src/modules/store/domain/experience-search-visibility.ts` and
  `src/lib/store-discovery-sitemap.ts` correctly gate public Store/Campaign
  indexing. The live `/sitemaps/dynamic.xml` is currently an empty URL set. The
  canonical Reference Store/Campaign surfaces are intentionally `noindex,
  follow`, so this is not a technical blocker under the active policy. A future
  active live Experience admitted as `PUBLIC_INDEX` must appear there.
- **Partial — SEO/GEO architecture reconciliation:**
  `src/lib/sitemap-static.ts` emits localized entries for the `staticPagePaths`
  consumer cluster, while
  `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` calls for
  reviewed English-first indexability for the new tool/content cluster. The
  route-by-route policy needs an explicit reconciliation.

### Missing

- A durable join between core Consumer GA4/dataLayer events and
  `MerchantSession`; Detector and Advisor counts therefore remain unavailable
  in the first-party source-action report. This is an explicit data boundary,
  not a reason to fabricate joins.
- A deployed, merchant/product-readable rolling 14-day Consumer source →
  action report. The new first-party event stream is the smallest safe source
  available, but it has not yet accumulated a production observation window in
  this branch.
- Genuine production Agent referral evidence: the source-action report is ready
  to inspect future durable Store/Campaign traffic, but no genuine production
  Agent referral with a meaningful Consumer action is present in this audit.

### P0

- **A-P0-1 — Durable source/action reporting (partially closed):** the
  read-only Store/Campaign report produces reproducible source-class counts and
  action counts from `MerchantSession`, `MerchantEvent`, and
  `MerchantIntent`. This pass adds a separate privacy-safe first-party
  Consumer event stream for future source → action inspection without
  pretending it is already a report. The remaining boundary is deployment plus
  a rolling production observation window; no unsupported
  GA4/dataLayer-to-`MerchantSession` join is claimed.
- **A-P0-2 — Genuine distribution evidence:** observe one real production
  AI-assistant/agent referral, classify it distinctly, connect it to a persisted
  session, and verify one meaningful Consumer decision action. Synthetic traffic
  cannot satisfy this item. The dynamic sitemap is not a P0 by itself because
  the current canonical Reference surfaces are deliberately noindex.

### P1

- Normalize a shared acquisition-channel contract for organic, direct, social,
  paid, generic referral, and known AI referrals across `src/lib/analytics.ts`,
  `MerchantSession`, and Merchant / Experience reporting; retain raw UTM and
  referrer fields for auditability.
- Reconcile `src/lib/sitemap-static.ts` and route metadata with the English-first
  SEO/GEO policy, with a test for every route family rather than adding pages.
- Keep the public discovery policy explicit: Consumer/answer surfaces may be
  indexable; Reference surfaces are noindex/follow; only admitted active live
  Experiences enter `dynamic.xml`; paid-only and private Experiences do not.
- Add an end-to-end funnel assertion covering Detector → Advisor → Try-On →
  Compare with preserved state and measured continuation events.

### Evidence

Minimum observable funnel at this baseline:

| Stage | Current source | Status / gap |
| --- | --- | --- |
| Discovery | Core sitemap, canonical/structured metadata, Search Console / GA page views | Technical surface proven; no current agent/referral outcome data. |
| Visit | GA automatic `page_view`; Store `MerchantSession` created by `/api/store/sessions`; new anonymous Consumer funnel ID | Durable Consumer first-party event stream is implemented but not deployed/queried for this observation window. |
| Useful Decision Interaction | Detector upload/complete/fail; Advisor analysis events; Store `merchant_page_viewed` and recommendation events; new allowlisted Consumer route | Implemented; cross-system join and current production counts are not proven. |
| Recommendation / Try-On / Compare | Consumer `recommendation_*`, `tryon_*`, `comparison_*`; Store MerchantEvents and usage records; new first-party action events | Implemented in separate schemas; no unsupported GA4 join is claimed and full current production continuation is not proven. |
| Intent | Consumer `purchase_intent_clicked` where applicable; Store `MerchantIntent`, product click/favorite/inquiry events | Store intent is durable; no unified Consumer-to-merchant intent proof. |

Gate A result split: **technical readiness PARTIAL** (attribution parsing,
persistence, canonical/structured metadata, sitemap admission, the durable
Store/Campaign source-action report, and the new privacy-safe Consumer event
contract are covered; deployment and production observation remain);
**reporting readiness PARTIAL** (the Store/Campaign report is operational and
the Consumer event stream is ready for querying, but a rolling source →
Consumer-action report is not yet proven); **real distribution evidence
PARTIAL** (no genuine production AI/agent referral with a meaningful decision
action is available). Synthetic source-class tests are not counted as
production proof.

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
- **Implemented and objectively proven — populated merchant-readable analytics:**
  `src/modules/store/application/get-merchant-insights.ts`, Admin Experience
  surfaces, `get_experience_funnel`, `get_top_frames`, and
  `get_intent_summary` provide measurable recommendation, try-on, compare,
  product-click, and intent-oriented signals. This pass adds a direct-Neon
  aggregate contract and merchant-readable `Commerce Intelligence` section to
  `src/components/merchant/MerchantControlCenter.tsx`, with explicit
  Reference/Simulation provenance and an empty state. The authenticated
  production browser proof against the controlled `VisuTry Demo` fixture shows
  Visitors, Engaged Shoppers, Recommendation, Try-On, Compare, Product Click,
  High-Intent Shoppers, acquisition source, and Store/Campaign context on the
  real `/en/merchant` route at desktop and mobile widths. The empty state is
  deterministically component-tested through the same production component and
  data contract; a second authenticated empty workspace is not required for
  the pre-outreach PASS rule.

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

- No remaining pre-outreach Gate B P0 is missing. A second authenticated empty
  workspace browser capture remains useful P1 evidence, but is intentionally
  not manufactured: the available account only contains the populated
  `VisuTry Demo` workspace, and the supported workspace-provisioning route does
  not create an additional empty tenant in this environment.
- A safe isolated provider-backed Store shopper run covering recommendation,
  try-on, compare, and measurable product/inquiry intent end to end. Current
  controlled Playwright coverage proves the shell and compare policy, not
  provider output; this remains P1 because no P0 shopper or merchant trust
  blocker was found in the current Reference/simulation evidence.

### P0

- **No remaining Gate B P0.** The authenticated populated state is proven at
  `/en/merchant#insights` using the clearly marked internal-validation
  `VisuTry Demo` fixture; the deterministic empty component state is covered by
  `tests/unit/components/merchant/MerchantControlCenter.test.tsx` using the
  same `MerchantCommerceIntelligence` contract. Do not use `/admin/store` as a
  substitute when normal merchant users are forbidden there, and do not invent
  Inquiry/Lead, revenue, orders, or ROAS metrics that the current contract does
  not measure.
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
- Capture the authenticated empty state in a supported controlled fixture if
  one becomes available; this is P1 evidence hardening, not a Gate B blocker.
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
- Authenticated production `/en/merchant` populated proof used the controlled
  `VisuTry Demo` workspace (`visutry-demo`) with six internal-validation
  catalog frames, active `VisuTry Demo Store`, and active `Everyday Fit`
  Campaign. Desktop showed Visitors 14, Engaged Shoppers 10, Recommendation
  10, Try-On 4, Compare 0, Product Click 0, High-Intent Shoppers 0, source
  `visutry` 14, and both Store/Campaign context cards. Mobile at 390×844
  preserved the same Commerce Intelligence section, stacked cards, context,
  and acquisition source without horizontal overflow. The empty-state browser
  capture remains unavailable for the exact fixture reason above.
- `tests/unit/components/merchant/MerchantControlCenter.test.tsx` now covers
  both populated and empty merchant-readable states. The existing Store /
  Campaign Playwright suite remained green in the prior controlled run; the
  current production browser proof is the authenticated evidence for the
  populated state.

Gate B result: **PASS**. The authenticated populated state, deterministic empty
state contract, canonical shopper paths, and visual/browser evidence meet the
pre-outreach rule; the empty-fixture browser capture and provider-backed shopper
run remain P1.

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
  `src/modules/merchant/mcp/server-cloudflare.ts` registers catalog
  inspection/intake, validation, Store/Campaign creation/configuration/preview,
  explicit-approval Store publish, and aggregate analytics tools. The Cloudflare
  route now handles both Agent Key and OAuth actors. `publish_store` requires
  `approved: true`; Campaign publish remains intentionally out of scope in this
  adapter. Tool annotations and actor checks expose read-only, idempotent,
  tenant, scope, and approval boundaries.
- **Implemented and objectively proven — catalog safety contract:** the
  regular server has bounded `inspect_catalog_source` source inspection, while
  the active Cloudflare surface exposes tenant-scoped `list_frames`,
  `import_frames`, and `validate_catalog`; `import_frames` is a separate write
  after approval. Source intake limits public HTTP/HTTPS scope, redirects, size,
  timeout, and candidate count. Tenant checks flow through the merchant actor
  and repository boundaries. The source-inspection capability mismatch remains
  explicit rather than being hidden in the Golden Path claim.
- **Implemented and objectively proven — credential primitives:** Agent Key
  create/rotate/revoke APIs and Merchant Workspace controls exist. OAuth
  authorization, token, revoke, and authorization-list APIs exist in
  `src/app/api/merchant/[merchantId]/oauth-authorizations`.
- **Implemented and objectively proven — current-SHA Codex client path:** a
  clean `codex mcp logout visutry` followed by fresh OAuth authorization to
  `VisuTry Demo (visutry-demo · OWNER)` completed against production, then the
  current Codex client reached MCP initialization, `tools/list`, tenant-scoped
  catalog inspection/validation, Store configuration, preview, explicit
  approval publish, and Commerce Intelligence reads without DB/API shortcuts.

Agent-Native Core result: **PASS**. Codex current-SHA execution, OAuth/MCP
resource and scope validation, tenant isolation, explicit approval, and
merchant-readable analytics all pass.

### Cross-Client Interoperability

### Current-SHA OAuth investigation

- **First root cause, fixed in `d809564`:** the production `/api/mcp` route
  used the Cloudflare adapter
  `src/modules/merchant/application/merchant-mcp-cloudflare.ts`. OAuth issued
  DB-backed opaque `mcp_at_*` access tokens, but the adapter sent non-Agent-Key
  tokens to the Agent Key validator. The bearer was rejected before Streamable
  HTTP initialization and `tools/list`, producing `invalid_token`.
- **Separate stale-credential issue:** the earlier `invalid_grant` occurred at
  refresh-token exchange and is a stale/revoked Codex refresh artifact. It is not
  the same failure as the post-reauthorization `invalid_token` bearer mismatch.
- **Second root cause, fixed in `84ed761`:** after OAuth bearer validation was
  repaired, direct Neon returned PostgreSQL `text[]` scopes as a string such as
  `{"merchant:read,catalog:read,experience:write,analytics:read"}`. The
  Cloudflare adapter treated that value as an empty array, so reads worked but
  write tools returned `AGENT_SCOPE_REQUIRED`. `parseScopeValues()` now handles
  PostgreSQL arrays, JSON arrays, JavaScript arrays, and whitespace-delimited
  scope strings before normalization. The regression test covers the
  PostgreSQL text-array shape.
- **Current proof:** the adapter hashes and tenant-joins OAuth access tokens,
  validates expiry/revocation/status/resource, normalizes scopes, updates
  last-use timestamps transactionally, and returns the same merchant actor
  contract as Agent Keys. Production was redeployed at `84ed761`; stale Codex
  state was logged out and not reused; fresh OAuth, MCP initialization,
  `tools/list`, and the complete current-SHA Golden Path all passed. No token or
  credential is logged or recorded.

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

### Remaining / External

- Cursor real-client execution remains open as a P1 interoperability item. The
  real Cursor desktop client loaded `https://www.visutry.com/api/mcp`. Its
  dynamic registration request used an unsupported redirect URI and was
  rejected by VisuTry's standards-compliant validator; that is not a server
  defect to fix by widening redirect validation. With a temporary public OAuth
  client registered to Cursor's documented callbacks
  (`https://www.cursor.com/agents/mcp/oauth/callback` and
  `http://localhost:8787/callback`), VisuTry consent and approval succeeded and
  returned a code for `VisuTry Demo`. Cursor's local `localhost:8787` listener
  then returned `404 Not found` and remained at `Waiting for callback…` before
  MCP authentication. This boundary is caused by Cursor's local callback
  listener/client environment, not VisuTry-generated redirect behavior. No
  Cursor `tools/list` or merchant operation is claimed.

### P0

- **C-P0-1 — Current Codex proof: CLOSED in this pass.** Production deployment
  at the current SHA and clean OAuth state now satisfy fresh authorization,
  MCP handshake, `tools/list`, tenant-scoped operations, preview, explicit
  approval, publish, and analytics acceptance.
- **No remaining VisuTry Gate C P0.** Cursor real-client execution is retained
  as P1 interoperability validation because the observed failure occurs in the
  external localhost callback listener after VisuTry consent, before MCP
  authentication. The server must remain standards-compliant and must not
  accept arbitrary custom redirect schemes.

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
- Complete Cursor real-client callback consumption and rerun the isolated
  read-only and write Golden Path when a supported Cursor client environment is
  available; do not widen the VisuTry redirect-URI validator.

### Evidence

- The prior baseline targeted MCP/OAuth validation passed: 8 suites, 37 tests,
  including MCP route, OAuth HTTP contract, catalog intake, Store
  attribution/SEO, and Merchant Workspace tests. The current focused
  presentation/attribution/insight re-run passed 8 suites, 40 tests.
- Live MCP/OAuth discovery passed with HTTP 200 metadata. After
  `codex mcp logout visutry` and fresh authorization, the current production
  Codex client reached `tools/list` and ran the full Golden Path. The final run
  stayed within `VisuTry Demo`, used six existing internal-validation frames
  without changing selection, returned a zero-blocker preview, published only
  with `approved: true`, and read Commerce Intelligence. Codex verdict:
  **PASS**.
- `npx jest --runInBand
  tests/unit/modules/merchant/merchant-mcp-cloudflare.test.ts` passed 8 tests,
  including the PostgreSQL text-array scope regression. `npm run typecheck`
  and `npm run build:ci` passed after the fix. The Store/Campaign Playwright
  suite passed 12/12 with an explicitly started local test server. Cursor's
  real OAuth consent boundary was reached, but its localhost callback listener
  returned 404 before MCP authentication and remains the exact external/client
  P1 blocker; no VisuTry OAuth/MCP defect was found at that boundary.

Gate C result: **PASS for Agent-Native Core and standards-based MCP/OAuth**.
Cursor real-client compatibility remains **PARTIAL / P1 external validation**
and does not block the core Gate C verdict.

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
- `src/modules/store/domain/merchant-distribution-report.ts` is the strongest
  supported first-party source/action report. Core Consumer GA4/dataLayer events
  do not carry a durable MerchantSession key, so Detector and Advisor counts
  are explicitly unavailable in that report rather than inferred.

## Outreach Policy Decision

The selected policy is a **HARD DISTRIBUTION GATE**: Outreach is `GATED` until
Gate A L3 real distribution evidence, Gate B, and Gate C pass. The tradeoff is
waiting for a channel that may grow slowly; the rolling 14-day threshold,
weekly growth loop, and explicit evidence log bound that risk operationally.
Technical readiness and synthetic traffic do not unlock outreach. A future
Soft Distribution Gate would require an explicit Product source-of-truth
change.

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

Repository-side MCP compatibility is already in place. Cursor's documented
desktop callback is `http://localhost:8787/callback`; its Web/Agents callback is
`https://www.cursor.com/agents/mcp/oauth/callback`. The remaining external/client
validation action is exactly:

1. In Cursor, open Settings → Tools & Integrations → add a custom remote MCP
  server named `visutry` (or use the prepared `~/.cursor/mcp.json` entry).
2. Set the Streamable HTTP URL to
  `https://www.visutry.com/api/mcp`; do not paste a static Authorization
  header. Allow Cursor to use the advertised OAuth/PKCE discovery.
3. If Cursor's dynamic registration sends an unsupported redirect URI, use a
  fixed public OAuth client whose registered redirect URIs are exactly the two
  official Cursor callbacks above; do not widen the server to arbitrary custom
  schemes. Authenticate and select only the dedicated isolated test
  Merchant/workspace;
   do not use a real customer merchant.
4. Run `tools/list`, then the same sequence:
   `get_merchant` → `get_onboarding_status` → `list_frames` →
   `validate_catalog` → `import_frames` (only after explicit catalog approval)
   → `create_store` or `create_campaign` → frame selection/configuration →
   `preview_*` → merchant-readable summary → `publish_store` with
   `approved: true` when the Store is ready → `get_experience_summary`,
   `get_experience_funnel`, and `get_intent_summary`. Campaign publish is not
   available in the current Cloudflare adapter and must not be implied.
5. Capture the Cursor tool transcript, workspace ID, catalog validation result,
   Experience ID/URL, preview result, approval boundary, publish result, and
   analytics result. Revoke the test authorization and archive the test
   Experience after evidence capture if the isolated workspace policy requires
   cleanup.

The single remaining external action is fixing or upgrading the Cursor desktop
localhost callback listener so the returned code is consumed (the observed
listener returned HTTP 404), then completing that authenticated Cursor session
against the isolated workspace. Until then Cursor interoperability is `PARTIAL`
and `P1`; Agent-Native Core / Gate C remains `PASS`.

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
3. Keep the Gate B empty-fixture browser capture as P1 evidence hardening; do
   not manufacture it with DB/auth shortcuts.
4. Complete the durable core Consumer attribution join only if a safe supported
   first-party identifier becomes available; otherwise retain the explicit
   GA4/dataLayer boundary and do not fabricate counts.
5. Complete the explicitly recorded Cursor validation when its external client
   callback works; keep it P1 while Agent-Native Core remains proven.
6. Operate the active Hard Distribution Gate: observe the rolling 14-day L3
   threshold through the durable report and growth-loop evidence log before
   authorizing any outreach; then keep First Real Merchant validation separate.

## Definition of Done Remaining

- Gate A has a browser-proven Detector → Advisor → Try-On → Compare continuation,
  current-source funnel events, reconciled SEO/GEO indexability, and a
  reproducible source-class evidence report.
- Gate B has a current available branded Store, a distinct Campaign path, green
  desktop/mobile loading/error/empty checks, a controlled provider-backed
  shopper run, and authenticated merchant-readable metrics from a Reference,
  simulation, or controlled fixture. Real-merchant acceptance is not a Gate B
  requirement.
- Gate C Agent-Native Core has current-SHA Codex evidence, DB-backed protocol
  coverage, visible OAuth lifecycle controls or a documented safe equivalent,
  and no manual intervention in the Golden Path. Cursor compatibility is a
  separate P1 transcript.
- Gate A technical/reporting readiness and the explicit hard-vs-soft outreach
  policy decision are resolved; genuine Agent traffic remains evidence, never
  synthetic proof. Under the current hard contract, Outreach remains `GATED`.
