# Gate A Shopper Experience Industry Benchmark

**Status:** Active Gate A acceptance contract  
**Owner:** Product  
**Applies to:** B2B consumer-facing Store / Campaign shopper experience  
**Authority:** Used together with `docs/product/plans/product-advantage-gate.md`

## 1. Purpose

Gate A must not pass because VisuTry internally judges the experience to be "good enough". The shopper-facing Store / Campaign experience is evaluated against observable eyewear ecommerce patterns and against real Agent-referral behavior.

The benchmark is deliberately scoped to the part VisuTry sells and controls:

```text
Discovery / Agent Referral
→ Store or Campaign Landing
→ Product Exploration
→ Recommendation / Try-On / Compare
→ Product / Inquiry Intent
```

Store / Campaign Landing is the primary product surface. Recommendation, Try-On, Compare, face / fit intelligence, and related AI capabilities are supporting decision and conversion modules. VisuTry standalone Consumer tools may support acquisition and reuse shared technology, but they are not the primary Gate A shopper-experience target.

The goal is not to reproduce the complete ecommerce stack of a large eyewear retailer. The target is vertical superiority in the narrower surface VisuTry owns: **landing experience + AI decision layer + Agent traffic handoff**.

## 2. External Benchmark Set

The current benchmark set uses public, inspectable patterns from mature eyewear commerce and current LLM-commerce research.

### Warby Parker — commerce-first AI assistance

Observed public patterns:

- Product shopping remains the primary commerce experience.
- Advisor is framed as a shopping assistant: face scan / fit capture → virtual try-on → personalized frame recommendations.
- Virtual Try-On is presented as a way to evaluate frames, not as a detached AI demo.
- Product discovery, try-on, recommendation, store/service actions, and purchase-oriented navigation coexist in one shopper journey.

Gate implication:

> VisuTry's AI features must strengthen product discovery and decision confidence inside the shopper journey. They must not replace the landing page's commerce narrative or lead the user into an isolated tool dead end.

Public references reviewed 2026-08-25:
- https://www.warbyparker.com/
- https://www.warbyparker.com/advisor
- https://www.warbyparker.com/home-try-on

### Zenni Optical — try-on connected to fit and order

Observed public patterns:

- Virtual Try-On starts from eyewear shopping intent.
- The public flow explicitly connects "Try Frames Instantly" → "Confirm Your Fit" → "Customize & Order".
- VTO is therefore part of a decision-and-order sequence, not the end state.

Gate implication:

> A VisuTry shopper who uses Try-On / Compare / Recommendation must retain product context and have a clear next action toward product exploration, product destination, inquiry, or another measurable intent.

Public reference reviewed 2026-08-25:
- https://www.zennioptical.com/tryon

### Current LLM-commerce evidence — Agent traffic is pre-qualified, not generic browsing traffic

A 2026 Marketing Science study of organic LLM referrals analyzed 12 months of first-party ecommerce data from 973 websites, including more than 50,000 ChatGPT-referred transactions. It found that organic LLM traffic already exhibits commercially meaningful behavior, with conversion and revenue-per-session above paid social in the study while still below several mature traditional channels.

Gate implication:

> Agent-referred shoppers should be treated as pre-qualified decision traffic. The Store / Campaign landing experience must preserve the referred context, confirm relevance quickly, expose products clearly, and make the next decision action obvious.

Research reference reviewed 2026-08-25:
- Marketing Science, "ChatGPT Referrals to E-Commerce Websites: How Do LLMs Compare Against Traditional Channels?", DOI 10.1287/mksc.2025.0489

These benchmarks are evidence inputs, not claims that every benchmark company implements every VisuTry capability or that their metrics are directly transferable to VisuTry.

## 3. Gate A Benchmark Matrix

| Layer | Industry benchmark | VisuTry PASS standard |
| --- | --- | --- |
| **A1 — Landing Experience Excellence** | Mature eyewear ecommerce is commerce-first: brand, products, shopping context, trust, and clear next actions are immediately legible. | Store / Campaign Landing has no material P0/P1 gap in first-screen clarity, brand/product presentation, mobile usability, CTA hierarchy, product discovery, context continuity, loading/error/unavailable states, and shopper trust. Campaign must have campaign-specific narrative/context rather than being a Store reskin. |
| **A2 — Embedded Decision Experience** | Advisor / VTO capabilities assist product selection and return the shopper toward a commercial decision. | Recommendation / Try-On / Compare preserve Store/Campaign/product context, avoid unnecessary re-entry/re-upload, and end with a clear product/compare/try-another/inquiry or merchant-destination action. At least one complete browser-proven shopper Golden Path reaches measurable intent. |
| **A3 — Agent Commerce Readiness** | LLM referral traffic is a distinct ecommerce acquisition class and may arrive pre-qualified or deep-linked. | Agent referral context is classified and persisted; the landing confirms relevance quickly; deep links do not lose Store/Campaign/product context; products and decision actions are understandable without forcing the shopper to restart discovery. |
| **A4 — Observed Agent Distribution** | Technical compatibility alone does not prove a channel. Real referral traffic and useful behavior are required. | Rolling 14 days: >=10 genuine AI-assistant / Agent referral sessions, includes ChatGPT/OpenAI, >=3 referred sessions perform meaningful shopper decision actions, source → session → Store/Campaign context → action is reproducibly inspectable, synthetic/internal/test traffic excluded. |

Gate A PASS requires **A1 + A2 + A3 + A4**. A technically excellent landing without real Agent distribution does not pass. Real referral traffic landing on a weak or non-commerce experience also does not pass.

## 4. A1 — Landing Experience Excellence Checklist

A Store / Campaign Landing is PASS only when current desktop and mobile evidence shows:

