# VisuTry Agent-Native Merchant Self-Service — Product & Architecture Plan

Status: Core implementation through Phase D complete; external-Pilot hardening remains
Created: 2026-08-12
Last reconciled: 2026-08-24
Scope: Merchant onboarding, Store/Campaign implementation, operations and analytics through external AI agents

## 1. Why this plan exists

VisuTry should not require every merchant to learn a large proprietary SaaS Admin before they can launch a Store, create a Campaign or understand performance.

The emerging operating model is simpler:

```text
Merchant signs up
      ↓
Gets VisuTry access key
      ↓
Connects VisuTry MCP + Skill to an AI agent
      ↓
Tells the agent what outcome is wanted
      ↓
Agent implements through VisuTry capabilities
      ↓
Merchant previews / approves
      ↓
Store / Campaign goes live
```

The merchant may use ChatGPT, Claude, Codex or another capable agent. VisuTry remains the commerce infrastructure and source of truth; the external agent becomes the implementation and operating interface.

This can materially lower onboarding friction, implementation effort and support cost while increasing the addressable merchant base, especially for smaller eyewear brands and retailers without dedicated technical or ecommerce implementation teams.

The intended product shift is:

> **From “learn our SaaS” to “give VisuTry to your agent.”**

This is inspired by the same general agent-native operating principle used in Runory, but VisuTry is intentionally much narrower: the domain objects and workflows are limited to eyewear commerce implementation and intelligence.

---

## 2. North Star merchant experience

The ideal first-session experience is:

```text
1. Merchant registers / signs in
2. VisuTry provisions a Merchant tenant
3. Merchant sees:
   - API / Agent Key
   - MCP endpoint
   - Skill URL / copy address
   - one example instruction
4. Merchant gives the key + Skill to their agent
5. Merchant says:

   “Set up my eyewear business on VisuTry.
    Import my catalog, create my Store,
    and help me launch my first Campaign.”

6. Agent:
   - inspects onboarding state
   - imports / validates catalog
   - creates Store draft
   - proposes first Campaign
   - creates Campaign draft
   - returns preview URLs
7. Merchant approves
8. Agent publishes
9. Merchant later asks the same agent questions such as:

   “Which frames generated the most shopper intent last week?”
   “Create a sunglasses Campaign using my current catalog.”
   “Which Campaign should I keep running?”
```

The merchant should not need to understand VisuTry internal data models, routes or Admin configuration details to complete these workflows.

---

## 3. Product principle: Agent-first, Admin-available

VisuTry should be **Agent-first, not Agent-only**.

The external AI agent is the preferred builder/operator interface for:

- onboarding;
- catalog import and correction;
- Store creation;
- Campaign creation;
- bulk updates;
- implementation guidance;
- operational questions;
- analytics queries.

VisuTry Admin remains available as the control surface for:

- account and tenant status;
- catalog inspection;
- Experience status and preview;
- high-level analytics;
- usage / entitlement;
- API key and agent access management;
- billing visibility where implemented; merchant self-service checkout,
  invoices, and payment-method management remain deferred;
- emergency pause / revoke;
- manual intervention when needed.

The Admin should therefore evolve toward a **Control Center**, not a full visual builder that duplicates every capability exposed to agents.

---

## 4. Architecture principle

Admin and MCP must be clients of the same application/domain capabilities.

Preferred architecture:

```text
                  ┌──────────────────┐
                  │  VisuTry Admin   │
                  └────────┬─────────┘
                           │
                           ▼
                  VisuTry Commerce API
                           ▲
                           │
                  ┌────────┴─────────┐
                  │   VisuTry MCP    │
                  └────────┬─────────┘
                           │
             ChatGPT / Claude / Other Agent
```

Do not implement:

```text
Agent → MCP → automate / scrape Admin UI
```

Do not create separate business rules for Admin and MCP.

The authoritative implementation path should remain:

```text
Merchant / Catalog / Experience / Campaign / Analytics
                ↓
     shared application/domain services
                ↓
        Admin API + MCP tools
```

This keeps tenant isolation, validation, attribution, entitlement and lifecycle rules consistent regardless of the client.

---

