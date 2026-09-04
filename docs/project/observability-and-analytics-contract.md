# VisuTry Observability & Analytics Contract

**Status:** Active source of truth  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-09-04  
**Last reviewed:** 2026-09-04  
**Review cadence:** Monthly, after a material telemetry/data-plane change, or after an observation gate closes.  
**Scope:** Production operational telemetry, product/acquisition analytics, merchant-commerce behavioral truth, attribution, test/reference exclusion, dataset/schema governance, and reporting ownership across Consumer and Merchant surfaces.

## 1. Purpose

This document defines **where VisuTry records operational telemetry, product analytics, and business facts, which system is authoritative for each class of question, and how Consumer / Merchant Shopper / Merchant Operator traffic is separated without losing cross-product observability**.

It supersedes the older assumption that one GA4-oriented Campaign Intelligence taxonomy is the product-wide analytics model.

Current evidence baselines remain point-in-time records rather than authorities:

- `docs/ops/traffic-ready-t0-2026-09-03.md`
- `docs/ops/discovery-canary-2026-09-03.md`

Current runtime contracts remain authoritative for exact implemented fields/events:

- `src/lib/logger.ts`
- `src/lib/analytics-events.ts`
- `src/app/api/analytics/consumer-funnel/route.ts`
- Store/Campaign `MerchantSession`, `MerchantEvent`, and `MerchantIntent` contracts
- `src/modules/store/domain/merchant-distribution-report.ts`
- `scripts/agent-distribution-report.ts`

## 2. Three data planes

VisuTry intentionally uses three different data planes. Do not make one system impersonate another.

| Plane | Current system | Primary purpose | Authoritative for | Not authoritative for |
| --- | --- | --- | --- | --- |
| Operational telemetry | Axiom + Vercel runtime logs | Errors, provider/runtime behavior, performance, correlation, production diagnosis, bounded Consumer funnel evidence | What happened operationally in production and how a request/runtime path behaved | Merchant revenue, durable intent, credits/payment truth, customer-facing business totals |
| Product / acquisition analytics | GA4 / GTM where configured | Acquisition, page/funnel behavior, aggregate UX analysis, SEO/GEO channel analysis | Aggregate traffic/funnel analysis and acquisition exploration | Merchant entitlement, durable Store/Campaign intent, payment/credit truth, operational incident truth |
| Business truth | PostgreSQL | Durable product/business state | `MerchantSession`, `MerchantEvent`, `MerchantIntent`, payments, credits, entitlements, tasks and other persisted product facts | Runtime log completeness or GA4 reporting availability |

### Governing rule

- **Axiom is not the business warehouse.**
- **GA4 is not the VisuTry product database.**
- **PostgreSQL is not a replacement for runtime observability.**

When systems disagree, answer the question from the plane that owns that fact.

## 3. Product/actor boundaries

Do not reduce the system to a single `is_b2b` flag. VisuTry has three materially different human journeys plus agent/internal traffic.

### 3.1 Business line

Canonical logical values for new cross-cutting telemetry design:

```text
business_line = consumer | commerce | shared
```

- `consumer` — standalone VisuTry consumer acquisition/decision/paid flows.
- `commerce` — Merchant Store/Campaign shopper and merchant-operation flows.
- `shared` — provider/runtime infrastructure used by both, such as generation, payment infrastructure, database/runtime health, and shared edge/platform telemetry.

This is a **governance vocabulary**. Existing events are not required to be backfilled merely to satisfy the document.

### 3.2 Actor type

Canonical logical roles:

```text
actor_type = consumer | shopper | merchant_operator | merchant_prospect | agent | internal
```

- `consumer` — user of standalone Consumer tools.
- `shopper` — guest or identified shopper inside a Merchant Store/Campaign experience.
- `merchant_operator` — merchant/admin user operating catalog, Store, Campaign, billing, or analytics.
- `merchant_prospect` — business visitor evaluating VisuTry itself.
- `agent` — AI/software agent when materially distinct from a referred human shopper.
- `internal` — VisuTry operator, QA, automation, or internal verification.

Existing code may expose a smaller enum on a bounded surface. Expand only when a real reporting/operational need requires it; do not mass-edit production events for vocabulary symmetry.

### 3.3 Surface

Use stable, bounded surface values. Prefer existing runtime names and map them into reporting groups rather than inventing one field per page.

Current logical groups include:

```text
consumer:
  face_shape
  face_analysis
  advisor
  tryon
  compare
  style
  pricing_checkout

commerce shopper:
  store
  campaign
  merchant_tryon
  merchant_compare
  merchant_recommendation

merchant operator / acquisition:
  merchant_workspace
  merchant_admin
  business_site

shared:
  generation
  payment
  auth
  database
  edge_runtime
```

## 4. Traffic and provenance boundary

Traffic provenance must remain independently observable from product surface.

