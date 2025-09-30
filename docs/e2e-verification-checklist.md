# VisuTry E2E Verification Checklist

## 📋 Overview
This checklist guides you through verifying all key features work end-to-end with real services in your local development environment.

**Environment**: Local Development  
**Mode**: Real services (not mock)  
**Date Started**: 2025-09-30

---

## 🔧 Phase 1: Service Configuration

### ✅ 1.1 Twitter OAuth (COMPLETED)
- [x] Twitter Developer account created
- [x] App registered with OAuth 2.0
- [x] Client ID and Secret configured
- [x] Callback URL set to `http://localhost:3000/api/auth/callback/twitter`
- [x] Login tested and working

### 1.2 Supabase PostgreSQL Database
- [ ] **Create Supabase Project**
  - [ ] Sign up at https://supabase.com
  - [ ] Create new project
  - [ ] Note project URL and API keys
  
- [ ] **Configure Connection**
  - [ ] Get connection string from Supabase dashboard
  - [ ] Add to `.env.local`:
    ```
    DATABASE_URL="postgresql://..."
    DIRECT_URL="postgresql://..."
    ```
  
- [ ] **Run Migrations**
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```
  
- [ ] **Verify Connectivity**
  ```bash
  npx prisma studio
  ```
  - [ ] Can open Prisma Studio
  - [ ] Can see database tables

### 1.3 Vercel Blob Storage
- [ ] **Get Blob Token**
  - [ ] Go to Vercel dashboard → Storage → Create Blob Store
  - [ ] Copy `BLOB_READ_WRITE_TOKEN`
  
- [ ] **Configure in .env.local**
  ```
  BLOB_READ_WRITE_TOKEN="vercel_blob_..."
  ```
  
- [ ] **Test Upload** (will verify in Phase 2)

### 1.4 Google Gemini API
- [ ] **Get API Key**
  - [ ] Go to https://makersuite.google.com/app/apikey
  - [ ] Create API key
  
- [ ] **Configure in .env.local**
  ```
  GEMINI_API_KEY="AIza..."
  ```
  
- [ ] **Test API** (will verify in Phase 2)

### 1.5 Stripe Payment (Test Mode)
- [ ] **Create Stripe Account**
  - [ ] Sign up at https://stripe.com
  - [ ] Switch to Test Mode
  
- [ ] **Get API Keys**
  - [ ] Copy Publishable key
  - [ ] Copy Secret key
  - [ ] Copy Webhook signing secret (after setting up webhook)
  
- [ ] **Configure in .env.local**
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
  STRIPE_SECRET_KEY="sk_test_..."
  STRIPE_WEBHOOK_SECRET="whsec_..."
  ```
  
- [ ] **Set Up Webhook**
  - [ ] Use Stripe CLI or ngrok for local testing
  - [ ] Forward to `http://localhost:3000/api/payment/webhook`
  - [ ] Test webhook receives events

---

## 🧪 Phase 2: Feature Verification

### ✅ 2.1 Authentication Flow (COMPLETED)
- [x] Navigate to http://localhost:3000
- [x] Click "Sign In"
- [x] Complete Twitter OAuth
- [x] Redirected back to app
- [x] User profile displayed
- [x] Session persists on refresh
- [x] Logout works

**Status**: ✅ VERIFIED

---

### 2.2 Image Upload & Storage

**Prerequisites**: Vercel Blob configured

#### Test Steps:
1. [ ] **Start Dev Server**
   ```bash
   npm run dev
   ```

2. [ ] **Login** (if not already)

3. [ ] **Navigate to Try-On Page**
   - [ ] Go to http://localhost:3000/try-on

4. [ ] **Upload User Photo**
   - [ ] Click upload area
   - [ ] Select valid image (< 5MB, JPEG/PNG/WebP)
   - [ ] Image preview appears
   - [ ] No errors in console

5. [ ] **Upload Glasses Image**
   - [ ] Click second upload area
   - [ ] Select glasses image
   - [ ] Image preview appears

6. [ ] **Verify in Vercel Dashboard**
   - [ ] Go to Vercel → Storage → Blob
   - [ ] See uploaded images
   - [ ] Image URLs are accessible

#### Error Scenarios:
- [ ] Upload file > 5MB → Shows error
- [ ] Upload non-image file → Shows error
- [ ] Upload without login → Redirects to login

**Status**: ⏳ PENDING

---

### 2.3 AI Try-On Processing

**Prerequisites**: Gemini API configured, images uploaded

#### Test Steps:
1. [ ] **Submit Try-On Request**
   - [ ] Both images uploaded
   - [ ] Click "Try On" button
   - [ ] Loading indicator appears

