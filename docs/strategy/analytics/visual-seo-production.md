# VisuTry Visual SEO Production v1.4

**Status:** Active execution specification  
**Last updated:** 2026-08-10
**Owner:** Growth / Product / Engineering  
**Parent strategy:** `docs/strategy/analytics/gtm.md` → Engine 2 — Visual Discovery  
**Scope:** Google Images, Search→Tool page visuals, image SEO, Pinterest-ready source assets, and Codex-assisted production/integration.

> This document is the single source of truth for the current Visual SEO image-production program. Do not create a parallel image plan in another document. If the asset list, naming rules, templates, batching rules, or completion state changes, update this file.

---

## 1. Why this exists

VisuTry is a visual eyewear decision product, not a text-only content site. The public consumer path is:

> **Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare**

The Visual SEO program turns this workflow into original, indexable visual assets that can acquire users from Google Images and reinforce Search→Tool pages.

The program is intentionally **not** a generic AI-image content project. Every image must answer a concrete eyewear decision question and connect to an existing or approved acquisition page.

Primary distribution surfaces:

1. Google Images;
2. Search→Tool landing pages;
3. Pinterest derived assets;
4. selected Reddit / YouTube / editorial reuse where relevant.

---

## 2. Production target and current progress

### Total target

**182 master production images**

### Current accepted progress

**24 / 182 accepted images**

This program was restarted from zero for Desktop Codex execution. Batches B01, B02, and B03 are now accepted production units, completing the first 24 core commercial / product-intent masters.

- No previously generated conversational image is considered accepted production output.
- Previous ChatGPT-generated images may be used only as visual references if useful.
- Contact sheets, batch overviews, accidental grids, wrong-topic generations, cancelled generations, and earlier experimental outputs do **not** count.
- The first canonical production units are Batch B01 (`VSEO-001`–`VSEO-008`), Batch B02 (`VSEO-009`–`VSEO-016`), and Batch B03 (`VSEO-017`–`VSEO-024`).
- Progress advances only after Codex has completed QA, optimization, page integration, build verification, and manifest update.

### Planned composition

| Asset family | Planned count |
| --- | ---: |
| Core commercial / product-intent pages | 24 |
| Face Style owner pages | 18 |
| Face Shape explainer pages | 12 |
| Face × Frame combination pages | 64 |
| Gender / styling intent pages | 32 |
| Decision-question pages | 24 |
| Hub / navigation pages | 8 |
| **Total** | **182** |

The count is a production target, not an excuse to publish low-value images. If an asset fails QA, it is rejected and does not advance the counter.

---

## 3. Two-name system: source handoff vs public SEO filename

To prevent human/Codex handoff errors while keeping public filenames SEO-friendly, use two names.

### 3.1 Source handoff filename

Save each generated source image locally as:

```text
VSEO-###__semantic-name.png
```

Example:

```text
VSEO-001__ai-face-shape-detector-example.png
```

Rules:

- `VSEO-###` is the immutable production ID;
- use three digits (`001`, `021`, `182`);
- use a double underscore between the ID and semantic name;
- keep the source file as PNG unless the generator provides a lossless equivalent;
- never reuse an ID for a different concept.

### 3.2 Public SEO filename

Codex converts/exports the accepted asset to WebP and removes the production ID:

```text
ai-face-shape-detector-example.webp
```

Public filenames must be:

- lowercase;
- English;
- hyphen-separated;
- semantically descriptive;
- stable after publication;
- free of generic names such as `image1`, `final`, `new`, `img`, or timestamps.

---

## 4. Local and public directories

### Local production inbox

```text
.local-assets/visual-seo/inbox/
```

This is the local handoff/workbench and should be gitignored if not already ignored.

Example:

```text
.local-assets/visual-seo/inbox/VSEO-001__ai-face-shape-detector-example.png
```

### Public optimized assets

Accepted optimized files should be stored under:

```text
public/images/seo/
```

