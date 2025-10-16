# Legal Pages Quick Start Guide

## 📋 Overview

VisuTry now includes comprehensive legal compliance pages to meet regulatory requirements and support payment service integrations like Stripe.

## 🔗 Available Pages

### 1. Privacy Policy
- **URL:** `/privacy`
- **Purpose:** Explains how we collect, use, and protect user data
- **Required for:** GDPR, CCPA, Stripe, Google APIs

### 2. Terms of Service
- **URL:** `/terms`
- **Purpose:** Defines rules and responsibilities for using the service
- **Required for:** Legal protection, user agreements

### 3. Refund Policy
- **URL:** `/refund`
- **Purpose:** Clarifies refund conditions and cancellation terms
- **Required for:** Stripe, consumer protection laws

## 🎯 Key Features

### Global Footer
- Automatically appears on all pages
- Contains links to all legal pages
- Includes social media and contact information
- Responsive design for mobile and desktop

### SEO Optimized
- All pages have proper meta tags
- Included in sitemap
- Search engine friendly URLs

### User-Friendly Design
- Consistent with app design language
- Clear section hierarchy
- Easy navigation with "Back to Home" links
- Mobile-responsive layout

## 📍 Where to Find Legal Links

### 1. Footer (All Pages)
Every page now has a footer with legal links:
```
Legal
├── Privacy Policy
├── Terms of Service
└── Refund Policy
```

### 2. Pricing Page
At the bottom of the pricing page:
> "By subscribing, you agree to our Terms of Service and Privacy Policy. View our Refund Policy for cancellation terms."

### 3. Direct URLs
- Privacy: `https://yourdomain.com/privacy`
- Terms: `https://yourdomain.com/terms`
- Refund: `https://yourdomain.com/refund`

## 🛠️ For Developers

### Adding Legal Links to New Pages

The footer is automatically included in all pages through the root layout. No additional setup needed!

### Customizing Footer

Edit `src/components/layout/Footer.tsx` to:
- Update social media links
- Add/remove navigation items
- Modify contact information
- Change styling

### Updating Policies

1. Navigate to the policy file:
   - Privacy: `src/app/privacy/page.tsx`
   - Terms: `src/app/terms/page.tsx`
   - Refund: `src/app/refund/page.tsx`

2. Update the content

3. Change the `lastUpdated` date:
   ```typescript
   const lastUpdated = 'January 15, 2025'
   ```

4. Test locally:
   ```bash
   npm run dev
   ```

5. Deploy changes

### Adding Legal Links to Custom Components

```typescript
import Link from 'next/link'

// In your component
<Link href="/privacy">Privacy Policy</Link>
<Link href="/terms">Terms of Service</Link>
<Link href="/refund">Refund Policy</Link>
```

## ✅ Stripe Integration Checklist

Before submitting your Stripe application:

- [x] Privacy Policy is accessible and mentions Stripe
- [x] Refund Policy clearly states refund terms
- [x] Terms of Service includes payment terms
- [x] All policies are linked in the footer
- [x] Contact information is provided
- [x] Policies are up-to-date

## 🎨 Design Guidelines

### Color Scheme
- Background: Gradient from blue-50 to indigo-100
- Containers: Glass-effect with backdrop blur
- Links: Blue-600 with hover effects
- Text: Gray-700 for body, Gray-900 for headings

### Typography
- H1: 4xl, bold
- H2: 2xl, semibold
- H3: xl, semibold
- Body: Base size, gray-700

### Spacing
- Sections: 8 units margin bottom
- Paragraphs: 4 units margin bottom
- Lists: 2 units spacing between items

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Stacked footer sections
- Full-width containers
- Touch-friendly links

### Desktop (≥ 768px)
- Multi-column footer
- Side-by-side content
- Wider containers
- Hover effects

## 🔍 SEO Best Practices

Each legal page includes:
- Unique title tag
- Meta description
- Open Graph tags
- Canonical URL
- Structured content with proper headings

## 📧 Contact Information

Legal pages reference these email addresses:
- **Privacy inquiries:** privacy@visutry.com
- **Refund requests:** refunds@visutry.com
- **Legal matters:** legal@visutry.com
- **General support:** support@visutry.com

**Note:** Update these email addresses in the policy files to match your actual contact emails.

## 🧪 Testing

Run the legal pages test suite:

```bash
# Run all tests
npm run test:e2e:playwright

# Run only legal pages tests
npx playwright test tests/e2e-playwright/legal-pages.spec.ts
```

Test coverage includes:
- Page loading
- Content visibility
- Navigation functionality
- Footer presence
- SEO metadata
- Responsive design

## 🚀 Deployment

Legal pages are automatically deployed with your Next.js application:

1. Commit changes:
   ```bash
   git add .
   git commit -m "feat: add legal compliance pages"
   ```

2. Push to repository:
   ```bash
   git push origin main
   ```

3. Vercel will automatically deploy

4. Verify pages are accessible:
   - Visit `/privacy`
   - Visit `/terms`
   - Visit `/refund`

## 📝 Maintenance

### Regular Updates

**Monthly:**
- Review for accuracy
- Check third-party service mentions
- Verify contact information

**When Adding Features:**
- Update Privacy Policy if collecting new data
- Update Terms if changing service functionality
- Update Refund Policy if changing pricing

**When Changing Services:**
- Update Privacy Policy for new third-party services
- Remove mentions of discontinued services

### Version Control

Track policy changes in git:
```bash
git log -- src/app/privacy/page.tsx
git log -- src/app/terms/page.tsx
git log -- src/app/refund/page.tsx
```

## ⚠️ Important Disclaimers

1. **Legal Review Required:** These policies are templates. Have them reviewed by a legal professional before production use.

2. **Jurisdiction Specific:** Laws vary by location. Ensure compliance with your specific jurisdiction.

3. **Regular Updates:** Keep policies current with your actual practices and legal requirements.

4. **User Rights:** Implement actual mechanisms for users to exercise their rights (data access, deletion, etc.).

## 🔗 Additional Resources

- [Full Legal Compliance Documentation](./LEGAL_COMPLIANCE.md)
- [Stripe Legal Requirements](https://stripe.com/legal)
- [GDPR Guidelines](https://gdpr.eu/)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)

## 💡 Tips

1. **Keep It Simple:** Use clear, plain language in policies
2. **Be Specific:** Mention actual services you use (Stripe, Google Gemini, etc.)
3. **Stay Current:** Update policies when you change practices
4. **Make It Accessible:** Ensure policies are easy to find and read
5. **Get Legal Advice:** Consult with a lawyer for production use

---

**Need Help?**
- Check the [Legal Compliance Documentation](./LEGAL_COMPLIANCE.md)
- Review the [Architecture Guide](./architecture.md)
- Contact the development team

**Last Updated:** January 15, 2025

