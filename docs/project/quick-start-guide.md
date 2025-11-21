# Universal Try-On - Quick Start Guide

## 🎯 What's New?

VisuTry now supports **multiple try-on categories** through a single, unified system:
- 👓 **Glasses** (existing)
- 👔 **Outfit** (new)
- 👟 **Shoes** (new)
- 💍 **Accessories** (new)

## 🚀 Quick Start

### For Users

#### Try On Glasses
1. Visit `/try-on/glasses` or click "Try Glasses" in header
2. Upload your photo
3. Upload glasses image
4. Click "Try On Glasses"
5. See AI-generated result

#### Try On Outfit
1. Visit `/try-on/outfit` or click "Try Outfit" in header
2. Upload your photo
3. Upload outfit image
4. Click "Try On Outfit"
5. See AI-generated result

### For Developers

#### Adding a New Try-On Type

1. **Update Configuration** (`src/config/try-on-types.ts`):
```typescript
export const TRY_ON_CONFIGS = {
  // ... existing types
  HATS: {
    name: 'Hats',
    displayName: 'Try On Hats',
    route: '/try-on/hats',
    icon: '🎩',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Hat Image',
    itemImagePlaceholder: 'Choose hat to try on',
    emptyStateMessage: 'Upload your photo and hat!',
    aiPrompt: 'Place this hat naturally on the person...',
    metadata: {
      category: 'headwear'
    }
  }
}
```

2. **Update Database Enum** (`prisma/schema.prisma`):
```prisma
enum TryOnType {
  GLASSES
  OUTFIT
  SHOES
  ACCESSORIES
  HATS  // Add new type
}
```

3. **Run Migration**:
```bash
npx prisma migrate dev --name add-hats-type
npx prisma generate
```

4. **That's it!** The new type is automatically available at `/try-on/hats`

## 📖 Key Concepts

### Type-Specific Configuration

Each try-on type has its own configuration:
- **Display names** - User-facing labels
- **AI prompts** - Type-specific instructions for AI
- **Icons** - Visual identifiers
- **Metadata** - Additional type information

### Unified API

Single API endpoint handles all types:
```typescript
POST /api/try-on
{
  type: "GLASSES" | "OUTFIT" | "SHOES" | "ACCESSORIES",
  userImage: File,
  itemImage: File
}
```

### Dynamic Routing

Routes are automatically generated:
- `/try-on/glasses` → Glasses try-on
- `/try-on/outfit` → Outfit try-on
- `/try-on/shoes` → Shoes try-on
- `/try-on/[type]` → Dynamic handler

## 🔧 Common Tasks

### Test Configuration
```bash
npx tsx scripts/test-try-on-config.ts
```

### Verify Database
```bash
npx tsx scripts/verify-database-migration.ts
```

### Query by Type
```typescript
// Get all glasses try-ons
const glassesTasks = await prisma.tryOnTask.findMany({
  where: { type: 'GLASSES' }
})

// Get all outfit try-ons
const outfitTasks = await prisma.tryOnTask.findMany({
  where: { type: 'OUTFIT' }
})
```

### Create Try-On Task
```typescript
const task = await prisma.tryOnTask.create({
  data: {
    userId: user.id,
    type: 'OUTFIT',
    userImageUrl: userImage.url,
    itemImageUrl: outfitImage.url,
    status: 'PROCESSING'
  }
})
```

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Configuration Layer             │
│    (src/config/try-on-types.ts)        │
│  - Type definitions                     │
│  - UI labels & prompts                  │
│  - Metadata                             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           API Layer                     │
│    (src/app/api/try-on/route.ts)       │
│  - Accept type parameter                │
│  - Use type-specific prompts            │
│  - Create typed tasks                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Component Layer                 │
│  (src/components/try-on/*)              │
│  - TryOnInterface (type prop)           │
│  - Dynamic UI based on config           │
│  - Type-specific messages               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Routing Layer                  │
│  (src/app/[locale]/(main)/try-on/*)    │
│  - Dynamic [type] route                 │
│  - Static params generation             │
│  - Type validation                      │
└─────────────────────────────────────────┘
```

## 🎨 Customization

### Change AI Prompt
Edit `src/config/try-on-types.ts`:
```typescript
GLASSES: {
  // ...
  aiPrompt: 'Your custom prompt here...'
}
```

### Change UI Labels
Edit `src/config/try-on-types.ts`:
```typescript
OUTFIT: {
  // ...
  itemImageLabel: 'Upload Clothing Image',
  emptyStateMessage: 'Custom message here'
}
```

### Add Translations
Edit `messages/en.json`:
```json
{
  "nav": {
    "tryGlasses": "Try Glasses",
    "tryOutfit": "Try Outfit"
  }
}
```

## 🐛 Troubleshooting

### Type not showing up
- Check configuration in `try-on-types.ts`
- Verify enum in `prisma/schema.prisma`
- Run `npx prisma generate`

### Database errors
- Verify migration applied
- Check Prisma Client regenerated
- Run verification script

### TypeScript errors
- Regenerate Prisma Client
- Restart TypeScript server
- Check imports

## 📚 Further Reading

- [Implementation Summary](./universal-try-on-implementation-summary.md)
- [Database Migration Guide](./database-migration-guide.md)
- [Deployment Checklist](./deployment-ready-checklist.md)
- [Full Checklist](./universal-try-on-checklist.md)

## 🎉 Success!

You're now ready to use the universal try-on system. Add new types easily, customize behavior, and scale effortlessly!

