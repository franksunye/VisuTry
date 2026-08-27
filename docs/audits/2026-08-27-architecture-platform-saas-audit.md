# Architecture Audit — Platform / 2B SaaS / Agent-Native Readiness

**Status:** Active audit (evidence-backed; review corrections applied)  
**Date:** 2026-08-27  
**Last updated:** 2026-08-27 (PR review reconciliation)  
**Owner:** Engineering / Product  
**Scope:** Document + code review of VisuTry modular monolith against platformization, multi-tenant 2B SaaS, and Agent-Native distribution goals.  
**Evidence:** Dependency/LOC/MCP parity scan reproduced in §8; full run log retained as agent artifact `architecture-audit-evidence.log`.  
**Related authority:** ADR-006, ADR-007, ADR-008, ADR-010, ADR-011; `docs/project/architecture.md`; `docs/product/specs/visutry-commerce-architecture.md`; `docs/product/plans/architecture-consolidation-plan.md`; `docs/product/plans/universal-agent-access.md`  
**Review note:** Corrected after PR review: (1) `*-cloudflare.ts` naming ≠ Cloudflare Workers serving runtime for `/api/mcp`; (2) Consumer→Store imports contradict the still-Complete consolidation DoD and must be reconciled as authority debt; (3) dual-implementation parity must be behavioral/invariant, not tool-name only.

---

## 1. Executive Verdict

**For the current stage (Founding Pilot → Product Advantage Gate), the architecture is directionally strong and better than typical early SaaS monorepos.** The team has already encoded the right platform instincts in ADRs and largely enforced the highest-risk boundary (Consumer generation isolation).

**For a durable multi-tenant 2B SaaS platform that serves brands at scale and is Agent-Native as a primary operating surface, the design is not yet “good enough” without deliberate consolidation.** The gaps are concentrated and known:

| Dimension | Grade | One-line assessment |
| --- | --- | --- |
| Strategic / domain intent (docs + ADRs) | **A−** | Commerce-over-Storefront, Intent-first, Agent-ready principles are clear and mostly coherent. |
| Consumer ↔ Store stability (ADR-007) | **B+** | Generation/quota/cron isolation is real and tested; handoff imports are unresolved authority debt vs a still-Complete consolidation DoD (see F2). |
| Module cohesion (store / merchant / business) | **B−** | Merchant operator boundary exists, but Store still owns the Merchant entity and most commerce. |
| Multi-tenant isolation | **B+** | Strong patterns on agent/session paths; safety depends on caller discipline for some services. |
| Agent-Native (MCP / OAuth / Skill) | **B** | Correct architecture shape; live path uses the `*-cloudflare` (raw-SQL) implementation family with a reduced tool set vs the unused Prisma alternate. |
| Dual-implementation maintainability | **C+** | ADR-010 hybrid edge remains sound; ~25 `*-cloudflare.ts` forks are **implementation** forks (Prisma vs raw SQL / edge-compatible), not necessarily Workers serving runtime. Behavioral drift is the real tax. |
| Shared capability core | **B** | One generation core works; `tryon-service` remains a large blast-radius orchestrator. |
| Documentation currency | **B−** | ADRs/plans excellent; consolidation DoD and `architecture.md` needed reconciliation with live imports/MCP wiring. |

**Bottom line:** Do **not** rewrite into microservices or a greenfield `commerce/` tree. Do **freeze dual-implementation drift with behavioral contract tests**, reconcile the Consumer→Store authority contradiction, extract a few **shared commerce contracts** out of Store, and treat **Agent + Admin as clients of one application layer**—evidence-triggered, not purity-triggered.

---

## 2. Current Logical Architecture (as built)

```text
                         VisuTry modular monolith (Next.js)

  Consumer B2C                         Merchant / Agent B2B
  ────────────                         ───────────────────
  (main) pages + gates                 Merchant Control Center
  /api/try-on, payment, user           /api/merchant/*, /api/agent/v1/*
  JWT User + credits                   MCP (/api/mcp) + OAuth + Agent Keys
         \                                    /
          \                                  /
           v                                v
              Shared generation / retention / prompts
                    (src/lib/tryon-service, generation/, retention/)
                              |
                              v
                         Neon PostgreSQL
```

**Modules (LOC, approximate):**

