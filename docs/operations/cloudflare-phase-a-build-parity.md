# Cloudflare Phase A — Build Parity Report

**Date:** 2026-08-16  
**Status:** Partial / Free-compatible public-read staging deployed; full Prisma parity remains open
**Starting main SHA:** `acd0e2015c42a38dad90bc4b2ec12a350b6f7361`  
**Branch:** `codex/cloudflare-phase-a-build-parity`  
**Ending SHA:** See the final handoff report for the commit SHA containing this report.

## Scope and safety boundary

This was a build-parity exercise only. Production remains on Vercel. No production DNS, `visutry.com` routing, Stripe webhook, Auth configuration, Neon database, Vercel Blob data, production secret, or production traffic was changed.

## Local environment

| Item | Result |
| --- | --- |
| OS / shell | macOS / zsh |
| Node | `v25.8.0` |
| npm | `11.11.0` |
| Next.js before branch work | `14.2.32` |
| Next.js after additive compatibility pin | `14.2.35` |
| Wrangler | `4.123.0` via local devDependency and `npx` |
| OpenNext | `@opennextjs/cloudflare@1.15.1` |
| Starting git status | Clean `main`, synchronized with `origin/main` |

The current OpenNext release line requires newer Next.js versions. `1.15.1` is pinned exactly because it supports Next `14.2.35`; using a caret range would allow a fresh checkout to resolve to a newer adapter whose peer range excludes Next 14.

## Cloudflare access and existing resources

- Wrangler OAuth authentication: **PASS**. Existing browser-authenticated Wrangler session was reused; tokens and account identifiers were not printed in this report.
- Relevant resources inspected: Workers scripts/services, Pages projects, R2 buckets, KV namespaces, D1 databases, and `visutry.com` zone routes.
- No existing `visutry-*` Worker was found.
- R2 is not enabled for this account; KV and D1 listings were empty.
- Existing Pages projects were unrelated to this application. No `visutry.com` Cloudflare zone route was returned.
- No Cloudflare resource was deleted, recreated, or modified during inspection.

## Configuration added

- `wrangler.jsonc` with a deliberately non-production Worker name, `workers_dev`, Workers Static Assets, `nodejs_compat`, and no service/storage/secret bindings.
- `open-next.config.ts` using the default Cloudflare adapter configuration without R2 cache creation.
- Additive package scripts for a migration-safe Cloudflare build, local Workers preview, and staging deployment.
- Next `14.2.35` patch update required by the compatible OpenNext release.
- `.open-next`, `.wrangler`, and local `.dev.vars` files ignored by git.
- `.dev.vars.example` documenting the non-secret `NEXTJS_ENV` selector.

The Cloudflare build intentionally runs `prisma generate && next build` and then calls OpenNext with `--skipNextBuild`. This avoids invoking the existing Vercel `build` script's Neon migration step during a Cloudflare build.

## Reproduction commands

```bash
npm ci
npm run build:cloudflare
npm run preview:cloudflare
npm run deploy:cloudflare
```

`deploy:cloudflare` targets only the `staging` Wrangler environment and the `visutry-cf-staging` Worker name. It does not configure a custom domain.

## Build result

**PASS.** The complete sequential command `npm run build:cloudflare` succeeded in approximately `30.42s` and generated `.open-next/worker.js`.

- Next build compiled successfully and generated `1,580` static pages.
- OpenNext bundled middleware, static assets, cache assets, and the default server function.
- No database migration was invoked by the Cloudflare build.
- Wrangler dry-run passed configuration validation.
- Dry-run upload size: `18,994.17 KiB` raw / `3,833.56 KiB` gzip.

Build warnings:

1. Existing ESLint warnings for `<img>` usage, Hook dependencies, and an anonymous default export.
2. Browserslist / baseline-browser-mapping data is outdated.
3. OpenNext/esbuild warned about a nullish-coalescing expression in the bundled `/api/mcp` route.
4. The current account's Free Worker limit is lower than the measured gzip bundle; deployment was rejected for this reason.

## Cloudflare-local preview result

