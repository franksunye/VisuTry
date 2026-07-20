# VisuTry Style Explorer Technical Spec

**Status:** Ready for product and engineering implementation review  
**Owner:** Product / Engineering  
**Created:** 2026-07-20  
**Last updated:** 2026-07-20  
**Related plan:** `docs/product/product-plan.md`  
**Related capability:** `docs/product/specs/frame-compare.md`  
**Proposed route:** `/[locale]/style-explorer`

---

## 1. Summary

Style Explorer is a new user-visible VisuTry product module for exploring distinct eyewear looks based on style intent, occasion, frame category, optional face-shape context, and a system-selected set of frame presets.

It is an independent product module, but it must reuse the existing Frame Compare / Try-On execution foundation rather than introduce another generation engine.

The v0.1 execution model is:

> Style intent / occasion / category → deterministic frame recommendation → user-visible frame confirmation → existing per-frame try-on pipeline → style-oriented result presentation.

Style Explorer validates whether current serious eyewear-decision users also exhibit repeated style-exploration behavior before VisuTry invests in a broader Studio workspace.

---

## 2. Product Position

The current consumer workflow is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

Style Explorer becomes a fifth product module with a different user question:

> What different eyewear styles could express different sides of me?

| Capability | Primary intent | Frame selection | Result meaning |
| --- | --- | --- | --- |
| Glasses Advisor | Find suitable frame types | System narrows options | Recommendation |
| Virtual Try-On | Validate one frame visually | User provides or selects one frame | Single-frame validation |
| Frame Compare | Decide among known candidates | User manually selects up to 4 frames | Decision comparison |
| Style Explorer | Discover distinct looks | System recommends 4 diverse frames; user may adjust | Style discovery |

Style Explorer is the consumer validation layer for a future VisuTry Studio. It is not the Studio MVP itself.

---

## 3. Current Code Baseline

The existing Frame Compare implementation already provides the core execution capability required by Style Explorer.

| Area | Current file | Relevant behavior |
| --- | --- | --- |
| Compare UI | `src/components/compare/FrameCompareInterface.tsx` | Photo upload, credit-aware selection, batch initialization, staggered dispatch, polling, retry, recovery, result grid. |
| Batch initialization | `src/app/api/try-on/glasses/compare/route.ts` | Validates selected presets and available credits, returns ordered presets and batch ID. |
| Per-frame dispatch | `src/app/api/try-on/glasses/compare/frame/route.ts` | Validates photo, preset, batch and credits, then submits one normal try-on task. |
| Compare server helper | `src/lib/compare-tryon-server.ts` | Loads preset assets, builds prompt, attaches metadata, calls common try-on service. |
| Preset catalog | `src/config/glasses-presets.ts` | Current built-in frame presets and prompt hints. |
| Common try-on service | `src/lib/tryon-service.ts` | Generation, persistence, quota, task lifecycle and result storage. |
| Dashboard history | `src/app/[locale]/(main)/dashboard/history/page.tsx` | Reads the user's persisted try-on tasks. |
| History actions | `src/components/dashboard/TryOnHistoryList.tsx` | Download, open share page and delete result. |
| Public share page | `src/app/[locale]/(main)/share/[id]/page.tsx` | Public result page, Open Graph metadata, image download and VisuTry continuation CTA. |

### Existing behavior that must be preserved

1. One frame generation creates one normal `TryOnTask`.
2. A Style Explorer run contains at most 4 frames.
3. Frame submissions are staggered using the existing compare pattern.
4. Tasks independently reach queued, processing, completed or failed states.
5. One failed task does not invalidate successful results.
6. Retry follows existing credit behavior.
7. Successful results are persisted automatically and appear in Dashboard History.
8. Credit deduction remains governed by the existing try-on task pipeline.
9. Batch metadata supports recovery after refresh or navigation.

---

## 4. Goals

### Product goals

1. Validate style-led eyewear exploration without turning VisuTry into a generic fashion image product.
2. Introduce sunglasses and more expressive frames in a controlled module.
3. Make frame recommendations transparent before the user spends credits.
4. Measure repeat exploration, frame replacement, regeneration, download, share and Dashboard return behavior.
5. Establish a credible path toward a later Studio workflow.

