# Canonical Local Prepared Demo Results — Provenance

**Status:** Approved for canonical Local Demo use
**Owner:** VisuTry Product Lead
**Last updated:** 2026-09-30

Status: approved Demo assets, supplied by the Product Lead on 2026-09-30.
These curated prepared visuals were created with OpenAI image generation from
the approved synthetic shopper and the corresponding approved Rowan/Lane frame
source images, then reviewed and approved by the Product Lead. The repository
copies are byte-for-byte identical to the supplied PNGs. This provenance does
not represent GrsAI/Gemini output or a live Try-On generated for a current
shopper session; this integration creates no generation records.

Both outputs are for the canonical VisuTry Demo Shopper v1 and are demo-only,
not for sale. The approved shopper input is
[`visutry-demo-shopper-v1.png`](../visutry-demo-shopper-v1.png), SHA-256
`2a1277cbaef4bee43ebc5566311da50fd48ebcbd73f8abe028bc2622c072c9a0`.

| Asset | Frame | Source file | Local path | Dimensions / size | SHA-256 | Review |
| --- | --- | --- | --- | --- | --- | --- |
| VT Rowan prepared result | `VT-DEMO-001` / round | `~/Downloads/visutry-demo-rowan-prepared-result.png` | `rowan-prepared-result.png` | 1122×1402 RGB PNG / 2,124,670 bytes | `504fced34e90922ffe162c4abe746178777b4241afc5f262d28e93dba703b28c` | APPROVED |
| VT Lane prepared result | `VT-DEMO-002` / rectangle | `~/Downloads/visutry-demo-lane-prepared-result.png` | `lane-prepared-result.png` | 1122×1402 RGB PNG / 2,281,102 bytes | `1c6f03785756d230fb1806572e03e9acf9eda32f150acb84ee783ee8bfac7b71` | APPROVED |

The copied local paths are under `docs/assets/local-demo/prepared-results/approved/`.
The Rowan source frame is `/assets/glasses-presets/round-classic.jpg`
(SHA-256 `1845ec759e62f7a3ecd947d9622b4e9a0c6f73e99abd9e3eacc285856a49094c`);
the Lane source frame is `/assets/glasses-presets/rectangle-classic.jpg`
(SHA-256 `3ad4eb05ca2a6b00149bf8a63d71de472b0674fc4bcfa4cb9592d111286c97ad`).

The shared manifest marks these as `APPROVED_DEMO_OUTPUT` with curated,
Lead-approved provenance and keeps the older
`LOCAL_QA_FIXTURE` SVGs separately identified. Guarded Local Demo resolves the
approved PNGs by frame SKU. Production remains fail-closed: both descriptors
use deterministic private Blob keys in Production and the application reads
them only with the dedicated private-store credential, then verifies the exact
manifest SHA-256. The older QA SVGs remain Local-only and never resolve in
Production.
