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
| `/en/face-shapes/oval` | FAIL — 404 | Standard Next local server returned 200 |
| `/en/store` | PASS — 200 | Store public shell loaded |
| `/en/style-explorer` | PASS — 200 | Consumer shell loaded |
| `/en/face-analysis` | PASS — 200 | Consumer shell loaded |
| `/en/try-on/glasses` | FAIL — 404 | Standard Next local server returned 200 |
| `/en/try-on/glasses/compare` | PASS — 200 | Consumer shell loaded |
| `/en/pricing` | PASS — 200 | Consumer shell loaded |
| `/en/style/oval-face` | FAIL — 404 | Standard Next local server returned 200 |
| `/en/try/{slug}` | NOT TESTED | No safe known local/staging slug was available; invalid probe returned 404 |
| `/en/brand/oakley` | FAIL — 404 | Curated brand; standard Next local server returned 200 |
| `/en/category/{category}` | NOT TESTED | Programmatic SEO was disabled and no safe category dataset was selected |
| `/admin/dashboard` | PASS — 307 | Unauthenticated request redirected to sign-in; auth was not weakened |
| `/api/health` | PASS — 200 | Representative route handler loaded |
| `/api/glasses/brands` | BLOCKER — 500 | Prisma 7 query compiler hit Workers WASM restriction |

## Compatibility matrix

| Area | Classification | Finding and smallest future remediation |
| --- | --- | --- |
| Next.js App Router / React Server Components | PASS | Build completed with App Router, RSC, SSG, SSR, and dynamic route output. Keep the adapter/Next compatibility pin until a supported upgrade is planned. |
| Route Handlers | PASS / BLOCKER | `/api/health` loaded, but Prisma-backed handlers cannot currently query in Workers. Resolve the Prisma 7 runtime issue before parity sign-off. |
| Server Actions | NOT TESTED | No `use server` declarations were found under `src`; add a focused test if introduced later. |
| Middleware | PASS / WARNING | `src/middleware.ts` bundled and protected `/admin/dashboard` with a 307 redirect. The dynamic route 404s need a separate OpenNext/Next compatibility investigation. |
| next-intl / locale routing | PASS | Locale-prefixed public pages rendered in the Worker preview. Full nine-locale matrix remains Phase B work. |
| Auth / session | PASS / NOT TESTED | Unauthenticated admin protection worked. Full OAuth, cookie refresh, and authenticated flows were not tested. Relevant files include `src/middleware.ts` and `src/app/api/auth/[...nextauth]/route.ts`. |
| Neon / Prisma | BLOCKER | `src/lib/prisma.ts`, `src/app/api/glasses/brands/route.ts`, and other Prisma-backed handlers trigger Prisma 7 `getQueryCompilerWasmModule` and `WebAssembly.Module()` failure in Workers. Evaluate a Workers-compatible Prisma version/build or supported database access path; do not migrate Neon in Phase A. |
| Stripe | NOT TESTED | `src/lib/stripe.ts` and `src/app/api/payment/webhook/route.ts` bundled, but no test secret or webhook request was used. Validate only with Stripe test resources in Phase B. |
| Vercel Blob | NOT TESTED | Blob imports are present in `src/lib/blob/` and `src/modules/store/infrastructure/assets/vercel-blob-asset-store.ts`. No Blob data or token was moved. |
| next/image | PASS / NOT TESTED | Build completed with existing `next/image` usage. No Cloudflare Images binding was added; image optimization parity remains open. |
| Uploads / body size | NOT TESTED | Upload routes include `src/app/api/upload/route.ts` and face-analysis photo handlers; test size limits in staging parity. |
| AI generation / long requests | NOT TESTED | Try-on and face-analysis generation routes bundle, but request duration and polling behavior were not exercised. Vercel `maxDuration` settings have no Phase A equivalent. |
| Store / Campaign | PARTIAL | `/en/store` loaded, but DB-backed store sessions and asset flows were not tested. No storage migration was attempted. |
| Cron / background work | NOT TESTED | Cron route handlers bundle, but Vercel cron schedules and 300-second settings were not ported. |
| Node/runtime APIs | PARTIAL | `nodejs_compat` allowed the build and public preview. Prisma 7's runtime WASM compilation is blocked by the Workers runtime; Node-specific dependency paths need Phase B audit. |

## Blockers

1. Prisma 7 runtime query compiler uses dynamic WASM compilation that fails in the Workers runtime. This blocks DB-backed API, dynamic SEO, admin, and Store parity.
2. The account's Free Worker size limit rejected the measured `3.83 MiB` gzip Worker. No plan upgrade was authorized or performed.
3. Several statically generated dynamic/SEO routes returned 404 in OpenNext preview while returning 200 under standard Next local serving. This blocks claiming full route parity until the adapter/Next 14 path is investigated.

## Warnings

1. Latest `@opennextjs/cloudflare` no longer accepts this repository's Next 14 dependency range; the Phase A adapter is pinned to `1.15.1` and Next to `14.2.35`.
2. The OpenNext `/api/mcp` bundle produced an esbuild suspicious-nullish-coalescing warning.
3. Existing lint and browser-data warnings remain unchanged.
4. Full auth, Stripe, Blob, uploads, AI, cron, and Store/ Campaign parity were intentionally not tested.

## Required Phase B work

- Choose and validate a Workers-compatible Prisma/Neon runtime path without copying production credentials or migrating Neon.
- Resolve the Worker size limit using an authorized account plan or a measured bundle-reduction plan.
- Investigate the OpenNext dynamic/SEO route 404s and decide whether the supported path requires a Next 15+ upgrade; any upgrade must be a separate regression-reviewed change.
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
