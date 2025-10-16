# Legal Pages Deployment Checklist

## 📋 Pre-Deployment Checklist

Use this checklist before deploying legal pages to production.

---

## 1. Content Review

### Privacy Policy
- [ ] Review all 11 sections for accuracy
- [ ] Verify third-party services mentioned are current
  - [ ] Stripe (payment processing)
  - [ ] Google Gemini AI (image processing)
  - [ ] Vercel (hosting and storage)
  - [ ] Twitter OAuth (authentication)
- [ ] Update "Last updated" date
- [ ] Verify contact email addresses
- [ ] Check data retention periods match actual practices
- [ ] Ensure GDPR compliance statements are accurate
- [ ] Verify cookie policy matches actual usage

### Terms of Service
- [ ] Review all 13 sections for accuracy
- [ ] Verify service description matches current features
- [ ] Check payment terms align with Stripe setup
- [ ] Confirm liability limitations are appropriate
- [ ] Update "Last updated" date
- [ ] Verify contact email addresses
- [ ] Check age requirements (currently 13+)
- [ ] Ensure dispute resolution terms are correct

### Refund Policy
- [ ] Review all 10 sections for accuracy
- [ ] Verify refund timeframes:
  - [ ] Monthly subscription: 7-day guarantee
  - [ ] Annual subscription: 14-day guarantee
  - [ ] Credits pack: 7-day if unused
- [ ] Confirm non-refundable items list is complete
- [ ] Update "Last updated" date
- [ ] Verify contact email addresses
- [ ] Check cancellation process matches actual flow

---

## 2. Legal Review

- [ ] Have policies reviewed by legal professional
- [ ] Verify compliance with local jurisdiction laws
- [ ] Confirm GDPR compliance (if serving EU users)
- [ ] Confirm CCPA compliance (if serving California users)
- [ ] Verify Stripe legal requirements are met
- [ ] Check Google API Services User Data Policy compliance
- [ ] Ensure children's privacy (COPPA) compliance

---

## 3. Contact Information

### Email Addresses to Set Up
- [ ] privacy@visutry.com (or update in policies)
- [ ] refunds@visutry.com (or update in policies)
- [ ] legal@visutry.com (or update in policies)
- [ ] support@visutry.com (or update in policies)

### Update in Files
- [ ] `src/app/privacy/page.tsx`
- [ ] `src/app/terms/page.tsx`
- [ ] `src/app/refund/page.tsx`
- [ ] `src/components/layout/Footer.tsx`

---

## 4. Company Information

### Update These Placeholders
- [ ] Company legal name
- [ ] Company registration number (if required)
- [ ] Registered address (if required)
- [ ] Governing law jurisdiction
- [ ] Dispute resolution location

### Files to Update
- [ ] `src/app/terms/page.tsx` (Section 11: Dispute Resolution)
- [ ] Footer component if showing company info

---

## 5. Technical Verification

### Page Functionality
- [ ] `/privacy` page loads correctly
- [ ] `/terms` page loads correctly
- [ ] `/refund` page loads correctly
- [ ] All "Back to Home" links work
- [ ] All internal policy links work
- [ ] All external links open in new tabs

### Footer
- [ ] Footer appears on all pages
- [ ] All footer links work correctly
- [ ] Social media links point to correct profiles
- [ ] Email links work (mailto:)
- [ ] Footer is responsive on mobile

### Pricing Page
- [ ] Legal notice appears at bottom
- [ ] All policy links in notice work
- [ ] Notice is visible and readable

### SEO
- [ ] All pages have unique titles
- [ ] All pages have meta descriptions
- [ ] Open Graph tags are present
- [ ] Twitter Card tags are present
- [ ] Pages are in sitemap.xml
- [ ] Canonical URLs are correct

---

## 6. Design & UX

### Visual Consistency
- [ ] Glass-effect containers render correctly
- [ ] Gradient background displays properly
- [ ] Typography is consistent
- [ ] Colors match design system
- [ ] Icons display correctly

### Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Footer stacks properly on mobile
- [ ] Content is readable on all sizes
- [ ] Navigation works on all devices

### Accessibility
- [ ] Headings follow proper hierarchy (H1 → H2 → H3)
- [ ] Links have descriptive text
- [ ] Color contrast is sufficient
- [ ] Focus states are visible
- [ ] Keyboard navigation works

---

## 7. Testing

### Manual Testing
- [ ] Click through all legal pages
- [ ] Test all navigation links
- [ ] Verify footer on 5+ different pages
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device
- [ ] Check page load speed

### Automated Testing
- [ ] Run Playwright tests: `npm run test:e2e:playwright`
- [ ] Verify all tests pass
- [ ] Check test coverage report

