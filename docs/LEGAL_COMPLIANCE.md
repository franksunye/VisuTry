# Legal Compliance Documentation

## Overview

This document outlines the legal compliance features implemented in VisuTry to meet regulatory requirements and best practices for online services, particularly for payment processing with Stripe.

## Implemented Pages

### 1. Privacy Policy (`/privacy`)
**Location:** `src/app/privacy/page.tsx`

**Key Sections:**
- Introduction and scope
- Information collection (personal data, images, usage data)
- How we use information
- Third-party services (Stripe, Google Gemini AI, Vercel, Twitter OAuth)
- Data storage and security
- Data retention policies
- User privacy rights (GDPR compliance)
- Cookie usage
- Children's privacy (COPPA compliance)
- Policy updates
- Contact information

**Compliance Standards:**
- ✅ GDPR (General Data Protection Regulation)
- ✅ CCPA (California Consumer Privacy Act)
- ✅ COPPA (Children's Online Privacy Protection Act)
- ✅ Stripe requirements
- ✅ Google API Services User Data Policy

### 2. Refund Policy (`/refund`)
**Location:** `src/app/refund/page.tsx`

**Key Sections:**
- Overview and scope
- Subscription refunds (monthly and annual)
- Credits pack refunds
- Non-refundable items
- Cancellation policy
- Refund request process
- Processing times
- Special circumstances (technical issues, service interruptions)
- Chargeback policy
- Contact information

**Compliance Standards:**
- ✅ Stripe refund requirements
- ✅ Consumer protection laws
- ✅ Clear cancellation terms
- ✅ Transparent refund conditions

### 3. Terms of Service (`/terms`)
**Location:** `src/app/terms/page.tsx`

**Key Sections:**
- Agreement to terms
- Service description
- Account registration and security
- User responsibilities and conduct
- Intellectual property rights
- Payment and subscription terms
- Service limitations and disclaimers
- Limitation of liability
- Indemnification
- Termination policy
- Dispute resolution
- Governing law
- Changes to terms
- Contact information

**Compliance Standards:**
- ✅ Standard terms of service requirements
- ✅ Liability limitations
- ✅ User conduct rules
- ✅ IP protection
- ✅ Payment terms clarity

## Global Footer Component

**Location:** `src/components/layout/Footer.tsx`

**Features:**
- Brand information and description
- Social media links (Twitter, GitHub, Email)
- Product navigation links
- Legal policy links (Privacy, Terms, Refund)
- Copyright notice
- Responsive design

**Integration:**
- Added to `src/app/layout.tsx` for global visibility
- Appears on all pages automatically
- Maintains consistent design with the rest of the application

## Additional Integrations

### 1. Sitemap Updates
**Location:** `src/app/sitemap.ts`

Added legal pages to sitemap:
- `/privacy` - Priority 0.5, Monthly updates
- `/terms` - Priority 0.5, Monthly updates
- `/refund` - Priority 0.5, Monthly updates

### 2. Pricing Page Integration
**Location:** `src/app/pricing/page.tsx`

Added legal notice at the bottom:
```
By subscribing, you agree to our Terms of Service and Privacy Policy. 
View our Refund Policy for cancellation terms.
```

All policy links are clickable and navigate to respective pages.

## SEO Optimization

All legal pages include:
- Proper meta titles
- Meta descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Last updated dates

## Design Consistency

All legal pages follow the application's design system:
- Glass-effect containers
- Gradient backgrounds (blue-50 to indigo-100)
- Consistent typography
- Responsive layouts
- Accessible navigation
- Clear section hierarchy

## Testing

**Test File:** `tests/e2e-playwright/legal-pages.spec.ts`

Test coverage includes:
- ✅ Page loading and rendering
- ✅ Content visibility
- ✅ Navigation links
- ✅ Footer presence on all pages
- ✅ SEO metadata
- ✅ Responsive design (mobile and desktop)
- ✅ Link functionality

## Stripe Compliance Checklist

For Stripe account approval, ensure:
- ✅ Privacy Policy clearly states data collection and usage
- ✅ Privacy Policy mentions Stripe as payment processor
- ✅ Refund Policy clearly states refund conditions and timeframes
- ✅ Terms of Service includes payment terms
- ✅ All policies are easily accessible from website
- ✅ Contact information is provided
- ✅ Policies are up-to-date

## Maintenance

### Updating Policies

1. Edit the respective page file in `src/app/[policy]/page.tsx`
2. Update the `lastUpdated` date
3. Review changes for legal accuracy
4. Test the page locally
5. Deploy changes

### Regular Review Schedule

- **Quarterly:** Review all policies for accuracy
- **When adding features:** Update relevant policies
- **When changing third-party services:** Update Privacy Policy
- **When changing pricing:** Update Refund Policy and Terms

## Contact Information

For legal inquiries, users can contact:
- **Privacy:** privacy@visutry.com
- **Refunds:** refunds@visutry.com
- **Legal:** legal@visutry.com
- **Support:** support@visutry.com

## Important Notes

1. **Disclaimer:** These policies are templates and should be reviewed by a legal professional before use in production.

2. **Customization:** Update the following placeholders with actual information:
   - Company registration details
   - Specific jurisdiction for governing law
   - Actual contact addresses if required
   - Specific data retention periods based on your practices

3. **Third-Party Services:** Keep the list of third-party services updated as you add or remove integrations.

4. **User Rights:** Implement actual mechanisms for users to exercise their privacy rights (data access, deletion, etc.).

## Future Enhancements

Consider adding:
- [ ] Cookie consent banner
- [ ] Data export functionality
- [ ] Account deletion feature
- [ ] Privacy settings dashboard
- [ ] GDPR data processing agreement
- [ ] Accessibility statement
- [ ] Security policy page

## Resources

- [Stripe Legal Requirements](https://stripe.com/legal)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [FTC Privacy Guidelines](https://www.ftc.gov/business-guidance/privacy-security)

---

**Last Updated:** January 15, 2025
**Version:** 1.0

