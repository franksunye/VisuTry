# VisuTry Growth KPI Operating Plan

Date: 2026-06-12
Owner: Codex
Scope: Face analysis to glasses try-on growth

## North Star

Organic-search users who complete face analysis and continue into glasses try-on.

This is the best single KPI because it connects SEO traffic to the commercial model: VisuTry is not only a face-analysis tool; face analysis should help shoppers decide which glasses to try on.

## Current Baseline

Source: Google Search Console research on 2026-06-12, last 3 months.

- Total GSC clicks: 83.
- Total GSC impressions: 2,082.
- Overall CTR: 4%.
- United States: 7 clicks, 1,010 impressions, 0.7% CTR.
- Target face-analysis and try-on terms are mostly missing from current GSC query data.
- Existing non-brand opportunity is concentrated in Oliver Peoples review traffic.

## 30-Day Targets

These are intentionally practical. The first 30 days should prove that Google can index the funnel pages, that the right queries start appearing, and that GA can measure the product path.

| KPI | 30-day target | Measurement source | Why it matters |
| --- | ---: | --- | --- |
| Indexed priority URLs | 8/8 priority URLs indexed or submitted for re-crawl | GSC URL inspection | No indexing means no SEO growth. |
| Core query impressions | 300+ impressions from target eyewear-intent query groups | GSC query report | The current target-query baseline is near zero, so early growth is visibility. |
| Core organic clicks | 15+ clicks to priority commercial pages | GSC page report | Click volume should start moving before revenue can move. |
| US CTR on target pages | 1.2%+ | GSC country/page report | US baseline is 0.7%; first target is fixing SERP relevance. |
| Face analysis upload rate | 5%+ of `/face-analysis` sessions | GA events | Upload is the first real product commitment. |
| Face analysis completion rate | 50%+ upload to complete | GA events | Completion validates the feature experience. |
| Try-on continuation rate | 12%+ complete to `try_on_from_face_analysis` | GA events | This proves face analysis is feeding the try-on funnel. |
| Blog bridge clicks | 10+ `blog_funnel_click` events | GA events | Review traffic must start entering the product path. |

Priority URLs:

- `/en/face-analysis`
- `/en/try-on/glasses`
- `/en/glasses-for-face-shape`
- `/en/blog/ai-face-analysis-for-glasses-guide`
- `/en/blog/how-to-choose-glasses-for-your-face`
- `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`
- `/en/blog/oliver-peoples-finley-vintage-review`
- `/de/blog/oliver-peoples-finley-vintage-review`

Target query groups:

- `glasses try on`
- `virtual glasses try on`
- `try on glasses online`
- `what glasses suit my face`
- `face shape glasses`
- `glasses for face shape`
- `face shape detector for glasses`
- `face shape detector online free`
- `try on glasses ai`
- `try on glasses app`

## 90-Day Targets

The 90-day target should be outcome-oriented, but still grounded in the current small baseline.

| KPI | 90-day target |
| --- | ---: |
| Core query impressions | 1,500+ impressions from target query groups |
| Core organic clicks | 60+ clicks to priority commercial pages |
| US CTR on target pages | 2%+ |
| Face analysis upload rate | 8%+ |
| Face analysis completion rate | 60%+ |
| Try-on continuation rate | 20%+ |
| Organic users completing face analysis and entering try-on | 2x the first measured 30-day baseline |

## Weekly Operating Rhythm

Every week:

1. Pull GSC query, page, country, and CTR data for the target query groups.
2. Pull GA event counts for:
   - `face_analysis_upload`
   - `face_analysis_complete`
   - `try_on_from_face_analysis`
   - `face_analysis_unlock_success`
   - `blog_funnel_click`
3. Compare actuals against the 30-day target run rate.
4. Choose one page-level SEO action and one funnel action.
5. Record decisions in the weekly growth report.

## Decision Rules

- If impressions are low: improve indexing, internal links, and topical coverage before writing new content.
- If impressions grow but CTR stays low: rewrite titles, meta descriptions, and first-screen SERP promise.
- If clicks grow but upload rate is low: improve `/face-analysis` first-screen clarity, privacy reassurance, and upload CTA.
- If uploads happen but completions are low: inspect face-analysis UX, error states, and processing expectations.
- If completions happen but try-on continuation is low: make recommended frames more visible and add stronger try-on CTAs inside the report.
- If blog bridge clicks are low: improve CTA placement and match CTA language to the article's original search intent.

## Current Next Actions

- Recheck the `www` sitemap status in GSC after the new property finishes processing.
- After the latest AEO copy deployment, request indexing for:
  - `/en/face-analysis`
  - `/en/try-on/glasses`
  - `/en/glasses-for-face-shape`
- Produce the first weekly funnel report once GA has at least one full day of event data after deployment.
