# VisuTry Paid Customer and SEO/GEO Relaunch Plan

**Date**: 2026-05-25

**Status**: Historical commercial foundation. Current SEO/GEO product and keyword ownership is defined in [2026-06-30 Product Architecture SEO/GEO Sync](./seo/2026-06-30-product-architecture-seo-geo-sync.md).

**Scope**: Product reinforcement for verified paid users, plus a targeted SEO/GEO restart after roughly 6 months without meaningful growth work.

**Primary goal**: Turn the first low-cost paid-user proof into a focused product and acquisition loop.

---

## 1. Why This Plan Exists

VisuTry has two new paid customers in May 2026. Both purchased the USD 2.99 Credits Pack. Together with the earlier non-test paid customer, this gives us a small but useful proof point:

- Users are willing to pay for a lightweight, no-subscription try-on product.
- The paid behavior is concentrated in glasses try-on, not the broader universal try-on categories.
- The immediate commercial path is likely a low-friction Credits Pack, not a subscription-first pricing push.

This plan intentionally stays narrow. It does not restart the old "1000+ programmatic pages" plan as the first move. The first move should be improving the path that already produced payments.

---

## 2. Customer Evidence

Source of truth: production payment and try-on task data, excluding the `franksunye` test account. Two historical no-email `Yeah` accounts were treated as likely test or migration data and are not used for the customer persona.

| Account | Payment | Usage signal | Working interpretation |
| --- | --- | --- | --- |
| `cartwrighthj` | USD 2.99 Credits Pack on 2026-01-16 | 30 credits purchased, 25 used | Earlier high-consumption buyer. Useful evidence that a low-cost pack can support repeated usage. |
| `florian.mahlknecht.95` | USD 2.99 Credits Pack on 2026-05-17 | 21 glasses tasks, 17 completed, 4 failed, 16 credits used | High-intent comparer. Tried many premium/designer frames such as Gucci, Versace, Tom Ford, Saint Laurent, Ralph Lauren, Le Specs, and Freyers. |
| `awais_ilyas` | USD 2.99 Credits Pack on 2026-05-24 | 3 glasses tasks, all completed, 2 credits used | Focused single-frame user. Repeated the same Univo frame with images that appear to come from mail/screenshots. |

Key customer pattern:

1. They buy credits, not subscriptions.
2. They use glasses try-on, not outfit/shoes/accessories.
3. One persona compares many frames; another validates one specific frame.
4. Reliability matters: one May customer hit a noticeable failed-task rate.

---

## 3. Product Strategy

### Positioning

Make VisuTry sharper before making it broader:

> Try on any glasses from a screenshot or product image, compare frames, and keep going with a USD 2.99 credit pack. No app install. No subscription required.

### Product Priorities

#### P0: Credits Pack Conversion Path

Goal: Make the proven USD 2.99 purchase path visible, trustworthy, and easy after the first successful try-on.

Tasks:

- Add a post-result upgrade prompt focused on credits: "Continue with 30 try-ons for USD 2.99. No subscription."
- Make the pricing page lead with Credits Pack for casual users, while keeping subscriptions available but secondary.
- Clarify that credits do not expire and that paid results are watermark-free/high quality if that is the actual product rule.
- Track the funnel: result viewed -> pricing viewed -> checkout started -> payment completed -> paid try-on used.

Acceptance:

- A free user who completes one try-on sees a clear Credits Pack CTA.
- Credits Pack is the easiest paid option to understand on mobile.
- GA4 or existing analytics can distinguish Credits Pack clicks from subscription clicks.

#### P0: Failed Task Recovery

Goal: Protect high-intent users who are comparing many frames.

Tasks:

- Review the `TryOnTask` failure path for external service `failed`, 502 polling, timeout, and retry handling.
- If a paid user task fails because of service or polling errors, do not consume a credit; if one was already consumed, restore it automatically.
- Show a retry action using the same uploaded user/item images.
- Add admin visibility for recent paid-user failed tasks.

Acceptance:

- Paid failed tasks caused by service errors are visible and auditable.
- Users can retry without re-uploading the same images.
- Credit consumption behavior is documented and covered by a focused test.

