# 🌍 i18n Implementation Task Checklist

> **Branch**: `feature/i18n-multi-language`  
> **Start Date**: TBD  
> **Target Completion**: TBD

---

## 🎯 Quick Start (Choose One)

### Option A: Full Implementation (13-20 days)
All 9 languages, all pages, full features
- [ ] Start with Phase 1 below

### Option B: MVP (5-7 days) ⭐ Recommended
3 languages (en, id, es), core pages only
- [ ] Jump to [MVP Fast Track](#mvp-fast-track) section

---

## Phase 1: Foundation Setup ⚙️

**Estimated Time**: 1-2 days  
**Status**: ⬜ Not Started

### 1.1 Install Dependencies
- [ ] Run `npm install next-intl`
- [ ] Verify installation: `npm list next-intl`
- [ ] Check for TypeScript errors: `npm run build`

### 1.2 Create Configuration Files
- [ ] Create `src/i18n.ts` with locale definitions
- [ ] Create `src/i18n/request.ts` for next-intl config
- [ ] Verify TypeScript types are working

### 1.3 Restructure Routes
- [ ] Create `src/app/[locale]/` directory
- [ ] Move `src/app/(main)/*` → `src/app/[locale]/(main)/*`
- [ ] Create `src/app/[locale]/layout.tsx`
- [ ] Update imports in moved files
- [ ] Keep `src/app/(admin)/*` unchanged
- [ ] Test build: `npm run build`

### 1.4 Update Middleware
- [ ] Backup current `src/middleware.ts`
- [ ] Add next-intl middleware integration
- [ ] Preserve admin authentication logic
- [ ] Update matcher config
- [ ] Test language detection locally

### 1.5 Create Translation Files
- [ ] Create `messages/` directory
- [ ] Create `messages/en.json` (baseline)
- [ ] Create empty files for other 8 languages
- [ ] Validate JSON syntax
- [ ] Add to `.gitignore` if needed (optional)

**Phase 1 Checkpoint**:
- [ ] App builds without errors
- [ ] Can access routes like `/en`, `/es`, `/id`
- [ ] Admin routes still work
- [ ] No broken imports

---

## Phase 2: Core Translation 📝

**Estimated Time**: 3-5 days  
**Status**: ⬜ Not Started

### 2.1 Extract Hardcoded Text

#### Homepage
- [ ] `src/app/[locale]/(main)/page.tsx`
  - [ ] Hero title
  - [ ] Hero subtitle
  - [ ] Step 1-3 titles and descriptions
  - [ ] CTA button text

#### Pricing Page
- [ ] `src/app/[locale]/(main)/pricing/page.tsx`
  - [ ] Page title
  - [ ] Plan names and descriptions
  - [ ] Feature lists
  - [ ] Button text
  - [ ] Comparison table

#### Try-On Page
- [ ] `src/app/[locale]/(main)/try-on/page.tsx`
  - [ ] Instructions
  - [ ] Upload button text
  - [ ] Error messages
  - [ ] Success messages

#### Navigation & Layout
- [ ] `src/components/layout/Header.tsx`
  - [ ] Menu items
  - [ ] Sign in/out buttons
- [ ] `src/components/layout/Footer.tsx`
  - [ ] Footer links
  - [ ] Copyright text

#### Auth Pages
- [ ] Sign in page
- [ ] Sign up page
- [ ] Password reset

### 2.2 Populate English Baseline
- [ ] Complete `messages/en.json` with all extracted text
- [ ] Organize by namespace (common, home, pricing, etc.)
- [ ] Validate JSON structure
- [ ] Test all pages render correctly with translations

### 2.3 Translate to Other Languages

#### Option A: Machine Translation (Fast)
- [ ] Setup DeepL API key (or Google Translate)
- [ ] Create translation script `scripts/translate-messages.ts`
- [ ] Run translation for all 8 languages
- [ ] Verify no missing keys

#### Option B: Manual Translation (Quality)
- [ ] Translate to Indonesian (`messages/id.json`)
- [ ] Translate to Spanish (`messages/es.json`)
- [ ] Translate to Arabic (`messages/ar.json`)
- [ ] Translate to Russian (`messages/ru.json`)
- [ ] Translate to German (`messages/de.json`)
- [ ] Translate to Japanese (`messages/ja.json`)
- [ ] Translate to Portuguese (`messages/pt.json`)
- [ ] Translate to French (`messages/fr.json`)

#### Manual Review (Critical Pages)
- [ ] Homepage - all languages
- [ ] Pricing - all languages
- [ ] Legal pages - all languages
- [ ] Error messages - all languages

### 2.4 Update SEO Configuration
- [ ] Modify `src/lib/seo.ts` to accept locale parameter
- [ ] Add translated meta titles and descriptions
- [ ] Generate hreflang tags
- [ ] Update canonical URLs
- [ ] Test with SEO validator

**Phase 2 Checkpoint**:
- [ ] All core pages display in all languages
- [ ] No missing translation warnings
- [ ] SEO meta tags correct per language
- [ ] Manual review of critical pages complete

---

## Phase 3: Advanced Features 🚀

**Estimated Time**: 2-3 days  
**Status**: ⬜ Not Started

### 3.1 Language Switcher Component
- [ ] Create `src/components/LanguageSwitcher.tsx`
- [ ] Add dropdown with all 9 languages
- [ ] Show native language names
- [ ] Highlight current language
- [ ] Preserve current page on switch
- [ ] Add to Header component
- [ ] Add to mobile menu
- [ ] Test on all pages
- [ ] Add keyboard navigation (accessibility)

### 3.2 RTL Support (Arabic)
- [ ] Install `tailwindcss-rtl`: `npm install tailwindcss-rtl`
- [ ] Update `tailwind.config.js`
- [ ] Add `dir` attribute to `<html>` in layout
- [ ] Test all pages in Arabic
- [ ] Fix layout issues (if any)
- [ ] Test icons and images
- [ ] Verify text alignment
- [ ] Test forms and inputs

### 3.3 Multi-Language Sitemap
- [ ] Update `src/app/sitemap.ts`
- [ ] Generate URLs for all languages
- [ ] Add hreflang annotations
- [ ] Test sitemap generation: `npm run build`
- [ ] Validate sitemap XML
- [ ] Submit to Google Search Console (after deployment)

### 3.4 Update next.config.js
- [ ] Add i18n configuration (if needed)
- [ ] Verify image domains for all locales
- [ ] Test build configuration

**Phase 3 Checkpoint**:
- [ ] Language switcher works on all pages
- [ ] Arabic displays correctly in RTL
- [ ] Sitemap includes all language versions
- [ ] No console errors or warnings

---

## Phase 4: Content Translation 📄

**Estimated Time**: 5-7 days  
**Status**: ⬜ Not Started

### 4.1 Static Pages
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Refund Policy
- [ ] About page (if exists)
- [ ] FAQ page (if exists)

### 4.2 Dynamic Content (Blog)
- [ ] Design database schema for translations
- [ ] Update Prisma schema
- [ ] Run migration
- [ ] Create admin UI for managing translations
- [ ] Translate existing blog posts (optional)

### 4.3 Email Templates
- [ ] Welcome email
- [ ] Password reset email
- [ ] Payment confirmation email
- [ ] Subscription emails

### 4.4 Error Pages
- [ ] 404 page
- [ ] 500 page
- [ ] Other error pages

**Phase 4 Checkpoint**:
- [ ] All static pages translated
- [ ] Blog system supports multiple languages
- [ ] Email templates localized
- [ ] Error pages translated

---

## Phase 5: Testing & QA ✅

**Estimated Time**: 2-3 days  
**Status**: ⬜ Not Started

### 5.1 Functional Testing

#### Test Each Language
- [ ] English (en)
  - [ ] Homepage loads
  - [ ] Pricing page loads
  - [ ] Try-on flow works
  - [ ] Auth flow works
  - [ ] Language switcher works
- [ ] Indonesian (id) - repeat above
- [ ] Spanish (es) - repeat above
- [ ] Arabic (ar) - repeat above + RTL check
- [ ] Russian (ru) - repeat above
- [ ] German (de) - repeat above
- [ ] Japanese (ja) - repeat above
- [ ] Portuguese (pt) - repeat above
- [ ] French (fr) - repeat above

#### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### 5.2 SEO Validation
- [ ] Run Lighthouse audit for each language
- [ ] Validate hreflang tags with validator
- [ ] Check canonical URLs
- [ ] Verify sitemap.xml
- [ ] Test robots.txt
- [ ] Check meta tags in all languages

### 5.3 Performance Testing
- [ ] Measure bundle size increase
- [ ] Check First Contentful Paint
- [ ] Check Largest Contentful Paint
- [ ] Check Time to Interactive
- [ ] Test on slow 3G connection
- [ ] Verify lazy loading works

### 5.4 Accessibility Testing
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] Keyboard navigation
- [ ] Color contrast
- [ ] ARIA labels
- [ ] Language switcher accessibility

