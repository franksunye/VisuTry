# Product Advantage Gate

**Status:** Active pre-outreach source of truth  
**Last reviewed:** 2026-08-25

Structured merchant outreach is gated until all three gates pass with current,
reproducible evidence. Older documents that say “outreach next” describe a
previous sequence and do not override this gate.

## Current Gate Status — 2026-08-25

- **Gate A — Shopper Experience & Agent Distribution:** A1 PASS, A2 PASS, A3
  PASS, A4 **NOT PROVEN**; overall **PARTIAL**.
- **Gate B — Merchant Experience Excellence:** **PASS**, including the
  shopper-facing Store/Campaign product, the Agent-first Merchant Workspace,
  and merchant-readable Commerce Intelligence.
- **Gate C — Agent-Native Merchant Operations:** **PASS** for Agent-Native Core
  and standards-based MCP/OAuth; Cursor interoperability remains non-blocking
  P1 external validation.
- **Outreach:** **GATED**. Exact blocker: genuine Agent referral distribution
  producing meaningful shopper behavior.

Real Merchant catalog, real traffic, and real acceptance evidence remain the
separate first post-outreach Merchant Validation gate.

## Product Decision — Agent Natural Distribution Is a Hard Gate

VisuTry will **not** begin structured merchant outreach before it proves that its
B2B product can attract genuine AI-assistant / agent referral traffic into the
consumer-facing Store / Campaign experience and convert at least part of that
traffic into meaningful eyewear shopping decision behavior.

This is a deliberate product and go-to-market decision, not an analytics
preference.

The hypothesis being tested is:

```text
Excellent Store / Campaign Shopper Landing Experience
+ SEO / AEO / GEO
+ useful public eyewear knowledge and discovery surfaces
+ external distribution / promotion
        ↓
AI assistants discover, understand, cite, recommend, or link to VisuTry Experiences
        ↓
genuine Agent / AI-assistant referral traffic
        ↓
Store / Campaign Landing
        ↓
Product Exploration
        ↓
Recommendation / Try-On / Compare
        ↓
Product / Inquiry Intent
        ↓
proven natural distribution leverage
        ↓
structured Merchant Outreach
```

The company must prove this hypothesis on its own product before using Agent
distribution as part of the merchant value proposition.

Technical readiness alone is not enough. Attribution code, structured data,
indexability, sitemap coverage, and synthetic tests can prove that VisuTry is
**capable of measuring** Agent traffic; they cannot prove that the natural
Agent-distribution channel exists.

Therefore:

> **No structured merchant outreach begins while Agent Natural Distribution remains unproven.**

Passive inbound Pilot requests may continue to be received and recorded. This
exception does not authorize outbound target lists, cold outreach, agency
prospecting, or founder-led structured merchant acquisition.

## Terminology — B2B Consumer-Facing Experience

Within the Product Advantage Gate, “2C experience” means the **consumer-facing
experience delivered inside the B2B Store / Campaign product**.

The primary product surface is the **Store or Campaign landing experience** that
a shopper reaches from Search, an AI assistant, paid media, social, QR, referral,
or another merchant traffic source.

The hierarchy is:

```text
PRIMARY
Store / Campaign Landing Experience

SUPPORTING CONVERSION CAPABILITIES
Recommendation / Advisor
Virtual Try-On
Compare
Face / fit intelligence where relevant

SUPPORTING ACQUISITION SURFACES
VisuTry standalone Consumer tools and educational / SEO / Visual SEO content
```

The standalone VisuTry Consumer product remains useful for acquisition,
experimentation, and reusable decision technology, but it is **not the primary
Gate A shopper-experience target**.

Gate A must not drift into optimizing Detector / Advisor / Try-On / Compare as
isolated consumer tools while neglecting the Store / Campaign landing experience
that merchants and their shoppers actually receive.

## Gate A — Shopper Experience & Agent Distribution

Gate A evaluates whether VisuTry can deliver a high-quality **B2B
consumer-facing shopping experience** and generate measurable natural
distribution into that experience.

The required shopper journey is:

```text
Discovery / Agent Referral
→ Store or Campaign Landing
→ Product Exploration
→ Recommendation / Try-On / Compare
→ Product / Inquiry Intent
```

### A1 — Landing Experience Excellence

Store / Campaign Landing is the primary Gate A product surface.

It must:

- feel like a credible brand / commerce landing experience, not a SaaS demo or
  collection of AI tools;
