# Search→Tool Batch 1 — i18n + Sitemap Spec

**Status:** Spec ready for implementation (docs only as of 2026-08-03)  
**Created:** 2026-08-03  
**Owner:** Growth / Engineering  
**Related:**

- Batch 1 ship notes: [`docs/strategy/growth/2026-08-03-search-to-tool-batch-1.md`](./2026-08-03-search-to-tool-batch-1.md)
- Indexing policy: [`docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md`](../seo/2026-06-30-product-architecture-seo-geo-sync.md) §8
- Global i18n policy: [`docs/I18N_TODO.md`](../../I18N_TODO.md)
- Reference implementation: [`src/app/[locale]/(main)/glasses-for-face-shape/page.tsx`](../../../src/app/[locale]/(main)/glasses-for-face-shape/page.tsx) + [`src/config/face-shape-seo-locales.ts`](../../../src/config/face-shape-seo-locales.ts)

---

## 1. Summary

On 2026-08-03 VisuTry shipped a set of Search→Tool landings and a combination guides hub. Those surfaces are **intentionally EN-only** today:

- Copy is hardcoded English in `page.tsx` or `src/config/search-combination-pages.ts`
- Metadata uses `noIndex: locale !== 'en'` and `availableLocales: ['en']`
- Sitemap emits only `/en/...` with `alternates.languages: { en }`

This spec defines how to promote those pages to **full 9-locale indexable** coverage without changing product tools, URL slugs, or Batch 1 query ownership.

**Default rollout:** Phase A (static landings + hub) first; Phase B (30 combination guides) in a follow-up PR against the same rules.

---

## 2. Goal / non-goal

### Goal

For each in-scope route, when a locale is opened for indexing:

1. Visible page copy is localized (hero, steps, principles, FAQ, CTA labels)
2. `title` / `meta description` are localized
3. FAQ / HowTo / SoftwareApplication JSON-LD strings match the localized visible copy
4. Metadata is `index,follow` for that locale
5. Hreflang lists all 9 locales + `x-default` → `/en{path}`
6. Sitemap lists all 9 locale URLs with full `alternates.languages`

### Non-goal

- Do **not** localize URL path/slug segments (keep English slugs under `/{locale}/...`)
- Do **not** put long-form SEO copy into `messages/*.json` / next-intl
- Do **not** localize tool workflow UI (try-on, compare, detector runtime, dashboard)
- Do **not** invent new Search→Tool routes in this workstream
- Do **not** advertise untranslated locale URLs in sitemap or hreflang

---

## 3. Locales

Supported locales (from `src/i18n.ts`):

`en`, `id`, `ar`, `ru`, `de`, `ja`, `es`, `pt`, `fr`

Default / `x-default`: `en`  
RTL: `ar` uses existing layout direction; no separate page layout.

---

## 4. Inventory

### Phase A — static Search→Tool landings + hub (priority)

| Path | Page file | Current copy location |
| --- | --- | --- |
| `/what-is-my-face-shape` | `src/app/[locale]/(main)/what-is-my-face-shape/page.tsx` | Inline EN |
| `/find-glasses-for-my-face` | `src/app/[locale]/(main)/find-glasses-for-my-face/page.tsx` | Inline EN |
| `/try-glasses-on-photo` | `src/app/[locale]/(main)/try-glasses-on-photo/page.tsx` | Inline EN |
| `/ai-glasses-advisor` | `src/app/[locale]/(main)/ai-glasses-advisor/page.tsx` | Inline EN |
| `/what-glasses-suit-my-face` | `src/app/[locale]/(main)/what-glasses-suit-my-face/page.tsx` | Inline EN |
| `/virtual-glasses-try-on` | `src/app/[locale]/(main)/virtual-glasses-try-on/page.tsx` | Inline EN |
| `/compare-glasses-frames` | `src/app/[locale]/(main)/compare-glasses-frames/page.tsx` | Inline EN |
| `/glasses-guide` | `src/app/[locale]/(main)/glasses-guide/page.tsx` | Inline EN hub shell |

Typical field set per landing (~29–32 strings):

- `metaTitle`, `metaDescription`
- `eyebrow`, `title`, `intro`
- `steps[]` (usually 3 × title/text)
- `principles[]` (optional)
- `faq[]` (usually 3 × question/answer) + optional `faqTitle` / `faqEyebrow`
- `ctaLabels` (detector / tryOn / compare / advisor as used)

### Phase B — combination guides

