# P0.4 — Static/Dynamic Delivery Architecture Audit

Date: 2026-09-10
Branch: `codex/static-dynamic-architecture-audit`
Base: `origin/main` at `f26df773b0c8631e15d438bf3313a8759cdb648b`

## Executive verdict

**ARCHITECTURE VERDICT: OVERCOMPLICATED**

The application is not fundamentally unable to produce static public content. The
Next build does generate a large static artifact set. The main architectural
problem is boundary placement: the `(main)` layout wraps public SEO pages in a
global auth/session client boundary, while the same layout also contains app
navigation and authenticated UI. This preserves static server output but causes
anonymous public visits to execute client session work and creates a second
request stream that the static-page contract does not need.

The other major boundary is media: immutable editorial assets and catalog/blob
images are both represented through `next/image`, although their ownership and
runtime transformation needs are different. Cloudflare is already constrained to
12 non-Next asset/API routes in the repository contract; it should remain an edge
security/DNS layer, not a second Next rendering system.

## Audit method and evidence

- The App Router contains **97 page files**, **108 route-handler files**, and **6
  layouts**. `public/robots.txt` is a separate static asset.
- A direct `next build` was run with local placeholder values for required build
  environment variables. The normal `npm run build` script was not used because it
  also runs database migrations. Next.js was 14.2.35 on the bundled Node 24 runtime.
- The build compiled, type-checked, linted, generated **1,665/1,665 static page
  instances**, and finalized successfully. The build emitted 1,543 HTML and 1,543
  RSC concrete artifacts under `.next/server/app`.
- Relevant generated artifacts inspected: `.next/prerender-manifest.json`,
  `.next/routes-manifest.json`, `.next/build-manifest.json`,
  `.next/app-build-manifest.json`, and `.next/server/app-paths-manifest.json`.
- `prerender-manifest.json` contains 1,548 concrete routes and 69 dynamic route
  records. Its concrete route entries are overwhelmingly
  `initialRevalidateSeconds: false`; the one explicit concrete ISR route is
  `/sitemaps/dynamic.xml` at 604,800 seconds. The two Store/Campaign pages have
  empty `generateStaticParams()` and `revalidate = 7 days`, so they are on-demand
  ISR route contracts rather than build-time snapshots.
- The Next route table was captured. Because localized App Router patterns with a
  parent `generateStaticParams()` can still be printed with `●` while their page
  module exports `force-dynamic`, the final mode below uses the source export plus
  concrete artifact/manifest evidence. The symbol alone is not treated as proof.
- `npm run typecheck`: PASS. `npm run lint`: PASS with existing warnings, mostly
  `<img>` recommendations and hook dependency warnings. No source code was changed.

### Counting convention

The required mode counts below are **route patterns**, not the 1,665 locale and
parameter-expanded concrete instances. They cover 66 `[locale]/(main)` pages, 9
business marketing pages, 2 Store/Campaign pages, 2 merchant pages, 4 sitemap
route handlers, and `public/robots.txt`: 84 user-facing delivery patterns total.
Admin pages and API handlers are listed separately because they are application
surfaces rather than public content routes.

## Required summary

### PUBLIC ROUTES

| Mode | Count | Route-pattern scope |
|---|---:|---|
| **STATIC** | **73** | 60 main-group SSG/static patterns, 9 business marketing pages, `sitemap.xml`, `sitemaps/core.xml`, `sitemaps/blog.xml`, and `robots.txt` |
| **ISR** | **3** | `/[locale]/store/[merchantSlug]`, `/[locale]/c/[merchantSlug]/[experienceSlug]`, and `/sitemaps/dynamic.xml` |
| **DYNAMIC** | **8** | `discover`, `style-explorer`, demo frame, share, public user profile, auth sign-in, and the two merchant workspace pages |

The static count includes static application shells such as dashboard and face
analysis. Their server HTML is static, but their product behavior is dynamic on
the client. That distinction is important: a static shell is useful, but it must
not force the auth/session provider onto unrelated public SEO pages.

### ACCIDENTAL DYNAMIC ROUTES

**Server-rendered accidental dynamic routes: 0 proven.** The six request-time
public routes are explained by either database-backed public content or auth/work-
space behavior. They are not evidence of an accidental static-to-dynamic leak.

**Accidental client/runtime dependency: 44 public SEO route patterns.** Those
routes are static at the Next server layer but inherit a client auth/session
runtime through `src/app/[locale]/(main)/layout.tsx`.

Top causes:

