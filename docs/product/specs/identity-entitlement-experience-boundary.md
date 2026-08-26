# VisuTry Identity, Entitlement & Experience Boundary

**Status:** CLOSED / SHIPPED
**Owner:** Product / Engineering  
**Created:** 2026-08-26  
**Scope:** Shopper identity, Consumer account continuity inside Merchant Experiences, Merchant membership, entitlement ownership, and payment/navigation boundaries.

Related specs:

- `docs/product/specs/merchant-experience-architecture.md`
- `docs/product/specs/merchant-experience-entitlement-sponsored-usage.md`
- `docs/product/specs/merchant-commercial-entitlements.md`
- `docs/product/specs/campaign-conversion-policy.md`

---

## 1. Decision

VisuTry has one identity system with two distinct product roles:

```text
VisuTry Identity
├── Consumer Account
└── Merchant Membership
```

A shopper who registers while using a Merchant Store or Campaign is still a **VisuTry Consumer**. The Store / Campaign is the current commerce context, not a separate consumer account system.

The core rule is:

> **Merchant Experience is a branded shopper context on top of VisuTry Consumer identity and entitlement, not a separate Consumer product stack.**

This preserves one account, one Consumer credit balance, one Consumer history/retention model, and one payment system across standalone VisuTry and merchant-branded experiences.

---

## 2. Identity and entitlement separation

The product must keep the following domains separate:

```text
Consumer Account
→ Consumer Entitlement
→ Credits / Subscription
→ Personal Try-On / Compare / History / Dashboard

Merchant Membership
→ Merchant Entitlement
→ Merchant Plan / AI Commerce Capacity
→ Merchant Admin / Store / Campaign / Analytics
```

Merchant-sponsored shopper usage is a third bounded entitlement source owned by the Merchant / Experience budget:

```text
Merchant-Sponsored Entitlement
→ first-value shopper allowance
→ Store / Campaign context
```

A billable generation is authorized by exactly one source:

```text
MERCHANT_SPONSORED
OR
CONSUMER_ENTITLEMENT
```

Never both.

---

## 3. Shopper continuation inside Store / Campaign

The canonical merchant shopper journey is:

```text
Store / Campaign
→ anonymous shopper
→ merchant-sponsored first value
→ sponsored allowance exhausted
→ VisuTry sign-in / registration
→ Consumer entitlement
→ purchase if needed
→ return to the same Store / Campaign
→ continue Try-On / Compare
```

Authentication, Pricing, Checkout, and payment settlement must preserve the originating Merchant Experience when a valid continuation context exists.

Without Merchant continuation context, existing standalone Consumer behavior remains the default.

---

## 4. Consumer account layer inside Merchant Experience

An authenticated shopper inside Store / Campaign should not lose access to their VisuTry Consumer identity simply because the current surface is merchant-branded.

Merchant Experience should remain visually merchant-first, but expose a lightweight VisuTry account layer for authenticated shoppers.

Recommended account affordance:

```text
Account / avatar
├── Credits remaining
├── My Try-Ons
├── Dashboard
├── Buy more credits
└── Sign out
```

Do not copy the full standalone Consumer navigation into every merchant Store or Campaign.

The principle is:

> **Brand experience stays primary; VisuTry account continuity stays visible and reachable.**

---

## 5. Consumer history and merchant-generated results

When an authenticated shopper uses `CONSUMER_ENTITLEMENT` inside a Merchant Experience, that usage belongs to the Consumer account and should follow the normal Consumer history and retention contract.

Expected model:

```text
Merchant Experience context
+ authenticated userId
+ CONSUMER_ENTITLEMENT
→ personal Try-On / Compare result
→ Consumer History / Dashboard eligibility
```

Merchant attribution and Experience attribution must remain attached to the task/event, but the Merchant does not gain ownership of the shopper's personal image history.

Anonymous sponsored usage remains temporary unless the shopper authenticates and the existing Consumer save/retention rules apply.

---

## 6. Payment UX boundary

Merchant shopper continuation must reuse the existing VisuTry Consumer commerce system.

Do not create a merchant-specific shopper checkout.

Canonical rule:

```text
Merchant Experience
→ Consumer Pricing / Checkout
→ payment settlement
→ original Merchant Experience
```

Standalone Consumer purchase continues to use the existing Consumer destination when no Merchant continuation context exists.

Face Analysis unlock remains its own existing bounded continuation flow.

### Mobile

Mobile and desktop use the same entitlement and payment architecture.

Mobile presentation should be compact and task-oriented, especially when payment is triggered from a Merchant Experience:

```text
Sponsored usage exhausted
→ concise Consumer credit offer
→ secure checkout
→ payment success
→ Continue trying these frames
```

Do not force a mobile merchant shopper through unnecessary Dashboard or full-site navigation before returning to the originating Store / Campaign.

---

## 7. Authentication is not merchant lead consent

A shopper signing into VisuTry to use Consumer credits does **not** automatically become a Merchant Lead.

Keep separate:

```text
VisuTry authentication
≠ merchant identity capture
≠ merchant lead consent
```

Campaign Conversion Policy remains authoritative for merchant lead / opt-in behavior.

A logged-in VisuTry user may remain anonymous to the merchant unless the shopper explicitly completes the configured merchant conversion / consent action.

---

## 8. Merchant self-service billing boundary

Merchant registration and merchant payment are a separate commercial path from Consumer signup and Consumer credits.

Future merchant path:

```text
Merchant sign-up
→ Merchant Membership
→ Merchant Plan / capacity selection
→ payment / invoice
→ Merchant Entitlement provisioning
→ Merchant Admin
```

This is not required to complete the current shopper Store / Campaign conversion loop.

Near-term Merchant Admin may show plan / usage / capacity / renewal state without requiring a full self-service billing system.

Do not build merchant self-service billing merely to mirror the Consumer checkout experience.

Build it when repeated merchant onboarding volume and commercial evidence justify self-service provisioning.

---

## 9. System model

```text
                         VisuTry Identity
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Consumer Account          Merchant Membership
                 │                         │
        Consumer Entitlement        Merchant Entitlement
        Credits / Subscription      Plan / Capacity
                 │                         │
        Consumer Dashboard           Merchant Admin
        History / Try-Ons            Store / Campaign
                 │                         │
                 └──────────┐   ┌──────────┘
                            │   │
                     Merchant Experience
                         shopper side
                            │
                 Merchant-sponsored allowance
                            │
                      first value
                            │
                        exhausted
                            │
                    Consumer Account
                            │
                   Consumer Entitlement
```

Merchant-sponsored usage remains owned by Merchant / Experience and does not become a Consumer credit grant.

---

## 10. Product invariants

Engineering and product changes must preserve these invariants:

1. A shopper has one VisuTry Consumer account across standalone and Merchant Experiences.
2. Store / Campaign does not create a second Consumer wallet or payment system.
3. Consumer credits remain account-level and portable across eligible VisuTry shopper surfaces.
4. Merchant-sponsored usage remains separately metered and bounded.
5. Merchant-branded surfaces may simplify navigation but must not hide the authenticated shopper's Consumer account continuity.
6. Consumer-entitled Merchant Experience results should remain eligible for normal Consumer history/retention.
7. Merchant attribution remains attached without transferring ownership of personal shopper images/history to the merchant.
8. Authentication does not imply merchant lead consent.
9. Merchant Membership and Merchant Entitlement remain separate from Consumer Account and Consumer Entitlement.
10. Merchant self-service billing is a future B2B commercialization capability, not a prerequisite for the current shopper conversion loop.

---

## 11. Near-term product actions

The immediate product follow-ups are intentionally small:

1. Add a lightweight authenticated VisuTry Account entry inside Store / Campaign.
2. Verify that Merchant Experience tasks authorized by `CONSUMER_ENTITLEMENT` attach to `userId` and appear correctly in Consumer History / Dashboard under existing retention rules.
3. Validate the Store / Campaign credit-purchase continuation on mobile viewport and Stripe Test Mode.
4. Keep Merchant billing self-service deferred; only expose merchant plan / usage state where useful for current Pilots.

These are continuity and product-coherence improvements, not a new platform layer.
