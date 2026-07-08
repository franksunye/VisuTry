# VisuTry Development Guide

**Status:** Active operating guide  
**Last reviewed:** 2026-07-08  
**Owner:** Engineering  
**Review cadence:** Monthly, or whenever environment variables, auth, payment, database, or deployment flow changes  
**Scope:** Local setup, environment variables, development workflow, testing, deployment, and troubleshooting.  
**Current guidance:** Product priority lives in `docs/product/product-plan.md`; technical reality lives in `docs/project/architecture.md`; feature-level details should live in `docs/product/specs/`.

---

## 1. Environment Setup

### Prerequisites

Before you begin, ensure you have accounts or access for the following services:

- **Google Cloud / Gemini API**: To enable the Gemini API and obtain an API key.
- **Auth0**: To configure OAuth providers such as Twitter, Google, and other connections.
- **Stripe**: To manage test and production payments, price IDs, and webhook secrets.
- **Neon PostgreSQL**: Primary database service for the current project setup.
- **Vercel**: For deployment, environment variables, analytics, and Vercel Blob storage.
- **Resend / Email provider**: Where email notifications or transactional email features are enabled.

### Environment Variables

Clone the repository and create a `.env.local` file from the example file:

```bash
cp .env.example .env.local
```

Then, fill in the required environment variables. Keep `.env.example` as the source of truth for the current variable list.

```bash
# Database
# For local development with Neon, use the pooled connection where applicable.
DATABASE_URL="postgresql://username:password@host-pooler.region.neon.tech/dbname?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Auth0 OAuth
AUTH0_ID="your-auth0-client-id"
AUTH0_SECRET="your-auth0-client-secret"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Try-on prompt release
TRY_ON_PROMPT_VERSION="tryon-v1"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_monthly_..."
STRIPE_PREMIUM_YEARLY_PRICE_ID="price_yearly_..."
STRIPE_CREDITS_PACK_PRICE_ID="price_credits_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"

# App Configuration
FREE_TRIAL_LIMIT=3
MONTHLY_QUOTA=30
YEARLY_QUOTA=420
CREDITS_PACK_AMOUNT=10
MONTHLY_PRICE=899
YEARLY_PRICE=8999
CREDITS_PACK_PRICE=299

# SEO / Analytics
NEXT_PUBLIC_SITE_URL="https://www.visutry.com"
GOOGLE_SITE_VERIFICATION="your-google-verification-code"
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GOOGLE_TAG_MANAGER_ID="GTM-XXXXXXX"

# Cron Jobs Security
CRON_SECRET="your-secure-cron-secret-key"
```

Notes:

- When using Vercel's Neon integration, database variables such as `DATABASE_URL` and `DATABASE_URL_UNPOOLED` may be provided automatically.
- Do not commit real secrets.
- Keep production and test Stripe price IDs separated.
- If `.env.example` changes, update this guide or reference `.env.example` directly instead of duplicating stale values.

---

## 2. Development Workflow

### Local Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/franksunye/VisuTry.git
   cd VisuTry
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Initialize Prisma**:

   ```bash
   npx prisma generate
   ```

5. **Apply database schema locally**:

   ```bash
   npx prisma db push
   ```

6. **Start the development server**:

   ```bash
   npm run dev
   ```

Alternative local script where configured:

```bash
npm run dev:local
```

### Database Operations

- **View database**:

  ```bash
  npx prisma studio
  ```

- **Reset database**:

  ```bash
  npx prisma db push --force-reset
  ```

- **Generate Prisma client**:

  ```bash
  npx prisma generate
  ```

- **Create a migration**:

  ```bash
  npx prisma migrate dev --name <migration-name>
  ```

- **Deploy migrations**:

  ```bash
  npx prisma migrate deploy
  ```

### Code Quality Checks

- **Linting**:

  ```bash
  npm run lint
  ```

- **Build check**:

  ```bash
  npm run build
  ```

- **Run all tests**:

  ```bash
  npm test
  ```

- **Unit tests**:

  ```bash
  npm run test:unit
  ```

- **API / integration tests**:

  ```bash
  npm run test:api
  npm run test:integration:new
  ```

- **Playwright e2e tests**:

  ```bash
  npm run test:e2e:playwright
  ```

- **Gemini checks**:

  ```bash
  npm run test:gemini
  npm run test:gemini:tryon
  ```

---

## 3. API Development

### Authentication Middleware

