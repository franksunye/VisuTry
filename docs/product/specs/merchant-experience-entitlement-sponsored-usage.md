# Merchant Experience Entitlement & Sponsored Usage Contract

**Status:** Proposed product contract  
**Scope:** Merchant Store / Campaign AI usage, cost control, and interaction with VisuTry consumer entitlements  
**Out of scope:** pricing implementation, merchant billing, Page Builder, new AI models, new attribution architecture

## 1. Purpose

Merchant Experiences need a bounded way to let shoppers experience AI value without turning Discover, Store, or Campaign traffic into an unlimited free-compute surface.

The contract must satisfy two goals at the same time:

1. A shopper arriving from Discover, Store, Campaign, QR, or another merchant journey can receive enough value to understand the experience.
2. Merchant-sponsored usage must remain separate from VisuTry's consumer credit model so that merchant traffic does not silently bypass or undermine the 2C business model.

The core principle is:

> Merchant-sponsored AI usage is a bounded acquisition / commerce allowance. Consumer credits remain the entitlement for continued personal use of VisuTry.

## 2. Two separate entitlement domains

VisuTry must treat consumer entitlement and merchant-sponsored entitlement as separate domains.

### 2.1 Consumer entitlement

Consumer entitlement belongs to the VisuTry user/account.

Examples:

- existing free consumer credit
- purchased credit pack
- subscription allowance
- future account-level entitlements

Consumer entitlement is used by VisuTry's 2C tools and follows the existing consumer pricing, history, retention, and account rules.

### 2.2 Merchant-sponsored entitlement

Merchant-sponsored entitlement belongs to the merchant / Experience budget, not to the shopper's consumer account.

It exists so that a merchant can sponsor a tightly limited amount of AI interaction as part of a Store or Campaign journey.

Examples:

- one sponsored generation for a first-time shopper
- a merchant-funded allowance per shopper/session
- a merchant-level monthly hard budget

A sponsored interaction must never be represented as a consumer credit grant.

## 3. VisuTry as the first special merchant

VisuTry-owned reference / discovery traffic should use the same contract that future merchants will use, but with the most conservative allowance.

VisuTry is using this merchant role to validate traffic, shopper intent, and conversion behavior. It is not intended to subsidize repeated free AI usage.

Recommended initial policy:

```text
VisuTry-owned merchant experience

Sponsored AI generation: 1 / shopper / 24h
Sponsored Compare generation: 0
Consumer credit granted by merchant flow: 0
Allowance stacking with consumer free credit: No
```

After the sponsored generation is consumed, additional AI usage must return to the normal consumer entitlement path.

The user may continue browsing non-generative Store / Campaign content without consuming credits.

## 4. First-value rule

The sponsored allowance exists to prove value, not to provide a complete free usage session.

For VisuTry-owned traffic, the target journey is:

```text
Discover / Store / Campaign
→ shopper explores merchant content
→ shopper chooses to try AI
→ 1 sponsored AI generation
→ value demonstrated
→ additional AI usage follows normal consumer entitlement
```

The product must not turn this into:

```text
Discover
→ unlimited free Try-On
→ free Compare
→ repeated free generations
```

## 5. What happens after the sponsored allowance is exhausted

Exhausting sponsored usage should not produce a second merchant-specific payment system.

The fallback is the existing VisuTry consumer entitlement.

Recommended behavior:

### Anonymous shopper

After the sponsored generation:

```text
Sign in to continue
```

After sign-in, continued AI use follows the shopper's normal consumer entitlement.

### Signed-in shopper

If the shopper already has a VisuTry account, the merchant-sponsored generation is still logically separate from the consumer balance.

After the sponsored allowance is consumed, subsequent generations use the normal consumer entitlement.

Do not silently consume a consumer credit for the merchant-sponsored first generation.

Do not silently grant an additional consumer free credit because the shopper entered through Discover or a Merchant Experience.

## 6. No entitlement stacking

