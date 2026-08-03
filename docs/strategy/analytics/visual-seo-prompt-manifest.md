# VisuTry Visual SEO Prompt Manifest v1.0

**Status:** Active execution manifest  
**Last updated:** 2026-08-03  
**Parent:** `docs/strategy/analytics/visual-seo-production.md`  
**Scope:** Canonical filenames, model identity system, page mapping, and generation instructions for all 182 Visual SEO master assets.

> This file is the authoritative **generation registry** for the 182-image program. The parent production document remains the workflow / QA specification. Because production progress was reset to zero for Desktop Codex, the IDs and filenames in this manifest are the canonical clean-start sequence from `VSEO-001` through `VSEO-182`.

---

## 1. Prompt assembly rule

Codex must generate **one asset per image-generation call**. Never send a whole batch in one generation request.

For every row in the manifest, the exact generation prompt is assembled as:

```text
GLOBAL_PROMPT
+ MODEL_REFERENCE_BLOCK
+ TEMPLATE_BLOCK
+ ASSET_INSTRUCTION
+ NEGATIVE_BLOCK
```

The `ASSET_INSTRUCTION` column below is therefore not a vague note; it is the asset-specific final section of the production prompt. Codex must concatenate the five blocks exactly in this order.

### GLOBAL_PROMPT

```text
Create ONE standalone final Visual SEO image for VisuTry. This is a single production asset, not a batch overview and not a contact sheet. 4:3 landscape composition, clean white or pearl-white background, restrained VisuTry blue accent, premium editorial product-infographic style, generous whitespace, realistic eyewear proportions, realistic skin texture, front-facing or near-front-facing portrait when a person is shown. Keep rendered text minimal: one short title plus at most 2–4 short labels/cues. The image must visually answer the stated eyewear decision question. Do not add a generated logo. Do not add batch numbers, production IDs, filenames, progress indicators, thumbnail grids, dashboards, or unrelated panels.
```

### NEGATIVE_BLOCK

```text
Do NOT generate: batch overview, contact sheet, 2x5 grid, multi-page dashboard, unrelated face shapes, random extra models, fake VisuTry UI, fake VisuTry logo, fake prices, medical claims, biometric identity claims, distorted glasses, floating temples, asymmetrical lenses, impossible bridge placement, excessive text, neon/cyberpunk styling, heavy gradients, magazine-cover decoration, or watermarks. If comparison is required, keep the SAME PERSON, SAME POSE, SAME CROP, SAME LIGHTING and change only the intended eyewear variable.
```

---

## 2. Model Consistency System — mandatory

Visual consistency is not optional. The site must look as though the same small cast of people was photographed repeatedly for a coherent eyewear knowledge system.

### 2.1 Reference portraits

Before public production, create and approve these internal reference portraits. They are **not part of the 182 public-image count**.

Store them in:

```text
.local-assets/visual-seo/models/
```

| Model ID | Reference file | Fixed identity brief |
| --- | --- | --- |
| `F-ROUND-01` | `F-ROUND-01.png` | Woman, late 20s–early 30s, medium warm skin, dark brown hair, brown eyes, visibly round facial proportions, soft jawline, fuller cheeks, neutral expression, minimal makeup, off-white top. |
| `M-ROUND-01` | `M-ROUND-01.png` | Man, late 20s–early 30s, medium neutral skin, short dark brown hair, brown eyes, visibly round facial proportions, soft jaw, neutral expression, plain light-gray crewneck. |
| `F-OVAL-01` | `F-OVAL-01.png` | Woman, late 20s–early 30s, medium warm skin, long dark brown hair, brown eyes, balanced oval proportions, gently tapered jaw, neutral expression, minimal makeup, cream top. |
| `M-OVAL-01` | `M-OVAL-01.png` | Man, early 30s, medium neutral skin, short dark hair, brown eyes, balanced oval proportions, clean or light stubble, neutral expression, light neutral shirt. |
| `F-SQUARE-01` | `F-SQUARE-01.png` | Woman, early 30s, medium neutral skin, dark brown shoulder-length hair, brown eyes, broad forehead and defined angular jaw, neutral expression, cream top. |
| `M-SQUARE-01` | `M-SQUARE-01.png` | Man, early 30s, medium neutral skin, short dark brown hair, brown eyes, broad forehead, defined square jaw, light stubble, neutral expression, dark navy crewneck. |
| `F-HEART-01` | `F-HEART-01.png` | Woman, late 20s–early 30s, medium warm skin, dark brown hair, brown eyes, wider forehead / cheek area and narrower pointed chin, neutral expression, cream top. |
| `F-DIAMOND-01` | `F-DIAMOND-01.png` | Woman, late 20s–early 30s, medium warm skin, dark brown hair, brown eyes, narrower forehead and jaw with prominent cheekbone width, neutral expression, beige top. |
| `M-OBLONG-01` | `M-OBLONG-01.png` | Man, early 30s, medium neutral skin, short dark brown hair, brown eyes, visibly longer face than width, straight jaw, neutral expression, navy crewneck. |

### 2.2 MODEL_REFERENCE_BLOCK

When the manifest specifies one model ID, append:

```text
MODEL CONSISTENCY: Use the supplied reference portrait [MODEL_ID] as the identity reference. Preserve the same person’s facial identity, hair, skin tone, eye color, approximate age, face proportions, camera angle, neutral expression, and clothing family. Do not substitute another person. Eyewear may change only as specified by the asset instruction.
```

For multi-model face-shape comparison assets, use the relevant approved reference portraits together and preserve each identity.

### 2.3 Identity-lock rule

- Reuse the reference image as an image-conditioning input whenever the generation tool supports reference images.
- A text-only description is **not considered sufficient** for identity consistency once a reference portrait exists.
- If the tool cannot accept a reference image, Codex must flag `IDENTITY_UNCONTROLLED` and the output requires stricter human QA.
- Comparisons must never use two different people to imply a frame-only comparison.
- Do not progressively use prior generated derivatives as references; always anchor back to the approved canonical model reference to reduce identity drift.

---

## 3. Template blocks

### Template A — Hero Recommendation

```text
TEMPLATE A — HERO RECOMMENDATION: one primary portrait, one clearly readable eyewear direction, optionally 1–3 small frame alternatives, short title and up to three concise benefit cues. The image should answer “what works for this face or intent?” immediately.
```

### Template B — A/B Compare

```text
TEMPLATE B — A/B COMPARE: show the same canonical model twice with identical crop, pose, lighting, expression and clothing. Change only the frame family/style. Use a symmetric left/right layout with neutral labels. No winner scores unless the asset instruction explicitly calls for a preference explanation.
```

### Template C — Watch For / Fit Check

```text
TEMPLATE C — FIT CHECK: use one canonical model or 2–3 aligned crops of the same model. Add restrained blue measurement lines/arrows for width, brow line, lens depth, bridge, or height. Use simple labels such as Too Narrow / Balanced / Too Wide only when relevant.
```

