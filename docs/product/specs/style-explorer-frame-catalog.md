# Style Explorer Frame Catalog Specification

**Status:** Ready for implementation  
**Owner:** Product / Engineering  
**Created:** 2026-07-20  
**Related spec:** `docs/product/specs/style-explorer.md`  
**Target catalog:** `src/config/glasses-presets.ts`

---

## 1. Purpose

This document defines the 16 new repository-managed frame presets created for the Style Explorer module.

The catalog is intended to be implementation-ready. Engineering should be able to use the IDs, names, categories, metadata, recommendation tags, prompt hints and asset requirements below directly when extending `GlassesPreset` and implementing the deterministic Style Explorer selector.

These 16 presets are additive to the existing 16 built-in optical presets. After implementation, VisuTry will have 32 built-in presets in total:

- 16 existing utility / face-shape-oriented optical presets;
- 16 Style Explorer presets defined in this document.

The Style Explorer set contains:

- 8 sunglasses;
- 8 optical frames.

---

## 2. Required catalog model

Extend the current `GlassesPreset` interface with structured metadata.

```ts
export type EyewearCategory = 'optical' | 'sunglasses'

export type FrameShape =
  | 'wayfarer'
  | 'aviator'
  | 'cat-eye'
  | 'oversized-square'
  | 'narrow-rectangle'
  | 'round'
  | 'shield'
  | 'flat-top'
  | 'geometric'
  | 'square'
  | 'oval'
  | 'browline'
  | 'rimless-geometric'

export type FrameRimType =
  | 'full-rim'
  | 'semi-rimless'
  | 'rimless'
  | 'shield'

export type FrameMaterial =
  | 'acetate'
  | 'metal'
  | 'mixed'
  | 'rimless'
  | 'sport-polymer'

export type FrameColorFamily =
  | 'black'
  | 'gold'
  | 'tortoise'
  | 'transparent'
  | 'burgundy'
  | 'silver'

export type StyleIntent =
  | 'professional'
  | 'minimal'
  | 'classic'
  | 'creative'
  | 'bold'
  | 'vacation'

export type StyleOccasion =
  | 'everyday'
  | 'work'
  | 'weekend'
  | 'outdoor'

export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'diamond'
  | 'oblong'

export interface GlassesPreset {
  id: string
  name: string
  style: string
  assetPath: string
  promptHint: string

  category: EyewearCategory
  shape: FrameShape
  rimType: FrameRimType
  material: FrameMaterial
  colorFamily: FrameColorFamily
  visualWeight: 1 | 2 | 3 | 4 | 5
  styleTags: StyleIntent[]
  occasionTags: StyleOccasion[]
  suitableFaceShapes?: FaceShape[]
  isStyleExplorerEnabled?: boolean
  collection?: 'base' | 'style-explorer'
}
```

`collection` is optional but recommended because it gives product code, analytics and future catalog tooling a stable way to distinguish the original 16 presets from the new Style Explorer inventory.

---

## 3. Asset requirements

Every Style Explorer frame asset must follow the same production rules:

1. One frame per image.
2. Square image: `1024 × 1024`.
3. Pure white background.
4. Front-facing, centered composition.
5. No text, numbering, labels, watermarks or surrounding objects.
6. Consistent frame scale and whitespace across the collection.
7. Both lenses fully visible.
8. Temples may be visible behind the lenses, but must not obscure the frame silhouette.
9. No human model, face outline or try-on simulation.
10. Repository-managed asset path under:

```text
public/assets/glasses-presets/style-explorer/
```

Recommended path convention:

```text
assets/glasses-presets/style-explorer/<preset-id>.png
```

---

## 4. Complete catalog summary

