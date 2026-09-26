# ADR-013: Canonical Merchant Handoff

**Status:** Proposed
**Date:** 2026-09-26
**Owner:** Product / Engineering

## Decision

Store and Campaign CTA configuration resolves into one closed `MerchantHandoff` contract: `VISIT_STORE`, `BOOK_APPOINTMENT`, `WHATSAPP`, `EMAIL`, `PRODUCT`, or `CUSTOM_LINK`, each carrying only its action, display label, and safe destination. Existing `PRODUCT_OR_COLLECTION` and `LINK` values remain readable as `PRODUCT` and `CUSTOM_LINK`; unknown, malformed, and unsafe persisted CTA values are omitted from public views. New writes reject types outside the closed vocabulary and those two compatibility aliases.

Provider URL construction and launch behavior stay in presentation/adapters. The domain contract does not parse WhatsApp, email, booking, or other provider syntax. Store/Campaign discovery and canonical DecisionResult render the same resolved contract.

## Invocation and intent semantics

Every configured CTA invocation emits at most one idempotent `merchant_handoff_invoked` event with only the bounded action, surface (`DISCOVERY` or `RESULT`), and opaque client invocation id. The destination URL, query string, phone number, email address, message body, share token, and capability token are never event metadata. The server accepts an invocation only when the action is configured on the addressed Experience.

`PRODUCT_CLICK` remains the frame-level commerce intent, written only through its existing capability-protected path when a shopper opens a catalog frame destination. A configured Experience CTA (which has no canonical frame target) emits only `merchant_handoff_invoked`; it is not also represented as `PRODUCT_CLICK`. `FAVORITE` and `INQUIRY` remain independent shopper intents and are never inferred from a handoff action. These signals describe distinct behaviors and must not be summed as one conversion count without an explicit analytics definition.

No provider delivery, webhook, CRM, appointment integration, arbitrary code, or new consent behavior is introduced.