Use the current auth utilities and NextAuth / Auth0 configuration in the codebase. Check `src/` and the auth route implementation before copying older snippets.

General pattern:

```typescript
import { getServerSession } from "next-auth/next"

export async function getSession() {
  return await getServerSession()
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
```

### API Response Helpers

Use consistent JSON envelopes where existing helpers are available. If adding new merchant / widget APIs, prefer machine-readable error codes and stable response shapes.

Example shape:

```typescript
export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400, code?: string) {
  return Response.json({ success: false, error: message, code }, { status })
}
```

### Database Query Example

Use Prisma for database reads and writes. Keep query ownership close to feature modules where possible.

```typescript
import { prisma } from "@/lib/prisma"

export async function getUserWithStats(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tryOnTasks: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      _count: {
        select: {
          tryOnTasks: true,
          payments: { where: { status: "COMPLETED" } }
        }
      }
    }
  })
}
```

---

## 4. Component Development

### UI Components

Base UI components are located under `src/components/ui` where available. Feature components are organized by feature area.

### Feature Components

Feature-specific components are organized by capability, for example:

```text
src/components/
├── face-analysis/
├── try-on/
├── dashboard/
├── pricing/
├── share/
└── upload/
```

Before building a new feature, check whether a product spec exists under `docs/product/specs/`.

Current first-priority specs:

- `docs/product/specs/frame-compare.md`
- `docs/product/specs/credits-pack-conversion.md`
- `docs/product/specs/visutry-store-mvp.md`

---

## 5. Testing

### Unit Tests

```typescript
import { validateImageFile } from "@/utils/image"

describe("validateImageFile", () => {
  it("should validate correct image file", () => {
    const file = new File([""], "test.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})
```

### API Tests

```typescript
import { POST } from "@/app/api/try-on/route"

describe("/api/try-on", () => {
  it("should create a try-on task", async () => {
    const request = new Request("http://localhost:3000/api/try-on", {
      method: "POST",
      body: JSON.stringify({ /* test data */ })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Test Commands

Use the scripts in `package.json` as the source of truth. Common commands include:

```bash
npm test
npm run test:unit
npm run test:api
npm run test:e2e:playwright
npm run test:coverage
```

---

## 6. Deployment

### Vercel Deployment

1. Connect the GitHub repository to Vercel.
2. Configure production environment variables in the Vercel dashboard.
3. Use the project build command from `package.json`.
4. Verify that Prisma generation and migration deployment are part of the build/deploy flow where expected.

Current build command in `package.json`:

```bash
prisma generate && bash scripts/migrate-deploy.sh && next build
```

### Production Environment Variables

Ensure all variables from `.env.example` that are required in production are set in Vercel with production-safe values.

### Database Migrations

Run production migrations through the configured deployment flow. If running manually:

```bash
npx prisma migrate deploy
```

---

## 7. Troubleshooting

### Common Issues

- **NextAuth / Auth0 configuration error**: Check `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH0_ID`, `AUTH0_SECRET`, `AUTH0_ISSUER_BASE_URL`, and OAuth callback URLs.
- **Database connection failed**: Verify the Neon `DATABASE_URL` format, pooler host, SSL mode, and database availability.
- **API calls failing**: Ensure API keys are valid and that environment variables are available in the correct runtime.
- **Stripe webhook issues**: Verify `STRIPE_WEBHOOK_SECRET`, endpoint mode, and test/live key consistency.
- **Image upload issues**: Verify Vercel Blob token, file size, file type, and network conditions.
- **Gemini / AI generation issues**: Verify `GEMINI_API_KEY`, prompt version, API availability, and error logs.

### Debugging Tips

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", { data })
}

try {
  // Business logic
} catch (error) {
  console.error("Error:", error)
  // Send to an error monitoring service where configured
}
```

---

## 8. Performance Optimization

- **Image Optimization**: Use the Next.js `Image` component where appropriate, implement lazy loading, and compress uploaded images.
- **API Optimization**: Implement response caching where safe, use database indexes, and optimize queries.
- **Frontend Optimization**: Use code splitting, preload critical resources, and avoid blocking the first upload / try-on interaction.
- **Widget / Merchant Future Work**: If building embed/widget code, keep it idle before user interaction and size-controlled.

---

## 9. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Refreshed environment variables, Neon/Auth0 guidance, package script references, source-of-truth notes, and testing/deployment guidance. |