| # | Preset ID | Display name | Category | Primary role |
| ---: | --- | --- | --- | --- |
| 1 | `sun-wayfarer-black` | Classic Black Wayfarer | Sunglasses | Safe classic entry point |
| 2 | `sun-aviator-gold` | Gold Aviator | Sunglasses | Classic outdoor / bold direction |
| 3 | `sun-cat-eye-black` | Black Cat-Eye | Sunglasses | Feminine expressive direction |
| 4 | `sun-oversized-gradient` | Oversized Gradient | Sunglasses | Glamorous statement direction |
| 5 | `sun-narrow-rectangle-black` | Narrow Rectangle | Sunglasses | Fashion-forward / Y2K direction |
| 6 | `sun-round-tortoise` | Tortoise Round | Sunglasses | Warm vintage / relaxed direction |
| 7 | `optical-transparent-geometric` | Transparent Geometric | Optical | Expressive modern optical frame |
| 8 | `optical-statement-color` | Statement Color | Optical | Strong color-led optical frame |
| 9 | `optical-warm-tortoise` | Warm Tortoise Acetate | Optical | Safe bridge from utility to style |
| 10 | `optical-thin-gold-oval` | Thin Gold Metal Oval | Optical | Refined minimal professional frame |
| 11 | `optical-clear-soft-square` | Clear Soft Square | Optical | Clean low-risk fashion frame |
| 12 | `optical-slim-browline` | Slim Browline | Optical | Modern professional mixed-material frame |
| 13 | `sun-shield-wraparound-black` | Black Shield Wraparound | Sunglasses | Sport / future / tech direction |
| 14 | `sun-curved-flat-top-black` | Curved Flat-Top Black | Sunglasses | Architectural bold direction |
| 15 | `optical-rimless-geometric` | Rimless Geometric | Optical | Invisible refined technology direction |
| 16 | `optical-slim-black-oval` | Slim Black Oval | Optical | 1990s minimal / office direction |

---

## 5. Implementation-ready preset definitions

The following object definitions are the normative metadata for v0.1.

