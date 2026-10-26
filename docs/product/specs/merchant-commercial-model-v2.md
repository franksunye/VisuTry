# Merchant Commercial Model v2 — Cost-Safe Dual Meter & Merchant First Value

**Status:** M0 ENGINEERING CONTRACT / PROPOSED. **Not published, not activated, no changes to live contract.**
**Lead authorization:** 2026-10-26, [Issue #452](https://github.com/franksunye/VisuTry/issues/452).
**Base audit:** main commit 8665b8354560caa17f6338939e7a867ec5bfb2b7.
**Owner:** Product/Lead decides commercial terms; Engineering implements and validates against exact SHA.

## 1. Why this is required

Current successful Store AI generations are counted as RENDER_SUCCESS in merchantUsageLedger and one attributed AI Commerce Session is recorded as AI_COMMERCE_SESSION. These are different things. One shopper/session may consume multiple image renders. The recurring Launch/Growth/Scale canonical plans have standardTryOnGenerations=null and the capability resolver returns Infinity for normal recurring Store render limits; session quotas alone do not bound provider spending.

Merchant production Try-On-per-AI-Commerce-Session distribution is **UNKNOWN**. It is prohibited to infer Merchant usage from Consumer $2.99 credit redemption or from demo fixtures. The pricing spreadsheet can stress-test assumptions but cannot claim realized cost, gross margin or product/market fit.

This contract extends, and does not silently override:
- docs/commercial-entitlements-v1.md;
- docs/strategy/merchant-pricing-packaging-unit-economics.md (Founding Pilot v8 commercial promise);
- docs/product/specs/merchant-experience-entitlement-sponsored-usage.md;
- docs/project/observability-and-analytics-contract.md;
- existing Merchant Pilot, Billing and provider release gates (#356, #414, #430, #440, #443).

## 2. Product entitlements / merchant-facing meaning

| Meter | Definition | Included in Merchant subscription? | When it changes |
| --- | --- | --- | --- |
| Ordinary Store/Campaign browsing | Non-generation page views, product discovery and navigation | Remains live; no AI quota consumption | Never from Merchant AI cap |
| AI Commerce Sessions | Distinct eligible MerchantSession that actually enters AI-assisted decision journey | Finite by plan when configured | Exactly once per eligible attributed MerchantSession/contract period |
| Standard AI Try-On Generations (successful) | Usable completed AI image output settled to Merchant allowance | Finite ONLY for opted-in v2 contractual allowance or existing finite Pilot | Exactly once after reliable usable completion and protected persistence |
| Reserved Standard AI Try-On | A paid generation slot held by an accepted or potentially accepted task | Counts against **available dispatch capacity**, not against successful usage in Plan & Usage | At atomic reservation; released on definitive unaccepted/terminal no-output; converted on once-only success |
| Recommendation / static Compare | Cost-free deterministic decision and reuse of already-settled results | Available under separate feature entitlement | Must not secretly dispatch AI or bypass cap |
| AI-generating Compare | Creates new provider image(s) | Counts each new requested output against same merchant render budget, regardless of UI surface | Reserved before provider dispatch, settled once on usable completion |

**Consumer boundary:** Merchant sponsorship belongs to Merchant and is never an automatic Consumer credit. When merchant-sponsored budget is exhausted, non-AI Store/Campaign remains available. Subsequent eligible generation may use existing Consumer entitlement only with correct authenticated/anonymous boundary and explicit continuation; no silent double charge or quota stacking.

**First value:** One sponsored render per distinct shopper/session is the *initial product hypothesis* for uncontracted new-customer experiments, not a universal plan restriction. Opted-in merchant policies may fund an additional 2–4 renders within the same overall hard merchant budget. A current signed Pilot with 3,500 or approved 5,000 generations must be allowed to use its contract; default first-value treatment cannot make contracted capacity unreachable.

**Merchant UI:** Show “AI-assisted shoppers (Sessions)”, “Completed Try-On images”, “In progress / reserved”, independent used/limit and warnings at 70%, 90%, 100%; plain-language soft notice and AI-only stop; never show blocked Store/Campaign or fake remaining credits. Without authenticated merchant owner role, no full usage/cost details on public pages. Public capability hint is server-authoritative, not a cached guess.

## 3. Canonical version and customer protection

Existing Merchant fields include planCode, commercialStage, pricingVersion, entitlementVersion, commerceSessionAllowance, standardRenderAllowance, entitlementEffectiveFrom, billingPeriodEnd and exception markers. These existing fields need a versioned **effective contract snapshot** without changing past periods. A new opt-in v2 offer must be explicitly approved and persisted with pricingVersion and entitlementVersion, effectiveFrom/period and customer cohort. Existing v1 recurring plans, Pilot (3,500 or explicitly granted 5,000), legacy-unmigrated, Enterprise, VisuTry Demo TEST and Consumer are left unchanged. Do not infer v2 from planCode or from a missing field. Do not silently reduce published/contracted quotas or adjust Stripe Price IDs.

Release switch: OFF (old behavior) → SHADOW (collect/validate decisions, no blocking) → ENFORCE only for Lead-approved new merchant cohort with explicit opted-in contract. SHADOW must not consume new quota or cause provider retries. Rollback to OFF must not lose historical settled/held reservations or uncharge a customer. Any schema change uses additive migrations and migration boundary tests.

## 4. Server authority / concurrency

A single server-side entitlement decision feeds Store, Campaign, public experience capability hints, Merchant Plan & Usage and admin APIs. It never trusts browser-supplied credits or merchantId. All commands verify merchant ownership and period status.

- Before any billable provider dispatch, atomically reserve one remaining generation slot for (merchant, fixed billing period, logical generation request). Capacity = contractual allowance - settled successful renders - all live unresolved reservations.
- One logical request can have multiple provider attempts, but it must not occupy multiple slots or dispatch two active image generations. Exactly-once per request/tenant key across page reloads, Store/Campaign paths, serverless instances and Grsai→Kie routing.
- Reservation operation must serialize competing requests for the final slot (database serializable transaction with retry and/or a locked merchant-period counter), not read-then-insert after dispatch. Two simultaneous final-slot submissions permit at most one new chargeable provider request.
- Definitive terminal unaccepted/error: release hold, no successful render charge. Accepted/in-flight/submit timeout/503 with ambiguous acceptance: keep hold, retry only status/poll/reconciliation for original task ID until a bounded correct recovery decision; never duplicate create.
- Once the result is usable and privately persisted, settle success exactly once by original logical task ID, cancel hold and write one RENDER_SUCCESS; duplicate callback/polls have zero additional quota effect.
- A terminal unusable output does not settle success; provider invoice may still be billed and is tracked as cost independently, with retention and support action.
- Period rollover applies contract pinned when request was reserved, not whichever contract is current at delayed settlement. Crash recovery and retries cannot release a genuinely active reservation based only on local wall-clock TTL.
- Rate limits (per-session/per-shopper/day/device/IP soft signals) and fraud controls supplement, never replace, merchant budget. Strict tenant isolation, no PII or raw image in telemetry. Pausing AI should not disable search, product browse, Recommendation (if non-generative), favorites, static comparison or handoff.

## 5. Data & observability truthfulness

Single authenticated Merchant measurement service derives from real merchantUsageLedger, MerchantSession, TryOnTask, GenerationRequest and GenerationAttempt; record real provider/model, routed/failover outcome, estimated price per request and invoiced cost if actually available. Dimensions: merchant ID, shopper session ID or HMAC (no raw PII), experience type Store/Campaign, quota source, entitlement/pricing version, period, logical request ID, attempt ID, provider, model, terminal and settlement stage. Axiom only receives bounded, sanitized fields.

Metrics:
- Real AI Commerce Sessions with 0, 1, 2, 3, 4, 5+ successful images; p50/p90/p95 and mean images per session; guest and authenticated breakdown where safely attributable.
- Attempted, accepted, completed usable, failed, pending, recovered, fallback, duplicate suppressions and paid-attempt cost; show sample size and elapsed period.
- Separately tagged PRODUCTION_REAL, TEST, DEMO, PREPARED_DEMO, MOCK and UNKNOWN; never mix evidence or inflate sample. At zero real Merchants state “No real Merchant sample yet”.
- Aggregate observability labels have bounded cardinality. Raw user identifiers, source photos and image results are prohibited in logs.

## 6. Engineering slices and required tests

M0 (this PR): contract and **side-effect-free** unit economics scenario calculator/tests. It is not used by runtime, Stripe, billing or live plan definitions.

M1a: additive reservation/claim architecture and migration contract; unit + real disposable Postgres concurrency. OFF by default.

M1b: canonical Store/Campaign provider-dispatch check, recovery, successful settlement and shadow-vs-enforce strategy. Fault injection for 429/503, acceptance unknown, same-request races and two providers; Consumer, Demo and legacy unchanged.

M2a: real read-only per-session distribution service, role/tenant gates, Axiom correlation, cost coverage. Data provenance verified.

M2b: Plan & Usage dual counters, first-value shopper UX and graceful budget exhaustion on desktop/mobile.

M3: contract-versioned proposed packaging, top-up price proposal, agency mechanics and market Pilot evidence; Lead approves public changes separately.

No external AI calls, Production writes/Stripe changes, merge or deployment without a later specific authorization.

## 7. Acceptance gates

1. Accepted current main SHA and build/CI, deterministically reproduced multi-instance same-final-slot race against disposable PostgreSQL, and request-ID-to-success ledger forensic trace.
2. All new opt-ins deterministic; every existing Merchant unchanged; no accidental Consumer credit double debit; no demo/prod telemetry contamination.
3. Browser public Store/Campaign first value, AI-only exhaustion and reset/retry at mobile and desktop; no blocked guest landing and no unattainable promised renders.
4. Finance worksheet under Kie-only worst-case, Grsai-only and blended failover with refunds, provider billable failures, payment/service fees and agency margins; invoices identified separately from assumptions.
5. Owner Lead reviews exact head with rollout/rollback evidence and explicitly approves any publish or production activation.

**References:** https://github.com/franksunye/VisuTry/issues/452
