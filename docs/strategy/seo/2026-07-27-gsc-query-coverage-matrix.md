# GSC Query Coverage Matrix — 2026-07-27

Status: active SEO allocation baseline
Property: `https://www.visutry.com/`
Source: Google Search Console web search export, downloaded 2026-07-27
Latest complete GSC date: 2026-07-24

## Executive decision

VisuTry does not need another broad keyword brainstorm before acting. Current GSC data already shows three commercially useful demand clusters and the exact failure mode:

1. `which/what glasses suit my face` is the largest non-brand high-intent cluster.
2. `face shape detector for glasses` is already reaching page-one positions.
3. Ray-Ban virtual try-on terms have substantial impressions and page-one rankings but weak CTR.

The immediate constraint is coverage and URL ownership, not proof of demand. Google is sending the two strongest face/glasses clusters mainly to the English AI face-analysis article. The free detector is not indexed, and the localized specialist pages are barely visible. The next SEO sprint should therefore strengthen the winning article-to-tool funnel, get the detector indexed, and reproduce the proven intent path as genuinely localized content across all supported locales.

## Measurement window

| Window | Dates represented | Clicks | Impressions | CTR | Average position |
| --- | --- | ---: | ---: | ---: | ---: |
| Last 28 days | 2026-06-27 to 2026-07-24 | 404 | 8,158 | 5.0% | 9.7 |
| GSC “3 months” | 2026-06-11 to 2026-07-24 | 438 | 8,938 | 4.9% | 9.8 |

The property has only 44 days of data inside the selected 90-day window. The latest 28 days account for 92.2% of recorded clicks and 91.3% of impressions, so the growth is recent rather than a historical average.

## Query-to-page coverage matrix

Cluster figures below aggregate the exported query rows using mutually exclusive intent rules. GSC suppresses some low-volume queries for privacy, so cluster totals will not sum to property totals.

| Priority | Intent cluster | 28d clicks / impressions | 28d CTR / position | 90d clicks / impressions | Current Google landing page(s) | Intended owner and funnel | Coverage decision |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| P0 | Glasses advisor: `which/what glasses suit my face`, `best glasses for my face` | 61 / 1,199 | 5.09% / 10.03 | 61 / 1,233 | `/en/blog/ai-face-analysis-for-glasses-guide` dominates; `/en/face-analysis` is secondary | Keep the article as the acquisition owner; send primary CTA to `/en/face-analysis`, with free detector and try-on alternatives | Covered, but conversion bridge and multilingual copies are incomplete |
| P0 | Face-shape detector for glasses: detector, scanner, analyzer, finder | 20 / 433 | 4.62% / 9.72 | 23 / 454 | English AI article and `/en/face-analysis`; detector hub receives no measurable query exposure | `/en/face-shape-detector` owns free detector terms; article explains; `/en/face-analysis` owns paid personalized advice | Blocked by detector indexing plus keyword cannibalization |
| P1 | Ray-Ban virtual try-on | 8 / 873 | 0.92% / 6.71 | 8 / 873 | `/en/blog/rayban-glasses-virtual-tryon-guide` | Keep article as owner and route directly into `/en/try-on/glasses` | Strong ranking, weak snippet/CTR; optimize existing page before creating another |
| P1 | Generic virtual glasses try-on | 2 / 188 | 1.06% / 17.59 | 2 / 201 | Fragmented; tool URL does not appear in exported top pages | `/en/try-on/glasses`, supported by comparison/editorial pages | Partial coverage; verify indexing and strengthen internal ownership |
| P2 | Sunglasses for face shape | 2 / 50 | 4.00% / 37.32 | 2 / 50 | New localized hubs/details have very small visibility | `/{locale}/sunglasses-for-face-shape` and `/{locale}/sunglasses-for/{shape}` | Built but immature; improve discovery/internal links, then measure |
| P2 | Ordinary glasses by exact face shape | Included mainly in advisor/detector long tail | — | — | English `/style/{shape}` pages; non-English variants are `noindex` and English-only | `/{locale}/style/{shape}` for all nine supported locales | Material multilingual gap; localize before enabling indexation |
| Observe | Oliver Peoples product review | 0 / 99 visible-query rows | 0% / 7.18 | 0 / 104 | `/en/blog/oliver-peoples-finley-vintage-review` | Existing review to try-on bridge | Ranking is healthy but this is below the detector/advisor opportunity |

## Exact query ownership evidence

| Query, last 28 days | Clicks | Impressions | Position | Actual page split | Finding |
| --- | ---: | ---: | ---: | --- | --- |
| `which glasses suit my face ai` | 22 | 373 | 8.41 | AI article 22/372; face-analysis 0/1 | The article is the established SERP winner |
| `which glasses suit my face ai free` | 21 | 497 | 8.02 | AI article 21/496; face-analysis 0/2 | Do not replace the article; make its first CTA satisfy “free” intent |
| `face shape detector for glasses` | 7 | 257 | 9.78 | AI article 5/175; face-analysis 2/84; glasses hub 0/2 | The intended detector URL is absent and other pages are competing |
| `ray ban virtual try on` | 4 | 277 | 6.32 | Ray-Ban guide is the relevant owner | Ranking is already valuable; CTR is the lever |

## Page coverage findings

