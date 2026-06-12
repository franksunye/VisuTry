# SEO Backlog

Last updated: 2026-06-12
Current sprint: Face Analysis to Glasses Try-On Growth
Owner: Codex

## Critical

### Google Search Console Verification

Priority: P0
Status: Done

Tasks:

- [x] Confirm GSC property access for `https://visutry.com/`.

Acceptance:

- [x] Can access GSC dashboard.
- [x] Property verified.

### Submit Sitemap

Priority: P0
Status: Done

Tasks:

- [x] Submit `https://visutry.com/sitemap.xml` in GSC.
- [x] Verify successful submission.

Acceptance:

- [x] Sitemap submitted on 2026-06-11.
- [x] GSC shows successful submission.

### Request Face Analysis Indexing

Priority: P0
Status: Done

Tasks:

- [x] Request indexing for `/en/face-analysis`.
- [x] Request indexing for `/en/blog/ai-face-analysis-for-glasses-guide`.

Acceptance:

- [x] Both URLs requested on 2026-06-11.
- [x] Both URLs showed discovered but not indexed before the request.

### GA Key Events for Face Analysis Funnel

Priority: P0
Status: Done

Tasks:

- [x] Mark `face_analysis_complete` as a key event.
- [x] Create and mark `face_analysis_upload` as a key event.
- [x] Create and mark `try_on_from_face_analysis` as a key event.
- [x] Create and mark `face_analysis_unlock_success` as a key event.

Acceptance:

- [x] GA key events list includes all four face-analysis funnel events.
- [x] New code-based events may show no data stream until they are triggered by real users.

## High Priority

### GSC, Keyword Planner, and Google Trends Research

Priority: P0
Status: Done

Tasks:

- [x] Pull GSC query, country, and page data for `https://visutry.com/`.
- [x] Use Google Ads Keyword Planner for US English keyword demand validation.
- [x] Use Google Trends for US and worldwide demand-shape validation.
- [x] Map real keywords to product-led SEO pages.
- [x] Document country and page priorities.

Acceptance:

- [x] Research completed on 2026-06-12.
- [x] Keyword plan is based on GSC, Keyword Planner, and Google Trends, not guessing.
- [x] US market, face-analysis, glasses try-on, and Oliver Peoples bridge opportunities are prioritized.
- [x] Trends-adjusted user language is documented: `glasses try on`, `face shape glasses`, `glasses for face shape`, `face shape detector online free`, `try on glasses ai`, and `try on glasses app`.

Reference:

- [GSC, Keyword Planner, and Trends Research](../strategy/seo/2026-06-12-gsc-keyword-country-research.md)
- [Commercial Traffic KPI Operating Plan](../strategy/seo/2026-06-12-growth-kpi-operating-plan.md)

### Canonical Domain Alignment

Priority: P0
Status: Done

Problem:

- Production redirects `https://visutry.com/...` to `https://www.visutry.com/...`.
- SEO metadata and sitemap fallbacks previously emitted non-www canonical URLs.
- GSC inspection for the non-www Oliver Peoples URL showed a redirect state, which weakens indexing actions for refreshed content.

Tasks:

- [x] Update Vercel Production `NEXT_PUBLIC_SITE_URL` to `https://www.visutry.com`.
- [x] Update SEO fallback URLs, sitemap config, structured data URLs, and admin sitemap guidance to `https://www.visutry.com`.
- [x] After redeploy, verify production canonical URLs use `www`.
- [x] Add/verify `https://www.visutry.com/` property in GSC or confirm domain-level property access.
- [x] Submit `https://www.visutry.com/sitemap.xml` in the canonical `www` GSC property.

Acceptance:

- [x] Production page canonical matches the served `www` domain.
- [x] GSC URL inspection can be run against canonical URLs without property mismatch.
- [ ] Recheck the new `www` sitemap status after GSC finishes processing the newly verified property.

### Face Analysis to Try-On Repositioning

Priority: P0
Status: In progress

Business goal:

Make `/en/face-analysis` rank and convert as a glasses decision tool, not a standalone face-analysis novelty.

Tasks:

- [x] Update `/en/face-analysis` metadata around AI face analysis for glasses.
- [x] Add FAQ, HowTo, and SoftwareApplication schema.
- [x] Add GA tracking for upload, completion, try-on from analysis, and unlock success.
- [x] Strengthen first-screen copy around "find glasses that fit your face".
- [x] Add stronger above-the-fold try-on bridge.
- [x] Add internal links to face-shape pages and try-on page.
- [x] Update visible copy and metadata around researched Keyword Planner terms: `AI face shape detector`, `face shape detector for glasses`, and `what glasses suit my face`.
- [x] Add FAQ/AEO answers for Trends-rising terms: `face shape detector online free` and `face shape finder`.

