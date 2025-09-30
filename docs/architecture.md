# VisuTry Project Architecture & Features

## 📋 Project Overview

VisuTry is a full-stack AI-powered glasses try-on application built with Next.js. Users can upload their photos and custom glasses images to preview how different glasses look on them using AI technology.

**Current Focus**: Minimum Viable Product (MVP) with core features only.

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Twitter OAuth)
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Service**: Google Gemini API

### Deployment
- **Platform**: Vercel
- **Database**: Hosted PostgreSQL (Supabase recommended)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

## ✅ Implemented Features (MVP)

### 1. User Authentication
- Twitter OAuth login
- Session management
- User profile display
- Login/logout functionality

### 2. Image Upload
- Drag & drop support
- Image compression and preview
- Multiple format support (JPEG, PNG, WebP)
- File size limit (5MB)

### 3. AI Try-On Feature
- User photo upload
- **Custom glasses image upload** (simplified - no preset frames)
- AI image processing (Gemini API)
- Asynchronous task processing
- Real-time status polling
- Result display

### 4. Payment System
- Stripe integration
- Free trial quota management (3 free try-ons)
- Premium plans (monthly/yearly)
- Payment history

### 5. Share Feature
- Try-on result sharing links
- Social media integration (Twitter, Facebook next)
- Public access pages

### 6. User Dashboard
- Try-on history
- Usage statistics
- Account management
- Payment records

## 📊 Database Schema

### Core Tables

1. **User** - User information
   - Basic info (id, name, email, image)
   - Trial usage (freeTrialsUsed)
   - Premium status (isPremium, premiumExpiresAt)

2. **TryOnTask** - Try-on tasks
   - Input images (userImageUrl, glassesImageUrl)
   - Output result (resultImageUrl)
   - Task status (PENDING/PROCESSING/COMPLETED/FAILED)

3. **Payment** - Payment records
   - Stripe integration (stripeSessionId, stripePaymentId)
   - Product type (PREMIUM_MONTHLY/YEARLY/CREDITS_PACK)

4. **GlassesFrame** - Glasses frame library (deprecated - not used in MVP)
   - Frame info (name, description, imageUrl)
   - Category management (category, brand)
   - **Note**: Kept for future use, but not currently used in the UI

## 🔌 API Design

### Authentication
```
POST /api/auth/signin     # User login
POST /api/auth/signout    # User logout
GET  /api/auth/session    # Get session info
```

### Try-On Feature
```
POST /api/try-on          # Create try-on task (requires userImage + glassesImage)
GET  /api/try-on/[id]     # Get try-on result
GET  /api/try-on/history  # Get user history
POST /api/try-on/[id]/feedback  # Submit feedback (like/dislike)
```

### Payment System
```
POST /api/payment/create-session  # Create payment session
POST /api/payment/webhook         # Stripe webhook
```

### File Management
```
POST /api/upload          # File upload
GET  /api/frames          # Get glasses frames list (deprecated - not used)
```

### Sharing
```
GET  /api/share/[id]      # Get shared try-on result
```

## 🏗️ Component Architecture

### Page Components
```
src/app/
├── page.tsx              # Home page
├── auth/                 # Authentication pages
│   └── signin/
├── dashboard/            # User dashboard
│   └── history/
├── try-on/               # Try-on feature page
├── share/[id]/           # Share page
├── pricing/              # Pricing page
└── user/[username]/      # Public user profile
```

### UI Components
```
src/components/
├── auth/                 # Authentication components
│   ├── LoginButton.tsx
│   └── UserProfile.tsx
├── upload/               # Upload components
│   └── ImageUpload.tsx
├── try-on/               # Try-on components
│   ├── TryOnInterface.tsx
│   ├── ResultDisplay.tsx
│   └── FrameSelector.tsx  (deprecated - not used in MVP)
├── dashboard/            # Dashboard components
│   ├── DashboardStats.tsx
│   ├── RecentTryOns.tsx
│   └── TryOnHistoryList.tsx
├── payment/              # Payment components
│   └── PricingCard.tsx
└── user/                 # User profile components
    ├── UserPublicProfile.tsx
    └── PublicTryOnGallery.tsx
```

## 🔄 Try-On Workflow (Simplified)

1. User uploads their photo
2. User uploads custom glasses image
3. System calls Gemini API for image synthesis
4. Returns try-on result and saves to database
5. User can share result to social media

**Note**: Preset frame selection has been removed to simplify the MVP.

## 💳 Payment Workflow

1. User selects a premium plan
2. Creates Stripe Checkout session
3. User completes payment
4. Webhook updates user premium status
5. Unlocks unlimited try-ons

## 🔒 Security Considerations

### Data Security
- All API routes have proper authentication checks
- Users can only access their own data
- Sensitive information stored in environment variables

### File Security
- Image upload size limit (5MB)
- File type validation (JPEG/PNG/WebP)
- Automatic image compression and optimization

### Payment Security
- Stripe secure payment processing
- Webhook signature verification
- No sensitive payment info stored locally

## ⚡ Performance Optimization

### Frontend
- Next.js automatic code splitting
- Image lazy loading and optimization
- Tailwind CSS on-demand loading

### Backend
- Database query optimization
- API response caching
- Image CDN acceleration

### AI Service
- Asynchronous task processing
- Error retry mechanism
- Result caching strategy

## 📈 Monitoring & Analytics

### Application Monitoring
- Vercel Analytics integration
- Error log collection
- Performance metrics monitoring

### Business Analytics
- User usage statistics
- Try-on success rate analysis
- Payment conversion tracking

## 🚀 Development Workflow

### Code Quality
- TypeScript type checking
- ESLint code standards
- Prettier code formatting

### Testing Strategy
- Unit tests (Jest + React Testing Library)
- Integration tests
- E2E tests (Playwright)

### Deployment Process
- Git commit triggers automatic deployment
- Environment variable management
- Database migration automation

## 🎯 MVP Scope (Current Focus)

### ✅ Included in MVP
- User authentication (Twitter OAuth)
- Custom image upload (user photo + glasses image)
- AI try-on processing
- Basic payment system (free trials + premium)
- Share functionality
- User dashboard

### ❌ Not Included in MVP (Future)
- Preset glasses frame library
- Multiple authentication providers
- Advanced analytics
- Mobile app
- Multi-language support
- Admin dashboard

## 📝 Notes

- **Language**: All user-facing text is in English
- **Focus**: Core functionality only, no extra features
- **Testing**: Mock mode available for development
- **Deployment**: Vercel with automatic CI/CD

