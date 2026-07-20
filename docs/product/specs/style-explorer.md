# VisuTry Style Explorer Technical Spec

**Status:** Ready for product and engineering review  
**Owner:** Product / Engineering  
**Created:** 2026-07-20  
**Last updated:** 2026-07-20  
**Related plan:** `docs/product/product-plan.md`  
**Related capability:** `docs/product/specs/frame-compare.md`  
**Proposed route:** `/[locale]/style-explorer`  

---

## 1. Summary

Style Explorer is a new user-visible product module that helps a user explore distinct eyewear looks based on style intent, occasion, frame category, and optional face-shape context.

It should not be implemented as a second try-on engine or as a fork of Frame Compare.

The first version should reuse the existing Frame Compare generation pipeline, task lifecycle, credit behavior, polling, failure handling, recovery behavior, and result-grid foundation. Style Explorer adds a new upstream selection layer and a new result interpretation layer:

> Style intent / occasion / category → deterministic frame-set selection → existing per-frame try-on pipeline → style-oriented result presentation.

The implementation goal is to validate whether existing serious eyewear-decision users also demonstrate repeated style-exploration behavior before VisuTry invests in a larger Studio workspace.

---

## 2. Product Position

The current public consumer workflow is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

Style Explorer becomes a fifth product module with a different user question:

> What different eyewear styles could express different sides of me?

The module is independent at the product level but shared at the technical platform level.

### Product distinction

| Capability | Primary user intent | Selection behavior | Result meaning |
| --- | --- | --- | --- |
| Glasses Advisor | Find suitable frame types | System narrows choices | Recommendation |
| Virtual Try-On | See one frame on the face | User supplies or selects one frame | Visual validation |
| Frame Compare | Decide among known candidates | User manually selects up to 4 frames | Side-by-side decision |
| Style Explorer | Explore distinct looks | System assembles a diverse set from style input | Style discovery |

Style Explorer is the consumer validation layer for a future VisuTry Studio. It is not the Studio MVP itself.

---

## 3. Current Code Baseline

The existing Frame Compare implementation already provides the main execution foundation required by Style Explorer.

### Current implementation files

| Area | Current file | Relevant behavior |
| --- | --- | --- |
| Compare UI | `src/components/compare/FrameCompareInterface.tsx` | Photo upload, preset selection, credit-aware limits, batch initialization, staggered dispatch, polling, failure retry, batch recovery, result grid. |
| Batch initialization API | `src/app/api/try-on/glasses/compare/route.ts` | Validates selected presets and available credits, creates a batch ID, returns ordered preset descriptors. |
| Per-frame dispatch API | `src/app/api/try-on/glasses/compare/frame/route.ts` | Validates user/photo/frame/batch, checks credits, submits one frame task. |
| Server-side compare helper | `src/lib/compare-tryon-server.ts` | Loads preset asset, builds prompt, attaches batch metadata, calls the common try-on service, normalizes response. |
| Preset catalog | `src/config/glasses-presets.ts` | Defines the current 16 built-in optical-frame presets and their prompt hints. |
| Common try-on service | `src/lib/tryon-service.ts` | Existing generation, persistence, quota, and task integration layer. |
| Compare response normalization | `src/lib/compare-tryon.ts` | Maps persisted task metadata into compare task responses. |

### Existing behavior that must be preserved

1. One selected frame creates one normal glasses try-on task.
2. A comparison batch contains at most 4 frames.
3. Task submissions are staggered by 3 seconds.
4. Tasks independently reach queued, processing, completed, or failed states.
5. One failed frame does not invalidate successful frames.
6. Failed frames can be retried when credits are available.
7. Successful outputs remain part of normal dashboard history.
8. Batch metadata is used to recover an in-progress or recently completed comparison.
9. Credit deduction remains governed by the existing try-on task pipeline rather than by a new Style Explorer billing implementation.

---

## 4. Goals

### Product goals

1. Validate demand for style-led eyewear exploration without changing VisuTry into a generic fashion-image product.
2. Introduce sunglasses and more expressive frames in a controlled, measurable module.
3. Detect a Style Explorer user segment through generation, regeneration, save, share, and return behavior.
4. Establish a clean technical path from consumer Style Explorer to a later Studio project workflow.

### Engineering goals

