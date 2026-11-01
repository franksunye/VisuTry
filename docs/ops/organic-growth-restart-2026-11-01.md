# Organic Growth Restart — 2026-11-01 Read-only Evidence

**Status:** RESTART APPROVED; **THREE WORK-PACK DIAGNOSTICS COMPLETED; QUALIFIED FUNNEL / STRIPE RECONCILIATION PARTIAL**; Nov 1 follow-on GSC cohort readback and EN content release recorded below
**Repository baseline:** `franksunye/VisuTry` `main` `f90ad9caeef71b9adc999b8585a5f008534eee35`  
**Original three-work-pack scope:** Consumer qualified organic acquisition (SEO + GEO/AI discovery + Visual), no paid growth, website deployment or outreach in those diagnostic packages. The later Nov 1 content deployment is recorded in the follow-on section. Three narrowly scoped GA4 custom dimensions were added on Nov 1; no event/conversion definitions were altered.
**Authority:** Supporting dated audit only. The GTM source of truth is `docs/strategy/analytics/gtm.md`; weekly scorecard template is `docs/strategy/seo/weekly-growth-report-template.md`.

## Current authenticated GA4 and GSC readback — 2026-11-01

**Scope and freshness:** Read-only signed-in browser. GA4 property `AI-2024 / visutry.com`; GSC URL-prefix property `https://www.visutry.com/`. GSC Search Performance last refreshed about five hours before access; indexing snapshot updated **2026-10-23**. GA4 and GSC use different periods and definitions. Property time zone, internal/test exclusions and Stripe revenue were **not** validated.

| Observed metric | Recent 28 days | Previous 28 days | Change |
| --- | ---: | ---: | --- |
| GA4 all sessions (Oct 4–31 vs Sep 6–Oct 3) | **6,889** | 7,804 | **−11.7%** |
| GA4 Organic Search sessions | **5,015** | 5,238 | −4.3%; 72.8% current share |
| GA4 AI Assistant sessions | **588** | 850 | **−30.8%**; 8.5% current share |
| GA4 Direct sessions | 1,023 | 1,492 | −31.4% |
| GA4 engaged sessions | 5,027 | 5,464 | −8.0% |
| GA4 reported revenue | $41.86 | $29.90 | Reporting signal only, **not Stripe-verified** |
| GSC Web clicks (Oct 2–29 vs Sep 4–Oct 1) | **4,761** | 4,984 | **−4.5%** |
| GSC Web impressions | **118,826** | 142,252 | **−16.5%** |
| GSC CTR / mean position | 4.0% / 9.2 | 3.5% / 8.7 | CTR up despite impression loss |

**10× arithmetic:** The Aug 3 ~1,824-session monthly baseline implies an 18,240-session 10× number. GA4 current 6,889 sessions/28d is **3.78×**, 11,351 sessions short; it would need **2.65×** further growth. This is *directional all-session arithmetic*, not proof of a matched-period **qualified Consumer** multiple. Exclude identifiable internal/test activity and measure activated journeys/verified payment before representing it as the north-star.

**GSC 3-month context (Jul 30–Oct 29):** 13,652 clicks, 364,621 impressions, 3.7% CTR, average position 9.5. This window cannot be directly compared to the old 28-day July export.

## Three work packages — Nov 1 execution and decisions

These deeper GSC cuts use **Oct 3–30 vs Sep 5–Oct 2**, one day later than the first audit tables (**Oct 2–29 vs Sep 4–Oct 1**). Do not mix these numbers in a single delta or present them as the same export. All are GSC Web, URL-prefix property `https://www.visutry.com/`, with the **exact page** filter before adding country/device/query cuts.

### WP1 — EN Detector exposure loss: diagnosis completed, exact external cause unproven