- communicate merchant / campaign identity and the shopper value proposition
  immediately;
- establish product interest through strong product imagery, product context,
  selection, merchandising, and campaign narrative;
- present an obvious next action without overwhelming the shopper;
- work cleanly on mobile and desktop;
- preserve source / campaign context through downstream actions;
- return the shopper naturally to product selection and intent after using an AI
  decision capability;
- support appropriate loading, empty, error, unavailable, and fallback states;
- avoid stale UI, mismatched marketing screenshots, internal/admin language, or
  product claims that are not supported by the current runtime.

Campaign pages must have campaign-specific narrative, selection, and context;
they must not be a Store shell with superficial copy changes.

### A2 — Embedded Decision Experience

Recommendation, Advisor, Try-On, Compare, and relevant face / fit intelligence
are supporting conversion capabilities inside or directly connected to the
Store / Campaign landing journey.

They must:

- be entered from a clear shopper context;
- preserve the merchant, campaign, selected-product, and traffic context where
  applicable;
- reduce uncertainty about which frame to consider rather than becoming a
  separate product journey;
- preserve useful shopper state and photo handoff where supported;
- expose a clear next action after the result;
- return the shopper toward product exploration, product click, inquiry, or
  another measurable intent;
- work at the same visual / interaction quality bar as the landing experience.

The success condition is not “the AI tool works.” The success condition is that
it improves the **shopping decision experience**.

### A3 — Agent Natural Distribution Proof

Gate A must prove that genuine AI-assistant / Agent traffic reaches VisuTry and
produces meaningful shopper behavior.

The measured funnel is:

```text
Discovery / Referral
→ Store / Campaign Visit
→ Product Exploration
→ Decision Capability Use
→ Product / Inquiry Intent
```

Required proof includes canonical and intended indexability behavior, structured
data, sitemap policy, answer-oriented entity clarity, and separately
attributable direct, organic, social, paid, generic-referral, and known AI-agent
sources.

Gate A reports separate outcomes:

- **Shopper experience readiness:** Store / Campaign landing and embedded
  decision flows meet the intended professional shopper bar on desktop and
  mobile.
- **Technical distribution readiness:** attribution parsing, source persistence,
  session reporting, intended public discovery policy, and decision / intent
  events are implemented and reproducibly inspectable.
- **Real distribution evidence:** genuine production AI-assistant / agent
  referrals recur, are classified distinctly, persist into VisuTry Experiences,
  and produce meaningful shopper decision actions.

Synthetic requests may validate the technical contract, but are labelled TEST
and never count as real distribution proof. Technical readiness may pass while
real distribution evidence remains `PARTIAL`; in that case **Gate A remains
PARTIAL and Outreach remains GATED**.

The minimum read-only reporting contract is the `report:agent-distribution`
command. For an explicit UTC date range it reads the first-party Consumer
event stream and the durable MerchantSession / MerchantEvent / MerchantIntent
Store-Campaign stream, reports the supported source and action metrics, excludes
Reference/Internal/test traffic, and states when the two streams cannot be
joined. A query-capable Axiom credential is required for the Consumer stream;
an ingest-only credential or short Vercel log retention is not evidence.

### Agent Natural Distribution Proof Levels

| Level | Required proof | Meaning |
| --- | --- | --- |
| **L1 — Discovery** | At least one genuine production referral from a known AI assistant / agent source is observed and classified separately from generic referral. | VisuTry can be discovered and referred by the channel. |
| **L2 — Repeatability** | Genuine Agent referrals recur across the observation window rather than appearing as a single isolated visit. | The channel is not merely a one-off anomaly. |
| **L3 — Quality** | A meaningful subset of genuine referred sessions reaches a Store / Campaign experience and performs a useful shopping decision action such as product exploration, Recommendation, Try-On, Compare, Product Click, or Inquiry. | Agent traffic has commerce value rather than being empty referral volume. |

**Outreach requires L3.** L1 or L2 alone is useful evidence but does not unlock
structured merchant outreach.

### Initial Quantitative Outreach Bar

Until Product explicitly changes this threshold based on observed production
data, Gate A real distribution evidence requires, within a rolling **14-day
observation window**:

- at least **10 genuine AI-assistant / agent referral sessions**;
- the observed set must include **ChatGPT / OpenAI** traffic;
- at least **3 referred sessions** must perform one or more meaningful shopper
  decision actions;
- source → session → Store / Campaign context → decision action must be
  reproducibly inspectable where technically supported;
