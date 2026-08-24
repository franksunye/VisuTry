# Product Advantage Gate

**Status:** Active pre-outreach source of truth
**Last reviewed:** 2026-08-24

Structured merchant outreach is gated until all three gates pass with current,
reproducible evidence. Older documents that say “outreach next” describe a
previous sequence and do not override this gate.

## Product Decision — Agent Natural Distribution Is a Hard Gate

VisuTry will **not** begin structured merchant outreach before it proves that its
own Consumer product can attract genuine AI-assistant / agent referral traffic
and convert at least part of that traffic into meaningful eyewear decision
behavior.

This is a deliberate product and go-to-market decision, not an analytics
preference.

The hypothesis being tested is:

```text
Excellent Consumer Experience
+ SEO / AEO / GEO
+ useful public eyewear knowledge and decision surfaces
+ external distribution / promotion
        ↓
AI assistants discover, understand, cite, recommend, or link to VisuTry
        ↓
genuine Agent / AI-assistant referral traffic
        ↓
meaningful eyewear decision behavior
        ↓
proven natural distribution leverage
        ↓
structured Merchant Outreach
```

The company must prove this hypothesis on itself before using Agent distribution
as part of the merchant value proposition.

Technical readiness alone is not enough. Attribution code, structured data,
indexability, sitemap coverage, and synthetic tests can prove that VisuTry is
**capable of measuring** Agent traffic; they cannot prove that the natural
Agent-distribution channel exists.

Therefore:

> **No structured merchant outreach begins while Agent Natural Distribution remains unproven.**

Passive inbound Pilot requests may continue to be received and recorded. This
exception does not authorize outbound target lists, cold outreach, agency
prospecting, or founder-led structured merchant acquisition.

## Gate A — Consumer Distribution & Proof

VisuTry Consumer must be both a high-quality eyewear decision journey and a
measurable organic / SEO / AEO / GEO / agent-referral distribution engine.

Required journey:

```text
Face Shape Detector → Face Analysis / Glasses Advisor → Virtual Try-On → Frame Compare → intent
```

The journey must preserve useful state, expose the next relevant action, work on
desktop and mobile, and record the minimum funnel:

```text
Discovery → Visit → Useful Decision Interaction → Recommendation / Try-On / Compare → Intent
```

Required proof includes canonical and indexability checks, structured data,
sitemap behavior, answer-oriented entity clarity, and separately attributable
direct, organic, social, paid, generic-referral, and known AI-agent sources.

Gate A reports two separate outcomes:

- **Technical readiness:** attribution parsing, source persistence, session
  reporting, Consumer journey events, canonical metadata, and intended sitemap
  behavior are implemented and covered by reproducible tests.
- **Real distribution evidence:** genuine production AI-assistant / agent
  referrals occur repeatedly, are classified distinctly, persist into VisuTry
  sessions, and produce meaningful Consumer decision actions. Evidence must be
  inspectable from a durable report/dashboard/query without reconstructing raw
  logs.

Synthetic requests may validate the technical contract, but are labelled TEST
and never count as real distribution proof. Technical readiness may pass while
real distribution evidence remains `PARTIAL`; in that case **Gate A remains
PARTIAL and Outreach remains GATED**.

### Agent Natural Distribution Proof Levels

The active evidence model is:

| Level | Required proof | Meaning |
| --- | --- | --- |
| **L1 — Discovery** | At least one genuine production referral from a known AI assistant / agent source is observed and classified separately from generic referral. | VisuTry can be discovered and referred by the channel. |
| **L2 — Repeatability** | Genuine Agent referrals recur across the observation window rather than appearing as a single isolated visit. | The channel is not merely a one-off anomaly. |
| **L3 — Quality** | A meaningful subset of genuine referred sessions performs a useful eyewear decision action such as Detector completion, Advisor interaction, Try-On, or Compare. | Agent traffic has product value rather than being empty referral volume. |

