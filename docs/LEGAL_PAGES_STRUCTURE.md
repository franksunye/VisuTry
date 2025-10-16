# Legal Pages Structure

## Page Hierarchy

```
VisuTry Application
│
├── Home (/)
│   └── Footer → Legal Links
│
├── Try-On (/try-on)
│   └── Footer → Legal Links
│
├── Pricing (/pricing)
│   ├── Legal Notice (inline)
│   └── Footer → Legal Links
│
├── Dashboard (/dashboard)
│   └── Footer → Legal Links
│
├── Blog (/blog)
│   └── Footer → Legal Links
│
└── Legal Pages
    ├── Privacy Policy (/privacy)
    │   ├── Header with Back Link
    │   ├── Content Sections
    │   │   ├── 1. Introduction
    │   │   ├── 2. Information We Collect
    │   │   ├── 3. How We Use Your Information
    │   │   ├── 4. Third-Party Services
    │   │   ├── 5. Data Storage and Security
    │   │   ├── 6. Data Retention
    │   │   ├── 7. Your Privacy Rights
    │   │   ├── 8. Cookies and Tracking
    │   │   ├── 9. Children's Privacy
    │   │   ├── 10. Changes to Privacy Policy
    │   │   └── 11. Contact Us
    │   └── Footer → Legal Links
    │
    ├── Terms of Service (/terms)
    │   ├── Header with Back Link
    │   ├── Content Sections
    │   │   ├── 1. Agreement to Terms
    │   │   ├── 2. Service Description
    │   │   ├── 3. Account Registration and Security
    │   │   ├── 4. User Responsibilities and Conduct
    │   │   ├── 5. Intellectual Property Rights
    │   │   ├── 6. Payment and Subscription Terms
    │   │   ├── 7. Service Limitations and Disclaimers
    │   │   ├── 8. Limitation of Liability
    │   │   ├── 9. Indemnification
    │   │   ├── 10. Termination
    │   │   ├── 11. Dispute Resolution
    │   │   ├── 12. Changes to Terms
    │   │   └── 13. Contact Information
    │   └── Footer → Legal Links
    │
    └── Refund Policy (/refund)
        ├── Header with Back Link
        ├── Content Sections
        │   ├── 1. Overview
        │   ├── 2. Subscription Refunds
        │   ├── 3. Credits Pack Refunds
        │   ├── 4. Non-Refundable Items
        │   ├── 5. Subscription Cancellation
        │   ├── 6. How to Request a Refund
        │   ├── 7. Special Circumstances
        │   ├── 8. Chargebacks and Disputes
        │   ├── 9. Changes to This Policy
        │   └── 10. Contact Us
        └── Footer → Legal Links
```

## Component Structure

```
src/
├── app/
│   ├── layout.tsx (includes Footer globally)
│   ├── privacy/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   └── refund/
│       └── page.tsx
│
└── components/
    └── layout/
        └── Footer.tsx
```

## Footer Component Structure

```
Footer
├── Brand Section (2 columns on desktop)
│   ├── Logo + Name
│   ├── Description
│   └── Social Links
│       ├── Twitter
│       ├── GitHub
│       └── Email
│
├── Product Links (1 column)
│   ├── Try On
│   ├── Pricing
│   └── Blog
│
├── Legal Links (1 column)
│   ├── Privacy Policy
│   ├── Terms of Service
│   └── Refund Policy
│
└── Bottom Bar
    ├── Copyright Notice
    └── Tagline
```

## Navigation Flow

```
User Journey for Legal Information:

1. From Any Page
   ↓
   Scroll to Footer
   ↓
   Click Legal Link
   ↓
   View Policy Page
   ↓
   Click "Back to Home" or use Footer links

2. From Pricing Page
   ↓
   Scroll to Legal Notice
   ↓
   Click Policy Link
   ↓
   View Policy Page
   ↓
   Return via Back Link or Footer

3. Direct URL Access
   ↓
   Enter /privacy, /terms, or /refund
   ↓
   View Policy Page
   ↓
   Navigate via Footer or Back Link
```

## Content Organization

### Privacy Policy Sections

```
Privacy Policy
│
├── User Data Collection
│   ├── Personal Information (OAuth)
│   ├── Images (User uploads)
│   └── Usage Data (Analytics)
│
├── Data Usage
│   ├── Service Provision
│   ├── Payment Processing
│   └── AI Processing
│
├── Third-Party Services
│   ├── Stripe (Payments)
│   ├── Google Gemini (AI)
│   ├── Vercel (Hosting)
│   └── Twitter (OAuth)
│
└── User Rights
    ├── Access Data
    ├── Correct Data
    ├── Delete Data
    └── Export Data
```

