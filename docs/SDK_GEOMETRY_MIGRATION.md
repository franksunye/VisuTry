# Shared geometry SDK migration

## Scope

The consumer application now routes geometric measurement and face-shape scoring
through `@visutry/tryon-core`. `src/lib/face-geometry-sdk.ts` is a compatibility
adapter; `src/lib/face-landmark-metrics.ts` retains the existing import surface and
the `landmark-v1` report envelope.

The SDK owns the MediaPipe semantic map, image-aspect conversion, 2D ratios,
geometric acceptance rules, shape scoring and tie order, confidence, geometry
signals, jaw/upper-face profiles, quality score and advisory thresholds. Store
signals consume the same profile functions through the existing application
imports.

The production import path is
`face-landmark-client.ts` → `face-landmark-metrics.ts` → `face-geometry-sdk.ts` →
the installed `@visutry/tryon-core`. The photo adapter calls `computeFromSemantic`
with decoded dimensions and then `scoreFromMetrics`; it does not fabricate video
tracker confidence, stability or pose scores. Store's `domain/signals.ts` and
`StoreFitProfile.tsx` resolve their existing profile imports to the same SDK.

The application retains image decoding and the existing MediaPipe runtime/fallback
lifecycle, failure-message mapping, report presentation, persisted-input
normalization and product workflows. This change does not migrate the paid AI
analysis provider, reports, credit/quota checks, permissions, image generation or
merchant ranking policy. It is not evidence that every detection or recommendation
component has already been consolidated.

## Frozen compatibility evidence

`tests/unit/lib/fixtures/face-geometry-pre-sdk.json` contains synthetic inputs and
outputs captured from the application before replacing its geometry implementation:

- Repository: `franksunye/VisuTry`
- Commit: `66381dc7d7ccd053414a1c9069355c3ecef3e21c`
- Source: `src/lib/face-landmark-metrics.ts`
- Source SHA-256: `019cb6a5aa6bf51492f92c730adb9ab83c8203726e62204f44c83d2a22104901`
- 34 complete measurements: portrait/landscape dimensions, scale, tilt,
  alignment, each face-span axis, missing points, multiple/no faces, zero width
  and optional depth.
- 1,440 classification boundary combinations: primary shape, alternatives,
  confidence and deterministic ties.
- 27 explanation combinations and 16 profile boundaries.

These expected values were verified against the original implementation before
the adapter was introduced. They are not generated from the SDK being tested.
The fixture stores results, not a second executable geometry implementation. No
customer photos or measured customer landmarks are included.

`face-geometry-sdk-compatibility.test.ts` compares the installed package against
that independent fixture and asserts that the application exports the actual SDK
classifier/profile functions. Do not replace the package with a Jest mock or
regenerate the fixture from the current SDK to make a failing test pass.

## Deliberate input-contract changes

- Image width and height must be finite and positive. Missing or invalid
  dimensions now produce `geometry_error`; the old implicit square-image fallback
  was inaccurate for non-square photos. The production file-decoding path already
  supplies the decoded dimensions.
- Non-finite x/y coordinates and coincident outer-eye points produce
  `geometry_error` rather than a plausible classification from invalid geometry.
  Optional z values do not affect 2D photo measurements.
- An explicit `faceCount: 0` produces `no_face` even if stale points are supplied.
- A negative, fractional or non-finite face count produces `geometry_error` with
  a finite `faceCount: 0` and `faceDetected: false` envelope.
- The low-level `classifyFaceGeometry` helper rejects invalid ratios with a
  `RangeError`; the production landmark adapter maps invalid geometry to its
  existing unavailable-result envelope.

These cases have explicit tests and are not presented as unchanged legacy
behavior. Quality and confidence remain heuristic scores, not calibrated
probabilities or measurements of physical frame fit.

## SDK release source

