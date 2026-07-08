# VisuTry Project Architecture & Features

**Status:** Active source of truth for current technical reality  
**Last reviewed:** 2026-07-08  
**Owner:** Engineering  
**Review cadence:** Monthly, or before major product architecture work  
**Scope:** Current VisuTry technical stack, implemented capabilities, core data model, APIs, pages, components, and workflows.  
**Current guidance:** This document describes the current system. Product priority lives in `docs/product/product-plan.md`; commercial direction lives in `docs/strategy/commercial-strategy.md`; detailed feature behavior should live in `docs/product/specs/`.

---

## 📋 Project Overview

VisuTry is a full-stack AI-powered glasses try-on and eyewear decision application built with Next.js.

The current product includes user authentication, image upload, AI glasses try-on, payment / credits, dashboard history, sharing, SEO/Growth surfaces, and face-analysis / face-landmark capabilities.

The current product direction is documented in `docs/product/product-plan.md`:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

---

## 🛠 Technology Stack

### Frontend

- **Framework**: Next.js 14 App Router
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks
- **Localization**: `next-intl`

### Backend

- **API**: Next.js API Routes / Route Handlers
- **Database**: Neon PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js + Auth0
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Try-On Service**: Google Gemini API
- **Face Landmark / Local Vision**: MediaPipe Tasks Vision
- **Email / Notification Infrastructure**: Resend / Nodemailer where configured

### Deployment

- **Platform**: Vercel
- **Database**: Neon PostgreSQL
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics, GA/GTM where configured

---

## ✅ Implemented Features

### 1. User Authentication

- Auth0 integration through NextAuth.js.
- OAuth provider configuration handled in Auth0.
- Session management with JWT / NextAuth session flow.
- User profile and account management.

### 2. Image Upload

- Image upload and preview.
- Multiple format support where implemented: JPEG, PNG, WebP.
- Vercel Blob-backed storage for persisted generated results and uploaded assets.

### 3. AI Try-On Feature

- User photo and custom glasses image upload.
- Asynchronous AI image processing with live status updates.
- Result display and history.
- Shareable result surfaces.

### 4. Face Analysis / Face Landmark Foundation

- Browser-side MediaPipe face landmark capability exists.
- Geometry-based face measurements and face-shape classification are part of the product foundation.
- Deeper report / VLM-based flows are separate from the free local detector direction.

### 5. Payment System

- Stripe integration for one-time purchases and subscription-style plans.
- Free trial and credits system.
- Credits Pack is the current primary casual consumer monetization path in product strategy.
- Premium monthly / yearly plans exist as infrastructure but should not be assumed to be the primary commercial story.

### 6. Share Feature

- Generation of shareable links for try-on results.
- Social media sharing surfaces.

### 7. User Dashboard

- Try-on history.
- Usage / quota visibility.
- Payment records.

---

## 📊 Database Schema (Prisma)

### Core Tables

1. **User**
   - `id`, `name`, `email`, `image`, `username`
   - `freeTrialsUsed`: Number of free trials used.
   - `premiumUsageCount`: Usage count for premium subscribers.
   - `creditsBalance`: Balance of purchased credits.
   - `isPremium`, `premiumExpiresAt`: Subscription status.

2. **TryOnTask**
   - `userImageUrl`, `glassesImageUrl`, `resultImageUrl`
   - `status`: PENDING, PROCESSING, COMPLETED, FAILED
   - `prompt`, `metadata`: AI generation details.

3. **Payment**
   - `stripeSessionId`, `stripePaymentId`
   - `amount`, `currency`
   - `status`: PENDING, COMPLETED, FAILED, REFUNDED
   - `productType`: PREMIUM_MONTHLY, PREMIUM_YEARLY, CREDITS_PACK

4. **GlassesFrame**
   - Historical / deprecated in the original MVP architecture.
   - Future merchant / catalog work should not assume this old model is sufficient.
   - Use `docs/product/specs/visutry-store-mvp.md` for current Merchant / Store / Frame Catalog direction.

### NextAuth.js Tables

- **Account**: Stores provider account information.
- **Session**: Manages user sessions.
- **VerificationToken**: For email verification tokens.

---

## 🔌 API Design

### Authentication (`/api/auth/*`)

- Handled by NextAuth.js and Auth0.

### Try-On Feature (`/api/try-on/*`)

- Submit route creates a new try-on task.
- Poll/status route reads task status and result.
- History route reads user's try-on history where implemented.

### Face Analysis (`/api/face-analysis/*`)

- Server-side analysis / deeper report routes exist for paid or logged-in analysis flows.
- Free local detector direction should avoid unnecessary upload, database task creation, and VLM call.

### Payment System (`/api/payment/*`, Stripe webhook routes)

- Creates Stripe Checkout sessions.
- Handles Stripe webhook events.
- Updates user entitlement, credits, or payment records.

### File Management

- Vercel Blob is used for persisted files.

### Other APIs

- `/api/share/*`: shared try-on result surfaces.
- `/api/health`: health check endpoint.
- `/api/admin/*`: admin-only endpoints.
- `/api/debug/*`: debugging tools where enabled.

---

## 🏗️ Component & Page Architecture

### Page Components (`src/app/`)

```text
src/app/
├── [locale]/
│   └── (main)/
│       ├── dashboard/
│       ├── pricing/
│       ├── try-on/
│       ├── face-analysis/
│       └── ...
├── api/
├── auth/
├── blog/
├── legal/ or legal-style pages
├── share/[id]/
└── ...
```

### UI Components (`src/components/`)

```text
src/components/
├── auth/
├── dashboard/
├── face-analysis/
├── layout/
├── pricing/
├── providers/
├── share/
├── try-on/
├── upload/
└── ...
```

---

## 🔄 Core Workflows

- **Authentication**: User signs in via Auth0 / NextAuth.js → session is created → user is synced to the database through Prisma-related auth flow.
- **Try-On**: User uploads images → API creates a `TryOnTask` → AI service processes the task → result is saved and displayed.
- **Payment / Credits**: User selects a paid option → Stripe Checkout session is created → Stripe webhook updates credits, entitlement, or payment records.
- **Face Analysis**: Current server-side flow supports deeper report / VLM-based analysis; current product direction separates this from free local detector work.
- **Sharing**: Completed try-on results can be exposed through share surfaces.

---

## 🧭 Architecture Review Notes

This document should be reviewed against the codebase before major work in the following areas:

1. Merchant / Store / Frame Catalog models.
2. Frame Compare implementation.
3. Credits Pack conversion and failed-generation handling.
4. Free local Face Shape Detector architecture.
5. Shopify / widget / public API work.

Detailed specs should be created or updated under `docs/product/specs/` before engineering starts on those capabilities.
