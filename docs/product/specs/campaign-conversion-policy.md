# Campaign Conversion Policy

**Status:** Authoritative product and commercial contract  
**Scope:** Campaign objectives, conversion gates, shopper identity policy, sponsored usage interaction, merchant data expectations, sales language, and implementation boundaries  
**Related contract:** `docs/product/specs/merchant-experience-entitlement-sponsored-usage.md`  
**Out of scope:** CRM, arbitrary form builder, Page Builder, merchant billing, pricing packages, revenue attribution, new AI models

## 1. Purpose

VisuTry Campaign is not simply a themed Store page and it is not always a lead-generation form.

A Campaign is a merchant-controlled AI shopping experience that can optimize for different commercial outcomes while preserving the same shopper runtime and measurement foundation.

The core product principle is:

> The merchant chooses whether a Campaign optimizes for qualified traffic, shopper intent, or opt-in conversion.

This contract exists to keep Product, Engineering, Sales, and Merchant Success aligned on what Campaign means, what merchants can control, and what VisuTry may credibly promise.

## 2. Campaign capability model

Campaign behavior is composed from three independent policy layers:

```text
Campaign
├── Presentation Policy
│   ├── ACTION_FIRST
│   ├── PRODUCT_FIRST
│   └── EDITORIAL_FIRST
│
├── Sponsored Usage Policy
│   ├── sponsored generation allowance
│   ├── rolling usage window
│   └── future merchant budget controls
│
└── Conversion Policy
    ├── Objective
    │   ├── TRAFFIC
    │   ├── INTENT
    │   └── LEAD
    │
    └── Gate
        ├── NONE
        ├── OPT_IN_AFTER_VALUE
        └── OPT_IN_BEFORE_AI
```

These layers must remain conceptually and technically separate.

- Presentation determines what the shopper sees first.
- Sponsored Usage determines who funds costly AI interaction and how much.
- Conversion Gate determines when, if ever, the shopper is asked to identify themselves or opt in.

Do not collapse these into a single field such as `freeTryOnCount`, `leadMode`, or `campaignType`.

## 3. Campaign is not synonymous with lead generation

A successful Campaign does not require an email address or an identified shopper.

A merchant may deliberately choose to maximize low-friction shopping engagement and collect high-quality anonymous intent data instead of placing an opt-in gate in the funnel.

Examples of valid merchant goals:

- drive qualified shoppers into a new collection
- measure which frames receive actual Try-On engagement
- understand which products shoppers compare or favorite
- send higher-intent traffic back to the merchant storefront
- generate identified leads after demonstrating value
- require opt-in before an expensive or high-value AI interaction

Therefore:

> Lead capture is one Campaign strategy, not the definition of Campaign.

## 4. Campaign objectives

### 4.1 `TRAFFIC`

The merchant primarily wants qualified shopper traffic and measurable engagement with a branded experience.

Typical behavior:

```text
Campaign visit
→ browse collection
→ product interaction
→ optional AI experience
→ merchant CTA
```

Typical primary metrics:

- qualified visits
- engaged sessions
- product views
- AI starts
- merchant CTA clicks
- downstream intent events where available

Identity collection is optional and should not be introduced unless the merchant explicitly chooses it.

### 4.2 `INTENT`

The merchant wants to understand actual product and shopping intent rather than only visits or clicks.

Typical behavior:

```text
Campaign visit
→ product exploration
→ Try-On
→ additional frame interaction
→ Favorite / Compare
→ merchant CTA
```

Typical primary metrics:

- Try-On start rate
- Try-On completion rate
- frames tried
- products revisited
- favorites
- compares
- high-intent shopper sessions
- merchant CTA clicks

This objective may remain fully anonymous.

### 4.3 `LEAD`

The merchant explicitly wants identified shoppers or opt-in conversion.

Typical behavior:

```text
Campaign visit
→ value / proposition
→ opt-in gate
→ identified continuation
```

or:

```text
Campaign visit
→ first sponsored AI value
→ opt-in gate
→ continued engagement
```

Typical primary metrics:

- gate shown
- gate completion
- identified shoppers
- opt-in rate
- continued engagement after opt-in
- subsequent product intent
- merchant CTA clicks

VisuTry must not represent a TRAFFIC or INTENT Campaign as a lead-generation Campaign in Sales materials.