## 5. Core domain objects exposed to the agent

The first version should stay intentionally narrow.

### Merchant

The merchant tenant and its public brand/business configuration.

Agent-relevant responsibilities:

- inspect merchant profile;
- update approved public brand details;
- inspect onboarding status;
- inspect account capability / trial limits.

### Catalog

Merchant-owned eyewear products / frames.

Agent-relevant responsibilities:

- import frames;
- list / inspect frames;
- update facts;
- deactivate invalid items;
- validate catalog quality;
- detect missing or unusable product data.

### Experience

Shared Store / Campaign model.

Agent-relevant responsibilities:

- list Experiences;
- inspect Experience configuration;
- create Store;
- create Campaign;
- select catalog subset;
- update headline / description / presentation-safe settings;
- preview;
- publish;
- archive / pause where allowed.

### Analytics / Commerce Intelligence

Agent-relevant responsibilities:

- Experience performance summary;
- funnel metrics;
- top frames;
- shopper intent summary;
- comparison across Experiences;
- usage / sponsored consumption where merchant-visible.

The MCP layer should not expose raw internal tables simply because they exist.

---

## 6. MCP v0.1 scope

The first MCP should be small and outcome-oriented rather than a generic database API.

Suggested initial tool surface:

### Merchant

```text
get_merchant
get_onboarding_status
update_merchant_brand
get_visutry_capabilities
```

### Catalog

```text
list_frames
get_frame
import_frames
create_frame
update_frame
deactivate_frame
validate_catalog
```

### Store / Campaign

```text
list_experiences
get_experience
create_store
create_campaign
update_experience
set_experience_frames
preview_experience
publish_experience
archive_experience
```

### Analytics

```text
get_experience_summary
get_top_frames
get_shopper_funnel
get_intent_summary
compare_experiences
```

This list is a planning baseline, not a requirement to create one endpoint per database operation. Tool contracts should be shaped around merchant outcomes.

---

## 7. Skills v0.1

MCP defines **what the agent can do**. Skills define **how the agent should do it correctly**.

Skills are therefore first-class product assets, not documentation afterthoughts.

### 7.1 Merchant Onboarding Skill

Primary user instruction:

> “Set up my eyewear business on VisuTry.”

Expected workflow:

```text
inspect onboarding status
      ↓
collect website / catalog source
      ↓
inspect merchant identity
      ↓
import catalog
      ↓
validate catalog
      ↓
report blocking data problems
      ↓
create Store draft
      ↓
recommend one useful first Campaign
      ↓
create Campaign draft
      ↓
return previews
      ↓
request approval
      ↓
publish
```

The Skill should prefer safe defaults and existing VisuTry product contracts rather than inventing arbitrary configuration.

### 7.2 Campaign Creation Skill

Primary user instructions may include:

- “Create a Campaign for shoppers with small faces.”
- “Launch a sunglasses Campaign.”
- “Create a Campaign around my new collection.”

Expected workflow:

```text
understand objective
      ↓
inspect current catalog
      ↓
select relevant frames
      ↓
propose Campaign positioning
      ↓
create draft
      ↓
preview
      ↓
request approval
      ↓
publish
```

The Skill must respect existing Campaign Conversion Policy, presentation modes, merchant catalog ownership and public/reference provenance.

### 7.3 Commerce Analyst Skill

Primary user instructions may include:

- “How did my Store perform last week?”
- “Which frames produced the most intent?”
- “Compare my two Campaigns.”
- “Which Campaign should I keep running?”

The Skill should query canonical VisuTry metrics and explain denominators and limits. It must not invent revenue attribution or conversion uplift that VisuTry does not actually measure.

---

## 8. First-login / onboarding surface

The Merchant first-login page should be extremely simple.

Target structure:

```text
Welcome to VisuTry

1. Your Agent Key
   [ vt_•••••••••••• ] [Copy]

2. Connect your AI agent

   MCP
   https://...

   Skill
   https://...

3. Tell your agent

   “Set up my eyewear business on VisuTry.
    Import my catalog, create my Store,
    and help me launch my first Campaign.”

[ Open Control Center ]
```

The onboarding page should not require the merchant to configure Store/Campaign manually before the agent path becomes usable.

