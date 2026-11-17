# VisuTry GEO sitewide content audit · 2026-11-17

**Status:** Broad source/content audit complete; code implementation and CI are independent release gates. This is evidence under the canonical GTM at docs/strategy/analytics/gtm.md, not a parallel GTM strategy.
**Tracking:** Issue #533 GEO recovery; Issue #532 weekly SEO/GEO ledger; existing Wave 1 and Guide Draft PR #520 remain protected.

## 1. Audited inventory and first-party signals

Google Search Console Web 2026-10-19 through 2026-11-15, 28 complete days, returned 413 URL rows **with Google search impressions**. This does not equal indexed page count or total page inventory.

| Page family | URL rows | Clicks | Impressions | Decision |
| --- | ---: | ---: | ---: | --- |
| Face Shape Detector | 9 | 2,431 | 69,579 | Preserve successful existing owner and current observation clock |
| Blog articles | 24 | 1,206 | 34,662 | Improve internal task navigation and original buying examples |
| Curated brand pages | 7 | 599 | 4,909 | Clarify independent editorial illustrations vs official SKUs |
| Advisor / face analysis | 15 | 474 | 9,527 | Surface clear credit-based personalized value |
| Try-On and related | 48 | 140 | 9,407 | Clarify two-input exact image vs built-in preset Compare |
| Glasses Guide | 152 | 33 | 3,783 | Audit per owner; NO new mass variants |
| Style by face shape | 36 | 3 | 470 | Low independent Google Web performance; no mass expansion |
| Sunglasses by face shape | 27 | 8 | 215 | Low independent Google Web performance; no mass expansion |
| Face-shape references | 4 | 1 | 303 | Useful educational asset, not proven separate acquisition |
| Merchant pages | 2 | 0 | 39 | Separate business search and attribution from consumer |
| Other paths | 89 | 581 | 15,478 | Review separately; no inference of zero-traffic/index status |

GA4 2026-10-20 through 2026-11-16: first landing sessions from AI Assistant were EN Try-On 102, EN FAQ 95, EN home 81, EN Advisor 56, EN Detector 31. Separate matched 13 days AI Assistant 317 to 207 (-34.7%) vs Organic Search 2,515 to 3,007 (+19.6%). These are referrals, NOT AI citation counts. Product event totals are not unique users or verified payment revenue.

2026-11-17 production Vercel build generated 1,810 static pages/routes; **this is not 1,810 unique English content articles**. Current editorial index contains 14 published blog posts, 9 curated brand guide slugs and 6 Search-to-Tool route slugs. Other pages arise from localized and programmatic families.

## 2. Verified consumer and merchant product boundaries

Primary sources: src/lib/product-positioning.ts, src/config/pricing.ts, current public product routes, messages/en.json, public/llms.txt and Merchant Store routes.

1. The on-device Face Shape Detector is free and no-login, with face photo processed locally. It does not expose credit-gated Advisor Top Picks.
2. Glasses Advisor is a credit-based personalized report from an uploaded portrait; it is distinct from general shape-based editorial guidance.
3. Custom Virtual Try-On needs the shopper's own portrait PLUS a clear product image or permitted retailer screenshot. VisuTry is not an official retailer inventory search or a calibrated fit measurement.
4. Frame Compare generates up to four built-in preset frame looks from one portrait, using credits per generated frame. It does not import four arbitrary products or verify brands/SKUs.
5. Printed 52-18-145 describes lens, bridge and temple dimensions, NOT full external width; visual try-on cannot validate physical fitting, optical prescriptions or comfort.
6. Merchant Store is a separate catalog-to-hosted-experience and shopper intent surface. Store URL import is currently paused; do not promise a live Shopify plugin, an autonomous purchasing API or guaranteed sales.
7. Current pricing config defaults to one free credit and a $2.99/30-credit one-time pack, but environment overrides exist; content should link to live Pricing instead of introducing an unverified hardcoded claim.

## 3. Sitewide content diagnosis and production dispositions

| Family | Source-observed issue | Content treatment |
| --- | --- | --- |
| EN homepage | Four generic sequence steps can be read as a mandatory funnel | Explicit task-first choice: skip steps where appropriate |
| EN Face Analysis | Personalized paid Advisor sometimes conflated with free detector | State credit-based report/Top Picks boundary |
| EN Try-On | Real image input vs exact retailer SKU unclear | Input/output/limitations and measurement handoff |
| EN Frame Compare | Four preset looks can be mistaken for 4 custom uploaded products | Exact built-in preset/credit disclosure |
| Six EN Search-to-Tool owners | Similar CTAs can blur user jobs | Six distinct job-specific short factual answer blocks, exact path allowlist |
| EN Glasses Guide hub | 152 guide URL rows with just 33 GSC clicks | One interpretation-to-action answer at hub; no blanket injection to all combinations |
| Blog hub and two decision guides | Flat article catalog and incomplete exact-vs-preset connection | Task-led reading navigation and specific illustrated decision steps |
| Curated brand 9-owner template | Brand naming may imply an official SKU catalog | Move independent/illustrative disclosure near hero, keep existing editorial cards |
| EN Merchant Store | Consumer and Merchant value may blur | Explain catalog-to-Store-intent role without inventing integrations or realized sales |
| EN/JA/ES Detector, EN paid Advisor Guide | High-value current Wave 1 and Draft #520 observation | Protect existing canonical content/CTAs, do not churn |
| 152 guides, 36 style, 27 sunglasses observed URLs | Weak search performance, possible overlapping intent and thin translated variants | NO new mass page creation; exact GSC index/query×URL and localization study before pruning |
| Localized blog shells | Historical ledger reports English body text under multiple locale shells | Risk flagged; do not blanket noindex/redirect without canonical/hreflang review and preserving independently useful native pages |
| Machine-readable markup | Existing FAQPage and SoftwareApplication are not AI ranking shortcuts; generic SoftwareApplication free-trial offer is ambiguous | Avoid schema proliferation, keep visible facts accurate; separately validate real price and Google's strict rich-result requirements |
| AI crawler | robots permits OAI-SearchBot, training GPTBot disallowed separately | Actual Cloudflare verified bot WAF/citation reports remain unavailable; no speculative bot rule changes |

## 4. Engineering scope & evaluation

This batch implements actual visible, server-rendered distinct task explanations, handoffs and limits across existing EN product entries, search-intent landings, blog/guide navigation, curated brand template and Merchant Store. No URLs, migrations, payment or AI provider calls, credits, robots, canonicals, sitemap or customer photo permissions are modified.

Source-of-truth docs remain GTM v3.4 and seo-backlog.md. A new audit evidence file must not become a parallel marketing strategy. Exact-head unit + real Chromium desktop/430x932 tests, production READY and original-www HTTP/click QA gate any release.

Use existing independent GEO review automation Nov 24, Dec 1/8/15. Distinguish Google Search clicks from generative AI citation impressions, GA4 sessions from unique qualified visitors, and GA4 purchase events from verified settled payments. Need at least 7 complete post-release days for health and 28 full days for search/GEO directional assessment; root cause of November 7 referral drop remains INCONCLUSIVE without Google/Bing AI reports and Cloudflare verified-bot logs.

Source policy: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide ; https://developers.google.com/search/docs/appearance/ai-features ; https://developers.google.com/search/docs/specialty/international/localized-versions ; https://developers.google.com/search/blog/2023/08/howto-faq-changes.
