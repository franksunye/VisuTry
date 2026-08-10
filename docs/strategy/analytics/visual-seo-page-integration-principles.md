# Visual SEO Page Integration Principles

**Status:** Active implementation rule  
**Applies to:** Search→Tool and other acquisition pages that render accepted VSEO assets  
**Parent specification:** `docs/strategy/analytics/visual-seo-production.md`

This file is a focused implementation note for page-level integration. It does not replace the Visual SEO production specification or asset manifest.

## Core principle

Visual SEO assets must improve image discoverability **without turning an acquisition page into a gallery or long-form image article**.

The commercial / product path remains primary. Visual SEO is an educational and discovery layer that supports the page, not the page's dominant interaction model.

## Page density rule

For a single Search→Tool acquisition page:

1. **At most one VSEO asset may be rendered as a full-width primary visual.**
2. Any additional VSEO assets on the same page must be rendered as **supporting visuals** with lower visual weight.
3. Supporting visuals should use compact cards, two-column desktop layouts where appropriate, and substantially reduced mobile height.
4. Do not stack multiple full-width 4:3 Visual SEO cards consecutively on mobile.
5. When a page has three assets, the default hierarchy is **1 primary + 2 supporting**.
6. When a page has two assets, the default hierarchy is **1 primary + 1 supporting**.

## Placement rule

Visual SEO blocks must not interrupt the page's primary conversion path.

Preferred order:

> Hero / intent → core tool or commercial CTA → trust / task guidance → Visual SEO education → FAQ / secondary navigation

For pages where the main tool produces an in-page result, the result and its continuation CTA must retain higher priority than Visual SEO content.

## Mobile rule

Mobile is the strictest density constraint.

- The primary VSEO asset may remain full width when it materially explains the page intent.
- Supporting assets should be compact and may use thumbnail-led horizontal cards.
- Supporting copy can be visually condensed, but the descriptive HTML, alt text, heading, and internal link should remain present in the rendered document.
- Adding VSEO assets must not materially push the core action farther down the initial experience or recreate long scroll depth immediately after the tool.

## SEO preservation rule

Reducing visual weight must not remove the SEO signals that make the asset useful:

- crawlable image URL;
- descriptive filename;
- descriptive `alt`;
- semantic heading;
- adjacent explanatory HTML;
- canonical owner page;
- relevant internal link where applicable;
- image sitemap inclusion where supported.

The objective is **lower UI weight, not lower semantic quality**.

## Acceptance check before integration

Before merging a page integration, confirm:

- the page still has one obvious primary user action;
- no more than one VSEO asset dominates the page visually;
- additional assets read as supporting education;
- mobile does not contain consecutive large 4:3 SEO cards;
- Visual SEO content sits after the core conversion content unless there is a specific product reason otherwise;
- the page still feels like a VisuTry product/acquisition page rather than an SEO image gallery;
- image SEO metadata and crawlability remain intact.

## B01 implementation baseline

For the first accepted B01 pages:

- `/en/face-shape-detector`: VSEO-001 primary; VSEO-002 and VSEO-003 supporting.
- `/en/what-is-my-face-shape`: VSEO-004 primary; VSEO-005 and VSEO-006 supporting.
- `/en/what-glasses-suit-my-face`: VSEO-007 primary; VSEO-008 supporting.

Future B02+ integrations should apply the same hierarchy by default rather than repeating multiple full-size cards per page.