Later versions may provide direct “Open in ChatGPT / Claude” convenience actions when product integrations and platform capabilities make that reliable.

For a first-time authenticated user with no `MerchantMembership`, the same
surface presents a minimal `Create Merchant Workspace` form. Submission uses
`createMerchantWithOwner` with the server-side session `User.id`, atomically
creating the Merchant and its `OWNER` membership before redirecting to the
Control Center. Existing members keep the current workspace and multi-merchant
selection behavior; no Store, Campaign, credential, billing, or team records
are created automatically.

---

## 9. Authentication and Agent Key model

The merchant must first authenticate to VisuTry normally.

VisuTry then provisions an agent/API credential scoped to that Merchant tenant.

Principles:

- tenant-bound;
- revocable;
- rotatable;
- never reveals another merchant’s resources;
- secret shown/copyable through an intentional access surface;
- server-side authorization on every MCP action;
- no trust in merchantId supplied by the agent if the credential already determines tenant identity.

The first version should support scopes equivalent to:

```text
merchant:read
merchant:write
catalog:read
catalog:write
experience:read
experience:write
analytics:read
```

A simplified default onboarding credential can initially receive the approved first-party merchant scopes, but the internal authorization model should not assume every future key is omnipotent.

Billing, owner/member administration and destructive account operations should remain outside the first MCP scope unless explicitly designed later.

---

## 10. Confirmation and safety model

Agent self-service does not mean autonomous execution without boundaries.

Read operations and reversible draft operations may execute directly when authorized.

Actions with meaningful public/commercial consequences should have explicit confirmation semantics.

Examples:

```text
create draft
update draft
preview
catalog validation
analytics query
```

can generally execute directly.

Actions such as:

```text
publish Experience
archive / stop live Experience
bulk deactivate catalog
change merchant public destination
rotate / revoke credentials
```

should require clear user intent and, where appropriate, an explicit confirmation step.

All writes should be attributable to the calling credential / agent session through an audit trail sufficient for support and incident review.

---

## 11. Trial model

Agent-native onboarding should make trial substantially easier.

The product can provision a constrained merchant workspace automatically, for example:

```text
1 Merchant
1 Store
2 Campaigns
catalog item limit
traffic / usage limit
limited sponsored AI usage
trial duration
```

Exact commercial limits remain a pricing decision and should not be hardcoded from this planning document.

The important product behavior is:

```text
Sign up
→ Agent implements
→ Merchant receives a working Experience
→ Real shopper interaction begins
→ Merchant sees actual intent / usage
→ Upgrade decision
```

This is preferable to a trial that simply grants access to an empty Admin and asks the merchant to learn the product.

---

## 12. Admin minimum surface

Agent-native self-service allows VisuTry Admin to remain deliberately compact.

Recommended long-term minimum IA:

```text
Overview
Catalog
Experiences
Analytics
Usage
Agent Access
Billing / Settings
```

### Overview

Answer:

- what is live;
- whether onboarding is complete;
- recent traffic / intent;
- major issues;
- current usage / trial status.

### Catalog

Primarily inspection and correction, not a full merchandising suite.

### Experiences

List Store/Campaign status, preview, public URL, catalog subset and essential configuration.

### Analytics

Canonical headline metrics and simple funnel / intent views. Complex ad-hoc analysis can be delegated to the merchant’s agent.

### Usage

Show plan/trial/entitlement and relevant consumption clearly.

### Agent Access

Show:

- MCP endpoint;
- Skill URL;
- credentials;
- scopes;
- rotate;
- revoke;
- recent agent activity if available.

The Admin should not become a second implementation system that must match every workflow available through MCP.

---

## 13. Commercial and support implications

This model changes the cost structure of merchant adoption.

### Lower onboarding cost

Catalog import, Store setup and first Campaign implementation become self-service workflows executed by the merchant’s own agent.

### Lower support cost

Many configuration and analytics questions can be answered through Skills + MCP instead of human support or increasingly complex Admin help content.

### Wider merchant accessibility

A merchant no longer needs a technical implementation team or deep familiarity with VisuTry to begin.

### Faster trial-to-value