**PASS: attempted with the real Workers runtime; PARTIAL route parity.** `opennextjs-cloudflare preview` started Wrangler on `http://localhost:8787` with the `ASSETS` binding. The first attempt was rejected because the configured compatibility date was one day ahead of the Cloudflare service date; it was corrected to `2026-08-15`, and the second attempt started successfully.

## Phase A.1 Blocker Resolution

### Worker size

The initial Phase A dry-run measured `18,994.17 KiB` raw / `3,833.56 KiB` gzip. After the Prisma edge-entry fix, the final dry-run measured `21,167.97 KiB` raw / `4,603.50 KiB` gzip. The final bundle fits the documented Workers Paid `10 MiB` compressed limit, but not the account's Free `3 MiB` limit. No plan change was authorized.

The OpenNext esbuild metafile identifies the dominant inputs as:

- Prisma query compiler WASM base64: `2,467,499` bytes raw.
- Next server chunk `7899.js`: `896,891` bytes.
- OpenNext server `index.mjs`: `645,811` bytes.
- Next `load-manifest.js`: `631,572` bytes.
- `/api/mcp` route bundle: `489,996` bytes.
- Prisma edge compiler/runtime support: `182,011` bytes, plus Prisma runtime client `167,535` bytes.

The default OpenNext server handler is one shared bundle (`14,781,442` bytes raw / `3,477,944` bytes gzip); middleware is `990,194` raw / `122,120` gzip. Prisma is therefore globally bundled into the default server function because the singleton is imported by DB-backed routes and server pages. Avoidable reduction requires route/function splitting or a supported Prisma/query-compiler replacement; no broad refactor was attempted. The controlled `compilerBuild = "small"` experiment validated on Prisma `7.1.0` but did not reduce the generated query-compiler payload on this `prisma-client-js` setup.

The Free-plan target remains open. The next step is a measured bundle-reduction phase; the dry-run is not deployable on Workers Free.

### Route 404 analysis

Next and OpenNext both contained all four requested concrete paths in their prerender manifests, and the filesystem routes are the expected locale-parent plus nested dynamic segments. `/en/try-on/glasses` is the canonical route generated from `tryOnTypeToUrl(GLASSES)`; the smoke test was correct.

| Route | Root cause | Fix | Result |
| --- | --- | --- | --- |
| `/en/face-shapes/oval` | OpenNext `1.15.1` did not dispatch a generated nested dynamic page with `dynamicParams = false`. | Set `dynamicParams = true`; page-level `getFaceShapeContent()` still calls `notFound()` for unknown slugs. | PASS — 200 |
| `/en/try-on/glasses` | Same OpenNext nested dynamic-route dispatch behavior; canonical path confirmed. | Set `dynamicParams = true`; `urlToTryOnType()` still calls `notFound()` for invalid values. | PASS — 200 |
| `/en/style/oval-face` | Same OpenNext nested dynamic-route dispatch behavior. | Set `dynamicParams = true`; `normalizeFaceShapeSlug()` still calls `notFound()` for unknown slugs. | PASS — 200 |
| `/en/brand/oakley` | Same OpenNext nested dynamic-route dispatch behavior while the curated page was closed with `dynamicParams = false`. | Set `dynamicParams = true`; `BrandPage` still rejects non-curated/non-database slugs with `notFound()`. | PASS — 200 |

This isolates the mismatch to the adapter/Next 14 route-dispatch path rather than missing `generateStaticParams`, locale omission, middleware, or an incorrect canonical URL. The workaround is local to the four affected pages; a future adapter/Next upgrade should retest whether the stricter closed-set flag can be restored.

Invalid-slug control requests for `/en/face-shapes/not-a-shape` and `/en/style/not-a-shape` returned 404. Invalid try-on and brand slugs exposed a separate OpenNext static-to-dynamic `headers` error and returned 500; those paths remain a follow-up and are not claimed as resolved by the canonical-route workaround.

### Prisma / Neon

Current configuration is Prisma `7.1.0`, `prisma-client-js`, `@prisma/adapter-neon@7.1.0`, and a pooled `DATABASE_URL` for runtime queries. `prisma.config.ts` keeps CLI/migration commands on `DATABASE_URL_UNPOOLED` (direct Neon), without changing migration behavior.

