# Hybrid vs Direct Vercel performance — 2026-08-19

Low-volume first-pass sample after the Glasses Guide detail-dispatch fix.

- Warm-up 2 / measured 8 / concurrency 1 / 3 runs / alternating Hybrid then Direct Vercel
- Routes: `/`, `/en`, `/en/glasses-guide`, `/en/glasses-guide/best-rectangle-glasses-for-round-face`
- Direct Vercel challenge: **NO**
- Worker routes: unchanged

```text
VISUTRY HYBRID PERFORMANCE RESULT

Fallback routes:
Run consistency: outlier in one run; median neutral
Median directional result: +0.6% TTFB (Hybrid − Direct Vercel)
Result: EFFECTIVELY NEUTRAL

Cloudflare-owned Glasses Guide:
Run consistency: same direction
Median directional result: +41.2% TTFB (Hybrid − Direct Vercel)
Result: HYBRID SLOWER

Direct Vercel challenge contamination:
NO

OVERALL:
HYBRID SLOWER
for this small local sample.
```

Raw / aggregate: `2026-08-19T05-40-57-463Z-*.json`. Route parity: `2026-08-19-glasses-guide-route-parity.md` (**PASS**, 45/45).
