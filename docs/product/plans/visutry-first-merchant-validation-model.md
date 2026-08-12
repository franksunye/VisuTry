# VisuTry as the First Merchant — Internal Validation Model

**Status:** Internal operating note  
**Scope:** Product validation, operating sequence, and Sales-readiness use of VisuTry-owned Store / Campaign experiences  
**Related contracts:**
- `docs/product/specs/merchant-experience-entitlement-sponsored-usage.md`
- `docs/product/specs/campaign-conversion-policy.md`

## 1. Operating principle

VisuTry should treat itself as the first special merchant using the same Store / Campaign system that future external merchants will use.

This is an internal validation model, not a separate product mode and not a public claim that VisuTry is an external customer.

The purpose is to dogfood the merchant experience with real traffic before asking external merchants to depend on it.

> VisuTry validates the merchant loop on itself first: presentation, sponsored usage, conversion policy, shopper intent, attribution, and merchant intelligence.

## 2. Same contract, special policy

VisuTry-owned Experiences should use the same core merchant primitives as future merchants:

```text
Catalog
Store
Campaign
Presentation Policy
Sponsored Usage Policy
Conversion Policy
Attribution
Merchant Intelligence
```

VisuTry is special only in policy and provenance, not in architecture.

For example, VisuTry may use a deliberately conservative sponsored-usage allowance to control internal acquisition cost. That allowance must not become the default commercial policy for future merchants.

Reference Experiences must also preserve explicit provenance and must never be represented as customer, partner, or case-study relationships unless such a relationship actually exists.

The production validation merchant is `VisuTry Demo` (`visutry-demo`): a VisuTry-owned internal validation tenant with `pilotType=INTERNAL`, `referenceData=false`, and explicit `referenceMetadata` ownership. It is not an external reference merchant, partner, or customer.

## 3. What VisuTry is validating

VisuTry-owned traffic is used to answer practical questions before external merchant rollout:

- Does a Store feel like a credible shopping surface rather than an AI tool?
- Does a Campaign communicate a clear merchandising proposition?
- Does Discover send qualified shoppers into Merchant Experiences?
- Does first-value AI usage increase engagement without creating uncontrolled compute cost?
- Which Campaign objectives and gates create acceptable shopper friction?
- Can anonymous behavior produce useful product-intent signals without mandatory opt-in?
- Can attribution remain intact from acquisition surface through Store / Campaign interaction?
- Does Merchant Intelligence tell a merchant something commercially useful?

The purpose is not to maximize VisuTry's own free usage. The purpose is to validate the merchant operating loop under realistic constraints.

## 4. Internal progression

The intended operating sequence is:

```text
VisuTry-owned traffic
→ Store / Campaign experience
→ bounded sponsored AI value
→ shopper behavior / intent measurement
→ conversion-policy validation
→ Merchant Intelligence validation
→ Sales-ready demonstration
→ external merchant pilot
```

Product work should prefer improvements that increase the credibility, measurability, or sellability of this loop over unrelated feature expansion.

## 5. Relationship to Sales Outreach

This internal use provides Sales Outreach with a stronger basis than a static demo.

Sales can demonstrate that VisuTry operates the same Store / Campaign system on its own traffic to validate:

- shopper interaction quality
- AI usage controls
- intent measurement
- conversion-gate behavior
- merchant-facing reporting

The safe framing is that VisuTry is the first internal merchant / system validator.

Do not present VisuTry-owned or reference performance as external customer performance.

Do not imply merchant endorsement, partnership, or production adoption where none exists.

## 6. What should remain merchant-controlled

Internal VisuTry defaults must not hard-code the future merchant experience.

External merchants may differ in:

- Campaign objective: `TRAFFIC`, `INTENT`, or `LEAD`
- Conversion gate: `NONE`, `OPT_IN_AFTER_VALUE`, or `OPT_IN_BEFORE_AI`
- Sponsored usage allowance
- presentation choice within supported modes
- selected catalog / Campaign assortment

The architecture should therefore treat VisuTry as one merchant configuration, not as the definition of all merchant behavior.

## 7. Success criterion

This internal validation model is working when VisuTry can credibly answer, from its own merchant-like operation:

1. Can we attract qualified shoppers into a Store or Campaign?
2. Can we demonstrate AI value with controlled cost?
3. Can we observe meaningful shopper intent with or without opt-in?
4. Can we measure the funnel in a way a merchant understands?
5. Can we show the same configurable system to an external merchant without rebuilding the product for them?

When these are true, VisuTry-owned operation becomes a practical bridge from product development to merchant pilots and Sales Outreach.