### Template D — Face Shape Diagram

```text
TEMPLATE D — FACE SHAPE DIAGRAM: use a front-facing canonical model with subtle geometric guide lines marking forehead, cheekbones, jawline and/or face length. Keep the diagram educational and probabilistic; do not present face shape as biometric identity or medical fact.
```

### Template E — Workflow / Product CTA

```text
TEMPLATE E — WORKFLOW: show a simple 3–4 step decision flow using abstract clean cards/icons or real supplied screenshots only. Canonical sequence: Upload/Detect → Advisor → Try-On → Compare. Do not invent detailed product UI.
```

### Template F — Decision Answer

```text
TEMPLATE F — DECISION ANSWER: visually answer one concrete eyewear question. Use one direct conclusion, one illustrative example and one watch-for cue. Keep wording cautious and practical, not universal or absolute.
```

---

# 4. Canonical 182-asset prompt manifest

## A. Core commercial / product-intent assets — VSEO-001 to VSEO-024

| ID | Source filename | Public filename | Page owner | Model | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- | --- | --- | --- |
| VSEO-001 | `VSEO-001__ai-face-shape-detector-example.png` | `ai-face-shape-detector-example.webp` | `/en/face-shape-detector` | F-OVAL-01 | D | Title “AI Face Shape Detector”. Show the canonical woman front-facing with restrained facial proportion guides; indicate that the tool evaluates forehead, cheekbone, jaw and length proportions. No fake UI. |
| VSEO-002 | `VSEO-002__common-face-shapes-guide.png` | `common-face-shapes-guide.webp` | `/en/face-shape-detector` | MULTI | D | Title “Common Face Shapes”. One intentional comparison graphic showing six canonical face silhouettes/portraits: round, oval, square, heart, diamond, oblong. This multi-panel comparison is the subject itself, not a batch/contact sheet. |
| VSEO-003 | `VSEO-003__face-shape-photo-analysis-result.png` | `face-shape-photo-analysis-result.webp` | `/en/face-shape-detector` | F-OVAL-01 | D | Show one portrait with subtle guides and a simple non-UI result cue: “Likely Oval” plus 2 short proportion cues. Avoid confidence percentages. |
| VSEO-004 | `VSEO-004__how-to-identify-your-face-shape.png` | `how-to-identify-your-face-shape.webp` | `/en/what-is-my-face-shape` | F-OVAL-01 | D | Title “How to Identify Your Face Shape”. Mark forehead width, cheekbone width, jaw width and face length with four restrained lines. |
| VSEO-005 | `VSEO-005__face-shape-comparison-guide.png` | `face-shape-comparison-guide.webp` | `/en/what-is-my-face-shape` | MULTI | D | Create one educational comparison asset showing the six canonical face-shape outlines with one short distinguishing cue each. No rankings. |
| VSEO-006 | `VSEO-006__what-is-my-face-shape-result.png` | `what-is-my-face-shape-result.webp` | `/en/what-is-my-face-shape` | F-OVAL-01 | D | Show the same canonical oval model with a soft oval outline and short result: “Your face appears Oval” plus “slightly longer than wide” and “balanced proportions”. |
| VSEO-007 | `VSEO-007__what-glasses-suit-my-face-guide.png` | `what-glasses-suit-my-face-guide.webp` | `/en/what-glasses-suit-my-face` | F-OVAL-01 | A | Show the canonical oval model and three frame directions: cat-eye, aviator, soft rectangle. Focus on visual choice, not absolute best claims. |
| VSEO-008 | `VSEO-008__compare-glasses-for-your-face.png` | `compare-glasses-for-your-face.webp` | `/en/what-glasses-suit-my-face` | F-OVAL-01 | B | Same woman shown with two distinct candidate frames, identical crop; label “Sharper” and “Softer” rather than winner/loser. |
| VSEO-009 | `VSEO-009__find-glasses-for-your-face-workflow.png` | `find-glasses-for-your-face-workflow.webp` | `/en/what-glasses-suit-my-face` | F-OVAL-01 | E | Simple flow: Detect Face Shape → Get Frame Directions → Try On → Compare. Use abstract cards and one canonical portrait; no fake detailed UI. |
| VSEO-010 | `VSEO-010__find-glasses-for-my-face.png` | `find-glasses-for-my-face.webp` | `/en/find-glasses-for-my-face` | F-OVAL-01 | A | Personalized shortlist visual: same canonical woman plus three candidate frame families with concise labels “Everyday”, “Lift”, “Structure”. |
| VSEO-011 | `VSEO-011__glasses-frame-shapes-comparison.png` | `glasses-frame-shapes-comparison.webp` | `/en/find-glasses-for-my-face` | F-OVAL-01 | B | Compare rectangle, round, cat-eye and aviator on the same canonical model using four aligned mini portraits; identical pose/crop. This is an intentional frame comparison asset. |
| VSEO-012 | `VSEO-012__try-glasses-before-choosing.png` | `try-glasses-before-choosing.webp` | `/en/find-glasses-for-my-face` | F-OVAL-01 | A | Show the same woman wearing one candidate frame, with two small alternative frame silhouettes and the cue “Shortlist → Try → Compare”. |
| VSEO-013 | `VSEO-013__virtual-glasses-try-on-before-after.png` | `virtual-glasses-try-on-before-after.webp` | `/en/virtual-glasses-try-on` | F-OVAL-01 | B | Same exact woman before and after adding one realistic eyeglass frame. Left “Photo”, right “Virtual Try-On”. Do not alter face, hair, makeup or crop. |
| VSEO-014 | `VSEO-014__virtual-try-on-different-glasses.png` | `virtual-try-on-different-glasses.webp` | `/en/virtual-glasses-try-on` | F-OVAL-01 | B | Same woman shown in three aligned variants wearing rectangle, cat-eye and aviator frames. Identity and pose locked. |
| VSEO-015 | `VSEO-015__how-virtual-glasses-try-on-works.png` | `how-virtual-glasses-try-on-works.webp` | `/en/virtual-glasses-try-on` | F-OVAL-01 | E | Three-step abstract workflow: Upload Photo → Choose Frame → See Try-On Result. Include one canonical portrait, avoid fake app screens. |
| VSEO-016 | `VSEO-016__try-glasses-on-your-photo.png` | `try-glasses-on-your-photo.webp` | `/en/try-glasses-on-photo` | F-OVAL-01 | A | One clean portrait showing realistic glasses placement with a small original-photo thumbnail cue; title “Try Glasses on Your Photo”. |
| VSEO-017 | `VSEO-017__photo-four-glasses-frames.png` | `photo-four-glasses-frames.webp` | `/en/try-glasses-on-photo` | F-OVAL-01 | B | Four aligned crops of the exact same woman/photo with four distinct frames. Same head position and lighting; change frames only. |
| VSEO-018 | `VSEO-018__glasses-photo-try-on-comparison.png` | `glasses-photo-try-on-comparison.webp` | `/en/try-glasses-on-photo` | F-OVAL-01 | B | A/B comparison of two realistic frame styles on the exact same photo, with short cues “More lift” and “More structure”. |
| VSEO-019 | `VSEO-019__compare-four-glasses-frames.png` | `compare-four-glasses-frames.webp` | `/en/compare-glasses-frames` | F-OVAL-01 | B | Four-frame side-by-side comparison on the same canonical woman: rectangle, cat-eye, browline, aviator. No numerical ratings. |
| VSEO-020 | `VSEO-020__glasses-frame-a-vs-b.png` | `glasses-frame-a-vs-b.webp` | `/en/compare-glasses-frames` | F-OVAL-01 | B | Two large equal portraits of same woman with Frame A and Frame B; use neutral cues “Defined” and “Soft”. |
| VSEO-021 | `VSEO-021__best-glasses-frame-comparison-result.png` | `best-glasses-frame-comparison-result.webp` | `/en/compare-glasses-frames` | F-OVAL-01 | B | Show three shortlisted frames on same woman with one subtly highlighted “Strong match” based on balance, not an arbitrary score. |
| VSEO-022 | `VSEO-022__ai-glasses-advisor-analysis.png` | `ai-glasses-advisor-analysis.webp` | `/en/ai-glasses-advisor` | F-OVAL-01 | D | Advisor-style analysis visual: canonical woman with proportion guides and three short observations: balanced width, gentle jaw taper, moderate face length. No fake chat UI. |
| VSEO-023 | `VSEO-023__ai-glasses-recommendations.png` | `ai-glasses-recommendations.webp` | `/en/ai-glasses-advisor` | F-OVAL-01 | A | Show canonical woman plus three recommended frame families with concise rationale cues: “lift”, “structure”, “balanced”. |
| VSEO-024 | `VSEO-024__ai-glasses-advisor-try-on.png` | `ai-glasses-advisor-try-on.webp` | `/en/ai-glasses-advisor` | F-OVAL-01 | E | Visual flow “Face proportions → Recommendations → Virtual Try-On → Compare” using abstract cards and one canonical portrait. |