Recommended subfolders:

```text
public/images/seo/core/
public/images/seo/face-shapes/
public/images/seo/style/
public/images/seo/guides/
public/images/seo/decisions/
public/images/seo/hubs/
```

Codex may refine subfolders if the repository has a stronger convention, but must keep one canonical location and update this document if the convention changes.

---

## 5. Standard output specification

### Master source

- preferred composition: **4:3**;
- target master resolution: **1600×1200 or higher**;
- minimum acceptable page asset: **1200×800 / 1200×900 depending on template**;
- source: PNG;
- deployed format: WebP;
- optional AVIF only if the existing image pipeline supports it cleanly;
- explicit `width` and `height` in page markup;
- no unnecessary transparency.

### Pinterest derivative

Pinterest vertical derivatives are **not included in the 182 master-image count**.

When needed, derive from the approved master:

```text
1000×1500
```

The first production objective is the 182 master assets. Pinterest derivatives are a second-stage distribution layer and must not distract from completing the master library.

---

## 6. Visual language

All production images should feel like one VisuTry visual knowledge system.

### Required style

- white / pearl-white background;
- restrained blue accent;
- clean editorial / product-infographic composition;
- realistic portrait photography;
- front-facing or near-front-facing faces when fit/proportion is being explained;
- realistic glasses scale and placement;
- generous whitespace;
- minimal text inside the generated image;
- high information density without looking like an ad banner.

### Standalone visual-answer rule

Every master must work as a **standalone visual answer**, not as a webpage screenshot, landing-page mockup, PPT slide, or long-form infographic page.

Default constraints:

- one visual question / concept per image;
- one dominant subject or one intentional same-person comparison;
- one short title, normally no more than 8–10 words;
- normally no more than 2–4 short labels/cues;
- no body paragraphs inside the image;
- no navigation bars, breadcrumbs, footers, privacy panels, pricing blocks, or marketing feature stacks;
- no generated CTA button unless the specific template genuinely requires a minimal workflow cue;
- main visual should carry the meaning at thumbnail size.

A useful test is: **if the image is reduced to a Google Images thumbnail, can a user still understand what question it answers within roughly three seconds?** If not, simplify it before acceptance.

### Avoid

- heavy gradients;
- excessive fashion-editorial effects;
- neon / cyberpunk AI aesthetics;
- overly pink or playful cosmetic styling;
- unrealistic frame dimensions;
- generated fake UI that contradicts the real VisuTry product;
- generated VisuTry logos;
- webpage-like multi-section compositions;
- dense explanatory text that belongs in surrounding HTML.

**Important:** Do not ask the image model to render the VisuTry logo. If branding is needed, Codex/design code may overlay the real project logo after generation.

---

## 7. Six canonical visual templates

### Template A — Hero Recommendation

**Purpose:** Answer “what works for this face / intent?” immediately.

**Typical pages:** style owners, Face × Frame, gender/styling, commercial recommendation pages.

**Composition:**

- one primary realistic portrait;
- 1–3 frame directions or visual variants;
- one short title;
- up to three short supporting cues.

**Default size:** `1200×800`.

---

### Template B — A/B Compare

**Purpose:** Support an actual decision between frame directions.

**Composition:**

- same person, same crop, same lighting;
- two to four frame candidates;
- symmetric layout;
- neutral comparison language.

**Default size:** `1200×800`.

Prefer `Strong option`, `Adds structure`, `Softer look`, `More lift`; avoid unsupported universal claims such as `perfect` or arbitrary numerical scores.

---

### Template C — Watch For / Fit Check

**Purpose:** Explain frame width, brow alignment, lens depth, bridge, height, proportion, or common fit issues.

**Composition:**

- one main face or 2–3 aligned examples;
- restrained arrows / measurement lines;
- `Too narrow / Balanced / Too wide` or equivalent where useful;
- minimal explanatory text.

**Default size:** `1200×900`.

