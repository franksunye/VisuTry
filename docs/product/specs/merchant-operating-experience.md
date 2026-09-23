# Merchant Operating Experience

**Status:** Active source of truth  
**Owner:** Product / Engineering  
**Created:** 2026-09-23  
**Last updated:** 2026-09-23  
**Scope:** Merchant human operating experience, Activation/Operating mode boundary, resource information architecture, lifecycle semantics, and Human/Agent responsibility boundary.

## 1. Product principle

VisuTry Merchant follows this operating principle:

> **Self-service first. Agent-operable by design. Human-light over time.**

The human Merchant UI is a first-class operating surface. Agent/MCP is an optional accelerator that uses the same canonical application/domain capabilities; it is not a separate business system and must not depend on browser DOM automation.

## 2. Activation Mode and First Value

Activation Mode is a focused first-use path:

```text
first product
→ Catalog ready
→ Store draft
→ private Store Preview
```

**First Value is achieved when the private Store Preview opens.** Publish is intentionally post-activation and remains an explicit consequential action.

The durable activation event contract is owned by `docs/merchant-activation-v1.md`.

## 3. Operating Mode eligibility

Activation analytics and runtime workspace mode are related but not identical.

`MerchantActivationEvent` is the factual analytics ledger. Runtime Operating Mode is resolved read-only from authoritative current evidence.

A Merchant is eligible for Operating Mode when any of these is true:

1. `merchant_store_previewed` exists; or
2. `merchant_store_published` exists; or
3. an actual Store Experience has `status = ACTIVE`.

Otherwise the Merchant remains in Activation Mode.

This compatibility rule does **not**:
- backfill activation history;
- synthesize Preview or Publish events;
- redefine First Value;
- alter the post-v1 activation cohort denominator.

An existing LIVE Store can therefore enter the Operating Experience even when historical activation events predate the current instrumentation.

## 4. Operating information architecture

Primary destinations:

- **Home** — status, attention, outcomes, and one state-derived recommended action; routes work to the correct resource workspace.
- **Catalog** — product intake, search, readiness, review, and editing.
- **Store** — Store configuration, product selection, private Preview, explicit Publish, and Live management.
- **Campaigns** — Campaign list/detail, Draft, private Preview, explicit Publish, Live management, and Archive.
- **Analytics** — canonical Store/Campaign activity and commerce-intelligence summaries supported by current business truth.

Utility destinations under More:

- **Integrations** — Agent Key access plus clearly separate OAuth/MCP connection semantics.
- **Plan & Usage** — merchant commercial state and usage.
- **Settings** — workspace identity/configuration.

Home is not a duplicate Control Center that embeds the full Catalog/Store/Campaign/Agent/Billing/Analytics stack.

## 5. Lifecycle truth

Merchant UI must describe actual application behavior.

- **Draft is not public.**
- **Preview is a private review boundary.**
- **Publish requires explicit approval.**
- **Live edits are immediate where the current application writes them immediately.** Do not claim staged revision semantics that do not exist.
- **Archive must be described as archive/stop-live behavior actually implemented**, not as Delete or an unimplemented unpublish state.
- Store/Campaign public links are shown only when the underlying lifecycle state supports them.

## 6. Human and Agent responsibility boundary

Human UI and Agent/MCP must call shared canonical application/domain capabilities so tenant isolation, validation, entitlements, attribution, and lifecycle semantics remain consistent.

Within authorized scope, an Agent may inspect, analyze, prepare, recommend, or draft.

Consequential actions retain explicit approval/authorization boundaries, including:
- Publish or stop/archive live experiences;
- spend/send actions where introduced;
- destructive/bulk deactivation operations;
- credential rotation/revocation;
- billing or commercial changes.

Agent integration is optional. A Merchant must be able to operate the supported product through the human UI without first connecting an Agent.

## 7. Tenant and authorization boundary

Merchant routes resolve an authenticated selected Merchant through server-side membership checks.

Current operating pages require the authorized Merchant context and OWNER/ADMIN access where the application contract requires it. Client navigation state is not an authorization boundary.

Agent credentials are tenant-bound and do not authorize DOM scraping or cross-Merchant access.

## 8. Production acceptance baseline

P1-M2 Merchant Operating Experience is **Product / UX / Production Accepted and Closed**.

Accepted Production baseline:
- main SHA: `3c29d56cce1c380bef42c3f9e99dd25f95ac8724`
- Vercel deployment: `dpl_ELfRGDagvdv9nXLfL3K8wGkkLiiS`
- Production Acceptance: GitHub Issue #230 — CLOSED / PASS
- bounded Production smoke observed Home, Catalog, Store, Campaigns, Analytics, Integrations, Plan & Usage, and Settings in the expected VisuTry Demo Merchant context
- Vercel smoke window: 0 observed 5xx and no Merchant-route runtime error clusters
- no schema migration and no Production data repair were required for closure

The Production compatibility fix that separated workspace mode from activation-event-only gating was delivered through Issue #231 / PR #232.

## 9. Related authorities

- Product execution priority: `docs/product/product-plan.md`
- Activation event semantics: `docs/merchant-activation-v1.md`
- Merchant/Experience architecture: `docs/product/specs/merchant-experience-architecture.md`
- Commerce architecture: `docs/product/specs/visutry-commerce-architecture.md`
- System architecture: `docs/project/architecture.md`
- Observability and analytics: `docs/project/observability-and-analytics-contract.md`
- Agent/OAuth implementation boundaries: `docs/product/plans/universal-agent-access.md`

## 10. Non-goals

This spec does not authorize:
- a new product phase or roadmap;
- new Agent tools or autonomous consequential actions;
- new billing or pricing semantics;
- a schema migration;
- a separate Merchant backend or microservice split.

Exact component/file inventories remain code-authoritative.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-23 | Created the durable Merchant Operating Experience authority after P1-M2 Product/UX/Production acceptance and the ACTIVE-Store compatibility fix. |