### Engineering goals

1. Reuse current generation, task, polling, retry, recovery, credit and persistence logic.
2. Avoid copying Frame Compare into a second large component.
3. Add structured style metadata to the frame catalog.
4. Make frame selection deterministic and unit-testable.
5. Keep v0.1 implementable without a new LLM selection service or face-overlay renderer.

---

## 5. Non-goals for v0.1

The first version does not include:

- Studio projects, client records or professional advisor workflow;
- free-form prompting;
- hair, makeup, clothing, face, body or background editing;
- social feed, likes, follows or creator profiles;
- merchant catalog ingestion;
- uploaded custom frames inside Style Explorer;
- a new payment or subscription product;
- a separate generation provider;
- a separate try-on task table;
- LLM-controlled frame selection in the critical path;
- synthetic face silhouettes with projected frame overlays;
- a dedicated comparison mode for already generated Style Explorer results;
- persistent favorites or a separate `Saved Look` object.

---

## 6. Final v0.1 User Flow

### Entry

Style Explorer may be entered from:

- standalone product navigation;
- Face Shape result: `Explore styles for your face`;
- Glasses Advisor result: `See different looks`;
- Frame Compare completion: `Explore another style direction`;
- homepage experiment section.

### Authenticated flow

1. User opens `/[locale]/style-explorer`.
2. User uploads one clear front-facing photo using the existing upload component.
3. User selects one style intent.
4. User optionally selects one occasion.
5. User selects `All`, `Optical` or `Sunglasses`.
6. System deterministically recommends 4 diverse frames.
7. The recommended frames are shown explicitly before generation.
8. User may refresh the set or replace an individual recommended frame.
9. User sees the exact cost: one credit per generated result.
10. User starts `Explore 4 Looks`.
11. System initializes one Style Explorer batch.
12. Client dispatches one normal try-on task per selected frame using the existing staggered pattern.
13. Results appear independently as tasks complete.
14. Each completed result displays a look name, tags and concise explanation.
15. Results are saved automatically to Dashboard History.
16. User may download, share, view results in Dashboard, or explore another set.

### Anonymous behavior

v0.1 follows the existing Compare policy:

- anonymous visitors see the public module state;
- generation requires sign-in;
- callback URL returns the user to Style Explorer;
- anonymous generation is deferred.

---

## 7. UI / UX Specification

The desktop layout should remain visually consistent with the current Frame Compare page:

- existing VisuTry global navigation and footer;
- light blue-gray page background;
- white rounded cards;
- VisuTry blue as primary accent;
- left configuration column and right result workspace;
- responsive stacking on mobile.

### 7.1 Desktop layout

Recommended desktop grid:

```text
Left configuration column: approximately 390–420px
Right workspace: remaining width
```

Left column:

1. `Your Photo`
2. `Define Your Style`
3. Style Intent
4. Frame Category
5. Occasion
6. Recommended Frames
7. Primary CTA and credit cost

Right column:

1. `Explore Your Looks`
2. Current state-specific content
3. Result actions when available

### 7.2 Required five design states

#### State A — Empty / initial

- Photo is not uploaded.
- Style controls may show safe defaults but generation remains disabled.
- Recommended frames may use default example recommendations, clearly labeled as auto-selected.
- Right workspace uses a single explanatory empty state.
- Do not show a face silhouette with glasses projected onto it.
- Any four small placeholders should show neutral frame icons or frame thumbnails only.

Recommended empty-state copy:

> Discover four distinct looks  
> We’ll select frames that match your style and create four different looks for you.

#### State B — Configuration completed

- Uploaded face photo is visible.
- Selected style, category and occasion are clearly highlighted.
- Four recommended frames are visible in both the compact left recommendation strip and the right preview cards.
- Right preview cards show actual frame product assets, not generated portraits.
- Each preview card contains:
  - frame image;
  - look name;
  - style tags;
  - short explanation.
- Primary CTA is enabled.

#### State C — Generating