1. `ConsumerSessionBoundary` wraps the entire `(main)` layout, despite its own
   comment saying it is intended only for pricing, try-on, and dashboard.
2. `SessionProvider` mounts `next-auth`'s `SessionProvider`; anonymous clients
   therefore request `/api/auth/session`, with a five-minute refresh interval and
   focus refresh enabled.
3. `Header` calls `useSession()` and renders `LoginButton`/`UserMenu`, so the
   navigation shell currently requires the provider even on static SEO pages.
4. `PaymentConversionTracker` also calls `useSession()` but only has meaningful
   work on payment-return URLs; mounting it on every main page is unnecessary.

### ACCIDENTAL ISR ROUTES

**0 consumer SEO routes proven accidental.** The catalog-backed Store/Campaign
   routes use independent merchant publication state and on-demand
   `revalidatePath`/tag invalidation; their seven-day safety net is an intentional
   ISR contract. `sitemaps/dynamic.xml` reads live catalog/discovery state and is
   also a justified ISR route. The pure SEO families (`blog`, `glasses-guide`,
   `brand`, `style`, `sunglasses-for`, face-shape pages, and informational pages)
   are declared `force-static` and have no periodic ISR clock.

## Route inventory

The following is the complete route inventory at family level. Individual API
handlers are enumerated by domain below; no API is treated as public static data
unless its handler explicitly proves that behavior.

