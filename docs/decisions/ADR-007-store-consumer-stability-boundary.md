# ADR-007: Store May Evolve Without Disrupting Stable Consumer Workflows

**Status:** Accepted  
**Date:** 2026-08-06  
**Owner:** Product / Engineering

## Context

VisuTry is entering a phase where Store / B2B capabilities will iterate quickly while the existing Consumer / B2C product must remain stable and continuously usable.

Store intentionally reuses proven generation capabilities, but Store also introduces different actors, tenant ownership, usage settlement, asset/privacy rules, background reconciliation, merchant insights, and faster product iteration.

The main architectural risk is therefore not whether Store can reuse Consumer infrastructure. The risk is that Store-specific changes gradually enter Consumer orchestration or shared operational jobs, increasing the blast radius of every Store release.

The desired operating model is:

```text
Consumer / B2C
  = stable product surface

Store / B2B
  = actively evolving commerce layer

Shared Core
  = backward-compatible generation infrastructure
```

Store development must be able to move quickly without requiring Consumer behavior to change and without allowing a Store failure to become a Consumer failure.

## Decision

The project adopts the following dependency rule as a mandatory engineering boundary:

> **Store may depend on Consumer-proven shared core; Consumer must never depend on Store.**

This supplements ADR-006. ADR-006 defines Store as a modular, multi-tenant domain on the existing generation core. ADR-007 defines the stability boundary required to protect the Consumer product while Store continues to evolve.

### 1. Identity boundary

Consumer identity and Store shopper identity remain separate.

- Consumer flows use the existing authenticated `User` / NextAuth model.
- Store shopper flows use merchant-scoped `MerchantSession` capabilities.
- Store MUST NOT create fake Consumer users.
- Consumer authentication/session code MUST NOT depend on Store session or merchant state.

### 2. Billing and usage boundary

Consumer quota settlement and Store usage settlement remain separate.

- Consumer tasks use Consumer free-trial / subscription / credits settlement.
- Store tasks use Store Demo or merchant allowance settlement.
- Store code MUST NOT increment, decrement, reserve, or otherwise mutate Consumer usage counters.
- Consumer billing behavior MUST NOT change merely because Store introduces a new pricing, usage, retry, or allowance rule.

### 3. Route and product-surface boundary

Store routes and UI remain additive.

- Store public/API routes live under Store-specific route boundaries such as `/store/**` and `/api/store/**`.
- Store UI MUST NOT require changes to existing Consumer page contracts unless a separate Consumer product decision explicitly approves them.
- A Store feature flag, merchant configuration, or Store failure MUST NOT make a Consumer route unavailable.

### 4. Background-job failure isolation

A Store background task MUST NOT prevent Consumer background work from completing.

This applies especially to polling, reconciliation, retention, cleanup, usage settlement, and future catalog synchronization jobs.

Required rule:

> **Store failure must be contained to Store work. Consumer polling, completion, retention, and quota settlement must continue independently.**

Preferred implementation is separate Consumer and Store cron/orchestration entry points. If a shared cron is temporarily retained, Store-specific work MUST be isolated behind its own failure boundary so an exception cannot abort Consumer processing.

New Store work MUST NOT add a mandatory pre-step to a Consumer cron unless that dependency is truly shared core infrastructure and is proven fail-safe for Consumer execution.

### 5. Shared-code dependency direction

Shared code must represent stable technical capability, not Store business orchestration.

Allowed shared core includes narrow, backward-compatible primitives such as:

- provider submission and polling;
- prompt resolution/versioning;
- generation result normalization;
- generic image/file handling;
- provider retry semantics;
- truly shared retention primitives.

Store-specific concerns MUST remain outside Consumer services, including:

- merchant/session authorization;
- Store usage policy;
- Store dispatch/result leases;
- merchant catalog attribution;
- Store asset-access policy;
- merchant insight/event logic;
- Store orphan cleanup and Store-specific reconciliation.

The preferred dependency direction is:

```text
                 Shared Generation Core
                    /             \
                   /               \
        Consumer Adapter        Store Adapter
              |                     |
       Consumer Quota          Merchant Usage
       Consumer Assets         Store Assets
       Consumer Jobs           Store Jobs
```

A Consumer module importing `src/modules/store/**` is a design smell and MUST be removed or explicitly justified by a superseding ADR.

