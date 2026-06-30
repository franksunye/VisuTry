# VisuTry Commercial Traffic KPI Operating Plan

Date: 2026-06-12
Revised: 2026-06-30
Owner: Codex
Scope: Website commercial traffic growth

## 2026-06-18 Goal Reset

The original 30-day targets remain the minimum floor. They are not large enough to solve the current small-sample problem, and SEO alone is unlikely to reach the desired traffic level within the remaining 24 days.

The operating strategy now runs three acquisition tracks in parallel:

1. Search demand capture through the existing indexed commercial cluster.
2. External distribution through useful demonstrations, community answers, and product directories.
3. Partner and publisher outreach for qualified referral traffic and links.

The revised sprint plan is documented in [External Growth Sprint](../growth/2026-06-18-external-growth-sprint.md).

### 30-Day Stretch Targets

| KPI | Original floor | Revised target | Measurement source |
| --- | ---: | ---: | --- |
| Indexed priority URLs | 8/8 | 8/8 | GSC URL inspection |
| Commercial query impressions | 300+ | 1,000+ | GSC target query groups |
| Commercial organic clicks | 15+ | 50+ | GSC priority pages |
| Qualified external sessions | Not defined | 200+ | GA organic, referral, social, and AI traffic with campaign UTMs |
| External high-value actions | Not defined | 20+ | GA product events attributed to external sessions |
| Blog bridge clicks | 10+ | 20+ | GA `blog_funnel_click` |
| External mentions or links | Not defined | 5+ | Placement and outreach log |
| Personalized outreach | Not defined | 30 | Outreach log |
| Serious partner or publisher replies | Not defined | 3+ | Outreach log |

Internal and owner test activity does not count toward qualified external sessions or external high-value actions. Until a formal internal-traffic filter is justified, attribution must use non-direct acquisition sources, campaign UTMs, and known-test-account exclusion in manual checks.

## North Star

Commercial-intent website visitors who take a high-value product action.

For VisuTry, a high-value product action means the visitor moves from discovery into an action that can create revenue or purchase intent:

- completes the free Face Shape Detector and continues to another product
- opens Glasses Advisor from a Detector result
- starts glasses try-on
- starts Glasses Advisor
- completes Glasses Advisor and continues into try-on
- views pricing or credit-pack information

The free Detector itself is an acquisition and activation event. Its commercial value is measured by result completion and continuation into Advisor, Try-On, Compare, content, Pricing, or purchase—not by charging for the first classification.
- unlocks a paid face-analysis or try-on outcome

Face analysis to glasses try-on is one important commercial path, but it is not the whole business KPI. The broader goal is to grow qualified traffic that can convert through any VisuTry commercial path.

## Current Baseline

Source: Google Search Console research on 2026-06-12, last 3 months.

- Total GSC clicks: 83.
- Total GSC impressions: 2,082.
- Overall CTR: 4%.
- United States: 7 clicks, 1,010 impressions, 0.7% CTR.
- Target face-analysis, try-on, and eyewear shopping terms are mostly missing from current GSC query data.
- Existing non-brand opportunity is concentrated in Oliver Peoples review traffic.

## 30-Day Targets

These are intentionally practical. The first 30 days should prove that Google can index commercial pages, that the right queries start appearing, and that GA can measure commercial actions across the site.

| KPI | 30-day target | Measurement source | Why it matters |
| --- | ---: | --- | --- |
| Indexed priority URLs | 8/8 priority URLs indexed or submitted for re-crawl | GSC URL inspection | No indexing means no SEO growth. |
| Commercial query impressions | 300+ impressions from target commercial-intent query groups | GSC query report | The current target-query baseline is near zero, so early growth is visibility. |
| Commercial organic clicks | 15+ clicks to priority commercial pages | GSC page report | Click volume should start moving before revenue can move. |
| US CTR on target pages | 1.2%+ | GSC country/page report | US baseline is 0.7%; first target is fixing SERP relevance. |
| Commercial action rate | 5%+ of commercial landing sessions | GA events | Visitors must move from content or landing pages into product actions. |
| Try-on start rate | 3%+ of commercial landing sessions | GA events | Try-on is the clearest product action for eyewear shoppers. |
| Face analysis upload rate | 5%+ of `/face-analysis` sessions | GA events | Face analysis is a key assisted-shopping entry point. |
| Paid-intent action count | 5+ pricing views or unlock successes | GA events | Commercial traffic should produce purchase intent, not only engagement. |
| Blog bridge clicks | 10+ `blog_funnel_click` events | GA events | Review and guide traffic must start entering commercial paths. |

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
- `try on glasses at home`
- `try before you buy glasses`
- `what glasses suit my face`
- `face shape glasses`
- `glasses for face shape`
- `face shape detector for glasses`
- `face shape detector online free`
- `try on glasses ai`
- `try on glasses app`
- `Oliver Peoples Finley review`
- `Ray-Ban virtual try on`
- `prescription glasses virtual try on`

## 90-Day Targets

The 90-day target should be outcome-oriented, but still grounded in the current small baseline.

| KPI | 90-day target |
| --- | ---: |
| Commercial query impressions | 1,500+ impressions from target query groups |
| Commercial organic clicks | 60+ clicks to priority commercial pages |
| US CTR on target pages | 2%+ |
| Commercial action rate | 8%+ |
| Try-on start rate | 5%+ |
| Face analysis upload rate | 8%+ |
| Try-on continuation rate | 20%+ |
| Paid-intent action count | 3x the first measured 30-day baseline |

## Weekly Operating Rhythm

Every week:

1. Pull GSC query, page, country, and CTR data for the target query groups.
2. Pull GA event counts for:
   - `face_analysis_upload`
   - `face_analysis_complete`
   - `try_on_from_face_analysis`
   - `face_analysis_unlock_success`
   - `blog_funnel_click`
   - pricing page views
   - try-on starts
3. Compare actuals against the 30-day target run rate.
4. Choose one page-level SEO action and one commercial-conversion action.
5. Record decisions in the weekly growth report.

## Decision Rules

- If impressions are low: improve indexing, internal links, and topical coverage before writing new content.
- If impressions grow but CTR stays low: rewrite titles, meta descriptions, and first-screen SERP promise.
- If commercial clicks grow but action rate is low: improve product CTAs, pricing visibility, and trust cues.
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
- Completed on 2026-06-12: pricing page views send `view_pricing`; real try-on submissions send `try_on_start` with `try_on_type`.
- Produce the first weekly commercial traffic report once GA has at least one full day of event data after deployment.