---

### Template D — Face Shape Diagram

**Purpose:** Help users understand visual face-shape characteristics.

**Composition:**

- front-facing portrait or simplified face illustration;
- forehead / cheekbone / jawline / length guides;
- one face shape per image unless explicitly a comparison guide.

**Default size:** `1200×900`.

Face-shape output is guidance, not a medical or biometric identity claim.

---

### Template E — Workflow / Product CTA

**Purpose:** Explain the decision flow without inventing fake product interfaces.

Canonical flow:

> Upload / Detect → Advisor → Try-On → Compare

Use real product screenshots only when supplied/available; otherwise use abstract UI-safe cards/icons. Keep the workflow visually minimal; do not turn it into a full landing page.

**Default size:** `1200×800`.

---

### Template F — Decision Answer Card

**Purpose:** Answer concrete search questions such as:

- Do round glasses suit a round face?
- Should glasses cover your eyebrows?
- How wide should glasses be?

**Composition:** question → direct answer → visual evidence → one watch-for.

**Default size:** `1200×900`.

---

## 8. Generation protocol — mandatory

### Rule 1 — One generation = one production asset

Never request:

- a batch overview;
- a contact sheet;
- a 2×5 grid;
- ten thumbnails;
- a production dashboard;
- a progress board.

A generation prompt must describe **only one final image**.

### Rule 2 — Batch size is operational, not visual

The 182 masters are organized into 19 operational batches. A batch is a planning and consistency unit only. Each image must still be generated as an independent image-generation job.

**Never generate a visual representation of a batch.** A batch is text metadata, not an image subject.

### Rule 3 — Reject without advancing

Reject an output if it:

- becomes a collage/contact sheet unless the comparison itself is the intended single asset;
- depicts the wrong face shape;
- uses the wrong frame family;
- contains broken or misleading text;
- creates inconsistent/fictional VisuTry branding;
- makes the glasses obviously unrealistic;
- fails the intended search question;
- looks primarily like a webpage, presentation slide, dashboard, or long-form infographic rather than a standalone visual answer.

Rejected assets do not advance the production counter.

### Rule 4 — Keep image text short

Prefer HTML page text around the image over long model-rendered paragraphs.

Inside-image copy should normally be limited to:

- title;
- 2–4 labels;
- one short comparison cue.

### Rule 5 — Never fabricate product UI

If an image requires an exact VisuTry screen, use a real screenshot or create the composition in code/design tooling. Image generation should not invent authoritative-looking product screens.

### Rule 6 — Manifest is the requirement source; the generation brief is compiled

`visual-seo-prompt-manifest.md` is the authoritative registry for ID, filename, page owner, canonical model, template, and asset-specific intent. Before generation, compile that row into a simplified visual brief that preserves the manifest facts but removes wording likely to induce webpage-like overproduction.

The compiled brief must explicitly state:

- this is one standalone final asset;
- the single visual question;
- canonical model / face shape / frame family;
- template;
- allowed title and labels;
- 4:3 composition;
- prohibition on webpage UI, navigation, footer, body paragraphs, batch overview, contact sheet, and unrelated modules.

---

## 9. 19-batch master production plan

### Purpose

The 182 master assets are grouped into 19 batches so visually similar work is executed together and reviewed before moving to the next family. The batches reduce prompt drift, identity drift, template drift, and information-density drift.

Batch membership is **operational grouping only**. Canonical asset identity remains the `VSEO-###` row in `visual-seo-prompt-manifest.md`.

### Batch execution rule

For each batch:

1. read this batch brief and the relevant manifest rows;
2. generate exactly one VSEO image at a time;
3. QA each image independently;
4. reject and regenerate failures without advancing;
5. after the batch is visually complete, perform a batch-level consistency review;
6. do not generate a batch overview, contact sheet, montage, dashboard, or summary image.

### Batch plan

