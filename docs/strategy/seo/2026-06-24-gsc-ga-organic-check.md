# VisuTry GSC and GA Organic Check

Date checked: 2026-06-24 13:43 CST
Data sources: Google Search Console and Google Analytics via logged-in Chrome
Property: `https://www.visutry.com/` in GSC, `AI-2024 / visutry.com` in GA

## Executive Read

Organic search is not dead. It is small, but it is already one of the highest-quality channels.

The biggest issue is not only low content volume. Google is seeing a large number of 404 URLs and many crawled-but-not-indexed URLs. That is likely wasting crawl attention and weakening the clean SEO surface.

## Google Search Console

### Performance

Time range selected in GSC: `3 months`.

The chart only showed data from 2026-06-11 to 2026-06-22, so the usable SEO signal is still new.

| Metric | Value |
| --- | ---: |
| Total clicks | 24 |
| Total impressions | 511 |
| Average CTR | 4.7% |
| Average position | 11.5 |
| Last updated | 19.5 hours before check |

Top queries:

| Query | Clicks | Impressions |
| --- | ---: | ---: |
| `visutry` | 7 | 17 |
| `face shape detector` | 3 | 5 |
| `visu try` | 1 | 2 |
| `choosing the right ai glasses` | 0 | 7 |
| `which glasses suit my face ai free` | 0 | 6 |
| `face analysis for glasses` | 0 | 5 |
| `which glasses suit my face ai` | 0 | 4 |
| `face shape detector for glasses` | 0 | 4 |
| `glasses face shape guide` | 0 | 3 |
| `ai face shape detector for glasses` | 0 | 3 |

Top pages:

| Page | Clicks | Impressions |
| --- | ---: | ---: |
| `/` | 10 | 68 |
| `/en/blog/ai-face-analysis-for-glasses-guide` | 7 | 292 |
| `/en/face-analysis` | 7 | 56 |
| `/ja/blog/best-ai-virtual-glasses-tryon-tools-2025` | 0 | 86 |
| `/auth/signin` | 0 | 15 |
| `/ru/blog/oliver-peoples-finley-vintage-review` | 0 | 15 |
| `/en/glasses-for-face-shape` | 0 | 13 |
| `/en/blog/tag/Face Shape` | 0 | 8 |
| `/blog/best-glasses-for-face-shapes-guide` | 0 | 8 |
| `/ru/blog/tag/Virtual Try-On` | 0 | 6 |

Interpretation:

- Brand search exists, but the non-brand query `face shape detector` already produced clicks.
- `/en/blog/ai-face-analysis-for-glasses-guide` has the largest impression base, but only 7 clicks from 292 impressions. This is the first CTR/title/meta candidate.
- `/en/face-analysis` has both clicks and commercial relevance. It should remain the main SEO conversion page.
- Some indexed/search-visible pages are not ideal commercial destinations, such as `/auth/signin` and tag pages.

### Indexing

| Status | Count |
| --- | ---: |
| Indexed | 67 |
| Not indexed | 1,051 |

Not-indexed reasons:

| Reason | Count |
| --- | ---: |
| Not found (404) | 683 |
| Crawled - currently not indexed | 243 |
| Alternate page with proper canonical tag | 94 |
| Page with redirect | 28 |
| Soft 404 | 1 |
| Excluded by `noindex` tag | 1 |
| Duplicate, Google chose different canonical than user | 1 |

404 examples:

| URL | Last crawled |
| --- | --- |
| `/blog/oliver-peoples-finley-vintage-review` | 2026-06-11 |
| `/blog/best-ai-virtual-glasses-tryon-tools-2025` | 2026-06-06 |
| `/blog/tag/Eyewear Tips` | 2026-05-30 |
| `/blog/tag/Face Shape` | 2026-05-30 |
| `/fr/share/cmgj3kzkl0009dkiryg9ipiw4` | 2026-05-21 |
| `/blog/tag/Style Inspiration` | 2026-05-20 |
| `/share/cmgj3kzkl0009dkiryg9ipiw4` | 2026-05-16 |
| `/blog/tag/Product Review` | 2026-05-13 |
| `/blog/tag/Online Shopping` | 2026-05-08 |
| `/blog/tag/Eyeglass Materials` | 2026-05-08 |

Interpretation:

- The 404 problem appears concentrated in old/unprefixed blog paths, tag paths, and share URLs.
- This likely needs redirect cleanup, sitemap cleanup, or intentional `noindex`/404 handling depending on whether those URLs used to exist.
- Do not request validation in GSC until the URL handling is fixed.

## Google Analytics

### Home Overview

Time range: past 7 days.