## 5. Conversion gates

### 5.1 `NONE`

No identity gate is introduced by the Campaign.

The shopper may remain anonymous while browsing and using whatever sponsored or consumer entitlement is available.

Use when the merchant values:

- low friction
- qualified traffic
- anonymous intent data
- product engagement
- merchant-site handoff

This is a first-class Campaign strategy, not a degraded mode.

### 5.2 `OPT_IN_AFTER_VALUE`

The shopper receives initial value before being asked to opt in.

Typical flow:

```text
Campaign
→ product exploration
→ first sponsored AI result
→ continue / save / unlock more
→ opt-in gate
→ further experience
```

Use when the merchant wants identified leads but does not want to damage first-value conversion.

This should generally be the preferred lead-generation pattern when the merchant is willing to sponsor the first interaction.

### 5.3 `OPT_IN_BEFORE_AI`

The shopper must opt in before a costly or protected AI action.

Typical flow:

```text
Campaign
→ proposition / products
→ Try with AI
→ opt-in gate
→ AI generation
```

Use only when the merchant explicitly prioritizes lead capture or cost protection over maximum first-value conversion.

This mode should not become the system-wide default.

## 6. Sponsored Usage and Conversion Gate are different controls

This distinction is mandatory:

```text
Sponsored Usage
= who pays for AI compute and how much is funded

Conversion Gate
= when the shopper is asked to identify / opt in
```

Examples:

| Sponsored Usage | Gate | Meaning |
|---|---|---|
| 1 generation | `NONE` | Merchant funds first value and collects anonymous intent only |
| 1 generation | `OPT_IN_AFTER_VALUE` | Merchant funds first value, then asks for opt-in to continue |
| 1+ generations | `OPT_IN_BEFORE_AI` | Merchant requires identity before funded AI use |
| 0 | `NONE` | Shopper may browse, but costly AI requires normal consumer entitlement |

Do not implement entitlement exhaustion as an unconditional hardcoded `Sign in to continue` product rule.

Entitlement should return a domain state. Campaign Conversion Policy decides the next gate.

Conceptually:

```text
Sponsored allowance exhausted
→ entitlement state
→ Campaign conversion policy
→ next gate / next action
```

This keeps the entitlement engine reusable across different merchant strategies.

## 7. Anonymous Intent is commercial data

Anonymous shopper behavior is valuable even when the shopper never opts in.

Examples of valid anonymous intent signals:

```text
Campaign viewed
Product viewed
Featured frame selected
Try-On started
AI result completed
Frame tried
Favorite
Compare
Merchant CTA clicked
Store continuation clicked
```

These signals should remain attributable to:

- merchant
- Experience / Campaign
- session
- acquisition source / medium / surface / campaign

without requiring identity capture.

The product should distinguish:

```text
Anonymous Intent
vs
Identified Intent
```

Identified Intent is an enhancement, not a prerequisite for meaningful Merchant Intelligence.

## 8. Identified Intent and opt-in

A shopper becomes an identified or opted-in shopper only through an explicit identity / consent action supported by the product.

Do not infer lead status merely because:

- the shopper has a browser session
- an Auth0 account exists elsewhere
- an email appears in unrelated consumer account data
- the shopper clicked a product
- the shopper completed Try-On

Where opt-in is required, the exact consent language and data-use purpose must be explicit and truthful.

Future merchant lead capture may include email or other fields, but this contract does not authorize an arbitrary merchant form builder.

## 9. Measurement model

Campaign reporting should be objective-aware.

A single universal conversion rate is insufficient.

### TRAFFIC Campaign scorecard

Prioritize:

```text
Qualified Visits
Engaged Sessions
Product Engagement
AI Starts
Merchant CTA Clicks
```

### INTENT Campaign scorecard

Prioritize:

```text
Try-On Completion
Frames Tried
Favorites
Compares
High-Intent Sessions
Merchant CTA Clicks
```

### LEAD Campaign scorecard

Prioritize:

```text
Gate Shown
Opt-In Completed
Identified Shoppers
Opt-In Rate
Post-Opt-In Engagement
Merchant CTA Clicks
```

Do not fabricate revenue, ROAS, purchase conversion, or merchant-sales attribution unless actual integrations support those metrics.

## 10. High-intent shopper concept

A `high-intent shopper` should be based on observable behavior, not identity status.