| Batch | VSEO range | Count | Primary task family | Main templates / consistency focus |
| --- | --- | ---: | --- | --- |
| B01 | VSEO-001–008 | 8 | Core commercial foundations A | D / A / B; detector, face-shape fundamentals, first recommendation assets; establish the visual baseline |
| B02 | VSEO-009–016 | 8 | Core commercial foundations B | A / B / E; Search→Tool workflow, find-glasses, virtual try-on foundations; primarily F-OVAL-01 |
| B03 | VSEO-017–024 | 8 | Core commercial foundations C | B / D / E; Try-On comparison, Compare, Advisor; lock same-person comparison behavior |
| B04 | VSEO-025–033 | 9 | Face Style owner pages A | A / B / C; round / oval / square owner-page visual system |
| B05 | VSEO-034–042 | 9 | Face Style owner pages B | A / B / C; heart / diamond / oblong owner-page visual system |
| B06 | VSEO-043–054 | 12 | Face Shape explainers | D / F; educational face-shape definitions, identification, and comparisons; low text density |
| B07 | VSEO-055–064 | 10 | Face × Frame pairings A | A; round + oval pairings; consistent hero composition |
| B08 | VSEO-065–074 | 10 | Face × Frame pairings B | A; square + heart pairings; consistent hero composition |
| B09 | VSEO-075–084 | 10 | Face × Frame pairings C | A; diamond + oblong pairings; consistent hero composition |
| B10 | VSEO-085–094 | 10 | Face × Frame pairings D | A / B; round + oval second pairing set; recommendation + comparison consistency |
| B11 | VSEO-095–106 | 12 | Face × Frame pairings E | A / B; square + heart second pairing set; recommendation + comparison consistency |
| B12 | VSEO-107–118 | 12 | Face × Frame pairings F | A / B; diamond + oblong second pairing set; recommendation + comparison consistency |
| B13 | VSEO-119–128 | 10 | Gender / styling A | A / B; women-oriented styling intents; female canonical models |
| B14 | VSEO-129–138 | 10 | Gender / styling B | A / B; men-oriented styling intents; male canonical models |
| B15 | VSEO-139–150 | 12 | Gender / styling C | A / B / F; broader styling / situational intents; restrained visual cues |
| B16 | VSEO-151–158 | 8 | Decision questions A | C / F; fit, width, eyebrow alignment, proportions; measurement clarity |
| B17 | VSEO-159–166 | 8 | Decision questions B | B / F; suitability and frame-shape choice questions; direct visual answers |
| B18 | VSEO-167–174 | 8 | Decision questions C | B / E / F; compare, try-on, buying-confidence questions; decision support |
| B19 | VSEO-175–182 | 8 | Hub / navigation assets | E / A / D; minimal overview / map / workflow assets; no page-like dashboards |
| **Total** | **VSEO-001–182** | **182** |  |  |

### Batch brief format

Before starting a batch, resolve the following as text only:

```text
Batch ID:
VSEO range:
Count:
Theme:
Primary templates:
Canonical models:
Allowed text level:
Hard prohibitions:
Acceptance focus:
```

### Batch-level acceptance focus

At the end of each batch, review the group for:

- consistent background / blue accent / whitespace;
- consistent portrait treatment and canonical identity where applicable;
- consistent title scale and label density;
- consistent frame rendering and comparison geometry;
- no drift toward webpage screenshots or PPT-style information boards;
- each image remains understandable as an independent Google Images thumbnail;
- the batch looks like part of one VisuTry visual knowledge system.

Do not advance to the next batch if the current batch reveals a systemic style or prompt problem. Fix the batch rule first, then continue.

---

## 10. Desktop Codex production workflow

### Step A — Determine current batch and next asset

Read the batch plan above and the manifest. Find the current batch, then find the lowest `VSEO-###` in that batch not marked accepted.

Current starting point:

```text
Batch B04 → VSEO-025
```

### Step B — Generate one image