A Store module MAY depend on a stable shared-core contract. It SHOULD NOT depend directly on Consumer UI, Consumer billing internals, or Consumer-specific route handlers.

### 6. Consumer backward compatibility

Store development MUST preserve the current Consumer contract unless a separate Consumer change is intentionally approved.

At minimum, the following Consumer flow is considered protected:

```text
Face Shape Detector
  -> Glasses Advisor
  -> Virtual Try-On
  -> async poll / result delivery
  -> Consumer quota / credits settlement
  -> Frame Compare
```

Protected Consumer behaviors include:

- existing authentication expectations;
- current service/provider selection semantics;
- successful result delivery;
- current failure/fallback behavior unless intentionally improved;
- exactly-once Consumer quota settlement;
- Consumer history visibility;
- Frame Compare continuation;
- existing data-retention behavior.

### 7. Store PR merge gate

Every Store PR that changes shared infrastructure MUST answer the following before merge:

1. Does this change modify a Consumer route, Consumer component, Consumer quota path, or Consumer task behavior?
2. Does any Consumer module now import Store-specific code?
3. Can a Store exception prevent Consumer polling, completion, cleanup, or settlement?
4. Does the change alter `TryOnTask` defaults or constraints for `origin = CONSUMER`?
5. Does the change alter provider selection, prompt behavior, retry behavior, persistence, or result fallback for Consumer tasks?
6. Are Store usage and Consumer quota still settled by separate policies?
7. Are Store assets / privacy rules isolated from Consumer asset delivery unless the change is intentionally shared core?
8. Which automated regression evidence proves the protected Consumer workflow still works?

A Store PR that cannot answer these clearly is not merge-ready.

## Enforcement

### Immediate engineering actions

1. Separate Store and Consumer background-job failure domains, beginning with pending Try-On synchronization/reconciliation.
2. Continue moving Store-specific orchestration out of shared Consumer-facing services; retain only stable generation primitives in shared core.
3. Move genuinely shared retention utilities to a neutral shared/core module rather than making Consumer depend on the Store module.
4. Maintain a fixed Consumer regression suite covering the protected workflow.
5. Run that Consumer regression suite for every Store PR that changes shared database schema, generation, polling, storage, retention, quota, or cron code.

### Regression gate

The minimum Consumer stability suite should cover:

- Consumer Try-On submission creates a `CONSUMER` task with a real `userId` and no merchant attribution.
- Consumer success completes and returns a usable result.
- Consumer async polling remains functional when Store reconciliation fails.
- Consumer quota/credits settle exactly once.
- Store completion never mutates Consumer counters.
- Consumer result persistence/fallback behavior remains unchanged.
- Consumer expired-task cleanup remains functional with both Consumer and Store records present.
- Frame Compare can consume normal Consumer Try-On results after Store changes.

Where practical, these should be automated integration/behavior tests rather than implementation-detail unit tests.

## Consequences

### Easier

- Store can iterate rapidly with a bounded blast radius.
- Consumer becomes a stable acquisition and paid-use surface rather than a moving dependency of Store development.
- Store-specific failures can be diagnosed and recovered without degrading Consumer service.
- Shared generation improvements can benefit both products when introduced through backward-compatible contracts.
- Engineering reviews gain a clear rule for deciding whether code belongs in Store, Consumer, or shared core.

### Harder

- Some currently shared orchestration must be split into narrower adapters/services.
- Background jobs may require separate entry points and monitoring.
- Store changes touching `TryOnTask`, generation, polling, storage, or retention require explicit Consumer regression evidence.
- Engineers must resist convenient Store imports from Consumer/shared modules when the dependency direction is wrong.

### Required

- Consumer stability is a merge requirement for Store changes, not a post-release check.
- Store-specific business logic remains inside `src/modules/store/**` or Store-owned routes/components.
- Shared core stays Store-neutral and Consumer-neutral wherever possible.
- Any intentional breaking change to Consumer behavior requires an explicit product/architecture decision rather than being introduced as a side effect of Store work.

## Related Documents

- `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
- `docs/product/specs/visutry-store-engineering-foundation.md`
- `docs/product/plans/visutry-store-implementation-plan.md`
- `docs/project/architecture.md`

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Accepted Consumer stability boundary and Store-to-shared-core dependency direction. |