### 5.5 User Acceptance Testing
- [ ] Get native speakers to review (if possible)
- [ ] Test with real users
- [ ] Collect feedback
- [ ] Fix critical issues

**Phase 5 Checkpoint**:
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] SEO validated
- [ ] Accessibility compliant

---

## 🚀 MVP Fast Track

**Goal**: Launch with 3 languages in 5-7 days

### Day 1: Setup
- [ ] Tasks 1.1-1.5 from Phase 1
- [ ] Only create translation files for: en, id, es

### Day 2: Route Restructure
- [ ] Task 1.3 (move routes to [locale])
- [ ] Task 1.4 (update middleware)

### Day 3: Core Translation
- [ ] Extract text from homepage, pricing, try-on
- [ ] Translate to Indonesian and Spanish
- [ ] Manual review

### Day 4: Features
- [ ] Language switcher (3 languages only)
- [ ] Basic SEO setup

### Day 5: Testing
- [ ] Test all 3 languages
- [ ] Fix bugs
- [ ] Performance check

### Day 6-7: Polish & Deploy
- [ ] Final QA
- [ ] Create PR
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 📋 Pre-Deployment Checklist

Before merging to main:

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.log statements
- [ ] Code reviewed by team member

### Testing
- [ ] All automated tests passing
- [ ] Manual testing complete
- [ ] No broken links
- [ ] Forms work in all languages

