# VisuTry Face Analysis to Glasses Try-On Growth Plan

Last updated: 2026-06-11
Owner: Codex
Status: Active

## Business Thesis

Face analysis is not the destination. It is the guided entry point that helps shoppers answer:

1. What is my face shape?
2. What glasses suit my face?
3. Which frames should I try first?
4. Can I see those frames on my own photo?

The commercial objective is to turn organic and AI-search demand around face shape and glasses advice into virtual try-on usage, then into unlocks, paid usage, or purchase-intent actions.

## Current Baseline

### Google Search Console

- Property: `https://visutry.com/`
- Last observed 3-month performance: 83 clicks, 2,051 impressions, 4% CTR, average position 6.
- Current traffic is brand-heavy: `visutry` and `visu try` dominate clicks.
- Non-brand visibility is thin and scattered, with older glasses content such as the Oliver Peoples Finley review getting impressions but low CTR.
- `/en/face-analysis` was not visible among top GSC pages/queries.
- US impressions are high relative to clicks, so CTR and intent matching need work.
- 2026-06-11 actions completed:
  - Resubmitted `https://visutry.com/sitemap.xml`.
  - Requested indexing for `/en/face-analysis`.
  - Requested indexing for `/en/blog/ai-face-analysis-for-glasses-guide`.

### Google Analytics

- Last observed 7-day active users: about 89.
- Organic Search was down roughly 18-28%.
- Key events were previously underconfigured.
- 2026-06-11 actions completed:
  - Marked `face_analysis_complete` as a key event.
  - Created and marked these code-based key events:
    - `face_analysis_upload`
    - `try_on_from_face_analysis`
    - `face_analysis_unlock_success`

## Researched SERP Evidence

The winning pages in this market do not position face analysis as a generic beauty score. They connect face scanning to eyewear selection and try-on.

- LensCrafters positions its face-shape tool as a way to analyze face shape, size, and facial features to produce a personalized frame selection.
- GlassesUSA Pairfect Match AI frames the product as an AI glasses finder that analyzes jawline, eye height, cheekbones, and nose bridge before recommending frames.
- Ray-Ban's face shape guide connects face scanning, frame advisor, virtual try-on, and fit guidance in one shopping path.
- SmartBuyGlasses connects virtual try-on with discovering face shape and suitable frames.
- Eyeconic and Glasses.com emphasize virtual try-on as the practical confidence step before buying.
- Yesglasses and GlassesShop show that "face shape detector" demand can be captured when the page immediately recommends frames.

Source examples:

- https://www.lenscrafters.com/lc-us/face-shape
- https://www.glassesusa.com/pairfect-match-ai
- https://www.ray-ban.com/usa/c/face-shape-guide
- https://www.smartbuyglasses.com/virtual-try-on
- https://www.eyeconic.com/help-me/virtual-try-on
- https://www.glasses.com/gl-us/frame-advisor
- https://www.yesglasses.com/face-shape
- https://www.glassesshop.com/face-shape

## Keyword Map

This plan uses researched SERP intent, current GSC evidence, and business fit. It does not claim exact search volume without a keyword-volume export.

### Tier 1: Tool Intent

These users are ready to interact with a tool.

- `AI face shape detector`
- `face shape detector for glasses`
- `what is my face shape`
- `face analysis for glasses`
- `AI glasses finder`

Primary landing page:

- `/en/face-analysis`

Goal:

- Upload rate from organic sessions.

### Tier 2: Recommendation Intent

These users know they need glasses advice but have not chosen frames.

- `what glasses suit my face`
- `best glasses for my face shape`
- `how to choose glasses for your face`
- `glasses for face shape`
- `find glasses for my face`

Primary pages:

- `/en/glasses-for-face-shape`
- `/en/blog/how-to-choose-glasses-for-your-face`
- `/en/blog/ai-face-analysis-for-glasses-guide`

Goal:

- Move users to face analysis or virtual try-on.

### Tier 3: Face-Shape Long Tail

These users have a known face shape and need frame guidance.

- `best glasses for round face`
- `best glasses for square face`
- `best glasses for oval face`
- `best glasses for heart shaped face`
- `best glasses for diamond face`
- `best glasses for oblong face`

Primary pages:

- `/en/style/round-face`
- `/en/style/square-face`
- `/en/style/oval-face`
- `/en/style/heart-face`
- `/en/style/diamond-face`
- `/en/style/oblong-face`

Goal:

- Click recommended frame styles, then try-on.

### Tier 4: Try-On Conversion Intent

These users are closest to usage and monetization.

- `virtual try on glasses`
- `try on glasses online`
- `try glasses on photo`
- `AI virtual glasses try on`
- `glasses virtual try on from photo`