- within the first screen / first few seconds, the shopper can understand the brand, product/category/context, why the page is relevant, and the primary next action;
- visual quality is credible for a consumer eyewear brand or campaign and does not read as a SaaS admin/demo surface;
- products or the campaign's product story become tangible within the first one or two viewport sections;
- Store and Campaign have distinct jobs: Store supports ongoing branded product exploration; Campaign supports a specific audience, collection, message, or traffic context;
- Campaign is not merely a renamed or recolored Store shell;
- mobile has no horizontal overflow, obstructed controls, unreadable product information, or inaccessible core CTA;
- recommendation / Try-On / Compare entry points appear when they help a product decision rather than competing with the commerce narrative;
- AI-tool completion returns the shopper to product context or another intentional commerce action;
- loading, empty, error, unavailable, and partially configured states fail gracefully;
- source / campaign / relevant product context survives supported handoffs.

Evidence method:

- current production or production-equivalent browser inspection;
- desktop and representative mobile viewport;
- screenshots where useful;
- Playwright shopper path for regression-sensitive behavior;
- explicit issue list with severity.

A1 may not pass with any unresolved P0 shopper defect or a material P1 gap versus the benchmark patterns above.

## 5. A2 — Embedded Decision Experience Checklist

The AI decision layer is subordinate to, and must reinforce, the commerce experience.

Required behavior where supported by the current Experience:

- Recommendation uses the current catalog / campaign context rather than generic unrelated output;
- Try-On can start from a product or relevant Experience context;
- Compare preserves selected frames / relevant context;
- the shopper is not forced to repeat photo upload, product selection, or campaign discovery when the existing state can safely be reused;
- decision results expose a clear next action such as View Product, Compare, Try Another, Product Destination, or Inquiry;
- the shopper can return to the landing / product context without losing progress;
- meaningful actions are measurable and associated with the Experience/source where technically supported.

A2 requires at least one browser-proven path of the form:

```text
Store or Campaign Landing
→ Product Exploration
→ Recommendation / Try-On / Compare
→ Product Click / Inquiry / High-Intent Action
```

Not every Experience must expose every AI capability. The requirement is that the capabilities intentionally exposed by that Experience work as one coherent decision journey.

## 6. A3 — Agent Commerce Readiness Checklist

Agent traffic should not be treated as a generic homepage visit.

Required readiness:

- known AI-assistant / Agent sources are distinguishable from generic referral where reliable evidence exists;
- source / campaign / Experience context persists through the shopper session where technically supported;
- a direct Agent deep link to a Store, Campaign, or supported product context resolves to a useful public surface;
- the landing quickly confirms the reason for the referral instead of requiring the shopper to rediscover the same context;
- product names, prices/currency where available, images, attributes, product destinations, brand/merchant identity, and Experience context are explicit enough for humans and machines;
- canonical, indexability, structured-data, and public-discovery policy match the intended role of the Experience;
- private, draft, paid-only, and reference surfaces are not made indexable merely to make the gate green.

## 7. A4 — Observed Agent Distribution / Hard Outreach Gate

The current hard evidence threshold remains:

Rolling 14-day window:

- >=10 genuine AI-assistant / Agent referral sessions;
- the observed set includes ChatGPT / OpenAI;
- >=3 referred sessions perform one or more meaningful shopper decision actions;
- source → session → Store/Campaign context → action is reproducibly inspectable where technically supported;
- synthetic, internal QA, replayed, crawler-only, or explicitly tagged test traffic is excluded.

For Gate A, meaningful shopper actions should prefer commerce-context behavior:

- product exploration / product detail engagement;
- recommendation interaction;
- Try-On meaningful use / completion;
- Compare meaningful use / completion;
- product click / merchant destination click;
- inquiry or supported High-Intent action.

Standalone Detector / Advisor activity may be useful acquisition evidence, but it is supporting evidence unless it leads into the B2B consumer-facing Store / Campaign shopper experience. It must not substitute for proving that VisuTry can attract and convert traffic on the Experience merchants actually buy.

## 8. Supporting Acquisition Surfaces

Standalone Consumer tools, SEO/AEO/GEO answer pages, Visual SEO, Reddit, YouTube, educational content, and other public distribution surfaces are supporting acquisition infrastructure.

Their job is to increase the probability that qualified shoppers and AI assistants discover VisuTry and eventually reach a useful Store / Campaign Experience.

They are evaluated for:

- usefulness and answer quality;
- indexability / canonical / structured discoverability;
- entity clarity;
- natural internal routing toward relevant commercial shopper experiences where appropriate;
- attributable distribution signals;
- absence of spammy, low-value, or mass-generated content behavior.

They are not the primary A1 shopper-experience acceptance target.

## 9. Benchmark Review Rule

Benchmarks must be periodically rechecked because retail experiences and AI-referral behavior change.

When auditing Gate A:

1. inspect current VisuTry Store and Campaign experiences;
2. inspect at least two current mature eyewear-commerce references relevant to the feature under review;
3. record the observable comparison, not a vague score;
4. identify concrete P0/P1 gaps;
5. fix the highest-leverage gaps;
6. re-run shopper browser evidence;
7. separately evaluate real Agent distribution evidence.

Do not claim "industry standard" or "industry leading" without naming the compared behavior and current evidence.

## 10. Exit Rule

Gate A is PASS only when:

```text
A1 Landing Experience Excellence PASS
+ A2 Embedded Decision Experience PASS
+ A3 Agent Commerce Readiness PASS
+ A4 Observed Agent Distribution L3 PASS
```

This contract exists to prevent two forms of drift:

- optimizing VisuTry's standalone Consumer tools while neglecting the B2B consumer-facing Store / Campaign Experience;
- declaring success from internal opinion or technical readiness without external benchmark comparison and genuine Agent-distribution evidence.