| Path | Config | Count |
| --- | --- | --- |
| `/glasses-guide/[slug]` | `src/config/search-combination-pages.ts` | **30** slugs |

Slugs (English, shared across locales):

**face-frame (16)**

- `best-rectangle-glasses-for-round-face`
- `best-square-glasses-for-round-face`
- `best-browline-glasses-for-round-face`
- `best-cat-eye-glasses-for-round-face`
- `best-geometric-glasses-for-round-face`
- `best-cat-eye-glasses-for-oval-face`
- `best-aviator-glasses-for-oval-face`
- `best-browline-glasses-for-oval-face`
- `best-oversized-glasses-for-oval-face`
- `best-round-glasses-for-square-face`
- `best-aviator-glasses-for-square-face`
- `best-rimless-glasses-for-square-face`
- `best-rounded-glasses-for-heart-shaped-face`
- `best-cat-eye-glasses-for-heart-shaped-face`
- `best-browline-glasses-for-diamond-face`
- `best-oversized-glasses-for-long-face`

**gender-style (8)**

- `glasses-for-round-face-women`
- `glasses-for-round-face-men`
- `glasses-for-oval-face-women`
- `glasses-for-oval-face-men`
- `glasses-for-square-face-women`
- `glasses-for-square-face-men`
- `glasses-for-heart-shaped-face-women`
- `glasses-for-diamond-face-women`

**decision-question (6)**

- `do-round-glasses-suit-a-round-face`
- `do-aviators-suit-an-oval-face`
- `are-cat-eye-glasses-good-for-round-faces`
- `should-glasses-cover-your-eyebrows`
- `how-wide-should-glasses-be-for-my-face`
- `how-should-glasses-fit-your-face`

`CombinationSearchPage` fields that must localize: `title`, `metaDescription`, `eyebrow`, `intro`, `primaryAnswer`, `whyItWorks`, `watchFor`, `decisionTip`, `faq[]`, `ctaLabels?`.  
Non-copy fields stay shared: `slug`, `type`, `queryCluster`, `includeCtas`, `bottomCtas`, `relatedOwnerPath`.

### Shared shell strings (both phases)

Hardcoded EN defaults that must become locale-aware:

| Surface | Strings |
| --- | --- |
| `SearchToToolLanding` | `"Common questions"`, `"Next step"` |
| `ProductContinuationCtas` | `"Detect my face shape"`, `"Open virtual try-on"`, `"Compare frames"`, `"Get glasses advice"` |
| `glasses-guide/[slug]` page shell | Any remaining inline EN chrome (e.g. section labels such as “Quick answer”, hub link text) |

---

## 5. Engineering pattern

Mirror the existing multi-locale SEO hub pattern used by `/glasses-for-face-shape`.

```text
page.tsx
  → getSearchToToolCopy(locale) / getCombinationSearchPageCopy(locale, slug)
  → src/config/*-locales.ts
  → generateI18nSEO({ locale, title, description, pathname })  // no EN-only gates
  → SearchToToolLanding + localized schemas
sitemap.ts
  → emit path × all locales + generateAlternates(path)
```

### New config modules

1. **`src/config/search-to-tool-locales.ts`** (Phase A)
   - Typed copy map keyed by route id + locale
   - Export `getSearchToToolLandingCopy(locale, routeId)` (or per-route getters)
   - EN is the complete source; other locales may use compact overlays (same approach as `face-shape-seo-locales.ts`) as long as the rendered page is not English

2. **`src/config/search-combination-locales.ts`** (Phase B)
   - Keep EN structure / factories in `search-combination-pages.ts` as structural source of truth for slugs and CTA wiring
   - Locale overlays supply translated prose fields
   - Export `getCombinationSearchPage(locale, slug)` that returns a fully localized `CombinationSearchPage`

### Page changes

For each Phase A/B page:

1. Replace inline EN strings with getter(s)
2. Remove:
   - `noIndex: params.locale !== 'en'`
   - `availableLocales: ['en'] as const`
3. Call `generateI18nSEO` like `glasses-for-face-shape` (defaults to all locales)
4. Build FAQ/HowTo schema from localized copy only

### Shared component changes

- Prefer passing localized labels from page copy
- For defaults inside `SearchToToolLanding` / `ProductContinuationCtas`, resolve via a small locale map (config helper), not `messages/*.json`, so SEO landings stay consistent with face-shape SEO modules

### Slug policy

English path segments only. Examples:

- `/ja/what-is-my-face-shape`
- `/de/glasses-guide/best-rectangle-glasses-for-round-face`