Each generation brief must include:

- production ID;
- semantic filename;
- target website URL;
- template A–F;
- single visual purpose;
- required face shape / frame family;
- canonical model reference where applicable;
- 4:3 composition;
- visual-language constraints;
- explicit prohibition on webpage layouts, grids/contact sheets/batch overviews, and body-text-heavy infographic compositions.

### Step C — Save source

```text
.local-assets/visual-seo/inbox/VSEO-###__semantic-name.png
```

Accepted source masters are committed separately from the public web assets under the matching batch directory:

```text
assets/visual-seo/B##/source/
```

### Step D — Codex QA

Codex checks:

1. source file exists;
2. ID matches the manifest;
3. image dimensions are usable;
4. image topic matches page intent;
5. no duplicate destination filename exists;
6. public page exists or is explicitly approved in the GTM plan;
7. visual/factual quality is acceptable;
8. image is a standalone visual answer, not a webpage / PPT / dashboard composition;
9. information density remains readable at thumbnail scale.

### Step E — Optimize

Convert to WebP, strip the production ID, and write to `public/images/seo/...`.

### Step F — Integrate

Update the relevant page/config with:

- image `src`;
- descriptive `alt`;
- optional caption;
- explicit dimensions;
- surrounding explanatory copy;
- appropriate internal product CTA.

### Step G — SEO integration

Verify:

- page is indexable;
- canonical is correct;
- image is crawlable;
- image URL is included in image sitemap if used;
- image is discoverable in rendered markup;
- no duplicate image is assigned as the primary visual to unrelated pages.

### Step H — Build and record

Run project checks/build, then update the progress ledger in this document.

### Step I — Batch review

When the last image in a batch passes image-level QA, perform the batch-level consistency review before starting the next batch.

---

## 11. Accepted canonical queue — VSEO-001 to VSEO-024

The first 24 core commercial / product-intent assets are accepted and are listed here as the current canonical published mapping. For `VSEO-025` onward, use `visual-seo-prompt-manifest.md` as the authoritative per-asset generation registry rather than duplicating the pending queue in this workflow document.

These mappings supersede earlier conversational or draft mappings.

