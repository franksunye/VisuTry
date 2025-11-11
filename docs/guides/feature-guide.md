# VisuTry Feature Guide

## 🎯 Core Features

### 1. AI Virtual Try-On

**What it does**: Upload your photo and glasses image to see how they look on you using AI.

**Key capabilities**:
- Real-time AI processing with Google Gemini 2.5 Flash
- Support for custom glasses images
- Asynchronous processing with live status updates
- Result history and management

**User flow**:
1. Upload user photo (JPEG/PNG/WebP, max 5MB)
2. Upload glasses image
3. AI processes the try-on (10-30 seconds)
4. View and share the result

**API**: `POST /api/try-on`

---

### 2. User Authentication

**What it does**: Secure user authentication with multiple OAuth providers.

**Providers**:
- Google OAuth
- Twitter OAuth
- Email/Password (via Auth0)

**Technology**: NextAuth.js + Auth0

**Features**:
- Session management with JWT
- User profile management
- Role-based access control (USER/ADMIN)

**API**: `/api/auth/*` (handled by NextAuth.js)

---

### 3. Quota System

**What it does**: Manage user try-on quotas across different subscription tiers.

**Quota sources**:
- **Free Trial**: 3 tries for new users
- **Premium Monthly**: 30 tries/month
- **Premium Yearly**: 420 tries/year
- **Credits Pack**: 10 tries (one-time purchase, never expire)

**Key features**:
- Unified "total - used" tracking model
- Automatic quota reset on subscription renewal
- Usage priority: Subscription → Credits → Free Trial
- Real-time quota display across all pages

**Related**: See [quota-system.md](./quota-system.md) for detailed design

---

### 4. Payment & Subscription

**What it does**: Stripe-powered payment system for subscriptions and credits.

**Products**:
- **Premium Monthly**: $9.99/month, 30 tries
- **Premium Yearly**: $99.99/year, 420 tries
- **Credits Pack**: $4.99, 10 tries (never expire)

**Stripe integration**:
- Checkout session creation
- Webhook event handling
- Subscription lifecycle management
- Automatic quota updates

**Webhook events**:
- `checkout.session.completed` - Payment success
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Renewal (resets quota)
- `invoice.payment_failed` - Payment failure

**API**: 
- `POST /api/payment/create-session` - Create checkout
- `POST /api/payment/webhook` - Handle Stripe events

---

### 5. User Dashboard

**What it does**: Centralized hub for user activity and account management.

**Sections**:
- **Stats Overview**: Remaining quota, subscription status
- **Try-On History**: Past results with preview
- **Subscription Card**: Current plan and usage progress
- **Quick Actions**: Shortcuts to key features

**Features**:
- Real-time quota display
- Usage progress bars
- Payment history
- Account settings

**Route**: `/[locale]/dashboard`

---

### 6. Admin Panel

**What it does**: Administrative interface for managing users and system.

**Access**: Admin role required (`role: 'ADMIN'`)

**Features**:
- **Dashboard**: System overview and statistics
- **User Management**: View/edit user details, quotas, subscriptions
- **Payment Records**: Transaction history
- **Try-On Tasks**: Monitor AI processing tasks

**Routes**:
- `/admin/dashboard` - Overview
- `/admin/users` - User list
- `/admin/users/[id]` - User details
- `/admin/payments` - Payment records
- `/admin/tasks` - Try-on tasks

**Security**: Protected by middleware, requires ADMIN role

---

### 7. Internationalization (i18n)

**What it does**: Multi-language support for global reach.

**Supported languages** (9):
- English (en)
- Bahasa Indonesia (id)
- العربية (ar)
- Русский (ru)
- Deutsch (de)
- 日本語 (ja)
- Español (es)
- Português (pt)
- Français (fr)

**Technology**: next-intl

**Features**:
- Automatic locale detection
- SEO-friendly URLs (`/en/`, `/es/`, etc.)
- Language switcher in header
- Translated UI and content

**Configuration**: `src/i18n.ts`, `messages/[locale].json`

---

### 8. File Management

**What it does**: Handle image uploads and storage.

**Storage**: Vercel Blob

**Features**:
- Drag & drop upload
- Image compression and preview
- Multiple format support (JPEG, PNG, WebP)
- File size limit: 5MB
- Automatic cleanup of old files

**API**: `POST /api/upload`

---

### 9. Social Sharing

**What it does**: Generate shareable links for try-on results.

**Features**:
- Unique shareable URLs
- Public result viewing (no login required)
- Social media integration
- Open Graph meta tags for rich previews

**API**: `POST /api/share`

**Route**: `/share/[id]`

---

### 10. Demo Mode

**What it does**: Experience all features without API keys.

**Features**:
- Mock AI processing
- Mock authentication
- Mock database
- Mock file storage
- Instant results

**Activation**: Set `NEXT_PUBLIC_DEMO_MODE=true`

**Use case**: Quick testing, demos, development without external services

---

## 🔧 Technical Features

### Real-time Processing
- Asynchronous AI processing
- Live status updates
- Progress indicators

### Responsive Design
- Mobile-first approach
- Tailwind CSS
- Optimized for all screen sizes

### Performance
- Next.js App Router
- Server-side rendering
- Edge caching
- Image optimization

### Security
- JWT-based authentication
- Role-based access control
- CSRF protection
- Secure API endpoints

### Analytics
- Vercel Analytics integration
- User behavior tracking
- Conversion tracking

---

## 📁 Key Routes

### Public Routes
- `/` - Landing page
- `/[locale]/try-on` - Try-on interface
- `/[locale]/pricing` - Pricing plans
- `/[locale]/dashboard` - User dashboard (auth required)
- `/share/[id]` - Shared result view

### Admin Routes (ADMIN role required)
- `/admin/dashboard` - Admin overview
- `/admin/users` - User management
- `/admin/payments` - Payment records
- `/admin/tasks` - Try-on tasks

### API Routes
- `/api/try-on` - Try-on processing
- `/api/payment/*` - Payment handling
- `/api/upload` - File upload
- `/api/auth/*` - Authentication
- `/api/share` - Share generation

---

## 🗄️ Database Models

### User
- Authentication data
- Quota tracking (freeTrialsUsed, premiumUsageCount, creditsPurchased, creditsUsed)
- Subscription status (isPremium, premiumExpiresAt, currentSubscriptionType)
- Role (USER/ADMIN)

### TryOnTask
- User photo and glasses image URLs
- Processing status (PENDING/PROCESSING/COMPLETED/FAILED)
- Result image URL
- Timestamps

### Payment
- Stripe session and subscription IDs
- Product type and amount
- Payment status
- User reference

### Share
- Try-on task reference
- Unique share ID
- View count
- Expiration date

---

## 🔗 External Integrations

- **Google Gemini 2.5 Flash** - AI image processing
- **Auth0** - Authentication provider
- **Stripe** - Payment processing
- **Vercel Blob** - File storage
- **Neon PostgreSQL** - Database
- **Vercel** - Hosting and deployment

