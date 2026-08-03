# GTM Batch 1 — First 10 Search→Tool pages (2026-08-03)

**Status:** ✅ Batch 1 implemented; 9-locale Search→Tool follow-up also completed 2026-08-03  
**Source:** GSC export 2026-07-27 + GTM v3.1 + Engineering P0 template  
**Rule:** Refresh ranking owners before creating weak new pages. Ship only these 10 first; expand after indexing + impression review.

Template: `SearchToToolLanding` + `ProductContinuationCtas`  
Measurement tags: `query_cluster`, `content_cluster=search-tool`, `product_path`

---

## Selection logic

| Signal (28d) | Evidence | Implication |
| --- | ---: | --- |
| `which/what glasses suit my face*` | ~1,104 impr / 56 clicks | Largest non-brand cluster; keep article owner, add a tool-first page for upload-photo intent |
| `face shape detector for glasses*` | ~432 impr / 16 clicks | Detector must own this; stop cannibalization onto the blog |
| Ray-Ban virtual try-on | ~750+ impr / weak CTR | Optimize existing Ray-Ban guide; do not duplicate |
| `/en/glasses-for-face-shape` | 113 impr / 0 clicks / pos ~18 | Hub exists; needs title/snippet + internal links, not a rewrite from scratch |
| Compare / shape-vs | Almost none in GSC yet | Still ship one Compare owner — required product path in GTM |

---

## Batch 1 (ship in order)

| # | Action | Target URL | Primary query / cluster | Product path | Why now | Acceptance |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | **Refresh** | `/en/face-shape-detector` | `face shape detector for glasses`, `…online free`, `ai face shape detector for glasses` | Detector → Advisor / Try-On / Compare | Intended owner still loses SERP share to the blog; indexing was the prior blocker | Page is indexed; appears for detector queries; CTA events fire |
| 2 | **Refresh** | `/en/blog/ai-face-analysis-for-glasses-guide` | `which glasses suit my face ai free/ai` | Free Detector primary; Advisor secondary | #1 acquisition asset (~42% clicks). Monetize before new pages | Above-fold free Detector CTA; tracked `seo_funnel_click` |
| 3 | **Refresh** | `/en/glasses-for-face-shape` | `glasses for face shape`, suit-my-face hub terms | Detector / Try-On / Compare | Already on Search→Tool template; 113 impr / 0 clicks | Title/meta CTR lift; internal links from article + detector |
| 4 | **Refresh** | `/en/blog/rayban-glasses-virtual-tryon-guide` | `ray ban virtual try on`, `ray ban try on` | Try-On | Strong position (~6), CTR ~1% | Snippet/title + above-fold Try-On CTA; no new Ray-Ban URL |
| 5 | **Refresh** | `/en/try-on/glasses` | `virtual glasses try on`, `try glasses on photo`, `glasses test on face` | Try-On → Compare / Pricing | Tool URL barely owns generic VTO queries | Indexable landing copy + FAQ/schema + continuation CTAs |
| 6 | **New** | `/en/what-glasses-suit-my-face` | `what glasses suit my face upload photo`, `what glasses suit my face` (non-AI) | Detector → Advisor → Try-On | Upload-photo intent (32 impr / 0 clicks) is not served by the AI-article angle | Search→Tool page live; routes to detector with `query_cluster=what-glasses-suit-my-face` |
| 7 | **New** | `/en/virtual-glasses-try-on` | `virtual glasses try on`, `try glasses on photo`, `what would i look like with glasses` | Try-On → Compare | Generic VTO demand is fragmented; needs a dedicated SEO owner pointing at the tool | Template page + Try-On primary CTA + Compare secondary |
| 8 | **New** | `/en/compare-glasses-frames` | `compare glasses frames`, `which glasses look better`, `virtual try on tools comparison` | Frame Compare | Required GTM continuation surface; almost no current query ownership | Search→Tool page → `/try-on/glasses/compare` |
| 9 | **Refresh** | `/en/style/round-face` | `best glasses shape for round face`, glasses for round face | Detector / Try-On / Compare | Exact-shape pages exist; round has early GSC signal | Title/FAQ aligned to shape query; CTAs use ProductContinuationCtas |
| 10 | **Refresh** | `/en/face-shapes/compare/oval-vs-oblong` *(or nearest existing compare slug)* | `oval vs oblong face`, long/oblong confusion | Detector → style/try-on | GTM priority comparison cluster; supports advisor quality | Indexed compare page with clear next-step CTAs |

---

## Production checklist (each page)

1. Target query + user question + first useful answer  
2. One original visual (face→frame or before/after)  
3. Tracked CTAs: Detector and/or Try-On and/or Compare (`GrowthFunnelLink` / `ProductContinuationCtas`)  
4. `query_cluster` + `content_cluster=search-tool` + `product_path`  
5. FAQ + schema where appropriate  
6. Internal links: from AI article hub, glasses hub, and detector where relevant  
7. Mobile QA of first CTA and upload/tool entry  

---

## Localization follow-up — completed

The original Batch 1 intentionally launched English-first. The planned locale/sitemap follow-up is now complete.

Completion record: [`2026-08-03-search-to-tool-i18n-spec.md`](./2026-08-03-search-to-tool-i18n-spec.md)

Delivered:

- 7 core Search→Tool query landings + `/glasses-guide` hub across all 9 supported locales
- 30 `/glasses-guide/[slug]` detail guides across all 9 locales
- localized metadata, visible copy, FAQ, CTA and structured data
- full sitemap/hreflang topology with `x-default` → English
- route-intent protection for overlapping query owners
- Phase A merged via PR #16
- Phase B merged via PR #17

The original “Locale forks” exclusion therefore applies only to the initial English-first Batch 1 shipment, not the current production state.

---

## Still explicitly outside Batch 1

- More brand pages beyond Ray-Ban optimization  
- Sunglasses expansion (immature; pos ~40)  
- Hairstyle / beard adjacent content  
- Arbitrary page-count fill to “look complete”

---

## Post-launch operating order

The implementation work is closed. Continue with measurement rather than immediate page-count expansion.

Monitor:

- GSC indexing / impressions / CTR by query cluster and locale
- duplicate/canonical/hreflang signals
- Detector / Advisor / Try-On / Compare continuation from Search→Tool pages
- whether the 30 localized detail guides generate enough demand to justify the next query batch

**30-day gate still holds:** do not expand mechanically beyond the validated query set until GSC and Analytics show where Search→Tool demand and product continuation are actually accumulating.

---

## Related

- Completed locale + sitemap rollout: [`docs/strategy/growth/2026-08-03-search-to-tool-i18n-spec.md`](./2026-08-03-search-to-tool-i18n-spec.md)