| Page, last 28 days | Clicks | Impressions | CTR | Position | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| `/en/blog/ai-face-analysis-for-glasses-guide` | 171 | 4,291 | 3.99% | 9.22 | Largest non-brand acquisition asset: 42.3% of all clicks and 52.6% of impressions |
| `/en/face-analysis` | 92 | 777 | 11.84% | 7.83 | Strong transactional page; preserve its paid-advisor positioning |
| `/` | 85 | 310 | 27.42% | 9.63 | Mostly brand/navigation; continue routing to free detector |
| `/en/blog/rayban-glasses-virtual-tryon-guide` | 15 | 1,442 | 1.04% | 6.80 | High-impression CTR opportunity |
| `/en/glasses-for-face-shape` | 0 | 113 | 0% | 18.54 | Relevant hub exists but is not yet competitive |
| `/en/sunglasses-for-face-shape` | 0 | 61 | 0% | 39.26 | Too early/weak to expand with more adjacent editorial content |

The GSC URL inspection for `/en/face-shape-detector` returned **“Discovered — currently not indexed.”** It is present in `https://www.visutry.com/sitemap.xml`, has no recorded crawl, and GSC reported no detected referring page. After verifying the live URL returned 200 with `index,follow`, the correct canonical, sitemap inclusion, and crawlable links, an indexing request was submitted successfully on 2026-07-27 and the URL was added to Google's priority crawl queue.

## Country and language allocation

| Priority | Market signal, last 28 days | Current specialist coverage | Required action |
| --- | --- | --- | --- |
| Tier 1 | US: 2,516 impressions, 37 clicks, 1.47% CTR, position 11.82 | English pages dominate | Improve titles/descriptions and ownership on the proven English pages |
| Tier 1 | UK: 818 impressions, 37 clicks, 4.52% CTR, position 9.88 | English pages dominate | Same English cluster; no separate content fork |
| Tier 1 | India: 972 impressions, 55 clicks, 5.66% CTR, position 8.04 | English pages dominate | Mobile-first English funnel and performance |
| Tier 2 | France: 109 impressions, 19 clicks, 17.43% CTR, position 5.23 | `/fr` gets traffic; specialist localized pages are not visible | Localize the proven advisor article and preserve French detector/hub copy |
| Tier 2 | Germany: 182 impressions, 14 clicks, 7.69% CTR, position 12.41 | Specialist pages not visible | Localize proven intent assets and improve internal discovery |
| Tier 2 | Russia: 88 impressions, 12 clicks, 13.64% CTR, position 9.59 | `/ru` gets 13 clicks; specialist pages not visible | Localize the proven advisor article and link from `/ru` |
| Tier 3 | Indonesia, Brazil/Portuguese, Japan, Spain, Arabic markets | Localized hubs exist; traffic is dispersed | Complete the same intent architecture for `id`, `pt`, `ja`, `es`, and `ar`; do not create unrelated eyewear news |

“Tier” controls rollout/QA order, not final locale scope. The intended completion scope remains all supported locales: `en`, `fr`, `ru`, `de`, `es`, `pt`, `ja`, `id`, and `ar`.

Two multilingual gaps are concrete in the repository:

- `/[locale]/blog/ai-face-analysis-for-glasses-guide` renders hardcoded English content and metadata for every locale. It has not yet been genuinely localized despite being the strongest organic entry page.
- `/[locale]/style/[faceShape]` sets non-English pages to `noindex` and `availableLocales: ['en']`; ordinary-glasses detail content is therefore English-only.

## Device constraint

Mobile generated 317 of 404 clicks (78.5%) and 4,916 impressions, with 6.45% CTR and position 7.82. Desktop generated 81 clicks from 3,153 impressions, with 2.57% CTR and position 12.69. Every SEO-to-detector CTA and upload flow should therefore be reviewed on mobile first.

## Next execution order

1. **Index and establish the free detector owner.** Add prominent crawlable links to `/en/face-shape-detector` from the winning AI article, `/en/face-analysis`, homepage, and glasses hub; verify canonical/robots/sitemap; deploy; then request indexing and recheck.
2. **Monetize the current winner before publishing more pages.** Rewrite the winning AI article's first screen around the proven queries, present “free detector” as the primary path, and preserve direct paid-advisor and try-on continuations with GTM attribution.
3. **Localize the winning intent path across all nine locales.** Translate the AI advisor article, detector-to-advisor bridge, metadata, FAQ, and schema. QA in the order `fr`, `ru`, `de`, then `pt`, `id`, `ja`, `es`, `ar`.
4. **Complete ordinary-glasses face-shape details.** Localize `/style/{shape}`, remove non-English `noindex` only after content is complete, and use the existing glasses preset assets for contextual try-on examples.
5. **Optimize existing high-impression pages.** Improve the Ray-Ban guide title/snippet and above-fold try-on CTA; strengthen `/en/try-on/glasses` ownership. Do not add a duplicate Ray-Ban or generic try-on article.
6. **Measure for 14 days.** Compare GSC query/page movement with `seo_funnel_click`, detector start/completion, checkout, and verified purchase by landing page and locale.

## Decision rules

- Build a new page only when a distinct high-intent query family has no suitable owner.
- Optimize an existing owner when it already ranks in the top 20.
- Treat a page as an indexing problem when it is absent from page data and URL inspection confirms it is not indexed.
- Do not split near-synonyms across multiple pages; use one owner plus supporting sections/FAQ.
- Judge expansion by qualified funnel continuation and revenue per 1,000 organic sessions, not impressions alone.

## Raw data

The untouched GSC ZIP exports and normalized extracted CSV filenames are stored under `docs/strategy/seo/data/gsc-2026-07-27/` for the 28-day and selected 90-day windows.