The first objective is not “merchant entered Admin.” It is:

> **merchant has a working Store / Campaign and can see real shopper behavior.**

### More flexible implementation

An agent can combine merchant context, website information, catalog files and VisuTry capabilities without VisuTry having to design a unique wizard for every onboarding variant.

---

## 14. What VisuTry should not build because of this direction

Do not use this direction as an excuse to build a generic agent platform.

Specifically avoid, unless later justified by merchant demand:

- generic workflow builder;
- arbitrary MCP database access;
- full CRM;
- full CMS / Page Builder;
- Shopify replacement;
- generic BI query engine;
- custom agent orchestration platform;
- agent-specific duplicate business rules;
- UI automation of Admin as the integration mechanism.

VisuTry remains eyewear commerce infrastructure.

---

## 15. First implementation scope

The first development program should prove three complete merchant outcomes:

### Outcome A — Launch my Store

Merchant can tell an external agent:

> “Set up my Store.”

The agent can inspect onboarding, import/validate a catalog, create a Store draft, return a preview and publish after approval.

### Outcome B — Create a Campaign

Merchant can tell an external agent:

> “Create a Campaign for shoppers with small faces.”

The agent can inspect catalog, create an appropriate Campaign draft, select frames, preview and publish after approval.

### Outcome C — Explain performance

Merchant can ask:

> “How is my Store/Campaign performing?”

The agent can return canonical traffic, funnel and shopper-intent information without the merchant manually constructing reports.

If these three outcomes work end-to-end, Merchant Self-Service v0.1 is successful.

---

## 16. Implementation phases

### Phase A — Auth and Commerce API boundary

#### Phase A prerequisite — Merchant human identity foundation

Implemented as the prerequisite for Phase A:

- `User.role` remains the VisuTry platform-level role (`USER` / `ADMIN`).
- `MerchantMembership.role` is the tenant-level human role (`OWNER` / `ADMIN`).
- `MerchantMembership` explicitly binds a user to a merchant and supports one user across multiple merchants and multiple users in one merchant.
- `requireMerchantMembership` is the server-side tenant authorization primitive and returns anti-enumeration `404` for missing or unauthorized membership. A global platform admin is not implicitly a merchant owner.
- `createMerchantWithOwner` creates a merchant and its initial owner atomically; existing merchants receive no implicit memberships.
- Future Agent Credential creation must use this merchant-scoped human authorization boundary.

The remaining Phase A work described below was subsequently implemented: merchant-scoped Agent Credentials, scopes, lifecycle, audit identity, and the shared actor/application boundary are now production code.

Establish:

- Merchant-scoped agent credential;
- scopes;
- revoke/rotate;
- shared application services usable by Admin and MCP;
- audit identity for writes;
- no cross-tenant access.

Do not begin by exposing raw Prisma models.

### Phase B — MCP Store/Campaign implementation

Campaign Policy Foundation prerequisite completed; Phase B2 Campaign MCP and
Skill work was gated until this foundation merged.

Phase B2 Campaign MCP tools and the Campaign Creation Skill are implemented on
the shared tenant-scoped Campaign application boundary. Analytics was out of
scope for Phase B itself and was subsequently implemented in Phase C1/C2.

Implement only the tools needed for:

- onboarding status;
- catalog import/validation;
- Store creation;
- Campaign creation;
- preview;
- publish.

Deliver the first Merchant Onboarding Skill and Campaign Creation Skill.

### Phase C — Agent analytics

#### Phase C1 — Merchant Intelligence / Analytics Application Foundation

Phase C1 establishes the deterministic, tenant-safe read boundary for future
Admin and MCP analytics. The application services consume only
server-authoritative `MerchantSession`, `MerchantEvent`, and `MerchantIntent`
records; Google Analytics and client-local counters are not merchant reporting
authority.

The first read model supports a specific Store or Campaign and an optional
UTC time range (default 30 days, maximum 365 days, `from` inclusive and `to`
exclusive):

- visits: valid, unique `MerchantSession` rows for the Experience;
- engaged sessions: a session with frame/product interaction, Try-On start,
  Favorite, or Compare;