## B. Face Style owner assets — VSEO-025 to VSEO-042

For each face shape, keep its canonical model identical across all three assets.

| ID | Source filename | Public filename | Page | Model | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- | --- | --- | --- |
| VSEO-025 | `VSEO-025__best-glasses-for-round-face.png` | `best-glasses-for-round-face.webp` | `/en/style/round-face` | F-ROUND-01 | A | Title “Best Glasses for Round Face”. Show rectangle, browline and geometric frame directions; cue: add structure, definition, contrast. |
| VSEO-026 | `VSEO-026__round-face-frame-comparison.png` | `round-face-frame-comparison.webp` | `/en/style/round-face` | F-ROUND-01 | B | Same woman: rectangle frame vs round frame; show how one adds structure while the other gives a softer look. Neutral comparison. |
| VSEO-027 | `VSEO-027__round-face-glasses-proportions.png` | `round-face-glasses-proportions.webp` | `/en/style/round-face` | F-ROUND-01 | C | Show balanced frame width, moderate lens depth and a slightly angular silhouette on the same round-face model. |
| VSEO-028 | `VSEO-028__best-glasses-for-oval-face.png` | `best-glasses-for-oval-face.webp` | `/en/style/oval-face` | F-OVAL-01 | A | Title “Best Glasses for Oval Face”. Show cat-eye, aviator and soft rectangle directions; cue: maintain balance and choose proportionate width. |
| VSEO-029 | `VSEO-029__oval-face-frame-comparison.png` | `oval-face-frame-comparison.webp` | `/en/style/oval-face` | F-OVAL-01 | B | Same woman: cat-eye vs aviator, identical crop; cues “more lift” and “more openness”. |
| VSEO-030 | `VSEO-030__oval-face-glasses-proportions.png` | `oval-face-glasses-proportions.webp` | `/en/style/oval-face` | F-OVAL-01 | C | Mark frame width, lens depth and brow relationship on oval-face model; emphasize balanced proportions rather than one ideal shape. |
| VSEO-031 | `VSEO-031__best-glasses-for-square-face.png` | `best-glasses-for-square-face.webp` | `/en/style/square-face` | M-SQUARE-01 | A | Title “Best Glasses for Square Face”. Show rounded, aviator and light rim styles; cues “soften angles”, “balance width”, “lighter feel”. |
| VSEO-032 | `VSEO-032__square-face-frame-comparison.png` | `square-face-frame-comparison.webp` | `/en/style/square-face` | M-SQUARE-01 | B | Same man: rounded frame vs strongly rectangular frame; compare “softer” vs “more angular”. |
| VSEO-033 | `VSEO-033__square-face-glasses-proportions.png` | `square-face-glasses-proportions.webp` | `/en/style/square-face` | M-SQUARE-01 | C | Mark balanced frame width, softened corners and adequate lens depth on the square-face model. |
| VSEO-034 | `VSEO-034__best-glasses-for-heart-face.png` | `best-glasses-for-heart-face.webp` | `/en/style/heart-face` | F-HEART-01 | A | Show cat-eye, rounded and light/rimless frame directions; cues “balance forehead”, “keep lower half light”, “lift”. |
| VSEO-035 | `VSEO-035__heart-face-frame-comparison.png` | `heart-face-frame-comparison.webp` | `/en/style/heart-face` | F-HEART-01 | B | Same woman: rounded frame vs subtle cat-eye/oval frame; compare softer forehead balance vs upward lift. |
| VSEO-036 | `VSEO-036__heart-face-glasses-proportions.png` | `heart-face-glasses-proportions.webp` | `/en/style/heart-face` | F-HEART-01 | C | Mark wider forehead, balanced frame width and lighter lower-frame feel; keep chin area visually uncluttered. |
| VSEO-037 | `VSEO-037__best-glasses-for-diamond-face.png` | `best-glasses-for-diamond-face.webp` | `/en/style/diamond-face` | F-DIAMOND-01 | A | Show oval, browline and cat-eye directions; cues “highlight brow”, “balance cheekbones”, “soften angles”. |
| VSEO-038 | `VSEO-038__diamond-face-frame-comparison.png` | `diamond-face-frame-comparison.webp` | `/en/style/diamond-face` | F-DIAMOND-01 | B | Same woman: browline vs oval frame; identical crop; compare brow emphasis vs softer contour. |
| VSEO-039 | `VSEO-039__diamond-face-glasses-proportions.png` | `diamond-face-glasses-proportions.webp` | `/en/style/diamond-face` | F-DIAMOND-01 | C | Mark prominent cheekbone width, balanced frame width and gently rounded frame edges. |
| VSEO-040 | `VSEO-040__best-glasses-for-oblong-face.png` | `best-glasses-for-oblong-face.webp` | `/en/style/oblong-face` | M-OBLONG-01 | A | Show deeper rounded, oversized and aviator directions; cues “add width”, “add lens depth”, “reduce length emphasis”. |
| VSEO-041 | `VSEO-041__oblong-face-frame-comparison.png` | `oblong-face-frame-comparison.webp` | `/en/style/oblong-face` | M-OBLONG-01 | B | Same man: oversized frame vs deeper rounded frame; compare width and lens depth while keeping identity locked. |
| VSEO-042 | `VSEO-042__oblong-face-glasses-proportions.png` | `oblong-face-glasses-proportions.webp` | `/en/style/oblong-face` | M-OBLONG-01 | C | Mark face length, frame width and deeper lenses; warn against overly narrow, shallow frames. |

