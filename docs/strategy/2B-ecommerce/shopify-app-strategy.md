# Shopify App Strategy - VisuTry 2B Expansion

## 1. Objective
Expand VisuTry's market reach by launching a Shopify App. This app will allow e-commerce merchants to easily integrate our AI Virtual Try-On technology into their stores. The primary goal is **Market Validation**: verifying demand and functionality in the Shopify ecosystem with minimal initial overhead.

## 2. Technology Stack

### Shopify App (The Frontend/Connector)
- **Framework**: Remix (Recommended by Shopify)
- **UI Component Library**: Polaris (Shopify Official)
- **Tools**: Shopify CLI
- **Hosting**: Shopify App infrastructure / Vercel (for the Remix app)

### Core Backend (The Engine)
- **Existing System**: VisuTry (Next.js)
- **Role**: Provides the AI Try-On API, image processing, and storage.

## 3. Current Architecture Analysis & Optimization Needs

Before launching the Shopify App, the current VisuTry B2C application (`src/app/api/try-on`) requires specific optimizations to support B2B/External usage.

### 3.1 Existing Strengths (To Retain)
- **AI Core**: `generateTryOnImage` is mature, stable, and supports multiple dry-on types (Glasses, etc.).
- **Storage Infrastructure**: Vercel Blob integration is robust and performant.
- **Logging**: The system has comprehensive tracing and error logging, essential for debugging remote 3rd-party calls.
- **Quota Logic**: The improved quota system (Credits/Subscriptions) logic is reusable for Merchants.

### 3.2 Architectural Gaps
| Component | Current State (B2C) | Gap for B2B/Shopify |
| :--- | :--- | :--- |
| **Authentication** | Relies on `next-auth` Sessions (Cookies). | Shopify Apps cannot share cookies. Requires **API Key** or Token-based auth (Header: `X-API-Key`). |
| **Identity Model** | Built around single `User` entity. | Needs a **Merchant** entity. A merchant represents a business that may serve thousands of "end-users" (shoppers). |
| **Coupling** | API Route (`route.ts`) mixes HTTP usage, Validation, Quota, and Business Logic. | Logic needs to be extracted into a `TryOnService` so it can be invoked by different controllers (Web UI vs External API). |
| **Billing** | Per-user subscription. | Usage-based billing or Tiered plans for Merchants (via Shopify Billing API). |

### 3.3 Optimization Plan (Pre-Launch)

To support the Shopify App without rewriting the entire core, we will perform the following optimizations:

#### A. Refactor Business Logic (Service Layer)
Extract core logic from `src/app/api/try-on/route.ts` into `src/lib/services/try-on-service.ts`.
- **Why**: Allows us to reuse the exact same image processing and quota logic for both our own website users and external API callers.
- **Action**: Create `TryOnService.process(userId, files, type)` that returns the result, agnostic of the HTTP request source.

#### B. Implement API Key Authentication
- **Action**: Add `api_key` field to the `User` (or new `Merchant`) table.
- **Action**: Create middleware or utility `validateApiKey(request)` to authenticate calls from the Shopify App.

#### C. Dedicated External Endpoint
- **Action**: Create `src/app/api/v1/external/try-on/route.ts`.
- **Spec**: Accepts JSON/FormData, validates API Key, calls `TryOnService`, and returns standardized JSON. This keeps the internal B2C API safe and separate.

## 4. Implementation Strategy: Phase 1 (MVP + API Key)

To balance speed and architecture, we will adopt a hybrid approach: **Phase 1 + Simple API Key**.

### Step 1: Core System Upgrades (VisuTry Side)
1.  **Service Extraction**: Refactor `api/try-on` to isolate the core execution logic.
2.  **API Key Auth**: Enable a "Developer Mode" in the user settings to generate an API Key.
3.  **External Endpoint**: Deploy the new API endpoint optimized for machine-to-machine communication.

### Step 2: Shopify App Development
1.  **App Structure**: Initialize using Shopify CLI + Remix in a sibling directory (`../VisuTry-Shopify`).
2.  **Configuration**:
    *   Merchant installs App.
    *   Merchant inputs their VisuTry API Key (obtained from our dashboard).
3.  **Storefront Integration**:
    *   Inject "Try-On" button via Shopify App Embed Blocks.
    *   On click, fetch signed URL or directly call Shopify App Backend -> calls VisuTry External API.

## 5. Roadmap

### Phase 1: MVP (Current Focus)
- **Goal**: Functional "Try-On" button on a development Shopify store.
- **Auth**: Manual API Key copy-paste.
- **Billing**: None (or manual).
- **Features**: Basic Glasses Try-On.

### Phase 2: Automation & Billing
- **Goal**: Self-service onboarding for any Shopify merchant.
- **Auth**: OAuth flow (Shopify merchant auto-creates VisuTry account).
- **Billing**: Integrated Shopify Billing API (charges appear on Shopify invoice).
- **Features**: Custom branding, analytics dashboard for merchants.

## 6. Next Actions
1.  Create `TryOnService` abstraction in existing codebase.
2.  Add `apiKey` support to User model.
3.  Register Shopify Partners account.
4.  Initialize Shopify App project.