| Module | ~LOC | Intended ownership | Actual ownership skew |
| --- | --- | --- | --- |
| `src/modules/store` | ~13.4k | Storefront + shopper journey | Still the **commerce domain center** (Merchant repo, campaigns, analytics, entitlement domain files) |
| `src/modules/merchant` | ~5.6k | Tenant identity, access, agent/MCP | Operator/agent layer; depends on Store for profile/repo + commerce ops |
| `src/modules/business` | ~0.2k | Pilot lead CRM | Clean and narrow |
| `src/lib` | ~14.4k | Shared technical primitives | Mix of truly shared + Store SEO/skill/discovery adapters |

This matches ADR-006 (modular monolith + Merchant tenant) and ADR-008’s *intent*, but not yet ADR-008’s *extraction trigger* end-state (`src/modules/commerce/**`).

---

## 3. What Is Already Good (Keep)

### 3.1 Documented platform direction is unusually mature

- ADR-006: modular multi-tenant Store on shared generation core — correct for current scale.
- ADR-007: **Store may depend on shared core; Consumer must never depend on Store** — the right stability rule for parallel B2C + B2B evolution.
- ADR-008: **Commerce is the domain; Storefront is a delivery surface**; human + agent traffic share one commerce core.
- ADR-010: **Cloudflare for traffic scale; backend for compute complexity** — right hosting strategy for brand/shopper traffic vs AI/payment/Blob.
- Consolidation plan DoD (2026-08-06) closed P0 Consumer/Store generation isolation without a rewrite.

### 3.2 ADR-007 is enforced where it matters most

Evidence (2026-08-27 dependency scan):

- `src/app/api/try-on/**`, `src/lib/tryon-service.ts`, `src/lib/quota.ts`, Consumer pending-sync cron: **zero** `modules/store` imports.
- Separate Store cron entry points; Store persist via injected handler (`src/lib/generation/tryon-result-persist.ts`).
- Regression suite: `tests/unit/lib/adr-007-consumer-stability.test.ts`.

This is the single most important architectural win for going 2B without breaking Consumer revenue.

### 3.3 Multi-tenant and Agent actor model are real

- `Merchant` is the tenant root; shoppers use `MerchantSession` capability tokens (no fake Consumer users).
- Agent Key and OAuth converge to `MerchantActorContext`; tools do not trust caller-supplied `merchantId` as the tenant boundary.
- Scopes (`merchant:*`, `catalog:*`, `experience:*`, `analytics:*`) are shared vocabulary across Agent Key and OAuth.
- Destructive publish paths require explicit `approved=true`.
- Analytics MCP adapters advertise availability limits (no revenue/orders/raw shopper PII) — correct for Intent-first maturity.

### 3.4 Store session APIs are thin and port-oriented

`/api/store/sessions/*` typically: validate contract → capability token → `createStoreRuntime()` → application use case. This is a healthy application-layer boundary for SaaS expansion.

### 3.5 Product system split across repos is coherent

`docs/product/product-system.md` correctly keeps:

- VisuTry = commercial platform;
- tryon-sdk = reusable capability;
- mobile = surface.

That prevents premature backend forks while Agent Native grows on the platform.

---

## 4. Findings — Cohesion / Coupling Issues

### F1. Store still owns Merchant persistence (inverted domain ownership) — P1

**Evidence:** `src/modules/merchant/application/get-merchant-profile.ts` imports `createPrismaMerchantRepository` from `src/modules/store/infrastructure/prisma/merchant-repository`. Merchant onboarding/control-center also pull Store campaign/presentation/distribution domain.

**Why it matters:** ADR-008 wants Commerce (Merchant, Catalog, Campaign, Journey, Intent, Measurement) to be surface-agnostic. Today “Merchant module” is mostly **operator identity + agent access**, while “Store module” is **almost the whole commerce domain**. Second surfaces (widget, Shopify, agent-only ops) will keep importing Store as if Storefront were the domain.

**Recommendation:** Evidence-triggered extraction—not a rename rewrite:

1. Move Merchant aggregate + repository ports toward `modules/merchant` or a thin `modules/commerce/merchant` when a second non-Storefront writer appears.
2. Until then, treat Store `merchant-*` domain files as **commerce contracts** and forbid Consumer imports except via an explicit shared package (see F2).

### F2. Consumer handoff surfaces import Store domain — P0 authority debt (not a “soft leak”)

**Evidence — Consumer/main importing Store (2026-08-27):**