## C. Face Shape explainer assets — VSEO-043 to VSEO-054

| ID | Source filename | Public filename | Page | Model | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- | --- | --- | --- |
| VSEO-043 | `VSEO-043__round-face-shape-characteristics.png` | `round-face-shape-characteristics.webp` | `/en/face-shapes/round` | F-ROUND-01 | D | Title “Round Face Shape Characteristics”. Show soft jawline, fuller cheeks, similar width and length with restrained guide lines. |
| VSEO-044 | `VSEO-044__how-to-identify-round-face.png` | `how-to-identify-round-face.webp` | `/en/face-shapes/round` | F-ROUND-01 | D | Show three cues only: soft jawline, widest at cheekbones, face width roughly similar to length. |
| VSEO-045 | `VSEO-045__oval-face-shape-characteristics.png` | `oval-face-shape-characteristics.webp` | `/en/face-shapes/oval` | F-OVAL-01 | D | Title “Oval Face Shape Characteristics”. Mark balanced cheekbones, gently tapered jaw and face length slightly greater than width. |
| VSEO-046 | `VSEO-046__how-to-identify-oval-face.png` | `how-to-identify-oval-face.webp` | `/en/face-shapes/oval` | F-OVAL-01 | D | Three cues: slightly longer than wide, balanced forehead/cheekbones, gently tapered jaw. |
| VSEO-047 | `VSEO-047__square-face-shape-characteristics.png` | `square-face-shape-characteristics.webp` | `/en/face-shapes/square` | M-SQUARE-01 | D | Mark broad forehead, strong jaw width and face length near width; use subtle square guide. |
| VSEO-048 | `VSEO-048__how-to-identify-square-face.png` | `how-to-identify-square-face.webp` | `/en/face-shapes/square` | M-SQUARE-01 | D | Three cues: broad forehead, defined angular jaw, similar forehead/jaw width. |
| VSEO-049 | `VSEO-049__heart-face-shape-characteristics.png` | `heart-face-shape-characteristics.webp` | `/en/face-shapes/heart` | F-HEART-01 | D | Mark wider forehead/upper face, high cheek area and narrower pointed chin using a restrained heart-like outline. |
| VSEO-050 | `VSEO-050__how-to-identify-heart-face.png` | `how-to-identify-heart-face.webp` | `/en/face-shapes/heart` | F-HEART-01 | D | Three cues: wider forehead, cheek area broader than jaw, narrower or pointed chin. |
| VSEO-051 | `VSEO-051__diamond-face-shape-characteristics.png` | `diamond-face-shape-characteristics.webp` | `/en/face-shapes/diamond` | F-DIAMOND-01 | D | Mark narrow forehead, widest cheekbones and narrow jaw/chin with diamond guide lines. |
| VSEO-052 | `VSEO-052__how-to-identify-diamond-face.png` | `how-to-identify-diamond-face.webp` | `/en/face-shapes/diamond` | F-DIAMOND-01 | D | Three cues: cheekbones widest, forehead narrower, jaw/chin narrower. |
| VSEO-053 | `VSEO-053__oblong-face-shape-characteristics.png` | `oblong-face-shape-characteristics.webp` | `/en/face-shapes/oblong` | M-OBLONG-01 | D | Mark noticeably longer face length, moderate cheek width and relatively straight jaw lines. |
| VSEO-054 | `VSEO-054__how-to-identify-oblong-face.png` | `how-to-identify-oblong-face.webp` | `/en/face-shapes/oblong` | M-OBLONG-01 | D | Three cues: face longer than wide, relatively straight sides, moderate forehead/cheek/jaw width. |

## D. Face × Frame combination assets — VSEO-055 to VSEO-118

Each approved combination receives four assets in this fixed order: `01-hero` (A), `02-why-it-works` (A), `03-watch-for` (C), `04-compare` (B).

### D1. Rectangle × Round — `/en/glasses-guide/best-rectangle-glasses-for-round-face` — model F-ROUND-01

| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-055 | `VSEO-055__best-rectangle-glasses-for-round-face-01-hero.png` | A | Show F-ROUND-01 wearing medium-width rectangle glasses; cues “adds structure”, “creates definition”, “balances soft curves”. |
| VSEO-056 | `VSEO-056__best-rectangle-glasses-for-round-face-02-why-it-works.png` | A | Explain visually how straighter top/bottom edges introduce contrast against rounded facial contours; one portrait plus simple geometry cue. |
| VSEO-057 | `VSEO-057__best-rectangle-glasses-for-round-face-03-watch-for.png` | C | Same model with width guides; show Too Narrow / Balanced / Too Wide rectangle frame examples. |
| VSEO-058 | `VSEO-058__best-rectangle-glasses-for-round-face-04-compare.png` | B | Same model: rectangle vs round frame; label “more structure” vs “softer continuity”. |

### D2. Square × Round — `/en/glasses-guide/best-square-glasses-for-round-face` — model F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-059 | `VSEO-059__best-square-glasses-for-round-face-01-hero.png` | A | F-ROUND-01 in softened-corner square frames; cues definition, width balance, angular contrast. |
| VSEO-060 | `VSEO-060__best-square-glasses-for-round-face-02-why-it-works.png` | A | Show how square geometry adds visual angles while rounded corners prevent excessive harshness. |
| VSEO-061 | `VSEO-061__best-square-glasses-for-round-face-03-watch-for.png` | C | Compare overly boxy/thick vs balanced softened-square proportions on same model. |
| VSEO-062 | `VSEO-062__best-square-glasses-for-round-face-04-compare.png` | B | Same model: softened square vs rectangle; cues “bolder” vs “cleaner horizontal structure”. |

### D3. Browline × Round — `/en/glasses-guide/best-browline-glasses-for-round-face` — model F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-063 | `VSEO-063__best-browline-glasses-for-round-face-01-hero.png` | A | F-ROUND-01 in browline frames; cues “adds upper definition”, “draws eye upward”, “balances roundness”. |
| VSEO-064 | `VSEO-064__best-browline-glasses-for-round-face-02-why-it-works.png` | A | Emphasize strong brow line and lighter lower rim as the source of visual structure. |
| VSEO-065 | `VSEO-065__best-browline-glasses-for-round-face-03-watch-for.png` | C | Show balanced browline width and avoid a very heavy top line extending far beyond face width. |
| VSEO-066 | `VSEO-066__best-browline-glasses-for-round-face-04-compare.png` | B | Same model: browline vs full rectangle; cues “upper emphasis” vs “all-around structure”. |