- Left configuration remains visible but is locked from destructive changes.
- Four right-side task cards show actual task states.
- Generating tasks may show the user's photo blurred with a loading indicator.
- Queued tasks use a neutral queued placeholder.
- Use real states only: queued, processing, completed, failed.
- Do not fake precise server-side percentages unless the backend provides them. An indeterminate progress bar is preferred.
- Show a clear note:

> This may take a few moments. You can leave this page and check completed results in Dashboard History.

#### State D — Results generated

- Four generated try-on images appear in a 2 × 2 result grid.
- Each result card shows:
  - generated image;
  - look name;
  - frame/style tags;
  - one-sentence explanation;
  - `Download`;
  - `Share`.
- Page-level actions:
  - `Explore Again`;
  - `View in Dashboard`.
- Show an informational confirmation:

> Saved automatically to your Dashboard History.

- Do not show `Save Look`.
- Do not show `Compare This Look`.
- Do not show `Compare These Looks` in v0.1.

#### State E — Look detail drawer

A result card may open a right-side drawer containing:

- generated result image;
- look name;
- style tags;
- `Why it works` explanation;
- frame details;
- automatic-save confirmation;
- `Download Image` primary action;
- `Share Look` secondary action;
- `View in Dashboard` tertiary action.

The drawer must not include `Save Look` or `Compare This Look`.

### 7.3 Recommended Frames behavior

Recommended Frames are system-selected, but they are not hidden.

Rules:

1. Always show the exact 4 frames before generation.
2. Each compact card shows frame thumbnail, frame name and look direction.
3. `Refresh` requests a different recommended set where inventory permits.
4. Clicking a frame opens a lightweight replacement selector.
5. Replacing one frame does not reshuffle the other three.
6. The interface must not use Compare language such as `4/4 selected`; Style Explorer is system-led recommendation with user correction.

### 7.4 No pre-generation face overlay

The pre-generation workspace must not render a synthetic face outline or attempt to position frame line art on a face.

Reason:

- it requires landmark detection, asset normalization, scaling and rotation rules;
- it can be mistaken for a real try-on result;
- it adds a second approximate rendering path that is unnecessary for v0.1.

Pre-generation cards therefore show real frame assets only.

---

## 8. Style Taxonomy

### Style intent

```ts
type StyleIntent =
  | 'professional'
  | 'minimal'
  | 'classic'
  | 'creative'
  | 'bold'
  | 'vacation'
```

### Occasion

The v0.1 UI should expose only four options to keep the interface compact:

```ts
type StyleOccasion =
  | 'everyday'
  | 'work'
  | 'weekend'
  | 'outdoor'
```

Additional internal tags may be added later, but must not appear in v0.1 UI without product review.

### Category

```ts
type EyewearCategory = 'optical' | 'sunglasses'
type StyleExplorerCategoryFilter = 'optical' | 'sunglasses' | 'all'
```

---

## 9. Frame Catalog Extension

The current `GlassesPreset` model must be extended with structured metadata.

```ts
export interface GlassesPreset {
  id: string
  name: string
  style: string
  assetPath: string
  promptHint: string

  category: 'optical' | 'sunglasses'
  shape: FrameShape
  rimType: FrameRimType
  material: FrameMaterial
  colorFamily: FrameColorFamily
  visualWeight: 1 | 2 | 3 | 4 | 5
  styleTags: StyleIntent[]
  occasionTags: StyleOccasion[]
  suitableFaceShapes?: FaceShape[]
  isStyleExplorerEnabled?: boolean
}
```

### Compatibility rule

All current presets must receive explicit metadata in the same change that introduces required fields. If migration must be staged, use one catalog normalization function rather than scattered defaults.

### Initial new assets

v0.1 should add 8 style-focused assets:

- 4 sunglasses archetypes;
- 2 expressive optical frames;
- 2 moderate bridge frames between current utility and fashion styling.

Suggested coverage:

| Preset | Category | Main signals |
| --- | --- | --- |
| Classic Wayfarer Sunglasses | Sunglasses | classic, vacation, everyday |
| Aviator Sunglasses | Sunglasses | classic, bold, outdoor |
| Cat-Eye Sunglasses | Sunglasses | bold, creative, weekend |
| Oversized Sunglasses | Sunglasses | bold, vacation, weekend |
| Transparent Geometric Optical | Optical | minimal, creative, everyday |
| Thin Metal Color Optical | Optical | minimal, creative, work |
| Warm Acetate Optical | Optical | classic, professional, everyday |
| Statement Narrow Optical | Optical | bold, creative, weekend |