The exact OpenNext/Workers failure before the fix was `WebAssembly.Module(): Wasm code generation disallowed by embedder`, originating in Prisma's `getQueryCompilerWasmModule` path. The smallest controlled Wrangler probe used the same generated client and adapter, executed read-only `SELECT 1` plus `glassesFrame.findFirst({ select: { id: true } })`; it passed when importing `@prisma/client/edge`. A direct `@neondatabase/serverless` probe with read-only `SELECT 1` also passed. The OpenNext preview then returned `200` from `/api/glasses/brands` with the edge entry.

Root-cause classification: Cloudflare-to-Neon connectivity is **PASS**; the failure was in the Prisma client entry/runtime and OpenNext Workers bundling path. The low-risk remediation is the `@prisma/client/edge` import in `src/lib/prisma.ts`. Prisma remains in the shared bundle, and Next's build-time prerender still logs the known WASM initialization warning for DB-backed API routes, so full Prisma parity is not signed off. No migration, schema, Neon, or production data change was made.

Recommended remediation: keep the edge-entry change for staging validation, then separately evaluate a Prisma version/generator/runtime explicitly supported by Workers or replace only the affected DB boundary. Do not broadly refactor the data layer in Phase A.1.

### Application import topology

Prisma is globally bundled into OpenNext's single default server function through the shared `src/lib/prisma.ts` singleton. Stripe and Blob references are route-local inputs rather than the dominant bundle contributors identified by the metafile; no safe evidence justified removing them. The edge Prisma entry fixes the preview query path but adds runtime support and increases compressed size, which is why the final bundle is larger than the Phase A baseline.

### Phase A.1 validation

| Command / check | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm run build:cloudflare` | PASS; build completed and emitted `.open-next/worker.js` |
| `npx wrangler deploy --dry-run --env staging --metafile ...` | PASS; `21,167.97 KiB` raw / `4,603.50 KiB` gzip |
| OpenNext preview route matrix | PASS for all four routes and `/api/glasses/brands` |
| `npm run lint` | PASS with existing warnings |
| `npm run typecheck` | PASS |
| `npm run test:critical:ci` | PASS; 7 suites / 30 tests |
| `npm run build:ci` | PASS; existing build-time Prisma WASM warnings logged for DB-backed static API generation |

No staging Worker was deployed because the Free-plan size limit remains exceeded.

## Phase A.2 — Workers Free bundle investigation

**Result: PARTIAL / BLOCKED.** This phase kept the hard Workers Free target of less than `3 MiB` gzip. It made no schema migration, Neon data change, production configuration change, DNS change, or Worker deployment.

### Free-plan result

| Measurement | Result |
| --- | ---: |
| Baseline / final supported configuration | `21,167.97 KiB` raw / `4,592.58 KiB` gzip |
| Workers Free limit | `3,072 KiB` gzip |
| Reduction | `0 KiB` versus the supported baseline |
| Headroom | `-1,520.58 KiB` |

The supported baseline remains Prisma `7.1.0`, `prisma-client-js`, `@prisma/adapter-neon@7.1.0`, and the `@prisma/client/edge` singleton import. The Worker is **not Workers Free compatible**.

### Prisma experiments

- Latest compatible Prisma `7.x` tested: `7.9.1`. `compilerBuild = "small"` generated successfully and the preview `/api/glasses/brands` query returned `200`, but the bundle increased to `21,683.25 KiB` raw / `4,717.43 KiB` gzip. The generated base64 query compiler remained approximately `2.47 MB`; this configuration was rejected.
- The `prisma-client` generator with `runtime = "workerd"`, `moduleFormat = "esm"`, and `compilerBuild = "small"` generated a split client. An isolated Wrangler probe passed both `SELECT 1` and a Prisma `glassesFrame.findFirst()` read, but the full application failed TypeScript compatibility against the existing `@prisma/client` types and Next/Webpack failed to parse the generated raw WASM module. No generated client or build workaround was retained.
- The remaining global Prisma path is structural: OpenNext emits one shared default server function, and DB-backed routes/pages plus the MCP/OAuth surface reach the shared `src/lib/prisma.ts` singleton. The emitted query compiler was `2,467,499` bytes raw; the MCP route was `489,996` bytes raw. A controlled MCP barrel-to-leaf import change increased the final gzip measurement by `10.10 KiB`, so it was reverted.

### Supported isolation and direct-Neon probes

OpenNext documents multi-worker deployment as an advanced supported option, but it is not compatible with the repository's current preview URL or standard `@opennextjs/cloudflare deploy` staging flow. It was therefore not presented as a drop-in fix for this task.

A temporary direct `@neondatabase/serverless` probe implementing the equivalent active-brand query (`SELECT DISTINCT ... FROM "GlassesFrame"`) returned `200` with `50` rows. Its isolated Wrangler dry-run was `222.54 KiB` raw / `55.01 KiB` gzip, compared with `2691.63 KiB` raw / `913.86 KiB` gzip for the minimal workerd Prisma probe. This supports selective direct-Neon access as a future, route-by-route fallback only; the application was not rewritten around it.

### Phase A.2 validation

| Check | Result |
| --- | --- |
| `npm run build:cloudflare` | PASS; OpenNext worker emitted |
| Wrangler Free dry-run | PASS measurement; deployment remains blocked at `4,592.58 KiB` gzip |
| Prisma preview query | PASS — `/api/glasses/brands` returned `200` with the edge entry |
| Equivalent direct-Neon query | PASS — `200`, 50 active-brand rows |
| `npm run build:ci` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:critical:ci` | PASS — 7 suites / 30 tests |
| `npm run lint` | PASS with existing warnings |

