# VisuTry Project Architecture & Features

**Status:** Active source of truth for current technical reality  
**Last reviewed:** 2026-07-22  
**Owner:** Engineering  
**Review cadence:** Monthly, or before major product architecture work  
**Scope:** Current VisuTry technical stack, rendering strategy, session data flow, implemented capabilities, core data model, APIs, pages, components, and workflows.  
**Current guidance:** This document describes the current system. Product priority lives in `docs/product/product-plan.md`; commercial direction lives in `docs/strategy/commercial-strategy.md`; detailed feature behavior should live in `docs/product/specs/`.

---

## Project Overview

VisuTry is a full-stack AI-powered glasses try-on and eyewear decision application built with Next.js.

The current product includes user authentication, image upload, AI glasses try-on, payment / credits, dashboard history, sharing, SEO/Growth surfaces, and face-analysis / face-landmark capabilities.

The current product direction is documented in `docs/product/product-plan.md`:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

---

## Technology Stack

### Frontend

- **Framework**: Next.js 15 App Router
- **UI Library**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks
- **Localization**: `next-intl` v4

### Backend

- **API**: Next.js API Routes / Route Handlers
- **Database**: Neon PostgreSQL (serverless) + Prisma ORM v7
- **Database Driver**: `@prisma/adapter-neon` (HTTP-based serverless driver, not persistent TCP)
- **Authentication**: NextAuth.js v4 + Auth0
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Try-On Service**: Google Gemini API
- **Face Landmark / Local Vision**: MediaPipe Tasks Vision
- **Email / Notification Infrastructure**: Resend / Nodemailer where configured

### Deployment

- **Platform**: Vercel (serverless functions)
- **Database**: Neon PostgreSQL (scales to zero, cold start 500ms–few seconds)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics, GA/GTM where configured

---

## Rendering Strategy

VisuTry uses three rendering modes, determined per-page. The rendering mode is verifiable in the `next build` output (`●` = SSG, `ƒ` = Dynamic).

### 1. Static Generation (SSG) — Default for all public pages

All marketing, tool landing, legal, and blog pages are statically generated at build time. This is the primary defense against Vercel serverless CPU consumption and Neon HTTP timeouts.

**Requirements for SSG:**
- No `getServerSession()` in the page or any of its layouts (reading `cookies()` forces dynamic rendering)
- `setRequestLocale(locale)` called in every layout and page that uses `next-intl/server` functions
- `export const dynamic = 'force-static'` on pages where the default is ambiguous
- `generateStaticParams` in `[locale]/layout.tsx` to pre-render all locales