| Path family / source | Product purpose | Expected mode | Actual mode | Auth / request dependency | Data / revalidate / params | Client, RSC, prefetch, image, runtime |
|---|---|---|---|---|---|---|
| `/:locale`; `blog`, `blog/*`, `blog/tag/*`; `glasses-guide`, `glasses-guide/*`; `brand/*`; `style/*`; `sunglasses-for/*`; `face-shapes*`; `hairstyles-for*`; `category/*`; `try/*`; informational pages | Deploy-time SEO and marketing content | STATIC | Static SSG where admitted | No server `cookies()`/`headers()`/session read in page source | `force-static`; static config/data; `generateStaticParams()` on detail families. `category/*` and `try/*` are closed when `PROGRAMMATIC_SEO_ENABLED` is false, so this build generated no parameter instances for those two optional families | Server output is static, but `(main)/layout` injects client auth. RSC is available for Next navigation. Several links omit `prefetch={false}`. SEO visuals use local imported or `/public` assets, while catalog-detail images can be DB URLs. No per-request Vercel runtime is required by the page itself |
| `/:locale/face-analysis`, `face-shape-detector`, `pricing`, `dashboard`, `dashboard/history`, `try-on`, `try-on/*`, `try-on/glasses/compare`, `payments`, `cancel`, `success`, `try-glasses-on-photo` | Consumer application entry points and static landing shells | DYNAMIC application behavior, preferably static shell + client gate where safe | Static SSG shell for the inspected pages; client auth/API behavior at runtime | `useSession()` in client gates; search params on payment/cancel/success and try-on flows | Explicit `force-static` on most shells; client calls use APIs such as payment, history, quota, or try-on endpoints | RSC/client navigation is useful after entering the application. Images include local marketing visuals and user/catalog media. Vercel runtime is required for the APIs and user data, not for the anonymous shell |
| `/:locale/discover` | Public discovery surface backed by Store/Campaign records | DYNAMIC or ISR if product chooses a cache contract | DYNAMIC (`force-dynamic`) | Prisma-backed `getDiscoverContent()` through the Store runtime | Reads active merchants, campaigns, and frames; no static params | Public page can be linked from SEO content, but it is not a deploy-only asset. Store images are data-backed. Vercel runtime is required today |
| `/:locale/demo/frames/:slug` | First-party demo frame detail | DYNAMIC today; STATIC/ISR only after inventory ownership is decided | DYNAMIC (`force-dynamic`) | Prisma `merchantFrame` query in page and metadata | `generateStaticParams()` lists demo slugs but `dynamicParams = true`; active inventory is DB state | `next/image` consumes a DB image URL. Runtime is required today; this is a candidate for build-time demo inventory only if the inventory becomes immutable |
| `/:locale/share/:id`; `/:locale/user/:username` | Public user-generated result/profile surfaces | DYNAMIC | DYNAMIC by DB access | Prisma queries for try-on tasks/users; no session provider is required for the page data | No static params; data changes independently of deploy | User-generated media is served through protected/public media endpoints or direct `<img>` paths. Runtime and privacy checks are required |
| `/:locale/store/:merchantSlug`; `/:locale/c/:merchantSlug/:experienceSlug` | Public merchant Store/Campaign discovery | ISR | On-demand ISR: `revalidate = 604800`, `dynamicParams = true`, empty build params | Prisma/public admission and discovery queries; publication writes invalidate | Content changes independently of deploy and successful writes already invalidate; seven-day clock is a safety net, not deploy-only content | Client commerce launcher, RSC navigation, and merchant/blob images are required for the shopping flow. Do not apply the consumer SEO static contract blindly |
| `/:locale/business/*` | B2B marketing pages | STATIC | Static SSG | No page-level auth/request dependency found | Locale static params; deploy-time copy | Client presentation only; no application runtime for the document is required |
| `/:locale/merchant`, `/:locale/merchant/purchase` | Merchant workspace/onboarding/billing | DYNAMIC | DYNAMIC (`force-dynamic`) | `getServerSession()`, `headers()`, search params, merchant DB reads | Request-specific workspace, continuation, and billing state | Client merchant controls and API calls; Vercel runtime required; must not share HTML cache with public content |
| `/sitemap.xml`, `/sitemaps/core.xml`, `/sitemaps/blog.xml`, `public/robots.txt` | Crawler control and deploy-time sitemap surfaces | STATIC | Static; `sitemaps/dynamic.xml` is the exception below | No auth; route handlers explicitly `force-static` where present | Static XML route handlers; direct public robots asset | No client/RSC. Vercel can serve the generated/static response; no application runtime is required for core/blog XML |
| `/sitemaps/dynamic.xml` | Catalog and public Store/Campaign sitemap | ISR | ISR, 7 days | Prisma catalog reads and public discovery sitemap reads | Explicit `revalidate = 604800`; changes independently of deploy | No client/RSC; Vercel runtime is needed when regenerated |
| `/api/health` | Health probe | STATIC response | Static route handler | None for response | Explicit build-static behavior in build output | No client/RSC; no user data |
| `/api/auth/*`, `/api/payment/*`, `/api/face-analysis/*`, `/api/try-on/*`, `/api/store/sessions/*`, `/api/merchant/*` | Authenticated/user-specific workflows | DYNAMIC | Dynamic route handlers | Sessions, cookies, auth checks, request body, DB, provider APIs | Request-specific; no HTML cache contract | APIs are the runtime boundary; no public HTML caching |
| `/api/admin/*`, `/api/cron/*`, `/api/mcp*`, `/api/debug/*` | Admin, scheduled, integration, and diagnostics | DYNAMIC | Dynamic route handlers | Admin/auth/token/request checks and DB/provider work | Request-specific | Vercel runtime required; excluded from public route optimization |
| `/api/glasses/*`, `/api/share/*`, `/api/business/*`, `/api/agent/*`, `/api/analytics/*` | Public catalog, share, lead, agent, and telemetry APIs | DYNAMIC | Dynamic route handlers unless a specific handler is static | Request/body/auth varies by handler; catalog data uses cache helpers in some paths | Request-specific API responses; `unstable_cache` in catalog reads is a data-cache layer, not HTML ISR | Vercel runtime/API ownership; no shared HTML cache |
| `/admin/*` | Internal admin UI | DYNAMIC | Mostly dynamic, with a few static shells | Admin middleware JWT plus page/API checks; `searchParams` on list/report pages | Several pages export `force-dynamic`; static-looking shells still sit behind admin middleware | Session provider is appropriate here; Vercel runtime required |

### Generated-param evidence

- Locale layout generates 9 locales: `en`, `id`, `ar`, `ru`, `de`, `ja`, `es`,
  `pt`, and `fr`.
- `glasses-guide/[slug]`, face-shape, hairstyle, sunglasses, and comparison
  families use bounded config arrays and `force-static`; the build expanded these
  into the large concrete artifact set.
- `brand/[brand]` always includes curated brands and only reads database brands
  when `PROGRAMMATIC_SEO_ENABLED=true`.
- `category/[category]` and `try/[slug]` return no build params when programmatic
  SEO is disabled. They are still static contracts when the feature is admitted;
  their current empty build output must not be mistaken for ISR.
- Store/Campaign detail params intentionally return `[]` so a newly published
  merchant route is rendered and cached on demand rather than baking a database
  catalog snapshot into every deploy.

## Static → dynamic leaks and boundary findings

