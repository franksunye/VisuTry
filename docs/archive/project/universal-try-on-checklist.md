# Universal Try-On Implementation Checklist

## 🎯 Pre-Migration Checklist

### Code Implementation ✅
- [x] Configuration layer created (`src/config/try-on-types.ts`)
- [x] API routes updated to support `type` parameter
- [x] Gemini AI integration updated for generic items
- [x] Components refactored to accept `type` prop
- [x] Dynamic routing implemented (`/try-on/[type]`)
- [x] Navigation updated with multiple try-on links
- [x] Home page updated with dual CTA buttons
- [x] Internationalization files updated
- [x] Configuration test script created
- [x] All tests passing

### Files Modified ✅
- [x] `src/config/try-on-types.ts` (NEW)
- [x] `src/app/api/try-on/route.ts`
- [x] `src/app/api/try-on/[id]/route.ts`
- [x] `src/app/api/try-on/history/route.ts`
- [x] `src/lib/gemini.ts`
- [x] `src/components/try-on/TryOnInterface.tsx`
- [x] `src/components/try-on/EmptyState.tsx`
- [x] `src/components/try-on/LoadingState.tsx`
- [x] `src/app/[locale]/(main)/try-on/[type]/page.tsx` (NEW)
- [x] `src/app/[locale]/(main)/try-on/page.tsx`
- [x] `src/components/layout/Header.tsx`
- [x] `src/app/[locale]/(main)/page.tsx`
- [x] `messages/en.json`
- [x] `messages/es.json`
- [x] `messages/fr.json`
- [x] `messages/ja.json`
- [x] `messages/pt.json`

## 🗄️ Database Migration Checklist

### Step 1: Update Prisma Schema
- [ ] Add `TryOnType` enum to `prisma/schema.prisma`
- [ ] Add `type` field to `TryOnTask` model with default `GLASSES`
- [ ] Add `itemImageUrl` field to `TryOnTask` model
- [ ] Keep `glassesImageUrl` field for backward compatibility (optional)
- [ ] Add index on `type` field
- [ ] Add composite index on `[userId, type, createdAt]`

### Step 2: Generate Migration
```bash
npx prisma migrate dev --name add-try-on-type
```

### Step 3: Verify Migration
- [ ] Check migration SQL file in `prisma/migrations/`
- [ ] Verify enum values are correct
- [ ] Verify default value is set to `GLASSES`
- [ ] Verify indexes are created

### Step 4: Apply Migration
```bash
npx prisma migrate deploy  # For production
# OR
npx prisma db push         # For development
```

### Step 5: Verify Database
- [ ] Check that `TryOnType` enum exists
- [ ] Check that `type` column exists with default value
- [ ] Check that `itemImageUrl` column exists
- [ ] Check that indexes are created
- [ ] Verify existing records have `type = 'GLASSES'`

## 🧪 Post-Migration Testing

### Configuration Test
```bash
npx tsx scripts/test-try-on-config.ts
```
- [ ] All 4 types configured
- [ ] All required fields present
- [ ] Type validation working
- [ ] URL conversion working

### Route Testing
- [ ] `/try-on` redirects to `/try-on/glasses`
- [ ] `/try-on/glasses` loads correctly
- [ ] `/try-on/outfit` loads correctly
- [ ] `/try-on/shoes` loads correctly
- [ ] `/try-on/accessories` loads correctly
- [ ] `/try-on/invalid` shows 404

### API Testing
Test with curl or Postman:

```bash
# Test glasses try-on (default)
curl -X POST http://localhost:3000/api/try-on \
  -F "userImage=@user.jpg" \
  -F "itemImage=@glasses.jpg" \
  -F "type=GLASSES"

# Test outfit try-on
curl -X POST http://localhost:3000/api/try-on \
  -F "userImage=@user.jpg" \
  -F "itemImage=@outfit.jpg" \
  -F "type=OUTFIT"
```

- [ ] API accepts `type` parameter
- [ ] API defaults to `GLASSES` if type not provided
- [ ] API rejects invalid types
- [ ] API creates task with correct type
- [ ] AI generates result with type-specific prompt

### UI Testing
- [ ] Header shows "Try Glasses" and "Try Outfit" links
- [ ] Home page shows dual CTA buttons
- [ ] Clicking "Try Glasses" navigates to `/try-on/glasses`
- [ ] Clicking "Try Outfit" navigates to `/try-on/outfit`
- [ ] Try-on interface shows correct labels for each type
- [ ] Empty state shows type-specific message
- [ ] Loading state shows type-specific message
- [ ] Upload works for all types
- [ ] Results display correctly for all types

### Backward Compatibility Testing
- [ ] Old API calls with `glassesImage` still work
- [ ] Old database records display correctly
- [ ] Old URLs redirect properly
- [ ] No breaking changes for existing users

### Dashboard Testing
- [ ] Recent try-ons show type information
- [ ] History page displays all types
- [ ] Filtering by type works (if implemented)
- [ ] Admin panel shows type column

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Database migration tested in staging
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Performance acceptable

### Deployment Steps
1. [ ] Deploy database migration to staging
2. [ ] Deploy code to staging
3. [ ] Run smoke tests in staging
4. [ ] Deploy database migration to production
5. [ ] Deploy code to production
6. [ ] Monitor error logs
7. [ ] Verify production functionality

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check database query performance
- [ ] Verify AI generation works for all types
- [ ] Check analytics for usage patterns
- [ ] Gather user feedback

## 📊 Monitoring

### Metrics to Track
- [ ] Try-on success rate by type
- [ ] API response times by type
- [ ] AI generation times by type
- [ ] User adoption of new types
- [ ] Error rates by type

### Alerts to Set Up
- [ ] High error rate for any type
- [ ] Slow AI generation times
- [ ] Database query timeouts
- [ ] Unusual traffic patterns

## 🎉 Success Criteria

- [ ] All 4 try-on types working
- [ ] No increase in error rates
- [ ] Performance within acceptable limits
- [ ] User feedback positive
- [ ] Analytics showing usage of new types

---

**Status**: Ready for database migration  
**Next Step**: Update Prisma schema and run migration

