# Product Advantage Gate

**Status:** Active pre-outreach source of truth
**Last reviewed:** 2026-08-24

Structured merchant outreach is gated until all three gates pass with current,
reproducible evidence. Older documents that say “outreach next” describe a
previous sequence and do not override this gate.

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
  reporting, consumer journey events, canonical metadata, and intended sitemap
  behavior are implemented and covered by reproducible tests.
- **Real distribution evidence:** at least one genuine production AI-assistant
  or agent referral is classified distinctly (not generic referral), persists
  into a VisuTry session, and performs one meaningful decision action such as a
  Detector result, Advisor interaction, Try-On, or Compare. The evidence must
  be inspectable from a report or dashboard without reconstructing raw logs.

Synthetic requests may validate the technical contract, but are labelled TEST
and never count as real distribution proof. If no genuine production event is
available, technical readiness may pass while real distribution evidence stays
`PARTIAL`.

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

## Outreach policy decision point

The current active contract remains a hard gate: structured outreach stays
`GATED` until Gate A real distribution evidence, Gate B, and Gate C pass. A
bounded product decision is still required on whether genuine Agent traffic
should instead become a post-launch evidence milestone. The recommended option
is a **Soft Distribution Gate**: require Gate A technical and reporting
readiness before outreach, then measure genuine Agent traffic during controlled
outreach. This avoids waiting indefinitely for a channel whose evidence is
itself expected to grow through controlled distribution, while preserving the
strategic hypothesis as a tracked milestone. This recommendation does not
change the active hard-gate status without explicit Product approval.

## Evidence rule

Implementation existence is not a passing result. Each gate needs an evidence
record naming the route, component, service, event, tool, data source, test, or
browser run that proves the acceptance criterion. Until A, B, and C are all
`PASS`, the Outreach Gate remains `GATED`.

The current audit and remaining work are recorded in
`docs/product/audits/product-advantage-gate-baseline-2026-08-24.md`.
