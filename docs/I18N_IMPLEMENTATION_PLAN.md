# 🌍 Multi-Language Implementation Plan

## Project Overview

**Goal**: Add support for 8 languages to VisuTry platform  
**Timeline**: 13-20 days (or 5-7 days for MVP)  
**Branch**: `feature/i18n-multi-language`  
**Status**: 📋 Planning

## Supported Languages

| Code | Language | Native Name | Direction | Priority |
|------|----------|-------------|-----------|----------|
| `en` | English | English | LTR | ✅ Default |
| `id` | Indonesian | Bahasa Indonesia | LTR | 🔥 High |
| `es` | Spanish | Español | LTR | 🔥 High |
| `ar` | Arabic | العربية | **RTL** | ⚠️ Medium (RTL) |
| `ru` | Russian | Русский | LTR | 📊 Medium |
| `de` | German | Deutsch | LTR | 📊 Medium |
| `ja` | Japanese | 日本語 | LTR | 📊 Medium |
| `pt` | Portuguese | Português | LTR | 📊 Medium |
| `fr` | French | Français | LTR | 📊 Medium |

## Technology Stack

- **Framework**: next-intl (v3.x)
- **Translation**: DeepL API (primary) + manual review
- **Management**: JSON files in Git (simple) or Lokalise (advanced)
- **SEO**: Custom sitemap generation with hreflang

---

## 📅 Implementation Phases

### Phase 1: Foundation Setup (1-2 days)

#### Task 1.1: Install Dependencies
```bash
npm install next-intl
```

**Files to create:**
- [ ] `src/i18n.ts` - Language configuration
- [ ] `src/i18n/request.ts` - next-intl request configuration

**Acceptance Criteria:**
- ✅ next-intl installed successfully
- ✅ TypeScript types working
- ✅ No build errors

---

#### Task 1.2: Create Language Configuration

**File**: `src/i18n.ts`

```typescript
export const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  ar: 'العربية',
  ru: 'Русский',
  de: 'Deutsch',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
  fr: 'Français'
}

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  id: 'ltr',
  ar: 'rtl', // Arabic is RTL
  ru: 'ltr',
  de: 'ltr',
  ja: 'ltr',
  es: 'ltr',
  pt: 'ltr',
  fr: 'ltr'
}
```

**Acceptance Criteria:**
- ✅ All 9 languages configured
- ✅ RTL direction marked for Arabic
- ✅ Type-safe locale definitions

---

#### Task 1.3: Restructure Routes

**Current Structure:**
```
src/app/
  ├── (main)/
  │   ├── page.tsx
  │   ├── pricing/
  │   ├── try-on/
  │   └── ...
  └── (admin)/
```

**New Structure:**
```
src/app/
  ├── [locale]/
  │   ├── (main)/
  │   │   ├── page.tsx
  │   │   ├── pricing/
  │   │   ├── try-on/
  │   │   └── ...
  │   └── layout.tsx (locale-aware)
  ├── (admin)/  (keep as-is, admin is English-only)
  └── layout.tsx (root layout)
```

**Files to modify:**
- [ ] Move `src/app/(main)/*` → `src/app/[locale]/(main)/*`
- [ ] Create `src/app/[locale]/layout.tsx`
- [ ] Update `src/app/layout.tsx`
- [ ] Keep `src/app/(admin)/*` unchanged (admin stays English-only)

**Acceptance Criteria:**
- ✅ All main routes under `[locale]` folder
- ✅ Admin routes unchanged
- ✅ No broken imports
- ✅ App builds successfully

---

#### Task 1.4: Update Middleware

**File**: `src/middleware.ts`

**Current**: Only handles admin authentication  
**New**: Handle both i18n routing AND admin authentication

```typescript
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // /en/page → /page, /es/page → /es/page
})

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // 1. Skip i18n for admin routes
  if (pathname.startsWith('/admin')) {
    // Apply existing admin auth logic
    return adminMiddleware(req)
  }
  
  // 2. Apply i18n middleware for all other routes
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)', // i18n routes
    '/admin/:path*' // admin routes
  ]
}
```

**Acceptance Criteria:**
- ✅ Language detection works (browser preference)
- ✅ URL redirects correctly (e.g., `/` → `/en` or stays `/`)
- ✅ Admin routes still protected
- ✅ No performance regression

---

#### Task 1.5: Create Translation Files Structure

**Directory**: `messages/`

```
messages/
  ├── en.json          # English (baseline)
  ├── id.json          # Indonesian
  ├── ar.json          # Arabic
  ├── ru.json          # Russian
  ├── de.json          # German
  ├── ja.json          # Japanese
  ├── es.json          # Spanish
  ├── pt.json          # Portuguese
  └── fr.json          # French
```