Canonical logical scope:

```text
traffic_scope = real | reference | test | internal | suspicious
```

The current Store/Campaign distribution report must continue to exclude Reference/Internal/TEST/AUTOMATION/SUSPICIOUS evidence from genuine distribution proof according to the implemented contract.

### Reference traffic

Reference Store/Campaign activity can be useful UX evidence, but it is not genuine merchant distribution proof and must not silently become Gate A evidence.

### Test traffic

Synthetic/controlled validation proves the technical contract only. A client must not be able to self-label arbitrary production traffic in a way that corrupts evidence boundaries. Current Consumer funnel classification is server-derived.

## 5. Attribution contract

Where technically supported, preserve enough context to reconstruct:

```text
Source
→ Session
→ Surface / Experience
→ Decision Action
→ Intent
```

Core attribution concepts include:

- acquisition source / medium
- referrer
- source class
- known AI/agent source
- campaign name / explicit campaign context
- merchant identity for commerce
- Experience identity for Store/Campaign
- durable merchant session identity for commerce events/intents

Current supported source classes include known AI sources plus organic search, generic referral, paid, direct, social, Reddit, YouTube, and other. Exact implemented classification remains code-authoritative.

Do not manufacture `campaign_id` from `utm_campaign`. Human/marketing labels and stable internal identifiers remain separate concepts.

## 6. Consumer analytics contract

Standalone Consumer behavior is primarily used for acquisition, product-funnel, paid conversion, and reusable decision-capability analysis.

Current relevant systems:

- GA4/dataLayer product analytics using the canonical event registry in `src/lib/analytics-events.ts`.
- First-party `consumer_funnel_event` production evidence emitted through the server endpoint for bounded Traffic Ready / Agent-distribution observation.
- PostgreSQL for paid/product truth such as payments, credits, Try-On/Face Analysis task state and entitlements.

### Consumer business questions

| Question | Primary source |
| --- | --- |
| Search/AI/social acquisition mix | GA4, with first-party observation used where the T0 report explicitly supports it |
| Detector / Analysis / Try-On / Compare funnel | GA4/product analytics; durable task tables for completed product facts where applicable |
| Payment / credits / entitlement | PostgreSQL + Stripe reconciliation, never GA4 alone |
| Runtime/provider failure | Axiom/Vercel + generation telemetry |
| Genuine Agent distribution gate | Canonical `report:agent-distribution` evidence contract, not raw GA4 pageviews |

## 7. Merchant commerce contract

Store/Campaign shopper behavior has a durable first-party data model and must not be reduced to GA4-only reporting.

Authoritative commerce path:

```text
MerchantSession
→ MerchantEvent
→ MerchantIntent
```

with Merchant / Experience context and source attribution where captured.

Current distribution reporting derives source/Experience metrics from this durable path, including Recommendation, Try-On, Compare, Product Click, Inquiry and high-intent signals supported by the implementation.

### Merchant business questions

| Question | Primary source |
| --- | --- |
| Which Store/Campaign received a shopper session? | PostgreSQL `MerchantSession` / Experience context |
| What meaningful Store/Campaign actions occurred? | PostgreSQL `MerchantEvent` |
| Product click / favorite / inquiry intent | PostgreSQL `MerchantIntent` |
| Genuine commerce distribution by source | `report:agent-distribution` / durable merchant report |
| Store/Campaign runtime failure/performance | Axiom/Vercel operational telemetry |
| Aggregate acquisition exploration | GA4 may support it, but does not replace merchant business truth |

Consumer anonymous funnel telemetry and MerchantSession identifiers are currently separate evidence planes. **Do not claim a cross-system per-user join that does not exist.**

## 8. Merchant operator analytics

Merchant operator activity (onboarding, catalog, publishing, billing, workspace) is neither Consumer behavior nor Store/Campaign shopper behavior.

Use the existing `merchant_*` product analytics events for funnel/UX analysis where useful. Durable merchant/account/catalog/billing state remains in PostgreSQL.

Do not mix merchant-operator events into shopper conversion or merchant Store/Campaign traffic totals.

## 9. GA4 policy

### Current topology

Keep **one GA4 property** unless a future privacy, ownership, retention, scale, or client-isolation requirement justifies physical separation.

Use logical segmentation instead of separate properties for Consumer vs Commerce.

Recommended reporting views:

1. **Consumer Growth** — acquisition → Consumer decision flow → paid conversion.
2. **Commerce Distribution** — acquisition → Store/Campaign arrival → shopper decision behavior; business totals remain backed by PostgreSQL.
3. **Cross-product Discovery** — Search / AI / referral paths across indexable VisuTry surfaces and PUBLIC_INDEX commerce surfaces.
4. **Merchant Activation** — merchant prospect/onboarding/workspace funnel.

### GA4 dimension discipline

