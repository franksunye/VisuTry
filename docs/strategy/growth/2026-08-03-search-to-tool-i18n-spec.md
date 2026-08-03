# Search→Tool Batch 1 — i18n + Sitemap

**Status:** ✅ Completed and merged to `main` on 2026-08-03  
**Created:** 2026-08-03  
**Completed:** 2026-08-03  
**Owner:** Growth / Engineering  
**Delivery:** Phase A PR #16 + Phase B PR #17

**Related:**

- Batch 1 ship notes: [`docs/strategy/growth/2026-08-03-search-to-tool-batch-1.md`](./2026-08-03-search-to-tool-batch-1.md)
- Indexing policy: [`docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md`](../seo/2026-06-30-product-architecture-seo-geo-sync.md) §8
- Global i18n policy: [`docs/I18N_TODO.md`](../../I18N_TODO.md)

---

## 1. Completion summary

The Search→Tool Batch 1 localization work is complete.

All in-scope Search→Tool acquisition surfaces now support the 9 production locales:

`en`, `id`, `ar`, `ru`, `de`, `ja`, `es`, `pt`, `fr`

The completed rollout includes:

- Phase A: 7 query-focused Search→Tool landings + `/glasses-guide` hub
- Phase B: all 30 `/glasses-guide/[slug]` detail guides
- Localized visible body copy, metadata, FAQ, CTA labels and structured-data strings
- 9-locale canonical/hreflang topology with `x-default` → English
- Sitemap emission for completed routes across all 9 locales
- English URL slugs retained across locales
- English machine `queryCluster` / analytics ids retained
- Product tool workflows left unchanged

The temporary Phase A indexing gate on non-English `/glasses-guide` was removed when Phase B localized detail content landed.

---

## 2. Final route inventory

### Phase A — completed

| Path | Final state |
| --- | --- |
| `/what-is-my-face-shape` | 9-locale localized + indexable |
| `/find-glasses-for-my-face` | 9-locale localized + indexable |
| `/try-glasses-on-photo` | 9-locale localized + indexable |
| `/ai-glasses-advisor` | 9-locale localized + indexable |
| `/what-glasses-suit-my-face` | 9-locale localized + indexable |
| `/virtual-glasses-try-on` | 9-locale localized + indexable |
| `/compare-glasses-frames` | 9-locale localized + indexable |
| `/glasses-guide` | 9-locale localized + indexable after Phase B |

Phase A also introduced route-level intent protection for the closest query pairs so they do not collapse into near-duplicate localized content:

- `/find-glasses-for-my-face` vs `/what-glasses-suit-my-face`
- `/try-glasses-on-photo` vs `/virtual-glasses-try-on`

### Phase B — completed

`/glasses-guide/[slug]` now contains **30 guides × 9 locales**.

Groups remain:

- **face-frame:** 16
- **gender-style:** 8
- **decision-question:** 6

English slugs are shared across locales; no localized slug aliases were introduced.

---

## 3. Final engineering pattern

Long-form Search→Tool SEO content uses typed locale config modules rather than `messages/*.json`.

Key implementation modules include:

- `src/config/search-to-tool-locales.ts`
- `src/config/search-to-tool-phase-a-locales.ts`
- `src/config/search-to-tool-route-overrides.ts`
- `src/config/search-to-tool-route-copy.ts`
- `src/config/search-to-tool-shell-locales.ts`
- `src/config/glasses-guide-hub-locales.ts`
- `src/config/search-combination-locales.ts`
- `src/lib/search-to-tool-seo.ts`

The page pattern is:

```text
page.tsx
  → locale-aware typed copy getter
  → localized visible copy + FAQ/HowTo/SoftwareApplication schema
  → generateSearchToToolSEO(...)
  → canonical / hreflang for all available locales
sitemap.ts
  → path × locales + alternates.languages + x-default
```

The Search→Tool-specific SEO wrapper also normalizes absolute URLs so a trailing slash in `NEXT_PUBLIC_SITE_URL` cannot create malformed double-slash canonical/hreflang URLs.

