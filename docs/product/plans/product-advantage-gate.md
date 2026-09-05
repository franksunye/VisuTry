# Product Advantage Gate

**Status:** Active distribution-validation gate  
**Owner:** Product / Engineering / Growth  
**Last reviewed:** 2026-09-04  
**Scope:** The evidence required before structured merchant outreach, with current focus on genuine Search / GEO / AI-assistant distribution into Store/Campaign shopper experiences.

## 1. Current decision

Structured merchant outreach remains gated until VisuTry proves that its existing Store/Campaign product can receive **genuine external discovery/referral traffic** and that a meaningful subset of that traffic performs useful shopper decision actions.

Technical readiness is now proven. Natural distribution is not yet proven.

### Current gate status — 2026-09-04

| Gate | Status | Current evidence |
| --- | --- | --- |
| Gate A — Shopper Experience & Agent Distribution | **PARTIAL / MEASURING** | Shopper/decision journeys PASS; Traffic Ready T0 PASS; PUBLIC_INDEX Discovery Canary PASS; genuine Agent distribution threshold not yet met |
| Gate B — Merchant Experience Excellence | **PASS** | Existing Store/Campaign/Merchant Workspace/Commerce Intelligence baseline remains accepted |
| Gate C — Agent-Native Merchant Operations | **PASS (core)** | Standards-based MCP/OAuth and Agent-native core remain accepted; second-client interoperability is non-blocking |
| Structured merchant outreach | **GATED** | Unlocks only after Gate A genuine distribution reaches L3 / quantitative bar |

Passive inbound requests may still be received/recorded. This does not authorize structured cold/founder/agency outreach.

## 2. Product hypothesis

The active hypothesis is:

```text
Useful public discovery surface
+ Search / SEO / AEO / GEO / AI discovery
        ↓
genuine external referral / discovery traffic
        ↓
Store / Campaign landing
        ↓
Product exploration
        ↓
Recommendation / Try-On / Compare
        ↓
Product Click / Inquiry / other supported Intent
        ↓
repeatable commerce-distribution evidence
```

VisuTry must prove this on its own legitimate first-party surface before treating natural Agent distribution as a merchant value proposition.

## 3. Two readiness clocks

The experiment intentionally has two distinct clocks.

### Traffic Ready T0

```text
2026-09-03T13:26:22.008Z
```

Proves that incoming traffic can be classified, attributed and reconstructed under the production measurement contract.

Evidence: `docs/ops/traffic-ready-t0-2026-09-03.md`.

### Discovery Canary T0

```text
2026-09-03T16:33:14.812Z
```

Marks when the legitimate first-party `VisuTry Demo` Store/Campaign became PUBLIC_INDEX and production-ready for direct Search/GEO/Agent discovery observation.

Evidence: `docs/ops/discovery-canary-2026-09-03.md`.

Do not reset either clock for ordinary documentation, analytics-console or schema-governance work unless the underlying measurement contract becomes invalid.

## 4. Current Discovery Canary

The current first-party canary is `VisuTry Demo`.

- Store: `https://www.visutry.com/en/store/visutry-demo`
- Campaign: `https://www.visutry.com/en/c/visutry-demo/everyday-fit`
- Classification: `REAL`
- Pilot type: `LIVE`
- Provenance: VisuTry-owned first-party demo; **not** an external merchant/customer/partner claim
- PUBLIC_INDEX: PASS
- sitemap/canonical/robots/structured data/server-rendered discovery content: PASS at T0 verification

The canary exists to test direct discovery. It does **not** prove external merchant adoption.

## 5. Reference Experience policy

The six canonical Reference Campaign Experiences remain separate proof/reference assets.

They remain:

```text
publicly readable
+ noindex, follow
+ excluded from the Experience sitemap
+ excluded from genuine Gate A merchant-distribution proof
```

Real external users may still reach Reference Experiences and their behavior can be useful UX evidence, but Reference provenance means those sessions must not silently become genuine merchant-distribution proof.

Do not make a Reference Experience indexable merely to make Gate A numbers move.

## 6. Gate A evidence layers

Gate A deliberately separates three forms of evidence.

### A. Shopper experience readiness — PASS

Store/Campaign guest journeys must remain healthy on mobile/desktop and preserve the shopper path toward decision/intent.

### B. Technical distribution readiness — PASS

The production contract can classify/exclude traffic and reconstruct supported evidence across:

```text
Source
→ Session
→ Store/Campaign Experience
→ Decision Action
→ Intent
```

Current canonical report:

```bash
npm run report:agent-distribution -- --json
```

The explicit rolling-window variant should use the script's supported `--from` / `--to` UTC arguments.

The report reads two intentionally separate evidence planes:

- bounded first-party Consumer funnel evidence from Axiom;
- durable Store/Campaign `MerchantSession / MerchantEvent / MerchantIntent` evidence from PostgreSQL.