GA4 custom dimensions must be bounded and decision-useful. Avoid registering high-cardinality identifiers merely because they are present in events.

Good candidates are bounded dimensions such as:

- logical product area / journey
- surface
- entry point
- source class
- normalized intent/destination
- normalized failure reason where useful

Treat raw merchant/session/event IDs, unrestricted URLs, arrays, inference payloads, raw errors, and arbitrary free text as poor GA4 custom-dimension candidates.

### Key event discipline

Only mark real outcomes as GA4 key events. Never promote `*_started`, `*_failed`, internal/debug events, or continuation-only events simply to make funnels look complete.

GA4 console configuration is operational state, not an application contract. See `docs/product/campaign-intelligence/ga4-console-checklist.md` for the bounded operator checklist.

## 10. Axiom policy

### 10.1 Current production dataset

The current authoritative production dataset is:

```text
visutry-pro
```

Historical/default references to `visutry-logs` are not the current production dataset authority.

Axiom receives the generic production logger envelope and currently flattens nested `data.<field>` payloads into dataset fields. The Traffic Ready report had to query those flattened fields explicitly.

### 10.2 Current schema-capacity incident

As observed on 2026-09-04, `visutry-pro` has reached its current field capacity (`257 fields used / 0 remaining` in the Axiom dataset UI).

P0 schema containment was implemented on 2026-09-04 in `src/lib/logger.ts` and verified in `docs/ops/axiom-schema-p0-containment-2026-09-04.md`:

- **Arbitrary production Axiom payload expansion is prohibited.**
- Production logger payloads are bounded by an explicit canonical field/nested-key allowlist before transport.
- Legacy flattened `data.<field>` reads remain supported temporarily so existing reports can read historical and bounded rows during the observation window.
- Do not treat Axiom as a schemaless dumping ground.
- Do not perform destructive trim/delete operations merely to create headroom.
- Do not change the active T0 / Discovery Canary measurement contract without preserving comparable evidence.

This condition is an observability governance issue, not a reason to alter product behavior.

### 10.3 Dedicated Consumer traffic evidence plane

P0.2 adds a responsibility-based traffic evidence plane without performing the deferred Commerce split:

```text
visutry-pro
  bounded operational/runtime telemetry only

visutry-traffic-pro
  bounded Consumer attribution, acquisition, Agent referral and funnel events

PostgreSQL
  MerchantSession → MerchantEvent → MerchantIntent commerce truth

GA4
  product and acquisition analytics
```

`visutry-traffic-pro` uses a strict flat record with an explicit 21-field business schema. It receives no raw `data`, nested objects, arbitrary arrays, provider payloads, PII, image data, secrets, or free-form request body. Production Consumer funnel events route there with a dedicated ingest credential; Preview uses the existing `visutry-ppe` destination with the same record contract; development does not ingest traffic telemetry.

`report:agent-distribution` reads the legacy `data.<field>` Consumer rows from `visutry-pro` and top-level records from `visutry-traffic-pro`. It deduplicates by `event_id`, gives TEST precedence for duplicate IDs, and retains the existing Consumer/Merchant evidence-plane boundary. The legacy read fallback remains temporary for the active observation window.

This is not the deferred `visutry-commerce-pro` split. No Commerce dataset is created by this contract.

### 10.4 Dataset separation decision

Do **not** split datasets merely because the product is described as 2B/2C.

The preferred physical boundary, if the field audit proves a split is necessary, is responsibility-based:

```text
visutry-pro
  Consumer + shared operational/runtime telemetry

visutry-commerce-pro   (candidate; not yet authorized/current)
  Store / Campaign / merchant-shopper / merchant-operator telemetry
```

The second dataset is a **candidate P1 target**, not current production truth. The Commerce dataset split remains deferred. Creating it requires an explicit audit showing the field ownership, ingestion routing, report impact, permissions, retention, migration/dual-write strategy and rollback path.

Shared provider/runtime errors must remain diagnosable across business lines; physical separation must not destroy incident correlation.

### 10.5 Field governance

Before a new production log field is introduced, classify it:

1. owner: Consumer / Commerce / Shared;
2. purpose: incident/debug / performance / attribution / product evidence;
3. bounded or dynamic;
4. expected cardinality;
5. retention need;
6. whether an existing canonical field already represents the same fact.

Prefer stable top-level/log-envelope fields plus bounded canonical payloads. Avoid arbitrary nested maps whose keys become columns.

### 10.6 Vacuum / schema lock / destructive operations

Axiom schema cleanup must follow an evidence-first sequence:

```text
field inventory
→ active/stale/dynamic classification
→ ingestion owner mapping
→ report/query dependency check
→ safe cleanup plan
→ production verification
```

