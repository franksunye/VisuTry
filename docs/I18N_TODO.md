# i18n Scope And Current Policy

**Last Updated**: 2026-08-03  
**Supported Locales**: `en`, `id`, `ar`, `ru`, `de`, `ja`, `es`, `pt`, `fr`  
**Default Locale**: `en`

## Localization Strategy

VisuTry now uses a **marketing-first localization** strategy.

- Localize: navigation and marketing copy under locale routes
- Keep English-only: tool workflow UI and post-login product internals
- Keep admin English-only by design

## In Scope

- Header and footer navigation labels
- Marketing pages and landing pages:
  - `src/app/[locale]/(main)/page.tsx`
  - `src/app/[locale]/(main)/pricing/page.tsx`
  - `src/app/[locale]/(main)/faq/page.tsx`
  - `src/app/[locale]/(main)/try-on/[type]/page.tsx` (public landing content only)
  - `src/app/[locale]/(main)/try-on/glasses/compare/page.tsx` (public landing content only)
  - `src/app/[locale]/(main)/style-explorer/page.tsx` (public landing content only)
  - `src/app/[locale]/(main)/store/page.tsx` (public landing content only)
  - `src/app/[locale]/(main)/face-analysis/page.tsx` (landing/marketing content)
- Marketing components used by those pages
- Locale metadata and marketing structured data text

### Search→Tool Batch 1 — completed 2026-08-03

Long-form SEO / Search→Tool landings use **config locale TS modules** (same pattern as `face-shape-seo-locales.ts`), not `messages/*.json`.

Spec and completion record: [`docs/strategy/growth/2026-08-03-search-to-tool-i18n-spec.md`](strategy/growth/2026-08-03-search-to-tool-i18n-spec.md)

Completed scope:

- Phase A: 7 query landings + `/glasses-guide` hub localized for all 9 locales
- Phase B: `/glasses-guide/[slug]` × 30 combination guides localized for all 9 locales
- Localized visible copy, metadata, FAQ, CTA labels and structured-data strings
- English slugs and machine `queryCluster` ids remain unchanged
- Sitemap and hreflang now emit the completed Search→Tool routes for all 9 locales with `x-default` → English
- Non-English `/glasses-guide` indexing gate was removed when Phase B localized detail content landed
- Phase A merged via PR #16; Phase B merged via PR #17

## Out Of Scope

- Tool internals and workflow UI:
  - `src/components/try-on/*`
  - `src/components/compare/FrameCompareInterface.tsx`
  - `src/components/face-analysis/FaceAnalysisInterface.tsx`
  - Dashboard widgets and task-running UI

## Source Of Truth

- Translation schema source for standard marketing UI: `messages/en.json`
- All locale files must mirror the same key tree
- Keep marketing keys under `marketing.*`
- Long-form Search→Tool SEO copy is intentionally maintained in typed config locale modules instead of `messages/*.json`

## Implementation Rules

1. Add new standard marketing keys in `messages/en.json`
2. Mirror key structure to all locale files
3. Wire pages/components to `useTranslations` or `getTranslations`
4. For long-form Search→Tool SEO pages, use typed locale config modules and keep visible copy/schema copy aligned
5. Keep untranslated product internals intentionally untouched

## Validation Checklist

- Key parity: no missing/extra locale keys versus `en`
- Manual smoke test: `en`, `id`, `ja`, `ar`
- Verify metadata language consistency per locale
- For indexed SEO routes, verify canonical/hreflang/sitemap consistency
- Ensure visible FAQ and JSON-LD FAQ use the same localized source
- Run lint/type/build validation on touched files