- synthetic, internal QA, replayed, crawler-only, or explicitly tagged test
  traffic is excluded.

The threshold proves repeatability and usefulness, not scale. Product may raise
or revise the bar later, but may not silently replace it with “technical
readiness.”

### What Counts as a Meaningful Shopper Decision Action

Qualifying actions include supported production evidence for one or more of:

- meaningful Store / Campaign product exploration;
- Recommendation / Advisor interaction or completion;
- Virtual Try-On meaningful use / completion;
- Compare meaningful use / completion;
- Product Click;
- supported Inquiry / High-Intent action.

Face Shape Detector / standalone Consumer-tool activity may support acquisition
analysis, but it does not replace Store / Campaign shopper evidence when
assessing the B2B consumer-facing experience.

Simple page views, crawler hits, consent callbacks, bot traffic, synthetic source
tests, or sessions with no useful shopping interaction do not satisfy L3.

### Gate A Public Discovery Policy

Indexability is determined by the shared Store / Campaign visibility policy,
not by page count:

| Surface | Pre-outreach policy |
| --- | --- |
| Consumer educational / answer / tool surfaces | Index when canonical, useful, and included by the reviewed SEO/GEO policy; these are supporting acquisition surfaces. |
| Reference Store / Campaign | Publicly readable for proof, but `noindex, follow`; excluded from the dynamic Experience sitemap. Reference proof is not customer or organic-traffic proof. |
| Active live Merchant Store / Campaign | Index only when active, meaningful, merchant/product-destination-backed, and deliberately admitted as `PUBLIC_INDEX`; otherwise `noindex, follow`. |
| Paid/context Campaign landing page | Not automatically indexable. Keep `noindex, follow` unless deliberately admitted to the organic discovery policy. |
| Draft, private, inactive, or unpublished Experience | Not publicly discoverable and excluded from sitemap (`noindex, nofollow` or private response). |

A missing dynamic sitemap entry blocks Gate A only when the surface is
intentionally admitted as organic `PUBLIC_INDEX`. Private or paid-only surfaces
must not be indexed merely to make the gate green.

### Gate A Operating Mode — Agent Distribution Growth Loop

Until L3 is proven, the primary Growth / Product loop is:

```text
Measure discovery and referrals
→ identify high-value shopper landing / campaign / product-intent surfaces
→ improve Store / Campaign Landing Experience
→ improve embedded Recommendation / Try-On / Compare conversion
→ improve SEO / AEO / GEO / structured discoverability
→ publish useful visual / editorial / answer assets
→ distribute through appropriate external channels
→ observe real Search / Agent discovery and referral behavior
→ inspect landing → decision → intent behavior
→ repeat
```

This is an active optimization loop, not passive waiting for ChatGPT traffic.

Appropriate pre-outreach work includes:

- Store / Campaign shopper landing improvement where it increases trust,
  product interest, clarity, continuity, or conversion;
- embedded decision-tool improvement where it strengthens the commerce journey;
- SEO / AEO / GEO technical and content improvements grounded in real shopper
  questions and actual product capability;
- Visual SEO assets that answer eyewear questions and route into useful
  Store / Campaign or product decision experiences;
- external promotion and community participation such as Reddit / YouTube when
  useful, non-spammy, attributable, and aligned with the current growth plan;
- durable reporting that separates genuine AI-assistant referrals from Search,
  social, paid, generic referral, direct, and test traffic;
- continuous analysis of which pages, campaigns, products, questions, and
  Experiences are actually being discovered.

The loop must optimize for **qualified shopper decision traffic**, not
impressions, content volume, backlinks, or referral counts in isolation.

## Gate B — Merchant Experience Excellence

Gate B includes the production readiness of the complete merchant product:

- the shopper-facing Store / Campaign Experience that a merchant would send
  traffic into;
- the merchant / brand / agency-facing Business Website, Merchant Workspace,
  Commerce Intelligence, operating controls, and relevant Admin surfaces.

These surfaces must meet a professional brand / ecommerce / agency standard,
explain the product accurately, and let an authorized merchant understand and
operate Store / Campaign capabilities without developer intervention in normal
supported flows.

Gate A owns the detailed shopper-experience verdict for the Store/Campaign
journey. Gate B uses the same current Store/Campaign product as evidence that
the merchant offering is professional and production-ready; this boundary
avoids treating either gate as satisfied by implementation existence alone.