### D4. Cat-Eye × Round — `/en/glasses-guide/best-cat-eye-glasses-for-round-face` — model F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-067 | `VSEO-067__best-cat-eye-glasses-for-round-face-01-hero.png` | A | F-ROUND-01 in subtle medium cat-eye frames; cues “lift”, “adds angles”, “draws attention upward”. |
| VSEO-068 | `VSEO-068__best-cat-eye-glasses-for-round-face-02-why-it-works.png` | A | Show upswept outer corners contrasting with soft round contours. |
| VSEO-069 | `VSEO-069__best-cat-eye-glasses-for-round-face-03-watch-for.png` | C | Compare subtle cat-eye vs overly narrow/extreme upsweep; same model. |
| VSEO-070 | `VSEO-070__best-cat-eye-glasses-for-round-face-04-compare.png` | B | Same model: cat-eye vs rectangle; cues “lift” vs “horizontal structure”. |

### D5. Geometric × Round — `/en/glasses-guide/best-geometric-glasses-for-round-face` — model F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-071 | `VSEO-071__best-geometric-glasses-for-round-face-01-hero.png` | A | F-ROUND-01 in restrained hexagonal/geometric frames; cues “adds angles”, “modern definition”, “breaks round continuity”. |
| VSEO-072 | `VSEO-072__best-geometric-glasses-for-round-face-02-why-it-works.png` | A | Overlay subtle polygon geometry showing contrast with rounded face outline. |
| VSEO-073 | `VSEO-073__best-geometric-glasses-for-round-face-03-watch-for.png` | C | Compare balanced geometric frame size with an overly small/angular option. |
| VSEO-074 | `VSEO-074__best-geometric-glasses-for-round-face-04-compare.png` | B | Same model: geometric vs rectangle; cues “more expressive angles” vs “classic structure”. |

### D6. Cat-Eye × Oval — `/en/glasses-guide/best-cat-eye-glasses-for-oval-face` — model F-OVAL-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-075 | `VSEO-075__best-cat-eye-glasses-for-oval-face-01-hero.png` | A | F-OVAL-01 in refined cat-eye frames; cues “adds lift”, “keeps balance”, “accentuates eyes”. |
| VSEO-076 | `VSEO-076__best-cat-eye-glasses-for-oval-face-02-why-it-works.png` | A | Show moderate upsweep preserving oval facial balance. |
| VSEO-077 | `VSEO-077__best-cat-eye-glasses-for-oval-face-03-watch-for.png` | C | Compare proportionate cat-eye vs oversized/extreme cat-eye on same model. |
| VSEO-078 | `VSEO-078__best-cat-eye-glasses-for-oval-face-04-compare.png` | B | Same model: cat-eye vs aviator; cues “lift” vs “open shape”. |

### D7. Aviator × Oval — `/en/glasses-guide/best-aviator-glasses-for-oval-face` — model M-OVAL-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-079 | `VSEO-079__best-aviator-glasses-for-oval-face-01-hero.png` | A | M-OVAL-01 in classic optical aviator frame, not dark sunglasses; cues balanced proportions, open eye area, versatile shape. |
| VSEO-080 | `VSEO-080__best-aviator-glasses-for-oval-face-02-why-it-works.png` | A | Show teardrop/aviator geometry fitting balanced oval proportions without overwhelming face width. |
| VSEO-081 | `VSEO-081__best-aviator-glasses-for-oval-face-03-watch-for.png` | C | Compare balanced aviator lens depth vs overly deep/wide aviator on same model. |
| VSEO-082 | `VSEO-082__best-aviator-glasses-for-oval-face-04-compare.png` | B | Same man: aviator vs soft rectangle; cues “open/curved” vs “defined/structured”. |

### D8. Browline × Oval — `/en/glasses-guide/best-browline-glasses-for-oval-face` — model F-OVAL-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-083 | `VSEO-083__best-browline-glasses-for-oval-face-01-hero.png` | A | F-OVAL-01 in moderate browline frame; cues brow emphasis, definition, balanced width. |
| VSEO-084 | `VSEO-084__best-browline-glasses-for-oval-face-02-why-it-works.png` | A | Show upper-frame emphasis while preserving overall oval balance. |
| VSEO-085 | `VSEO-085__best-browline-glasses-for-oval-face-03-watch-for.png` | C | Compare lighter vs overly thick top bar; same model. |
| VSEO-086 | `VSEO-086__best-browline-glasses-for-oval-face-04-compare.png` | B | Same model: browline vs cat-eye; cues “brow definition” vs “outer lift”. |

### D9. Oversized × Oval — `/en/glasses-guide/best-oversized-glasses-for-oval-face` — model F-OVAL-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-087 | `VSEO-087__best-oversized-glasses-for-oval-face-01-hero.png` | A | F-OVAL-01 in tasteful oversized optical frames; cues expressive scale, balanced coverage, statement look. |
| VSEO-088 | `VSEO-088__best-oversized-glasses-for-oval-face-02-why-it-works.png` | A | Show why balanced oval proportions can accommodate larger frames when width remains controlled. |
| VSEO-089 | `VSEO-089__best-oversized-glasses-for-oval-face-03-watch-for.png` | C | Compare proportionate oversized vs too-wide/too-low frame on same model. |
| VSEO-090 | `VSEO-090__best-oversized-glasses-for-oval-face-04-compare.png` | B | Same model: oversized vs medium-size version of similar shape; cues “statement” vs “everyday”. |

### D10. Round × Square — `/en/glasses-guide/best-round-glasses-for-square-face` — model M-SQUARE-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-091 | `VSEO-091__best-round-glasses-for-square-face-01-hero.png` | A | M-SQUARE-01 in medium round/oval frames; cues soften angles, add curves, balance jawline. |
| VSEO-092 | `VSEO-092__best-round-glasses-for-square-face-02-why-it-works.png` | A | Show curved frame contour contrasting with angular jaw/forehead. |
| VSEO-093 | `VSEO-093__best-round-glasses-for-square-face-03-watch-for.png` | C | Compare medium round vs very small round frame; avoid undersizing. |
| VSEO-094 | `VSEO-094__best-round-glasses-for-square-face-04-compare.png` | B | Same man: round vs rectangle; cues “softer” vs “stronger angularity”. |

### D11. Aviator × Square — `/en/glasses-guide/best-aviator-glasses-for-square-face` — model M-SQUARE-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-095 | `VSEO-095__best-aviator-glasses-for-square-face-01-hero.png` | A | M-SQUARE-01 in optical aviator frames; cues curved contrast, open shape, balanced width. |
| VSEO-096 | `VSEO-096__best-aviator-glasses-for-square-face-02-why-it-works.png` | A | Show curved teardrop geometry softening strong square angles. |
| VSEO-097 | `VSEO-097__best-aviator-glasses-for-square-face-03-watch-for.png` | C | Compare balanced aviator vs overly wide/deep aviator. |
| VSEO-098 | `VSEO-098__best-aviator-glasses-for-square-face-04-compare.png` | B | Same man: aviator vs round frame; cues “open/elongated” vs “compact curves”. |