**Outreach requires L3.** L1 or L2 alone is useful evidence but does not unlock
structured merchant outreach.

### Initial Quantitative Outreach Bar

Until Product explicitly changes this threshold based on observed production
data, Gate A real distribution evidence requires, within a rolling **14-day
observation window**:

- at least **10 genuine AI-assistant / agent referral sessions**;
- the observed set must include **ChatGPT / OpenAI** traffic;
- at least **3 referred sessions** must perform one or more meaningful Consumer
  decision actions;
- source → session → decision action must be reproducibly inspectable;
- synthetic, internal QA, replayed, or explicitly tagged test traffic is
  excluded.

The threshold is intentionally modest: it is designed to prove a repeatable
channel and useful behavior, not scale. Product may raise or revise the bar
later, but may not silently replace it with “technical readiness.”

### What Counts as a Meaningful Decision Action

For the initial Gate A proof, qualifying actions include supported production
evidence for one or more of:

- Face Shape Detector completion;
- Face Analysis / Glasses Advisor meaningful interaction or completion;
- Virtual Try-On meaningful use / completion;
- Frame Compare meaningful use / completion.

Simple page views, crawler hits, consent callbacks, bot traffic, synthetic source
tests, or sessions with no useful decision interaction do not satisfy L3.

### Gate A public discovery policy

Indexability is determined by the shared Store/Campaign visibility policy, not
by page count:

| Surface | Pre-outreach policy |
| --- | --- |
| Consumer product/tool and reviewed answer pages | Index when canonical, useful, and included by the reviewed Consumer SEO/GEO sitemap policy. |
| Reference Store/Campaign | Publicly readable for proof, but `noindex, follow`; excluded from the dynamic Experience sitemap. Reference proof is not customer or organic-traffic proof. |
| Active live Merchant Store/Campaign | Index only when active, meaningful, merchant/product-destination-backed, and admitted as `PUBLIC_INDEX`; otherwise `noindex, follow`. |
| Paid/context Campaign landing page | Not automatically indexable. Keep `noindex, follow` unless it is deliberately admitted to the same organic discovery policy. |
| Draft, private, inactive, or unpublished Experience | Not publicly discoverable and excluded from sitemap (`noindex, nofollow` or private response). |

The technical acceptance is that implementation matches this policy. A missing
dynamic sitemap entry blocks Gate A only when the surface is intentionally
admitted as organic `PUBLIC_INDEX`; private or paid-only surfaces must not be
added merely to make the gate green.

### Gate A Operating Mode — Agent Distribution Growth Loop

Until L3 is proven, the primary Growth / Product loop is:

```text
Measure current discovery and referrals
→ identify high-intent eyewear questions / surfaces
→ improve Consumer UX and answer quality
→ improve SEO / AEO / GEO / structured discoverability
→ publish useful visual/editorial assets
→ distribute and promote through appropriate external channels
→ observe real Search / Agent discovery and referral behavior
→ inspect referred-session decision behavior
→ repeat
```

This is an active optimization loop, not passive waiting for ChatGPT traffic.

Appropriate pre-outreach work includes:

- Consumer experience improvement where it increases usefulness, continuity, or
  conversion of discovery traffic;
- SEO / AEO / GEO technical and content improvements grounded in real user
  questions and product capability;
- Visual SEO assets that answer eyewear questions and route to useful product
  experiences;
- external promotion and community participation such as Reddit / YouTube where
  work is useful, non-spammy, attributable, and aligned with the current growth
  plan;
- durable reporting that separates genuine AI-assistant referrals from Search,
  social, paid, generic referral, direct, and test traffic;
- continuous analysis of which public pages, questions, entities, and product
  paths are actually being discovered.

The loop must optimize for **qualified decision traffic**, not impressions,
content volume, backlinks, or referral counts in isolation.

## Gate B — Merchant Experience Excellence

