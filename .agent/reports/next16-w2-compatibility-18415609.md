# W2 Next.js 16 Compatibility Migration Evidence

**Status:** `W2 STATUS: READY FOR REGRESSION`

## Scope and checkout

- Repository: `franksunye/VisuTry`
- Worktree: `/Users/yesun/.codex/worktrees/next16-w2-compatibility/visutry`
- Branch: `codex/next16-compatibility-assessment`
- Base SHA: `9d818e42b7e4b126f67a93945a45e99b0229247e`
- Migration commit: `184156092eba48c565d406a99f63d0d646eb0854`
- Runtime: Node `22.23.3`, npm `10.9.9`
- Database: local PostgreSQL only, `127.0.0.1:5433/visutry_local`

No production credentials, PR, merge, deployment, or W3/W4 work was performed.

## Dependency and runtime migration

- Next `16.3.7`, React/React DOM `19.2.0`
- OpenNext Cloudflare `1.20.7`, Wrangler `4.144.0`
- ESLint `9.39.5`, `eslint-config-next` `16.3.7`, flat config in `eslint.config.mjs`
- `@types/react`/`@types/react-dom` `19.3.0`
- `lucide-react` `0.475.0` for React 19 peer compatibility
- NextAuth `4.24.11` and Prisma `7.1.0` major versions unchanged
- Cache Components/PPR and React Compiler were not enabled

## Async request API coverage

- Official `next-async-request-api` codemod: 808 files processed, 657 unmodified, 151 `OKK`, 0 errors, 0 skipped.
- The single remaining codemod marker in the merchant page was manually completed with awaited `headers()`.
- No `@next-codemod-error` or `@next-codemod-ignore` markers remain.
- Route/page tests were updated to pass Promise-based `params` and `searchParams` fixtures.
- Jest received only a test-environment Fetch/Streams/`structuredClone` bridge; product runtime behavior was not changed.

## Cache and invalidation contract

- All 17 `revalidateTag` call sites were reviewed and use `{ expire: 0 }`, preserving the prior Next 14 immediate-invalidation behavior.
- No blind `'max'` migration was introduced.
- Store/Campaign invalidation still keeps bounded cache planning, `revalidatePath`, and Cloudflare public HTML tag purging through `purgePublicHtmlTags`.
- Next 16 static segment config constraints were handled with literal values: the existing 7-day ISR values are now `604800`; catalog routes keep literal `dynamicParams = false` and retain page-level `notFound()` guards.

## Proxy and build configuration

- `src/middleware.ts` was migrated to `src/proxy.ts`; the exported handler is `proxy` and the existing matcher/config contract is retained.
- Webpack is explicit for `build`, `build:ci`, Cloudflare Next build, analyzer, and server/browser builds.
- `next lint` was replaced with ESLint CLI as required by Next 16. The existing source lint scope is preserved as `eslint src`.

## Validation evidence

| Check | Result |
|---|---|
| `npm ci` | PASS |
| Local DB reset/seed | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; 0 errors, 91 existing warnings |
| Critical tests | 7 suites, 34/34 passed |
| Full unit tests | 306/306 suites; 1,974 passed, 1 skipped |
| `npm run build:ci` | PASS; Next 16.3.7 Webpack |
| `npm run build:cloudflare:opennext` | PASS; worker generated, 1,559 static-cache files populated |
| `npx next build --turbopack` | PASS; separately verified, non-blocking |
| Webpack dev startup | PASS; Ready in 258ms; `/en` 200 and `/api/health` 200 |
| Segment-config/OpenNext contract tests | 3 suites, 13/13 passed |

Remaining non-blocking notices are the pre-existing image/navigation/Hook lint warnings, stale Browserslist data, and OpenNext's warning that Node.js proxy support is experimental on Cloudflare.

## Handoff

W2 is complete and ready for the requested Regression/OpenNext/Cache Contract Lead Review. Stop here and do not enter W3 until Lead Review explicitly releases it.