### D12. Rimless × Square — `/en/glasses-guide/best-rimless-glasses-for-square-face` — model M-SQUARE-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-099 | `VSEO-099__best-rimless-glasses-for-square-face-01-hero.png` | A | M-SQUARE-01 in subtle rimless optical glasses; cues lighter visual weight, less edge emphasis, minimal look. |
| VSEO-100 | `VSEO-100__best-rimless-glasses-for-square-face-02-why-it-works.png` | A | Show how minimal rim visibility reduces added angular weight around strong facial features. |
| VSEO-101 | `VSEO-101__best-rimless-glasses-for-square-face-03-watch-for.png` | C | Compare appropriately sized rimless lenses vs tiny/narrow rimless lenses. |
| VSEO-102 | `VSEO-102__best-rimless-glasses-for-square-face-04-compare.png` | B | Same man: rimless vs full-rim rectangle; cues “lighter” vs “bolder”. |

### D13. Rounded × Heart — `/en/glasses-guide/best-rounded-glasses-for-heart-face` — model F-HEART-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-103 | `VSEO-103__best-rounded-glasses-for-heart-face-01-hero.png` | A | F-HEART-01 in softly rounded frames; cues soften forehead, balanced lower half, gentle style. |
| VSEO-104 | `VSEO-104__best-rounded-glasses-for-heart-face-02-why-it-works.png` | A | Show curved frame lines echoing a softer lower-face balance without adding heavy top weight. |
| VSEO-105 | `VSEO-105__best-rounded-glasses-for-heart-face-03-watch-for.png` | C | Compare light rounded frame vs heavy top-heavy rounded frame. |
| VSEO-106 | `VSEO-106__best-rounded-glasses-for-heart-face-04-compare.png` | B | Same woman: rounded vs subtle cat-eye; cues “softness” vs “lift”. |

### D14. Cat-Eye × Heart — `/en/glasses-guide/best-cat-eye-glasses-for-heart-face` — model F-HEART-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-107 | `VSEO-107__best-cat-eye-glasses-for-heart-face-01-hero.png` | A | F-HEART-01 in subtle cat-eye glasses; cues lift, eye emphasis, controlled upper width. |
| VSEO-108 | `VSEO-108__best-cat-eye-glasses-for-heart-face-02-why-it-works.png` | A | Show moderate upsweep that highlights eyes without overly widening the forehead. |
| VSEO-109 | `VSEO-109__best-cat-eye-glasses-for-heart-face-03-watch-for.png` | C | Compare subtle cat-eye vs very wide dramatic cat-eye. |
| VSEO-110 | `VSEO-110__best-cat-eye-glasses-for-heart-face-04-compare.png` | B | Same woman: cat-eye vs rounded frame; cues “lift” vs “soft balance”. |

### D15. Browline × Diamond — `/en/glasses-guide/best-browline-glasses-for-diamond-face` — model F-DIAMOND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-111 | `VSEO-111__best-browline-glasses-for-diamond-face-01-hero.png` | A | F-DIAMOND-01 in browline frames; cues brow emphasis, balance cheekbones, visual width at upper face. |
| VSEO-112 | `VSEO-112__best-browline-glasses-for-diamond-face-02-why-it-works.png` | A | Show stronger upper frame drawing focus toward brow/eyes while cheekbones remain balanced. |
| VSEO-113 | `VSEO-113__best-browline-glasses-for-diamond-face-03-watch-for.png` | C | Compare balanced browline vs overly narrow/heavy browline. |
| VSEO-114 | `VSEO-114__best-browline-glasses-for-diamond-face-04-compare.png` | B | Same woman: browline vs oval; cues “brow emphasis” vs “soft contour”. |

### D16. Oversized × Oblong — `/en/glasses-guide/best-oversized-glasses-for-oblong-face` — model M-OBLONG-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-115 | `VSEO-115__best-oversized-glasses-for-oblong-face-01-hero.png` | A | M-OBLONG-01 in tasteful deeper oversized optical frames; cues add width, add lens depth, reduce length emphasis. |
| VSEO-116 | `VSEO-116__best-oversized-glasses-for-oblong-face-02-why-it-works.png` | A | Show deeper lenses and slightly broader width creating stronger horizontal/vertical balance. |
| VSEO-117 | `VSEO-117__best-oversized-glasses-for-oblong-face-03-watch-for.png` | C | Compare balanced oversized vs extremely wide/heavy oversized frame. |
| VSEO-118 | `VSEO-118__best-oversized-glasses-for-oblong-face-04-compare.png` | B | Same man: deeper oversized vs narrow shallow frame; cues “balanced depth” vs “length emphasis”. |

## E. Gender / styling intent assets — VSEO-119 to VSEO-150

Each intent uses `01-overview`, `02-everyday`, `03-expressive`, `04-compare`.

### E1. Round Face Women — `/en/glasses-guide/glasses-for-round-face-women` — F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-119 | `VSEO-119__glasses-for-round-face-women-01-overview.png` | A | Show F-ROUND-01 with three frame directions: soft rectangle, browline, subtle cat-eye; title “Glasses for Round Face Women”. |
| VSEO-120 | `VSEO-120__glasses-for-round-face-women-02-everyday.png` | A | Same woman in understated medium rectangle frame; cue “everyday structure”. |
| VSEO-121 | `VSEO-121__glasses-for-round-face-women-03-expressive.png` | A | Same woman in refined geometric/cat-eye statement frame; cue “more lift and character”. |
| VSEO-122 | `VSEO-122__glasses-for-round-face-women-04-compare.png` | B | Same woman: everyday rectangle vs expressive cat-eye/geometric. |

### E2. Round Face Men — `/en/glasses-guide/glasses-for-round-face-men` — M-ROUND-01
| VSEO-123 | `VSEO-123__glasses-for-round-face-men-01-overview.png` | A | Show M-ROUND-01 with rectangle, browline and geometric options. |
| VSEO-124 | `VSEO-124__glasses-for-round-face-men-02-everyday.png` | A | Same man in medium rectangle optical frame; understated everyday look. |
| VSEO-125 | `VSEO-125__glasses-for-round-face-men-03-expressive.png` | A | Same man in geometric/browline statement frame; controlled boldness. |
| VSEO-126 | `VSEO-126__glasses-for-round-face-men-04-compare.png` | B | Same man: everyday rectangle vs expressive browline/geometric. |

