# Merchant Brand Kit G1-C — Release and QA Contract

Parent: #360, #356. Draft PR: #366. Base: merged G1-B.

## Ownership & capability
- Merchant scope: OWNER can upload/reset one logo/wordmark, select/reset one of six fixed AA-safe accent colors. Workspace display name/website keep existing profile flow.
- Experience scope: OWNER can upload/reset one Store or Campaign hero. DRAFT saves are private; ACTIVE saves require user confirmation **also enforced server-side**. ARCHIVED/ENDED remain read-only.
- No arbitrary remote URL ingestion, redirect chasing, template builder, theme engine, or separate hero persistence path. Existing ExperienceCommandService provides tenant-bounded update + cache invalidation.
- Public model is unchanged: all shopper surfaces consume Merchant.logoUrl/accentColor and Experience.heroAssetUrl; Result reads the linked Merchant brand and uses an expiring private token.

## Upload safety
- 4 MiB maximum; PNG/JPEG/static WebP with matching header and MIME. Dimensions are capped to 4096×4096 / 12 MP. Logo aspect 1:4–5:1; hero aspect 1.25:1–3.5:1 and width >=640 px.
- Only tenant-namespace, versioned immutable Vercel Blob HTTPS objects are accepted for brand writes. The system does **not fetch external image URLs**. Failed attach compensates by deleting newly uploaded object.
- SVG, animated WebP, private network hosts, URL redirect tricks and cross-tenant media paths are rejected. Original image bytes are public: operators must avoid uploading personal/private images.
- Merchant metadata and public HTML use existing per-merchant / per-Experience invalidation. No schema migration.

## Required G1-C verification (not implied by generic CI green)
1. Signed-in OWNER Settings → color/logo upload & reset → read-back, before/after 1440 and 390; ADMIN/no membership/mismatched merchant forbidden.
2. Store and Campaign Hero self-service: DRAFT private save and ACTIVE explicit confirmation, clear to fallback, desktop/mobile/iPad, contrast and bright/dark imagery; invalid cross-tenant hero and malicious URL rejected.
3. Public Store/Campaign discovery, interactive Try-On, Result, share and Kiosk have consistent logo/accent; Experience-specific hero does **not** leak to other Experiences.
4. No new DB migrations, no Production data mutation, no external URL fetch/paid provider, no accidental publish; cache invalidation and natural image sizes checked.
5. Genuine image decode in Chromium (naturalWidth/naturalHeight > 1), responsive crop and failed-media fallback. Record all REQUIRED/EXECUTED/SKIP cases with exact PR HEAD in #360.

G2 retains Production authenticated user journeys and commercial rollout gate. A PASS in PR static/browser check does not imply full Local E2E PASS.