**Initial `messages/en.json`** (extract from existing code):
```json
{
  "common": {
    "getStarted": "Get Started",
    "learnMore": "Learn More",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "home": {
    "title": "Discover the Glasses That Fit You Perfectly",
    "subtitle": "Try On Glasses in 3 Easy Steps",
    "step1": {
      "title": "Upload Your Photo",
      "description": "Upload a front-facing photo of yourself — no special tools required."
    },
    "step2": {
      "title": "Pick Your Frames",
      "description": "Choose the glasses you like. We'll show how each style looks on your face."
    },
    "step3": {
      "title": "See & Save",
      "description": "See your top look, then save or share it."
    }
  },
  "pricing": {
    "title": "Choose Your Plan",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "freeUser": "Free User",
    "remainingTryOns": "Remaining try-ons: {count}"
  }
}
```

**Acceptance Criteria:**
- ✅ All 9 language files created
- ✅ English baseline complete
- ✅ JSON structure validated
- ✅ No syntax errors

---

### Phase 2: Core Translation (3-5 days)

#### Task 2.1: Extract All Hardcoded Text

**Priority Pages:**
1. Homepage (`src/app/[locale]/(main)/page.tsx`)
2. Pricing (`src/app/[locale]/(main)/pricing/page.tsx`)
3. Try-On (`src/app/[locale]/(main)/try-on/page.tsx`)
4. Navigation & Footer
5. Auth pages

**Process:**
```typescript
// Before
<h1>Discover the Glasses That Fit You Perfectly</h1>

// After
import { useTranslations } from 'next-intl'

const t = useTranslations('home')
<h1>{t('title')}</h1>
```

**Files to modify:**
- [ ] `src/app/[locale]/(main)/page.tsx`
- [ ] `src/app/[locale]/(main)/pricing/page.tsx`
- [ ] `src/app/[locale]/(main)/try-on/page.tsx`
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/Footer.tsx`

**Acceptance Criteria:**
- ✅ No hardcoded English text in components
- ✅ All text uses `t()` function
- ✅ Fallback to English if translation missing

---

#### Task 2.2: Translate to All Languages

**Method**: DeepL API + Manual Review

**Script**: `scripts/translate-messages.ts`

```typescript
// Automated translation script
// Input: messages/en.json
// Output: messages/{locale}.json for all locales
```

**Budget**: ~$10-20 for machine translation

**Manual Review Priority:**
1. ✅ Homepage (all languages)
2. ✅ Pricing page (all languages)
3. ✅ Legal pages (Privacy, Terms) - critical
4. ⚠️ Blog posts - can be done later

**Acceptance Criteria:**
- ✅ All 8 non-English files populated
- ✅ No missing keys
- ✅ Critical pages manually reviewed
- ✅ Translations sound natural (spot check)

---

#### Task 2.3: Update SEO Configuration

**File**: `src/lib/seo.ts`

**Changes:**
```typescript
export function generateSEO(locale: Locale, params: SEOParams) {
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      locale: localeToOGLocale(locale), // en_US, id_ID, etc.
      alternateLocale: otherLocales.map(localeToOGLocale),
    },
    alternates: {
      canonical: `/${locale}${pathname}`,
      languages: {
        'en': `/en${pathname}`,
        'id': `/id${pathname}`,
        // ... all languages
      }
    }
  }
}
```

**Acceptance Criteria:**
- ✅ Meta tags translated per language
- ✅ hreflang tags generated correctly
- ✅ Canonical URLs point to correct locale
- ✅ OG tags include all language alternates

---

### Phase 3: Advanced Features (2-3 days)

#### Task 3.1: Language Switcher Component

**File**: `src/components/LanguageSwitcher.tsx`

**Features:**
- Dropdown menu with all languages
- Show native language names
- Preserve current page when switching
- Accessible (keyboard navigation)

**Placement:**
- Header (desktop)
- Mobile menu
- Footer (optional)

**Acceptance Criteria:**
- ✅ All 9 languages listed
- ✅ Current language highlighted
- ✅ Switching preserves page context
- ✅ Works on mobile and desktop
- ✅ ARIA labels for accessibility

---

#### Task 3.2: RTL Support (Arabic)

**Files to modify:**
- [ ] `src/app/[locale]/layout.tsx` - Add `dir` attribute
- [ ] `tailwind.config.js` - Enable RTL plugin
- [ ] Test all UI components in RTL mode

**Tailwind RTL Setup:**
```bash
npm install tailwindcss-rtl
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

**Component Updates:**
```tsx
// Add dir attribute based on locale
<html lang={locale} dir={localeDirections[locale]}>
```

**Acceptance Criteria:**
- ✅ Arabic pages render RTL
- ✅ Layout mirrors correctly
- ✅ Icons flip appropriately
- ✅ Text alignment correct
- ✅ No broken UI elements

---

#### Task 3.3: Multi-Language Sitemap

**File**: `src/app/sitemap.ts`