Business, Store, Campaign, Commerce Intelligence, Merchant Workspace, and
relevant Admin surfaces must meet a professional brand / ecommerce / agency
standard. A real shopper must be able to enter a current, branded Store or
Campaign, understand the catalog and context, use recommendation / try-on /
compare, and reach a measurable product or inquiry intent.

Gate evidence requires current desktop and mobile inspection, current screenshots
and claims, working loading/error/empty states, and a production-valid canonical
Store/Campaign path. Reference, simulation, and controlled-fixture evidence are
valid pre-outreach proof of the product bar; they must be clearly labeled and
must not be presented as customer proof. Real-merchant catalog, real traffic,
and real-merchant acceptance are deliberately not Gate B criteria.

### Gate B pre-outreach PASS rule

Gate B passes when the current Business / Reference Store / Campaign shopper
journey and authenticated Merchant Workspace are browser-proven at the required
brand and agency bar, populated merchant-readable Commerce Intelligence is
visible, and the same production `MerchantControlCenter` /
`MerchantCommerceIntelligence` contract has deterministic component coverage for
the empty state. A second authenticated empty tenant is not required when the
empty state is covered without bypassing auth or tenancy. Any remaining empty
fixture browser capture is P1 evidence hardening, not a Gate B P0.

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
Keys and DB-backed OAuth access tokens, expose `tools/list`, preserve tenant
and scope checks, and provide Store explicit-approval publish plus aggregate
Commerce Intelligence reads. Agent-Native Core passes when this server contract
and a current-SHA Codex run pass.

### Cross-Client Interoperability

Cursor is the active second-client compatibility check, but an external Cursor
desktop callback-listener failure is not a VisuTry Gate C P0 when:

1. OAuth discovery, PKCE, resource/audience, scopes, and fixed supported
   redirect URIs are standards-compliant;
2. the VisuTry consent flow returns the authorization code to the registered
   callback; and
3. the observed failure is in the Cursor/client environment before MCP
   authentication or `tools/list`.

In that case the pre-outreach verdict is `PASS` for Agent-Native Core and
standards-based MCP/OAuth, with Cursor real-client compatibility recorded as a
P1 interoperability item. Repository configuration alone cannot claim Cursor
execution PASS, and the server must not widen redirect validation to arbitrary
custom schemes.

## Outreach policy decision

Product has selected a **Hard Distribution Gate** for the current pre-outreach
sequence. Structured outreach stays `GATED` until Gate A real distribution
evidence (L3), Gate B, and Gate C pass. This preserves a clean test of the
strategic hypothesis that VisuTry can create qualified Agent distribution for
itself before using that capability in merchant outreach.

The tradeoff is a risk of waiting for a channel that may grow slowly. The
rolling 14-day evidence window, weekly growth loop, and explicit evidence log
bound that risk operationally without replacing the L3 threshold with
technical readiness or synthetic traffic. A future Product decision may adopt
a Soft Distribution Gate, but that would be a deliberate source-of-truth
change, not an implicit exception.

## Outreach Readiness Decision

The Outreach Gate is `READY` only when all of the following are true:

1. **Gate A PASS**, including L3 Agent Natural Distribution evidence at the
   current quantitative bar;
2. **Gate B PASS** at the professional brand / ecommerce / agency experience
   bar with current reproducible evidence;
3. **Gate C PASS** for the active Agent-Native acceptance contract;
4. Product explicitly records the transition from `GATED` to `READY`.

There is no soft-distribution exception. A technically ready but unproven Agent
channel does not unlock outreach.

## Evidence rule

Implementation existence is not a passing result. Each gate needs an evidence
record naming the route, component, service, event, tool, data source, test, or
browser run that proves the acceptance criterion. Until A, B, and C are all
`PASS`, the Outreach Gate remains `GATED`.

The current audit and remaining work are recorded in
`docs/product/audits/product-advantage-gate-baseline-2026-08-24.md`.
