# Database Migration Guide - Universal Try-On

## 📋 Overview

This guide walks you through the database migration needed to support the universal try-on feature.

## 🎯 What We're Adding

1. **TryOnType Enum**: GLASSES, OUTFIT, SHOES, ACCESSORIES
2. **type Field**: To categorize each try-on task
3. **itemImageUrl Field**: Generic field name for any item (replaces glassesImageUrl)
4. **Indexes**: For efficient type-based queries

## 📝 Step-by-Step Instructions

### Step 1: Update Prisma Schema

Open `prisma/schema.prisma` and make the following changes:

#### 1.1 Add TryOnType Enum

Add this enum definition (place it near other enums like TaskStatus):

```prisma
enum TryOnType {
  GLASSES
  OUTFIT
  SHOES
  ACCESSORIES
}
```

#### 1.2 Update TryOnTask Model

Find the `TryOnTask` model and update it:

```prisma
model TryOnTask {
  id              String      @id @default(cuid())
  userId          String
  type            TryOnType   @default(GLASSES)  // 🆕 NEW FIELD
  
  // Input images
  userImageUrl    String
  itemImageUrl    String                         // 🆕 NEW FIELD
  glassesImageUrl String?                        // 🔄 Make optional for backward compatibility
  
  // Output
  resultImageUrl  String?
  
  // Task status
  status          TaskStatus  @default(PENDING)
  errorMessage    String?
  
  // Metadata
  prompt          String?
  metadata        Json?
  
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([type])                                // 🆕 NEW INDEX
  @@index([userId, type, createdAt(sort: Desc)]) // 🆕 NEW INDEX
  @@index([userId, createdAt(sort: Desc)])       // Keep existing
  @@index([userId, status])                      // Keep existing
}
```

### Step 2: Generate Migration

Run the following command to generate the migration:

```bash
npx prisma migrate dev --name add-try-on-type
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your development database
- Regenerate Prisma Client

### Step 3: Review Migration File

Check the generated migration file in `prisma/migrations/[timestamp]_add_try_on_type/migration.sql`

It should look something like this:

```sql
-- CreateEnum
CREATE TYPE "TryOnType" AS ENUM ('GLASSES', 'OUTFIT', 'SHOES', 'ACCESSORIES');

-- AlterTable
ALTER TABLE "TryOnTask" ADD COLUMN "type" "TryOnType" NOT NULL DEFAULT 'GLASSES';
ALTER TABLE "TryOnTask" ADD COLUMN "itemImageUrl" TEXT;
ALTER TABLE "TryOnTask" ALTER COLUMN "glassesImageUrl" DROP NOT NULL;

-- Update existing records to populate itemImageUrl
UPDATE "TryOnTask" SET "itemImageUrl" = "glassesImageUrl" WHERE "itemImageUrl" IS NULL;

-- Make itemImageUrl required after populating
ALTER TABLE "TryOnTask" ALTER COLUMN "itemImageUrl" SET NOT NULL;

-- CreateIndex
CREATE INDEX "TryOnTask_type_idx" ON "TryOnTask"("type");
CREATE INDEX "TryOnTask_userId_type_createdAt_idx" ON "TryOnTask"("userId", "type", "createdAt" DESC);
```

### Step 4: Verify in Development

Check your development database:

```bash
# Connect to your database
npx prisma studio

# Or use psql
psql -d your_database_name

# Check the enum
\dT+ TryOnType

# Check the table structure
\d "TryOnTask"

# Verify existing records
SELECT id, type, "itemImageUrl", "glassesImageUrl" FROM "TryOnTask" LIMIT 5;
```

### Step 5: Deploy to Production

When ready to deploy to production:

```bash
# For production deployment
npx prisma migrate deploy
```

Or if using Vercel/similar platforms, the migration will run automatically on deployment.

## ⚠️ Important Notes

### Data Migration Strategy

**Option A: Keep Both Fields (Recommended)**
- Keep `glassesImageUrl` as optional
- Add `itemImageUrl` as required
- Populate `itemImageUrl` from `glassesImageUrl` for existing records
- New records use `itemImageUrl`
- Provides full backward compatibility

**Option B: Rename Field (Cleaner)**
- Rename `glassesImageUrl` to `itemImageUrl`
- Simpler schema
- May require updating old code references

### Rollback Plan

If you need to rollback:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration_name]

# Or manually revert the schema and create a new migration
```

## 🧪 Testing After Migration

### 1. Test Configuration
```bash
npx tsx scripts/test-try-on-config.ts
```

### 2. Test Database Queries
```typescript
// Test that type field works
const glassesTasks = await prisma.tryOnTask.findMany({
  where: { type: 'GLASSES' }
})

const outfitTasks = await prisma.tryOnTask.findMany({
  where: { type: 'OUTFIT' }
})
```

### 3. Test API
```bash
# Test creating a new task
curl -X POST http://localhost:3000/api/try-on \
  -F "userImage=@user.jpg" \
  -F "itemImage=@glasses.jpg" \
  -F "type=GLASSES"
```

## 🐛 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The column might have been added manually. Use `prisma migrate resolve` to mark it as applied.

### Issue: Existing records have NULL itemImageUrl
**Solution**: Run this SQL to populate from glassesImageUrl:
```sql
UPDATE "TryOnTask" SET "itemImageUrl" = "glassesImageUrl" WHERE "itemImageUrl" IS NULL;
```

### Issue: Type errors in TypeScript after migration
**Solution**: Regenerate Prisma Client:
```bash
npx prisma generate
```

## ✅ Verification Checklist

After migration, verify:
- [ ] Enum `TryOnType` exists in database
- [ ] Field `type` exists with default `GLASSES`
- [ ] Field `itemImageUrl` exists
- [ ] Existing records have `type = 'GLASSES'`
- [ ] Existing records have `itemImageUrl` populated
- [ ] Indexes are created
- [ ] Prisma Client regenerated
- [ ] TypeScript types updated
- [ ] No compilation errors
- [ ] API tests pass
- [ ] UI works correctly

## 📞 Support

If you encounter issues:
1. Check Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
2. Review migration logs
3. Check database logs
4. Verify Prisma Client version matches schema

---

**Ready to migrate?** Follow the steps above carefully and test thoroughly!

