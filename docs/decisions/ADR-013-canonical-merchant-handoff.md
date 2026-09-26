# ADR-013: Canonical Merchant Handoff

**Status:** Accepted
**Date:** 2026-09-26
**Owner:** Product / Engineering

## Decision

Store and Campaign CTA configuration resolves into one closed `MerchantHandoff` contract: `VISIT_STORE`, `BOOK_APPOINTMENT`, `WHATSAPP`, `EMAIL`, `PRODUCT`, or `CUSTOM_LINK`, each carrying only its action, display label, and safe destination. A historical CTA with `type = null` remains readable as `CUSTOM_LINK` only when its label is nonblank and its destination is valid and safe. `PRODUCT_OR_COLLECTION` and `LINK` remain readable as `PRODUCT` and `CUSTOM_LINK`; unknown, malformed, and unsafe persisted CTA values are omitted from public views.

Legacy callers may still submit `PRODUCT_OR_COLLECTION` and `LINK` as compatibility inputs, but every new persistence path normalizes them before writing (`PRODUCT_OR_COLLECTION` → `PRODUCT`; `LINK` → `CUSTOM_LINK`). Unsupported values are rejected. Campaign draft idempotency compares resolved Handoff semantics rather than raw stored action strings, so a retry matches equivalent legacy aliases and valid untyped custom links. Prisma and Cloudflare use the same compatibility rule.

Provider URL construction and launch behavior stay in presentation/adapters. The domain contract does not parse WhatsApp, email, booking, or other provider syntax. Store/Campaign discovery and canonical DecisionResult render the same resolved contract.

## Invocation and intent semantics

Every configured CTA invocation emits at most one idempotent `merchant_handoff_invoked` event with only the bounded action, surface (`DISCOVERY` or `RESULT`), and opaque client invocation id. The destination URL, query string, phone number, email address, message body, share token, and capability token are never event metadata. The server accepts an invocation only when the action is configured on the addressed Experience.

`PRODUCT_CLICK` remains the frame-level commerce intent, written only through its existing capability-protected path when a shopper opens a catalog frame destination. A configured Experience CTA (which has no canonical frame target) emits only `merchant_handoff_invoked`; it is not also represented as `PRODUCT_CLICK`. `FAVORITE` and `INQUIRY` remain independent shopper intents and are never inferred from a handoff action. These signals describe distinct behaviors and must not be summed as one conversion count without an explicit analytics definition.

No provider delivery, webhook, CRM, appointment integration, arbitrary code, or new consent behavior is introduced.

## Consequences

- Public Store/Campaign discovery and Decision Result preserve valid historical no-type CTAs without exposing unsupported or unsafe actions.
- New database writes converge on canonical action values while older callers and persisted rows remain compatible.
- Campaign draft retries remain idempotent across canonical and equivalent legacy Handoff representations on Prisma and Cloudflare.
- Admin configuration exposes only the bounded canonical action selector; merchants do not need to choose legacy aliases.

## Change Log

| Date | Change |
| --- | --- |
| 2026-09-27 | Accepted the canonical Handoff contract and documented legacy no-type reads, alias normalization, and idempotency compatibility after implementation and validation. |
