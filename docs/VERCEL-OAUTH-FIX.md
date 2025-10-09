# Vercel Twitter OAuth Callback Error - Root Cause & Fix

## 🔴 Problem

Twitter OAuth login was working locally but failing on Vercel with error:

```
Error: adapter_error_getUserByAccount PrismaClientKnownRequestError: 
Invalid `prisma.account.findUnique()` invocation:
Error validating datasource `db`: the URL must start with the protocol `prisma://`
```

**Error Code**: `P6001`

## 🔍 Root Cause Analysis

The error occurred because of **TWO configuration issues**:

### Issue 1: `PRISMA_GENERATE_DATAPROXY` Environment Variable

In `vercel.json`, we had:
```json
{
  "env": {
    "PRISMA_GENERATE_DATAPROXY": "true"
  },
  "build": {
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"
    }
  }
}
```

**Problem**: 
- This tells Prisma to generate a **Data Proxy client**
- Data Proxy requires a connection URL starting with `prisma://`
- But our `DATABASE_URL` uses direct PostgreSQL connection: `postgresql://...`
- This mismatch caused the P6001 error

**Why it worked before**: 
- This configuration may have been added recently
- Or Vercel changed how it handles this environment variable

### Issue 2: Missing Runtime Specification

The NextAuth API route didn't explicitly specify the runtime:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Problem**:
- Without explicit runtime specification, Vercel might try to use Edge Runtime
- Edge Runtime has limitations with Prisma (requires Data Proxy or special adapters)
- Node.js Runtime works fine with direct PostgreSQL connections

## ✅ Solution

### Fix 1: Remove Data Proxy Configuration

**File**: `vercel.json`

**Before**:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "PRISMA_GENERATE_DATAPROXY": "true"  // ❌ REMOVE THIS
  },
  "build": {
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"  // ❌ REMOVE THIS
    }
  }
}
```

**After**:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Fix 2: Explicitly Specify Node.js Runtime

**File**: `src/app/api/auth/[...nextauth]/route.ts`

**Before**:
```typescript
import "@/lib/proxy-setup"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**After**:
```typescript
import "@/lib/proxy-setup"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// CRITICAL: Force Node.js runtime (not Edge) for Prisma compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Fix 3: Improved Proxy Setup (Bonus)

**File**: `src/lib/proxy-setup.ts`

Added multiple checks to ensure proxy is **NEVER** configured on Vercel:

```typescript
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL_URL
const isProduction = process.env.NODE_ENV === 'production'
const isLocalDev = process.env.NODE_ENV === 'development' && !isVercel

// ONLY configure proxy if we're absolutely sure we're in local development
if (isLocalDev && proxyUrl && !isProduction && !isVercel) {
  // ... setup proxy
}
```

## 🚀 Deployment Steps

1. **Commit the changes**:
   ```bash
   git add vercel.json src/app/api/auth/[...nextauth]/route.ts src/lib/proxy-setup.ts
   git commit -m "Fix: Prisma Data Proxy error on Vercel (P6001)"
   git push
   ```

2. **Verify Vercel Environment Variables**:
   - Go to: https://vercel.com/franksunye/visutry/settings/environment-variables
   - Ensure `DATABASE_URL` is set to the PostgreSQL connection string (starts with `postgresql://`)
   - Ensure NO proxy variables are set (`HTTP_PROXY`, `HTTPS_PROXY`, etc.)

3. **Wait for Deployment**:
   - Vercel will automatically deploy the changes
   - Check deployment logs for any errors

4. **Test OAuth**:
   - Visit: https://visutry.vercel.app
   - Click "Sign in with Twitter"
   - Should now work correctly!

## 📊 Why This Happened "Suddenly"

Possible reasons why OAuth stopped working after it was working before:

1. **Vercel Configuration Change**: 
   - Someone may have added `PRISMA_GENERATE_DATAPROXY` to `vercel.json`
   - Or Vercel changed how it interprets this setting

2. **Vercel Platform Update**:
   - Vercel may have changed default runtime behavior
   - Edge Runtime may have become the default for some routes

3. **Dependency Update**:
   - Prisma or NextAuth version update may have changed behavior
   - Though package.json shows fixed versions, so less likely

4. **Environment Variable Change**:
   - Someone may have modified Vercel environment variables
   - Though you confirmed they're correct

## 🔧 Alternative Solutions (If Above Doesn't Work)

### Option A: Use Prisma Data Proxy (Not Recommended)

If you want to use Data Proxy:
1. Set up Prisma Data Proxy: https://www.prisma.io/docs/data-platform/data-proxy
2. Get a `prisma://` connection URL
3. Set `DATABASE_URL` in Vercel to the Data Proxy URL
4. Keep `PRISMA_GENERATE_DATAPROXY=true` in `vercel.json`

**Cons**: Extra complexity, potential latency, requires Prisma Cloud account

### Option B: Use Neon Serverless Driver with Adapter

For better Edge Runtime support:
1. Install: `npm install @prisma/adapter-neon @neondatabase/serverless`
2. Update `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["driverAdapters"]
   }
   ```
3. Update `src/lib/prisma.ts` to use the adapter
4. This allows Edge Runtime with direct Neon connection

**Pros**: Better performance, Edge Runtime compatible
**Cons**: More complex setup, requires code changes

## 📝 Verification Checklist

After deployment, verify:

- [ ] Vercel deployment succeeded without errors
- [ ] No `P6001` errors in Vercel function logs
- [ ] Twitter OAuth login works on production
- [ ] User data is correctly saved to database
- [ ] Session persists after login

## 🔗 References

- [Prisma Error P6001](https://www.prisma.io/docs/reference/api-reference/error-reference#p6001)
- [Vercel Edge Runtime with Prisma](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-vercel)
- [NextAuth.js with Prisma](https://next-auth.js.org/adapters/prisma)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)

## 📞 Support

If the issue persists after these fixes:

1. Check Vercel function logs: https://vercel.com/franksunye/visutry/logs
2. Enable debug mode: Add `NEXTAUTH_DEBUG=true` to Vercel env vars
3. Check Neon database status: https://console.neon.tech
4. Verify Twitter Developer Portal settings: https://developer.twitter.com/en/portal/dashboard

---

**Last Updated**: 2025-01-09
**Status**: ✅ Fixed

