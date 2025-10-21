# Vercel Environment Variables Setup

## ⚠️ URGENT: Missing Environment Variable

The current Vercel deployment is failing because `DIRECT_URL` environment variable is not configured.

### Error Message
```
Error: Environment variable not found: DIRECT_URL.
  -->  prisma/schema.prisma:11
   | 
10 |   url       = env("DATABASE_URL")
11 |   directUrl = env("DIRECT_URL")
   | 
```

---

## 🔧 How to Fix

### Step 1: Get Your Neon Database URLs

You need TWO URLs from Neon:

1. **DATABASE_URL** (Pooled Connection) - for application queries
   - Format: `postgresql://user:pass@host-pooler.region.neon.tech/dbname?sslmode=require`
   - Note the `-pooler` suffix

2. **DIRECT_URL** (Direct Connection) - for migrations
   - Format: `postgresql://user:pass@host.region.neon.tech/dbname?sslmode=require`
   - NO `-pooler` suffix

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **VisuTry**
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

| Name | Value | Environment |
|------|-------|-------------|
| `DIRECT_URL` | `postgresql://neondb_owner:npg_QZepxrzP39mo@ep-wandering-union-ad43rx1s.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |

**Important**: Make sure to check all three environments (Production, Preview, Development)

### Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click **"..."** menu → **Redeploy**

OR simply push a new commit:
```bash
git push origin main
```

---

## 📋 Complete Environment Variables Checklist

Make sure ALL of these are configured in Vercel:

### Database (Required)
- [x] `DATABASE_URL` - Neon pooled connection
- [ ] `DIRECT_URL` - Neon direct connection ⚠️ **MISSING**

### Authentication (Required)
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://visutry.com`)
- [ ] `NEXTAUTH_SECRET` - Random secret key
- [ ] `AUTH0_ID` - Auth0 client ID
- [ ] `AUTH0_SECRET` - Auth0 client secret
- [ ] `AUTH0_ISSUER_BASE_URL` - Auth0 domain

### Payment (Required)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_...)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `STRIPE_PREMIUM_MONTHLY_PRICE_ID` - Monthly subscription price ID
- [ ] `STRIPE_PREMIUM_YEARLY_PRICE_ID` - Yearly subscription price ID
- [ ] `STRIPE_CREDITS_PACK_PRICE_ID` - Credits pack price ID

### AI Service (Required)
- [ ] `GEMINI_API_KEY` - Google Gemini API key

### File Storage (Required)
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

### App Configuration (Optional)
- [ ] `FREE_TRIAL_LIMIT` - Default: 3
- [ ] `MONTHLY_QUOTA` - Default: 30
- [ ] `YEARLY_QUOTA` - Default: 420
- [ ] `CREDITS_PACK_AMOUNT` - Default: 10

---

## 🔍 How to Verify

After adding `DIRECT_URL` and redeploying:

1. Check deployment logs for:
   ```
   ✔ Generated Prisma Client
   No pending migrations to apply.
   ```

2. Visit your site: `https://visutry.com`

3. Test admin panel: `https://visutry.com/admin`

---

## 📚 Reference

- Your Neon Database: `ep-wandering-union-ad43rx1s.c-2.us-east-1.aws.neon.tech`
- Database Name: `neondb`
- User: `neondb_owner`

For more details, see:
- [Admin Deployment Guide](docs/guides/admin-deployment-guide.md)
- [Neon Setup Guide](NEON_SETUP.md)

---

## 🆘 Still Having Issues?

If deployment still fails after adding `DIRECT_URL`:

1. Check Vercel deployment logs
2. Verify the `DIRECT_URL` format is correct (no `-pooler` suffix)
3. Make sure the environment variable is set for "Production" environment
4. Try clearing Vercel build cache: Settings → General → Clear Build Cache

---

**Created**: 2025-10-21  
**Status**: ⚠️ Action Required

