# SEO Backlog

**Status:** Active task ledger; the restart queue only is current  
**Owner:** Growth / Product / Engineering  
**Last reviewed:** 2026-11-01

> Older checked items are preserved as historical execution evidence (2026-06 to 2026-08). Only the restart queue below is active.

> This file is a task ledger, not a parallel GTM plan. Task priority and activation are governed by `docs/strategy/analytics/gtm.md`.

## Active restart queue — 2026-11-01

**P0 | Current evidence before shipping more pages**

- [x] Read authenticated GA4 (Oct 4–31 vs Sep 6–Oct 3) and GSC Web (Oct 2–29 vs Sep 4–Oct 1) through the connected browser; record exact property, 28-day comparison and GSC 3-month snapshot. GA4 **6,889 sessions (3.78× original total-session baseline), down 11.7%**; GSC **4,761 clicks, down 4.5%**. **Partial:** GA4 property time zone, internal/test filtering, 90d GA4, first-party and Stripe reconciliation remain open. See dated audit.
- [x] Read **actual GA4 Events report** for Oct 4–31: 6,568 detector starts, 5,419 completions, 3,407 continuation clicks, 2,130 photo handoffs, 641/330 Advisor starts/completions, 119/56 Try-On starts/completions, 32 checkouts and **14 GA4 `purchase` events/$41.86**. Whole-property event counts are **not** a joined funnel or Stripe-verified revenue; see dated audit.
- [x] Verify GA4 custom definitions: prior six registered; add **three event-scoped definitions** `product_path`, `query_cluster`, `landing_locale` on Nov 1 (nine total). They only support **future** reporting. Keep high-cardinality landing URLs/referrer hosts out of custom dimensions. No conversion/key-event toggle or code change.
- [ ] Join (at aggregate reporting level, without inventing identity joins) landing/search intent → Detector/Advisor/Try-On/Compare → verified paid results; review revenue per 1,000 **qualified organic** sessions. **External gate:** confirm internal/test exclusion and reconcile live Stripe/Payment transaction IDs to the 14 GA4 purchases; Stripe readback unavailable Nov 1.
- [x] Recheck GSC indexing: **8 current 404s** (June's 683 was historical), **448 indexed, 831 excluded**. Eight examples: 1 old hashed CSS asset, 3 legacy tag slugs, 2 expired share links, `/5`, `/style/diamond`; none proven core landing failures. Four redirect errors: `/id/business`, `/es/business`, `/ja/business`, `/en/try-on`. Verify live response and business intent before redirects; details in dated audit.
- [ ] Sample the **278 discovered** (examples: Arabic blog/guide locale pages) and **78 crawled** (examples: RU/ID/ES/JA localized guides and query-based Compare) by intent/value; inspect canonical/hreflang/sitemap/image discovery and crawler-specific robots groups. Do not ask for bulk validation before fixes.
- [x] **GSC redirect-error live remediation shipped Nov 1.** [#486](https://github.com/franksunye/VisuTry/pull/486), Production SHA `ddc2fb85` **READY**. Legacy `/en/try-on` and non-English Business overview routes now use canonical routing-layer 308 redirects. Production GET/HEAD verified `Location: /en/try-on/glasses` and `Location: /en/business` for all four GSC example URLs; no Vercel runtime errors in inspected 30-minute window. This removes the observed redirect defect but does not retrospectively clear GSC crawl reports.
- [x] **Localized glasses face-shape hub discovery repair shipped Nov 1.** [#487](https://github.com/franksunye/VisuTry/pull/487), Production SHA `66e70d4d` **READY**. On eight non-English `/{locale}/glasses-for-face-shape` hubs, seven shape rows now point to their **same-locale** `/{locale}/style/{shape}-face` pages instead of all seven pointing to Detector: **56 corrected links; 63 target mappings across nine locales**. Existing localized detail pages/sitemap unchanged. All GitHub Quality Gate jobs passed; public ES/JA/ID HTML samples each show all seven guide links, Detector CTA retained, GET 200, runtime error scan clear.
- [ ] **Indexing impact readback after recrawl:** confirm GSC redirect-error resolution and measure impressions/index status of the localized `/style/{shape}-face` cohort at comparable 14/28-day windows. A routing/link fix is not evidence of higher rankings or qualified sessions.
- [x] **Priority 1 diagnosis: EN detector broad-query exposure decline.** Original Oct 2–29 page GSC 1,540 vs 1,944 clicks; new exact-page Oct 3–30 cut 1,558 vs 1,901 (different 28d offset). **India 252 vs 521 clicks (−269), India mobile 224 vs 485 (−261), India `face shape detector` 102 vs 330 (−228)**; India rank improved 8.6→8.2 and CTR 1.7%→2.1%. **HOLD detector rewrite**; SERP/demand explanation is unproven. Details in dated audit.
- [x] **P0 mobile Detector result→product experiment SHIPPED 2026-11-01.** PR [#484](https://github.com/franksunye/VisuTry/pull/484), `main` `2288ec58`, exact Vercel Production deployment `dpl_HCkkofKDueKB3pxroY8LLeysdbHS` **READY**. On narrow screens show the face-shape answer and early Advisor/Try-On actions before the full-height photo; keep desktop layout. `journey_continued` now distinguishes `cta_location=result_summary_mobile` versus `result_next_step` via an existing GA4 dimension. Focused tests **26/26**, TypeScript, lint, GitHub Quality Gate (all jobs) and Vercel preview passed; production Detector GET **200**, Cloudflare static HTML cache **HIT**, and no Vercel runtime errors in the inspected 30-minute window. No free-detector server calls added.
- [ ] **P0 experiment 7-day readback (do not mark conversion win yet).** After one full post-release week, compare `journey_continued` by CTA placement, **actual** `face_analysis_started` and `tryon_started`, detector completion/error, qualified outcomes, and page/CPU guardrails against a comparable baseline. Consider modify/revert if qualified continuation or reliability regresses; do not equate aggregate event ratios with a joined user funnel.
- [x] **Priority 2 diagnosis: EN AI guide CTR/query mix and existing CTA audit.** Oct 3–30 exact-page GSC **967 vs 1,118 clicks; 20,374 vs 16,596 impressions; 4.7% vs 6.7% CTR**. `which glasses suit my face ai free` 65 vs 155 clicks; broad `which glasses suit my face` impressions 1,430 vs 647 but only 22 vs 18 clicks. Existing meta, photo-upload answer and Detector/Advisor/Try-On CTAs are present; landing report attributes 4 GA4 purchases. **HOLD broad title/article rewrite**; register a bounded snippet/first-screen experiment only after source-page CTA and qualified follow-through baselines are available.
- [ ] **Weekly verification gate:** track India-mobile `face shape detector` impressions/clicks/rank versus US and device controls, and guide exact-query CTR plus `seo_funnel_click` by `source_page`/`destination`/`cta_location`. Ship one small page change only if a sustained mismatch is supported and payment-quality guardrail is established.
- [ ] **Protect localized winners:** JA detector clicks 350 vs 60 and ES detector 194 vs 61. Review actual post-entry engagement and monetization before scaling locale/page count.

**P1 | Distribution and content learning**

- [x] Open GSC Generative AI beta report: 17,036 impressions in Oct 2–29; EN detector 7,309, EN AI guide 4,358, EN face analysis 1,072.
- [ ] Join this visibility signal to independently measured GA4 AI Assistant (588 vs 850 sessions) and downstream actions; do **not** equate impressions to referrals.
- [ ] Review real AI Assistant referral → decision-action quality. Merchant Store/Campaign Gate A and standalone Consumer AI referrals must remain separate.
- [ ] Review **GSC Image Search 28d** page/query/impression/click data and crawlability for existing B01–B06 image assets, then prioritize B07–B09 integration only where there is measured discovery/intent potential. Defer B10–B19 asset production and page-count expansion pending measured incremental opportunity.
- [ ] **After the 7-day mobile Detector CTA gate, evaluate—not yet ship—a useful free starter frame shortlist** based on the already-curated `getFaceShapeContent(shape).glasses.tryFirst` and `rationale`: show a few concrete frame directions on the measured result before the optional paid Advisor, preserving clear photo privacy/cost boundaries and no extra per-detection server calls. Compare qualified Advisor/Try-On starts and retention against the untouched CTA experiment baseline.
- [ ] Record weekly scale / modify / stop decisions in the canonical weekly scorecard; reconcile completed/stale tasks monthly.

**Historical sections below** preserve 2026-06/07 checkboxes and their original acceptance windows. They are not present-day open work orders. Reopen only by a fresh measurement and owner decision. See `docs/ops/organic-growth-restart-2026-11-01.md`.

---

## Current GTM Experiment: Revenue Attribution and High-Intent Continuation

Priority: P0
Status: Implemented; awaiting production measurement
Window: 2026-07-27 to 2026-08-10

Hypothesis:

> If every high-intent entry and completed payment is attributable to its landing page, locale, intent cluster, and CTA, VisuTry can expand the traffic sources that preserve or improve revenue per 1,000 organic sessions.

Completed:

- [x] Preserve the first landing page and explicit growth source for the browser session.
- [x] Add `face_shape_detector_start` before detector analysis.
- [x] Add `seo_funnel_click` to the main CTAs on glasses-for-face-shape, sunglasses hub, and localized sunglasses-by-face-shape pages.
- [x] Add Stripe Checkout Session ID to pricing and face-analysis success return URLs.
- [x] Verify completed payments against the authenticated user's server-side Payment row.
- [x] Send the GA4 recommended `purchase` event with transaction ID, product, value, currency, locale, landing page, and page path.
- [x] Deduplicate client purchase reporting by Checkout Session ID.
- [x] Add focused attribution and funnel-link tests.
- [x] Confirm the production build and SSG output for all public growth pages.

Production measurement:

- [ ] Confirm `face_shape_detector_start`, `seo_funnel_click`, and `purchase` in GA4 DebugView / Realtime after deployment.
- [ ] Register or verify custom dimensions for `landing_page`, `page_path`, `growth_source`, `query_cluster`, `source_page`, `destination`, and `cta_location`.
- [ ] Record the first 7-day funnel by landing page and locale.
- [ ] Compare revenue per 1,000 organic sessions against the pre-deployment baseline.

Decision on 2026-08-10:

- Expand pages/locales where qualified clicks grow and revenue quality is stable or higher.
- Fix intent or CTA mismatch where traffic grows but detector continuation falls.
- Stop channels that create sessions without detector, try-on, checkout, or purchase behavior.

## Current SEO Allocation: GSC Coverage Matrix

Priority: P0
Status: Execution active
Baseline: 2026-07-27

Findings:

- [x] Export current GSC query, page, country, device, and date data for the latest 28-day and selected 90-day windows.
- [x] Confirm that the latest 28 days produced 404 clicks and 8,158 impressions.
- [x] Confirm that the AI face-analysis article owns the highest-volume `which glasses suit my face` queries.
- [x] Confirm that `/en/face-shape-detector` is discovered but not indexed.
- [x] Map current query clusters to their intended product-led owners.

Next execution:

- [x] Verify crawlable internal links to the English free detector from the winning article, face-analysis page, homepage, and glasses hub; strengthen the winning article's hero link.
- [ ] Verify the detector's canonical, robots, sitemap entry, rendered status, and mobile first screen after deployment.
- [x] Request detector indexing after verifying the live page returns 200, `index,follow`, the correct canonical, sitemap inclusion, and crawlable internal links (submitted 2026-07-27).
- [x] Improve the winning AI article's first-screen free-detector CTA while preserving advisor and try-on paths.
- [x] Genuinely localize the winning advisor article for `fr`, `ru`, `de`, `pt`, `id`, `ja`, `es`, and `ar` (metadata, body, CTAs, FAQ/schema, internal links, and localized article data on blog cards).
- [x] Localize ordinary-glasses `/style/{faceShape}` pages, add all 63 locale/shape URLs to sitemap with hreflang, and remove non-English `noindex` after build QA.
- [ ] Optimize the existing Ray-Ban guide's snippet and try-on CTA instead of creating a duplicate article.

Reference: [GSC Query Coverage Matrix](../strategy/seo/2026-07-27-gsc-query-coverage-matrix.md)

## Product Architecture Sync

Priority: P0
Status: Implemented; awaiting traffic baseline

- [x] Assign one primary query family to Detector, Advisor, Try-On, Compare, and editorial hub URLs.
- [x] Make Face Shape Detector the homepage's primary free acquisition CTA.
- [x] Reposition `/face-analysis` as Glasses Advisor to prevent detector keyword cannibalization.
- [x] Connect Detector results to Advisor, Virtual Try-On, and the face-shape guide.
- [x] Add Detector upload, completion, failure, and downstream CTA events.
- [x] Clarify on Pricing that Detector is free and does not consume credits.
- [x] Remove untranslated face-shape locale copies from sitemap/hreflang and set them `noindex,follow`.
- [ ] Establish the first 7-day Detector upload, completion, and continuation baseline.
- [ ] Request indexing for the English Detector and refreshed homepage after production verification.

Reference: [Product Architecture SEO/GEO Sync](../strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md)

## External Acquisition Sprint

Priority: P0
Status: Superseded; remaining tasks stopped on 2026-07-27

Goal:

- Reach 200 qualified external sessions and 20 external high-value product actions by 2026-07-12.

Historical completed work:

- [x] Reset the 30-day stretch targets around external traffic.
- [x] Define three reusable campaign angles and public proof assets.
- [x] Prepare UTM links and channel-specific copy.
- [x] Create the first distribution and outreach queue.
- [x] Research and rank the first ten outreach targets.

Stopped rather than carried forward:

- Publish additional X/Reddit placements.
- Prepare the Product Hunt launch page, gallery, and maker comment.
- Submit four directory listings.
- Publish three community contributions.
- Send another fixed-volume outreach batch.

These actions may resume only as a bounded experiment under the active GTM strategy; the old quotas and deadlines no longer apply.

Acceptance:

- [ ] At least 12 external placements are live.
- [ ] At least 30 personalized messages are sent.
- [ ] At least 200 qualified external sessions are measured.
- [ ] At least 20 external high-value actions are measured.
- [ ] At least 5 external mentions or links are secured.

Reference:

- [External Growth Sprint](../strategy/archive/growth/2026-06-18-external-growth-sprint.md)
- [External Distribution Kit](../strategy/growth/2026-06-18-distribution-kit.md)

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
- [x] Recheck the new `www` sitemap status after GSC finishes processing the newly verified property.

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
Status: Done

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
- [x] Add Trends-rising language around `face shape glasses`, `glasses by face shape`, and `how to choose glasses for face shape`.

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
- [x] Produce first weekly commercial traffic report for 2026-06-15.
- [x] Fix legacy blog canonical metadata after GSC showed wrong canonical selection.
- [x] Check GSC for `/en/face-analysis`.
- [x] Check GSC for `/en/blog/ai-face-analysis-for-glasses-guide`.
- [x] Track impressions for face-analysis and glasses-intent query groups.
- [x] Log issues and next action.

Acceptance:

- [x] Weekly status note completed.
- [x] Query movement documented.

### Trends-Based AEO Content Additions

Priority: P1
Status: In progress

Source:

- Google Trends, United States, past 12 months.

Tasks:

- [x] Add or expand `/en/face-analysis` FAQ answers for `face shape detector online free` and `face shape finder`.
- [x] Add or expand `/en/try-on/glasses` FAQ answers for `try on glasses ai`, `try on glasses app`, and `blue light glasses virtual try on`.
- [x] Add or expand `/en/glasses-for-face-shape` sections for `face shape glasses`, `glasses by face shape`, `glasses based on face shape`, and `how to choose glasses for face shape`.
- [ ] Create a content brief for a future Warby Parker comparison page or section using neutral comparison language.
- [ ] Track whether Trends-rising terms appear in GSC within 2-4 weeks after deployment and indexing.

Acceptance:

- [x] Page copy uses real user demand language from Google Trends.
- [x] AEO blocks answer question-style terms directly.
- [x] Every answer links into the commercial path: face analysis, recommended frames, or glasses try-on.

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
- [x] Request reindexing for materially updated blog pages in GSC.

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

- [ ] Share priority pages on X and Reddit after the funnel pages are complete; use Product Hunt as a coordinated launch and directories as an evergreen listing program.

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
- [x] First weekly commercial traffic report produced.
- [x] Practical commercial traffic KPI plan documented.

## See Also

- [Face Analysis to Glasses Try-On Growth Plan](../strategy/seo/2026-06-11-face-analysis-to-tryon-growth-plan.md)
- [Keyword Mapping](../strategy/seo/keywords-mapping.md)
- [Archived Programmatic SEO Execution Plan](../strategy/archive/seo/programmatic-seo-execution-plan.md)