**Generate URLs for all languages:**
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/pricing', '/try-on', '/blog']
  const entries = []
  
  for (const locale of locales) {
    for (const route of routes) {
      entries.push({
        url: `https://visutry.com/${locale}${route}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            locales.map(l => [l, `https://visutry.com/${l}${route}`])
          )
        }
      })
    }
  }
  
  return entries
}
```

**Acceptance Criteria:**
- ✅ Sitemap includes all language versions
- ✅ hreflang annotations correct
- ✅ No duplicate URLs
- ✅ Validates in Google Search Console

---

### Phase 4: Content Translation (5-7 days)

#### Task 4.1: Translate Static Content

**Pages:**
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Refund Policy
- [ ] About page (if exists)

**Method**: Professional translation recommended for legal pages

---

#### Task 4.2: Translate Dynamic Content

**Database Schema Update:**
```prisma
model BlogPost {
  id          String   @id @default(cuid())
  slug        String   @unique
  
  // Add locale field
  locale      String   @default("en")
  
  // Or use separate translation table
  translations BlogPostTranslation[]
}

model BlogPostTranslation {
  id          String   @id @default(cuid())
  postId      String
  locale      String
  title       String
  content     String
  
  post        BlogPost @relation(fields: [postId], references: [id])
  
  @@unique([postId, locale])
}
```

**Acceptance Criteria:**
- ✅ Blog posts support multiple languages
- ✅ Fallback to English if translation missing
- ✅ Admin can manage translations

---

### Phase 5: Testing & Optimization (2-3 days)

#### Task 5.1: Functional Testing

**Test Matrix:**

| Feature | en | id | es | ar | ru | de | ja | pt | fr |
|---------|----|----|----|----|----|----|----|----|-----|
| Homepage | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Pricing | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Try-On | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Auth | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lang Switch | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

#### Task 5.2: SEO Validation

**Tools:**
- Google Search Console
- hreflang validator
- Screaming Frog SEO Spider

**Checklist:**
- [ ] All pages indexed
- [ ] hreflang tags correct
- [ ] No duplicate content issues
- [ ] Canonical tags proper
- [ ] Sitemap submitted

---

#### Task 5.3: Performance Testing

**Metrics:**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size increase < 50KB

**Optimization:**
- [ ] Lazy load translation files
- [ ] CDN caching per locale
- [ ] Image optimization per locale

---

## 🚀 MVP Version (Week 1 - Fast Track)

**Scope**: 3 languages only (en, id, es)  
**Pages**: Homepage + Pricing + Try-On  
**Timeline**: 5-7 days

### MVP Task List

- [ ] Day 1: Setup (Tasks 1.1-1.5)
- [ ] Day 2: Route restructure (Task 1.3)
- [ ] Day 3: Extract & translate core pages (Tasks 2.1-2.2)
- [ ] Day 4: Language switcher (Task 3.1)
- [ ] Day 5: SEO & sitemap (Tasks 2.3, 3.3)
- [ ] Day 6-7: Testing & deployment

---

## 📊 Progress Tracking

### Overall Progress: 0% Complete

- [ ] Phase 1: Foundation (0/5 tasks)
- [ ] Phase 2: Translation (0/3 tasks)
- [ ] Phase 3: Advanced (0/3 tasks)
- [ ] Phase 4: Content (0/2 tasks)
- [ ] Phase 5: Testing (0/3 tasks)

---

## 🔄 Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/i18n-multi-language

# Work in small commits
git commit -m "feat(i18n): install next-intl and setup config"
git commit -m "feat(i18n): restructure routes to [locale]"
git commit -m "feat(i18n): add language switcher component"

# Push to remote
git push -u origin feature/i18n-multi-language

# Create PR when ready
# Title: "feat: Add multi-language support (8 languages)"
```

### Commit Convention
- `feat(i18n):` - New i18n features
- `refactor(i18n):` - Code restructuring
- `fix(i18n):` - Bug fixes
- `docs(i18n):` - Documentation
- `test(i18n):` - Tests

---

## 💰 Budget Estimate

| Item | Cost | Notes |
|------|------|-------|
| DeepL API | $10-20 | Machine translation |
| Manual review (optional) | $50-200 | Professional translators |
| Lokalise (optional) | $0-50/mo | Translation management |
| **Total** | **$60-270** | One-time + optional monthly |

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing routes | 🔴 High | Thorough testing, gradual rollout |
| SEO ranking drop | 🟡 Medium | Proper redirects, hreflang tags |
| Translation quality | 🟡 Medium | Manual review of critical pages |
| Performance regression | 🟢 Low | Bundle analysis, lazy loading |
| RTL layout issues | 🟡 Medium | Dedicated RTL testing phase |

---

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [DeepL API](https://www.deepl.com/pro-api)
- [Google hreflang Guide](https://developers.google.com/search/docs/specialty/international/localized-versions)

---

## ✅ Definition of Done

- [ ] All 9 languages accessible via URL
- [ ] Core user flows translated and tested
- [ ] Language switcher functional
- [ ] SEO properly configured (hreflang, sitemap)
- [ ] RTL support working for Arabic
- [ ] No performance regression
- [ ] Documentation updated
- [ ] PR approved and merged
- [ ] Deployed to production

---

**Last Updated**: 2025-11-03  
**Document Owner**: Development Team  
**Status**: 📋 Ready to Start