| Path | Import |
| --- | --- |
| `src/app/api/payment/create-session/route.ts` | `merchant-continuation` |
| `src/components/pricing/PricingCard.tsx` | `merchant-continuation` |
| `src/app/[locale]/(main)/auth/signin/page.tsx` | `getSafeShopperAuthCallbackUrl` |
| `src/app/[locale]/(main)/success/page.tsx` | `merchant-continuation` |
| `src/app/api/analytics/consumer-funnel/route.ts` | `session-acquisition.inferAiReferralSource` |
| `src/app/[locale]/(main)/discover/page.tsx` | Store application runtime + discover content |
| `src/components/distribution/ContextualExperienceHandoff.tsx` | `build-merchant-experience-href` |

**Authority contradiction:** `docs/product/plans/architecture-consolidation-plan.md` remains **Status: Complete** and its Boundary DoD asserts:

> Consumer → `src/modules/store/**` dependency count is zero.

Its merge gate also treats any Consumer → Store dependency as a blocker unless a superseding ADR approves it. This audit finds **seven** Consumer/main → Store imports. Under the still-active written rule, that is either:

1. a **regression from a closed DoD**, or
2. evidence the consolidation authority must be **explicitly superseded / exceptioned**.

Calling this only a “soft leak” understates the governance failure.

**Why CI stays green:** `tests/unit/lib/adr-007-consumer-stability.test.ts` only scans protected generation/cron/try-on roots:

```text
src/lib/tryon-service.ts
src/lib/quota.ts
src/lib/compare-tryon-server.ts
src/lib/cron/sync-pending-consumer-tasks.ts
src/app/api/cron/cleanup-expired-tasks/route.ts
src/app/api/cron/sync-pending-consumer-tasks/route.ts
src/app/api/try-on/**
```

It does **not** scan payment, signin, success, pricing, consumer-funnel, discover, or distribution handoff surfaces. Generation isolation remains genuinely green; the broader “zero Consumer→Store imports” claim is what drifted.

**Recommendation:**

1. Update/supersede the consolidation plan DoD immediately (see plan change in this PR): split **generation isolation (still Complete)** from **route-wide import zero (reopened / exceptioned)**.
2. Record approved exceptions (Discover as Store surface; distribution handoff) vs debt (payment/signin/success/pricing/funnel importing Store domain).
3. Extract `merchant-continuation` + AI referral inference into a **neutral shared package** with no Store orchestration.
4. Extend ADR-007 automated import guards to those money/auth/funnel paths (or document permanent exceptions by ADR).

### F3. Dual implementation drift (`*-cloudflare` vs Prisma alternate) — P0 for Agent-Native credibility

**Important correction — naming ≠ serving runtime:**

`src/app/api/mcp/route.ts` declares `export const runtime = 'nodejs'`. B4 production classification marks `/api/mcp` as `vercel-required` (`cloudflare-router/b4-production-public-slice.ts`). The live route still **imports** `server-cloudflare.ts` and the `merchant-*-cloudflare` / `campaign-service-cloudflare` family.

So the production fact is:

```text
Serving runtime:     Vercel Node (not Workers) for POST /api/mcp
Live implementation: *-cloudflare.ts  = edge-compatible / raw-SQL family
Alternate (unused):  server.ts + Prisma campaign/onboarding services
                     — zero production importers found for mcp/server.ts
```

Do **not** frame the primary contract as “Node runtime vs Cloudflare Workers runtime parity.” Frame it as **live vs alternate implementation parity** (raw-SQL / `*-cloudflare` adapters vs Prisma services), regardless of which host executes the route.

**Evidence:**

- **25** `*-cloudflare.ts` files across merchant/store/auth/data.
- Live MCP wires `createMerchantMcpServer` from `server-cloudflare.ts` only.
- Tool-registry gap vs unused Prisma MCP (`server.ts`):

```text
archive_campaign
compare_experiences
inspect_catalog_source
publish_campaign
```

- **Behavioral drift beyond tool names** (example): Prisma `campaign-service.ts` wraps create/update/publish/archive mutations in `withPublicDiscoveryInvalidation`. `campaign-service-cloudflare.ts` does **not**. Live MCP therefore can mutate campaign state without the discovery-invalidation invariant of the Prisma alternate. Tool-name parity alone will not catch cache invalidation, readiness, audit, idempotency, or tenant-check drift. CF `publishCampaign` / `archiveCampaign` currently throw `publishUnsupported()` while Prisma implements them—another capability/invariant split.