The four canonical dynamic routes remain the Phase A.1 passes: `/en/face-shapes/oval`, `/en/try-on/glasses`, `/en/style/oval-face`, and `/en/brand/oakley`. Invalid face-shape and style slugs return `404`; invalid try-on and brand slugs still expose the known OpenNext static-to-dynamic `headers` mismatch and return `500`.

## Staging deployment result (historical pre-A.3 attempt)

**NOT DEPLOYED at the pre-A.3 baseline.** The earlier deployment attempt uploaded static assets but Cloudflare rejected the Worker because the compressed Worker exceeded the account's `3 MiB` Free-plan limit. Phase A.3 later removed Prisma from the public-read bundle and deployed the corrected Worker; see the current result below.

- Worker name: `visutry-cf-staging`
- URL: none
- Deployment/version identifier: none
- Production domain touched: **NO**
- Production DNS changed: **NO**

No plan upgrade or bundle-reduction refactor was performed in Phase A.

## Route smoke-test matrix

The same built application was also checked with standard Next local serving where useful to distinguish application behavior from Worker-runtime parity.

| Route / check | Cloudflare preview | Evidence / note |
| --- | --- | --- |
| `/en` | PASS — 200 | Public static page loaded |
| `/en/face-shape-detector` | PASS — 200 | Public static page loaded |
| `/en/blog` | PASS — 200 | Public static page loaded |
| `/en/face-shapes/oval` | PASS — 200 | Phase A.1 `dynamicParams` compatibility fix |
| `/en/store` | PASS — 200 | Store public shell loaded |
| `/en/style-explorer` | PASS — 200 | Consumer shell loaded |
| `/en/face-analysis` | PASS — 200 | Consumer shell loaded |
| `/en/try-on/glasses` | PASS — 200 | Canonical route confirmed; Phase A.1 `dynamicParams` compatibility fix |
| `/en/try-on/glasses/compare` | PASS — 200 | Consumer shell loaded |
| `/en/pricing` | PASS — 200 | Consumer shell loaded |
| `/en/style/oval-face` | PASS — 200 | Phase A.1 `dynamicParams` compatibility fix |
| `/en/try/{slug}` | NOT TESTED | No safe known local/staging slug was available; invalid probe returned 404 |
| `/en/brand/oakley` | PASS — 200 | Curated brand; Phase A.1 `dynamicParams` compatibility fix |
| `/en/category/{category}` | NOT TESTED | Programmatic SEO was disabled and no safe category dataset was selected |
| `/admin/dashboard` | PASS — 307 | Unauthenticated request redirected to sign-in; auth was not weakened |
| `/api/health` | PASS — 200 | Representative route handler loaded |
| `/api/glasses/brands` | PASS — 200 | Phase A.1 edge Prisma entry; build-time DB prerender warnings remain |