| GSC slice, exact `/en/face-shape-detector` URL | Recent 28d | Prior 28d | Readout |
| --- | ---: | ---: | --- |
| All-country page clicks | 1,558 | 1,901 | **−343**, impressions 54,546 vs 78,527; avg position **8.0 vs 8.1**, CTR **2.9% vs 2.4%** |
| India clicks | **252** | **521** | **−269 (78% of global net loss)**; impressions **11,782 vs 30,776** |
| India mobile clicks | **224** | **485** | **−261 (97% of India's loss)**; impressions **10,513 vs 28,562** |
| India desktop clicks | 21 | 20 | +1; impressions 1,041 vs 1,611 |
| India tablet clicks | 7 | 16 | −9; impressions 228 vs 603 |
| India query `face shape detector` clicks | **102** | **330** | **−228**; impressions **7,155 vs 21,989** |
| India query `face shape detector for glasses` | 49 | 38 | +11 clicks; 325 vs 393 impressions |
| India query `face shape finder` | 5 | 20 | −15 clicks; 277 vs 1,307 impressions |

India page rank **improved 8.6→8.2** and CTR **improved 1.7%→2.1%** despite the exposure loss. The data are **not evidence of a generalized on-page ranking failure**. A country/mobile-specific demand or SERP visibility/mix change is plausible, but Google Trends/SERP composition and daily breakpoints were not independently verified; do not assert the cause as fact. **Decision: HOLD detector title/content rewrite and technical remediation** until evidence of a URL defect, rankings deterioration, or recoverable query intent appears. Monitor the India mobile exact-query cohort weekly, with US (328 vs 330 clicks) as a relative comparison. Preserve client-side MediaPipe: free detection must not create per-use Vercel Function calls.

### WP2 — Consumer funnel: actual GA4 events verified; transaction-level reconciliation blocked

GA4 `AI-2024 / visutry.com`, **Oct 4–31 2026**, Events report uses **100% of available data**. These are **whole-property event counts** including repeat actions and potentially test/internal activity; **not one ordered user cohort**. GA4 total reported revenue is **$41.86**.

| Actual GA4 event | Events | Users (GA4 report) |
| --- | ---: | ---: |
| `face_shape_detection_started` | 6,568 | 3,419 |
| `face_shape_photo_uploaded` | 6,567 | 3,418 |
| `face_shape_detection_completed` | 5,419 | 3,221 |
| `face_shape_detection_failed` | 1,158 | 576 |
| `journey_continued` | 3,407 | 1,992 |
| `face_shape_detector_photo_handoff` | 2,130 | 1,645 |
| `seo_funnel_click` | 1,433 | 1,020 |
| `face_analysis_started` / `face_analysis_completed` | 641 / 330 | 364 / 317 |
| `tryon_started` / `tryon_completed` | 119 / 56 | 78 / 50 |
| `begin_checkout` / `purchase` | **32 / 14** | **31 / 14** |
| `checkout_return_verified` | 14 | 14 |

**Instrumentation verified in source:** `src/lib/analytics.ts` emits canonical detector names shown above, not legacy `face_shape_detector_start`; `src/components/face-shape/FreeFaceShapeResult.tsx` fires `journey_continued` on Detector result CTA and reports photo handoff; `src/components/analytics/PaymentConversionTracker.tsx` emits `purchase` only after an authenticated `/api/payment/conversion` response reports a completed Payment, deduplicating by Checkout Session ID. The free on-device completion intentionally **does not** call `/api/analytics/consumer-funnel` on each detection (`src/lib/consumer-funnel.ts`); the latter is not a complete Detector telemetry source. Do not alter this cost/privacy boundary.

**GA4 destination config, confirmed Nov 1:** Prior to this work the property had six registered event custom dimensions (`cta_location`, `destination`, `source_page`, `purchase_context`, `continuation_action`, `face_shape`). Created and verified three additional **event-scoped** definitions: **Consumer product path → `product_path`**, **Consumer query cluster → `query_cluster`**, **Consumer landing locale → `landing_locale`** (nine total). These are for *future reported events*, not retroactive reclassification of the Oct data. Deliberately did not add high-cardinality `landing_page` URLs or arbitrary referrer host names to the custom-definition quota; use standard GA4 landing-page/channel dimensions when possible. No GA4 key-event toggles, purchase values, code, cookies, or server event forwarding were changed.

**Decision/gate:** Mark *aggregate event readback* DONE but **qualified session→stage→purchase attribution PARTIAL**: the raw counts cannot establish who proceeded or revenue per 1,000 *qualified organic* sessions. The landing report showed EN Detector **1,721 sessions and 0 GA4 purchases attributed to that landing page**, EN guide **1,001 sessions and 4 purchases ($11.96)**, EN Advisor **454 sessions and 5 purchases ($14.95)**. These are GA4 landing-page attribution observations, **not proof** that Detector entrants never pay after navigating. Complete session/cohort analysis after custom dimensions populate, validate internal/test exclusions, and reconcile the 14 GA4 purchase IDs/$41.86 to authorized live Stripe/Payment rows before claiming verified revenue. Direct Stripe access was **not available in this readback**, so no fake reconciliation or identity joins were made. Do not use all-key-events rate as a cross-page funnel quality metric; detector events are not configured identically to Advisor key events.

### WP3 — EN AI guide: query mix diagnosis completed, snippet/content rewrite held

Filtered `/en/blog/ai-face-analysis-for-glasses-guide` in the same one-day-later GSC comparison: **967 vs 1,118 clicks**, **20,374 vs 16,596 impressions**, **4.7% vs 6.7% CTR**, **8.1 vs 7.6 mean position**.

| Query | Clicks recent vs prior | Impressions recent vs prior | Interpretation |
| --- | ---: | ---: | --- |
| `which glasses suit my face ai free` | **65 vs 155** | **440 vs 763** | **−90 clicks** and reduced high-intent exposure |
| `which glasses suit my face` | **22 vs 18** | **1,430 vs 647** | **+783 generic impressions**, only 1.5% recent CTR |
| `what glasses suit my face` | **9 vs 5** | **871 vs 405** | **+466 generic impressions**, only 1.0% recent CTR |
| `what glasses suit my face upload photo online free` | **101 vs 96** | **991 vs 750** | Photo-upload intent still wins clicks |
| `what glasses suit my face upload photo` | **99 vs 94** | **1,238 vs 1,250** | Stable high-intent demand/clicks |

**Source audit:** The existing English metadata says “Which Glasses Suit My Face? Free AI Face Shape Detector”, describes free photo upload then optional AI advice/try-on; the page has substantial answer content plus hero, midpoint, path-grid and closing CTAs. This is **not an absent CTA or missing keyword defect**. Broader low-CTR query expansion plus one high-intent query collapse explain important parts of the aggregate CTR change; precise SERP/snippet causation remains unverified. **Decision: HOLD immediate title rewrite, duplicated article, new locale rollout and CTA reordering.** Those changes could risk healthy photo-upload queries and the guide's 4 attributed GA4 purchases. First compare query-level weekly cohorts and actual `seo_funnel_click` by registered `source_page` / `destination` / `cta_location`; ship one isolated snippet or above-fold experiment only if a specific mismatch persists and the qualified continuation guardrail is measurable. No website code, page metadata or production URLs changed in this package.

### Page and query movement

| Page | GSC clicks, recent vs prior | Impressions recent vs prior | Decision |
| --- | ---: | ---: | --- |
| `/en/face-shape-detector` | **1,540 vs 1,944 (−20.8%)** | **53,844 vs 79,992** | **P0 diagnose search exposure loss**; GA4 landing 1,721 vs 2,058 |
| `/en/blog/ai-face-analysis-for-glasses-guide` | **975 vs 1,112** | **20,243 vs 16,443** | **P0 test snippet/intent and next-step CTA**; GA4 landing 1,001 vs 1,150 |
| `/en/brand/gentle-monster` | 535 vs 625 | 1,604 vs 1,591 | P1 improve Try-On continuation |
| `/ja/face-shape-detector` | **350 vs 60** | 3,592 vs 683 | Protect localized win; GA4 landing 364 vs 63 but 2 key events, $0 reported revenue |
| `/es/face-shape-detector` | **194 vs 61** | 2,458 vs 761 | Protect; evaluate quality before new locale pages |
| `/en/face-analysis` | **261 vs 234** | 4,409 vs 3,265 | Watch paid-funnel continuation |

Top GSC queries: `face shape detector` **643 clicks/28,916 impressions**, Japanese `顔の形診断 カメラ 無料` **168/1,596**, `visutry` **150/206**, `face shape detector for glasses` **116/673**, `gentle monster virtual try on` **84/192**. Query/rank/device mix is still a hypothesis; avoid blindly rewriting high-performing titles.

**Query-level diagnostic refinement (same GSC comparison):** On the EN detector specifically, exact query `face shape detector` fell **1,059 → 642 clicks (−417)** and **49,682 → 28,916 impressions (−20,766)**; its average position remained roughly **7.7 → 7.9** and CTR improved **2.1% → 2.2%**. The page as a whole had stable average position **8.1 → 8.1** and CTR **2.4% → 2.9%**. This one query more than explains the page's net −404 clicks. **Do not treat the decline as proven on-page SEO deterioration:** demand/SERP visibility mix and country/device composition require investigation before changing the page. On EN AI guide, CTR **6.8% → 4.8%** and mean position **7.6 → 8.1** as impressions grew; specifically `which glasses suit my face ai free` fell **153 → 71 clicks**, with **796 → 434 impressions**, while broader `which glasses suit my face` gained impressions (**619 → 1,386**) with clicks only **17 → 20**. Prioritize query-intent and snippet/section testing rather than a broad rewrite.

### GEO and indexability

GSC's **Google Search Generative AI beta** report (Oct 2–29) shows **17,036 impressions** (not clicks/sessions). EN detector **7,309**, EN AI guide **4,358**, EN face analysis **1,072**, Gentle Monster **692**, JA detector **485**. Separately GA4 AI Assistant reports 588 vs 850 sessions; do not claim these measures map one-to-one. Audit sources and downstream decisions.

GSC indexing (last updated Oct 23): **448 indexed; 831 not indexed**. This is not 831 confirmed defects. Breakdown: **278 discovered/not indexed** (sample Arabic blogs/guides, no crawl dates), **78 crawled/not indexed** (sample RU/ID/ES/JA localized guides and parameterized Compare), **262 noindex**, **118 alternate canonical**, **44 redirect pages**, **27 Google-selected different canonical**, **11 duplicate without specified canonical**, **8 actual 404**, **4 redirect errors**, **1 soft 404**. Investigate the **356 discovered/crawled** by language and value, plus the 8+4+1 status anomalies. Check that noindex/alternate/redirect is intentional before seeking indexing. The older 683-404 snapshot is not a current count.

**GSC 404/redirect-error samples (Oct 23 coverage):** The 8 `404` examples are one old hashed `/_next/static/css/...css?dpl=...` asset, 3 `/blog/tag/` legacy slugs with spaces (`Eyewear Tips`, `Style Inspiration`, `Fashion Tips`), 2 short-lived `/share/` links (root and `/fr/share/`), `/5`, and `/style/diamond`. They are **not 8 confirmed high-value Consumer landing pages**. The 4 redirect-error examples are `/id/business`, `/es/business`, `/ja/business`, `/en/try-on` (last crawled Aug–Sep). Check current response/redirect destinations and demand before shipping redirects; never indiscriminately redirect expired private share tokens.

## Verified historical funnel and search facts

| Evidence date/window | Fact | Interpretation |
| --- | --- | --- |
| 2026-08-03 GA baseline | ~1,824 Consumer website sessions / 30d, ~1,651 active users | Original directional 10× baseline |
| 2026-07-18 → 2026-08-14 GA | 2,906 sessions / 28d | Growth, not current November traffic |
| 2026-08-08 → 2026-08-14 GA | 1,074 sessions/week; 657 Organic Search (61.17%), 186 AI Assistant | Historical channel signal; no current attribution proof |
| 2026-06-27 → 2026-07-24 GSC | 404 clicks, 8,158 impressions, 5.0% CTR | Historical query evidence, not present ranking |
| Same GSC window | AI face-analysis article 171/404 clicks; Ray-Ban guide 15 clicks/1,442 impressions | Historical high-priority refresh candidates |
| 2026-06-24 GSC audit | 683 URLs marked 404 in an earlier indexing snapshot | **Must recheck** after legacy redirects; not a current error count |
| 2026-09-03 Discovery Canary T0 | 0 genuine Agent/Store-Campaign sessions at T0 | Separate Merchant/first-party Demo evidence, **not** proof that Consumer AI referrals are zero |

**Remaining measurement gaps:** Authenticated browser GA4/GSC readback is captured above. Still open: property time zone and internal/test exclusions, first-party journey and Stripe payment verification, 90d GA4 comparison, query/country/device shifts, AI service attribution and page-level crawl samples.

## Current shipped assets verified

- `main` retains the Search→Tool path, nine-locale routes, canonical/sitemap/structured page content, first-party Visual SEO B01–B06 and Consumer attribution hooks. `/en/face-shape-detector` and `/en/glasses-guide/best-rectangle-glasses-for-round-face` were publicly retrievable with substantial, task-specific text and imagery.
- PR [#134](https://github.com/franksunye/VisuTry/pull/134) and [#135](https://github.com/franksunye/VisuTry/pull/135) merged B07–B09's 30 PNG images into eight existing English combination-guide pages. The old Visual SEO ledger incorrectly called them merely SOURCE_READY; full acceptance requires fresh QA/image-discovery checks.
- PR [#87](https://github.com/franksunye/VisuTry/pull/87) made immutable SEO route families static; PR [#470](https://github.com/franksunye/VisuTry/pull/470) restored static public Try-On rendering. Preserve these performance protections.
- The dedicated `visutry-traffic-pro` Axiom Consumer stream exists in current code; the Agent distribution script reads both legacy and flat datasets. Authenticated query/data-quality verification remains necessary.

## Audit findings to investigate, not blindly patch

1. In `public/robots.txt`, explicit Googlebot/Bingbot groups with `Allow: /` may override `User-agent: *` Disallow rules. Reconcile intentional crawl policy using official robots group precedence **without blocking JS/CSS required for rendering**. Robots.txt is not an authorization boundary.
2. `src/lib/sitemap-static.ts` includes localized combination guide URLs and images from the B01–B06 registry, but does not explicitly list B07–B09 combination image assets in its `/glasses-guide` sitemap entries. HTML images are discoverable; measure whether explicit image sitemap enhancement is warranted.
3. GSC Oct 23 coverage now reports 8 404s (June's 683 was historical); EN detector is generating current GSC clicks. Reconcile specific excluded URLs and URL Inspection results before technical changes.
4. The May 2026 Google FAQ rich-result deprecation means FAQ text can remain useful to visitors, but old “FAQ rich result” growth expectations must not be counted as current GEO advantage.
5. Do not restart the 182-image production queue, 500/1,000-page tactics or fixed-volume directory/comment/outreach activities simply because older checkboxes are open.

## First four weekly operating gates

| Week | Entry gate | Smallest acceptable outcome |
| --- | --- | --- |
| W1 — measurement | Authenticated 28d/prior-28d GA4/GSC done; qualification still open | Validate exclusions and first-party/Stripe outcomes; capture GA4 90d |
| W2 — index + refresh | GSC page deltas and 8 404s known | Inspect EN detector/AI guide, locale indexing and robots; ship at most 1–2 measured improvements |
| W3 — GEO + visual | GSC Generative AI 17,036 impressions and GA4 AI 588 sessions | Verify referrers, tool continuation and one bounded image/answerability hypothesis |
| W4 — review | Two or more comparable measured windows | SCALE/MODIFY/STOP, paid quality guardrail, update current backlog and retire stale artifacts |

## Done / blocked definition

- **DONE (this audit):** Code/doc inventory, historical provenance, authenticated current GA4/GSC 28d comparisons, GSC Generative AI beta and indexing readback, prioritized weekly operating contract.
- **PARTIAL:** 90d GA4, strict *qualified Consumer* 10× ratio, test filtering, source-to-decision funnel, Stripe-verified revenue and per-URL post-recrawl/indexing outcomes.
- **NOT ATTEMPTED IN THE ORIGINAL THREE WORK PACKAGES:** production ranking claims, real content publication, SEO settings changes, paid/provider calls, outreach, account/credential changes, deletion of historical evidence. Subsequent EN content publication is recorded in the follow-on section below.

## Follow-on authenticated GSC indexing and English-content execution — Nov 1

The Browser extension was subsequently recovered, allowing read-only authenticated access to GSC URL-indexing lists and Inspection; this resolves the earlier audit's browser-unavailable caveat without changing its 28-day metric windows.

- **Snapshot integrity:** GSC Page indexing last refreshed Oct 23. All **278 discovered-not-indexed** and **78 crawled-not-indexed** example URLs were enumerated (356 unique, zero overlap). Discovered: 93 `glasses-guide`, 70 blog, 37 `/style/`, 21 `/sunglasses-for/` (the balance spans other hubs, localized homepages, legal/B2B, and tools). Crawled: 28 tag URLs, 12 legacy/user/auth routes, 6 static assets, plus smaller valid-page groups. This grouping is **triage**, not a count of technical faults. The Oct 23 report is not the same as the most recent per-URL inspection.
- **Individual Google states differ:** `/ru/style/diamond-face` Inspection said **indexed**, successful smartphone crawl on Oct 25, and self Google-selected canonical even though the URL remains in the aggregate crawled-not-indexed list. `/en/style/diamond-face` and `/en/style/round-face` Inspection said discovered but never crawled; both were associated with the sitemap, and referrer paths are visible. The Nov 1 **LIVE TEST** of `/en/style/round-face` reported eligible for indexing, successful smartphone crawl, robots permitted, and self canonical. Live eligibility is **not** actual indexed status or a promise of future ranking.
- **Sitemap control:** GSC root `/sitemap.xml` success (last read Oct 30; 749 discovered URL entries); child `core.xml` 629, `blog.xml` 118, `dynamic.xml` 2, all successful. The `/en/glasses-for-face-shape` page linked all seven EN shape guides and used self canonical/index-follow in current HTML. With sampled technical eligibility and a functioning sitemap, a blanket robots/canonical/sitemap fix is not substantiated. Editorial differentiation and crawl prioritization are *hypotheses*, not established causes.
- **Observed editorial defect and corrective action:** live EN `/style/round-face` and `/style/diamond-face` displayed lowercase shape fragments in title/H1 and four cards titled sequentially, each repeating the same generic shape sentence despite four different visual presets. [#496](https://github.com/franksunye/VisuTry/pull/496), merged to `main` at `02f403de4ab353b05f44a818972eb692150e660c`, updates seven EN existing-page titles/sections and 28 individual frame-fit notes. It preserves URL/CTA/analytics semantics and non-English grammar. All three GitHub Quality Gate jobs passed. Production: Production SHA `02f403de`, Vercel `dpl_ECUi4mw1fVSZhzacMQnJsxAsRot8` **READY**; canonical `www` page-content readback **7/7** EN pages shows new H1, style-name cards, and distinct recommendation notes (Nov 1); relevant 30-minute Vercel runtime-error scan clear. Outcome is **content quality**, not measured indexation or revenue growth.
- **Independent GA4 access corroboration:** GA4 Home was readable through the same connected local Chrome. Its default **last-7-days** cards showed about **1.7K active users (+5.9%)**, **~1.4K Organic Search sessions (+7.4%)**, **177 AI Assistant sessions (+4.1%)**, 569 key events (+2.2%), and 3 purchases (+50%). These are approximate dashboard values and a **different time window** from the exact 28-day audit; do not mix them into the 10× comparison or interpret key events as a qualified funnel.

**Next measurable gate:** production HTML is now verified on 7/7 guides; next perform weekly GSC per-URL inspection for the seven EN guides, measure indexed count and comparable click/impression changes, and validate qualified downstream action rates. No Google index requests, Cloudflare purge, or bulk page publication was issued in this follow-on step.

## Legacy CDN alias delivery closure — Nov 1

**Legacy diamond alias CDN follow-up — 2026-11-01 12:46 UTC.** Canonical public `/style/diamond` and `/en/style/diamond` were re-requested as **bare URLs**, without cache-busting query parameters. Each returned **308** with `Location: /en/style/diamond-face`; the redirected destination returned **200**. The formerly stale `/en/style/diamond` edge response no longer served an old 404 (`CF-Cache-Status: EXPIRED/MISS` in sampled requests). Existing [#494](https://github.com/franksunye/VisuTry/pull/494) is now **delivery-verified**; no purge needed. This does **not** establish Google's current indexed status or clear its lagging exclusion snapshot. See the canonical task ledger for the remaining recrawl readback.

