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
7. **Do not force a two-column desktop grid when there is only one supporting asset.** A single supporting asset should use one full-row horizontal supporting card, typically with the visual taking roughly 35–45% of the row and explanatory content taking the remaining space. This avoids an empty half-column while keeping the supporting asset visually subordinate to the primary asset.
8. **Density is evaluated at the page level, not the batch level.** If multiple VSEO batches contribute assets to the same route, they share the same one-primary budget. A later batch must not create a second dominant visual simply because it is rendered by a different component.

## Heading duplication rule

Many VSEO masters intentionally include a short, prominent headline inside the image so the asset remains understandable in Google Images.

Do **not** visually repeat an equivalent HTML heading immediately above that image.

- If the image already contains a prominent headline that is substantially equivalent to the page-side heading, keep the semantic HTML heading in the DOM but render it with a visually-hidden (`sr-only`) treatment.
- Do not crop, mask, cover, or otherwise alter the source image merely to remove its embedded headline.
- Keep the HTML heading visible when the image does not contain a clear headline, when the HTML heading adds materially different context, or when the asset is rendered as a small supporting thumbnail whose in-image text is no longer reliably readable.
- Supporting cards should generally keep their HTML heading visible.

The objective is to preserve semantic structure and accessibility while avoiding obvious visual repetition.

## Placement rule

Visual SEO blocks must not interrupt the page's primary conversion path.

Preferred order:

> Hero / intent → core tool or commercial CTA → trust / task guidance → Visual SEO education → FAQ / secondary navigation

For pages where the main tool produces an in-page result, the result and its continuation CTA must retain higher priority than Visual SEO content.

When more than one batch contributes to a page, render the page's established primary visual first, then later-batch assets as supporting education unless the page is intentionally being re-authored around a new primary asset.

## Mobile rule

Mobile is the strictest density constraint.

- The primary VSEO asset may remain full width when it materially explains the page intent.
- Supporting assets should be compact and may use thumbnail-led horizontal cards.
- Thumbnail-led supporting cards should remain compact across sub-768px widths; do not expand them into full-width 4:3 cards merely because the viewport crosses a 640px breakpoint.
- A single supporting asset should remain compact on mobile even if it uses a full-row horizontal treatment on desktop.
- Supporting copy can be visually condensed, but the descriptive HTML, alt text, heading, and internal link should remain present in the rendered document.
- Prefer one semantic copy node per supporting asset. Do not duplicate the same explanatory paragraph solely to switch responsive layouts at different breakpoints.
- Adding VSEO assets must not materially push the core action farther down the initial experience or recreate long scroll depth immediately after the tool.

## SEO preservation rule

Reducing visual weight must not remove the SEO signals that make the asset useful:

- crawlable image URL;
- descriptive filename;
- descriptive `alt`;
- semantic heading, even when visually hidden to avoid duplicate display copy;
- adjacent explanatory HTML;
- canonical owner page;
- relevant internal link where applicable;
- image sitemap inclusion where supported.

The objective is **lower UI weight, not lower semantic quality**.

## Acceptance check before integration

Before merging a page integration, confirm:

- the page still has one obvious primary user action;
- no more than one VSEO asset dominates the page visually, including across multiple batches;
- additional assets read as supporting education;
- mobile does not contain consecutive large 4:3 SEO cards;
- supporting cards remain compact throughout sub-768px layouts;
- a single desktop supporting asset does not leave an artificial empty grid column;
- an embedded image headline is not redundantly repeated as a visible HTML heading directly above it;
- responsive layout does not duplicate the same explanatory copy in multiple DOM nodes;
- Visual SEO content sits after the core conversion content unless there is a specific product reason otherwise;
- the page still feels like a VisuTry product/acquisition page rather than an SEO image gallery;
- image SEO metadata and crawlability remain intact.

## B01 implementation baseline

For the first accepted B01 pages:

- `/en/face-shape-detector`: VSEO-001 primary; VSEO-002 and VSEO-003 supporting.
- `/en/what-is-my-face-shape`: VSEO-004 primary; VSEO-005 and VSEO-006 supporting.
- `/en/what-glasses-suit-my-face`: VSEO-007 primary; VSEO-008 as a single full-row horizontal supporting card on desktop and a compact supporting card on mobile.
- B01 primary masters already contain prominent in-image headlines, so their equivalent HTML H2 headings remain semantic but are visually hidden. Supporting-card headings remain visible.

## B02 implementation baseline

- `/en/what-glasses-suit-my-face`: the existing B01 primary remains dominant; VSEO-009 is supporting workflow education and must not become a second primary visual.
- `/en/find-glasses-for-my-face`: VSEO-010 primary; VSEO-011 and VSEO-012 supporting.
- `/en/virtual-glasses-try-on`: VSEO-013 primary; VSEO-014 and VSEO-015 supporting.
- `/en/try-glasses-on-photo`: VSEO-016 primary.
- B02 primary/editorial masters use visually hidden HTML H2 headings when their in-image headline already communicates the same title. Supporting-card headings remain visible.

## B03 implementation baseline

- `/en/try-glasses-on-photo`: VSEO-016 from B02 remains the page primary; VSEO-017 and VSEO-018 are supporting comparisons only.
- `/en/compare-glasses-frames`: VSEO-019 primary; VSEO-020 and VSEO-021 supporting.
- `/en/ai-glasses-advisor`: VSEO-023 primary recommendation visual; VSEO-022 and VSEO-024 supporting.
- B03 primary masters keep equivalent HTML H2 headings semantic but visually hidden. Supporting-card headings remain visible.
- B03 supporting cards use the shared compact component and remain thumbnail-led until the desktop two-column layout begins at 768px.

Future B04+ integrations should apply the same page-level hierarchy, breakpoint-density, semantic-copy, and heading-duplication checks by default rather than repeating multiple full-size cards or duplicate titles per page.