The same shopper action must not receive both:

- a merchant-sponsored generation, and
- a consumer free-credit grant

as two separate free benefits from the same acquisition path.

The contract is:

```text
merchant-sponsored allowance
OR
consumer entitlement
```

not:

```text
merchant-sponsored allowance
PLUS
extra consumer free credit
```

A shopper's pre-existing consumer credits remain valid, but they are not increased by the merchant journey.

## 7. Compare policy

Compare is valuable but can multiply generation cost quickly.

For the initial VisuTry-owned merchant policy:

```text
Sponsored Compare generation = 0
```

The landing / merchandising layer may show existing static comparison-oriented content if no generation is required.

Creating new Compare results must use normal consumer entitlement after sign-in unless a future merchant contract explicitly sponsors Compare usage.

## 8. Recommendation policy

Recommendation should be treated according to actual model cost.

If recommendation is deterministic / negligible-cost, it may remain available as part of the shopping presentation.

If recommendation invokes billable AI compute, it must be covered by the same sponsored allowance rather than creating a second hidden free bucket.

The implementation should avoid ambiguous rules such as:

```text
1 free recommendation + 1 free Try-On + 1 free Compare
```

unless those costs are deliberately budgeted by the merchant.

## 9. Anonymous access and login boundary

Merchant Experiences should not require login before the shopper sees first value.

Recommended principle:

> Login is a continuation / retention gate, not the first-value gate.

An anonymous shopper can:

- view Store / Campaign presentation
- browse featured frames
- enter the privacy gate
- use the available merchant-sponsored generation

Login is required when the shopper wants to continue beyond the sponsored allowance or persist results into the normal VisuTry account experience.

## 10. Photo retention

Anonymous merchant traffic should not automatically inherit consumer account retention behavior.

Recommended contract:

```text
Anonymous Merchant Experience
→ photo/result retained only for the minimum session/processing window
→ no automatic Dashboard / History persistence
```

Persistent history requires an authenticated consumer context and an explicit save/continuation action under the existing VisuTry retention policy.

Merchant-facing product behavior must continue to respect the existing rule that the merchant does not receive the shopper's raw face photo by default.

## 11. Cost-control dimensions

Merchant-sponsored usage must be enforceable independently from presentation mode.

The usage-control layer should be able to reason about at least:

- merchantId
- experienceId
- shopper/session identifier
- authenticated userId when present
- device/browser identifier where appropriate
- IP as a soft abuse-control signal, not the sole identity
- rolling time window
- merchant budget / hard cap

Presentation modes such as ACTION_FIRST, PRODUCT_FIRST, and EDITORIAL_FIRST must not create separate entitlement rules.

## 12. Merchant-level budget model

Future real merchants should be able to sponsor usage within a bounded budget.

Conceptually:

```text
Merchant-sponsored allowance
→ per-shopper/session cap
→ merchant aggregate budget
→ hard stop when exhausted
```

Possible future merchant policy examples:

```text
Merchant A
1 sponsored generation / shopper
monthly sponsored-generation budget = X
hard cap = Y
```

or:

```text
Merchant B
3 sponsored generations / shopper
monthly sponsored-generation budget = X
hard cap = Y
```

These are commercial policy examples, not current implementation requirements.

The system must not assume all merchants receive the same free usage profile.

## 13. Sponsored usage is a merchant commercial primitive

The long-term commercial interpretation is:

> The merchant can pay for a bounded amount of shopper AI usage as part of its Store / Campaign acquisition and conversion experience.

This creates a clean separation:

```text
Merchant pays for sponsored shopper AI usage

Shopper pays / subscribes for continued personal VisuTry usage
```

This allows 2B and 2C monetization to coexist without one subsidizing or cannibalizing the other by accident.

## 14. Attribution independence

Sponsored usage must remain independent from acquisition attribution.

Do not change or overwrite:

- source
- medium
- surface
- campaign
- utm_*
- merchantSessionId
- first-touch attribution
- merchantId
- experienceId
- referenceData

Sponsored entitlement answers:

> Who is paying for this AI generation and how much allowance remains?

Attribution answers:

> Where did this shopper/session come from?

These are different contracts.

## 15. Reference vs live merchant behavior

Reference provenance remains independent from usage entitlement.

A Reference Experience may still use the VisuTry-owned sponsored policy while retaining:

```text
Reference catalog
```

A real merchant may use its own merchant-sponsored policy while retaining:

```text
Live catalog
```

Do not conflate `referenceData` with whether usage is sponsored.

## 16. Relationship to Phase D Presentation Modes

Phase D presentation modes determine how the shopper enters the Experience:

```text
ACTION_FIRST
PRODUCT_FIRST
EDITORIAL_FIRST
```

They must all converge on the same entitlement contract before a billable generation is executed.

Examples:

```text
PRODUCT_FIRST
→ shopper chooses a frame
→ Try this frame
→ privacy gate
→ entitlement check
→ sponsored generation OR consumer entitlement
```

```text
EDITORIAL_FIRST
→ shopper explores campaign edit
→ Try the edit
→ privacy gate
→ entitlement check
→ sponsored generation OR consumer entitlement
```

```text
ACTION_FIRST
→ privacy gate
→ entitlement check
→ sponsored generation OR consumer entitlement
```

Presentation must never be able to bypass entitlement enforcement.

## 17. Initial recommended policy matrix

| Scenario | Login required before first value | Sponsored generation | Sponsored Compare | After sponsored allowance | Photo persistence |
|---|---|---:|---:|---|---|
| VisuTry 2C tools | Existing consumer rule | No merchant allowance | Existing consumer rule | Consumer credits / purchase | Existing consumer retention |
| Discover → VisuTry-owned Store/Campaign | No | 1 / shopper / 24h | 0 | Sign in, then normal consumer entitlement | Temporary while anonymous |
| Signed-in shopper in VisuTry-owned Merchant Experience | No additional login | 1 sponsored generation if eligible | 0 | Normal consumer entitlement | Persist only under consumer save/retention rules |
| Future real merchant | Merchant policy | Configurable bounded allowance | Configurable, default conservative | Merchant policy or consumer fallback | Same privacy contract |

## 18. Non-goals

This contract does not require building the following now:

- merchant billing UI
- merchant self-serve quota editor
- invoice system
- new checkout
- a second consumer credit wallet
- new AI model
- new attribution pipeline
- Page Builder
- merchant-specific recommendation engine
- unlimited free tier

## 19. Implementation principles

When this contract is implemented, the engineering design should preserve these invariants:

1. Sponsored usage and consumer credits are stored/accounted separately.
2. A billable generation is authorized by exactly one entitlement source.
3. The server is authoritative for entitlement checks.
4. Client query parameters cannot grant sponsored usage.
5. Anonymous limits have abuse protection beyond session-local state.
6. Merchant aggregate budget can hard-stop sponsored compute.
7. Exhausted sponsored usage falls back to normal consumer entitlement; it does not create a new merchant-specific purchase flow.
8. Presentation mode cannot bypass entitlement checks.
9. No automatic consumer-credit grant is triggered by Discover / Store / Campaign entry.
10. Reference provenance remains independent from sponsorship state.

## 20. Current decision

For the first implementation, use the following product decision unless later cost data demonstrates a need to tighten it further:

```text
VisuTry-owned Merchant Experience

1 sponsored AI generation / shopper / 24h
0 sponsored Compare generations
no merchant-flow consumer credit grant
no stacking with the consumer free-credit mechanism
anonymous photo persistence = temporary only
additional AI usage = normal consumer entitlement
```

This is deliberately conservative. Its purpose is to let VisuTry measure real Merchant Experience traffic and first-value conversion without turning Discover into a free-compute distribution channel.