## Compatibility matrix (historical pre-A.3 baseline)

| Area | Classification | Finding and smallest future remediation |
| --- | --- | --- |
| Next.js App Router / React Server Components | PASS | Build completed with App Router, RSC, SSG, SSR, and dynamic route output. Keep the adapter/Next compatibility pin until a supported upgrade is planned. |
| Route Handlers | PASS / PARTIAL | `/api/health` and the Prisma-backed brands handler loaded in preview after the edge Prisma entry; broader DB-backed flows and build-time Prisma warnings remain open. |
| Server Actions | NOT TESTED | No `use server` declarations were found under `src`; add a focused test if introduced later. |
| Middleware | PASS / WARNING | `src/middleware.ts` bundled and protected `/admin/dashboard` with a 307 redirect. The dynamic route 404s need a separate OpenNext/Next compatibility investigation. |
| next-intl / locale routing | PASS | Locale-prefixed public pages rendered in the Worker preview. Full nine-locale matrix remains Phase B work. |
| Auth / session | PASS / NOT TESTED | Unauthenticated admin protection worked. Full OAuth, cookie refresh, and authenticated flows were not tested. Relevant files include `src/middleware.ts` and `src/app/api/auth/[...nextauth]/route.ts`. |
| Neon / Prisma | PARTIAL | `src/lib/prisma.ts` now uses `@prisma/client/edge`, and the preview query path passes. Prisma 7's query compiler/WASM remains in the shared bundle and logs initialization warnings during Next build-time API prerendering. Evaluate a Workers-supported Prisma version/generator/runtime before full parity sign-off; do not migrate Neon in Phase A. |
| Stripe | NOT TESTED | `src/lib/stripe.ts` and `src/app/api/payment/webhook/route.ts` bundled, but no test secret or webhook request was used. Validate only with Stripe test resources in Phase B. |
| Vercel Blob | NOT TESTED | Blob imports are present in `src/lib/blob/` and `src/modules/store/infrastructure/assets/vercel-blob-asset-store.ts`. No Blob data or token was moved. |
| next/image | PASS / NOT TESTED | Build completed with existing `next/image` usage. No Cloudflare Images binding was added; image optimization parity remains open. |
| Uploads / body size | NOT TESTED | Upload routes include `src/app/api/upload/route.ts` and face-analysis photo handlers; test size limits in staging parity. |
| AI generation / long requests | NOT TESTED | Try-on and face-analysis generation routes bundle, but request duration and polling behavior were not exercised. Vercel `maxDuration` settings have no Phase A equivalent. |
| Store / Campaign | PARTIAL | `/en/store` loaded, but DB-backed store sessions and asset flows were not tested. No storage migration was attempted. |
| Cron / background work | NOT TESTED | Cron route handlers bundle, but Vercel cron schedules and 300-second settings were not ported. |
| Node/runtime APIs | PARTIAL | `nodejs_compat` allowed the build and public preview. The edge Prisma entry passes the preview query path, but Prisma 7's WASM compiler remains in the bundle and build-time warnings need a Phase B audit. |

## Blockers

1. Prisma 7's query compiler/WASM remains in the shared Worker bundle and logs initialization warnings during Next build-time DB-backed API prerendering. The minimal and preview query paths pass with `@prisma/client/edge`, but full DB parity is not signed off.
2. The account's Free Worker size limit rejected the final measured `4.60 MiB` gzip Worker. No plan upgrade was authorized or performed.

## Warnings

1. Latest `@opennextjs/cloudflare` no longer accepts this repository's Next 14 dependency range; the Phase A adapter is pinned to `1.15.1` and Next to `14.2.35`.
2. The OpenNext `/api/mcp` bundle produced an esbuild suspicious-nullish-coalescing warning.
3. Existing lint and browser-data warnings remain unchanged.
4. Full auth, Stripe, Blob, uploads, AI, cron, and Store/ Campaign parity were intentionally not tested.