---

## 4. Localization and indexing rules retained

The completed implementation follows the geo-sync quality rule: **do not advertise untranslated locale copies through sitemap or hreflang**.

A route is indexable for a locale only when these are localized together:

- title
- meta description
- visible page body
- FAQ
- CTA labels used on the page
- structured-data text

This rule remains the standard for future Search→Tool expansions.

Arabic continues to use the existing global RTL locale layout; no route-specific RTL fork was added.

---

## 5. Sitemap / hreflang final state

For the completed Search→Tool scope:

- All Phase A routes are emitted for all 9 locales
- `/glasses-guide` is emitted for all 9 locales
- All 30 detail guides are emitted for all 9 locales
- Each localized route uses the full alternate-language set
- `x-default` resolves to the English URL
- English path segments remain unchanged under every locale

Examples:

- `/ja/what-is-my-face-shape`
- `/de/glasses-guide/best-rectangle-glasses-for-round-face`

---

## 6. Completed checklist

### Phase A

- [x] Add typed EN + 8-locale Search→Tool copy
- [x] Wire 7 query landings to locale-aware getters
- [x] Localize `/glasses-guide` hub shell
- [x] Localize shared Search→Tool shell / continuation CTA defaults
- [x] Protect overlapping route intents from duplicate body copy
- [x] Localize FAQ and structured-data strings from the same source
- [x] Add canonical/hreflang URL normalization
- [x] Add 9-locale sitemap emission for completed landing routes
- [x] Build/type/lint/static-generation validation
- [x] Merge Phase A to `main` via PR #16

### Phase B

- [x] Add `src/config/search-combination-locales.ts`
- [x] Localize all 30 combination guide pages across 9 locales
- [x] Localize guide page shell, FAQ, CTA and HowTo strings
- [x] Localize related-guide cards and hub card content
- [x] Remove the non-English hub/detail indexing gate
- [x] Emit all 30 × 9 guide URLs in sitemap with full alternates
- [x] Add regression coverage for 30 guides × 9 locales and 16/8/6 group counts
- [x] Build/type/lint/static-generation validation
- [x] Merge Phase B to `main` via PR #17

---

## 7. Validation record

Both phases passed production Next.js build validation before merge.

Phase B validation included:

- successful compile
- type/lint validation with only pre-existing repository warnings
- static generation: **1474 / 1474 pages**
- Vercel deployment reached READY on the functional Phase B implementation
- source-level QA across face-frame, gender-style and decision-question page families
- representative Japanese and Arabic locale review

Unit regression tests were added for the localization configuration. The Vercel build pipeline does not execute `test:unit`, and no persistent PR-triggered GitHub Actions test workflow was added as part of this task.

---

## 8. Acceptance result

The original acceptance target is considered met at implementation level:

1. Non-English Search→Tool routes render locale-specific copy rather than full-page English
2. Completed routes no longer carry the EN-only page-level indexing gate
3. Sitemap/hreflang topology is expanded to the 9 supported locales
4. FAQ / HowTo structured-data strings are built from localized page copy
5. Phase B detail guides now close the localized Hub → Detail internal-link loop

---

## 9. Explicitly unchanged

This task did **not** change:

- Product tool workflow UI/routes
- Dashboard/history/product internals
- English URL slug policy
- `queryCluster` / analytics machine ids
- General `messages/*.json` long-form SEO architecture
- Older EN-only SEO clusters outside this Search→Tool scope

---

## 10. Follow-up monitoring, not part of this task

The implementation task is closed. Ongoing growth/SEO operations should monitor:

- GSC indexing and hreflang coverage
- impressions / CTR by locale and query cluster
- duplicate/canonical signals
- Search→Tool continuation into Detector / Advisor / Try-On / Compare
- whether localized guide clusters earn enough impressions to justify further query expansion

Possible future localization work remains out of scope here, including older EN-only clusters such as `/face-shapes`, `/hairstyles-for-face-shape` and `/face-shape-measurement`.