**Why it matters:** Agent-Native is a primary brand-facing operating promise. A reduced live tool surface vs an alternate Prisma MCP, plus silent business-invariant skew inside shared tool names, creates credibility and correctness risk under SaaS velocity.

**Recommendation (aligned with ADR-010, not against it):**

1. Prefer **one application service + thin persistence adapters** (SQL/driver differences only) over forked business logic.
2. Treat MCP tool registry as a single source; the live adapter may disable tools with explicit `availability`, never omit silently relative to product docs.
3. Phase A must require **contract tests for equivalent business outcomes/invariants** across duplicated service pairs (invalidation, tenant scope, idempotency, audit, readiness)—tool-registry parity is only one layer.
4. Prioritize consolidating: `campaign-service`, `merchant-analytics`, `merchant-onboarding`, `merchant-control-center`, MCP server families.
5. Decide explicitly whether Prisma `server.ts` remains a maintained alternate, a migration target, or dead code—today it has no production call site.

### F4. Three merchant intelligence stacks — P1

| Surface | Path |
| --- | --- |
| MCP analytics tools | `store/application/merchant-analytics(-cloudflare)` |
| Merchant Control Center | `merchant/application/merchant-control-center(-cloudflare)` (re-aggregates) |
| Admin Experience UI | `get-merchant-insights` / `get-experience-admin` |

**Why it matters:** Brands and agents will disagree on “top frames / intent / funnel” if definitions diverge. For 2B SaaS trust, measurement contracts must be single-sourced.

**Recommendation:** One Commerce Intelligence application API; Admin, Control Center, and MCP are clients only.

### F5. Shared `tryon-service` remains a mega-orchestrator — P2

`src/lib/tryon-service.ts` (~1000 LOC) still knows Store origins and injects Store persist. Pattern is intentional and tested, but it is the largest shared blast radius under mixed Consumer + Store + agent-driven generation load.

**Recommendation:** Keep one core; progressively push origin policy to adapters (`ConsumerGenerationAdapter` / `StoreGenerationAdapter`) so the shared file is submit/poll/normalize only.

### F6. Consumer API routes remain pre-modular — P2

`/api/try-on/*` talks to Prisma/quota/tryon-service directly (thick handlers). Fine for a stable B2C surface; inconsistent with Store’s application-layer discipline.

**Recommendation:** Do not refactor for purity. Extract only when a second Consumer surface (mobile/API) needs the same contracts.

### F7. Documentation lag vs code reality — P2 (partially addressed in this PR)

`docs/project/architecture.md` historically centered Consumer try-on/payment/SSG. This audit PR adds a domain-module / MCP map and corrects the MCP serving-vs-implementation wording. Remaining lag:

- Product docs may still describe “CF MCP” as if Workers served `/api/mcp`;
- Dual-implementation availability matrices are not yet first-class in `universal-agent-access.md`;
- Consolidation DoD was Complete without recording later handoff imports (now §8.1).

**Recommendation:** Keep `architecture.md` as technical reality; treat this audit + consolidation §8.1 as the reconciliation trail until handoff extraction or an exception ADR lands.

---

## 5. Fit Check Against Stated Goals

### 5.1 Platform (multi-surface, one core)

| Need | Status |
| --- | --- |
| One generation core | Met |
| Delivery surfaces as adapters | Partially met — Storefront still is the domain center in code |
| SDK / Mobile / Web ownership | Met in docs; Web still embeds some SDK-like vision code |
| Extract commerce when second surface needs it | Correctly deferred; trigger approaching (MCP + Discover + Admin already = 3 surfaces) |

### 5.2 2B SaaS for brands

| Need | Status |
| --- | --- |
| Tenant = Merchant | Met |
| Entitlement versioning provider-independent | Met in domain/spec direction |
| Billing / self-serve checkout for merchants | Deferred (acknowledged) |
| Control Center vs full visual builder | Correct product principle |
| Catalog as commerce identity | Met for Pilot; PIM depth deferred |
| Isolation + abuse limits | Strong on session/agent paths |

### 5.3 Agent Native (承接流量，服务品牌)

| Need | Status |
| --- | --- |
| Standards-based Remote MCP | Met |
| OAuth + Agent Key → same actor | Met |
| Tools call shared application services | Partially met (live `*-cloudflare` subset; Control Center not same APIs; Prisma alternate unused) |
| Skill teaches; MCP executes | Met |
| Human + agent share commerce core | Directionally met |
| External-client Golden Paths | Documented as still requiring revalidation |

