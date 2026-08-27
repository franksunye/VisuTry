# Architecture Audit — Platform / 2B SaaS / Agent-Native Readiness

**Status:** Active audit (evidence-backed)  
**Date:** 2026-08-27  
**Owner:** Engineering / Product  
**Scope:** Document + code review of VisuTry modular monolith against platformization, multi-tenant 2B SaaS, and Agent-Native distribution goals.  
**Evidence:** Dependency/LOC/MCP parity scan reproduced in §8; full run log retained as agent artifact `architecture-audit-evidence.log`.  
**Related authority:** ADR-006, ADR-007, ADR-008, ADR-010, ADR-011; `docs/project/architecture.md`; `docs/product/specs/visutry-commerce-architecture.md`; `docs/product/plans/architecture-consolidation-plan.md`; `docs/product/plans/universal-agent-access.md`

---

## 1. Executive Verdict

**For the current stage (Founding Pilot → Product Advantage Gate), the architecture is directionally strong and better than typical early SaaS monorepos.** The team has already encoded the right platform instincts in ADRs and largely enforced the highest-risk boundary (Consumer generation isolation).

**For a durable multi-tenant 2B SaaS platform that serves brands at scale and is Agent-Native as a primary operating surface, the design is not yet “good enough” without deliberate consolidation.** The gaps are concentrated and known:

| Dimension | Grade | One-line assessment |
| --- | --- | --- |
| Strategic / domain intent (docs + ADRs) | **A−** | Commerce-over-Storefront, Intent-first, Agent-ready principles are clear and mostly coherent. |
| Consumer ↔ Store stability (ADR-007) | **A−** | Core generation/quota/cron isolation is real and regression-tested; handoff coupling remains. |
| Module cohesion (store / merchant / business) | **B−** | Merchant operator boundary exists, but Store still owns the Merchant entity and most commerce. |
| Multi-tenant isolation | **B+** | Strong patterns on agent/session paths; safety depends on caller discipline for some services. |
| Agent-Native (MCP / OAuth / Skill) | **B** | Correct architecture shape; live CF MCP is a reduced tool surface vs Node MCP. |
| Runtime dual-path (Vercel + Cloudflare) | **C+** | ADR-010 is sound; ~25 `*-cloudflare.ts` forks create drift risk that will compound with SaaS scale. |
| Shared capability core | **B** | One generation core works; `tryon-service` remains a large blast-radius orchestrator. |
| Documentation currency | **B−** | ADRs/plans excellent; `architecture.md` under-represents Store/Merchant/MCP reality. |

**Bottom line:** Do **not** rewrite into microservices or a greenfield `commerce/` tree. Do **freeze dual-path drift**, extract a few **shared commerce contracts** out of Store, and treat **Agent + Admin as clients of one application layer** as the next architecture program—evidence-triggered, not purity-triggered.

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

### F2. Consumer handoff surfaces import Store domain — P1 (ADR-007 soft leak)

**Evidence — Consumer/main importing Store:**

| Path | Import |
| --- | --- |
| `src/app/api/payment/create-session/route.ts` | `merchant-continuation` |
| `src/components/pricing/PricingCard.tsx` | `merchant-continuation` |
| `src/app/[locale]/(main)/auth/signin/page.tsx` | `getSafeShopperAuthCallbackUrl` |
| `src/app/[locale]/(main)/success/page.tsx` | `merchant-continuation` |
| `src/app/api/analytics/consumer-funnel/route.ts` | `session-acquisition.inferAiReferralSource` |
| `src/app/[locale]/(main)/discover/page.tsx` | Store application runtime + discover content |
| `src/components/distribution/ContextualExperienceHandoff.tsx` | `build-merchant-experience-href` |

**Why it matters:** These are money/auth/funnel paths. Store iteration can break Consumer checkout/sign-in without touching `/api/try-on`. The ADR-007 lint suite does not currently cover them.

**Recommendation:**

1. Extract `merchant-continuation` + AI referral inference into a **neutral shared package** (e.g. `src/lib/commerce-handoff/` or `src/modules/commerce/contracts/`) with no Store orchestration.
2. Extend ADR-007 automated import guards to payment, signin, success, pricing, and consumer-funnel.
3. Keep Discover as an explicit Store discovery surface (acceptable) but document it outside “Consumer protected workflow.”