It must not fabricate a per-user join between those planes.

### C. Genuine natural distribution — NOT YET PROVEN

Synthetic/QA/Reference/Internal traffic proves technical behavior only. The remaining gate is genuine external discovery/referral behavior.

## 7. Agent natural-distribution proof levels

| Level | Required proof | Meaning |
| --- | --- | --- |
| L1 — Discovery | At least one genuine known AI-assistant/agent production referral is observed and classified | The channel can discover/refer VisuTry |
| L2 — Repeatability | Genuine Agent referrals recur during the observation window | Not a one-off anomaly |
| L3 — Quality | A meaningful subset reaches Store/Campaign and performs useful shopper decision actions | Traffic has commerce value |

**Structured outreach requires L3 and the quantitative bar below.**

## 8. Initial quantitative outreach bar

Within a rolling **14-day observation window**:

- at least **10 genuine AI-assistant / Agent referral sessions**;
- the observed set must include **ChatGPT / OpenAI** traffic;
- at least **3 referred sessions** must perform one or more meaningful shopper decision actions;
- source → session → Store/Campaign context → supported action must be reproducibly inspectable;
- synthetic, internal QA, Reference, replayed, crawler-only and explicitly tagged test traffic does not count.

This bar proves repeatability/usefulness, not scale.

## 9. Meaningful shopper decision actions

Qualifying evidence includes supported production activity such as:

- meaningful Store/Campaign product exploration;
- Recommendation / Advisor use or completion;
- Virtual Try-On meaningful use/completion;
- Compare meaningful use;
- Product Click;
- supported Inquiry / high-intent action.

Simple page views, crawler requests, bot hits, synthetic attribution probes and empty sessions do not satisfy L3.

## 10. Source / attribution boundary

Current reporting should preserve supported distinctions for known AI/Agent sources and other acquisition classes such as organic search, generic referral, paid, direct, social, Reddit and YouTube.

Reference/Test/Internal exclusion is part of the evidence contract, not a dashboard preference.

Cross-cutting data-plane and analytics ownership is governed by:

`docs/project/observability-and-analytics-contract.md`.

## 11. Public discovery policy

| Surface | Current policy |
| --- | --- |
| Useful canonical Consumer educational/tool/answer surfaces | Index according to reviewed SEO/GEO policy |
| Reference Store/Campaign | `noindex, follow`; not organic merchant proof |
| Legitimate active PUBLIC_INDEX Store/Campaign | May be indexed when active, meaningful, destination-backed and deliberately admitted |
| `VisuTry Demo` Discovery Canary | PUBLIC_INDEX first-party canary; current direct-discovery experiment |
| Paid/context-only Campaign | No automatic indexing; admit only by explicit policy |
| Draft/private/inactive/unpublished | Not publicly discoverable / not in sitemap |

PUBLIC_INDEX is an admission decision, not a default for every Experience.

## 12. Observation operating mode

During the active observation window:

```text
Observe genuine discovery/referral
→ identify source and Experience
→ inspect decision behavior
→ inspect Intent
→ distinguish measurement failure from zero traffic
→ change code only when evidence shows the contract/product is actually broken
```

Do **not** resume broad 2B feature expansion merely because Day 0 is zero.

Allowed work during observation includes:

- production correctness/reliability fixes;
- measurement-contract fixes required to preserve comparability;
- bounded SEO/GEO discovery work that is part of the experiment;
- observability/schema governance that does not corrupt the observation window.

Not justified by this gate alone:

- Merchant Dashboard redesign;
- generalized Campaign Builder;
- Shopify/CRM expansion;
- unrelated Agent UX expansion;
- database/provider/platform migrations;
- changes to Reference indexability;
- artificial traffic generation to make the gate green.

## 13. Day 0 baseline

At Discovery Canary T0:

```text
Genuine Canary sessions: 0
AI/Agent sessions: 0
ChatGPT/OpenAI sessions: 0
Organic Search sessions: 0
Meaningful decision sessions: 0
Intent sessions: 0
```

Zero is a valid clean baseline. It is not a technical failure.

## 14. Exit decision

At the end of the observation window, produce one decision:

```text
PASS
PARTIAL
FAIL
```

and identify the single dominant next bottleneck.

- **PASS:** L3 + quantitative bar met with reproducible evidence.
- **PARTIAL:** some real distribution exists, but repeatability/quality/bar is incomplete.
- **FAIL:** no meaningful genuine distribution evidence, while technical readiness remains valid.

Only then decide whether to intensify discovery work, adjust the experiment, or begin structured merchant outreach.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-25 | Established Agent Natural Distribution as a hard pre-outreach gate. |
| 2026-09-04 | Rebased the gate on completed Traffic Ready T0 and PUBLIC_INDEX Discovery Canary T0; technical readiness is PASS, genuine distribution is now the sole Gate A evidence gap. |