---

## 6. Recommended Architecture Program (Next, Not Rewrite)

Order by risk reduction for platform/SaaS/agent goals:

### Phase A — Freeze drift + reconcile authority (focused PRs)

1. **Reconcile consolidation DoD** (done in this PR as documentation debt acknowledgment): generation isolation remains Complete; route-wide Consumer→Store import-zero is reopened until exceptions are ADR-approved or extracted.
2. **Behavioral dual-implementation contract tests** for live `*-cloudflare` vs Prisma alternate pairs used by merchant/MCP paths: at minimum discovery invalidation, tenant scoping, idempotency/audit recording, and readiness/publish gates. Tool-registry name parity is necessary but **not sufficient**.
3. Document the live MCP availability matrix (serving runtime = Vercel Node; implementation family = `*-cloudflare`) in `universal-agent-access.md`.
4. Extend ADR-007 import guards to payment/signin/success/pricing/funnel, or record permanent exceptions via ADR.

### Phase B — Shared commerce contracts (evidence already exists)

1. Extract `merchant-continuation` + acquisition inference out of Store domain into shared contracts.
2. Collapse Control Center / MCP / Admin onto one analytics application API.
3. Prefer adapter-thin `*-cloudflare` files (persistence only); ban new business-logic forks without ADR exception.

### Phase C — Commerce module extraction (only when triggered)

Valid triggers (already nearly true for analytics + campaign):

- same business contract needed by Storefront + MCP + Admin;
- Store naming causing incorrect Consumer dependencies;
- duplicate implementation already exists (F4).

Then introduce incremental `src/modules/commerce/{merchant,catalog,campaign,journey,measurement}` **by moving contracts**, not by renaming the whole Store tree.

### Explicit non-goals (reaffirm)

- Microservices split;
- Generic campaign/workflow builder;
- Shopify/public widget before gate evidence;
- Second Try-On engine;
- Autonomous agent checkout.

---

## 7. Scorecard Summary

```text
Direction (docs/ADRs)     ████████████████░░  strong
Consumer stability        ██████████████░░░░  generation strong; handoff authority debt
Tenant / actor model      ██████████████░░░░  strong
Module cohesion           ██████████░░░░░░░░  uneven (Store overweight)
Agent-Native production   ██████████░░░░░░░░  shape good; live/alternate invariant gap
Dual-impl maintainability ████████░░░░░░░░░░  *-cloudflare fork tax
Platform-ready overall    ███████████░░░░░░░  good enough to pilot;
                                              not yet “set and forget” SaaS platform
```

**Is it “足够好”?**

- **够好** to continue brand pilots, Agent-Native onboarding, and Product Advantage Gate work **without a rewrite**.
- **不够好** to treat the current Store-centric module split + dual implementation forks as the final platform architecture for scaled 2B SaaS.

The highest-leverage architectural investments are **behavioral drift control**, **Consumer→Store authority reconciliation**, and **commerce contract extraction**—not new product layers.

---

## 8. Evidence Snapshot (2026-08-27)

```text
src/app ~25.3k LOC | components ~26.9k | lib ~14.4k | modules ~19.1k
store ~13.4k | merchant ~5.6k | business ~0.2k
*-cloudflare.ts files: 25
merchant→store import files: 9 | store→merchant: 6
Core Consumer generation → store imports: 0
Consumer/main → store handoff imports: 7 paths (see F2)
POST /api/mcp: runtime=nodejs, B4=vercel-required, impl=server-cloudflare.ts
Prisma mcp/server.ts production importers: 0
MCP tools live(*-cloudflare): 19 | alternate(Prisma server.ts): 23
Alternate-only tools: publish_campaign, archive_campaign,
  compare_experiences, inspect_catalog_source
Example invariant drift: Prisma campaign mutations wrap
  withPublicDiscoveryInvalidation; *-cloudflare campaign-service does not
ADR-007 import test roots: tryon-service, quota, compare-tryon-server,
  consumer cron helpers, /api/try-on — not payment/auth/success/pricing/funnel
```

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-27 | Initial platform / 2B SaaS / Agent-Native architecture audit from docs + dependency evidence. |
| 2026-08-27 | Review reconciliation: reframed F3 as live vs alternate implementation parity (not Workers vs Node serving); elevated F2 to consolidation DoD contradiction; required behavioral contract tests in Phase A. |