| Metric | Value | Change |
| --- | ---: | ---: |
| Active users | 263 | +148.1% |
| Event count | 1,244 | +50.6% |
| Key events | 36 | +350.0% |
| New users | 257 | +147.1% |

Country/user signal:

| Country | Active users |
| --- | ---: |
| Singapore | 161 |
| United States | 24 |
| China | 14 |
| France | 9 |
| India | 6 |
| Netherlands | 5 |
| Hungary | 4 |

Page-title signal:

| Page title | Views |
| --- | ---: |
| AI Glasses Try-On, Face Analysis, and Frame Compare \| VisuTry | 106 |
| AI Face Shape Detector for Glasses \| VisuTry | 76 |
| Virtual Glasses Try On Online from Photo \| VisuTry | 22 |
| Sign In - AI Virtual Try-On \| VisuTry | 21 |

Event signal:

| Event | Count |
| --- | ---: |
| `page_view` | 457 |
| `session_start` | 277 |
| `first_visit` | 257 |
| `user_engagement` | 86 |
| `scroll` | 48 |
| `face_analysis_signin_click` | 34 |
| `face_analysis_upload` | 20 |

Interpretation:

- The face-analysis flow is producing real product actions.
- The Singapore spike should be treated cautiously until source/referrer/user-quality is checked. It may include tests, bot-like traffic, or unattributed traffic.

### Traffic Acquisition

Time range: past 28 days, 2026-05-27 to 2026-06-23.

| Channel | Sessions | Engaged sessions | Engagement rate | Avg engagement / session | Events | Key events | Session key event rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Total | 623 | 243 | 39% | 27s | 3,474 | 44 | 3.05% |
| Direct | 307 | 35 | 11.4% | 7s | 1,164 | 4 | 1.3% |
| Organic Search | 114 | 90 | 78.95% | 55s | 947 | 19 | 6.14% |
| Unassigned | 85 | 53 | 62.35% | 57s | 650 | 13 | 5.88% |
| Referral | 59 | 31 | 52.54% | 22s | 306 | 0 | 0% |
| AI Assistant | 45 | 30 | 66.67% | 42s | 373 | 8 | 6.67% |
| Organic Shopping | 7 | 0 | 0% | 0s | 14 | 0 | 0% |
| Organic Social | 5 | 4 | 80% | 19s | 20 | 0 | 0% |

Interpretation:

- Organic Search is the best validated quality channel: 18.3% of sessions but 43.18% of key events.
- AI Assistant is also high quality, but smaller.
- Direct is large but low quality; attribution cleanup may be needed.

### GA Search Console Report

Time range: past 28 days.

| Metric | Value |
| --- | ---: |
| Google organic clicks | 28 |
| Google organic impressions | 673 |
| Organic CTR | 4.16% |
| Average position | 6.87 |
| Active users | 40 |
| Engaged sessions | 38 |
| Engagement rate | 84.44% |
| Avg engagement / active user | 1m 06s |
| Events | 400 |
| Key events | 15 |

Top landing pages in this GA Search Console view:

| Landing page | Clicks | Impressions | CTR | Avg position | Key events |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/ru` | 21 | 53 | 39.62% | 4.02 | 0 |
| `/ru/auth/signin` | 3 | 23 | 13.04% | 1.52 | 0 |
| `/de/blog/oliver-peoples-finley-vintage-review` | 2 | 475 | 0.42% | 7.25 | 0 |
| `/es/blog/browline-clubmaster-glasses-complete-guide` | 1 | 73 | 1.37% | 7.64 | 0 |
| `/pt` | 1 | 26 | 3.85% | 9.77 | 0 |

Interpretation:

- This GA Search Console report does not line up perfectly with the GSC `https://www.visutry.com/` performance table. Treat it as directional, not the source of truth for exact query/page SEO performance.
- It still reinforces that multilingual SEO pages are being discovered.
- The `/de/blog/oliver-peoples-finley-vintage-review` page has high impressions and very poor CTR. It may be a CTR/title mismatch or wrong-intent article.

## What Is Worth Acting On

### P0: Fix the 404 Surface

Google sees 683 not-found URLs. First inspect whether these are:

- old non-locale blog URLs that should redirect to `/en/blog/...`,
- tag pages that should redirect or be removed from sitemap,
- share URLs that should be `noindex` or expire cleanly,
- stale URLs still present in sitemap or internal links.

Expected outcome:

- fewer 404 examples in GSC,
- cleaner crawl surface,
- better chance that new commercial pages get indexed faster.

### P0: Double Down On Face Analysis SEO

Evidence:

- `face shape detector` already has 3 clicks from 5 impressions.
- `/en/face-analysis` has 7 clicks from 56 impressions.
- `face_analysis_upload` reached 20 events in GA over the past 7 days.
- Organic Search generated 19 key events in the past 28 days.

Actions:

- Keep `/en/face-analysis` as the main SEO landing page.
- Add stronger internal links from blog pages to `/en/face-analysis`.
- Add above-the-fold text that matches `face shape detector for glasses`, `which glasses suit my face ai`, and `face analysis for glasses`.

### P1: Improve CTR For The Main English Guide

Page:

```text
/en/blog/ai-face-analysis-for-glasses-guide
```

Current signal:

- 7 clicks from 292 impressions.

Actions:

- Rewrite title/meta around the query family:
  - `AI Face Shape Detector for Glasses`
  - `Which Glasses Suit My Face?`
  - `Face Analysis for Glasses`
- Make the snippet promise a practical next step: face analysis plus try-on, not a generic guide.

### P1: Separate Brand, Commercial, And Blog Search Surfaces

Current clicks split across:

- homepage,
- face-analysis page,
- article pages,
- localized homepages,
- sign-in page.

Actions:

- Keep sign-in pages out of search if they do not need to rank.
- Ensure commercial pages have clear canonical and sitemap inclusion.
- Do not let tag pages compete with commercial pages.

### P2: Investigate Direct And Singapore Traffic

Direct generated 307 sessions but only 4 key events. Singapore had 161 active users in the past 7 days.

Actions:

- Check whether Singapore traffic is owner/testing, Vercel/infra, bot, or a real external source.
- Add UTM hygiene to outreach/community posts so useful traffic does not collapse into Direct.

## Immediate Next Steps

1. Audit sitemap and internal links for old `/blog/...`, `/blog/tag/...`, and `/share/...` URLs.
2. Decide redirect policy:
   - `/blog/{slug}` -> `/en/blog/{slug}` where an English article exists.
   - `/blog/tag/{tag}` -> `/en/blog/tag/{tag}` or remove/noindex if weak.
   - `/share/{id}` -> noindex/expired handling unless public sharing is meant to rank.
3. Update title/meta for `/en/blog/ai-face-analysis-for-glasses-guide`.
4. Add internal links from the high-impression guide to `/en/face-analysis` and `/en/try-on/glasses`.
5. Review GA source quality for Organic Search key events and Singapore Direct traffic.

## Implementation Log

Completed on 2026-06-24:

- Added permanent redirects for legacy non-locale paths:
  - `/blog/tag/:tag` -> `/en/blog/tag/:tag`
  - `/blog/:slug` -> `/en/blog/:slug`
  - `/tag/:tag` -> `/en/blog/tag/:tag`
  - `/share/:id` -> `/en/share/:id`
- Confirmed sitemap output contains no legacy `https://www.visutry.com/blog/...` URLs.
- Confirmed sitemap includes the localized target article URLs, including `/en/blog/ai-face-analysis-for-glasses-guide`.
- Updated the target article title/meta from the broad "free AI face analysis guide" angle to the higher-intent query family:
  - `AI Face Shape Detector for Glasses`
  - `Which Glasses Suit My Face?`
- Added stronger internal links from the target article to `/en/face-analysis` using the exact commercial anchor `AI face shape detector for glasses`.
- Added `robots: noindex, follow` to localized share pages so user result pages can still be shared but do not become SEO landing pages.

Verification:

- `npm run lint` passed with existing warnings only.
- Sitemap function sample returned `hasLegacyBlog: false` and included `https://www.visutry.com/en/blog/ai-face-analysis-for-glasses-guide`.
- Next redirect config sample includes the new legacy URL redirect rules.
- Local HTTP verification returned `308 Permanent Redirect` for:
  - `/blog/oliver-peoples-finley-vintage-review` -> `/en/blog/oliver-peoples-finley-vintage-review`
  - `/blog/tag/Face%20Shape` -> `/en/blog/tag/Face%20Shape`
  - `/share/cmgj3kzkl0009dkiryg9ipiw4` -> `/en/share/cmgj3kzkl0009dkiryg9ipiw4`
- Local HTML verification confirmed the target article renders the new title, meta description, and two `/en/face-analysis` links with the anchor `AI face shape detector for glasses`.

Recommended follow-up after deployment:

1. Open GSC URL inspection for representative old URLs, such as `/blog/oliver-peoples-finley-vintage-review`, and confirm Google sees a redirect instead of 404.
2. Submit the updated sitemap.
3. Request validation for the 404 issue only after the deployment is live and a few representative URLs return the expected redirects.