## Required Phase B work

- Choose and validate a Workers-compatible Prisma/Neon runtime path without copying production credentials or migrating Neon.
- Resolve the Worker size limit using an authorized account plan or a measured bundle-reduction plan.
- Retest the four dynamic-route workarounds on the next supported OpenNext/Next upgrade; restore `dynamicParams = false` only if the adapter dispatches generated paths correctly.
- Create isolated staging-only variables and data, then test Auth, Stripe test webhooks, Blob reads/writes, uploads, AI generation, polling, cron behavior, locale SEO, images, and Store/Campaign boundaries.
- Re-run the full route matrix against a deployed staging Worker and compare against Vercel preview.

## Phase A.3 — Workers Free compatibility and direct-Neon public reads

**Result: PARTIAL.** The public read slice now fits Workers Free, but the complete application does not yet have Cloudflare parity. No Workers Paid plan, production change, schema migration, DNS change, or staging deployment was used.

### Final bundle measurement

Measurements below are the OpenNext default server function's `handler.mjs` plus `index.mjs`; middleware and static assets are reported separately by Wrangler.

| Measurement | Result |
| --- | ---: |
| Previous supported baseline | `4,592.58 KiB` gzip / `21,167.97 KiB` raw |
| Final handler | `2,320.31 KiB` gzip / `11,521.00 KiB` raw |
| Final index | `42.84 KiB` gzip / `631.09 KiB` raw |
| Final handler + index | `2,363.15 KiB` gzip / `12,152.09 KiB` raw |
| Final Wrangler upload | `2,814.46 KiB` gzip / `16,279.37 KiB` raw |
| Reduction versus baseline upload | `1,778.12 KiB` gzip / `38.72%` |
| Workers Free limit | `3,072 KiB` gzip |
| Free headroom at Wrangler upload gate | `257.54 KiB` gzip |
| Prisma query-compiler/WASM present | **NO** |

The final raw `index.mjs` size is `646,241` bytes. The final Wrangler dry run is the conservative Free-plan measurement because it includes the Worker upload and its static asset upload. The handler contains only the small Cloudflare lazy Prisma stub and configuration metadata strings; no query compiler, `.prisma` directory, Prisma package, or adapter runtime artifact was copied into the Worker bundle.

Final handler metafile top contributors by raw bytes in output:

1. Next server chunk `7899.js` — `939.57 KiB`
2. Next `load-manifest.js` — `562.29 KiB`
3. OpenNext server `index.mjs` — `533.07 KiB`
4. `/api/mcp` route bundle — `517.92 KiB`
5. Next app-page runtime — `346.52 KiB`
6. Next server chunk `8538.js` — `302.31 KiB`
7. `node-html-parser` — `218.15 KiB`
8. Next server chunk `7261.js` — `171.82 KiB`
9. Next server chunk `1081.js` — `166.74 KiB`
10. Next server chunk `4132.js` — `147.91 KiB`

### Prisma import roots and provider boundary

The inventory in [`cloudflare-phase-a3-prisma-import-inventory.md`](./cloudflare-phase-a3-prisma-import-inventory.md) records `110` direct `src/lib/prisma.ts` consumers plus direct `@prisma/client` enum/type imports. The source consumers remain for Vercel and local application behavior; the Cloudflare build aliases the Prisma composition root and Prisma package entries to a small stub so unsupported paths fail explicitly instead of bundling Prisma.

The migrated Cloudflare provider boundaries are:

- Public glasses API and pages: direct `@neondatabase/serverless` SQL for brands, categories, face shapes, frames, relations, and frame IDs.
- Public Store discovery/profile: direct Neon SQL for merchant, experience, route-admission, and public merchant-frame reads.
- Vercel/default build: unchanged Prisma-backed providers and `src/lib/prisma.ts`.

No Prisma schema, Neon connection, or database data was changed. The Cloudflare SQL is read-only for this phase and preserves active/status, tenant, relation-order, and public-field filtering for the migrated paths.