### E3. Oval Face Women — `/en/glasses-guide/glasses-for-oval-face-women` — F-OVAL-01
| VSEO-127 | `VSEO-127__glasses-for-oval-face-women-01-overview.png` | A | Show F-OVAL-01 with cat-eye, aviator and soft rectangle directions. |
| VSEO-128 | `VSEO-128__glasses-for-oval-face-women-02-everyday.png` | A | Same woman in soft rectangle everyday frame. |
| VSEO-129 | `VSEO-129__glasses-for-oval-face-women-03-expressive.png` | A | Same woman in tasteful oversized cat-eye or sculptural frame. |
| VSEO-130 | `VSEO-130__glasses-for-oval-face-women-04-compare.png` | B | Same woman: everyday rectangle vs expressive cat-eye. |

### E4. Oval Face Men — `/en/glasses-guide/glasses-for-oval-face-men` — M-OVAL-01
| VSEO-131 | `VSEO-131__glasses-for-oval-face-men-01-overview.png` | A | Show M-OVAL-01 with aviator, browline and rectangle directions. |
| VSEO-132 | `VSEO-132__glasses-for-oval-face-men-02-everyday.png` | A | Same man in classic medium rectangle frame. |
| VSEO-133 | `VSEO-133__glasses-for-oval-face-men-03-expressive.png` | A | Same man in optical aviator or refined geometric frame. |
| VSEO-134 | `VSEO-134__glasses-for-oval-face-men-04-compare.png` | B | Same man: classic rectangle vs aviator/geometric. |

### E5. Square Face Women — `/en/glasses-guide/glasses-for-square-face-women` — F-SQUARE-01
| VSEO-135 | `VSEO-135__glasses-for-square-face-women-01-overview.png` | A | Show F-SQUARE-01 with round, oval and aviator directions. |
| VSEO-136 | `VSEO-136__glasses-for-square-face-women-02-everyday.png` | A | Same woman in medium oval/rounded everyday frame. |
| VSEO-137 | `VSEO-137__glasses-for-square-face-women-03-expressive.png` | A | Same woman in refined aviator or rounded statement frame. |
| VSEO-138 | `VSEO-138__glasses-for-square-face-women-04-compare.png` | B | Same woman: everyday oval vs expressive aviator. |

### E6. Square Face Men — `/en/glasses-guide/glasses-for-square-face-men` — M-SQUARE-01
| VSEO-139 | `VSEO-139__glasses-for-square-face-men-01-overview.png` | A | Show M-SQUARE-01 with round, aviator and rimless options. |
| VSEO-140 | `VSEO-140__glasses-for-square-face-men-02-everyday.png` | A | Same man in medium round/oval everyday frame. |
| VSEO-141 | `VSEO-141__glasses-for-square-face-men-03-expressive.png` | A | Same man in optical aviator frame. |
| VSEO-142 | `VSEO-142__glasses-for-square-face-men-04-compare.png` | B | Same man: round/oval vs aviator. |

### E7. Heart Face Women — `/en/glasses-guide/glasses-for-heart-face-women` — F-HEART-01
| VSEO-143 | `VSEO-143__glasses-for-heart-face-women-01-overview.png` | A | Show F-HEART-01 with subtle cat-eye, rounded and rimless options. |
| VSEO-144 | `VSEO-144__glasses-for-heart-face-women-02-everyday.png` | A | Same woman in light rounded/oval everyday frame. |
| VSEO-145 | `VSEO-145__glasses-for-heart-face-women-03-expressive.png` | A | Same woman in subtle cat-eye statement frame, not extreme width. |
| VSEO-146 | `VSEO-146__glasses-for-heart-face-women-04-compare.png` | B | Same woman: rounded everyday vs subtle cat-eye expressive. |

### E8. Diamond Face Women — `/en/glasses-guide/glasses-for-diamond-face-women` — F-DIAMOND-01
| VSEO-147 | `VSEO-147__glasses-for-diamond-face-women-01-overview.png` | A | Show F-DIAMOND-01 with oval, browline and cat-eye directions. |
| VSEO-148 | `VSEO-148__glasses-for-diamond-face-women-02-everyday.png` | A | Same woman in soft oval everyday frame. |
| VSEO-149 | `VSEO-149__glasses-for-diamond-face-women-03-expressive.png` | A | Same woman in refined browline/cat-eye statement frame. |
| VSEO-150 | `VSEO-150__glasses-for-diamond-face-women-04-compare.png` | B | Same woman: soft oval vs browline/cat-eye expressive. |

> **Route verification:** Before integrating E1–E8, Codex must resolve the current `glasses-guide` route registry. If the live slug differs semantically (for example `heart-shaped` vs `heart`), keep the public filename stable but integrate into the canonical existing route and update this manifest.

## F. Decision-question assets — VSEO-151 to VSEO-174

### F1. Do Round Glasses Suit a Round Face? — F-ROUND-01
| ID | Filename | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- |
| VSEO-151 | `VSEO-151__do-round-glasses-suit-round-face-01-answer.png` | F | Direct answer: “They can, if proportions are balanced.” Show F-ROUND-01 in a well-sized round frame; avoid absolute yes/no. |
| VSEO-152 | `VSEO-152__do-round-glasses-suit-round-face-02-correct-example.png` | A | Show one balanced round-frame example with controlled width and thin/medium rim. |
| VSEO-153 | `VSEO-153__do-round-glasses-suit-round-face-03-watch-for.png` | C | Same woman: overly small round frame vs balanced round frame. |
| VSEO-154 | `VSEO-154__do-round-glasses-suit-round-face-04-compare.png` | B | Same woman: round vs rectangle; cues “soft continuity” vs “added structure”. |

### F2. Do Aviators Suit an Oval Face? — M-OVAL-01
| VSEO-155 | `VSEO-155__do-aviators-suit-oval-face-01-answer.png` | F | Direct answer: “Often, when width and lens depth stay proportionate.” Show optical aviator on M-OVAL-01. |
| VSEO-156 | `VSEO-156__do-aviators-suit-oval-face-02-correct-example.png` | A | One balanced optical aviator example; emphasize face-width match and moderate lens depth. |
| VSEO-157 | `VSEO-157__do-aviators-suit-oval-face-03-watch-for.png` | C | Compare balanced aviator vs too-wide/deep aviator on same man. |
| VSEO-158 | `VSEO-158__do-aviators-suit-oval-face-04-compare.png` | B | Same man: aviator vs rectangle; cues “open curve” vs “defined line”. |

### F3. Are Cat-Eye Glasses Good for Round Faces? — F-ROUND-01
| VSEO-159 | `VSEO-159__cat-eye-glasses-good-round-face-01-answer.png` | F | Direct answer: “Cat-eye frames can add lift and angular contrast.” Show subtle cat-eye on F-ROUND-01. |
| VSEO-160 | `VSEO-160__cat-eye-glasses-good-round-face-02-correct-example.png` | A | Balanced medium cat-eye with modest upsweep. |
| VSEO-161 | `VSEO-161__cat-eye-glasses-good-round-face-03-watch-for.png` | C | Compare subtle medium cat-eye vs overly narrow/extreme cat-eye. |
| VSEO-162 | `VSEO-162__cat-eye-glasses-good-round-face-04-compare.png` | B | Same woman: cat-eye vs rectangle; cues “lift” vs “structure”. |