```ts
export const STYLE_EXPLORER_GLASSES_PRESETS: GlassesPreset[] = [
  {
    id: 'sun-wayfarer-black',
    name: 'Classic Black Wayfarer',
    style: 'Wayfarer Sunglasses',
    assetPath: 'assets/glasses-presets/style-explorer/sun-wayfarer-black.png',
    promptHint:
      'classic glossy black wayfarer sunglasses with dark gray lenses and subtle silver rivets',
    category: 'sunglasses',
    shape: 'wayfarer',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'black',
    visualWeight: 4,
    styleTags: ['classic', 'professional', 'vacation'],
    occasionTags: ['everyday', 'weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-aviator-gold',
    name: 'Gold Aviator',
    style: 'Aviator Sunglasses',
    assetPath: 'assets/glasses-presets/style-explorer/sun-aviator-gold.png',
    promptHint:
      'thin gold metal aviator sunglasses with a double bridge and dark olive green teardrop lenses',
    category: 'sunglasses',
    shape: 'aviator',
    rimType: 'full-rim',
    material: 'metal',
    colorFamily: 'gold',
    visualWeight: 3,
    styleTags: ['classic', 'bold', 'vacation'],
    occasionTags: ['weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'square', 'heart', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-cat-eye-black',
    name: 'Black Cat-Eye',
    style: 'Cat-Eye Sunglasses',
    assetPath: 'assets/glasses-presets/style-explorer/sun-cat-eye-black.png',
    promptHint:
      'glossy black acetate cat-eye sunglasses with elegant upswept corners and dark gradient lenses',
    category: 'sunglasses',
    shape: 'cat-eye',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'black',
    visualWeight: 4,
    styleTags: ['bold', 'creative', 'vacation'],
    occasionTags: ['weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'diamond'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-oversized-gradient',
    name: 'Oversized Gradient',
    style: 'Oversized Sunglasses',
    assetPath: 'assets/glasses-presets/style-explorer/sun-oversized-gradient.png',
    promptHint:
      'oversized tortoise acetate sunglasses with large softly square lenses and warm brown gradient tint',
    category: 'sunglasses',
    shape: 'oversized-square',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'tortoise',
    visualWeight: 5,
    styleTags: ['bold', 'classic', 'vacation'],
    occasionTags: ['weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'oblong', 'heart', 'diamond'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-narrow-rectangle-black',
    name: 'Narrow Rectangle',
    style: 'Narrow Rectangle Sunglasses',
    assetPath:
      'assets/glasses-presets/style-explorer/sun-narrow-rectangle-black.png',
    promptHint:
      'slim glossy black narrow rectangular sunglasses with shallow dark lenses and a clean minimal silhouette',
    category: 'sunglasses',
    shape: 'narrow-rectangle',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'black',
    visualWeight: 4,
    styleTags: ['creative', 'bold', 'minimal'],
    occasionTags: ['weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-round-tortoise',
    name: 'Tortoise Round',
    style: 'Round Sunglasses',
    assetPath: 'assets/glasses-presets/style-explorer/sun-round-tortoise.png',
    promptHint:
      'warm tortoise acetate round sunglasses with brown lenses and a relaxed vintage character',
    category: 'sunglasses',
    shape: 'round',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'tortoise',
    visualWeight: 3,
    styleTags: ['classic', 'creative', 'vacation'],
    occasionTags: ['everyday', 'weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'square', 'diamond', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-transparent-geometric',
    name: 'Transparent Geometric',
    style: 'Transparent Geometric Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-transparent-geometric.png',
    promptHint:
      'transparent clear acetate geometric optical glasses with softly faceted lenses and a modern lightweight appearance',
    category: 'optical',
    shape: 'geometric',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'transparent',
    visualWeight: 2,
    styleTags: ['creative', 'minimal'],
    occasionTags: ['everyday', 'weekend'],
    suitableFaceShapes: ['oval', 'round', 'heart'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-statement-color',
    name: 'Statement Color',
    style: 'Statement Color Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-statement-color.png',
    promptHint:
      'deep burgundy acetate statement optical glasses with a bold softly square silhouette and clear lenses',
    category: 'optical',
    shape: 'square',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'burgundy',
    visualWeight: 5,
    styleTags: ['bold', 'creative'],
    occasionTags: ['weekend', 'everyday'],
    suitableFaceShapes: ['oval', 'round', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-warm-tortoise',
    name: 'Warm Tortoise Acetate',
    style: 'Warm Tortoise Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-warm-tortoise.png',
    promptHint:
      'warm tortoise acetate optical glasses with a softly square wayfarer-inspired shape and clear lenses',
    category: 'optical',
    shape: 'wayfarer',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'tortoise',
    visualWeight: 3,
    styleTags: ['classic', 'professional'],
    occasionTags: ['everyday', 'work'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-thin-gold-oval',
    name: 'Thin Gold Metal Oval',
    style: 'Thin Gold Oval Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-thin-gold-oval.png',
    promptHint:
      'thin gold metal oval optical glasses with clear lenses, delicate bridge and transparent nose pads',
    category: 'optical',
    shape: 'oval',
    rimType: 'full-rim',
    material: 'metal',
    colorFamily: 'gold',
    visualWeight: 1,
    styleTags: ['minimal', 'professional', 'classic'],
    occasionTags: ['work', 'everyday'],
    suitableFaceShapes: ['square', 'heart', 'diamond', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-clear-soft-square',
    name: 'Clear Soft Square',
    style: 'Clear Soft Square Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-clear-soft-square.png',
    promptHint:
      'clear transparent acetate optical glasses with a soft square shape, subtle rounded corners and clear lenses',
    category: 'optical',
    shape: 'square',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'transparent',
    visualWeight: 2,
    styleTags: ['minimal', 'creative', 'professional'],
    occasionTags: ['everyday', 'work'],
    suitableFaceShapes: ['oval', 'round', 'heart'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-slim-browline',
    name: 'Slim Browline',
    style: 'Slim Browline Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-slim-browline.png',
    promptHint:
      'slim black and gold mixed-material browline optical glasses with a light upper accent and thin metal lower rim',
    category: 'optical',
    shape: 'browline',
    rimType: 'semi-rimless',
    material: 'mixed',
    colorFamily: 'black',
    visualWeight: 3,
    styleTags: ['professional', 'classic', 'minimal'],
    occasionTags: ['work', 'everyday'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-shield-wraparound-black',
    name: 'Black Shield Wraparound',
    style: 'Shield Wraparound Sunglasses',
    assetPath:
      'assets/glasses-presets/style-explorer/sun-shield-wraparound-black.png',
    promptHint:
      'fashion-oriented black shield wraparound sunglasses with a single dark smoke lens, sculpted brow line and streamlined sport silhouette',
    category: 'sunglasses',
    shape: 'shield',
    rimType: 'shield',
    material: 'sport-polymer',
    colorFamily: 'black',
    visualWeight: 5,
    styleTags: ['bold', 'creative', 'vacation'],
    occasionTags: ['outdoor', 'weekend'],
    suitableFaceShapes: ['oval', 'round', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'sun-curved-flat-top-black',
    name: 'Curved Flat-Top Black',
    style: 'Curved Flat-Top Sunglasses',
    assetPath:
      'assets/glasses-presets/style-explorer/sun-curved-flat-top-black.png',
    promptHint:
      'architectural black acetate sunglasses with a strong curved flat top, wide rectangular lenses and dark smoke tint',
    category: 'sunglasses',
    shape: 'flat-top',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'black',
    visualWeight: 5,
    styleTags: ['bold', 'minimal', 'creative'],
    occasionTags: ['weekend', 'outdoor'],
    suitableFaceShapes: ['oval', 'round', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-rimless-geometric',
    name: 'Rimless Geometric',
    style: 'Rimless Geometric Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-rimless-geometric.png',
    promptHint:
      'true rimless geometric optical glasses with clear softly hexagonal lenses, a thin silver bridge and minimal transparent nose pads',
    category: 'optical',
    shape: 'rimless-geometric',
    rimType: 'rimless',
    material: 'rimless',
    colorFamily: 'silver',
    visualWeight: 1,
    styleTags: ['minimal', 'professional', 'creative'],
    occasionTags: ['work', 'everyday'],
    suitableFaceShapes: ['oval', 'round', 'heart', 'square'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
  {
    id: 'optical-slim-black-oval',
    name: 'Slim Black Oval',
    style: 'Slim Black Oval Optical',
    assetPath:
      'assets/glasses-presets/style-explorer/optical-slim-black-oval.png',
    promptHint:
      'slim glossy black oval optical glasses with low-profile lenses, fine acetate rims and a clean 1990s minimal character',
    category: 'optical',
    shape: 'oval',
    rimType: 'full-rim',
    material: 'acetate',
    colorFamily: 'black',
    visualWeight: 2,
    styleTags: ['minimal', 'classic', 'professional'],
    occasionTags: ['work', 'everyday'],
    suitableFaceShapes: ['square', 'heart', 'diamond', 'oblong'],
    isStyleExplorerEnabled: true,
    collection: 'style-explorer',
  },
]
```