### Terms of Service Sections

```
Terms of Service
│
├── Service Agreement
│   ├── Service Description
│   ├── User Eligibility
│   └── Account Requirements
│
├── User Obligations
│   ├── Acceptable Use
│   ├── Content Ownership
│   └── Prohibited Activities
│
├── Business Terms
│   ├── Payment Terms
│   ├── Subscription Rules
│   └── Refund References
│
└── Legal Protection
    ├── Liability Limits
    ├── Disclaimers
    └── Dispute Resolution
```

### Refund Policy Sections

```
Refund Policy
│
├── Refund Eligibility
│   ├── Subscription Refunds
│   │   ├── Monthly (7-day guarantee)
│   │   └── Annual (14-day guarantee)
│   └── Credits Pack Refunds
│       └── Unused only (7 days)
│
├── Non-Refundable
│   ├── Used Services
│   ├── Renewals
│   └── Violations
│
├── Cancellation Process
│   ├── How to Cancel
│   ├── Access After Cancel
│   └── Reactivation
│
└── Refund Process
    ├── Request Steps
    ├── Processing Time
    └── Special Cases
```

## Design System

### Color Palette

```
Background:
- Gradient: from-blue-50 to-indigo-100

Containers:
- Glass Effect: rgba(255, 255, 255, 0.25)
- Backdrop Blur: 10px
- Border: rgba(255, 255, 255, 0.18)

Text:
- Headings: gray-900
- Body: gray-700
- Links: blue-600 (hover: blue-700)

Accents:
- Info Boxes: blue-50 border-blue-200
- Warning Boxes: yellow-50 border-yellow-200
- Error Boxes: red-50 border-red-200
- Success Boxes: green-50 border-green-200
```

### Typography Scale

```
H1: text-4xl font-bold (36px)
H2: text-2xl font-semibold (24px)
H3: text-xl font-semibold (20px)
H4: text-base font-semibold (16px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

### Spacing System

```
Section Margin: mb-8 (32px)
Paragraph Margin: mb-4 (16px)
List Item Spacing: space-y-2 (8px)
Container Padding: p-8 (32px)
```

## Responsive Breakpoints

```
Mobile: < 768px
- Single column layout
- Stacked footer sections
- Full-width containers

Tablet: 768px - 1024px
- 2-column footer
- Moderate container width

Desktop: > 1024px
- 4-column footer
- Max-width containers
- Hover effects enabled
```

## SEO Structure

```
Each Legal Page:
│
├── Meta Tags
│   ├── Title
│   ├── Description
│   ├── Keywords
│   └── Canonical URL
│
├── Open Graph
│   ├── og:title
│   ├── og:description
│   ├── og:type
│   └── og:image
│
├── Twitter Card
│   ├── twitter:card
│   ├── twitter:title
│   └── twitter:description
│
└── Structured Data
    ├── Heading Hierarchy (H1-H4)
    ├── Semantic HTML
    └── Accessible Navigation
```

## Integration Points

### 1. Global Layout
```typescript
// src/app/layout.tsx
<SessionProvider>
  <div className="min-h-screen flex flex-col">
    <div className="flex-grow">
      {children}
    </div>
    <Footer />  // ← Legal links here
  </div>
</SessionProvider>
```

### 2. Pricing Page
```typescript
// src/app/pricing/page.tsx
<div className="bg-blue-50 border border-blue-200">
  By subscribing, you agree to our
  <Link href="/terms">Terms of Service</Link>
  and
  <Link href="/privacy">Privacy Policy</Link>
</div>
```

### 3. Sitemap
```typescript
// src/app/sitemap.ts
{
  url: `${baseUrl}/privacy`,
  priority: 0.5,
  changeFrequency: 'monthly'
}
```

## File Locations

```
Legal Pages Implementation:
│
├── Pages
│   ├── src/app/privacy/page.tsx
│   ├── src/app/terms/page.tsx
│   └── src/app/refund/page.tsx
│
├── Components
│   └── src/components/layout/Footer.tsx
│
├── Documentation
│   ├── docs/LEGAL_COMPLIANCE.md
│   ├── docs/LEGAL_PAGES_QUICKSTART.md
│   └── docs/LEGAL_PAGES_STRUCTURE.md (this file)
│
└── Tests
    └── tests/e2e-playwright/legal-pages.spec.ts
```

---

**Last Updated:** January 15, 2025
**Version:** 1.0

