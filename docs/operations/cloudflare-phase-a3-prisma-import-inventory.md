# Phase A.3 Prisma Import Inventory

Generated from the source tree before the direct-Neon migration. This is a static inventory of imports and query tokens; it is not a substitute for runtime authorization tests.

## Classification

- `PUBLIC_READ`: public read-only route/page.
- `PUBLIC_WRITE`: consumer route with persistence or authenticated state.
- `AUTH`: session/authentication boundary.
- `ADMIN`, `STORE`, `CAMPAIGN`, `MCP/MERCHANT`, `PAYMENT`, `BACKGROUND`, `OTHER`: route/domain boundaries from file and caller topology.

The current OpenNext default server function includes all route consumers, so every runtime import below is a potential Cloudflare bundle root. `YES` in the tenant column means the file contains an apparent user/merchant/session boundary token and requires route-level authorization review.

## Consumers of `src/lib/prisma.ts`

| Exact file | Class | Models | Operations | Read/write | Transaction | Tenant boundary |
| --- | --- | --- | --- | --- | --- | --- |
| `src/app/(admin)/admin/dashboard/page.tsx` | ADMIN | user, faceShapeDetection, faceAnalysisTask, payment | count, findMany | READ | NO | YES |
| `src/app/(admin)/admin/data-stats/page.tsx` | ADMIN | glassesFrame, glassesCategory, faceShape, frameFaceShapeRecommendation, frameCategoryAssociation | count, findMany | READ | NO | NO/unknown |
| `src/app/(admin)/admin/face-analysis/page.tsx` | ADMIN | faceAnalysisTask | findMany, count | READ | NO | YES |
| `src/app/(admin)/admin/face-shape-detector/page.tsx` | ADMIN | faceShapeDetection | findMany, count, groupBy | READ | NO | NO/unknown |
| `src/app/(admin)/admin/orders/[id]/page.tsx` | ADMIN | payment | findUnique | READ | NO | YES |
| `src/app/(admin)/admin/orders/page.tsx` | ADMIN | payment | findMany, count | READ | NO | NO/unknown |
| `src/app/(admin)/admin/store/merchants/[id]/experiences/[experienceId]/page.tsx` | ADMIN | merchant, experience, merchantFrame | findUnique, findFirst, findMany | READ | NO | YES |
| `src/app/(admin)/admin/store/page.tsx` | ADMIN | storeAsset, tryOnTask, storeOrphanBlob, merchant | count, findFirst, findMany | READ | NO | YES |
| `src/app/(admin)/admin/try-on/page.tsx` | ADMIN | tryOnTask | findMany, count | READ | NO | YES |
| `src/app/(admin)/admin/users/[id]/page.tsx` | ADMIN | user | findUnique | READ | NO | YES |
| `src/app/(admin)/admin/users/page.tsx` | ADMIN | user | findMany, count | READ | NO | NO/unknown |
| `src/app/[locale]/(main)/brand/[brand]/page.tsx` | PUBLIC_READ | glassesFrame | findMany, findFirst | READ | NO | NO/unknown |
| `src/app/[locale]/(main)/category/[category]/page.tsx` | PUBLIC_READ | glassesCategory, glassesFrame | findMany, findFirst | READ | NO | NO/unknown |
| `src/app/[locale]/(main)/share/[id]/page.tsx` | PUBLIC_READ | tryOnTask | findUnique | READ | NO | NO/unknown |
| `src/app/[locale]/(main)/try/[slug]/page.tsx` | PUBLIC_READ | glassesFrame | findMany, findUnique | READ | NO | NO/unknown |
| `src/app/[locale]/(main)/user/[username]/page.tsx` | PUBLIC_READ | user, tryOnTask | findFirst, findMany | READ | NO | YES |
| `src/app/api/admin/blob/cleanup/route.ts` | ADMIN | tryOnTask, glassesFrame, user | findMany | READ | NO | NO/unknown |
| `src/app/api/admin/blob/list/route.ts` | ADMIN | tryOnTask | findMany | READ | NO | NO/unknown |
| `src/app/api/admin/blob/stats/route.ts` | ADMIN | tryOnTask, glassesFrame, user | findMany | READ | NO | YES |
| `src/app/api/admin/face-analysis/[id]/route.ts` | ADMIN | faceAnalysisTask | findUnique, delete | WRITE | NO | NO/unknown |
| `src/app/api/admin/frames/[id]/route.ts` | ADMIN | glassesFrame | findUnique, update, delete | WRITE | NO | NO/unknown |
| `src/app/api/admin/frames/route.ts` | ADMIN | glassesFrame | findMany, count, findUnique, create | WRITE | NO | NO/unknown |
| `src/app/api/admin/import/route.ts` | ADMIN | glassesFrame | upsert, findUnique, create | WRITE | NO | NO/unknown |
| `src/app/api/admin/promote-self/route.ts` | ADMIN | user | update | WRITE | NO | YES |
| `src/app/api/admin/seed/route.ts` | ADMIN | glassesFrame, user, tryOnTask | count, create | WRITE | NO | NO/unknown |
| `src/app/api/admin/store/merchants/[id]/experiences/[experienceId]/frames/route.ts` | ADMIN | experience, merchantFrame | findFirst, findMany | READ | NO | YES |
| `src/app/api/admin/store/merchants/[id]/experiences/[experienceId]/route.ts` | ADMIN | experience, merchantFrame | findFirst, findMany | READ | NO | YES |
| `src/app/api/admin/try-on/[id]/fetch-result/route.ts` | ADMIN | tryOnTask | findUnique | READ | NO | YES |
| `src/app/api/admin/try-on/[id]/route.ts` | ADMIN | tryOnTask | findFirst, delete | WRITE | NO | NO/unknown |
| `src/app/api/admin/try-on/route.ts` | ADMIN | tryOnTask | findMany, count | READ | NO | YES |
| `src/app/api/auth/refresh-token/route.ts` | AUTH | user | findUnique | READ | NO | YES |
| `src/app/api/cron/cleanup-expired-tasks/route.ts` | BACKGROUND | user | findMany, update | WRITE | NO | YES |
| `src/app/api/cron/retention-notifications/route.ts` | BACKGROUND | user | findMany, update | WRITE | NO | NO/unknown |
| `src/app/api/face-analysis/[id]/photo/route.ts` | PUBLIC_WRITE | faceAnalysisTask | findFirst | READ | NO | YES |
| `src/app/api/face-analysis/[id]/route.ts` | PUBLIC_WRITE | faceAnalysisTask | deleteMany | WRITE | NO | YES |
| `src/app/api/face-analysis/history/route.ts` | PUBLIC_WRITE | faceAnalysisTask | findMany, count | READ | NO | YES |
| `src/app/api/face-analysis/submit/route.ts` | PUBLIC_WRITE | faceAnalysisTask | findUnique | READ | NO | YES |
| `src/app/api/face-analysis/top-picks-try-on/route.ts` | PUBLIC_WRITE | tryOnTask, faceAnalysisTask | findFirst, findMany | READ | NO | YES |
| `src/app/api/face-shape-detector/usage/route.ts` | PUBLIC_WRITE | faceShapeDetection | create | WRITE | NO | NO/unknown |
| `src/app/api/frames/route.ts` | PUBLIC_WRITE | glassesFrame | findMany, create | WRITE | NO | NO/unknown |
| `src/app/api/glasses/brands/route.ts` | PUBLIC_READ | glassesFrame | findMany | READ | NO | NO/unknown |
| `src/app/api/glasses/categories/route.ts` | PUBLIC_READ | glassesCategory | findMany | READ | NO | NO/unknown |
| `src/app/api/glasses/face-shapes/route.ts` | PUBLIC_READ | faceShape | findMany | READ | NO | NO/unknown |
| `src/app/api/glasses/frames/[id]/route.ts` | PUBLIC_READ | glassesFrame | findUnique | READ | NO | NO/unknown |
| `src/app/api/glasses/frames/route.ts` | PUBLIC_READ | glassesFrame | findMany | READ | NO | NO/unknown |
| `src/app/api/mcp/oauth/authorize/route.ts` | AUTH | merchantMembership | findMany | READ | NO | YES |
| `src/app/api/payment/conversion/route.ts` | PAYMENT | payment | findUnique | READ | NO | YES |
| `src/app/api/payment/create-portal-session/route.ts` | PAYMENT | payment | findFirst | READ | NO | YES |
| `src/app/api/payment/create-session/route.ts` | PAYMENT | faceAnalysisTask, payment | findFirst, create | WRITE | NO | YES |
| `src/app/api/payment/history/route.ts` | PAYMENT | payment | findMany, count | READ | NO | YES |
| `src/app/api/payment/webhook/route.ts` | PAYMENT | payment, user | updateMany, update, findFirst | WRITE | YES | YES |
| `src/app/api/share/[id]/route.ts` | PUBLIC_READ | tryOnTask | findUnique | READ | NO | NO/unknown |
| `src/app/api/try-on/[id]/feedback/route.ts` | OTHER | tryOnTask | findUnique, update | WRITE | NO | YES |
| `src/app/api/try-on/[id]/route.ts` | OTHER | tryOnTask | findUnique, delete | WRITE | NO | YES |
| `src/app/api/try-on/glasses/compare/current/route.ts` | PUBLIC_READ | tryOnTask | findFirst, findMany | READ | NO | YES |
| `src/app/api/try-on/glasses/style-explorer/current/route.ts` | PUBLIC_READ | tryOnTask | findFirst, findMany | READ | NO | YES |
| `src/app/api/try-on/history/route.ts` | OTHER | tryOnTask | findMany, count | READ | NO | YES |
| `src/app/api/try-on/pending-tasks/route.ts` | OTHER | tryOnTask | findFirst | READ | NO | YES |
| `src/app/api/try-on/poll/route.ts` | OTHER | tryOnTask | findUnique | READ | NO | YES |
| `src/app/api/user/balance/route.ts` | PUBLIC_READ | user | findUnique | READ | NO | YES |
| `src/app/sitemaps/dynamic.xml/route.ts` | OTHER | glassesFrame, faceShape, glassesCategory | findMany | READ | NO | NO/unknown |
| `src/components/dashboard/RecentFaceAnalysesAsync.tsx` | OTHER | faceAnalysisTask | findMany | READ | NO | YES |
| `src/components/dashboard/RecentTryOnsAsync.tsx` | OTHER | tryOnTask | findMany | READ | NO | YES |
| `src/lib/api-auth.ts` | AUTH | user | findUnique | READ | NO | YES |
| `src/lib/auth.ts` | AUTH | user | findUnique | READ | NO | YES |
| `src/lib/cron/sync-pending-consumer-tasks.ts` | BACKGROUND | tryOnTask | findMany | READ | NO | YES |
| `src/lib/face-analysis-service.ts` | PUBLIC_WRITE | faceAnalysisTask | create, update, findUnique, findFirst, updateMany | WRITE | NO | YES |
| `src/lib/generation/reconcile-stale-consumer-dispatch.ts` | BACKGROUND | tryOnTask | updateMany | WRITE | NO | NO/unknown |
| `src/lib/mocks/auth.ts` | OTHER | indirect | indirect | READ | NO | YES |
| `src/lib/quota.ts` | OTHER | indirect | indirect | WRITE | YES | YES |
| `src/lib/retention/cleanup-expired-tryon-tasks.ts` | BACKGROUND | tryOnTask | findMany, update, delete | WRITE | NO | YES |
| `src/lib/store-discovery-sitemap.ts` | OTHER | merchant | findMany | READ | NO | NO/unknown |
| `src/lib/tryon-service.ts` | OTHER | tryOnTask | findUnique, create, update, updateMany | WRITE | NO | YES |
| `src/modules/merchant/application/merchant-access.ts` | MCP/MERCHANT | merchantMembership | indirect | READ | NO | YES |
| `src/modules/merchant/application/merchant-agent-credentials.ts` | MCP/MERCHANT | merchantAgentCredential, merchantOperationAudit | findMany, findUnique, update, create | WRITE | YES | YES |
| `src/modules/merchant/application/merchant-agent-rate-limit.ts` | MCP/MERCHANT | storeAbuseCounter | upsert | WRITE | NO | YES |
| `src/modules/merchant/application/merchant-catalog-source-intake.ts` | MCP/MERCHANT | merchantFrame | findMany | READ | NO | YES |
| `src/modules/merchant/application/merchant-control-center.ts` | MCP/MERCHANT | merchant, experience, merchantSession, merchantAgentCredential | findUnique, findMany, count | READ | NO | YES |
| `src/modules/merchant/application/merchant-memberships.ts` | MCP/MERCHANT | merchantMembership | create, findMany | WRITE | YES | YES |
| `src/modules/merchant/application/merchant-oauth.ts` | MCP/MERCHANT | merchantOAuthDcrCounter, merchantOAuthClient, merchantOAuthAuthorizationRequest, merchantMembership, merchantOAuthAuthorizationCode, merchantOAuthRefreshToken, merchantOAuthAccessToken, merchantOAuthAuthorization, merchantOperationAudit | upsert, create, findUnique, update, updateMany, findMany, findFirst | WRITE | YES | YES |
| `src/modules/merchant/application/merchant-onboarding.ts` | MCP/MERCHANT | merchantFrame, merchant, experience | findMany, findUnique, findFirst, count, update | WRITE | YES | YES |
| `src/modules/merchant/application/merchant-provisioning.ts` | MCP/MERCHANT | merchantMembership | create | WRITE | YES | YES |
| `src/modules/merchant/application/update-merchant-profile.ts` | MCP/MERCHANT | merchant | findUnique, update | WRITE | NO | YES |
| `src/modules/store/application/campaign-service.ts` | STORE | experience, merchant, merchantFrame | findFirst, findUnique, findMany, create, update | WRITE | YES | YES |
| `src/modules/store/application/cleanup-store-orphan-blobs.ts` | STORE | storeOrphanBlob | upsert, findMany, update | WRITE | NO | YES |
| `src/modules/store/application/get-experience-admin.ts` | STORE | merchant, experience, merchantFrame, merchantSession, merchantEvent, merchantIntent | findUnique, findMany, count, groupBy | READ | NO | YES |
| `src/modules/store/application/get-merchant-attribution.ts` | STORE | merchantSession | groupBy | READ | NO | YES |
| `src/modules/store/application/get-merchant-insights.ts` | STORE | experience, merchantSession, merchantEvent, merchantIntent, merchantFrame | findFirst, count, findMany | READ | NO | YES |
| `src/modules/store/application/merchant-analytics.ts` | STORE | experience, merchantSession, merchantEvent, merchantIntent, merchantFrame | findFirst, findMany, groupBy | READ | NO | YES |
| `src/modules/store/application/poll-store-tryon.ts` | STORE | tryOnTask | findFirst | READ | NO | YES |
| `src/modules/store/application/public-experience-mutations.ts` | STORE | experience | findFirst, update | WRITE | YES | YES |
| `src/modules/store/application/public-route-admission.ts` | STORE | merchant, experienceFrame | findMany, groupBy | READ | NO | NO/unknown |
| `src/modules/store/application/reconcile-stale-store-claims.ts` | BACKGROUND | tryOnTask | findMany, updateMany | WRITE | NO | YES |
| `src/modules/store/application/record-compare-started.ts` | STORE | tryOnTask | count | READ | NO | YES |
| `src/modules/store/application/resolve-store-tryon-result.ts` | STORE | tryOnTask | findFirst | READ | NO | YES |
| `src/modules/store/application/runtime.ts` | STORE | indirect | indirect | READ | NO | YES |
| `src/modules/store/application/settle-store-usage.ts` | STORE | indirect | indirect | WRITE | YES | YES |
| `src/modules/store/application/store-abuse-limits.ts` | STORE | storeAbuseCounter | upsert | WRITE | NO | YES |
| `src/modules/store/application/store-task-leases.ts` | STORE | tryOnTask | findUnique, updateMany | WRITE | NO | YES |
| `src/modules/store/application/submit-store-tryon.ts` | STORE | tryOnTask, user, storeAbuseCounter | findMany, findUnique, updateMany, upsert | WRITE | YES | YES |
| `src/modules/store/infrastructure/assets/vercel-blob-asset-store.ts` | STORE | storeAsset | create, findFirst, updateMany, findMany | WRITE | NO | YES |
| `src/modules/store/infrastructure/cron/sync-pending-store-tasks.ts` | BACKGROUND | tryOnTask | findMany | READ | NO | YES |
| `src/modules/store/infrastructure/generation/persist-store-grsai-result.ts` | STORE | tryOnTask | updateMany, findUnique | WRITE | NO | YES |
| `src/modules/store/infrastructure/generation/store-generation-adapter.ts` | STORE | tryOnTask | findUnique, findFirst | READ | NO | YES |
| `src/modules/store/infrastructure/generation/submit-store-tryon-task.ts` | STORE | tryOnTask | create, findFirst, findUnique, updateMany | WRITE | NO | YES |
| `src/modules/store/infrastructure/prisma/experience-repository.ts` | STORE | experience | findFirst, findMany | READ | NO | YES |
| `src/modules/store/infrastructure/prisma/frame-repository.ts` | STORE | merchantFrame | findMany, findFirst | READ | NO | YES |
| `src/modules/store/infrastructure/prisma/intent-event-usage-repository.ts` | STORE | merchant, merchantSession, merchantIntent, merchantEvent, merchantUsageLedger | findUnique, findFirst, create, findMany, count | WRITE | NO | YES |
| `src/modules/store/infrastructure/prisma/merchant-repository.ts` | STORE | merchant | findUnique, findMany | READ | NO | YES |
| `src/modules/store/infrastructure/prisma/session-repository.ts` | STORE | merchantSession | create, findFirst, updateMany | WRITE | NO | YES |