| ID | Source semantic name | Public filename | Primary page owner / intent | Template |
| --- | --- | --- | --- | --- |
| VSEO-001 | `ai-face-shape-detector-example` | `ai-face-shape-detector-example.webp` | `/en/face-shape-detector` — what the AI measures | D/E |
| VSEO-002 | `common-face-shapes-guide` | `common-face-shapes-guide.webp` | `/en/face-shape-detector` — common face shapes | D |
| VSEO-003 | `face-shape-photo-analysis-result` | `face-shape-photo-analysis-result.webp` | `/en/face-shape-detector` — example result | D/E |
| VSEO-004 | `how-to-identify-your-face-shape` | `how-to-identify-your-face-shape.webp` | `/en/what-is-my-face-shape` — identification method | D |
| VSEO-005 | `face-shape-comparison-guide` | `face-shape-comparison-guide.webp` | `/en/what-is-my-face-shape` — six-shape comparison | D |
| VSEO-006 | `what-is-my-face-shape-result` | `what-is-my-face-shape-result.webp` | `/en/what-is-my-face-shape` — result to detector CTA | D/E |
| VSEO-007 | `what-glasses-suit-my-face-guide` | `what-glasses-suit-my-face-guide.webp` | `/en/what-glasses-suit-my-face` — recommendation logic | A/E |
| VSEO-008 | `compare-glasses-for-your-face` | `compare-glasses-for-your-face.webp` | `/en/what-glasses-suit-my-face` — compare entry | B |
| VSEO-009 | `find-glasses-for-your-face-workflow` | `find-glasses-for-your-face-workflow.webp` | `/en/what-glasses-suit-my-face` — the search workflow | A/E |
| VSEO-010 | `find-glasses-for-my-face` | `find-glasses-for-my-face.webp` | `/en/find-glasses-for-my-face` — frame directions | A |
| VSEO-011 | `glasses-frame-shapes-comparison` | `glasses-frame-shapes-comparison.webp` | `/en/find-glasses-for-my-face` — shape comparison | B |
| VSEO-012 | `try-glasses-before-choosing` | `try-glasses-before-choosing.webp` | `/en/find-glasses-for-my-face` — shortlist to proof | E |
| VSEO-013 | `virtual-glasses-try-on-before-after` | `virtual-glasses-try-on-before-after.webp` | `/en/virtual-glasses-try-on` — before / after proof | A/E |
| VSEO-014 | `virtual-try-on-different-glasses` | `virtual-try-on-different-glasses.webp` | `/en/virtual-glasses-try-on` — style comparison | B |
| VSEO-015 | `how-virtual-glasses-try-on-works` | `how-virtual-glasses-try-on-works.webp` | `/en/virtual-glasses-try-on` — workflow explanation | E |
| VSEO-016 | `try-glasses-on-your-photo` | `try-glasses-on-your-photo.webp` | `/en/try-glasses-on-photo` — photo to result | A |
| VSEO-017 | `photo-four-glasses-frames` | `photo-four-glasses-frames.webp` | `/en/try-glasses-on-photo` — four-frame same-photo comparison | B |
| VSEO-018 | `glasses-photo-try-on-comparison` | `glasses-photo-try-on-comparison.webp` | `/en/try-glasses-on-photo` — lift vs structure A/B | B |
| VSEO-019 | `compare-four-glasses-frames` | `compare-four-glasses-frames.webp` | `/en/compare-glasses-frames` — four common frame styles | B |
| VSEO-020 | `glasses-frame-a-vs-b` | `glasses-frame-a-vs-b.webp` | `/en/compare-glasses-frames` — shortlisted A/B comparison | B |
| VSEO-021 | `best-glasses-frame-comparison-result` | `best-glasses-frame-comparison-result.webp` | `/en/compare-glasses-frames` — narrow shortlist to a strong match | B |
| VSEO-022 | `ai-glasses-advisor-analysis` | `ai-glasses-advisor-analysis.webp` | `/en/ai-glasses-advisor` — visible proportion analysis | D |
| VSEO-023 | `ai-glasses-recommendations` | `ai-glasses-recommendations.webp` | `/en/ai-glasses-advisor` — recommendation directions | A |
| VSEO-024 | `ai-glasses-advisor-try-on` | `ai-glasses-advisor-try-on.webp` | `/en/ai-glasses-advisor` — advisor to try-on / compare workflow | E |

Earlier conversational labels such as `B01-11` are superseded by `VSEO-###`.

---

## 12. Deterministic naming for remaining page families

### 12.1 Face Style owner pages

Code owner pattern:

```text
src/app/[locale]/(main)/style/[faceShape]/page.tsx
```

For each of `round`, `oval`, `square`, `heart`, `diamond`, `oblong`:

```text
best-glasses-for-{face}-face.webp
{face}-face-frame-comparison.webp
{face}-face-glasses-proportions.webp
```

### 12.2 Face Shape explainer pages

Owner pattern:

```text
/en/face-shapes/{face}
```

For each face:

```text
{face}-face-shape-characteristics.webp
how-to-identify-{face}-face.webp
```

### 12.3 Face × Frame combination pages

Public page pattern:

```text
/en/glasses-guide/{slug}
```

Codex must read the current route/config before integration and must not invent an unapproved slug.

For each approved Face × Frame slug:

```text
{slug}-01-hero.webp
{slug}-02-why-it-works.webp
{slug}-03-watch-for.webp
{slug}-04-compare.webp
```

Template mapping:

- `01-hero` → A;
- `02-why-it-works` → A or D-like explanatory composition;
- `03-watch-for` → C;
- `04-compare` → B.

### 12.4 Gender / styling intent pages