| File / mechanism | Route impact | Reason | Required or accidental |
|---|---|---|---|
| `src/app/[locale]/(main)/layout.tsx` → `ConsumerSessionBoundary` | All 66 main-group page patterns; 44 public SEO patterns are the material impact | The shared layout places an auth-aware client boundary above public content | **ACCIDENTAL** for public SEO; required only for selected app surfaces |
| `src/components/providers/ConsumerSessionBoundary.tsx` → `SessionProvider` | Same 66 main-group patterns | `next-auth` client provider and payment tracker are mounted unconditionally | **ACCIDENTAL** outside auth/app/payment-return routes |
| `src/components/layout/Header.tsx` → `useSession()` | Every page using `(main)/layout` | Auth-aware CTA/user menu makes the global header depend on a session provider | **PARTLY ACCIDENTAL**; keep an auth-free public header variant and an app header variant |
| `src/components/analytics/PaymentConversionTracker.tsx` | Every `(main)` page | It only needs payment-return query parameters and authenticated status, but is mounted globally | **ACCIDENTAL** on ordinary SEO pages |
| `src/app/[locale]/(main)/discover/page.tsx` → `force-dynamic` and Prisma Store runtime | `/discover` | Active merchant/campaign/frame state is read per request | **REQUIRED TODAY**; consider ISR only with an explicit B2B publication contract |
| `src/app/[locale]/(main)/style-explorer/page.tsx` → `force-dynamic`, `searchParams` | `/style-explorer` | Query parameters carry face-analysis continuation/task state and the page is a client workflow gate | **REQUIRED** for this app surface; not an SEO-static page |
| `src/app/[locale]/(main)/demo/frames/[slug]/page.tsx` → Prisma + `force-dynamic` | Demo frame details and metadata | Active demo inventory is stored in the database | **REQUIRED TODAY**, but an architectural candidate for static build data if frozen |
| `src/app/[locale]/(main)/share/[id]/page.tsx`, `user/[username]/page.tsx` → Prisma | Share/profile pages | User-generated/public data changes independently of deploy | **REQUIRED** and privacy-sensitive |
| `src/app/[locale]/merchant/*` → `getServerSession()`, `headers()`, `searchParams` | Merchant workspace/purchase | Workspace, billing, continuation, and origin are request-specific | **REQUIRED** |
| `src/app/sitemaps/dynamic.xml/route.ts` → Prisma + `revalidate` | Dynamic sitemap | Catalog and public discovery entries change outside deploys | **REQUIRED ISR** |
| `src/data/glasses-prisma.ts` → `unstable_cache` via `glasses-catalog-cache` | Catalog-backed build-time pages and APIs | One-hour data-cache reads reduce DB origin load; this is separate from page ISR | **REQUIRED DATA CACHE** where catalog data is live; not a reason to make deploy-only pages ISR |
| `src/middleware.ts` | Root/locale-less redirects and `/admin` auth only; locale-prefixed public pages are excluded | next-intl routing and admin JWT check | **REQUIRED**, and currently a good boundary for locale-prefixed static pages |

No public page in the inspected page tree directly calls `cookies()`, `headers()`,
`connection()`, `noStore()`, or `getServerSession()` except the explicitly
dynamic merchant pages. `useSearchParams()` appears on application/auth/payment
surfaces. `next/image` and client components do not by themselves make a server
route dynamic; they do create client asset/runtime requests.

## AUTH LEAK INTO PUBLIC

**AUTH LEAK INTO PUBLIC: YES.**

The causal code path is:

```text
public /:locale/* document
  → src/app/[locale]/(main)/layout.tsx
  → ConsumerSessionBoundary
  → SessionProvider / next-auth SessionProvider
  → Header.useSession(), LoginButton/UserMenu
  → anonymous /api/auth/session request
```

`PaymentConversionTracker` adds another `useSession()` consumer, although it only
needs to act on payment-return query parameters. Public SEO pages do not need
server session hydration, and the static HTML can show a neutral sign-in CTA.
Authentication should be isolated to an application layout or a narrowly scoped
client island. The report does not implement that change.

## RSC / prefetch audit

**RSC/PREFETCH AMPLIFICATION: PARTLY UNNECESSARY.**

Required:

- authenticated try-on, face-analysis, dashboard, history, payment, and compare
  flows benefit from client navigation and RSC updates;
- an explicit opt-in prefetch can be useful for a small number of high-intent
  application transitions.

Optional or unnecessary on public SEO surfaces:

- the public document itself is already a static artifact;
- large related-content grids should not prefetch every destination by default;
- many direct guide/back links already use `prefetch={false}`, but
  `GrowthFunnelLink` forwards an omitted `prefetch` value to `next/link`, which
  leaves Next's default behavior active at call sites that do not opt out;
- the homepage and guide/detail surfaces link into application routes, but they
  do not need to prefetch every route simply because links are visible.

Existing clean-browser evidence from the prior forensic audit is consistent with
this code: one anonymous `/en` navigation produced 1 document, 4 RSC, 4 prefetch,
7 image, 27 static, and 1 API request; one `/en/style/round-face` navigation
produced 1 document, 2 RSC, 2 prefetch, 6 image, 20 static, and 1 API request.
That is a controlled browser sample, not a production extrapolation, and it does
not prove RSC/prefetch is the direct cause of ISR/FOT reads.

## Image architecture

The inspected public route/component graph uses `next/image`, static `<img>`, and
data-backed image URLs. The categories are:

- **STATIC IMPORT / `/public`:** visual SEO assets, blog covers, marketing slides,
  preset glasses, and other immutable deploy-owned assets. Several visual SEO
  assets are imported from `assets/` and emitted as public paths; they are not
  user-specific.
- **VERCEL BLOB / EXTERNAL:** Store/Campaign hero, merchant logo, and catalog
  frame URLs are data-backed and may be Blob or merchant-origin URLs. These need
  explicit ownership, allowlisting, and a deliberate direct CDN versus transform
  decision.
- **USER GENERATED:** try-on source/result media is handled through application
  media endpoints or direct image elements in user/application components. It
  should not be treated as immutable SEO media.

### Image percentage estimate

The percentage is a **source-placement proxy**, not a request-volume metric. In
the inspected public page/component graph there were 49 `next/image` placement
sites: 7 are request/data-backed catalog, demo, or Store/Blob/external placements;
42 resolve to immutable build/public/config assets.

- **necessary runtime optimization: ~14%** (7/49 data-backed or externally owned
  placements where responsive sizing, allowlisting, or transformation may be
  justified);
- **potentially unnecessary runtime transformation: ~86%** (42/49 immutable
  editorial/marketing/preset assets that can be served as build-time optimized
  files or direct immutable CDN assets).

This does not justify removing `next/image` globally. Large local assets can
still benefit from build-time responsive derivatives and modern formats; the
candidate change is to remove per-request transformation from the immutable subset
after checking actual LCP/bytes and ownership.

## ISR necessity

| Route family | What changes between deploys? | Decision |
|---|---|---|
| Blog, glasses-guide, curated brand, style, sunglasses, face-shape, hairstyle, informational content | Source/config and visual assets change through deploys; page code explicitly uses `force-static` | **ISR ACCIDENTAL / absent**; keep static build |
| `category/[category]`, `try/[slug]` | Optional programmatic catalog pages can be regenerated on a catalog-enabled build; current flag is off and params are empty | **STATIC BUILD CONTRACT**, not periodic ISR |
| `/sitemaps/dynamic.xml` | Catalog and public Store/Campaign entries change independently of deploy | **ISR REQUIRED** |
| `/:locale/store/:merchantSlug` | Merchant publication changes independently of deploy; writes invalidate | **ISR REQUIRED** |
| `/:locale/c/:merchantSlug/:experienceSlug` | Campaign publication changes independently of deploy; writes invalidate | **ISR REQUIRED** |

The evidence does not support labeling the three ISR contracts as accidental.
The simplification opportunity is to keep ISR only for independently changing
Store/Campaign/sitemap data and prevent it from spreading into deploy-only SEO
families.

## Cloudflare role and D1 decision

The repository's `cloudflare-router/b4-production-routes.json` documents 12 routes:
8 static asset paths and 4 worker API paths. It explicitly excludes broad Next
HTML/RSC and `/_next/static` ownership and states that Vercel is the sole Next
frontend owner. That is the correct direction.

Target ownership:

- **Cloudflare:** DNS, TLS, WAF, bot/security controls, and carefully selected
  immutable asset edge caching;
- **Vercel:** the sole Next.js producer for HTML, RSC, Next runtime, APIs, and
  `/_next/static`, with its CDN serving static artifacts;
- **Blob/CDN:** explicit direct ownership for immutable merchant/media assets;
- **No second renderer:** Cloudflare must not reproduce Next rendering or become a
  second application cache with different semantics.

