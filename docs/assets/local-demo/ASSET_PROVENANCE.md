# VisuTry Local Demo Asset Provenance

Ingested: 2026-09-28
Source bundle: `~/Downloads/visutry-demo-assets-v1/`
Approval basis: Product Lead-provided Phase 2B-2A asset ingestion brief, which identifies the five source files below as **VISUTRY-OWNED SYNTHETIC / DEMO ASSETS**.

The files were copied without image editing or normalization. SHA-256 values below identify the ingested bytes. Images are RGB PNGs with no alpha channel. Visual material labels are appearance-only and are not manufacturing specifications.

## VisuTry Demo Shopper v1

- Asset path: `docs/assets/local-demo/visutry-demo-shopper-v1.png`
- Source filename: `visutry-demo-shopper-v1.png`
- Type: synthetic demo shopper
- Ownership: VisuTry-owned, per approval brief
- Approved uses: White Paper, Merchant Demo, Kiosk Demo, Store shopper journey, Recommendation, Virtual Try-On, Compare, Decision Result
- Suitable for external publication: YES
- Suitable for AI provider processing: YES
- Source: 1536 × 1024 PNG, RGB, 2,116,057 bytes
- SHA-256: `2a1277cbaef4bee43ebc5566311da50fd48ebcbd73f8abe028bc2622c072c9a0`
- Notes: Front-facing, eyes visible, no eyewear or visible face occlusion; mild expression and soft, even lighting; clean light neutral background. No visible text, logo, or watermark. Visually suitable for face-landmark and Try-On input. No MediaPipe detector or AI provider was run during this ingestion pass.

## Demo eyewear assets

All four assets are approved for external publication and AI Try-On use, subject to technical suitability. No third-party brand affiliation is intended or visible. Material descriptions below identify visual appearance only. Try-On was not run in this phase.

| Product | Asset path | Type | Ownership | Visual mapping | Source dimensions / bytes | SHA-256 |
|---|---|---|---|---|---|---|
| VT Solis | `public/assets/glasses-presets/demo-v1/vt-solis.png` | Synthetic demo eyewear asset | VisuTry-owned, per approval brief | Soft-square; warm tortoise appearance; acetate appearance | 1536 × 1024 PNG / 1,231,942 bytes | `c8a3df2f583a7483adaf0cefb4ea861c81e65de1c37bf8f108e7d29afe2575f7` |
| VT Lumen | `public/assets/glasses-presets/demo-v1/vt-lumen.png` | Synthetic demo eyewear asset | VisuTry-owned, per approval brief | Oval; gold; thin metal appearance | 1254 × 1254 PNG / 769,013 bytes | `cb40c63949a032d8ee7da0d9925cc0809308c13686ddf5e24bb07174c80d1337` |
| VT Cove | `public/assets/glasses-presets/demo-v1/vt-cove.png` | Synthetic demo eyewear asset | VisuTry-owned, per approval brief | Rectangle; crystal / transparent; acetate appearance | 1254 × 1254 PNG / 903,553 bytes | `abdd23cfda972a95a9f3b852cb1407f2147d3ffe01b14d2ff4d80223c975ef5b` |
| VT Mira | `public/assets/glasses-presets/demo-v1/vt-mira.png` | Synthetic demo eyewear asset | VisuTry-owned, per approval brief | Geometric / soft-square; silver; thin metal appearance | 1254 × 1254 PNG / 783,407 bytes | `f12a77a588ed11b6cbe755f93e38591ad9dd35547a2d74e3e105349c977541a9` |

## Scope notes

- The four new frame files are approved for external publication: YES.
- Their intended AI Try-On use is YES, subject to technical suitability; no provider processing occurred in this phase.
- Material descriptions are visual appearance labels only, not verified manufacturing specifications.
- The original six demo items continue to use their existing canonical preset assets. Their existing VisuTry-owned / non-sale declaration is in `scripts/seed-store-visutry-demo.ts`.
- The 10-item manifest records VT Sable as black because that is the visible asset color. The older six-item canary seed has a tortoise color value for its Cat-Eye item; this ingestion-only phase does not edit that seed or any existing data. Phase 2B-2B should seed from the 10-item manifest or align the legacy value before using that seed.
- This record does not create catalog rows, set prices or availability, or assert physical-product specifications.