1. Reuse the current compare and try-on execution path.
2. Avoid duplicating polling, task state, retry, recovery, quota, and image-generation code.
3. Separate reusable compare infrastructure from Compare-specific manual-selection UI.
4. Add style metadata to the frame catalog without breaking Advisor or Compare consumers.
5. Make the first version deterministic and testable without requiring a new LLM recommendation service.

---

## 5. Non-goals for v0.1

The first version does not include:

- full VisuTry Studio project management;
- client records or professional advisor workflow;
- free-form prompt-based fashion generation;
- hair, makeup, clothing, face, body, or background editing;
- social feed, follows, likes, or public creator profiles;
- merchant frame catalog ingestion;
- uploaded custom frames inside Style Explorer;
- automatic shopping links;
- a new subscription or credit product;
- a separate AI generation provider;
- a separate task table or batch persistence model;
- an LLM-controlled frame-selection decision in the critical path.

---

## 6. Proposed User Flow

### Entry

Style Explorer can be entered from:

- a standalone product page;
- Face Shape result: `Explore styles for your face`;
- Glasses Advisor result: `See different looks`;
- Frame Compare completion: `Explore another style direction`;
- homepage experiment module.

### Authenticated v0.1 flow

1. User opens `/[locale]/style-explorer`.
2. User uploads a front-facing photo using the existing upload component.
3. User selects one style intent.
4. User optionally selects an occasion.
5. User selects `Optical`, `Sunglasses`, or `All`.
6. System selects up to 4 diverse frame presets.
7. UI shows the selected look set and credit cost before generation.
8. User starts generation.
9. System initializes one style-explorer batch.
10. Client dispatches one normal try-on task per frame using the existing staggered pattern.
11. Results appear independently as they complete.
12. Each result displays a look name, frame metadata, and concise explanation.
13. User can save a result, share a result, regenerate a new set, or move to Frame Compare.

### Anonymous behavior

v0.1 should follow the existing Compare authentication policy:

- anonymous visitor sees a public Style Explorer landing state;
- generation requires sign-in;
- callback URL returns the user to Style Explorer.

Anonymous generation is explicitly deferred.

---

## 7. Style Taxonomy

### Required style intents

The initial supported values are:

```ts
type StyleIntent =
  | 'professional'
  | 'minimal'
  | 'classic'
  | 'creative'
  | 'bold'
  | 'vacation'
```

### Optional occasions

```ts
type StyleOccasion =
  | 'work'
  | 'everyday'
  | 'social'
  | 'outdoor'
  | 'travel'
  | 'special-event'
```

### Frame category

```ts
type EyewearCategory = 'optical' | 'sunglasses'

type StyleExplorerCategoryFilter = 'optical' | 'sunglasses' | 'all'
```

The taxonomy must remain small in v0.1. Adding near-duplicate labels will reduce measurement quality and make selection rules harder to reason about.

---

## 8. Frame Catalog Extension

The current `GlassesPreset` type contains only `id`, `name`, `style`, `assetPath`, and `promptHint`. Style Explorer requires explicit structured metadata.

### Proposed compatible type

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

All existing optical presets must receive explicit values for the new required fields in the same change that introduces the type. Do not make application behavior depend on implicit defaults distributed across multiple components.

If a staged migration is necessary, use one normalization function in `src/config/glasses-presets.ts`; do not add ad hoc fallbacks in Advisor, Compare, and Style Explorer separately.

### New preset assets

v0.1 should add 8 style-focused assets:

- 4 sunglasses archetypes;
- 2 expressive optical frames;
- 2 moderate bridge frames between current utility selection and stronger fashion styling.

Suggested initial coverage:

| Preset | Category | Main style signals |
| --- | --- | --- |
| Classic Wayfarer Sunglasses | Sunglasses | classic, vacation, everyday |
| Aviator Sunglasses | Sunglasses | classic, bold, outdoor |
| Cat-Eye Sunglasses | Sunglasses | bold, creative, social |
| Oversized Sunglasses | Sunglasses | bold, vacation, special-event |
| Transparent Geometric Optical | Optical | minimal, creative, everyday |
| Thin Metal Color Optical | Optical | creative, minimal, social |
| Warm Acetate Optical | Optical | classic, professional, everyday |
| Statement Narrow Optical | Optical | bold, creative, special-event |

All preset images must continue to be static repository assets under the existing preset asset convention unless a separate asset-storage decision is approved.