Acceptance:

- [x] First viewport clearly connects face analysis to glasses try-on.
- [x] Primary CTA drives analysis upload or sign-in.
- [x] Secondary CTA drives direct glasses try-on.
- [x] Page is explicitly positioned for the researched US English query cluster.

### Optimize Glasses Try-On Page for US Keyword Demand

Priority: P0
Status: TODO

Target URL:

- `/en/try-on/glasses`

Target keywords from Keyword Planner:

- `glasses try on`
- `virtual glasses try on`
- `try on glasses online`
- `try on glasses at home`
- `try before you buy glasses`
- `try on glasses ai`
- `try on glasses app`

Tasks:

- [x] Update metadata and visible H1/support copy.
- [x] Add a short "try on glasses at home" section.
- [x] Add a "face analysis before try-on" bridge.
- [x] Add FAQ schema for try-on intent questions.
- [x] Add Trends-rising FAQ/AEO answers for `try on glasses ai` and `try on glasses app`.
- [x] Add FAQ/AEO coverage for `blue light glasses virtual try on`.

Acceptance:

- [x] Page targets the researched virtual try-on keyword cluster.
- [x] Page links users back to face analysis when they do not know which frames to try.

### Build Glasses for Face Shape Hub

Priority: P1
Status: Done

Target URL:

- `/en/glasses-for-face-shape`

Target intent:

- `face shape glasses`
- `glasses for face shape`
- `glasses by face shape`
- `how to choose glasses for face shape`
- `best glasses for my face shape`
- `what glasses suit my face`

Tasks:

- [x] Create page route and metadata.
- [x] Add face-shape comparison table.
- [x] Link to `/en/face-analysis`.
- [x] Link to `/en/try-on/glasses`.
- [x] Link to `/en/style/[faceShape]`.
- [x] Add FAQ schema.
- [ ] Add Trends-rising language around `face shape glasses`, `glasses by face shape`, and `how to choose glasses for face shape`.

Acceptance:

- [x] Page has clear conversion path: read guidance, analyze face, try glasses.
- [x] Page is included in sitemap.
- [x] Page passes lint/typecheck.
- [x] Trends-rising language covers `face shape glasses`, `glasses by face shape`, and `how to choose glasses for face shape`.

### Upgrade Face-Shape Programmatic Pages

Priority: P1
Status: Done

Tasks:

- [x] Improve `/style/[faceShape]` template.
- [x] Add useful static guidance when frame inventory is sparse.
- [x] Add CTA to `/en/face-analysis`.
- [x] Add CTA to `/en/try-on/glasses`.
- [x] Add FAQ schema per face shape.
- [x] Add stable sitemap entries for six core face-shape pages.

Acceptance:

- [x] Each face-shape page can rank and convert even with limited inventory.
- [x] Internal links connect face-shape pages back into the try-on funnel.

### Monitor Indexing and Query Movement

Priority: P1
Status: Active

Tasks:

- [x] Define practical 30-day and 90-day commercial traffic KPIs.
- [x] Create weekly commercial traffic report template.
- [x] Confirm and add commercial GA events for pricing views and try-on starts.
- [ ] Check GSC for `/en/face-analysis`.
- [ ] Check GSC for `/en/blog/ai-face-analysis-for-glasses-guide`.
- [ ] Track impressions for face-analysis and glasses-intent query groups.
- [ ] Log issues and next action.

Acceptance:

- [ ] Weekly status note completed.
- [ ] Query movement documented.

### Trends-Based AEO Content Additions

Priority: P1
Status: TODO

Source:

- Google Trends, United States, past 12 months.

Tasks:

- [ ] Add or expand `/en/face-analysis` FAQ answers for `face shape detector online free` and `face shape finder`.
- [ ] Add or expand `/en/try-on/glasses` FAQ answers for `try on glasses ai`, `try on glasses app`, and `blue light glasses virtual try on`.
- [ ] Add or expand `/en/glasses-for-face-shape` sections for `face shape glasses`, `glasses by face shape`, `glasses based on face shape`, and `how to choose glasses for face shape`.
- [ ] Create a content brief for a future Warby Parker comparison page or section using neutral comparison language.
- [ ] Track whether Trends-rising terms appear in GSC within 2-4 weeks after deployment and indexing.

Acceptance:

- [ ] Page copy uses real user demand language from Google Trends.
- [ ] AEO blocks answer question-style terms directly.
- [ ] Every answer links into the commercial path: face analysis, recommended frames, or glasses try-on.

### Use Oliver Peoples Pages as Funnel Bridge

Priority: P1
Status: In progress

Data signal:

- `/de/blog/oliver-peoples-finley-vintage-review`: 1,110 GSC impressions, 1% CTR.
- `/en/blog/oliver-peoples-finley-vintage-review`: 342 GSC impressions, 1.8% CTR.

