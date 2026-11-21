# EN Detector result example — captured 2026-11-21

This replaces the VSEO-003 illustration on the existing English Detector with a real browser run. It is static editorial evidence, not a second runtime detector or a paid report.

## Input and actual execution

- Input: existing VisuTry-owned synthetic demo shopper, explicitly approved for external publication in [asset provenance](../../assets/local-demo/ASSET_PROVENANCE.md). No customer photo was used.
- Main source: `8ef9d93d1b3f62bb4b34d53b7b252167c318df99`; actual `compressImage` → `analyzeFaceLandmarkFile` pipeline, followed by uploading the same original into the real Next.js Detector UI.
- Original 1536 × 1024 PNG compressed by the existing user-photo profile to 1280 × 853 JPEG (127,272 bytes), maximum dimension 1280, quality 0.88.
- MediaPipe Tasks Vision 0.10.35, GPU delegate under Chromium 151.0.7922.34 / SwiftShader. Source, model, input and processed-file SHA-256 values are in the [capture manifest](2026-11-21-detector-result-example.json).
- The local browser could not start in the initial executor. An isolated, short-lived Vercel Sandbox ran the real browser instead. Browser network was restricted to local GET/HEAD assets; provider calls and production database access were zero.

## Observed result

| Measurement | Raw value | Interpretation |
| --- | ---: | --- |
| Estimated shape | oval | Oval |
| Face length / outer face width | 1.233 | Face length ÷ face width: 1.23 |
| Upper-face landmark span / cheekbone span | 0.774 | Forehead ÷ cheekbone width: 0.77 |
| Jaw landmark span / cheekbone span | 0.853 | Jaw ÷ cheekbone width: 0.85 |

The actual UI agrees: Oval, Balanced face length, Wide cheek span, Moderate jawline and Defined cheekbone span. Its 87 photo-quality and 0.76 geometry-match scores are heuristic scores, not validated accuracy. One synthetic portrait is not an accuracy study; values can vary with the photo, encoding or runtime.

The marketing example was shortened after visual review on November 21. It retains the actual screenshot, one plain-language result sentence, brief source/quality disclosure, the free/paid boundary and the existing interpretation link. The standalone ratio table and detailed methodology are no longer rendered in this example; the recorded measurements remain here and in the capture manifest.

## Asset and reproducibility

The [original screenshot](../../../assets/visual-seo/B01/source/VSEO-003__detector-browser-result-20261121.png) captures the actual photo/mesh and result cards together, after scrolling them below the sticky navigation. No overlay was hidden and no result was redrawn. The public WebP is 49,034 bytes, down from 66,982 bytes for the replaced illustration; it uses a new URL to avoid stale immutable caches. It is lazy-loaded and remains one of the existing three Detector assets. The registry automatically supplies its image-sitemap URL.

To reproduce, check out the recorded source, install its pinned dependencies and MediaPipe assets, and start a local Next.js instance with only local/test configuration. Upload `docs/assets/local-demo/visutry-demo-shopper-v1.png` after the actual file-input handler has hydrated. Compare the rendered shape, proportion labels and mesh with the capture. Raw ratios come from the unchanged `analyzeFaceLandmarkFile` return value after the exact same `compressImage(file, 1280, 0.88, { profile: 'user-photo' })` call. Do not substitute a drawn image or pre-filled result for that run.

The added server component has no hooks, fetches, inference or API calls. The existing result CTA, its internal interpretation link, metadata and paid Top Picks boundary are retained. Post-release traffic targets are hypotheses recorded in the canonical growth work queue, not validated results from this example.