Examples of behaviors that may contribute to high intent:

- completed AI Try-On
- tried multiple frames
- favorited a frame
- used Compare
- returned to a product
- clicked a merchant CTA

The precise scoring model may evolve, but identity alone must not define high intent.

A shopper can be:

```text
anonymous + high intent
identified + low intent
identified + high intent
```

Merchant Intelligence should preserve these distinctions.

## 11. Campaign UX implications

Campaign Presentation and Conversion Policy should work together without becoming a Page Builder.

Examples:

### INTENT / no gate

```text
Editorial hero
→ featured edit
→ Try the edit
→ AI result
→ continued anonymous intent
→ merchant CTA
```

### LEAD / after value

```text
Editorial hero
→ featured edit
→ first sponsored Try-On
→ Save / continue
→ opt-in
→ continued experience
```

### LEAD / before AI

```text
Editorial hero
→ featured edit
→ Try with AI
→ opt-in
→ AI result
```

The presentation layer remains fixed and controlled. This does not justify arbitrary sections, drag-and-drop layouts, or merchant-defined React components.

## 12. CTA semantics

CTA language should represent the shopper action, not internal cost mechanics.

Good shopper-facing examples:

- Try this frame
- Try the edit
- See it on me
- Explore the collection
- Save my look
- Continue exploring
- Unlock more looks

Avoid exposing internal entitlement terminology such as:

- Sponsored quota
- Merchant-paid generation
- 1 sponsored credit remaining
- Compute allowance

When a gate is required, the CTA can transition naturally into the gate rather than showing a technical error.

## 13. Merchant control principles

Merchants should eventually be able to control Campaign strategy within bounded options.

The intended merchant controls are:

```text
Objective
- TRAFFIC
- INTENT
- LEAD

Gate
- NONE
- OPT_IN_AFTER_VALUE
- OPT_IN_BEFORE_AI

Sponsored Usage
- policy-defined allowance
```

These controls are deliberately constrained.

Not authorized by this contract:

- arbitrary funnel builders
- custom JavaScript gates
- arbitrary field schemas
- custom tracking pixels without governance
- arbitrary post-submit automation
- arbitrary page composition

## 14. Merchant-specific policy, not global behavior

Different merchants may choose different Campaign strategies.

Example:

```text
Merchant A
Objective = INTENT
Gate = NONE
Sponsored generations = 2
```

```text
Merchant B
Objective = LEAD
Gate = OPT_IN_AFTER_VALUE
Sponsored generations = 1
```

```text
Merchant C
Objective = TRAFFIC
Gate = NONE
Sponsored generations = 0
```

The architecture must not assume every merchant wants the same funnel.

## 15. VisuTry-owned traffic

VisuTry-owned / reference traffic is primarily a validation and distribution environment.

It must not silently establish commercial defaults that later bind real merchants.

Current VisuTry-sponsored allowance is governed by:

`docs/product/specs/merchant-experience-entitlement-sponsored-usage.md`

The conservative VisuTry policy exists to control cost while testing the funnel.

It should not be interpreted as the default sponsored allowance or lead policy for future merchant contracts.

## 16. Reference Experiences

Reference provenance and Campaign strategy are independent dimensions.

`referenceData=true` does not mean:

- unlimited sponsored usage
- lead capture enabled
- customer relationship
- partner relationship
- case study

Reference Experiences may be used to demonstrate Campaign patterns, but all public provenance rules remain unchanged.

## 17. Sales outreach contract

Sales may accurately position Campaign as:

> A merchant-controlled AI shopping campaign that can optimize for qualified traffic, shopper intent, or opt-in conversion.

Sales may explain that merchants can choose whether they want:

- lower-friction anonymous shopping engagement
- deeper intent measurement
- identified opt-in conversion

Sales must not promise, unless actually implemented and configured:

- guaranteed lead volume
- guaranteed sales conversion
- revenue attribution
- ROAS
- CRM synchronization
- arbitrary custom forms
- unlimited AI usage
- unlimited free Try-On
- merchant-defined page building

### Recommended sales framing

Use:

> You decide what the Campaign is trying to achieve: more qualified shoppers, deeper product intent, or identified opt-ins. VisuTry then measures the shopping behavior generated around that objective.

For merchants who do not want opt-in friction:

> The Campaign can remain anonymous and still measure meaningful shopping intent such as Try-On engagement, product interactions, favorites, comparisons, and merchant-site clicks.

For merchants who want leads:

> Opt-in can be introduced before AI or, preferably, after the shopper has already received initial value.

This framing is the commercial interpretation of this product contract.

## 18. Engineering contract

Engineering should preserve the following separation:

```text
PresentationMode
!= SponsoredUsagePolicy
!= CampaignConversionPolicy
```

A recommended future domain shape is conceptually:

```ts
type CampaignObjective = 'TRAFFIC' | 'INTENT' | 'LEAD'

type CampaignGate =
  | 'NONE'
  | 'OPT_IN_AFTER_VALUE'
  | 'OPT_IN_BEFORE_AI'

type CampaignConversionPolicy = {
  objective: CampaignObjective
  gate: CampaignGate
}
```

Exact persistence and API shape may differ after implementation review.

Do not implement this document by automatically adding schema fields before there is a concrete implementation task.

## 19. Entitlement integration contract

The Sponsored Usage engine should not own Campaign conversion strategy.

A future entitlement result should be capable of expressing a domain state such as:

```text
allowed
merchant-sponsored exhausted
consumer entitlement available
consumer entitlement unavailable
```

The Campaign layer can then decide whether the next step is:

```text
continue anonymously
show opt-in
require sign-in
use consumer entitlement
show existing credit purchase flow
```

Do not hardwire the full UX decision tree inside the cost-control layer.

## 20. Data ownership and privacy boundary

Campaign Intelligence may aggregate shopper behavior that VisuTry legitimately collects through the Merchant Experience.

Merchant-facing data should follow the existing privacy and merchant-session contracts.

This document does not authorize:

- disclosure of raw face photos to merchants
- sale of consumer identity data
- silent conversion of consumer accounts into merchant leads
- collecting fields without disclosed purpose
- combining unrelated consumer profile data into merchant lead exports

Opt-in and identified lead behavior requires explicit product and privacy implementation.

## 21. Product roadmap boundary

The desired maturity path is:

```text
1. Presentation Modes
2. Sponsored Usage / Entitlement
3. Campaign Conversion Policy foundation
4. Objective-aware Campaign Intelligence
5. Minimal opt-in capture when merchant demand is validated
6. External CRM / commerce integrations only when commercially justified
```

Do not reverse this into:

```text
Form Builder
→ CRM
→ Automation Builder
→ Page Builder
```

before the core Campaign conversion loop is validated.

## 22. Definition of Campaign Engine maturity

Campaign Engine is commercially meaningful when a merchant can answer four questions:

1. What is this Campaign trying to achieve?
2. How much AI experience am I willing to sponsor?
3. Do I want shoppers to opt in, and when?
4. What qualified traffic / intent / opt-in outcome did the Campaign produce?

VisuTry does not need to become the merchant's CRM or ecommerce backend to answer these questions.

## 23. Authoritative decisions

The following decisions are locked by this contract unless explicitly revised:

1. Campaign is not synonymous with lead generation.
2. `TRAFFIC`, `INTENT`, and `LEAD` are distinct Campaign objectives.
3. `NONE`, `OPT_IN_AFTER_VALUE`, and `OPT_IN_BEFORE_AI` are the bounded gate strategies.
4. Anonymous Intent is first-class commercial data.
5. Identified Intent is optional and requires explicit opt-in behavior.
6. Sponsored Usage controls cost; Conversion Gate controls identity friction.
7. Sponsored Usage and Conversion Gate must remain separate in the domain model.
8. Campaign success metrics must align with the selected objective.
9. High intent is defined by behavior, not by identity alone.
10. Merchant-specific Campaign strategy must not become a global hardcoded funnel.
11. Sales must not promise capabilities or outcomes that are not implemented.
12. This policy does not authorize a Page Builder, Form Builder, CRM, merchant billing system, or revenue attribution layer.

## 24. Commercial north star

The intended Campaign Engine value proposition is:

> Give eyewear merchants controlled AI shopping experiences that turn traffic into measurable product intent, with optional opt-in conversion when the merchant wants it.

The merchant controls the trade-off between:

```text
reach / low friction
↔
shopper intent depth
↔
identity / opt-in conversion
```

VisuTry provides the experience, measurement, and bounded policy controls without forcing every merchant into the same funnel.