---

## 6. Product grouping

### 6.1 Sunglasses collection

```ts
export const STYLE_EXPLORER_SUNGLASSES_IDS = [
  'sun-wayfarer-black',
  'sun-aviator-gold',
  'sun-cat-eye-black',
  'sun-oversized-gradient',
  'sun-narrow-rectangle-black',
  'sun-round-tortoise',
  'sun-shield-wraparound-black',
  'sun-curved-flat-top-black',
] as const
```

### 6.2 Optical collection

```ts
export const STYLE_EXPLORER_OPTICAL_IDS = [
  'optical-transparent-geometric',
  'optical-statement-color',
  'optical-warm-tortoise',
  'optical-thin-gold-oval',
  'optical-clear-soft-square',
  'optical-slim-browline',
  'optical-rimless-geometric',
  'optical-slim-black-oval',
] as const
```

---

## 7. Recommendation intent coverage

The 16-frame collection must cover each Style Explorer intent with enough inventory to return four diverse candidates when the user selects `All`.

| Style intent | Strong candidate presets |
| --- | --- |
| Professional | Classic Black Wayfarer, Warm Tortoise Acetate, Thin Gold Metal Oval, Clear Soft Square, Slim Browline, Rimless Geometric, Slim Black Oval |
| Minimal | Narrow Rectangle, Transparent Geometric, Thin Gold Metal Oval, Clear Soft Square, Slim Browline, Curved Flat-Top Black, Rimless Geometric, Slim Black Oval |
| Classic | Classic Black Wayfarer, Gold Aviator, Tortoise Round, Warm Tortoise Acetate, Thin Gold Metal Oval, Slim Browline, Slim Black Oval |
| Creative | Black Cat-Eye, Narrow Rectangle, Tortoise Round, Transparent Geometric, Statement Color, Clear Soft Square, Shield Wraparound, Curved Flat-Top Black, Rimless Geometric |
| Bold | Gold Aviator, Black Cat-Eye, Oversized Gradient, Narrow Rectangle, Statement Color, Shield Wraparound, Curved Flat-Top Black |
| Vacation | All sunglasses, with strongest priority for Gold Aviator, Oversized Gradient, Tortoise Round and Shield Wraparound |