The shared implementation was reviewed and merged in
[SDK PR #6](https://github.com/franksunye/visutry-tryon-sdk/pull/6), at source commit
[`df6190a8b4f179475467fe47c96cd237f73de62e`](https://github.com/franksunye/visutry-tryon-sdk/commit/df6190a8b4f179475467fe47c96cd237f73de62e).

## Exact registry dependency pin

`package.json` now declares `@visutry/tryon-core` as exactly `0.3.0`. The lockfile
adds only that root dependency and one package entry; all 1,525 existing package
entries are unchanged. The package has no runtime, peer or optional dependencies.
No sibling workspace link, local archive path or semver range is used.

The pin comes from the [official version metadata](https://registry.npmjs.org/@visutry%2ftryon-core/0.3.0):

```text
Version: 0.3.0
Resolved: https://registry.npmjs.org/@visutry/tryon-core/-/tryon-core-0.3.0.tgz
Integrity: sha512-DxNyPcvVGHHL98qAxjcA6Opw5h13CMzuUohZMYBvXIv97ce3Y3lQLUlJs1Cu66DeT/I3w4NxHiiL1+Vmu3KWXA==
Registry SHA-1: ad6635a1f9c1fba7b564fd7533e50414abfca1b5
```

The [registry provenance](https://registry.npmjs.org/-/npm/v1/attestations/@visutry%2ftryon-core@0.3.0)
records source commit `df6190a8b4f179475467fe47c96cd237f73de62e`, the SDK's
`.github/workflows/release.yml`, and
[release run 44887042698, attempt 1](https://github.com/franksunye/visutry-tryon-sdk/actions/runs/44887042698/attempts/1).
Its subject SHA-512 matches the registry integrity above.

**Registry installation gate at PR preparation:** the exact version metadata and
provenance are available, while the archive URL still returned HTTP 404 from the
local environment. The lockfile is prepared from genuine registry metadata; a
successful clean registry install has not yet been observed locally. The prior
100-test and 47-test receipts below used the pre-publication candidate and do not
claim to validate installation of the published archive. A fresh GitHub Actions
runner must complete `npm ci` and the application gates before merge and rollout.

Use the final lockfile for validation, with the existing CI placeholder URL for
Prisma's generate-only postinstall:

```sh
DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/visutry_ci DATABASE_URL_UNPOOLED=postgresql://ci:ci@127.0.0.1:5432/visutry_ci npm ci --no-audit --no-fund
npm run typecheck
DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/visutry_ci npm run test:critical:ci
npx jest tests/unit/lib/face-geometry-sdk-compatibility.test.ts tests/unit/lib/face-landmark-metrics.test.ts tests/unit/lib/face-landmark-client.test.ts tests/unit/lib/face-analysis-report.test.ts tests/unit/modules/store/frame-matching-v2.test.ts tests/unit/modules/store/recommend-frames.test.ts tests/unit/components/store/StoreFitProfile.test.tsx --runInBand
```

The ESM package is included in Next's `transpilePackages` and in Jest's transform
allowlist. Because the SDK exposes an import-only ESM entry, Jest maps that one
module name to the installed `dist/index.js` and transforms it with SWC. This
executes the real installed package, not a source-workspace substitute or mock.

## Local candidate measurement

The locally tested archive is `@visutry/tryon-core@0.3.0`, 55,528 bytes:

```text
SHA-256: d0e4ccb9cb5f0973b4e9a7fb413b50cda6b3b0e4b5b173b2d3e18f3bed144f09
Integrity: sha512-bjGu269RvGYKy3pC0hscIA0x4b5JlWp57nbfcpawNmO7M8FR2140yiay7i6o+XUAYf6pbf639y4XhQObKtS/IA==
```

The package declares no runtime, peer or optional dependencies. Its installation
adds only the core package; it does not add MediaPipe, Three.js or a renderer to
the consumer dependency graph.

For a matched browser ESM entry (`src/lib/face-landmark-metrics.ts`), esbuild
0.25.9 with ES2020 target, minification, tree shaking and gzip level 9 produced:

| Version | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Pre-SDK source at the pinned application revision | 9,101 | 3,599 |
| Shared-core adapter | 20,961 | 7,246 |
| Increase | 11,860 | 3,647 |

This is an isolated entry comparison, not the complete Next.js application or a
prediction of route-level network transfer after chunk sharing. The added output
contains the shared mapper, metric calculator, scorer, quality helpers and their
math helpers. The core package's pose, privacy, manifest and localization modules
are not included in this entry output.

The local tarball check passed all seven targeted suites (100 tests),
including the frozen baseline comparisons and a file-decoding test that forwards
an 800×1200 image through the actual SDK adapter. The existing critical-business
gate also passed all seven suites (47 tests), using the same isolated placeholder
database URL as CI; those tests do not query a database. Application typecheck
passed. Next lint passed with warnings only in unchanged files. Local checks used
Node 24.22.3; the existing application CI uses Node 22.

Registry installation, the full unit suite in CI and the application's full
remote build remain separate acceptance gates.

## Existing application gates and rollback

The existing `quality-gate.yml` uses Node 22, `npm ci`, typecheck, Next lint,
migration-boundary tests, critical business tests, full unit tests and Playwright
test discovery. The new compatibility test is inside the existing unit-test tree.
The workflow explicitly reserves the complete Next build for the Vercel preview
or production gate because admin prerendering requires database-backed data.

Do not use `npm run build` as a database-free local check: it includes the existing
production migration wrapper. No schema/migration changes; rollout uses the
existing authorised deployment pipeline. The local compatibility checks do not
connect to a database or execute that deployment pipeline.

The recorded production rollback baseline is Vercel deployment
`dpl_HRTKFeDEHicexj3mND9y15Rt2KE9`, with source
`23a1ffdd15a3a00e572ed856cbd0d18b75752a78`, serving `www.visutry.com` and
`visutry.com`. The inspected application baseline `66381dc7d7ccd053414a1c9069355c3ecef3e21c`
adds only a documentation commit to that production revision. The existing
`scripts/vercel-ignore-build.sh` cost policy skips previews; this migration does
not change it. After the application PR passes CI and is merged, rollout uses
the existing production Git build, with the recorded READY deployment retained
as the rollback target.

Rollback consists of reverting the adapter, compatibility import/config changes,
and the exact package/lockfile pin together, then deploying the previously verified
application source through the existing release process. The unchanged
`landmark-v1` result envelope and retained normalizer require no stored-result
conversion or database rollback. Do not retain a hidden second algorithm behind
a runtime flag; the pre-SDK source revision remains available in Git for a reviewable
revert.
