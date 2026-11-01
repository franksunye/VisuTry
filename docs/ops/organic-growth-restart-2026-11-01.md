# Organic Growth Restart — 2026-11-01 Read-only Evidence

**Status:** RESTART APPROVED; **AUTHENTICATED GA4/GSC 28-DAY READBACK COMPLETE; QUALIFIED FUNNEL PARTIAL**  
**Repository baseline:** `franksunye/VisuTry` `main` `f90ad9caeef71b9adc999b8585a5f008534eee35`  
**Scope:** Consumer qualified organic acquisition (SEO + GEO/AI discovery + Visual), no paid growth, no production writes, no outreach.  
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
- **PARTIAL:** 90d GA4, strict *qualified Consumer* 10× ratio, test filtering, source-to-decision funnel, Stripe-verified revenue and URL Inspection sample checks.
- **NOT ATTEMPTED:** production ranking claims, real content publication, SEO settings changes, paid/provider calls, outreach, account/credential changes, deletion of historical evidence.