---

## 8. Diversity constraints

When selecting four frames, the selector should favor visible contrast rather than four closely related high-scoring options.

Recommended constraints:

1. No duplicate preset IDs.
2. No more than two frames with the same `shape`.
3. No more than two frames with the same `colorFamily` when alternatives exist.
4. Prefer at least two distinct `visualWeight` bands.
5. For category `all`, prefer at least one optical and one sunglasses frame when both categories contain qualified candidates.
6. Avoid returning both transparent optical frames unless the requested style is `minimal` or `creative`.
7. Avoid returning both black statement sunglasses (`shield` and `flat-top`) in the same default set unless the requested style is `bold`.
8. Do not treat a high score as sufficient if the resulting set lacks silhouette diversity.

---

## 9. Look naming guidance

Look names are presentation copy, not preset names. A frame may produce different look names depending on the selected style and occasion.

Examples:

| Preset | Example look names |
| --- | --- |
| Classic Black Wayfarer | Everyday Classic, Polished Casual, Timeless Confidence |
| Gold Aviator | Modern Pilot, Outdoor Icon, Refined Adventure |
| Black Cat-Eye | Elegant Edge, Creative Confidence, Weekend Statement |
| Oversized Gradient | Glamorous Escape, Bold Vacation, Luxe Statement |
| Narrow Rectangle | Modern Editorial, Minimal Edge, Weekend Fashion |
| Tortoise Round | Warm Vintage, Relaxed Creative, Weekend Scholar |
| Transparent Geometric | Modern Creative, Clear Perspective, Light Geometry |
| Statement Color | Bold Character, Creative Accent, Color Confidence |
| Warm Tortoise Acetate | Warm Professional, Everyday Texture, Modern Classic |
| Thin Gold Metal Oval | Refined Minimal, Quiet Professional, Light Elegance |
| Clear Soft Square | Clean Modern, Everyday Minimal, Soft Structure |
| Slim Browline | Confident Professional, Modern Heritage, Structured Minimal |
| Black Shield Wraparound | Future Sport, Urban Motion, Tech Statement |
| Curved Flat-Top Black | Architectural Bold, Modern Authority, Graphic Minimal |
| Rimless Geometric | Invisible Structure, Refined Technology, Precision Minimal |
| Slim Black Oval | 90s Minimal, Quiet Intelligence, Modern Office |

---

## 10. Acceptance criteria

The frame catalog implementation is complete when:

1. All 16 assets exist at the documented paths.
2. Every asset is a standalone 1024 × 1024 image meeting the asset rules.
3. All 16 presets are represented in `glasses-presets.ts` or a dedicated imported Style Explorer catalog module.
4. Existing 16 presets remain backward compatible.
5. `getTopPickPresetById` or its replacement can resolve every new ID.
6. Category filtering returns 8 optical and 8 sunglasses Style Explorer presets.
7. Selector tests cover all six style intents and four occasions.
8. The selector never returns duplicate IDs.
9. Asset loading failures are caught during build or automated tests.
10. Analytics events use the stable preset IDs from this document.

---

## 11. Recommended implementation structure

To avoid turning `src/config/glasses-presets.ts` into one large mixed-purpose file, the preferred structure is:

```text
src/config/glasses-presets/
├── types.ts
├── base-presets.ts
├── style-explorer-presets.ts
└── index.ts
```

If restructuring is deferred, the 16 presets may temporarily be appended to the current file, but consumers should import a combined exported catalog rather than maintain separate lookup logic.