### SEO
- [ ] Sitemap generated correctly
- [ ] hreflang tags present
- [ ] Meta tags translated
- [ ] Canonical URLs correct

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size acceptable
- [ ] Images optimized
- [ ] No memory leaks

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Translation guide created
- [ ] Deployment notes written

---

## 🔄 Post-Deployment Tasks

After merging to main:

- [ ] Monitor error logs
- [ ] Check analytics for language usage
- [ ] Submit sitemap to search engines
- [ ] Monitor SEO rankings
- [ ] Collect user feedback
- [ ] Plan next iteration

---

## 📊 Progress Summary

**Overall Progress**: 0/16 major tasks complete

- Phase 1: ⬜⬜⬜⬜⬜ (0/5)
- Phase 2: ⬜⬜⬜⬜ (0/4)
- Phase 3: ⬜⬜⬜⬜ (0/4)
- Phase 4: ⬜⬜⬜⬜ (0/4)
- Phase 5: ⬜⬜⬜⬜⬜ (0/5)

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Routes not working after restructure
- **Solution**: Check middleware matcher, verify [locale] folder structure

**Issue**: Translations not loading
- **Solution**: Verify JSON syntax, check file paths, restart dev server

**Issue**: RTL layout broken
- **Solution**: Check `dir` attribute, verify Tailwind RTL plugin, test CSS

**Issue**: SEO tags not showing
- **Solution**: Check metadata generation, verify locale parameter passing

**Issue**: Performance regression
- **Solution**: Enable lazy loading, check bundle analyzer, optimize images

---

**Last Updated**: 2025-11-03  
**Status**: 📋 Ready to Start  
**Next Action**: Create feature branch and begin Phase 1