**Count:** 110 direct singleton consumers.

## Initial root conclusions

- **Required globally today:** the default OpenNext function has a single shared handler, and `src/lib/auth.ts` plus public/store/admin route modules are all statically reachable from that handler. Middleware itself uses JWT and does not import `src/lib/prisma.ts`.
- **Route-specific:** most Prisma consumers are route-local reads/writes, but route-locality is not enough while OpenNext emits one default function.
- **Avoidable global imports:** the store barrel/runtime composition and NextAuth Prisma adapter are the first shared boundaries to isolate; public glasses and public Store reads can use provider-specific direct-Neon modules without changing Vercel imports.
- **Security boundary:** no inventory entry authorizes a direct-Neon rewrite by itself; user/merchant ownership, status filters, and write/transaction semantics must remain unchanged for any migrated path.

## Direct `@prisma/client` imports outside the singleton list

These files import Prisma enums/types/client symbols without directly importing `src/lib/prisma.ts`:

- `src/components/admin/FaceAnalysisActivityTable.tsx`
- `src/components/admin/OrderControls.tsx`
- `src/components/admin/TryOnActivityTable.tsx`
- `src/lib/compare-tryon-server.ts`
- `src/lib/compare-tryon.ts`
- `src/lib/generation/tryon-result-persist.ts`
- `src/lib/generation/tryon-types.ts`
- `src/lib/mocks/index.ts`
- `src/lib/prisma.ts`
- `src/modules/store/infrastructure/prisma/merchant-sponsored-usage-repository.ts`
- `src/types/index.ts`

The runtime-value imports in this list are mostly `TaskStatus`, `TryOnType`, and `PaymentStatus` enum references. Type-only imports are erased by the compiler; runtime-value imports must either move to domain constants or be covered by the provider-specific Cloudflare build boundary before Prisma can be absent from the Worker.
