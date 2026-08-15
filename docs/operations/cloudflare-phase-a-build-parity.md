# Cloudflare Phase A — Build Parity Report

**Date:** 2026-08-16  
**Status:** Partial / blocked by runtime and account limits  
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

Recommended action: use an authorized Workers Paid staging target or perform a separate measured bundle-reduction phase. Do not treat the Free-plan dry-run as deployable.

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

## Staging deployment result

**NOT DEPLOYED.** The safe deployment attempt uploaded static assets but Cloudflare rejected the Worker because the compressed Worker exceeded the account's `3 MiB` Free-plan limit. The largest bundle was the OpenNext default server handler. A follow-up API inspection confirmed that `visutry-cf-staging` was not created.

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

## Compatibility matrix

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

## Production status

Production remains on Vercel. No production DNS/routing, user traffic, secrets, Stripe webhooks, authentication configuration, Neon data, or Vercel Blob data was changed.

## References

- [OpenNext Cloudflare getting started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Cloudflare CLI](https://opennext.js.org/cloudflare/cli)
- [Cloudflare Next.js Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Workers WebAssembly restrictions](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)
- [Prisma Cloudflare deployment guide](https://docs.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare)
- [Prisma 7 Workers WASM issue](https://github.com/prisma/prisma/issues/28657)