**Pages currently SSG:**
- `/` (homepage), `/face-shape-detector`, `/style-explorer`, `/try-on/[type]`, `/try-on/glasses/compare`
- `/face-analysis`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/blog/*`
- `/dashboard`, `/dashboard/history`, `/payments`, `/debug-images`

### 2. Client-Side Gate Pattern — For pages requiring auth-aware UI

Pages that previously used `getServerSession()` to decide between a landing page (unauthenticated) and a tool interface (authenticated) now use the **client-side gate** pattern:

1. The server renders a static shell (usually the landing/marketing content) — no DB queries, no `cookies()` access
2. A client component (`*Gate.tsx`) wraps the page content and calls `useSession()`
3. While `status === 'loading'`: show the landing content or a loading skeleton
4. When `status === 'authenticated'`: swap to the tool interface
5. When `status === 'unauthenticated'`: show the landing content or redirect to signin

**Gate components:**
- `StyleExplorerGate` — style-explorer page
- `ComparePageClient` — try-on/glasses/compare page
- `TryOnGate` — try-on/[type] page
- `FaceAnalysisGate` — face-analysis page
- `HistoryPageClient` — dashboard/history page
- `DashboardPageClient` — dashboard page
- `PaymentsPageClient` — payments page
- `DebugImagesPageClient` — debug-images page

**Trade-off:** Authenticated users see a brief loading state (200–500ms) before the tool interface appears. This is the standard `next-auth` client session behavior. Unauthenticated visitors (majority of traffic) see no difference.

### 3. Dynamic Rendering (SSR) — Only for admin and API routes

Only `/admin/*` pages and `/api/*` route handlers use dynamic rendering with server-side `getServerSession()`. These are on-demand endpoints or protected admin pages where per-request authentication is required.

**`getServerSession()` is ONLY allowed in:**
- `src/app/api/**` — API route handlers
- `src/app/[locale]/admin/**` — Admin pages

**`getServerSession()` must NOT appear in:**
- `src/app/layout.tsx` — Root layout (would force all pages dynamic)
- `src/app/[locale]/layout.tsx` — Locale layout
- `src/app/[locale]/(main)/**` — Any public-facing page

---

## Session Data Flow

### Architecture

VisuTry uses NextAuth.js v4 with the JWT session strategy (not database sessions). The JWT token is the primary data carrier for user state.

```
Client (browser)
  │
  ├── useSession() → fetch /api/auth/session → returns session.user
  │
  ├── session.update() → triggers JWT callback (trigger='update')
  │
  └── API calls → API route getServerSession() → verifies JWT from cookie
```

### JWT Callback (`src/lib/auth.ts`)

The JWT callback (`callbacks.jwt`) is the single point where user data is synced from the database into the token. It runs:

1. **On login** (`user` object present): Reads the full user record from DB, populates token fields
2. **On `trigger === 'update'`**: Rate-limited to once per 30 seconds (`lastSyncTime` in token). Reads user from DB to catch subscription/quota changes
3. **Periodically**: Every 15 minutes (`tokenAge > 15 * 60 * 1000`) — catches subscription changes
4. **On first token** (`isPremium === undefined`): Initializes token with DB data

### Token Fields

The JWT token carries these user fields (synced from DB):
- `id`, `email`, `name`, `image`
- `isPremium`, `isPremiumActive`, `premiumExpiresAt`
- `subscriptionType`, `isYearlySubscription`
- `remainingTrials` (computed: free + premium + credits remaining)
- `creditsPurchased`, `creditsUsed`
- `freeTrialsUsed`, `premiumUsageCount`
- `lastSyncTime` (for rate-limiting `update` triggers)

### Session Callback (`callbacks.session`)

The session callback maps token fields onto `session.user` for client consumption via `useSession()`.

### Key Rule: Token is the Read Source

Pages and client components should read user data from `session.user` (via `useSession()` or `getServerSession()` in API routes). Direct `prisma.user.findUnique()` in pages is an anti-pattern — the token already carries the data.

API routes that **write** user data (e.g., after a try-on, after a payment) update the DB directly, then call `session.update()` to refresh the token.

---

## Database Schema (Prisma)

### Neon Serverless Driver

VisuTry uses `@prisma/adapter-neon` which connects over **HTTP**, not persistent TCP. Key implications:

- **No `$connect()` needed**: The Neon serverless driver creates a new HTTP request per query. Calling `prisma.$connect()` is a no-op and should not be used for warm-up.
- **Cold starts**: Neon scales compute to zero after 5 minutes of inactivity. Cold start takes 500ms–few seconds. This is handled via the `connect_timeout` parameter in the connection string, not by pre-connecting.
- **Connection pooling**: The `DATABASE_URL` uses Neon's PgBouncer pooler (`-pooler` hostname). Prisma CLI commands (migrations) use `DIRECT_URL` (direct connection) to avoid PgBouncer advisory lock issues.
- **Timeout risk**: Concurrent HTTP queries during cold start can saturate the Neon HTTP endpoint, causing `undici TimeoutError`. This is why all public pages are SSG — they don't query the DB at request time.

### Core Tables

1. **User** (`prisma/schema.prisma`)
   - `id`, `name`, `email`, `image`, `username`
   - `freeTrialsUsed`: Free trial usage counter
   - `premiumUsageCount`: Premium subscription usage counter (resets on billing cycle)
   - `creditsPurchased`: Total credits purchased (monotonically increasing)
   - `creditsUsed`: Total credits consumed (monotonically increasing)
   - `isPremium`, `premiumExpiresAt`: Subscription status
   - `currentSubscriptionType`: `PREMIUM_MONTHLY` or `PREMIUM_YEARLY`
   - `role`: `USER` or `ADMIN`
   - Email retention tracking fields: `lastRetention3DayEmailSent`, `lastRetention24HEmailSent`, `lastRetentionDeletedEmailSent`

2. **TryOnTask**
   - `type`: `GLASSES`, `OUTFIT`, `SHOES`, `ACCESSORIES`
   - `userImageUrl`, `itemImageUrl`, `glassesImageUrl` (backward compat), `resultImageUrl`
   - `status`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
   - `prompt`, `metadata`: AI generation details
   - `expiresAt`: Data retention expiry
   - Indexes optimized for: user+type queries, dashboard recent tasks, dashboard stats, expiry cleanup

3. **Payment**
   - `stripeSessionId`, `stripePaymentId`, `stripeSubscriptionId`
   - `amount` (cents), `currency`
   - `status`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
   - `productType`: `PREMIUM_MONTHLY`, `PREMIUM_YEARLY`, `CREDITS_PACK`, `CREDITS_PACK_PROMO_60`, `PREMIUM_MONTHLY_PROMO`, `PREMIUM_YEARLY_PROMO`

4. **FaceAnalysisTask**
   - `userImageUrl`, `detectedShape`, `confidence`
   - `basicResult`, `fullResult` (JSON)
   - `reportUnlocked`: Whether the paid full report has been unlocked
   - `externalTaskId`: For async processing

5. **GlassesFrame / FaceShape / GlassesCategory**
   - Historical frame catalog models. Future merchant / catalog work should use `docs/product/specs/visutry-store-mvp.md`.

### NextAuth.js Tables

- **Account**: OAuth provider account links (Auth0)
- **Session**: Database sessions (unused — JWT strategy is active, but table retained)
- **VerificationToken**: Email verification tokens

---

## API Design

### Authentication (`/api/auth/*`)

- Handled by NextAuth.js + Auth0
- `/api/auth/session`: Returns session object; called by `useSession()` on the client

### Try-On (`/api/try-on/*`)

- `POST /api/try-on/submit`: Create a new try-on task
- `GET /api/try-on/poll`: Poll task status and result
- `GET /api/try-on/history`: Paginated user try-on history (used by dashboard/history and debug-images pages)
- `POST /api/try-on/glasses/compare/*`: Frame compare endpoints
- `POST /api/try-on/glasses/style-explorer/*`: Style explorer endpoints

### Face Analysis (`/api/face-analysis/*`)

- Server-side analysis / deeper report routes for paid or logged-in analysis flows
- Free local detector (MediaPipe) runs entirely client-side, no API call

### Payment (`/api/payment/*`)

- `POST /api/payment/checkout`: Creates Stripe Checkout sessions
- `POST /api/payment/webhook`: Handles Stripe webhook events
- `GET /api/payment/history`: Returns user's payment history (used by payments page)

### User (`/api/user/*`)

- `GET /api/user/balance`: Returns user's credit/quota balance (used by dashboard)

### File Management

- Vercel Blob is used for persisted files (uploads and generated results)

### Other APIs

- `/api/share/*`: Shared try-on result surfaces
- `/api/health`: Health check endpoint
- `/api/admin/*`: Admin-only endpoints
- `/api/debug/*`: Debugging tools where enabled

---

## Component & Page Architecture

### Page Components (`src/app/`)

```text
src/app/
├── layout.tsx              # Root layout — SessionProvider (no getServerSession)
├── [locale]/
│   ├── layout.tsx          # Locale layout — setRequestLocale, NextIntlClientProvider
│   ├── (main)/
│   │   ├── layout.tsx      # Main section layout (header/footer)
│   │   ├── page.tsx        # Homepage (SSG)
│   │   ├── face-shape-detector/page.tsx  # SSG, fully client-side
│   │   ├── style-explorer/page.tsx       # SSG + StyleExplorerGate
│   │   ├── try-on/
│   │   │   ├── [type]/page.tsx           # SSG + TryOnGate
│   │   │   └── glasses/compare/page.tsx  # SSG + ComparePageClient
│   │   ├── face-analysis/page.tsx        # SSG + FaceAnalysisGate
│   │   ├── pricing/page.tsx              # SSG (PricingSection uses useSession)
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # SSG + DashboardPageClient
│   │   │   └── history/page.tsx          # SSG + HistoryPageClient
│   │   ├── payments/page.tsx             # SSG + PaymentsPageClient
│   │   ├── blog/                         # SSG (ISR)
│   │   └── ...
│   └── admin/                            # Dynamic (SSR, requires auth)
├── api/                                  # Dynamic (route handlers)
├── auth/                                 # Auth pages
└── share/[id]/                           # Dynamic (per-result SSR)
```

### Gate Components (`src/components/`)

Gate components are the client-side boundary between static rendering and auth-aware UI:

```text
src/components/
├── style-explorer/StyleExplorerGate.tsx
├── compare/ComparePageClient.tsx
├── try-on/TryOnGate.tsx
├── face-analysis/FaceAnalysisGate.tsx
├── dashboard/DashboardPageClient.tsx
├── dashboard/HistoryPageClient.tsx
├── payments/PaymentsPageClient.tsx
├── debug-images/DebugImagesPageClient.tsx
├── layout/Header.tsx        # Uses useSession with loading placeholder
├── providers/SessionProvider.tsx  # Wraps next-auth SessionProvider (no server session prop)
└── ...
```

---

## Core Workflows

- **Authentication**: User signs in via Auth0 / NextAuth.js → JWT token created → user data synced from DB to token → `useSession()` provides session on client
- **Try-On**: User uploads images → API creates a `TryOnTask` → Gemini AI processes → result saved to Vercel Blob → `session.update()` refreshes quota → history updated
- **Payment / Credits**: User selects a paid option → Stripe Checkout → Stripe webhook updates DB (credits, entitlement) → `session.update()` syncs token
- **Face Analysis**: Free detector runs client-side (MediaPipe). Paid deeper analysis uses server-side VLM flow.
- **Sharing**: Completed try-on results exposed through `/share/[id]` surfaces.

---

## Architecture Review Notes

This document should be reviewed against the codebase before major work in the following areas:

1. Merchant / Store / Frame Catalog models.
2. Frame Compare implementation.
3. Credits Pack conversion and failed-generation handling.
4. Free local Face Shape Detector architecture.
5. Shopify / widget / public API work.

Detailed specs should be created or updated under `docs/product/specs/` before engineering starts on those capabilities.