### Auth, MCP, and remaining application paths

- Auth/NextAuth remains Prisma-backed. Anonymous `/api/auth/session` returned `200` with `{}`, and middleware still protected `/admin/dashboard`; authenticated sign-in, refresh, and adapter-backed session reads were not migrated or signed off.
- MCP/OAuth remains Prisma-backed. Its route bundle is still one of the largest inputs, and authenticated merchant/MCP operations are unsupported by the Cloudflare stub.
- Admin, payment, consumer write, background, and non-public Store/session routes remain on the existing Prisma roots and will fail fast if invoked in this Cloudflare build. They are not claimed as Cloudflare-compatible.

This is why the result is **PARTIAL** despite the Worker size passing the Free-plan limit: only the explicitly migrated public-read slice is supported.

### Route parity and validation

Cloudflare preview used the real Workers runtime and a read-only Neon connection. The following all returned `200`, including concurrent requests to the glasses endpoints:

- `/api/glasses/brands`
- `/api/glasses/categories`
- `/api/glasses/face-shapes`
- `/api/glasses/frames`
- `/api/glasses/frames/{id}`
- `/api/store/merchants/akila` (an active database merchant slug)
- `/api/auth/session` (anonymous)
- `/api/health`

The opt-in provider parity test is at `tests/integration/data/glasses-provider-parity.test.ts`. It reaches the direct-Neon provider, but the local Prisma side is blocked by Prisma `7.1.0` reporting `The loaded wasm module was unexpectedly undefined or null once loaded` under this Node `v25.8.0` environment. The test is therefore not presented as passing; the Worker preview is the runtime evidence for the migrated provider.

### Invalid slugs

The public product route now rejects malformed frame slugs before database access and returns Next `notFound()` behavior; metadata is marked noindex. The existing OpenNext nested dynamic-route workaround remains for the curated brand page, and the broader invalid brand/category static-to-dynamic adapter behavior remains a follow-up.

### Staging and Vercel regression

Staging **was deployed** after the Free-plan gate passed:

- Worker: `visutry-cf-staging`
- URL: `https://visutry-cf-staging.sunye.workers.dev`
- Final version: `e268138e-b5fd-4fcb-b85c-cf745f284c2b`
- Secret: Wrangler `DATABASE_URL` configured only on the staging Worker from the existing local runtime configuration; its value was never printed
- Custom domain/DNS: none

The deployed Worker serves the migrated public reads and static/public routes. Authenticated NextAuth, MCP, admin, write, and non-public Prisma paths remain intentionally unsupported by the Cloudflare stub.

Final staging QA returned `200` for all listed public/static routes, the four public glasses APIs, the public merchant profile, anonymous session, and health. `/admin/dashboard` returned the expected `307` sign-in redirect; an invalid brand returned `307` to `/en`; an invalid product and invalid category returned `404`. Twelve concurrent glasses API requests all returned `200`.

`npm ci`, `npm run build:cloudflare`, `npm run typecheck`, `npm run lint`, `npm run test:critical:ci`, and `npm run build:ci` passed. The normal build used the unchanged Vercel Prisma path; the Cloudflare-only aliases were not enabled for it.

## Production status

Production remains on Vercel. No production DNS/routing, user traffic, secrets, Stripe webhooks, authentication configuration, Neon data, or Vercel Blob data was changed.

## References

- [OpenNext Cloudflare getting started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Cloudflare deployment limits](https://opennext.js.org/cloudflare)
- [OpenNext Cloudflare multi-worker deployment](https://opennext.js.org/cloudflare/howtos/multi-worker)
- [OpenNext Cloudflare CLI](https://opennext.js.org/cloudflare/cli)
- [Cloudflare Next.js Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Workers WebAssembly restrictions](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)
- [Prisma Cloudflare deployment guide](https://docs.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare)
- [Prisma generators and `runtime = "workerd"`](https://www.prisma.io/docs/orm/prisma-schema/overview/generators)
- [Prisma 7.3 compiler build modes](https://www.prisma.io/changelog/2026-01-21)
- [Prisma 7 Workers WASM issue](https://github.com/prisma/prisma/issues/28657)