### Build Testing
- [ ] Run `npm run build` successfully
- [ ] No build errors or warnings
- [ ] Check bundle size is reasonable

---

## 8. Third-Party Compliance

### Stripe Requirements
- [ ] Privacy Policy mentions Stripe
- [ ] Privacy Policy links to Stripe's privacy policy
- [ ] Refund Policy has clear terms
- [ ] Terms of Service includes payment terms
- [ ] All policies easily accessible
- [ ] Contact information provided

### Google Gemini AI
- [ ] Privacy Policy mentions Google Gemini
- [ ] Privacy Policy links to Google's privacy policy
- [ ] Data usage for AI processing explained
- [ ] User consent mechanism in place

### Vercel
- [ ] Privacy Policy mentions Vercel
- [ ] Privacy Policy links to Vercel's privacy policy
- [ ] Data storage location mentioned

---

## 9. User Rights Implementation

### Privacy Rights (GDPR)
- [ ] Plan for data access requests
- [ ] Plan for data deletion requests
- [ ] Plan for data correction requests
- [ ] Plan for data portability requests
- [ ] Document response timeframes (typically 30 days)

### Account Management
- [ ] Users can view their data
- [ ] Users can delete their account
- [ ] Users can export their data
- [ ] Deletion process is documented

---

## 10. Documentation

### Internal Documentation
- [ ] Review `docs/LEGAL_COMPLIANCE.md`
- [ ] Review `docs/LEGAL_PAGES_QUICKSTART.md`
- [ ] Review `docs/LEGAL_PAGES_STRUCTURE.md`
- [ ] Update README.md if needed

### Team Training
- [ ] Brief team on new legal pages
- [ ] Share contact email responsibilities
- [ ] Document refund request process
- [ ] Document privacy request process

---

## 11. Deployment

### Pre-Deploy
- [ ] All checklist items above completed
- [ ] Legal review completed
- [ ] All tests passing
- [ ] Build successful

### Deploy Steps
1. [ ] Commit all changes
   ```bash
   git add .
   git commit -m "feat: add legal compliance pages"
   ```

2. [ ] Push to repository
   ```bash
   git push origin main
   ```

3. [ ] Verify Vercel deployment
   - [ ] Check deployment status
   - [ ] Wait for build to complete
   - [ ] Check for any errors

4. [ ] Post-Deploy Verification
   - [ ] Visit live `/privacy` page
   - [ ] Visit live `/terms` page
   - [ ] Visit live `/refund` page
   - [ ] Check footer on live site
   - [ ] Test all links on live site

---

## 12. Post-Deployment

### Monitoring
- [ ] Monitor for 404 errors
- [ ] Check analytics for page views
- [ ] Monitor user feedback
- [ ] Check for broken links

### Stripe Integration
- [ ] Submit Stripe application (if pending)
- [ ] Provide policy URLs to Stripe
- [ ] Wait for Stripe approval
- [ ] Update any Stripe-required information

### Communication
- [ ] Notify existing users of new policies (if required)
- [ ] Update any external documentation
- [ ] Update help center/FAQ if applicable

---

## 13. Ongoing Maintenance

### Monthly
- [ ] Review policies for accuracy
- [ ] Check for broken links
- [ ] Verify contact emails are monitored
- [ ] Review any user feedback

### Quarterly
- [ ] Full compliance audit
- [ ] Update "Last updated" dates if changes made
- [ ] Review third-party service list
- [ ] Check for new legal requirements

### When Making Changes
- [ ] Update Privacy Policy if collecting new data
- [ ] Update Terms if changing service features
- [ ] Update Refund Policy if changing pricing
- [ ] Update all policies if changing third-party services

---

## ✅ Final Sign-Off

Before going live, confirm:

- [ ] **Legal Review:** Policies reviewed by legal professional
- [ ] **Technical:** All tests passing, no errors
- [ ] **Content:** All information accurate and up-to-date
- [ ] **Compliance:** All regulatory requirements met
- [ ] **UX:** All pages accessible and user-friendly
- [ ] **Team:** Team briefed and ready to handle requests

---

## 📞 Emergency Contacts

If issues arise post-deployment:

- **Technical Issues:** [Your dev team contact]
- **Legal Questions:** [Your legal counsel contact]
- **User Requests:** [Your support team contact]

---

## 📝 Notes

Use this space for deployment-specific notes:

```
Deployment Date: _______________
Deployed By: _______________
Legal Review By: _______________
Stripe Status: _______________
Special Notes: _______________
```

---

**Checklist Version:** 1.0
**Last Updated:** January 15, 2025

---

## 🎉 Ready to Deploy?

Once all items are checked, you're ready to deploy your legal compliance pages!

Remember: Legal compliance is an ongoing process. Keep policies updated and review regularly.