For each approved gender/styling slug:

```text
{slug}-01-overview.webp
{slug}-02-everyday.webp
{slug}-03-expressive.webp
{slug}-04-compare.webp
```

Template mapping: A / A / A / B.

### 12.5 Decision-question pages

For each approved decision question:

```text
{slug}-01-answer.webp
{slug}-02-correct-example.webp
{slug}-03-watch-for.webp
{slug}-04-compare.webp
```

Canonical decision topics:

1. Do round glasses suit a round face?
2. Do aviators suit an oval face?
3. Are cat-eye glasses good for round faces?
4. Should glasses cover your eyebrows?
5. How wide should glasses be for my face?
6. How should glasses fit your face?

Template mapping: F / A-or-F / C / B.

### 12.6 Hub pages

Owners:

```text
/en/glasses-for-face-shape
/en/glasses-guide
```

Planned hub assets:

```text
glasses-by-face-shape-overview.webp
face-shape-to-frame-map.webp
recommended-glasses-by-face-shape.webp
face-shape-glasses-decision-flow.webp

glasses-guide-overview.webp
face-frame-guide-map.webp
eyewear-decision-questions-guide.webp
visutry-eyewear-decision-workflow.webp
```

---

## 13. Page integration requirements

Every accepted image needs:

- descriptive `alt`;
- optional caption;
- ordinary HTML surrounding text explaining the visual;
- an appropriate continuation into Detector / Advisor / Try-On / Compare where relevant.

Good alt example:

```text
Rectangle, browline, round and cat-eye glasses compared on the same round face
```

Avoid keyword stuffing.

---

## 14. Image SEO engineering checklist

Codex should verify or implement:

- descriptive public filename;
- WebP optimization;
- explicit dimensions;
- responsive rendering;
- descriptive alt text;
- crawlable image URL;
- image sitemap support where the current implementation supports/uses it;
- meaningful surrounding text;
- correct canonical page;
- no accidental `noindex`;
- no lazy-loading implementation that makes critical visual undiscoverable in rendered markup;
- internal links into the owner page;
- no conflicting duplicate owner page for the same search intent.

Image performance must not materially regress acquisition-page Core Web Vitals.

---

## 15. QA rubric

An image is **Accepted** only when all required checks pass.

### Visual correctness

- intended face shape is visually plausible;
- intended frame family is recognizable;
- glasses are aligned realistically;
- comparison uses a sufficiently consistent person/crop;
- proportions are not obviously distorted;
- the image remains understandable at search-thumbnail scale.

### Information correctness

- labels match the image;
- claims are guidance, not universal truth;
- no unsupported medical/biometric claims;
- no accidental brand/product claims;
- no fake pricing or feature UI.

### Brand/system correctness

- no fake VisuTry logo;
- visual style fits the white + restrained blue system;
- no batch labels or production metadata appear in the public visual;
- no contact sheet/grid unless the asset itself intentionally compares options;
- no webpage-like navigation, footer, marketing panels, or dense body text.

### Technical correctness

- source and public filename match manifest;
- dimensions are sufficient;
- output is optimized;
- page integration builds successfully;
- alt/caption are present where required.

---

## 16. Codex execution algorithm

```text
1. Read visual-seo-production.md.
2. Read visual-seo-prompt-manifest.md for canonical per-asset requirements.
3. Resolve the current batch from the 19-batch plan.
4. Start at the lowest incomplete VSEO ID in that batch.
5. Compile the manifest row into a simplified standalone-visual generation brief.
6. Generate exactly one independent image for that ID.
7. Save source to .local-assets/visual-seo/inbox/ using the canonical handoff filename.
8. Inspect visual/factual correctness, standalone composition, thumbnail readability, identity consistency, and dimensions.
9. Reject and regenerate without advancing if any required check fails.
10. Convert/export optimized WebP to public/images/seo/... .
11. Integrate into the mapped owner page/config.
12. Add alt/caption and preserve Search→Tool CTA.
13. Update image sitemap/infrastructure if required.
14. Run tests/build.
15. Mark the item accepted only after successful QA/build.
16. Update the progress ledger.
17. After the final item in a batch, perform batch-level consistency QA before advancing.
```