Tasks:

- [x] Refresh Oliver Peoples page title/meta for CTR around review, face-shape fit, and try-on intent.
- [x] Add face-shape fit section.
- [x] Add face-analysis CTA.
- [x] Add glasses try-on CTA.
- [x] Add FAQ schema for face-shape fit, online try-on, and value decision questions.
- [x] Add `blog_funnel_click` GA/GTM event tracking for blog CTAs.
- [x] Register GA custom dimensions for `source_page`, `destination`, and `cta_location`.
- [ ] Evaluate German page refresh or locale-specific CTA.
- [x] Request reindexing for `/en/blog/oliver-peoples-finley-vintage-review` and `/de/blog/oliver-peoples-finley-vintage-review` after deployment.

Acceptance:

- [ ] High-impression product-review pages move users into the face-analysis and glasses try-on funnel.
- [ ] CTR and clicks are tracked in the weekly GSC report.
- [ ] GA/GTM report can segment `blog_funnel_click` by `source_page`, `destination`, `cta_location`, and `locale`.
- [ ] GSC CTR target: English page from 1.8% to 3%+, German page from 1% to 2.5%+ within 2-4 weeks after indexing.

## Medium Priority

### Refresh Priority Blog Pages

Priority: P2
Status: In progress

Tasks:

- [x] Refresh `/en/blog/ai-face-analysis-for-glasses-guide`.
- [x] Refresh `/en/blog/how-to-choose-glasses-for-your-face`.
- [x] Confirm `/en/blog/best-glasses-for-face-shapes-guide` permanently redirects to `/en/blog/how-to-choose-glasses-for-your-face` and is not published in the blog sitemap source.
- [x] Refresh `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`.
- [x] Add contextual CTAs to face analysis and glasses try-on.
- [x] Add FAQ schema to refreshed support pages.
- [x] Add internal links to `/en/glasses-for-face-shape`, `/en/style/[faceShape]`, `/en/face-analysis`, and `/en/try-on/glasses` where relevant.

Acceptance:

- [x] Blog pages support the face-analysis to try-on funnel.
- [x] Pages target researched question-style GEO queries.
- [ ] Request reindexing for materially updated blog pages in GSC.

### Fix 404 Errors

Priority: P2
Status: TODO

Tasks:

- [ ] Review 404 errors in GSC.
- [ ] Identify patterns.
- [ ] Add redirects or fix links.
- [ ] Verify fixes.

Acceptance:

- [ ] 404 errors materially reduced.

### Add Internal Links

Priority: P2
Status: Done

Tasks:

- [x] Add contextual internal links to the original nine blog posts.
- [x] Add links from face analysis to glasses decision pages.
- [x] Add links from glasses decision pages back to face analysis and try-on.

Acceptance:

- [x] The face-analysis to try-on funnel is visible from the new hub and the face-analysis landing page.

## Future

### Content Expansion

- [ ] Write new pages only after GSC impressions validate demand.
- [ ] Focus on face-shape and glasses try-on gaps.
- [ ] Avoid generic beauty or face-score content unless it connects to glasses try-on.

### Social Distribution

- [ ] Share priority pages on X, LinkedIn, Reddit, and Quora after the funnel pages are complete.

### Link Building

- [ ] Reach out to eyewear, online shopping, and style blogs after the decision hub is live.

## Sprint Goals

### Week 1

- [x] GSC sitemap submitted.
- [x] Two priority URLs requested for indexing.
- [x] GA key events configured.
- [x] `/en/face-analysis` repositioned around glasses try-on.
- [x] `/en/glasses-for-face-shape` built or scoped for build.

### Week 2

- [x] Face-shape pages upgraded.
- [x] Priority live blog pages refreshed; legacy `best-glasses-for-face-shapes-guide` confirmed as canonical redirect.
- [x] GSC, Keyword Planner, and Google Trends research completed.
- [x] `/en/face-analysis`, `/en/try-on/glasses`, and `/en/glasses-for-face-shape` aligned to researched keyword clusters.
- [x] Trends-based AEO copy additions completed.
- [x] Oliver Peoples shared review page bridge refresh completed.
- [ ] German-specific Oliver Peoples localization decision completed.
- [ ] New or updated pages submitted in GSC.
- [ ] First weekly commercial traffic report produced.
- [x] Practical commercial traffic KPI plan documented.

## See Also

- [Face Analysis to Glasses Try-On Growth Plan](../strategy/seo/2026-06-11-face-analysis-to-tryon-growth-plan.md)
- [Keyword Mapping](../strategy/seo/keywords-mapping.md)
- [Programmatic SEO Execution Plan](../strategy/seo/programmatic-seo-execution-plan.md)
