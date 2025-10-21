# VisuTry Development Guide

This guide provides instructions for setting up the development environment, running tests, and deploying the application.

## 1. Environment Setup

### Prerequisites

Before you begin, ensure you have accounts for the following services:

- **Google Cloud Platform**: To enable the Gemini API and obtain an API key.
- **Twitter Developer Account**: To create a Twitter app and get the Client ID and Client Secret for OAuth.
- **Stripe Account**: To manage payments and get API keys for test and production environments.
- **Database Service**: A PostgreSQL database. We recommend [Supabase](https://supabase.com/) or [PlanetScale](https://planetscale.com/).
- **Vercel Account**: For deployment and Vercel Blob storage.

### Environment Variables

Clone the repository and create a `.env.local` file from the example file:

```bash
cp .env.example .env.local
```

Then, fill in the required environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Twitter OAuth
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"

# Application Configuration
FREE_TRIAL_LIMIT=3
PREMIUM_PRICE_ID="price_..."
```

## 2. Development Workflow

### Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/franksunye/VisuTry.git
    cd VisuTry
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your credentials
    ```

4.  **Initialize the database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Start the development server**:
    ```bash
    npm run dev
    ```

### Database Operations

-   **View database**:
    ```bash
    npx prisma studio
    ```
-   **Reset database**:
    ```bash
    npx prisma db push --force-reset
    ```
-   **Generate Prisma client**:
    ```bash
    npx prisma generate
    ```
-   **Create a migration**:
    ```bash
    npx prisma migrate dev --name <migration-name>
    ```

### Code Quality Checks

-   **Linting**:
    ```bash
    npm run lint
    ```
-   **Type checking**:
    ```bash
    npm run type-check
    ```
-   **Build check**:
    ```bash
    npm run build
    ```

## 3. API Development

### Authentication Middleware

Use the `requireAuth` utility to protect API routes that require authentication.

```typescript
// src/lib/auth.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getSession() {
  return await getServerSession(authOptions)
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

Use these helpers to return consistent JSON responses.

```typescript
// src/lib/api-response.ts
export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}
```

### Database Query Example

Here's an example of a database query using Prisma.

```typescript
// src/lib/db/users.ts
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

## 4. Component Development

### UI Components

Base UI components are located in `src/components/ui`.

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'primary', size = 'md', loading, children, onClick }: ButtonProps) {
  // Implementation...
}
```

### Feature Components

Feature-specific components are organized by feature in `src/components`.

```typescript
// src/components/try-on/TryOnInterface.tsx
interface TryOnInterfaceProps {
  onSubmit: (data: TryOnRequest) => void
  loading?: boolean
}

export function TryOnInterface({ onSubmit, loading }: TryOnInterfaceProps) {
  // Implementation...
}
```

## 5. Testing

### Unit Tests

```typescript
// __tests__/utils/image.test.ts
import { validateImageFile } from '@/utils/image'

describe('validateImageFile', () => {
  it('should validate correct image file', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})
```

### API Tests

```typescript
// __tests__/api/try-on.test.ts
import { POST } from '@/app/api/try-on/route'

describe('/api/try-on', () => {
  it('should create a try-on task', async () => {
    const request = new Request('http://localhost:3000/api/try-on', {
      method: 'POST',
      body: JSON.stringify({ /* test data */ })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

## 6. Deployment

### Vercel Deployment

1.  Connect your GitHub repository to Vercel.
2.  Configure the environment variables in the Vercel dashboard.
3.  Set the build command to `npm run build`.
4.  Set the output directory to `.next`.

### Production Environment Variables

Ensure that all environment variables in Vercel are set to their production values.

### Database Migrations

Run the following command to apply database migrations in production:

```bash
npx prisma migrate deploy
```

## 7. Troubleshooting

### Common Issues

-   **NextAuth Configuration Error**: Check that `NEXTAUTH_URL` is correct and the OAuth callback URL is properly configured.
-   **Database Connection Failed**: Verify the `DATABASE_URL` format and check the status of your database service.
-   **API Calls Failing**: Ensure your API keys are valid and check for network issues.
-   **Image Upload Issues**: Verify your Blob storage configuration and check file size and format limits.

### Debugging Tips

```typescript
// Log debug info in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data })
}

// Error logging
try {
  // Business logic
} catch (error) {
  console.error('Error:', error)
  // Send to an error monitoring service
}
```

## 8. Performance Optimization

-   **Image Optimization**: Use the Next.js `Image` component, implement lazy loading, and compress uploaded images.
-   **API Optimization**: Implement response caching, use database indexes, and optimize queries.
-   **Frontend Optimization**: Use code splitting, preload critical resources, and use `React.memo` to optimize rendering.
```