Vacuum/schema-lock mechanisms remain deferred after P0 containment and may be considered only after a separate audit confirms their exact effect and report compatibility. Destructive data trimming/deletion requires separate explicit approval, especially during an active observation window.

## 11. Logging rules

Operational logs should answer a bounded operational question. They should not serialize arbitrary request/application objects by default.

### Required principles

- stable `category`, `message`, `level`, timestamp and correlation identifiers where useful;
- bounded payload schemas for high-volume log messages;
- no raw photos or biometric geometry;
- no secrets/tokens;
- no payment secrets;
- minimize PII; do not log email/full user profile unless a documented operational requirement and privacy review justify it;
- normalized error/failure classes preferred over arbitrary raw error fields as analytical dimensions;
- shared generation telemetry should retain request/attempt/provider correlation needed for reliability analysis.

## 12. Source-of-truth matrix

| Domain | Authority |
| --- | --- |
| Consumer/product event names implemented in web analytics | `src/lib/analytics-events.ts` |
| Consumer Traffic Ready server evidence | `src/app/api/analytics/consumer-funnel/route.ts` + Axiom query/report contract |
| Merchant Store/Campaign source/action/intent truth | PostgreSQL MerchantSession / MerchantEvent / MerchantIntent |
| Merchant distribution source classification/report derivation | `src/modules/store/domain/merchant-distribution-report.ts` + `scripts/agent-distribution-report.ts` |
| Runtime logging envelope / Axiom ingestion | `src/lib/logger.ts` |
| Payment/credit truth | PostgreSQL + Stripe verification paths |
| T0 readiness evidence | `docs/ops/traffic-ready-t0-2026-09-03.md` |
| Discovery Canary evidence | `docs/ops/discovery-canary-2026-09-03.md` |
| Cross-cutting observability/analytics policy | **this document** |

## 13. Current observation clocks

These clocks are intentionally distinct:

- **Traffic Ready T0:** `2026-09-03T13:26:22.008Z`
- **Discovery Canary T0:** `2026-09-03T16:33:14.812Z`

Traffic Ready T0 proves that incoming traffic can be measured/reconstructed under the defined contract. Discovery Canary T0 marks when the first-party `VisuTry Demo` PUBLIC_INDEX surface became ready for direct Search/GEO/Agent discovery observation.

Do not reset either clock for documentation/schema governance work unless the measurement contract is materially broken.

## 14. Change governance

Any change that adds or materially changes analytics/logging fields must answer:

- Which data plane owns this fact?
- Which business line / actor / surface owns it?
- Is it operational telemetry, product analytics, or durable business truth?
- Does it increase Axiom schema width?
- Does it increase GA4 cardinality?
- Does it affect Reference/Test/Internal exclusion?
- Does it break a T0/Discovery Canary comparison?
- Does a current report/test depend on the old field?

Prefer additive, bounded changes. Do not build a second analytics architecture because a dashboard is inconvenient.

## 15. Immediate governance backlog

### P0 — Axiom field/schema audit — COMPLETE: containment implemented

The read-only inventory identified the 257-field capacity condition and the 243-field `data.*` expansion pattern. The immediate P0 remedy is complete: new production logger payloads are bounded by `AXIOM_SERIALIZED_KEY_ALLOWLIST`; arbitrary object expansion is prohibited; historical fields remain untouched.

The longer-term inventory classification and physical dataset decision remain governed follow-up work:

```text
consumer | commerce | shared
active | stale | accidental/dynamic
keep | map/normalize | candidate-remove
```

Then decide whether the correct remedy is:

- one governed dataset with cleanup/schema discipline; or
- a responsibility-based Commerce dataset split.

No dataset split is approved by this document alone; the Commerce dataset split remains P1/deferred.

### P1 — GA4 console reconciliation

Reconcile current GA4 custom dimensions/key events against the current event registry and this contract. Remove obsolete planned dimensions from the runbook; do not change application code simply to populate a dashboard dimension.

### P1 — Documentation/code alignment

When product analytics enums or merchant distribution semantics change, update this contract and the bounded Campaign Intelligence taxonomy/runbook in the same change or explicitly record why no documentation change is needed.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-04 | Established the cross-cutting three-plane contract; separated Consumer, Commerce shopper and Merchant operator semantics; recorded `visutry-pro` schema-capacity condition; made dataset split an audit-gated decision; preserved T0 and Discovery Canary evidence boundaries. |
| 2026-09-04 | Implemented P0 Axiom schema containment with an explicit bounded transport allowlist; prohibited arbitrary production payload expansion; retained temporary legacy `data.*` read compatibility; deferred Commerce dataset split and vacuum/schema-lock. |
| 2026-09-04 | Added the P0.2 dedicated `visutry-traffic-pro` Consumer evidence plane with a strict flat schema, dual-dataset report read, event-ID deduplication, and unchanged T0 clocks; deferred `visutry-commerce-pro`. |