#### P1: Multi-Frame Comparison

Goal: Serve the `florian` persona directly.

Tasks:

- Add a lightweight "compare results" view in history or result flow.
- Allow selecting multiple completed results for side-by-side comparison.
- Add labels based on the uploaded item file name or selected frame name.
- Keep this as a simple grid first; do not build a full wardrobe or shopping system.

Acceptance:

- A user can compare at least 2-4 completed glasses results in one view.
- The comparison flow works on mobile.
- The result labels are clear enough to identify the frame.

#### P1: Screenshot/Product-Image Friendly Flow

Goal: Serve the `awais` persona directly.

Tasks:

- Improve upload copy for item image: "Upload a glasses product photo or screenshot."
- Add examples that show product screenshots are acceptable.
- Add validation guidance when the item image is unsuitable.
- Consider a future crop helper only if upload quality becomes a repeated issue.

Acceptance:

- Users understand they can use product images from email, store pages, or screenshots.
- Failed or poor-quality item images produce actionable guidance.

---

## 4. SEO/GEO Restart Strategy

### Current Reality

The existing SEO materials were mostly created around 2025-10. They include:

- SEO backlog under `docs/project/seo-backlog.md`
- GTM/SEO handbook under `docs/strategy/analytics/gtm.md`
- Programmatic SEO plan under `docs/strategy/seo/programmatic-seo-execution-plan.md`
- Existing blog and programmatic routes in the app

The site already has the skeleton for SEO, but the 2026 restart should be smaller and more targeted:

- Prioritize glasses try-on because paid users validate this category.
- Prioritize commercial-intent pages and comparison/helpful pages over broad generic content.
- Treat GEO as an extension of solid SEO: crawlability, structured data matching visible content, clear answers, original product evidence, and index freshness.

Current external guidance used for this restart:

- Google says standard SEO best practices still apply to AI features such as AI Overviews and AI Mode, with emphasis on crawlability, visible content, and structured data matching page content: https://developers.google.com/search/docs/appearance/ai-features
- Google people-first content guidance remains the quality baseline: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- IndexNow recommends automated URL submission when content is added, updated, or deleted: https://www.indexnow.org/documentation

### SEO/GEO Positioning

Primary cluster:

- AI glasses try-on
- virtual glasses try-on
- try on glasses from photo
- try on glasses from screenshot
- online glasses fitting
- designer glasses virtual try-on

Secondary clusters:

- Compare glasses frames online
- Try on designer glasses before buying
- Best AI virtual glasses try-on tools
- How to choose glasses online
- Virtual try-on for Ray-Ban, Gucci, Versace, Tom Ford, Saint Laurent, etc.

GEO answer targets:

- "What is the easiest way to try glasses from a screenshot?"
- "Can I try on designer glasses online before buying?"
- "What AI tool lets me upload my own glasses image?"
- "Which virtual glasses try-on tool works without installing an app?"
- "How can I compare multiple glasses frames on my face?"

---

## 5. 30-Day Execution Plan

### Week 1: Baseline and Conversion Fixes

Product:

- Implement or spec the post-result Credits Pack CTA.
- Audit paid-task failure and credit consumption behavior.
- Add/review analytics events for pricing and checkout funnel.

SEO/GEO:

- Verify current production sitemap and robots output.
- Check GSC/Bing indexing status for homepage, `/try-on`, pricing, and top blog pages.
- Audit current titles/descriptions for homepage, `/try-on`, pricing, and top glasses articles.
- Create a keyword-to-page map for the focused glasses cluster.

Deliverables:

- Baseline report with indexed pages, top queries if available, and crawl/indexing issues.
- Product implementation tickets for P0 work.

### Week 2: Page and Content Refresh

Product:

- Ship Credits Pack CTA improvements.
- Ship failed-task recovery or at least credit-safe behavior for paid service failures.

SEO/GEO:

- Refresh `/try-on` page copy around "upload your own glasses product image or screenshot."
- Refresh pricing page copy around the USD 2.99 Credits Pack as the casual-user default.
- Update the "best AI virtual glasses try-on tools" article with current product facts and stronger VisuTry differentiation.
- Add or update FAQ sections where visible content can support AI answers.

