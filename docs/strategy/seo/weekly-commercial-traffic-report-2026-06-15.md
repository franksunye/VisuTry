# Weekly Commercial Traffic Report

Week: 2026-06-15
Owner: Codex

## KPI Snapshot

| KPI | Target | Actual | Status | Note |
| --- | ---: | ---: | --- | --- |
| Indexed priority URLs | 8/8 | 2/8 confirmed indexed | Watch | `/en/face-analysis` and `/en/glasses-for-face-shape` are indexed in the `www` property. |
| Commercial query impressions | 300+ / 30 days | 19 in new `www` GSC property | Watch | New `www` property currently has data only for 2026-06-11 to 2026-06-12. |
| Commercial organic clicks | 15+ / 30 days | 2 in new `www` GSC property | Watch | Both clicks were branded/homepage, not commercial pages yet. |
| US CTR on target pages | 1.2%+ | 0% in new `www` GSC property | Watch | US: 0 clicks / 5 impressions in the new property. |
| Commercial action rate | 5%+ | Needs GA exploration report | Pending | GA has commercial events, but this needs sessions by commercial landing page. |
| Try-on start rate | 3%+ | Needs GA exploration report | Pending | `try_on_start` exists, but rate needs landing-session denominator. |
| Face analysis upload rate | 5%+ | Needs GA exploration report | Pending | GA shows face-analysis events, but upload did not appear in the top 16 event rows. |
| Try-on continuation rate | 12%+ | 0 observed | Watch | `try_on_from_face_analysis` did not appear in the event report. |
| Paid-intent action count | 5+ / 30 days | 16 `view_pricing`, 7 `begin_checkout`, 7 `click_purchase_button` | On track | GA events report, 2026-05-18 to 2026-06-14. |
| Blog bridge clicks | 10+ / 30 days | 0 observed | Watch | `blog_funnel_click` did not appear in the event report. |

## GSC Findings

- Sitemap status: `https://www.visutry.com/sitemap.xml` is successful in the canonical `www` property.
- Sitemap last read: 2026-06-14.
- Discovered pages: 252.
- New `www` performance data is limited to 2026-06-11 through 2026-06-12.
- New `www` GSC totals: 2 clicks, 19 impressions, 10.5% CTR, average position 8.8.
- Query rows: `visutry` 1 click / 5 impressions; `visu try` 1 / 1; `visutry ai virtual try-on platform` 0 / 1; `virtual try-before-you-buy` 0 / 1.
- Page rows: homepage 2 clicks / 11 impressions; Japanese AI try-on tools blog 0 / 11; English Oliver Peoples page 0 / 1.
- Country rows: France 1 click / 1 impression; Serbia 1 / 1; United States 0 / 5; Germany 0 / 1.

## Priority URL Indexing

| URL | GSC status on 2026-06-15 | Action |
| --- | --- | --- |
| `/en/face-analysis` | Indexed | Requested indexing again after update. |
| `/en/try-on/glasses` | Crawled, not indexed | Requested indexing. |
| `/en/glasses-for-face-shape` | Indexed | Requested indexing again after update. |
| `/en/blog/ai-face-analysis-for-glasses-guide` | Discovered, not indexed | Included in support-page reindexing batch. |
| `/en/blog/how-to-choose-glasses-for-your-face` | Crawled, not indexed | Included in support-page reindexing batch. |
| `/en/blog/best-ai-virtual-glasses-tryon-tools-2025` | Alternate page with proper canonical tag | Requested indexing; canonical bug found and fixed in code. |
| `/en/blog/oliver-peoples-finley-vintage-review` | Needs recheck after previous request | Previously requested on 2026-06-12. |
| `/de/blog/oliver-peoples-finley-vintage-review` | Alternate page with proper canonical tag | Previously requested on 2026-06-12. |

## GA Commercial Action Findings

GA homepage, past 7 days:

- Active users: 88.
- Event count: 619.
- Key events: 0.
- New users: 86.
- Organic Search sessions: 25.
- Organic Shopping sessions: 1.
- Top page titles include `AI Glasses Try-On from Photo or Screenshot | VisuTry` with 30 views and `Virtual Glasses Try On Online from Photo | VisuTry` with 24 views.

GA Events report, 2026-05-18 to 2026-06-14:

- `view_pricing`: 16 events / 9 users.
- `quota_exhausted_cta`: 32 events / 25 users.
- `begin_checkout`: 7 events / 4 users.
- `click_purchase_button`: 7 events / 4 users.
- `try_on_start`: 5 events / 4 users.
- `face_analysis_start`: 1 event / 1 user.
- `face_analysis_complete`: 1 event / 1 user.
- `face_analysis_signin_click`: 1 event / 1 user.
- `blog_funnel_click`: not observed in the top 16 event rows.
- `try_on_from_face_analysis`: not observed in the top 16 event rows.

## Decision

This week's highest-leverage SEO action:

Fix canonical metadata for all locale blog pages that still used the old non-locale `generateSEO` helper. GSC showed the English AI try-on tools page declaring `https://visutry.com/blog/...` as canonical, while Google selected the Japanese URL. This is a commercial SEO blocker.

This week's highest-leverage commercial-conversion action:

Do not change pricing or CTAs yet. GA already shows pricing views, checkout starts, purchase-button clicks, and try-on starts. The next conversion action should be measurement refinement: build an exploration or report that calculates commercial action rate by landing page.

## Next Actions

- [x] Request indexing for `/en/face-analysis`, `/en/try-on/glasses`, and `/en/glasses-for-face-shape`.
- [x] Recheck canonical metadata after GSC exposed a blog canonical mismatch.
- [x] Fix locale-aware canonical metadata for blog index, tag pages, and old commercial blog pages.
- [ ] After deployment, verify production canonical for `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`.
- [ ] After deployment, request indexing again for fixed canonical blog pages if production canonical is correct.
- [ ] Build a GA exploration or saved report for commercial action rate by landing page.