All assets remain repository-managed preset assets for v0.1.

---

## 10. Frame Selection Engine

Create a pure deterministic module:

```text
src/lib/style-explorer/
├── types.ts
├── frame-selector.ts
├── scoring.ts
└── look-copy.ts
```

Do not place selection logic inside React components or route handlers.

### Input

```ts
interface StyleExplorerSelectionInput {
  styleIntent: StyleIntent
  occasion?: StyleOccasion
  category: StyleExplorerCategoryFilter
  faceShape?: FaceShape
  limit: number
  exclusionIds?: string[]
  pinnedPresetIds?: string[]
}
```

### Output

```ts
interface StyleLookCandidate {
  presetId: string
  lookKey: string
  score: number
  scoreBreakdown: {
    style: number
    occasion: number
    category: number
    faceShape: number
    diversity: number
  }
}
```

### Recommended scoring

```text
Style tag match             +40
Occasion tag match          +20
Requested category match    required filter
Face-shape suitability      +15
Moderate novelty bonus      +5
Excluded/recently used      remove when inventory permits
```

### Diversity constraints

1. No duplicate preset.
2. No more than 2 frames with the same shape.
3. At least 2 visual-weight levels when possible.
4. At least 2 materials when possible.
5. For `all`, include both optical and sunglasses when eligible inventory permits.
6. Penalize candidates that closely resemble already selected frames.
7. Preserve user-pinned or manually replaced frames when refreshing the remaining set.

A deterministic greedy maximum-marginal-relevance approach is sufficient.

### Face-shape context

- Face shape is optional.
- Known face shape may contribute to score.
- Direct entry must not force a face-shape analysis.
- Missing face shape contributes zero rather than excluding frames.
- Style intent remains the dominant signal.

---

## 11. Shared Execution Architecture

Do not implement Style Explorer as `mode === 'style'` inside an increasingly large `FrameCompareInterface.tsx`.

Recommended shared extraction:

```text
src/components/try-on-batch/
├── types.ts
├── useTryOnBatch.ts
├── useTryOnTaskPolling.ts
├── useTryOnBatchRecovery.ts
├── TryOnBatchProgress.tsx
└── TryOnResultGrid.tsx
```

Business-specific containers remain separate:

```text
src/components/compare/FrameCompareInterface.tsx
src/components/style-explorer/StyleExplorerInterface.tsx
```

Shared concerns:

- task status normalization;
- polling;
- batch recovery;
- retry;
- credit refresh;
- result-grid shell;
- common download action;
- common share action.

Style Explorer-specific concerns:

- style controls;
- recommendation selector;
- frame replacement;
- look naming and explanation;
- style analytics;
- pre-generation frame preview.

---

## 12. API Design

Use separate Style Explorer routes while calling shared helpers.

### Batch initialization

```text
POST /api/try-on/glasses/style-explorer
```

Request:

```json
{
  "styleIntent": "minimal",
  "occasion": "work",
  "category": "all",
  "faceShape": "oval",
  "presetIds": ["preset-a", "preset-b", "preset-c", "preset-d"]
}
```

The server must validate that submitted presets are enabled for Style Explorer and match the allowed maximum count.

Response:

```json
{
  "success": true,
  "data": {
    "batchId": "style-explorer-userId-timestamp",
    "requiredCredits": 4,
    "remainingCreditsBefore": 45,
    "presets": [],
    "tasks": []
  }
}
```

### Per-frame dispatch

```text
POST /api/try-on/glasses/style-explorer/frame
```

This route should use the common compare/try-on submission helper with Style Explorer metadata rather than copy the generation implementation.

### Required metadata

```ts
{
  batchId,
  source: 'style-explorer',
  styleIntent,
  occasion,
  category,
  lookKey,
  framePresetId,
  framePresetName,
  framePresetStyle,
  batchSize,
  batchIndex
}
```

### Recovery isolation