---

## 9. Frame-Set Selection Engine

### Implementation location

Create a pure, deterministic module:

`src/lib/style-explorer/frame-selector.ts`

Supporting types and rules can be placed under:

```text
src/lib/style-explorer/
├── types.ts
├── frame-selector.ts
├── scoring.ts
└── look-copy.ts
```

Do not place frame-selection logic directly inside a React component or API route.

### Input

```ts
interface StyleExplorerSelectionInput {
  styleIntent: StyleIntent
  occasion?: StyleOccasion
  category: StyleExplorerCategoryFilter
  faceShape?: FaceShape
  limit: number
  exclusionIds?: string[]
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

### Base scoring

The selector must use explicit weights stored in code and covered by unit tests.

Recommended v0.1 weights:

```text
Style tag match             +40
Occasion tag match          +20
Requested category match    required filter
Face-shape suitability      +15
Moderate novelty bonus      +5
Excluded/recently used      remove from candidate set
```

### Diversity constraints

Selecting the four highest raw scores is insufficient because it may produce near-identical looks.

The final set should enforce:

1. no duplicate preset;
2. no more than 2 frames with the same shape;
3. at least 2 different visual-weight levels when inventory permits;
4. at least 2 different materials when inventory permits;
5. for `all`, include both optical and sunglasses when eligible inventory permits;
6. each additional frame receives a diversity penalty when it closely matches already selected frames.

A greedy maximum-marginal-relevance approach is sufficient for v0.1. The result must remain deterministic for the same input and catalog version.

### Face-shape input

Face shape is optional.

- When Style Explorer is entered from a valid face analysis, pass the known face shape.
- When entered directly, do not block the flow to force face analysis.
- Missing face shape contributes zero points rather than excluding a frame.
- Style intent should remain the dominant signal; Style Explorer must not collapse into another Advisor result.

### Regeneration

`Explore another set` should call the selector with the previous preset IDs in `exclusionIds` where inventory permits.

If there are not enough unused eligible presets, the selector may reuse prior presets but should maximize set-level difference.

---

## 10. Shared Compare Execution Refactor

### Principle

Do not add Style Explorer behavior by expanding `FrameCompareInterface.tsx` into a large `mode === 'style'` component.

The current component owns multiple reusable concerns that should be extracted gradually.

### Required shared hooks/components

Recommended extraction targets:

```text
src/components/try-on-batch/
├── types.ts
├── useTryOnBatch.ts
├── useTryOnTaskPolling.ts
├── useTryOnBatchRecovery.ts
├── TryOnBatchProgress.tsx
├── TryOnResultGrid.tsx
└── TryOnResultCard.tsx
```

The exact naming can change, but the responsibility boundaries must be preserved.

### Shared responsibilities

The shared batch layer should own:

- batch initialization state;
- queued task placeholders;
- staggered per-frame dispatch;
- polling active tasks;
- processing-duration notices;
- completed/failed/active counts;
- failed-task retry;
- session credit refresh after completion;
- recoverable batch hydration;
- normalized task states.

### Business-specific containers

Keep separate top-level feature containers:

```text
src/components/compare/FrameCompareInterface.tsx
src/components/style-explorer/StyleExplorerInterface.tsx
```

Frame Compare owns:

- manual frame selection;
- selected-count and credit-constrained selection UX;
- comparison-oriented labels;
- compare-again behavior.

Style Explorer owns:

- style intent selection;
- occasion selection;
- category selection;
- generated frame-set preview;
- look naming and explanation;
- regenerate-set behavior;
- Style Explorer events.

### Refactor sequencing

The Style Explorer implementation should not begin with a high-risk full rewrite of Compare.

Use this sequence:

1. Extract shared task types and status normalization.
2. Extract polling and completion/session-refresh behavior.
3. Extract result-grid primitives with render slots for metadata/actions.
4. Keep existing Compare API behavior unchanged and verify regression tests.
5. Build Style Explorer container using the extracted primitives.
6. Extract dispatch/recovery hooks only where duplication becomes concrete.

---

## 11. API Design

### Proposed endpoints

```text
POST /api/style-explorer/select
POST /api/style-explorer/batch
POST /api/style-explorer/frame
GET  /api/style-explorer/current
```

`select` may be implemented as a client-side pure call in v0.1 because the catalog and rules are static. If selection rules are server-side, the endpoint must return only approved preset descriptors.

### Batch initialization request

```json
{
  "styleIntent": "creative",
  "occasion": "social",
  "category": "all",
  "faceShape": "oval",
  "presetIds": [
    "transparent-geometric-optical",
    "thin-metal-color-optical",
    "cat-eye-sunglasses",
    "statement-narrow-optical"
  ],
  "entrySource": "advisor-result"
}
```

The server must recompute or validate eligibility. It must not trust arbitrary client-supplied asset paths or prompt text.

### Batch initialization response

```json
{
  "success": true,
  "data": {
    "batchId": "style-explorer-userId-timestamp",
    "requiredCredits": 4,
    "remainingCreditsBefore": 12,
    "submissionStaggerMs": 3000,
    "context": {
      "styleIntent": "creative",
      "occasion": "social",
      "category": "all",
      "entrySource": "advisor-result"
    },
    "looks": [
      {
        "preset": {
          "id": "transparent-geometric-optical",
          "name": "Transparent Geometric",
          "style": "Geometric",
          "assetPath": "assets/glasses-presets/transparent-geometric-optical.jpg"
        },
        "lookKey": "creative-light",
        "batchIndex": 0
      }
    ]
  }
}
```

### Per-frame dispatch

Style Explorer should call a Style Explorer frame endpoint that internally uses the same shared submission service as Compare.

Do not call the Compare endpoint with a hidden mode flag. Separate endpoints provide clearer validation, analytics, recovery filtering, logging, and future evolution while still sharing server helpers.

### Shared server helper

Refactor the current helper into a general preset try-on submission function, for example:

```ts
submitPresetTryOnTask({
  user,
  userImageFile,
  preset,
  batch,
  promptContext,
  index,
})
```

Compare and Style Explorer should supply feature-specific prompt context and metadata.

### Prompt behavior

Style Explorer prompts may add style context, but must retain the existing identity-preservation rules:

- do not change the person's face;
- do not change expression or head size;
- do not change background or composition;
- use the supplied frame asset as the eyewear reference;
- keep output realistic and useful for eyewear evaluation.

The style label must not authorize unrelated visual restyling of the person or scene.

---

## 12. Batch and Task Metadata

Style Explorer should reuse the existing try-on task persistence model and store feature context in metadata.

### Required batch metadata

```ts
{
  batchId: string
  source: 'style-explorer'
  batchSize: number
  serviceType: 'grsai'
  submissionStaggerMs: number
  styleIntent: StyleIntent
  occasion?: StyleOccasion
  category: StyleExplorerCategoryFilter
  faceShape?: FaceShape
  entrySource: StyleExplorerEntrySource
  selectorVersion: string
  catalogVersion: string
}
```

### Required frame metadata

```ts
{
  framePresetId: string
  framePresetName: string
  framePresetStyle: string
  frameCategory: EyewearCategory
  lookKey: string
  batchIndex: number
}
```

### Batch ID

Use:

```text
style-explorer-{userId}-{timestamp}
```

Recovery queries must filter `metadata.source === 'style-explorer'`. Style Explorer must never recover a Frame Compare batch, and Compare must never recover a Style Explorer batch.

---

## 13. Credit and Failure Behavior

v0.1 uses the existing credit rules.

1. One successful generated result consumes one credit under the existing try-on pipeline.
2. A 4-look set requires up to 4 available credits before batch start.
3. The UI must display required credits before generation.
4. Users with 1-3 credits may generate the same number of looks; selection limit follows available credits, matching Compare's current behavior.
5. A failed frame must not hide completed results.
6. Retry checks credits again.
7. Style Explorer must not implement a separate deduction or refund path.
8. Credit behavior should be tested against partial success and retry cases.

---

## 14. Result Presentation

The result grid can reuse the current Compare grid foundation, but result semantics differ.

### Required card content

Each completed result displays:

- generated image;
- look name;
- frame name;
- 1-3 style tags;
- concise reason;
- `Save Look`;
- `Share` where current single-result sharing supports it;
- optional `Compare` action.

### Look explanation

v0.1 explanations should be produced from deterministic templates based on selected metadata. Do not call an LLM solely to write short card copy.

Example:

> A lighter geometric frame adds creative definition while keeping the overall look clean and wearable.

Copy must avoid medical, biometric, or guaranteed-fit claims.

### Save behavior

If the existing dashboard already exposes completed try-on tasks, v0.1 can treat the generated result as saved in history and use `Save Look` as a lightweight favorite action only when a favorite field/object is available.

Do not create a new `StyleProject` database model solely to satisfy v0.1 card copy. If favorite persistence is not ready, label the action according to actual behavior.

### Comparison transition

A user may send selected Style Explorer results into Frame Compare only when the current Compare data model can accept those preset IDs cleanly. Otherwise, link to Compare with the same photo and require re-selection.

Do not promise cross-module state transfer before it is implemented.

---

## 15. Analytics

Style Explorer must be measured independently from Frame Compare even when execution components are shared.

### Minimum events

| Event | Trigger |
| --- | --- |
| `style_explorer_viewed` | Module page becomes visible. |
| `style_explorer_photo_added` | Valid photo is selected. |
| `style_explorer_style_selected` | User selects style intent. |
| `style_explorer_occasion_selected` | User selects occasion. |
| `style_explorer_category_selected` | User selects category. |
| `style_explorer_set_created` | Selector produces a candidate set. |
| `style_explorer_generation_started` | User confirms credit cost and starts batch. |
| `style_explorer_frame_completed` | One frame completes. |
| `style_explorer_frame_failed` | One frame fails. |
| `style_explorer_generation_completed` | Batch has no active tasks. |
| `style_explorer_regenerated` | User requests another frame set. |
| `style_explorer_look_saved` | Look favorite/save succeeds. |
| `style_explorer_look_shared` | Share action succeeds or share surface opens, according to existing analytics convention. |
| `style_explorer_compare_clicked` | User continues to Compare. |
| `style_explorer_pricing_clicked` | User clicks a credit CTA. |

### Required properties

```text
batch_id
entry_source
style_intent
occasion
category
face_shape_available
selected_preset_ids
selected_count
required_credits
remaining_credits
completed_count
failed_count
selector_version
catalog_version
device_type
locale
```

### Validation metrics

The product review should compare Style Explorer users against normal Compare users:

- module entry rate;
- photo-to-generation conversion;
- average generated looks;
- regeneration rate;
- save rate;
- share rate;
- Compare continuation rate;
- pricing-click rate;
- credit consumption per user;
- 7-day return rate.

A Studio MVP should not be approved solely because users click sunglasses. Evidence should show repeated look creation, saving/sharing, or return behavior.

---

## 16. Suggested Frontend Structure

```text
src/components/style-explorer/
├── StyleExplorerInterface.tsx
├── StyleIntentSelector.tsx
├── StyleOccasionSelector.tsx
├── StyleCategorySelector.tsx
├── StyleSetPreview.tsx
├── StyleLookMeta.tsx
└── StyleExplorerLanding.tsx

