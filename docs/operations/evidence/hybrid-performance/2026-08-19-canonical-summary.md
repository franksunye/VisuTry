# VisuTry hybrid performance — first-round result

**Date:** 2026-08-19  
**Protocol:** `docs/operations/hybrid-performance-benchmark.md`  
**Not an SLO.**

## Direct answer

The 30-sample protocol **cannot honestly declare Cloudflare + Vercel faster or slower than direct Vercel** from this client.

```text
VISUTRY HYBRID PERFORMANCE RESULT

Fallback routes:
Hybrid vs Direct Vercel
Median TTFB difference: not a stable class result
Result: MIXED / INCONCLUSIVE
  /  often slightly faster on Hybrid (about −10% p50 TTFB in two runs)
  /en sign flips across runs (+18% / −7% / +4%)

Cloudflare-owned Glasses Guide:
Hybrid vs Direct Vercel
Median TTFB improvement: n/a
Result: INCONCLUSIVE
  Hub /en/glasses-guide is Worker/OpenNext on www (200, x-visutry-router-backend: cloudflare)
  Direct Vercel 30-sample baseline was blocked (403 x-vercel-mitigated: challenge)
  Detail slug is not semantically equivalent (Hybrid 404 vs Vercel 200)

Sampled comparable routes (p50 TTFB, |delta|>=5%):
Hybrid wins and Vercel wins both appear, depending on route and run.

OVERALL:
INCONCLUSIVE for this small sample.
```

Do not average fallback penalty with Cloudflare-owned gain. Cloudflare-owned gain was not measured at protocol n=30.

## Baseline (Step 1)

`https://visutry.vercel.app` **is a clean direct-Vercel origin at low volume**:

- `server: Vercel`, no `cf-ray`, no redirect to `www.visutry.com`
- `/` → 307 `/en` (relative), then 200
- `/en`, `/en/face-analysis`, `/en/glasses-guide` → 200 HTML with `x-matched-path`

Same-version git alias also exists: `https://visutry-git-main-sunye.vercel.app` (also `server: Vercel`). Not used to change production routing.

At protocol volume (tens of sequential GETs from one client IP), both `*.vercel.app` hosts return **403** with `x-vercel-mitigated: challenge`. `https://www.visutry.com` continues to return 200. That is why later routes are incomparable, not because Hybrid “won.”

## Routes actually owned

| Path | www (hybrid) | Direct Vercel | Comparable at n=30? |
| --- | --- | --- | --- |
| `/` | CF proxy → Vercel (`cf-ray` + `x-vercel-id`, no router-backend) | Vercel 200 | Yes, until WAF |
| `/en` | CF proxy → Vercel | Vercel 200 | Yes, until late 403s |
| `/en/face-analysis` | CF proxy → Vercel | Vercel 200 at probe; 403 at volume | No at n=30 |
| `/en/glasses-guide` | **Cloudflare Worker / OpenNext** (`x-visutry-router-backend: cloudflare`, `layer2-worker`) | Vercel 200 at probe; 403 at volume | No at n=30 |
| `/en/glasses-guide/rectangle-glasses` | 404 | 404 | Not a real slug |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | **404 OpenNext** | **200** at probe; 403 at volume | No — semantic mismatch |

The detail slug was taken from `src/config/search-combination-pages.ts` and the live hub. Every probed EN combination slug 404s on www/OpenNext (`dynamicParams = false` nested dynamic dispatch). Substituting another slug would not fix comparability.

## p50 table (successful 2xx samples only)

Primary stored run: `2026-08-19T03-41-50-292Z-*` (custom UA, IPv6 path to Vercel).

| Route | Owner | Hybrid p50 TTFB | Vercel p50 TTFB | Delta ms | Delta % | Hybrid p95 | Vercel p95 | Winner |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | vercel-fallback | 1556 | 1741 | -185 | -10.6% | 2501.5 | 3108.2 | hybrid |
| `/en` | vercel-fallback | 1436.5 | 1216.5 | +220 | +18.1% | 2856.2 | 2026.3 | vercel |
| `/en/face-analysis` | vercel-fallback | 1278 | n/a (403) | n/a | n/a | 2292.9 | n/a | incomparable |
| `/en/glasses-guide` | cloudflare | 1538.5 | n/a (403) | n/a | n/a | 3567.3 | n/a | incomparable |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | cloudflare | n/a (404) | n/a (403) | n/a | n/a | n/a | n/a | incomparable |

IPv4 follow-up (same client, browser UA, 400ms pacing):

| Run | `/` p50 Hybrid / Vercel | `/` delta | `/en` p50 Hybrid / Vercel | `/en` delta |
| --- | --- | --- | --- | --- |
| visutry.vercel.app | 1765 / 1953 | −188 ms (−9.6%) hybrid | 1222 / 1308 (26/30 200) | −86 ms (−6.6%) hybrid |
| git-main alias | 1838 / 1743 | +96 ms (+5.5%) vercel | 1718 / 1650 (26/30 200) | +69 ms (+4.2%) neutral |

Fallback class is **MIXED**: homepage locale redirect is often a small Hybrid win; `/en` sign flips with noise and WAF truncation. That is not a material, stable proxy penalty in this sample.

## Why Cloudflare gain is missing

www `/en/glasses-guide` is the only first-round HTML path that is actually Worker-owned. Measuring gain requires 30 successful direct-Vercel GETs. This client was challenge-blocked on `*.vercel.app` before that sample completed. Repeating would be more WAF load, not a cleaner benchmark.

## Repeat

```bash
node scripts/hybrid-performance-sample.mjs --validate-only
node scripts/hybrid-performance-sample.mjs
node scripts/hybrid-performance-sample.mjs --vercel-origin https://visutry-git-main-sunye.vercel.app
```

If Vercel returns 403 with `x-vercel-mitigated: challenge`, stop. Do not change Worker Routes, DNS, or Vercel config to manufacture a baseline.