**D1 HTML CACHE AFTER ARCHITECTURE CLEANUP: UNNECESSARY** for the deploy-only
consumer SEO surface. It may remain **optional as a temporary transition layer**
while the auth/layout and media boundaries are being cleaned up, but the target
architecture does not require D1 to make a correctly static Vercel artifact static.
This audit does not change or remove D1.

## Top 5 architectural debts

1. **Global auth boundary on public layout:** 44 public SEO route patterns inherit
   `SessionProvider`, `useSession()`, and `/api/auth/session` work.
2. **Static HTML and dynamic application surfaces share one layout contract:**
   static shells, public SEO, payment returns, and app entry points are mixed in
   `(main)`, which makes ownership and caching decisions ambiguous.
3. **Prefetch is not an explicit public-surface policy:** `GrowthFunnelLink` and
   several content links leave Next's default prefetch behavior active on
   high-link-density pages.
4. **Media ownership is mixed:** immutable local/editorial assets, catalog URLs,
   Blob assets, and user-generated media use overlapping image components without
   one explicit delivery contract.
5. **Edge cache governance is compensating for application-boundary ambiguity:**
   Cloudflare D1/Smart Tiered behavior is being used to reason about public Next
   delivery even though the principal producer should simply be Vercel's static
   artifact/CDN and the current Worker does not cover the main HTML/RSC surface.

## Proposed target architecture

```text
Anonymous SEO request
  www.visutry.com
        │
        ▼
Cloudflare: DNS / TLS / WAF / bot controls
        │
        ▼
Vercel CDN
  ├─ Static artifact: locale, blog, guides, brand, style, face-shape, sitemap/core, robots
  ├─ Static app shell: try-on / face-analysis / dashboard entry, with auth client island only where needed
  ├─ On-demand ISR: Store/Campaign detail + dynamic sitemap only
  └─ Dynamic runtime/API: auth, account, payments, try-on, admin, merchant, user data

Media ownership
  ├─ Immutable editorial/preset: build-time optimized public/CDN asset
  ├─ Merchant/catalog/Blob: direct allowlisted Blob/CDN URL with explicit lifetime
  └─ User-generated: protected application media endpoint / user-specific delivery
```

For a public SEO detail page the desired path is:

```text
Cloudflare security layer → Vercel CDN/static artifact → response
```

It should not be:

```text
Cloudflare → ISR store → auth session → image optimizer → speculative RSC fan-out
```

## Simplification plan

### Step 1 — P0: restore explicit ownership

Freeze the contract above. Keep Vercel as the sole Next producer. Keep Cloudflare
routes limited to the documented non-Next asset/API boundary. Do not add a broad
Worker route or another HTML renderer.

### Step 2 — P1: separate public and application layouts

Create a public shell with no session provider, no auth session fetch, and no
payment conversion tracker. Create an app/auth shell that mounts session state only
for routes that need it. Give the public header a neutral sign-in CTA and keep the
auth-aware header as an app island. Re-verify that public HTML remains static and
that `/api/auth/session` is absent from anonymous SEO navigation.

### Step 3 — P2/P3: make fan-out and media opt-in

Set `prefetch={false}` as the default for public SEO grids and related-content
links; opt in only for a measured high-intent transition. Split immutable image
assets from data-backed media. Build-time optimize local editorial/preset assets,
serve immutable derivatives directly, and use runtime transformation only for
data-backed images where responsive sizing or safety requires it.

### Step 4 — P4: remove compensating complexity after verification

Rebuild and compare static/ISR/dynamic manifests, anonymous request fan-out,
`/api/auth/session`, ISR reads, and FOT. Keep ISR for independently changing
Store/Campaign/sitemap data. Then re-evaluate D1 HTML caching; remove that layer if
Vercel's static artifact/CDN is sufficient and retain Cloudflare for security and
DNS responsibilities.

## Expected effect

- **ISR:** LOWER for public consumer SEO pages; Store/Campaign and dynamic sitemap
  ISR remain. Exact savings require post-change measurement.
- **FOT:** LOWER is expected from removing unnecessary auth/RSC/image-transform
  traffic, but route-level causality is not proven by this audit.
- **Request count:** LOWER for anonymous public navigation, chiefly through removal
  of session fetches and unnecessary prefetch/RSC fan-out.
- **Complexity:** LOWER; one Next producer, explicit layout contracts, explicit
  media ownership, and fewer compensating Cloudflare rules.

## Production changes

**NONE.** No Cloudflare, Vercel, DNS, Worker, cache policy, deployment, or
application-code change was made. The generated `.next` artifacts and installed
dependencies were kept local and are not part of this report commit.
