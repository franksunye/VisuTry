# VisuTry Architecture Consolidation Plan — Pre-Pilot

**Status:** Active engineering execution plan  
**Owner:** Product / Engineering  
**Created:** 2026-08-06  
**Target duration:** 3–5 engineering days  
**Primary ADRs:**
- `docs/decisions/ADR-007-store-consumer-stability-boundary.md`
- `docs/decisions/ADR-008-commerce-domain-over-storefront.md`

**Related specs / plans:**
- `docs/product/specs/visutry-commerce-architecture.md`
- `docs/product/specs/visutry-store-engineering-foundation.md`
- `docs/product/plans/visutry-store-implementation-plan.md`
- `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Purpose

This document is the **single execution entry point for the current pre-Pilot architecture consolidation**.

It exists to prevent architectural drift between the accepted ADRs and day-to-day implementation work.

The goal is **not** to perform a broad rewrite. The goal is to make the current codebase safe and stable enough that Merchant Pilot work can continue without creating a second generation stack, coupling Consumer to Store, or locking Storefront concepts into the long-term Commerce domain.

The required end state is:

```text
Consumer / B2C
  = stable protected product surface

Commerce / Store
  = rapidly evolving merchant business layer

Shared Capability Core
  = neutral, backward-compatible technical capabilities
```

Execution principle:

> **Consolidate boundaries now. Do not redesign the whole system.**

---

## 2. Scope — Exactly Three Workstreams

Only the following three workstreams are in scope for this consolidation.

### Workstream A — Consumer / Store Boundary

Objective:

> Complete the ADR-007 boundary so Store changes cannot become Consumer failures.

Required outcomes:

1. Consumer code has **zero dependency on Store-specific modules**.
2. Store and Consumer keep separate:
   - identity/session policy;
   - usage/billing settlement;
   - asset/privacy policy;
   - background-job failure domains;
   - Store-specific reconciliation / leases / merchant logic.
3. Shared code contains only Store-neutral / Consumer-neutral technical capability.
4. Consumer protected workflow remains behaviorally unchanged.

Protected Consumer workflow:

```text
Face Shape Detector
  -> Glasses Advisor
  -> Virtual Try-On
  -> async poll / result delivery
  -> Consumer quota / credits settlement
  -> Frame Compare
```

### Workstream B — Commerce Domain Boundary

Objective:

> Stabilize the current durable Commerce contracts without prematurely migrating the whole Store module.

The following concepts must have clear ownership and stable identifiers/contracts:

- Merchant
- Merchant product / frame identity
- MerchantSession
- acquisition / source / campaign context
- Recommendation / Try-On / Compare journey references
- MerchantIntent
- merchant usage / commercial entitlement reference

For the current Pilot, the architecture stops at:

```text
Traffic
 -> Recommendation
 -> Try-On
 -> Compare
 -> Product Click / Favorite / Inquiry
 -> Measurable Intent