Do not create localized slug aliases in this workstream.

---

## 6. Sitemap and indexing rules

Authority: geo-sync §8 — **do not advertise untranslated locale copies through sitemap or hreflang**.

### Current state (before this work)

In `src/app/sitemap.ts`:

- Phase A paths live in `englishOnlyStaticPagePaths`
- Combination paths are emitted EN-only via `combinationSearchPaths`

### When a Phase is complete

1. Move completed paths out of `englishOnlyStaticPagePaths` into the multi-locale `staticPagePaths` loop (or an equivalent list that uses `generateAlternates`)
2. For combination guides: emit `/glasses-guide/{slug}` for **every** locale with full `alternates.languages`
3. Ensure page metadata hreflang matches sitemap (via `generateI18nSEO` defaults)
4. Until Phase B is done, combination URLs remain EN-only in sitemap and keep EN-only metadata gates

### Partial-locale rule

A locale may be indexed for a route only when **all** of the following are localized together for that route:

- title
- description
- visible body (hero / steps / principles / combination prose)
- FAQ
- CTA labels used on the page
- structured data text

If any required field is still English for a non-EN locale, keep that locale `noindex` and omit it from sitemap/hreflang for that route. Prefer shipping all 9 together per route group (Phase A set or Phase B set) to avoid mixed indexing states.

---

## 7. Translation quality bar

- Target all 9 locales for each completed Phase
- Compact non-EN copy is allowed (shorter FAQs / tighter intros), matching `face-shape-seo-locales` practice
- Residual full-page English on a non-EN URL is a release blocker
- Keyword intent may stay close to EN query clusters; do not force awkward literal translations of English head terms when a natural local query phrasing exists in title/H1
- `query_cluster` / analytics ids stay English machine ids (not translated)

---

## 8. File change checklist

### Phase A PR

- [ ] Add `src/config/search-to-tool-locales.ts` with EN + 8 locale copies
- [ ] Thin out 8 landing/hub `page.tsx` files to use getters
- [ ] Localize shared shell defaults used by those pages
- [ ] Update `src/app/sitemap.ts`: move the 8 paths to multi-locale emission
- [ ] Smoke: `en`, `ja`, `id`, `ar` for at least 2 landings + hub
- [ ] Confirm metadata: `index,follow`, canonical, hreflang × 9

### Phase B PR

- [ ] Add `src/config/search-combination-locales.ts` (or equivalent overlay)
- [ ] Wire `glasses-guide/[slug]/page.tsx` to locale-aware getter
- [ ] Localize factory-generated FAQ/eyebrow/CTA templates
- [ ] Update sitemap combination block to all locales + `generateAlternates`
- [ ] Smoke: 1 face-frame, 1 gender-style, 1 decision-question × `en/ja/ar`
- [ ] Confirm all 30 × 9 sitemap entries and matching hreflang

### Explicitly unchanged

- Product tool routes and components
- Dashboard / history
- `messages/*.json` key trees (unless a tiny shared chrome key is already there and reused carefully; default is config TS)

---

## 9. Acceptance criteria

Phase A is done when:

1. Visiting `/ja/what-is-my-face-shape` (and the other 7 Phase A routes) shows Japanese (or locale) copy end-to-end, not English
2. Response headers / HTML robots meta are indexable for non-EN
3. `https://www.visutry.com/sitemap.xml` (or app sitemap) lists `/ja/...` (and other locales) for the 8 paths with full language alternates
4. View-source JSON-LD FAQ questions match on-page localized FAQ

Phase B is done when the same bar holds for all 30 `/glasses-guide/{slug}` URLs across 9 locales.

---

## 10. Rollout notes

- Batch 1 originally deferred locale forks until EN winners prove continuation. This spec **overrides that deferral for the listed routes only**, under geo-sync §8 quality gates.
- Implementation is a separate execution from this document. Do not open sitemap/hreflang until translations for that Phase are landed in the same change set.
- Prefer one Phase per PR to keep review and rollback scoped.
- After Phase A ships, watch GSC for duplicate/hreflang issues for one week before Phase B expansion if capacity is limited.

---

## 11. Out of scope follow-ups (not this spec)

- Localizing older EN-only clusters still in `englishOnlyStaticPagePaths` (`/face-shapes`, `/hairstyles-for-face-shape`, `/face-shape-measurement`, etc.)
- Localized slug aliases / redirect maps
- Machine-translation QA vendor process beyond engineering compact overlays