Recovery queries must filter by `metadata.source === 'style-explorer'` so Compare and Style Explorer batches cannot be confused.

---

## 13. Credits and Persistence

1. One successful generated image uses one credit under the existing pipeline.
2. A full four-look run requires up to four credits.
3. The required credit cost must be shown before generation.
4. Existing failed-task credit behavior remains unchanged.
5. Results are persisted automatically as normal `TryOnTask` records.
6. No separate Save API is required.
7. The UI must not imply that results disappear unless the user clicks Save.

Recommended result message:

> Saved automatically to your Dashboard History.

---

## 14. Download and Share

### Download

`Download Image` downloads the generated `resultImageUrl` using the same behavior already available in Dashboard History.

### Share v0.1

The first feasible share experience uses the existing public result page:

```text
/[locale]/share/[taskId]
```

#### Mobile

When supported, call the Web Share API with the public result URL:

```ts
await navigator.share({
  title: 'My VisuTry eyewear look',
  text: 'Check out this eyewear look I created with VisuTry.',
  url: shareUrl,
})
```

Share the URL by default, not a file attachment.

#### Desktop / fallback

Show a compact action menu:

- `Copy Link`;
- `Download Image`.

No direct Facebook, Instagram, Pinterest, WeChat or email SDK integration is required in v0.1.

### Locale correctness

Any Dashboard History link to a share page should use the localized route helper rather than a hard-coded `/share/{id}` path.

---

## 15. Compare Behavior

`Compare This Look` and `Compare These Looks` are explicitly excluded from v0.1.

Reasons:

1. Style Explorer already presents four results side by side.
2. The existing Compare flow accepts source photo + preset IDs and generates new tasks; it does not compare already generated images directly.
3. Sending one Style Explorer result into Compare would require a second generation and could consume credits again.
4. The label would therefore misrepresent current capability.

A low-priority cross-product link may be shown after completion:

> Want to try other specific frames? Open Frame Compare.

This must be described as a new flow, not a continuation of the current generated set.

---

## 16. Analytics

Minimum events:

| Event | Trigger |
| --- | --- |
| `style_explorer_viewed` | Module page loaded. |
| `style_explorer_photo_uploaded` | Valid photo selected. |
| `style_explorer_style_selected` | Style intent changed. |
| `style_explorer_category_selected` | Category changed. |
| `style_explorer_occasion_selected` | Occasion changed. |
| `style_explorer_frames_recommended` | Recommendation set produced. |
| `style_explorer_frame_replaced` | User replaces one frame. |
| `style_explorer_frames_refreshed` | User requests another set. |
| `style_explorer_generation_started` | Batch initialized. |
| `style_explorer_generation_completed` | All tasks reach terminal state. |
| `style_explorer_generation_partial` | Mixed completed / failed result. |
| `style_explorer_download_clicked` | User downloads a result. |
| `style_explorer_share_clicked` | User opens native share or copy-link action. |
| `style_explorer_share_completed` | Native share resolves or link is copied. |
| `style_explorer_dashboard_clicked` | User opens Dashboard History. |
| `style_explorer_explore_again_clicked` | User begins another set. |
| `style_explorer_pricing_clicked` | User enters pricing due to insufficient credits. |

Useful properties:

- style intent;
- occasion;
- category;
- face-shape context present;
- recommended preset IDs;
- manually replaced preset IDs;
- batch ID;
- task count;
- completed count;
- failed count;
- remaining credits;
- entry source;
- device class;
- Web Share API availability.

---

## 17. Error and Edge Cases

1. No photo: generation disabled.
2. Zero credits: show pricing CTA before generation.
3. One to three credits: either limit generated looks to available credits with explicit copy, or require four credits; product must choose one rule before implementation.
4. Recommendation inventory cannot satisfy diversity: return the best valid deterministic set and record a diagnostic flag.
5. One task fails: successful results remain visible and failed task can be retried.
6. Refresh during generation: recover the Style Explorer batch only.
7. User changes style after generation: require `Explore Again`; do not silently mutate completed metadata.
8. User replaces one frame: preserve the other three recommendations.
9. Share API unavailable: fall back to copy link.
10. Public share task is incomplete or missing: show not found; never expose unfinished output.
11. Dashboard history contains many tasks: `View in Dashboard` may initially open history generally; task-specific deep linking is a later enhancement.