Deliverables:

- Updated product/pricing pages.
- Updated top article.
- Structured data checked against visible content.

### Week 3: Comparison and Long-Tail Pages

Product:

- Implement the first simple multi-result comparison view or a scoped prototype.

SEO/GEO:

- Create 3-5 focused supporting pages or article updates:
  - Try on glasses from a screenshot
  - Compare glasses frames online
  - Try on designer glasses before buying
  - Virtual try-on for sunglasses vs prescription glasses
  - Best way to choose glasses online with your own photo
- Add internal links from existing blog pages to `/try-on` and pricing with natural anchors.

Deliverables:

- Comparison MVP or prototype.
- 3-5 focused content updates/pages.
- Internal-link map updated.

### Week 4: Indexing, Monitoring, and Iteration

Product:

- Review paid-user behavior after CTA and failure-path changes.
- Send a short feedback email to the three paid customers, drafted for approval before sending.

SEO/GEO:

- Submit changed URLs through GSC URL Inspection where possible.
- Submit changed URLs through IndexNow/Bing.
- Check AI answer visibility manually for the main GEO questions in Google AI Mode/AI Overviews where available, Bing/Copilot, Perplexity, and ChatGPT browsing if accessible.
- Record what answer engines say about VisuTry and competitors.

Deliverables:

- D30 result summary.
- Next 30-day backlog based on evidence.

---

## 6. Implementation Backlog

### Product

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Credits Pack CTA after successful free try-on | Directly tied to the proven paid path. |
| P0 | Paid failed-task credit safety | Protects high-intent users and reduces support risk. |
| P0 | Analytics for Credits Pack funnel | Needed before deciding whether to push subscriptions. |
| P1 | Multi-result comparison view | Supports high-intent frame comparison. |
| P1 | Upload guidance for product screenshots | Supports users bringing item images from email/store pages. |
| P2 | Admin paid-user cohort view | Useful if paid users continue to grow. |

### SEO/GEO

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Technical SEO baseline | Sitemap, robots, canonical, structured data, GSC/Bing status. |
| P0 | Refresh `/try-on` and pricing copy | Align with paid-user evidence. |
| P0 | Update top comparison article | Keep current and differentiated for AI answers. |
| P1 | Add focused screenshot/comparison content | More likely to match AI-style questions than generic keywords. |
| P1 | IndexNow submission flow | Faster Bing and partner discovery after updates. |
| P1 | AI answer visibility check | Manual first; automate only if repeated. |
| P2 | Programmatic pages reboot | Only after the focused cluster shows signs of traction. |

---

## 7. Metrics

### Product Metrics

- Free try-on completion rate
- Post-result pricing click rate
- Credits Pack checkout start rate
- Credits Pack completion rate
- Paid task success rate
- Paid credits used within 7 days of purchase
- Repeat purchase count

### SEO/GEO Metrics

- Indexed URL count for core pages
- Organic sessions to homepage, `/try-on`, pricing, and top articles
- Queries and impressions for "AI glasses try-on", "virtual glasses try-on", "try on glasses from photo", and screenshot-related terms
- Click-through rate for refreshed pages
- AI answer mentions/citations for the target GEO questions
- Branded search trend after content/indexing updates

---

## 8. Guardrails

- Do not broaden product work away from glasses until the paid-user pattern changes.
- Do not lead with subscriptions until Credits Pack conversion is understood.
- Do not generate hundreds of thin programmatic pages before the focused cluster is validated.
- Do not claim brand partnerships or retailer support unless the product actually has it.
- Do not add structured data that is not reflected in visible page content.
- Do not send customer emails without explicit approval.

---

## 9. Immediate Next Steps

1. Run a technical SEO baseline on production.
2. Implement the post-result Credits Pack CTA.
3. Audit paid-task failure and credit consumption behavior.
4. Refresh `/try-on`, pricing, and the top comparison article around the validated glasses + screenshot + USD 2.99 credit-pack positioning.
5. Prepare a short customer feedback email draft for the three paid accounts.
