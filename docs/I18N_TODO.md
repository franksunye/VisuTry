# 🌍 i18n - Remaining Tasks

**Last Updated**: 2025-11-04  
**Current Status**: 9 languages supported (en, id, ar, ru, de, ja, es, pt, fr)  
**Branch**: `feature/i18n-multi-language`

---

## ✅ What's Done

- ✅ 9 languages configured and working
- ✅ Home page fully translated (all 9 languages)
- ✅ Pricing page fully translated (all 9 languages)
- ✅ Navigation & Header translated
- ✅ Footer translated
- ✅ Language switcher working
- ✅ Sitemap auto-generates for all languages
- ✅ SEO meta tags with hreflang support
- ✅ RTL support for Arabic
- ✅ Middleware with language detection
- ✅ All core infrastructure complete

---

## 🚧 TODO - Remaining Pages to Translate

### Priority 1: User-Facing Pages (High Impact)

#### Try-On Flow
- [ ] `src/app/[locale]/(main)/try-on/page.tsx` - Try-on upload page
- [ ] `src/components/try-on/*` - Try-on components
  - [ ] Upload instructions
  - [ ] Frame selection UI
  - [ ] Results display
  - [ ] Error messages

#### Dashboard
- [ ] `src/app/[locale]/(main)/dashboard/page.tsx` - User dashboard
  - [ ] Welcome message
  - [ ] Stats labels
  - [ ] Quick actions
  - [ ] Tips section

#### Payment Pages
- [ ] `src/app/[locale]/(main)/payment/success/page.tsx` - Payment success
- [ ] `src/app/[locale]/(main)/payment/cancel/page.tsx` - Payment cancelled
  - [ ] Success/cancel messages
  - [ ] Next steps instructions

### Priority 2: Legal Pages (SEO Value)

- [ ] `src/app/[locale]/(main)/privacy/page.tsx` - Privacy Policy
- [ ] `src/app/[locale]/(main)/terms/page.tsx` - Terms of Service
- [ ] `src/app/[locale]/(main)/refund/page.tsx` - Refund Policy

**Note**: Legal pages may need professional legal translation, not just AI translation.

### Priority 3: Auth Pages (Lower Priority)

- [ ] `src/app/[locale]/(main)/auth/signin/page.tsx` - Sign in page
- [ ] Auth error messages
- [ ] Auth success messages

### Priority 4: Blog (If Needed)

- [ ] Blog post content (if you want multilingual blog)
- [ ] Blog categories/tags

---

## 📝 How to Add Translations

### Step 1: Add Keys to English File
Edit `messages/en.json` and add new translation keys:
```json
{
  "tryOn": {
    "upload": {
      "title": "Upload Your Photo",
      "instruction": "Choose a clear front-facing photo"
    }
  }
}
```

### Step 2: Translate to Other 8 Languages
Copy the structure to all language files and translate:
- `messages/id.json` - Indonesian
- `messages/ar.json` - Arabic
- `messages/ru.json` - Russian
- `messages/de.json` - German
- `messages/ja.json` - Japanese
- `messages/es.json` - Spanish
- `messages/pt.json` - Portuguese
- `messages/fr.json` - French

### Step 3: Use in Components
```typescript
import { useTranslations } from 'next-intl'

export default function TryOnPage() {
  const t = useTranslations('tryOn')
  return <h1>{t('upload.title')}</h1>
}
```

---

## 🎯 Quick Wins (Do These First)

1. **Dashboard** - High user visibility, easy to translate
2. **Payment Success/Cancel** - Critical user experience
3. **Try-On Flow** - Core feature, high impact

---

## 📚 Reference

### Current Language Order (by preference)
1. English (en) - Default
2. Indonesian (id)
3. Arabic (ar) - RTL
4. Russian (ru)
5. German (de)
6. Japanese (ja)
7. Spanish (es)
8. Portuguese (pt)
9. French (fr)

### Key Files
- **Config**: `src/i18n.ts`
- **Translations**: `messages/*.json`
- **Middleware**: `src/middleware.ts`
- **Sitemap**: `src/app/sitemap.ts` (auto-updates)

### Useful Commands
```bash
# Validate all JSON files
for file in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$file'))"; done

# Check TypeScript
npx tsc --noEmit

# Build
npm run build
```

---

## 💡 Notes

- Legal pages may require professional translation for compliance
- Blog translation is optional - consider if you want multilingual content
- Admin panel stays English-only (by design)
- All new pages should use translations from day 1