If Codex detects a discrepancy between this document and the current route registry, preserve the current canonical route and update this document rather than silently creating duplicate pages.

---

## 17. Progress ledger

| Batch | Range | Status | Notes |
| --- | --- | --- | --- |
| B01 | VSEO-001–008 | ✅ Accepted | Eight canonical master assets integrated into three English Search→Tool pages; WebP, source archive, image sitemap, and QA manifest complete |
| B02 | VSEO-009–016 | ✅ Accepted | Eight visual explanation assets integrated into four English Search→Tool pages; editorial layout, WebP, source archive, image sitemap, and QA manifest complete |
| B03 | VSEO-017–024 | ✅ Accepted | Eight comparison / advisor assets integrated into three English Search→Tool pages; one-primary hierarchy, compact supporting layout, source archive, WebP, image sitemap, and build verification complete |
| B04 | VSEO-025–033 | ✅ Accepted | Nine Face Style owner assets integrated into round, oval, and square English owner pages; staged editorial layout, WebP, source archive, image sitemap, and build verification complete |
| B05 | VSEO-034–042 | ⚠️ Integrated | Nine Face Style owner assets integrated into heart, diamond, and oblong English owner pages; shared Face Owner module, staged editorial layout, WebP, source archive, image sitemap, responsive browser checks, targeted tests, and `build:ci` verification complete. `/admin/data-stats` is now explicitly dynamic; the standard build remains blocked before Next by the Neon migration deploy connection error. |
| B06 | VSEO-043–054 | ⏳ Planned | Face Shape explainers |
| B07 | VSEO-055–064 | ⏳ Planned | Face × Frame A |
| B08 | VSEO-065–074 | ⏳ Planned | Face × Frame B |
| B09 | VSEO-075–084 | ⏳ Planned | Face × Frame C |
| B10 | VSEO-085–094 | ⏳ Planned | Face × Frame D |
| B11 | VSEO-095–106 | ⏳ Planned | Face × Frame E |
| B12 | VSEO-107–118 | ⏳ Planned | Face × Frame F |
| B13 | VSEO-119–128 | ⏳ Planned | Gender / styling A |
| B14 | VSEO-129–138 | ⏳ Planned | Gender / styling B |
| B15 | VSEO-139–150 | ⏳ Planned | Gender / styling C |
| B16 | VSEO-151–158 | ⏳ Planned | Decision questions A |
| B17 | VSEO-159–166 | ⏳ Planned | Decision questions B |
| B18 | VSEO-167–174 | ⏳ Planned | Decision questions C |
| B19 | VSEO-175–182 | ⏳ Planned | Hub / navigation assets |

### Current next action

> Batches B01, B02, B03, and B04 are complete. B05 is fully integrated and has passed targeted tests, `build:ci`, and responsive browser checks; final acceptance is pending the standard build's Neon migration deploy connectivity. Once the database build prerequisite is healthy, the next production unit is B06, beginning with `VSEO-043`; preserve the established source archive, WebP, adjacent-copy, internal-link, page-level one-primary hierarchy, compact mobile supporting layout, and image-sitemap checks. Do not generate any batch overview image.

---

## 18. Relation to the 10× GTM plan

Visual production is valuable only if it contributes to qualified discovery and product continuation.

Primary outcome metrics:

- Google Images impressions/clicks;
- landing-page qualified sessions;
- Visual-origin continuation into Detector / Advisor / Try-On / Compare;
- revenue / 1,000 qualified sessions where attribution is available.

The program should not be reported as successful merely because 182 images were generated. The business goal remains qualified traffic and paid-intent validation.