Reference, simulation, and controlled-fixture evidence are valid pre-outreach
proof of the product bar when clearly labeled. Real-merchant catalog, real
traffic, and real-merchant acceptance are deliberately not Gate B criteria.

### Gate B Pre-Outreach PASS Rule

Gate B passes when the Business / merchant-facing product and authenticated
Merchant Workspace are browser-proven at the required brand and agency bar,
populated merchant-readable Commerce Intelligence is visible, and the same
production `MerchantControlCenter` / `MerchantCommerceIntelligence` contract has
deterministic component coverage for the empty state. A second authenticated
empty tenant is not required when the empty state is covered without bypassing
auth or tenancy. Remaining empty-fixture browser capture is P1 evidence
hardening, not a Gate B P0.

## Post-Outreach Merchant Validation

After Gate A, Gate B, and Gate C pass, and only after controlled outreach begins,
the first Merchant Validation gate is:

```text
First Real Merchant → own catalog → declared traffic source
→ live shopper activity → intent review → continuation / pricing evidence
```

This post-outreach validation must remain separate from the pre-outreach
Product Advantage Gate. It is not required to declare Outreach Ready and is not
evidence that can be backfilled into Gate B.

## Gate C — Agent-Native Merchant Operations

### Agent-Native Core

The pre-outreach Gate C core is the standards-based, tenant-safe merchant
operation itself. Codex current-SHA execution must prove the commercial Golden
Path with merchant authorization and no hidden manual database work:

```text
authorization → workspace inspection → catalog intake / validation
→ Store or Campaign draft → configuration → preview → merchant-readable summary
→ explicit approval → publish → traffic / analytics inspection → result summary
```

Consequential actions must preserve tenant isolation, scopes, explicit approval,
preview-before-publish, idempotency, safe credential handling, and auditability.
The Golden Path must be proven against the current implementation; historical
client evidence is not sufficient after a material code change.

The current Cloudflare MCP surface must authenticate both `vt_live_*` Agent
Keys and DB-backed OAuth access tokens, expose `tools/list`, preserve tenant and
scope checks, and provide Store explicit-approval publish plus aggregate
Commerce Intelligence reads. Agent-Native Core passes when this server contract
and a current-SHA Codex run pass.

### Cross-Client Interoperability

Cursor is the active second-client compatibility check, but an external Cursor
desktop callback-listener failure is not a VisuTry Gate C P0 when:

1. OAuth discovery, PKCE, resource/audience, scopes, and fixed supported redirect
   URIs are standards-compliant;
2. the VisuTry consent flow returns the authorization code to the registered
   callback; and
3. the observed failure is in the Cursor/client environment before MCP
   authentication or `tools/list`.

In that case the pre-outreach verdict is `PASS` for Agent-Native Core and
standards-based MCP/OAuth, with Cursor real-client compatibility recorded as a
P1 interoperability item. Repository configuration alone cannot claim Cursor
execution PASS, and the server must not widen redirect validation to arbitrary
custom schemes.

## Outreach Policy Decision

Product has selected a **Hard Distribution Gate** for the current pre-outreach
sequence. Structured outreach stays `GATED` until Gate A real distribution
evidence (L3), Gate B, and Gate C pass.

The strategic proposition being tested is specifically that VisuTry can create
qualified Agent distribution into a **merchant-grade shopper Experience**, not
merely into its standalone Consumer tools.

## Outreach Readiness Decision

The Outreach Gate is `READY` only when all of the following are true:

1. **Gate A PASS**, including Store / Campaign shopper-experience readiness and
   L3 Agent Natural Distribution evidence at the current quantitative bar;
2. **Gate B PASS** for the merchant / brand / agency-facing experience;
3. **Gate C PASS** for the active Agent-Native acceptance contract;
4. Product explicitly records the transition from `GATED` to `READY`.

There is no soft-distribution exception. A technically ready but unproven Agent
channel does not unlock outreach.

## Evidence Rule

Implementation existence is not a passing result. Each gate needs an evidence
record naming the route, component, service, event, tool, data source, test, or
browser run that proves the acceptance criterion.

When recording evidence, use the correct experience boundary:

- **Gate A:** shopper-facing Store / Campaign landing and embedded decision
  experience + natural distribution;
- **Gate B:** merchant / brand / agency-facing Business / Workspace /
  Intelligence experience;
- **Gate C:** agent-native merchant operation.

The current audit and remaining work are recorded in
`docs/product/audits/product-advantage-gate-baseline-2026-08-24.md`.
