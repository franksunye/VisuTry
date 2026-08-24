# Paid Customer Language Tracking v1

## 1. Executive Summary

Implemented on branch `codex/paid-customer-language-tracking-v1` in an isolated worktree.

The existing GA4/dataLayer event pipeline now carries browser language and URL-selected site locale separately. First-touch landing locale and first Pricing locale are frozen in the existing session storage context. Checkout requests persist the language context through the existing Payment `attribution` JSON and Stripe Checkout metadata. Signed Stripe webhook fulfillment adds billing country/region from Stripe Checkout when available.

No translation, UI redesign, production migration, deployment, or real Stripe payment was performed.

## 2. Tracking Gap Before

- GA4 events already included `browser_language`, but the Payment/Axiom path did not receive a stable language context.
- `landing_locale` was derived from the current document on each event instead of being frozen as first-touch context.
- Pricing and Checkout locale were not distinct Payment attribution fields.
- The language switcher navigated between locale-prefixed URLs without emitting a locale-change event.
- Checkout request/created logs did not include request context, so `Accept-Language` was unavailable in the checkout Axiom record.
- Payment attribution did not contain Stripe billing country/region from the completed Checkout Session.

## 3. Canonical Field Definitions

| Field | Source | Storage | Meaning | PII? | Example |
|---|---|---|---|---|---|
| `browser_language` | `navigator.language` | GA4/dataLayer; Payment attribution | Browser's primary raw locale value | No | `ar-AE` |
| `browser_languages` | `navigator.languages` | GA4/dataLayer; compact Payment attribution | Ordered browser language preference list | No | `['ar-AE', 'en-US', 'en']` |
| `accept_language` | Request `Accept-Language` header | Axiom request context, max 256 chars | Raw server-observed preference header; not interpreted as native language | No | `ar-AE,ar;q=0.9,en-US;q=0.8` |
| `site_locale` | Locale-prefixed URL, with validated HTML fallback | GA4/dataLayer; Payment attribution; key server event logs | Locale actually selected by the VisuTry URL | No | `en` |
| `landing_locale` | First URL locale in the browser session | GA4/dataLayer; Payment attribution | First-touch site locale | No | `ar` |
| `pricing_locale` | First visit to a locale-prefixed `/pricing` URL | GA4/dataLayer; Payment attribution | Locale when the session first entered Pricing | No | `de` |
| `checkout_locale` | Validated locale sent by the Checkout caller | Payment attribution; Stripe metadata; Checkout Axiom logs | Locale selected for the Checkout request | No | `en` |
| `locale_changed` | Existing session storage plus locale switcher | GA4/dataLayer; Payment attribution | Whether an explicit locale switch occurred in the session | No | `true` |
| `geo_country` | Stripe Checkout `customer_details.address.country` | Completed Payment attribution; payment Axiom event | Billing/payment country, not visit geo | No | `AE` |
| `geo_region` | Stripe Checkout `customer_details.address.state` | Completed Payment attribution; payment Axiom event | Billing/payment region/state when Stripe supplies it | No | `Dubai` |

No language is inferred from country. Raw locale values are not converted into language names.

## 4. Implementation

Modified files:

- `src/lib/acquisition-attribution.ts` — added compact canonical language, locale-change, and billing geo fields; preserved Stripe's 500-character metadata limit without slicing invalid JSON.
- `src/lib/analytics.ts` — added URL-based `site_locale`, frozen `landing_locale`, first `pricing_locale`, browser language list, Checkout attribution helper, and `locale_changed` event helper.
- `src/lib/analytics-events.ts` — added canonical context field types.
- `src/components/LanguageSwitcher.tsx` — emits locale change before navigation.
- `src/components/pricing/PricingCard.tsx`, `src/components/face-analysis/FaceAnalysisInterface.tsx`, `src/components/payments/ConversionPaywallBoundary.tsx` — send Checkout attribution with `checkout_locale`.
- `src/components/analytics/GoogleAnalytics.tsx` — keeps GA4 language property names aligned and includes current site locale/browser preference list.
- `src/lib/logger.ts` — adds bounded `accept_language` request context only; no full-header logging.
- `src/app/api/payment/create-session/route.ts` — makes Checkout locale authoritative, logs language context with request context, strips client-supplied geo, and persists attribution.
- `src/lib/stripe.ts` — carries attribution into subscription metadata and merges Stripe billing country/region during successful Checkout handling.
- `src/app/api/payment/webhook/route.ts` — includes the completed Payment language/geo context in the fulfillment Axiom event.
- `src/app/api/face-shape-detector/usage/route.ts`, `src/components/face-shape/FreeFaceShapeDetector.tsx` — carries validated site locale into the server usage event.
- `src/app/api/face-analysis/submit/route.ts`, `src/components/face-analysis/FaceAnalysisInterface.tsx` — carries validated site locale into submit request/completed logs.
- `src/components/analytics/PaymentConversionTracker.tsx` — accepts the expanded attribution shape for verified GA4 purchase events.

## 5. Event Coverage

