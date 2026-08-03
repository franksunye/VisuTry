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

### Search→Tool Batch 1 (pending implementation)

Long-form SEO / Search→Tool landings use **config locale TS modules** (same pattern as `face-shape-seo-locales.ts`), not `messages/*.json`.

Spec: [`docs/strategy/growth/2026-08-03-search-to-tool-i18n-spec.md`](strategy/growth/2026-08-03-search-to-tool-i18n-spec.md)

- Phase A: 7 query landings + `/glasses-guide` hub → 9-locale index + sitemap
- Phase B: `/glasses-guide/[slug]` × 30 combination guides → 9-locale index + sitemap
- Until a Phase ships translations, those routes stay EN-only in sitemap/hreflang per geo-sync §8

## Out Of Scope

- Tool internals and workflow UI:
  - `src/components/try-on/*`
  - `src/components/compare/FrameCompareInterface.tsx`
  - `src/components/face-analysis/FaceAnalysisInterface.tsx`
  - Dashboard widgets and task-running UI

## Source Of Truth

- Translation schema source: `messages/en.json`
- All locale files must mirror the same key tree
- Keep marketing keys under `marketing.*`

## Implementation Rules

1. Add new keys in `messages/en.json`
2. Mirror key structure to all locale files
3. Wire pages/components to `useTranslations` or `getTranslations`
4. Keep untranslated product internals intentionally untouched

## Validation Checklist

- Key parity: no missing/extra locale keys versus `en`
- Manual smoke test: `en`, `id`, `ja`, `ar`
- Verify metadata language consistency per locale
- Run lint on touched files