Primary pages:

- `/en/try-on/glasses`
- `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`
- `/en/blog/prescription-glasses-virtual-tryon-guide`

Goal:

- Try-on submission and unlock success.

## Page Architecture

### Hub

`/en/face-analysis`

Role:

- Tool-first entry.
- Promise: "Find glasses that fit your face."
- Above-the-fold CTA: upload photo / sign in to analyze.
- Secondary CTA: try glasses directly.

Required sections:

- Face shape detector for glasses.
- What glasses suit my face?
- Best frames by face shape.
- Why virtual try-on is the final check.
- FAQ targeting AI-search questions.

### Decision Page

`/en/glasses-for-face-shape`

Role:

- SEO pillar page for "glasses for face shape" and "best glasses for my face shape".

Required sections:

- Quick table by face shape.
- Upload-to-analyze CTA.
- Links to `/style/[faceShape]` pages.
- Links to try-on.

### Existing Programmatic Pages

`/en/style/[faceShape]`

Role:

- Long-tail capture and internal link distribution.

Required upgrades:

- Add static guidance even when frame inventory is sparse.
- Add CTA to `/en/face-analysis`.
- Add CTA to `/en/try-on/glasses`.
- Add FAQ schema per face shape.

### Blog Support

Existing pages should become support content, not isolated articles.

Priority pages:

- `/en/blog/ai-face-analysis-for-glasses-guide`
- `/en/blog/how-to-choose-glasses-for-your-face`
- `/en/blog/best-glasses-for-face-shapes-guide`
- `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`

Required upgrades:

- Add intro CTA to face analysis.
- Add mid-article CTA to try-on.
- Add contextual links to `/style/[faceShape]` pages.
- Add final CTA: analyze face, then try frames.

## Measurement Model

Primary KPI:

- `try_on_from_face_analysis / organic face-analysis sessions`

Secondary KPIs:

- Organic impressions for Tier 1 and Tier 2 keywords.
- Organic CTR for `/en/face-analysis`.
- `face_analysis_upload / organic face-analysis sessions`.
- `face_analysis_complete / face_analysis_upload`.
- `try_on_from_face_analysis / face_analysis_complete`.
- `face_analysis_unlock_success / try_on_from_face_analysis`.

GA key events:

- `face_analysis_upload`
- `face_analysis_complete`
- `try_on_from_face_analysis`
- `face_analysis_unlock_success`

GSC weekly query groups:

- `face shape detector`
- `what glasses suit my face`
- `glasses for face shape`
- `virtual try on glasses`
- `AI glasses finder`

## 14-Day Execution Plan

### Days 1-2: Instrument and Reposition

- Completed: submit sitemap and request indexing for the two critical URLs.
- Completed: configure GA key events.
- Update `/en/face-analysis` copy so the first screen says the business promise clearly: face analysis helps users find glasses to try on.
- Confirm page schema validates and canonical/hreflang are correct.

### Days 3-5: Build the Decision Hub

- Create `/en/glasses-for-face-shape`.
- Add strong internal links from face analysis, try-on, and relevant blogs.
- Add FAQ and HowTo structured data.

### Days 6-8: Upgrade Face-Shape Pages

- Completed: improve `/style/[faceShape]` template.
- Completed: ensure useful guidance appears even without many database frames.
- Completed: add try-on CTAs and face-analysis CTAs.
- Completed: add stable sitemap entries for the six core face-shape pages.

### Days 9-11: Blog Refresh

- Refresh the four priority blogs.
- Add AI-search-friendly FAQ sections.
- Add conversion CTAs into the article body.

### Days 12-14: Validate and Report

- Run lint/typecheck.
- Submit new sitemap if URLs changed.
- Request indexing for new or materially updated pages.
- Pull GSC/GA status:
  - Query impressions.
  - Indexed URL count.
  - Event counts.
  - Funnel drop-off.

## Operating Rhythm

Weekly:

- Check GSC query movement for the five query groups.
- Check page-level CTR for `/en/face-analysis`, `/en/glasses-for-face-shape`, and `/en/try-on/glasses`.
- Check GA key-event funnel.
- Decide one copy/content iteration and one internal-link iteration.

Monthly:

- Compare organic sessions and key events month over month.
- Review whether face analysis is producing try-on usage.
- Expand content only where impressions or conversions justify it.

## Decision Rules

- If impressions grow but CTR stays low: rewrite title/meta and SERP promise.
- If upload rate is low: improve first-screen promise and reduce perceived privacy/friction risk.
- If completion rate is low: inspect analysis UX and failure states.
- If try-on click-through is low: improve recommendations and show frame examples earlier.
- If unlock success is low: test pricing/credit messaging after users see value.