| Event / stage | `browser_language` | `site_locale` | Geo | Payment linkage |
|---|---:|---:|---:|---:|
| Face Shape Detector client events | Yes | Yes | Not inferred | Session context available |
| Face Shape Detector server usage | Browser request context where available | Validated body field | No third-party geo | Not a payment event |
| Face Analysis submit/completed | Client analytics and request context | Validated form field and event context | No third-party geo | Session context available |
| Pricing interaction (`view_pricing`, `click_purchase_button`) | Yes | Yes | No | `pricing_locale` frozen in session attribution |
| `checkout_requested` | Attribution plus request `accept_language` | Yes | No client geo | Yes, before redirect |
| `checkout_created` | Attribution plus request `accept_language` | Yes | No client geo | Pending Payment row + Stripe metadata |
| `payment_fulfilled` / verified purchase | Payment attribution | Checkout attribution retained | Stripe billing geo when present | Yes |
| `locale_changed` | Yes when browser API exists | `from_locale` and `to_locale` explicit | No | Session flag is carried into later Payment attribution |

No broad UI interaction event expansion was added.

## 6. Payment Attribution

The existing Payment `attribution` JSON remains the persistence path; no new Payment columns were added.

Typical pending and completed Payment attribution now retains:

```json
{
  "landing_locale": "en",
  "pricing_locale": "en",
  "checkout_locale": "en",
  "site_locale": "en",
  "browser_language": "ar-AE",
  "browser_languages": ["ar-AE", "en-US", "en"],
  "locale_changed": false
}
```

On signed Checkout completion, Stripe billing fields are merged when supplied:

```json
{
  "geo_country": "AE",
  "geo_region": "Dubai"
}
```

The verified `/api/payment/conversion` response returns the same sanitized attribution, so the GA4 `purchase` event uses the server-verified Payment record rather than browser-only state after redirect.

## 7. Locale Change Tracking

The existing language switcher emits `locale_changed` with:

- `from_locale`
- `to_locale`
- `site_locale` set to the destination locale
- current path
- browser language fields when available

It also sets an existing-session flag. No new anonymous ID or fingerprint is created. GA4's existing client/session identity remains the anonymous stitching mechanism; authenticated user identity remains governed by the existing auth/analytics setup.

## 8. Privacy Review

The new tracking does not add:

- email
- name
- address
- full IP
- Cookie
- Authorization
- Stripe card information
- fingerprinting or third-party IP enrichment

`Accept-Language` is limited to 256 characters and is stored as a raw preference header only. Existing request logging behavior is otherwise unchanged; this change does not add full request headers or a new IP field. Stripe country/region is billing geo and is not treated as inferred language or visit geo.

## 9. Tests

Added or updated coverage for:

- `ar-AE` browser on `/en/face-shape-detector` → `browser_language=ar-AE`, `site_locale=en`.
- `de-DE` browser on `/de/pricing` → `pricing_locale=de`, then separate `checkout_locale`.
- `/en` → `/ar` → `locale_changed` with from/to locales.
- ordinary English browser behavior.
- unavailable `navigator.language` / `navigator.languages` without a JS error.
- missing `Accept-Language` without a server error.
- checkout attribution retaining landing/pricing/checkout/browser fields.
- Stripe billing geo attachment without adding a `language` inference.
- no unrelated `authorization` or `cookie` headers in request context.

## 10. Local Validation

- `npm run typecheck` — passed after local Prisma client generation.
- Targeted Jest suites for analytics attribution, campaign migration, Stripe helpers, create-session route, webhook route, and request language context — passed.
- `git diff --check` — passed.

The initial typecheck before `prisma generate` reported repository-wide missing generated Prisma types; `npx prisma generate` was then run locally only. It did not connect to a database or run a migration.

## 11. Schema / Migration

**REQUIRED:** No database migration required.

**NOT REQUIRED:** New Payment columns. The current `Payment.attribution Json?` is sufficient for the minimal long-lived language/geo context. Axiom remains the richer event context store.

## 12. Future Queries Enabled

After deployment data begins accumulating, the existing Payment/Axiom data can support queries such as:

1. Completed UAE billing payments with an Arabic-primary browser using English site locale:

```text
status = COMPLETED
AND attribution.geo_country = "AE"
AND attribution.browser_language startsWith "ar"
AND attribution.site_locale = "en"
```

2. Completed revenue by `browser_language` and `site_locale`.

3. Browser/site locale mismatch, for example `browser_language` primary language differs from `site_locale`.

4. Payments where `attribution.locale_changed = true`.

5. Revenue by Stripe billing country/region, browser language, landing locale, Pricing locale, and Checkout locale.

## 13. Risks / Edge Cases

- Browser APIs can be unavailable or privacy-restricted; the system records an absent value instead of inventing one.
- `Accept-Language` may be absent or reflect browser configuration rather than a user's preferred/native language.
- Stripe billing country/region is only present when Checkout supplies the address; missing values remain unknown rather than being derived from IP or country-language assumptions.
- Historical Payments do not gain retroactive language context.
- A user who changes locale before the first event may have no observable `locale_changed` event; the session flag is reliable once the existing switcher is used.
- Attribution remains compact to respect Stripe metadata limits; lower-value acquisition fields may be dropped before the canonical language/payment fields.

## 14. Final Verdict

**CAN WE RELIABLY ANSWER THE LANGUAGE CONTEXT OF FUTURE PAYERS? — YES, for the normal tracked Checkout flow.**

Future verified Payments can be linked to browser language, browser preference order, landing locale, Pricing locale, Checkout locale, current site locale, and explicit locale changes through the existing Payment attribution path. Billing country/region is also linked when Stripe Checkout provides it. Cases where the browser or Stripe omits a value are represented as unknown; the implementation intentionally does not infer or fabricate those values.