```

The following are **not required now**:

- first-class Conversion aggregate;
- order / checkout integration;
- revenue attribution;
- incrementality experimentation;
- multi-touch attribution;
- generic Campaign builder.

### Workstream C — Shared AI / Generation Capability Boundary

Objective:

> Consumer and Store must use one stable generation capability core, with separate product orchestration and commercial policies.

Shared technical capability may include:

- provider submission;
- provider polling;
- prompt resolution/versioning;
- normalized generation result contract;
- retry semantics;
- generic result persistence hooks/contracts;
- generic retention primitives;
- provider routing interface.

Consumer owns:

- Consumer request orchestration;
- Consumer quota / credits;
- Consumer result/history behavior;
- Consumer-specific fallback behavior;
- Consumer asset semantics.

Store / Commerce owns:

- MerchantSession authorization;
- merchant allowance settlement;
- merchant/catalog attribution;
- Store dispatch/result leases;
- Store asset access/retention policy;
- MerchantIntent / merchant event logic;
- merchant-specific generation orchestration.

Provider/model identity must remain an implementation concern and must not define merchant-facing entitlement contracts.

---

## 3. Explicit Non-Goals — Do Not Drift

The following work is explicitly out of scope for this consolidation.

Engineering MUST NOT start these items unless a separate Product decision is made:

1. Do not rewrite Store into a new `src/modules/commerce/**` tree just for naming cleanliness.
2. Do not move every Merchant / Store class into Commerce now.
3. Do not create a generalized workflow or Campaign builder.
4. Do not implement Shopify / WooCommerce / EHR integration.
5. Do not implement checkout or order ingestion solely for Pilot readiness.
6. Do not implement revenue attribution or ROI dashboards.
7. Do not implement multi-touch attribution.
8. Do not create a second Try-On / recommendation pipeline for Store.
9. Do not change Consumer pricing, credits, quota, or current UX behavior.
10. Do not replace provider routing merely for architectural purity.
11. Do not migrate SDK responsibilities into Store or Consumer orchestration.
12. Do not introduce public agent APIs or autonomous checkout.

Rule:

> **If a proposed task does not directly strengthen Workstream A, B, or C, it is not part of this 3–5 day consolidation.**

---

## 4. Current Baseline — What Is Already Done

The following ADR-007 enforcement has already landed and should be treated as the new baseline, not repeated work:

- shared TryOnTask retention moved to `src/lib/retention/**`;
- Consumer / Store pending sync use separate cron entry points;
- `src/lib/tryon-service.ts` no longer imports `src/modules/store/**`;
- Store submit/persist logic lives behind Store generation adapters;
- Consumer stability regression suite exists at `tests/unit/lib/adr-007-consumer-stability.test.ts`.

Therefore this consolidation should focus on **remaining ambiguous boundaries and contracts**, not re-implementing completed ADR-007 work.

---

## 5. Required Engineering Tasks

## A. Consumer / Store Boundary Tasks

### A1. Dependency audit

Search and classify all dependencies between:

```text
src/app/** consumer routes
src/lib/**
src/modules/store/**
```

Acceptance rule:

> No Consumer module or Consumer route may import `src/modules/store/**`.

If a Consumer path requires code currently owned by Store, move only the truly neutral primitive to shared core. Do not move Store orchestration.

### A2. Shared-core classification

For every shared file touched during this consolidation, classify it as one of:

```text
SHARED_TECHNICAL_PRIMITIVE
CONSUMER_ORCHESTRATION
STORE_ORCHESTRATION
```

Anything ambiguous must be resolved before merge.

### A3. Background-job isolation verification

Verify that:

- Store polling/reconciliation failure cannot abort Consumer polling;
- Store retention failure cannot abort Consumer retention;
- Store settlement failure cannot alter Consumer settlement;
- Store-specific cron changes do not add mandatory preconditions to Consumer cron paths.

Do not merge new Store cron logic into a shared monolithic job during this phase.

### A4. Consumer regression gate

The following behaviors must remain green:

- Consumer task origin remains `CONSUMER`;
- Consumer task has real `userId` and no merchant attribution;
- successful result is returned normally;
- Consumer polling works when Store reconciliation fails;
- Consumer quota settles exactly once;
- Store completion never mutates Consumer counters;
- Consumer cleanup works with mixed Consumer/Store task records;
- Frame Compare consumes normal Consumer results.

Any regression blocks the consolidation PR.

---

## B. Commerce Domain Boundary Tasks

### B1. Product identity contract

Confirm MerchantFrame / product records have a stable identity independent of image URL.

Minimum durable identity requirements:

```text
merchantId
frameId / productId
name
imageUrl
canonicalProductUrl?
sku?
price?
currency?
brand?
variant?
availability?
status
```

AI-derived attributes must remain distinguishable from merchant-provided commerce facts.

Do not redesign the entire catalog model if the current model already satisfies Pilot needs.

### B2. MerchantSession as journey context

MerchantSession must remain the current Pilot journey root for anonymous shoppers.

It must be able to preserve or reference:

```text
merchantId
source?
medium?
campaign?
referrer?
landingUrl?
aiAgentSource?
locale?
deviceType?
selected/recommended frames
Try-On task references
intent records
privacy / retention state
```

Do not introduce a Shopper account requirement.

### B3. Acquisition context persistence

Verify source/campaign context survives end-to-end:

```text
Session creation
 -> Recommendation
 -> Try-On
 -> Compare
 -> Product Click / Favorite / Inquiry
```

UTM/source fields are attribution context only and must never become authorization inputs.

### B4. Intent evidence contract

Current Pilot outcome is observed purchase intent.

Ensure MerchantIntent / equivalent durable events clearly distinguish:

```text
FAVORITE
PRODUCT_CLICK
INQUIRY
COMPARE
HIGH_INTENT / shortlist-derived behavior (if represented)
```

Do not label these events as PURCHASE, REVENUE, or verified CONVERSION.

### B5. Commercial policy reference boundary

Merchant-facing plan / allowance state must be versionable and provider-independent.

The implementation must support or have a clear extension seam for:

```text
commercialStage
planCode
pricingVersion
entitlementVersion
commerceSessionAllowance
standardRenderAllowance
premiumRenderAllowance?
campaignAllowance?
effectiveFrom
```

Do not hard-code `grsai`, Gemini model names, or provider-specific units into merchant plan identity.

### B6. Commerce extraction decision

During this phase, create `src/modules/commerce/**` **only if an actual second surface or duplicate business contract requires it now**.

Valid extraction triggers:

1. same business contract is needed by Storefront and another surface;
2. lifecycle is clearly independent of Storefront UI;
3. duplicate implementation already exists;
4. Store naming is actively causing incorrect dependencies.

Otherwise leave the current Store implementation in place.

---

## C. Shared AI / Generation Capability Tasks

### C1. One generation contract

Confirm Consumer and Store rely on the same stable technical contracts for:

- submit;
- poll;
- completion state;
- normalized result;
- retry/error semantics.

Separate adapters are expected. Duplicate provider pipelines are not.

### C2. Provider routing seam

Provider/model selection must remain behind a replaceable interface or service boundary.

Required invariant:

> Changing primary/fallback provider must not require changing Consumer route contracts, MerchantSession identity, Merchant entitlement identity, or Commerce events.

### C3. Persistence ownership

Shared generation core may expose a neutral persistence hook/contract.

Consumer and Store may implement different persistence policies.

Do not put merchant authorization, Store leases, Consumer credits, or merchant retention policy into the neutral persistence core.

### C4. Retention ownership

Keep generic retry/backoff/target primitives neutral.

Keep policy ownership separate:

```text
Consumer retention policy -> Consumer
Store retention policy    -> Store / Commerce
```

### C5. Recommendation boundary

Do not fork Recommendation into unrelated Consumer and Store algorithms where a shared ranking/intelligence capability is sufficient.

However, keep catalog scope and business orchestration separate:

```text
Shared recommendation capability
        ↑                  ↑
Consumer catalog/rules   Merchant catalog/rules
```

The Store recommendation must remain merchant-catalog-scoped.

---

## 6. File-Level Guardrails

These are guardrails, not a required refactor checklist.

### `src/lib/**`

Allowed:

- neutral generation primitives;
- neutral retention primitives;
- shared low-level utilities.

Not allowed:

- MerchantSession authorization;
- merchant entitlement business rules;
- Store-specific leases;
- MerchantIntent business logic;
- Store-only reconciliation.

### `src/modules/store/**`

Allowed:

- Storefront / merchant application orchestration;
- merchant session/authorization;
- merchant usage settlement;
- merchant asset policy;
- merchant events / intents;
- Store-specific generation adapters.

### Consumer routes/services

Must remain Store-independent.

Any Store import into Consumer code is a merge blocker unless a superseding ADR explicitly approves it.

### Future `src/modules/commerce/**`

Do not create as a bulk migration target.

Use only for durable commerce concepts whose reuse/lifecycle justifies extraction.

---

## 7. Execution Order

Recommended sequence:

### Day 1 — Audit + Freeze

1. Run dependency audit.
2. Identify remaining mixed ownership.
3. Create a short issue/checklist of only confirmed violations.
4. Freeze new architecture expansion until violations are resolved.

Output:

- dependency findings;
- exact files to change;
- no speculative refactor list.

### Day 2 — Boundary Fixes

1. Remove remaining Consumer -> Store dependencies.
2. Move only genuinely neutral primitives to shared core.
3. Verify cron / retention / settlement failure isolation.
4. Preserve behavior.

### Day 3 — Commerce Contracts

1. Verify product identity.
2. Verify MerchantSession acquisition context.
3. Verify Intent semantics.
4. Verify commercial policy is versionable/provider-independent.
5. Add only missing schema/contracts required for current Pilot.

### Day 4 — Shared AI / Generation Review

1. Check provider submission/poll/result contract.
2. Check persistence hook ownership.
3. Check retention policy boundaries.
4. Remove duplicated Store/Consumer provider logic if duplication exists.

### Day 5 — Regression + Freeze

1. Run Consumer regression suite.
2. Run Store critical path tests.
3. Run mixed Consumer/Store cleanup/polling tests.
4. Document any intentionally deferred debt.
5. Mark consolidation complete and return engineering focus to Pilot delivery.

If the work is complete in 3 days, stop. Do not spend days 4–5 inventing additional refactors.

---

## 8. Definition of Done

This consolidation is complete only when all of the following are true.

### Boundary DoD

- [ ] Consumer -> `src/modules/store/**` dependency count is zero.
- [ ] Store failures cannot abort protected Consumer background workflows.
- [ ] Consumer and Store settlement policies are separate.
- [ ] Consumer and Store asset/privacy policy ownership is separate.
- [ ] shared core contains no merchant business orchestration.

### Commerce DoD

- [ ] merchant product identity is stable and not image-URL-only.
- [ ] MerchantSession remains the anonymous Pilot journey root.
- [ ] source/campaign context persists through the intent journey.
- [ ] Intent is not mislabeled as Conversion/Revenue.
- [ ] commercial entitlement is versionable and provider-independent.
- [ ] no unnecessary Campaign/Conversion/Attribution platform has been built.

### Shared Capability DoD

- [ ] Consumer and Store use one stable generation technical core.
- [ ] provider selection is replaceable behind a seam.
- [ ] product-specific billing/usage logic is outside shared generation core.
- [ ] product-specific retention/persistence policy remains outside neutral primitives.
- [ ] no second Store-only Try-On engine exists.

### Regression DoD

- [ ] ADR-007 Consumer stability suite is green.
- [ ] Consumer Try-On + poll + settlement + Compare is green.
- [ ] Store recommendation + Try-On + Compare + Intent critical path is green.
- [ ] mixed Store/Consumer cleanup and pending-task behavior is green.

### Execution DoD

- [ ] no unresolved P0 architecture ambiguity remains for the first Merchant Pilot.
- [ ] deferred architecture items are explicitly listed and gated by real Pilot evidence.
- [ ] engineering returns to Merchant Pilot work after this consolidation.

---

## 9. Merge Gate for This Consolidation

Every PR in this workstream must include a short section answering:

```text
Architecture Consolidation Impact

Workstream: A / B / C
Consumer behavior changed: Yes / No
Consumer -> Store dependency introduced: Yes / No
Shared core business logic introduced: Yes / No
Merchant contract changed: Yes / No
Provider-specific commercial assumption introduced: Yes / No
Regression evidence:
- ...
```

Required merge rule:

> Any `Yes` to Consumer -> Store dependency, shared-core business orchestration, or provider-specific merchant contract is a blocker unless explicitly approved by Product + Engineering and documented by a new/superseding ADR.

---

## 10. Stop Conditions

Engineering must stop consolidation and return to Pilot delivery when the Definition of Done is met.

Do not continue refactoring because:

- a folder name could be cleaner;
- a future Campaign feature might exist;
- Shopify might be added later;
- a future enterprise architecture could be more elegant.

Future extraction is evidence-triggered.

The current goal is:

> **Stable Consumer + bounded Store/Commerce evolution + one shared capability core + no architectural blocker for real Merchant Pilot traffic.**

---

## 11. Follow-Up After Pilot Evidence

The following decisions are explicitly deferred until real merchant evidence exists:

- when `Campaign` becomes first-class;
- when `Conversion` becomes first-class;
- when Store-owned concepts move into `src/modules/commerce/**`;
- when Shopify / widget / API becomes the second delivery surface;
- when revenue attribution is justified;
- when multi-provider routing needs stronger abstraction;
- when commercial entitlement moves from configuration to a full billing product model.

Those decisions must not be pulled into the current consolidation without evidence.

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created explicit 3–5 day pre-Pilot architecture consolidation execution plan to operationalize ADR-007 and ADR-008 without broad rewrite. |