### F3. Cloudflare / Node dual implementation drift — P0 for Agent-Native credibility

**Evidence:**

- **25** `*-cloudflare.ts` files across merchant/store/auth/data.
- Live MCP route uses Cloudflare server: `src/app/api/mcp/route.ts` → `createMerchantMcpServer` from `server-cloudflare.ts`.
- Tool parity gap (Node-only tools missing on CF path):

```text
archive_campaign
compare_experiences
inspect_catalog_source
publish_campaign
```

**Why it matters:** Agent-Native is a primary brand-facing operating promise. A reduced live MCP surface vs documented Node MCP creates silent capability skew between “what we say agents can do” and “what production agents can do.” Dual analytics/campaign/control-center copies will diverge under SaaS feature velocity.

**Recommendation (aligned with ADR-010, not against it):**

1. Prefer **one application service + thin runtime adapters** (SQL/driver differences only) over forked business logic.
2. Treat MCP tool registry as a single source; CF adapter may disable tools with explicit `availability`, never omit silently.
3. Add a CI parity check: Node tool set ⊇ CF tool set, or CF must declare `unavailableTools` with product acknowledgement.
4. Prioritize consolidating: `campaign-service`, `merchant-analytics`, `merchant-onboarding`, `merchant-control-center`, MCP server.

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

### F7. Documentation lag vs code reality — P2

`docs/project/architecture.md` (last reviewed 2026-08-20) still centers Consumer try-on/payment/SSG and only briefly points to Store foundation docs. It under-describes:

- `modules/store` / `modules/merchant` / `modules/business`;
- MCP / OAuth / Agent Keys;
- Hybrid CF edge paths;
- Discover / Experience / Campaign surfaces.

Product plans and ADRs are stronger than the “technical reality” doc—risk of agents/engineers optimizing to a stale map.

**Recommendation:** Expand `architecture.md` with a “Current domain map” section that links ADR-006/007/008/010 and the module tree; keep Consumer rendering/session detail as today.

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
| Tools call shared application services | Partially met (CF subset; Control Center not same APIs) |
| Skill teaches; MCP executes | Met |
| Human + agent share commerce core | Directionally met |
| External-client Golden Paths | Documented as still requiring revalidation |

---

## 6. Recommended Architecture Program (Next, Not Rewrite)

Order by risk reduction for platform/SaaS/agent goals:

### Phase A — Freeze drift (1–2 focused PRs)

1. MCP tool parity contract + CI check (Node vs CF).
2. Extend ADR-007 import guards to payment/signin/success/pricing/funnel.
3. Document live MCP availability matrix in `universal-agent-access.md`.

### Phase B — Shared commerce contracts (evidence already exists)

1. Extract `merchant-continuation` + acquisition inference out of Store domain into shared contracts.
2. Collapse Control Center / MCP / Admin onto one analytics application API.
3. Prefer adapter-thin CF files; ban new business-logic forks without ADR exception.

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
Consumer stability        ███████████████░░░  strong with soft leaks
Tenant / actor model      ██████████████░░░░  strong
Module cohesion           ██████████░░░░░░░░  uneven (Store overweight)
Agent-Native production   ██████████░░░░░░░░  shape good, parity gap
Runtime maintainability   ████████░░░░░░░░░░  dual-path tax
Platform-ready overall    ███████████░░░░░░░  good enough to pilot;
                                              not yet “set and forget” SaaS platform
```

**Is it “足够好”?**

- **够好** to continue brand pilots, Agent-Native onboarding, and Product Advantage Gate work **without a rewrite**.
- **不够好** to treat the current Store-centric module split + CF forks as the final platform architecture for scaled 2B SaaS.

The highest-leverage architectural investments are **parity/drift control** and **commerce contract extraction**, not new product layers.

---

## 8. Evidence Snapshot (2026-08-27)

```text
src/app ~25.3k LOC | components ~26.9k | lib ~14.4k | modules ~19.1k
store ~13.4k | merchant ~5.6k | business ~0.2k
*-cloudflare.ts files: 25
merchant→store import files: 9 | store→merchant: 6
Core Consumer generation → store imports: 0
MCP tools Node: 23 | CF: 19 | Node-only: publish_campaign, archive_campaign,
  compare_experiences, inspect_catalog_source
```

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-27 | Initial platform / 2B SaaS / Agent-Native architecture audit from docs + dependency evidence. |