- Try-On starts/completions: server events emitted by the Try-On lifecycle;
- frames tried / unique frames tried: completed Try-On events with attributed
  merchant frame IDs;
- Favorites: server-authoritative `MerchantIntent(FAVORITE)` records;
- Compares: server-authoritative `merchant_compare_started` events;
- merchant CTA clicks: unavailable until a dedicated merchant-destination CTA
  event exists; product clicks are not used as a proxy;
- high-intent sessions: deterministic behavior score, threshold 4, with no
  identity contribution.

`buildCampaignScorecard` selects primary metrics for `TRAFFIC`, `INTENT`, and
`LEAD`. Lead gate/opt-in/identified-session metrics remain explicitly
unavailable because no merchant-safe Lead Capture runtime exists yet. Campaign
objective is resolved through `resolveCampaignConversionPolicy`; Store
analytics returns a null Campaign objective. Reference-data provenance is
preserved in every read model.

The shared application services are `getExperienceAnalyticsSummary`,
`getExperienceFunnel`, `getTopFramesByIntent`, and
`getMerchantIntentSummary`. They accept `MerchantActorContext`, require
`analytics:read` for agent credentials, re-check human MerchantMembership, and
always scope the Experience and frame queries by the actor merchant. They
return aggregates only: no raw session IDs, shopper email, photos, IPs, or
identity profiles. The scoped Admin insights API path now consumes
`getExperienceAnalyticsSummary` through a `SYSTEM` control-plane actor; the
legacy unscoped Admin workspace remains available for its existing historical
and catalog detail view.

Phase C2 subsequently exposed these services through the bounded Analytics MCP
surface and Commerce Analyst Skill described below without bypassing this
application boundary.

### Phase C2 — Analytics MCP + Commerce Analyst Skill

Phase C2 exposes five read-only, merchant-scoped analytics tools through the
existing `/api/mcp` endpoint: `get_experience_summary`,
`get_experience_funnel`, `get_top_frames`, `get_intent_summary`, and
`compare_experiences`. Each adapter reuses the Phase C1 application services,
requires `analytics:read`, and returns privacy-safe aggregate read models. The
comparison service composes two to five C1 summaries over the same period and
returns only deterministic metric-specific winners; it never returns a
universal best Campaign verdict.

The public Merchant Skill is available at `/skills/merchant` and covers Store setup, Campaign workflows, and Commerce Analyst read/advice in one agent conversation.
It is read / advise only, requires objective-aware interpretation, distinguishes
observed facts from inference and recommendations, warns about small samples and
reference-data provenance, and makes unavailable lead, identity, revenue,
orders, and ROAS metrics explicit. Analytics reads do not add MerchantOperationAudit
writes and do not mutate Store, Campaign, Catalog, Consumer Credits, or
Sponsored Usage state.

Avoid building a generic query language initially.

### Phase D — First-login onboarding and Trial — IMPLEMENTED CORE

The merchant-facing onboarding surface now contains:

- Agent Key;
- MCP endpoint;
- Skill;
- example instruction;
- trial state;
- Control Center entry.

The initial Merchant control surface is available at `/{locale}/merchant` and
is intentionally small: Overview, Agent Access, and Experiences. It resolves
the authenticated internal `User.id`, requires an OWNER or ADMIN
`MerchantMembership`, and supports a simple multi-merchant switcher without
creating a separate organization or billing model. Agent Access reuses the
existing credential lifecycle APIs, displays the canonical `/api/mcp` endpoint,
links the three public Skills, and reveals a raw secret only in transient UI
state after create or rotate. Experiences expose status, frame count, public
URL, and resolved Campaign policy; Store/Campaign building and analytics remain
Agent workflows rather than duplicate UI builders or dashboards.

### Phase E — Admin simplification

Only after MCP/self-service workflows are proven, remove or avoid building redundant Admin implementation surfaces.

Do not simplify Admin ahead of proven agent workflows if doing so would remove the only reliable operational fallback.

---

## 17. Relationship to existing VisuTry architecture

Agent-native self-service is an access / operating layer over the existing product, not a new product branch.

It must preserve:

```text
Merchant
  ↓
Catalog
  ↓
Store / Campaign Experiences
  ↓
Shopper Runtime
  ↓
Recommendation / Try-On / Compare
  ↓
Intent / Attribution
  ↓
Merchant Intelligence
```

It must also preserve existing contracts around:

- Store vs Campaign semantics;
- Merchant catalog ownership;
- Experience presentation modes;
- Public Discovery / SEO/GEO;
- Sponsored Usage;
- Campaign Conversion Policy;
- consumer entitlement separation;
- reference vs live provenance;
- attribution identity;
- merchant tenant isolation.

MCP is another authorized way to operate those capabilities. It is not a parallel business architecture.

---

## 18. Definition of Done for Merchant Self-Service v0.1

The first version is complete when a new merchant can:

1. register/sign in;
2. obtain a merchant-scoped agent credential;
3. obtain the MCP endpoint and official VisuTry onboarding Skill;
4. give them to a supported external agent;
5. ask the agent to onboard the merchant;
6. import and validate a real merchant catalog through authorized VisuTry capabilities;
7. create a Store draft and receive a preview;
8. create one Campaign draft and receive a preview;
9. explicitly approve publication;
10. publish without VisuTry staff editing production data manually;
11. later ask the agent for Store/Campaign performance and receive canonical metrics;
12. revoke the agent credential from VisuTry;
13. inspect the resulting Store/Campaign and basic status in VisuTry Admin.

Additionally:

- no cross-tenant access is possible;
- no raw database credential is exposed;
- no external agent bypasses VisuTry domain validation;
- no merchant needs a VisuTry employee to perform normal first-time implementation;
- Admin remains a functional fallback/control surface.

---

## 19. Strategic summary

The intended product model is:

```text
Merchant
   ↓
Own AI Agent
   ↓
VisuTry Skill + MCP
   ↓
VisuTry Commerce Capabilities
   ↓
Catalog / Store / Campaign / Intelligence
```

This changes VisuTry 2B accessibility in an important way.

The merchant does not have to become proficient in another SaaS product before receiving value. VisuTry becomes an eyewear commerce capability that the merchant’s existing agent can operate on their behalf.

The strategic principle is:

> **Do not make the VisuTry Admin the implementation bottleneck. Expose safe, opinionated merchant capabilities to the AI agents merchants already use, while keeping VisuTry as the authoritative commerce control plane.**

## Phase A implementation state

Phase A establishes the security boundary required before MCP work:

- `MerchantAgentCredential` is merchant-scoped, stores only a lookup prefix and SHA-256 secret hash of a 32-byte cryptographically random secret, supports `ACTIVE` / `REVOKED`, one-time create/rotate reveal, five active credentials per merchant, and immediate rotation/revocation.
- Supported scopes are `merchant:read`, `merchant:write`, `catalog:read`, `catalog:write`, `experience:read`, `experience:write`, and `analytics:read`.
- OWNER and ADMIN MerchantMembership users manage credentials; global `User.role=ADMIN` does not bypass membership.
- `MerchantActorContext`, `authenticateMerchantAgentCredential`, and `requireAgentScope` provide the shared human/agent/system application boundary. The representative `/api/agent/v1/merchant` read endpoint derives `merchantId` only from the credential.
- `MerchantOperationAudit` records credential lifecycle and future agent writes without raw keys or request payloads. `lastUsedAt` is throttled to a 15-minute update interval.

Phase B MCP transport, onboarding/campaign Skills, production rate limiting,
and Store/Campaign outcome services are implemented. Phase C1/C2 provide the
deterministic analytics application boundary, Analytics MCP tools, Experience
comparison, and Commerce Analyst guidance. Phase D provides the Merchant
Workspace / Control Center and onboarding handoff. Universal OAuth access was
subsequently implemented under `universal-agent-access.md`.

Merchant Self-Service v0.1 is not yet commercially complete because no real
external merchant has completed the full definition-of-done flow. Before an
agent-native external Pilot, add connected OAuth authorization list/revoke UI,
expired OAuth artifact cleanup, database-backed protocol regression coverage,
and the Golden Path for the selected external client. No revenue, CRM,
warehouse, consumer billing, or order attribution behavior is implied.