src/components/try-on-batch/
├── types.ts
├── useTryOnTaskPolling.ts
├── TryOnBatchProgress.tsx
├── TryOnResultGrid.tsx
└── TryOnResultCard.tsx

src/lib/style-explorer/
├── types.ts
├── frame-selector.ts
├── scoring.ts
└── look-copy.ts
```

The exact structure may be adapted to existing repository conventions, but UI, domain logic, and execution infrastructure must not be collapsed into one component.

---

## 17. Testing Requirements

### Unit tests

Add tests for:

1. style and category filtering;
2. deterministic results for identical input;
3. face-shape scoring with and without face context;
4. diversity constraints;
5. exclusion IDs during regeneration;
6. inventory-shortage fallback;
7. look-copy template mapping;
8. metadata serialization.

Suggested locations:

```text
src/lib/style-explorer/__tests__/frame-selector.test.ts
src/lib/style-explorer/__tests__/look-copy.test.ts
```

### API tests

Cover:

- unauthorized request;
- unknown preset ID;
- preset not enabled for Style Explorer;
- insufficient credits;
- valid 1-4 look batch;
- category mismatch tampering;
- partial dispatch failure;
- recovery source isolation;
- retry with insufficient and sufficient credits.

### Component tests

Cover:

- required style selection;
- optional occasion;
- category changes regenerate the candidate set;
- credit-limited look count;
- loading and partial completion states;
- result metadata rendering;
- regenerate behavior;
- zero-credit pricing CTA.

### End-to-end test

One Playwright scenario must cover:

1. sign in through test mode;
2. open Style Explorer;
3. upload a test portrait;
4. choose `Creative` and `All`;
5. receive four candidate presets;
6. start generation;
7. observe queued/processing/completed states;
8. verify four result cards or explicit partial failure state;
9. regenerate another set;
10. verify analytics calls or test-visible event transport where supported.

### Regression tests

Frame Compare must retain:

- manual selection;
- credit-aware limit;
- staggered dispatch;
- task polling;
- retry;
- current batch recovery;
- result history persistence.

---

## 18. Rollout Plan

### Phase 0 — Catalog and instrumentation preparation

- extend preset metadata;
- add 8 style-focused assets;
- implement selector and tests;
- confirm analytics transport;
- no public navigation entry.

### Phase 1 — Internal route

- implement authenticated Style Explorer route;
- reuse/extract shared batch components;
- validate generation quality and prompt consistency;
- run internal test accounts only.

### Phase 2 — Controlled Beta

- expose `New — Style Explorer` to a percentage of signed-in users;
- add entry from Advisor or Compare completion;
- retain current four-module homepage hierarchy;
- review behavior weekly.

### Phase 3 — Product-module decision

Promote Style Explorer to a fully exposed fifth module only if behavior demonstrates meaningful exploration demand.

Suggested decision signals over a statistically useful sample:

- at least 15% of eligible users enter Style Explorer;
- generation completion is not materially worse than Compare;
- at least 20% of generators request another set, save, share, or return;
- Style Explorer produces higher average credit usage without disproportionate failure/support cost;
- qualitative feedback confirms style discovery rather than novelty-only use.

Thresholds are starting hypotheses and should be revised after baseline data exists.

---

## 19. Implementation Sequence

Recommended engineering order:

1. Add structured metadata to all existing presets.
2. Add new style/sunglasses preset assets.
3. Implement and test deterministic selector.
4. Extract compare result-grid and polling primitives without changing current behavior.
5. Add Style Explorer route and landing/auth gate.
6. Add Style Explorer batch initialization and per-frame endpoints.
7. Refactor shared server preset submission helper.
8. Add Style Explorer interface and style-oriented result metadata.
9. Add recovery isolation by feature source.
10. Add analytics.
11. Add Playwright and regression coverage.
12. Release behind a feature flag or controlled navigation exposure.

---

## 20. Acceptance Criteria

Style Explorer v0.1 is ready for controlled Beta when:

1. It exists as an independent route and user-visible module concept.
2. User can upload one photo and choose style intent, optional occasion, and category.
3. System returns up to 4 deterministic and meaningfully diverse eligible presets.
4. User sees exact credit cost before generation.
5. Each selected frame uses the existing try-on task pipeline.
6. Queued, processing, completed, and failed states render independently.
7. Failed frames can be retried under existing credit rules.
8. Refresh recovery cannot mix Compare and Style Explorer batches.
9. Completed results show style-specific metadata and explanation.
10. Existing Frame Compare behavior passes regression tests.
11. Required Style Explorer events and properties are observable.
12. The feature can be disabled without affecting Compare or normal Try-On.
13. No new Studio, project, merchant, or social data model is introduced unless separately approved.

---

## 21. Open Decisions Before Engineering Start

1. Confirm the 8 initial style/sunglasses assets and their quality standard.
2. Confirm whether Style Explorer Beta supports 1-4 looks based on credits or requires exactly 4 credits.
3. Confirm the existing analytics helper/event transport to use.
4. Confirm whether `Save Look` maps to current history, a favorite flag, or is deferred.
5. Confirm the initial entry points and Beta audience percentage.
6. Confirm whether known face shape is passed through URL/session/result context or fetched from the latest valid analysis.
7. Confirm whether shared batch extraction occurs before Style Explorer UI work or incrementally during implementation.

---

## 22. Decision Record

The technical direction is:

> Style Explorer is a separate product module implemented as a new business orchestration over the existing Frame Compare and Try-On execution foundation.

It must reuse generation, task lifecycle, credits, polling, retry, recovery patterns, and result primitives. It must not reuse the full Compare page as a mode-switched monolith, and it must not create a duplicate generation pipeline.

---

## 23. Change Log

| Date | Change |
| --- | --- |
| 2026-07-20 | Created initial technical specification after review of the current Frame Compare UI, APIs, server helper, preset catalog, product plan, and documentation conventions. |
