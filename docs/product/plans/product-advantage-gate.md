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

## Gate B — Merchant Experience Excellence

Business, Store, Campaign, Commerce Intelligence, Merchant Workspace, and
relevant Admin surfaces must meet a professional brand / ecommerce / agency
standard. A real shopper must be able to enter a current, branded Store or
Campaign, understand the catalog and context, use recommendation / try-on /
compare, and reach a measurable product or inquiry intent.

Gate evidence requires current desktop and mobile inspection, current screenshots
and claims, working loading/error/empty states, and at least one real-merchant
catalog and declared-traffic acceptance run. Reference or simulation evidence is
not customer proof.

## Gate C — Agent-Native Merchant Operations

Codex and Cursor must be able to operate the commercial Golden Path with
merchant authorization and no hidden manual database work:

```text
authorization → workspace inspection → catalog intake / validation
→ Store or Campaign draft → configuration → preview → merchant-readable summary
→ explicit approval → publish → traffic / analytics inspection → result summary
```

Consequential actions must preserve tenant isolation, scopes, explicit approval,
preview-before-publish, idempotency, safe credential handling, and auditability.
The Golden Path must be proven against the current implementation; historical
client evidence is not sufficient after a material code change.

## Evidence rule

Implementation existence is not a passing result. Each gate needs an evidence
record naming the route, component, service, event, tool, data source, test, or
browser run that proves the acceptance criterion. Until A, B, and C are all
`PASS`, the Outreach Gate remains `GATED`.

The current audit and remaining work are recorded in
`docs/product/audits/product-advantage-gate-baseline-2026-08-24.md`.
