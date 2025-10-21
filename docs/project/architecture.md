# VisuTry Project Architecture & Features

## 📋 Project Overview

VisuTry is a full-stack AI-powered glasses try-on application built with Next.js. Users can upload their photos and custom glasses images to preview how different glasses look on them using AI technology.

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Database**: Neon PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js + Auth0 (supports Google, Twitter, etc.)
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Service**: Google Gemini API

### Deployment
- **Platform**: Vercel
- **Database**: Neon PostgreSQL
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

## ✅ Implemented Features

### 1. User Authentication
- Auth0 integration for multiple OAuth providers (Google, Twitter, etc.)
- Session management with JWT
- User profile and account management

### 2. Image Upload
- Drag & drop support
- Image compression and preview
- Multiple format support (JPEG, PNG, WebP)
- File size limit (5MB)

### 3. AI Try-On Feature
- User photo and custom glasses image upload
- Asynchronous AI image processing with live status updates
- Result display and history

### 4. Payment System
- Stripe integration for subscriptions and one-time purchases
- Free trial and credits system
- Premium plans (monthly/yearly)

### 5. Share Feature
- Generation of shareable links for try-on results
- Social media integration

### 6. User Dashboard
- Try-on history, usage statistics, and payment records

## 📊 Database Schema (Prisma)

### Core Tables

1.  **User**
    - `id`, `name`, `email`, `image`, `username`
    - `freeTrialsUsed`: Number of free trials used.
    - `premiumUsageCount`: Usage count for premium subscribers.
    - `creditsBalance`: Balance of purchased credits.
    - `isPremium`, `premiumExpiresAt`: Subscription status.

2.  **TryOnTask**
    - `userImageUrl`, `glassesImageUrl`, `resultImageUrl`
    - `status`: PENDING, PROCESSING, COMPLETED, FAILED
    - `prompt`, `metadata`: AI generation details.

3.  **Payment**
    - `stripeSessionId`, `stripePaymentId`
    - `amount`, `currency`
    - `status`: PENDING, COMPLETED, FAILED, REFUNDED
    - `productType`: PREMIUM_MONTHLY, PREMIUM_YEARLY, CREDITS_PACK

4.  **GlassesFrame** (Deprecated - Not used in MVP)
    - `name`, `description`, `imageUrl`, etc.

### NextAuth.js Tables

-   **Account**: Stores provider account information.
-   **Session**: Manages user sessions.
-   **VerificationToken**: For email verification tokens.

## 🔌 API Design

### Authentication (`/api/auth/*`)
- Handled by NextAuth.js and Auth0.

### Try-On Feature (`/api/try-on/*`)
- `POST /`: Create a new try-on task.
- `GET /[id]`: Get the result of a specific task.
- `GET /history`: Get the user's try-on history.

### Payment System (`/api/payment/*`)
- `POST /create-session`: Create a Stripe Checkout session.
- `POST /webhook`: Handle Stripe webhook events.

### File Management (`/api/upload`)
- `POST /`: Handle file uploads.

### Other APIs
- `/api/share/[id]`: Get shared try-on results.
- `/api/health`: Health check endpoint.
- `/api/admin/*`: Admin-only endpoints.
- `/api/debug/*`: Debugging tools.

## 🏗️ Component & Page Architecture

### Page Components (`src/app/`)
```
src/app/
├── (main)/
│   ├── dashboard/
│   ├── pricing/
│   ├── try-on/
│   └── ...
├── auth/
├── blog/
├── legal/ (privacy, terms, refund)
├── share/[id]/
└── ...
```

### UI Components (`src/components/`)
```
src/components/
├── auth/
├── dashboard/
├── layout/
├── pricing/
├── providers/
├── share/
├── try-on/
├── upload/
└── ...
```

## 🔄 Core Workflows

-   **Authentication**: User signs in via Auth0 -> NextAuth.js creates a session and syncs user to the database via Prisma Adapter.
-   **Try-On**: User uploads images -> API creates a `TryOnTask` -> AI service processes the task -> Result is saved and displayed.
-   **Payment**: User selects a plan -> Stripe Checkout session is created -> Stripe webhook updates the user's `isPremium` status.
```