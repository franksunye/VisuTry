---
name: merchant-product-design
description: Design, implement, or review VisuTry Merchant product interfaces and data visualizations. Use for Merchant Home, Analytics, Store, Campaign, and shared workspace experiences.
---

# Merchant Product Design

Create clear, useful, polished Merchant experiences that feel specific to VisuTry—not generic admin software. Preserve canonical business semantics, tenant boundaries, lifecycle truth, and existing behavior unless the task explicitly changes them.

## Product principles

- Lead with the merchant's most useful next understanding or action. Use a deliberate hierarchy, concise labels, restrained navy/cobalt accents, and consistent low-emphasis icons.
- Prefer a few legible, decision-supporting visualizations over dense KPI grids, decorative charts, or report-like tables. Give important modules a cohesive visual identity; do not default to a stack of interchangeable cards.
- Show real product context where useful (for example, eyewear frames and experience identity). Keep privacy-sensitive shopper activity anonymous.
- Keep explanation copy short. Communicate lifecycle, reliability, reference-data, and low-volume caveats accurately but quietly.
- Do not invent business outcomes: no unsupported orders, revenue, GMV, ROAS, conversion, attribution, or customer identity. UI totals and chart points must come from canonical server-side read models.
- Responsive layouts are designed, not merely shrunk: preserve hierarchy and useful actions on mobile; use intentional stacking instead of forcing desktop tables into narrow viewports.

## Screenshot-first workflow

1. Read the product request and applicable repository/domain contracts. Identify the canonical Local environment, data preset, routes, and capture command before changing UI.
2. Capture the current state before implementation. Review first viewport and full page at representative desktop and mobile sizes; record hierarchy, density, comparison controls, overflow, and browser/runtime errors.
3. Make the smallest coherent design change. Do not alter metric definitions to improve appearance. Use deterministic, clearly marked Local reference data when needed; seed/reset it separately from capture.
4. Run the repository-owned capture workflow and inspect the resulting screenshots yourself at full-page scale. Check desktop and mobile, populated and relevant edge/empty states, and chart interaction/focus where applicable. Fix visual defects before reporting completion.
5. Run applicable tests and accessibility checks. Report exact commands, outcomes, capture paths, and any residual limitations.

For the Merchant dashboard Local reference workflow, seed explicitly when required, then capture without mutating data:

```sh
npm run merchant:local:dashboard:seed -- --preset showcase
npm run merchant:local:dashboard:capture
```

Available presets are `showcase`, `low-volume`, and `empty`. Follow the script's Local-only guards and the Local Merchant environment contract. Never point a seed/reset operation at Preview or Production. Do not replace public website screenshots unless that separate work is explicitly authorized.

## Design review checklist

Review the complete user journey using Nielsen's usability heuristics:

- Visibility of system status; match to the merchant's language and real-world workflow.
- User control and freedom, including safe recovery and predictable navigation.
- Consistency and standards; prevent errors and explain validation close to the action.
- Recognition rather than recall; efficient paths for both new and returning users.
- Focused, useful content; clear recovery from errors; accessible help when needed.

Check WCAG 2.2 AA as a baseline, including semantic headings/landmarks, keyboard access and visible focus, accessible names, non-color status cues, sufficient text and UI contrast, chart alternatives/tooltips, reduced motion, and reflow at narrow widths/zoom. Do not communicate meaning only through color or hover.

For charts, use accurate scales and labels, preserve exact canonical observations, and keep visual interpolation distinct from metric computation. Smooth curves may clarify a well-sampled series but must not imply unsupported activity; low-volume or missing data should remain visibly truthful. Tooltips and keyboard focus must resolve to actual observations. Keep comparison series subordinate and avoid permanent point markers unless they aid comprehension.

## Handoff quality bar

Before handoff, verify the relevant tests, typecheck/lint/build gates, responsive screenshots, and browser console/network state available locally. Summarize what changed, the data/source semantics, validation evidence, and known limitations. Do not call a Merchant screen ready based only on unit tests or a single viewport.

Reject generic engineering/admin-style presentation: no unexplained metric walls, default card-stack layouts, raw operational tables as the primary experience, decorative chart clutter, or implementation jargon in merchant-facing copy. Keep the design grounded in the actual merchant decision being supported.