### F4. Should Glasses Cover Your Eyebrows? — F-OVAL-01
| VSEO-163 | `VSEO-163__should-glasses-cover-eyebrows-01-answer.png` | F | Direct answer: “Usually the top rim should work with, not heavily cover, the brow line.” Show correct alignment. |
| VSEO-164 | `VSEO-164__should-glasses-cover-eyebrows-02-correct-example.png` | A | Tight eye/brow crop showing top rim following brow line with eyebrows mostly visible. |
| VSEO-165 | `VSEO-165__should-glasses-cover-eyebrows-03-watch-for.png` | C | Same woman, three aligned crops: Too High / Balanced / Too Low. |
| VSEO-166 | `VSEO-166__should-glasses-cover-eyebrows-04-compare.png` | B | Same woman: balanced brow alignment vs frame sitting too low; identical crop. |

### F5. How Wide Should Glasses Be for My Face? — M-SQUARE-01
| VSEO-167 | `VSEO-167__how-wide-should-glasses-be-01-answer.png` | F | Direct answer: frame width should generally align near the widest part of the face. Use width arrows. |
| VSEO-168 | `VSEO-168__how-wide-should-glasses-be-02-correct-example.png` | A | One correct-fit example with frame outer edges visually aligned with face width. |
| VSEO-169 | `VSEO-169__how-wide-should-glasses-be-03-watch-for.png` | C | Same man: Too Narrow / Balanced / Too Wide with green/red guide lines. |
| VSEO-170 | `VSEO-170__how-wide-should-glasses-be-04-compare.png` | B | Same man: medium width vs wide frame; explain balanced vs visually overextended. |

### F6. How Should Glasses Fit Your Face? — F-OVAL-01
| VSEO-171 | `VSEO-171__how-should-glasses-fit-face-01-answer.png` | F | Direct answer graphic showing four fit checkpoints: width, bridge, lens position, temples. |
| VSEO-172 | `VSEO-172__how-should-glasses-fit-face-02-correct-example.png` | A | One well-fitted frame example with subtle labels: bridge sits comfortably, pupils centered, temples straight. |
| VSEO-173 | `VSEO-173__how-should-glasses-fit-face-03-watch-for.png` | C | Same woman, three detail crops: sliding bridge, temples too tight, frame too wide. |
| VSEO-174 | `VSEO-174__how-should-glasses-fit-face-04-compare.png` | B | Same woman: balanced fit vs visibly poor fit; keep frame style similar so fit is the changing variable. |

## G. Hub / navigation assets — VSEO-175 to VSEO-182

| ID | Source filename | Public filename | Page | Model | Template | ASSET_INSTRUCTION |
| --- | --- | --- | --- | --- | --- | --- |
| VSEO-175 | `VSEO-175__glasses-by-face-shape-overview.png` | `glasses-by-face-shape-overview.webp` | `/en/glasses-for-face-shape` | MULTI | D/A | One intentional overview showing six canonical face shapes paired with one representative frame direction each. This is a single educational map, not a batch sheet. |
| VSEO-176 | `VSEO-176__face-shape-to-frame-map.png` | `face-shape-to-frame-map.webp` | `/en/glasses-for-face-shape` | MULTI | D | Diagram mapping Round→Structure, Oval→Many balanced options, Square→Curves, Heart→Light/lift, Diamond→Brow/soft curves, Oblong→Width/depth. |
| VSEO-177 | `VSEO-177__recommended-glasses-by-face-shape.png` | `recommended-glasses-by-face-shape.webp` | `/en/glasses-for-face-shape` | MULTI | A | Six-face concise visual showing 2–3 frame families per shape, using the canonical model references and minimal text. |
| VSEO-178 | `VSEO-178__face-shape-glasses-decision-flow.png` | `face-shape-glasses-decision-flow.webp` | `/en/glasses-for-face-shape` | F-OVAL-01 | E | Simple flow: Detect face shape → Understand frame geometry → Try candidates → Compare. |
| VSEO-179 | `VSEO-179__glasses-guide-overview.png` | `glasses-guide-overview.webp` | `/en/glasses-guide` | F-OVAL-01 | E/A | Visual navigation overview with four branches: Face Shape, Frame Shape, Fit & Proportion, Decision Questions. One canonical portrait and abstract icons. |
| VSEO-180 | `VSEO-180__face-frame-guide-map.png` | `face-frame-guide-map.webp` | `/en/glasses-guide` | MULTI | D/A | Matrix-like educational map connecting the six face shapes to representative frame directions; intentional information graphic, not a production grid. |
| VSEO-181 | `VSEO-181__eyewear-decision-questions-guide.png` | `eyewear-decision-questions-guide.webp` | `/en/glasses-guide` | F-OVAL-01 | F | One overview card presenting four user questions visually: shape, width, eyebrow alignment, compare candidates. Minimal labels. |
| VSEO-182 | `VSEO-182__visutry-eyewear-decision-workflow.png` | `visutry-eyewear-decision-workflow.webp` | `/en/glasses-guide` | F-OVAL-01 | E | Final canonical workflow asset: Face Understanding → Advisor → Virtual Try-On → Frame Compare. Use abstract cards/icons and the canonical portrait, no fake UI. |

---

## 5. Codex generation algorithm

For each ID from 001 to 182:

```text
1. Read this manifest row.
2. Load the canonical model reference file(s).
3. Assemble GLOBAL_PROMPT + MODEL_REFERENCE_BLOCK + TEMPLATE_BLOCK + ASSET_INSTRUCTION + NEGATIVE_BLOCK.
4. Make exactly ONE image-generation request for that asset.
5. Save source as the exact `VSEO-###__semantic-name.png` filename.
6. Human-check identity consistency, face-shape plausibility, frame realism and topic correctness.
7. Reject and regenerate if identity drifts or the output becomes a contact sheet/batch overview.
8. After acceptance, continue with the optimization/integration workflow in `visual-seo-production.md`.
```

### Generation concurrency

Codex may orchestrate multiple independent jobs, but **each job must contain one and only one asset prompt**. Never concatenate multiple `ASSET_INSTRUCTION` rows into one image request.

---

## 6. Model identity QA checklist

An image fails model-consistency QA if any of the following changes without an explicit reason:

- apparent person identity;
- age band;
- skin tone;
- hair color/style family;
- eye color;
- face-shape geometry;
- facial hair for male models;
- baseline neutral expression;
- baseline clothing family;
- camera perspective / focal-length feel.

For A/B assets, differences in face, hair, expression, crop, pose, lighting or clothing are a **hard reject** because the comparison must isolate the eyewear variable.

---

## 7. Progress

Production status at clean restart:

> **0 / 182 accepted and integrated**

The first production item is `VSEO-001__ai-face-shape-detector-example.png`.