---

## 18. Testing Requirements

### Unit tests

- scoring weights;
- category filter;
- diversity constraints;
- deterministic output;
- exclusion and pinned-frame behavior;
- look-name generation;
- share fallback decision logic;
- status normalization.

### API tests

- authentication;
- invalid preset rejection;
- insufficient credits;
- maximum four frames;
- Style Explorer metadata;
- recovery source isolation;
- partial failure response.

### Component tests

- all five UI states;
- recommended frame visibility;
- single-frame replacement;
- disabled CTA without photo;
- correct credit cost;
- no `Save Look` action;
- no Compare action;
- automatic-save confirmation;
- download and share actions;
- Dashboard navigation.

### End-to-end tests

1. Sign in.
2. Upload photo.
3. Select style/category/occasion.
4. Verify four recommended frames.
5. Replace one frame.
6. Start generation.
7. Observe independent task states.
8. Verify completed results.
9. Download one result.
10. Share or copy one public result URL.
11. Open Dashboard History and confirm generated results exist.
12. Refresh mid-generation and verify batch recovery.

---

## 19. Implementation Sequence

### Phase 1 — Catalog and selector

1. Extend preset metadata.
2. Add new style-focused assets.
3. Implement deterministic selector.
4. Add unit tests.

### Phase 2 — Shared batch extraction

1. Extract polling and recovery hooks from Compare without changing behavior.
2. Extract reusable result-grid shell and common task state components.
3. Verify Compare regression tests.

### Phase 3 — Style Explorer UI and routes

1. Add page route and public state.
2. Add style controls and recommendation preview.
3. Add frame refresh and single replacement.
4. Add Style Explorer API routes using shared helpers.
5. Add five required UI states.

### Phase 4 — Result actions and measurement

1. Add common download action.
2. Add Web Share / copy-link fallback.
3. Add Dashboard navigation and automatic-save message.
4. Add analytics.
5. Add end-to-end tests.

### Phase 5 — Controlled release

1. Release behind feature flag.
2. Expose to a limited percentage of authenticated users.
3. Review engagement, regeneration, download, share and credit behavior.
4. Decide whether to expand module exposure or continue toward Studio.

---

## 20. Acceptance Criteria

Style Explorer v0.1 is acceptable when:

1. It exists as an independent route and product module.
2. It uses the existing try-on task and persistence pipeline.
3. User can select style, category and optional occasion.
4. System recommends four diverse frames deterministically.
5. User sees and may adjust the recommended frames before spending credits.
6. Pre-generation cards show actual frame assets, not simulated face overlays.
7. User sees exact credit cost before generation.
8. Four tasks progress independently and survive partial failure.
9. Completed results display look names, tags and concise explanations.
10. Results are saved automatically to Dashboard History.
11. `Save Look`, `Compare This Look` and `Compare These Looks` are absent.
12. User can download each completed result.
13. User can share the existing public result URL through Web Share or copy-link fallback.
14. User can open Dashboard History from the completion state and detail drawer.
15. Compare continues to function without regression.
16. Minimum analytics events are emitted.
17. Mobile and desktop flows are usable.

---

## 21. Product Decisions Required Before Build

1. Should users with fewer than four credits generate fewer looks, or be required to obtain four credits?
2. Which exact eight new frame assets are approved for v0.1?
3. Is individual frame replacement included in first release or immediately after Beta launch?
4. Should the public Style Explorer landing page show a real demonstration image or only product explanation?
5. Should `View in Dashboard` initially open general history, or should engineering add task/batch deep linking?
6. What percentage of authenticated users should receive the first feature-flag rollout?

---

## 22. Change Log

| Date | Change |
| --- | --- |
| 2026-07-20 | Initial technical specification created after Compare code review. |
| 2026-07-20 | Revised after UI review: added transparent recommended-frame confirmation, removed pre-generation face overlays, removed Save and Compare actions, specified automatic Dashboard persistence, download behavior, public-link share flow, five required UI states and implementation-ready UX rules. |