2. [ ] **Monitor Processing**
   - [ ] Check browser console for logs
   - [ ] Check terminal for API calls
   - [ ] Wait for completion (< 30 seconds expected)

3. [ ] **Verify Result**
   - [ ] Result image displays
   - [ ] Image quality is acceptable
   - [ ] Download button works
   - [ ] Share button appears

4. [ ] **Check Database**
   - [ ] Open Prisma Studio
   - [ ] Find TryOnTask record
   - [ ] Status is "COMPLETED"
   - [ ] resultImageUrl is populated

#### Error Scenarios:
- [ ] Invalid image format → Shows error
- [ ] API key invalid → Shows error message
- [ ] Network timeout → Shows retry option

**Status**: ⏳ PENDING

---

### 2.4 Try-On History

**Prerequisites**: At least one try-on completed

#### Test Steps:
1. [ ] **Navigate to History**
   - [ ] Go to http://localhost:3000/dashboard/history
   - [ ] Or click "History" in navigation

2. [ ] **View History List**
   - [ ] See list of try-on records
   - [ ] Each record shows:
     - [ ] Thumbnail images
     - [ ] Status
     - [ ] Date/time
     - [ ] Actions (view, delete)

3. [ ] **Test Pagination**
   - [ ] If > 10 records, pagination appears
   - [ ] Click "Next" → Shows next page
   - [ ] Click "Previous" → Shows previous page

4. [ ] **Test Filtering**
   - [ ] Filter by status (completed/processing/failed)
   - [ ] Results update correctly

5. [ ] **Delete Record**
   - [ ] Click delete on a record
   - [ ] Confirm deletion
   - [ ] Record removed from list
   - [ ] Verify in database (Prisma Studio)

**Status**: ⏳ PENDING

---

### 2.5 Payment Flow

**Prerequisites**: Stripe configured in test mode

#### Test Steps:
1. [ ] **View Pricing Page**
   - [ ] Go to http://localhost:3000/pricing
   - [ ] See pricing plans
   - [ ] Free and Premium options visible

2. [ ] **Initiate Checkout**
   - [ ] Click "Upgrade to Premium"
   - [ ] Redirected to Stripe Checkout
   - [ ] Checkout page loads correctly

3. [ ] **Complete Test Payment**
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Any future expiry date
   - [ ] Any 3-digit CVC
   - [ ] Complete payment

4. [ ] **Verify Webhook**
   - [ ] Check terminal for webhook event
   - [ ] Event type: `checkout.session.completed`
   - [ ] No errors in processing

5. [ ] **Verify User Status**
   - [ ] Refresh page
   - [ ] User shows as Premium
   - [ ] Premium features unlocked
   - [ ] Check database: `isPremium = true`

6. [ ] **Test Premium Features**
   - [ ] Unlimited try-ons available
   - [ ] No usage limit warnings

#### Error Scenarios:
- [ ] Payment declined → Shows error
- [ ] Webhook fails → User not upgraded (check logs)

**Status**: ⏳ PENDING

---

### 2.6 Share Feature

**Prerequisites**: At least one completed try-on

#### Test Steps:
1. [ ] **Generate Share Link**
   - [ ] View a completed try-on result
   - [ ] Click "Share" button
   - [ ] Share options appear

2. [ ] **Copy Share Link**
   - [ ] Click "Copy Link"
   - [ ] Link copied to clipboard
   - [ ] Format: `http://localhost:3000/share/[task-id]`

3. [ ] **Test Public Access**
   - [ ] Open link in incognito/private window
   - [ ] Page loads without login
   - [ ] Result image visible
   - [ ] User info displayed (if public)

4. [ ] **Test Social Sharing**
   - [ ] Click Twitter share → Opens Twitter with pre-filled text
   - [ ] Click Facebook share → Opens Facebook share dialog
   - [ ] Links work correctly

**Status**: ⏳ PENDING

---

## 📊 Summary

### Configuration Status
- [x] Twitter OAuth: ✅ DONE
- [ ] Supabase Database: ⏳ TODO
- [ ] Vercel Blob: ⏳ TODO
- [ ] Gemini API: ⏳ TODO
- [ ] Stripe Payment: ⏳ TODO

### Feature Verification Status
- [x] Authentication: ✅ VERIFIED
- [ ] Image Upload: ⏳ PENDING
- [ ] AI Try-On: ⏳ PENDING
- [ ] History: ⏳ PENDING
- [ ] Payment: ⏳ PENDING
- [ ] Share: ⏳ PENDING

### Overall Progress: 2/11 (18%)

---

## 🐛 Issues Found

_Document any issues discovered during verification_

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| - | - | - | - |

---

## 📝 Notes

_Add any observations or notes during verification_

---

**Last Updated**: 2025-09-30

