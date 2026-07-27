# Google Keyword Planner — brand virtual try-on opportunities

Date: 2026-07-27

Market: United States

Language: English

Range: July 2025–June 2026
Account limitation: Keyword Planner returned volume ranges rather than exact monthly counts because the account has no active campaign.

## What the data says

Broad brand demand is large, but a broad brand page is not automatically relevant to VisuTry. The useful signal is the narrower **brand + virtual try on** intent, because it can naturally enter the existing photo try-on flow.

| Query | Avg. monthly searches | Competition | Notable trend | Decision |
|---|---:|---|---|---|
| `warby parker virtual try on` | 1K–10K | Low | +900% year over year | P1 new page |
| `ray ban virtual try on` | 100–1K | High | Existing GSC page-one visibility | P1 optimize existing owner |
| `oakley virtual try on` | 100–1K | High | Clear product intent | P1 new page |
| `zenni virtual try on` | 100–1K | High | Broad `Zenni` demand also showed +900% over three months | P1 new page |
| `gentle monster virtual try on` | 100–1K | Medium | Strong fit with style-led visual comparison | P1 new page |
| Gucci / Prada / Maui Jim / Oliver Peoples / Tom Ford / Chanel / Cartier / Costa / Persol + virtual try on | 10–100 each | Mixed | Lower immediate opportunity | Observe; do not publish yet |

The broad brand seeds also showed `Ray-Ban`, `Maui Jim`, and `Zenni` at 100K–1M monthly searches, with Oakley, Gucci, Prada, Warby Parker, Tom Ford, Oliver Peoples, Gentle Monster, Versace, Chanel, Cartier, Burberry, Tiffany, and Coach generally at 10K–100K. These broad ranges are context, not the publishing priority.

## Shipped scope

- Updated the existing `/en/blog/rayban-glasses-virtual-tryon-guide` owner rather than creating a competing URL.
- Added `/en/brand/warby-parker`.
- Added `/en/brand/oakley`.
- Added `/en/brand/zenni`.
- Added `/en/brand/gentle-monster`.
- Used the existing Style Explorer optical and sunglasses assets as explicitly labeled **style directions**, not branded product images.
- Added direct, tracked links to `/en/try-on/glasses`, plus supporting face-shape routes.
- Added independent-tool and non-affiliation disclosures.

The initial pages are English-only because the Keyword Planner validation used the US/English market. Non-English route variants are `noindex` and excluded from the sitemap until localized search demand and localized copy are validated.

## Measurement plan

Baseline is the deployment date. Review at 14 days for discovery and at 28 days for an early traffic signal; do not judge revenue from a seven-day window.

### Google Search Console

- Query regex: `(?i)(ray.?ban|warby parker|oakley|zenni|gentle monster)`
- Page filter: the five shipped URLs above.
- Record impressions, clicks, CTR, average position, first query date, and number of distinct queries.
- Compare each page against its own first complete seven-day baseline.

### GA4 funnel

- Organic landing sessions by the five landing-page paths.
- `seo_funnel_click` where `query_cluster` begins with `brand-virtual-try-on:`.
- Break down by `source_page`, `destination`, and `cta_location`.
- Continue through try-on start, try-on completion, checkout start, and purchase where those events are available.

### Continue / stop rule

- Continue a brand cluster when impressions begin to grow and users click into try-on, even before purchases are statistically meaningful.
- Improve snippet or above-fold alignment when position is useful but CTR is weak.
- Do not add another brand simply because its broad name has volume. Require brand + try-on evidence, relevant existing assets, and a direct path to the product.
