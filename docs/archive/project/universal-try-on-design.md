# Universal Try-On Architecture Design

## 📋 Overview

This document outlines the architectural design for refactoring VisuTry's try-on feature into a **universal, extensible system** that supports multiple product categories (glasses, outfits, shoes, accessories, etc.) through a single, unified data model and codebase.

## 🎯 Design Goals

1. **Extensibility**: Easy to add new try-on categories without creating new tables or duplicating code
2. **Maintainability**: Single source of truth for try-on logic, reducing code duplication
3. **Scalability**: Support unlimited product categories through configuration
4. **Backward Compatibility**: Preserve existing functionality and data
5. **DRY Principle**: Avoid repeating code across different try-on types

## 🏗️ Architecture Overview

### Core Concept
**TryOn is a universal concept**, differentiated by a `type` field rather than separate tables for each category.

```
Current:  TryOnTask (glasses only)
Future:   TryOnTask (glasses, outfit, shoes, accessories, ...)
```

## 📊 Database Design

### 1. TryOn Type Enumeration

```prisma
enum TryOnType {
  GLASSES      // Eyeglasses
  OUTFIT       // Clothing
  SHOES        // Footwear
  ACCESSORIES  // Jewelry, watches, etc.
  // Future types can be added here
}
```

### 2. Refactored TryOnTask Model

```prisma
model TryOnTask {
  id              String      @id @default(cuid())
  userId          String
  type            TryOnType   @default(GLASSES)  // 🆕 Try-on category
  
  // Input images
  userImageUrl    String                         // User's photo
  itemImageUrl    String                         // 🔄 Renamed from glassesImageUrl
  
  // Output
  resultImageUrl  String?                        // AI-generated result
  
  // Task status
  status          TaskStatus  @default(PENDING)
  errorMessage    String?
  
  // Metadata
  prompt          String?                        // AI prompt used
  metadata        Json?                          // Type-specific metadata
  
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([type])                                // 🆕 Index for type filtering
  @@index([userId, type, createdAt(sort: Desc)]) // 🆕 Optimized type queries
}
```

### 3. Migration Strategy

**Option A: Additive Migration (Recommended for Production)**
```sql
-- Add new fields with defaults
ALTER TABLE "TryOnTask" ADD COLUMN "type" "TryOnType" DEFAULT 'GLASSES';
ALTER TABLE "TryOnTask" ADD COLUMN "itemImageUrl" TEXT;

-- Migrate existing data
UPDATE "TryOnTask" SET "itemImageUrl" = "glassesImageUrl";

-- Keep glassesImageUrl for backward compatibility (can be removed later)
```

**Option B: Rename Migration (For Clean Start)**
```sql
ALTER TABLE "TryOnTask" ADD COLUMN "type" "TryOnType" DEFAULT 'GLASSES';
ALTER TABLE "TryOnTask" RENAME COLUMN "glassesImageUrl" TO "itemImageUrl";
```

## 🛣️ Routing Architecture

### Dynamic Route Pattern (Recommended)

```
/try-on/glasses   → Glasses try-on
/try-on/outfit    → Outfit try-on
/try-on/shoes     → Shoes try-on
/try-on/[type]    → Dynamic route handler
```

**File Structure:**
```
src/app/[locale]/(main)/
  └── try-on/
      ├── [type]/
      │   └── page.tsx          // Dynamic try-on page
      └── page.tsx              // Redirect to /try-on/glasses (backward compatibility)
```

**Benefits:**
- ✅ Automatic support for new types
- ✅ Clean, RESTful URLs
- ✅ Single page component handles all types
- ✅ Easy to maintain and extend

## 🔌 API Design

### Unified API Endpoint

```typescript
POST /api/try-on
Content-Type: multipart/form-data

{
  "type": "GLASSES" | "OUTFIT" | "SHOES" | "ACCESSORIES",
  "userImage": File,
  "itemImage": File
}

Response:
{
  "success": true,
  "data": {
    "taskId": "clx...",
    "status": "processing",
    "type": "OUTFIT"
  }
}
```

### API Implementation Pattern

```typescript
// src/app/api/try-on/route.ts
export async function POST(request: NextRequest) {
  const { type, userImage, itemImage } = await parseRequest(request)
  
  // Get type-specific configuration
  const config = TRY_ON_CONFIGS[type]
  
  // Create task with type
  const task = await prisma.tryOnTask.create({
    data: {
      userId,
      type,              // 🆕 Store type
      userImageUrl,
      itemImageUrl,      // 🔄 Generic field name
      status: "PROCESSING"
    }
  })
  
  // Generate AI result with type-specific prompt
  const result = await generateTryOnImage({
    type,
    userImageUrl,
    itemImageUrl,
    prompt: config.aiPrompt
  })
  
  return NextResponse.json({ success: true, data: task })
}
```

## 🧩 Component Architecture

### Configuration-Driven Design

**Type Configuration File:**
```typescript
// src/config/try-on-types.ts
export const TRY_ON_CONFIGS = {
  GLASSES: {
    name: 'Glasses',
    displayName: 'Try On Glasses',
    route: '/try-on/glasses',
    icon: '👓',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Glasses Image',
    itemImagePlaceholder: 'Choose glasses to try on',
    emptyStateMessage: 'Upload your photo and glasses to see the magic!',
    aiPrompt: 'Generate a photorealistic image of the person wearing these glasses...',
    metadata: {
      category: 'eyewear',
      requiresFaceDetection: true
    }
  },
  OUTFIT: {
    name: 'Outfit',
    displayName: 'Try On Outfit',
    route: '/try-on/outfit',
    icon: '👔',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Outfit Image',
    itemImagePlaceholder: 'Choose outfit to try on',
    emptyStateMessage: 'Upload your photo and outfit to see how it looks!',
    aiPrompt: 'Generate a photorealistic image of the person wearing this outfit...',
    metadata: {
      category: 'clothing',
      requiresBodyDetection: true
    }
  },
  SHOES: {
    name: 'Shoes',
    displayName: 'Try On Shoes',
    route: '/try-on/shoes',
    icon: '👟',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Shoes Image',
    itemImagePlaceholder: 'Choose shoes to try on',
    emptyStateMessage: 'Upload your photo and shoes to see the perfect fit!',
    aiPrompt: 'Generate a photorealistic image of the person wearing these shoes...',
    metadata: {
      category: 'footwear',
      requiresFootDetection: true
    }
  }
}
```

### Universal Component Pattern

```typescript
// src/components/try-on/TryOnInterface.tsx
interface TryOnInterfaceProps {
  type: TryOnType
}

export function TryOnInterface({ type }: TryOnInterfaceProps) {
  const config = TRY_ON_CONFIGS[type]
  const [userImage, setUserImage] = useState<File | null>(null)
  const [itemImage, setItemImage] = useState<File | null>(null)

  return (
    <div>
      <h1>{config.icon} {config.displayName}</h1>

      <ImageUpload
        label={config.userImageLabel}
        onUpload={setUserImage}
      />

      <ImageUpload
        label={config.itemImageLabel}
        placeholder={config.itemImagePlaceholder}
        onUpload={setItemImage}
      />

      <EmptyState message={config.emptyStateMessage} />

      <button onClick={() => handleTryOn(type, userImage, itemImage)}>
        Try On {config.name}
      </button>
    </div>
  )
}
```

### Dynamic Page Component

```typescript
// src/app/[locale]/(main)/try-on/[type]/page.tsx
export default function TryOnPage({ params }: { params: { type: string } }) {
  const type = params.type.toUpperCase() as TryOnType

  // Validate type
  if (!TRY_ON_CONFIGS[type]) {
    notFound()
  }

  const config = TRY_ON_CONFIGS[type]

  return (
    <>
      <Head>
        <title>{config.displayName} - VisuTry</title>
      </Head>
      <TryOnInterface type={type} />
    </>
  )
}

// Generate static params for all types
export function generateStaticParams() {
  return Object.keys(TRY_ON_CONFIGS).map(type => ({
    type: type.toLowerCase()
  }))
}
```

## 🎨 Navigation & UI Updates

### Header Navigation

```typescript
// src/components/layout/Header.tsx
const navLinks = [
  {
    href: '/try-on/glasses',
    label: 'Try Glasses',
    icon: <Glasses className="w-4 h-4" />
  },
  {
    href: '/try-on/outfit',
    label: 'Try Outfit',
    icon: <Shirt className="w-4 h-4" />
  },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
]
```

### Home Page - Dual CTA

```typescript
// src/app/[locale]/(main)/page.tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <button
    onClick={() => router.push('/try-on/glasses')}
    className="btn-primary"
  >
    👓 Try On Glasses
  </button>
  <button
    onClick={() => router.push('/try-on/outfit')}
    className="btn-secondary"
  >
    👔 Try On Outfit
  </button>
</div>
```

## 📋 Implementation Plan

### Phase 1: Database Migration (30 min)
- [ ] Add `TryOnType` enum to Prisma schema
- [ ] Add `type` field to `TryOnTask` model
- [ ] Rename `glassesImageUrl` to `itemImageUrl` (or add new field)
- [ ] Add indexes for type-based queries
- [ ] Run `prisma migrate dev --name add-try-on-type`
- [ ] Verify migration in database

### Phase 2: Configuration Layer (15 min)
- [ ] Create `src/config/try-on-types.ts`
- [ ] Define configurations for GLASSES and OUTFIT
- [ ] Export type definitions and helper functions

### Phase 3: API Refactoring (30 min)
- [ ] Update `src/app/api/try-on/route.ts` to support `type` parameter
- [ ] Update AI prompt generation to use type-specific prompts
- [ ] Update task creation to include `type` field
- [ ] Test API with both GLASSES and OUTFIT types

### Phase 4: Component Refactoring (1 hour)
- [ ] Refactor `TryOnInterface` to accept `type` prop
- [ ] Update all child components to use config-driven text
- [ ] Update `EmptyState`, `LoadingState` to support dynamic messages
- [ ] Test component with different types

### Phase 5: Routing (30 min)
- [ ] Create `src/app/[locale]/(main)/try-on/[type]/page.tsx`
- [ ] Add redirect from `/try-on` to `/try-on/glasses`
- [ ] Implement `generateStaticParams` for all types
- [ ] Test all routes

### Phase 6: Navigation & Home Page (30 min)
- [ ] Update `Header.tsx` with multiple try-on links
- [ ] Update home page with dual CTA buttons
- [ ] Update `TryOnShowcase` to show both types

### Phase 7: Internationalization (15 min)
- [ ] Update `messages/en.json` with outfit-related translations
- [ ] Update other language files (zh, es, fr, etc.)

### Phase 8: Testing & QA (30 min)
- [ ] Test complete flow for glasses try-on
- [ ] Test complete flow for outfit try-on
- [ ] Verify backward compatibility
- [ ] Test navigation and routing
- [ ] Verify database queries and indexes

### Phase 9: Documentation (15 min)
- [ ] Update `docs/project/architecture.md`
- [ ] Update API documentation
- [ ] Add migration guide for developers

## 📁 Files to Modify/Create

### New Files
```
src/config/try-on-types.ts
src/app/[locale]/(main)/try-on/[type]/page.tsx
prisma/migrations/[timestamp]_add_try_on_type/migration.sql
```

### Modified Files
```
prisma/schema.prisma
src/app/api/try-on/route.ts
src/app/api/try-on/[id]/route.ts
src/components/try-on/TryOnInterface.tsx
src/components/try-on/EmptyState.tsx
src/components/try-on/LoadingState.tsx
src/components/layout/Header.tsx
src/app/[locale]/(main)/page.tsx
src/app/[locale]/(main)/try-on/page.tsx (add redirect)
messages/en.json
messages/zh.json
messages/[other-locales].json
```

## ✅ Benefits of This Architecture

1. **Single Source of Truth**: One data model, one API, one component set
2. **Easy Extension**: Add new types by adding enum value + config
3. **Code Reuse**: 90%+ code shared across all try-on types
4. **Type Safety**: TypeScript ensures type correctness
5. **Performance**: Optimized indexes for type-based queries
6. **Maintainability**: Changes apply to all types automatically
7. **Backward Compatible**: Existing data and URLs continue to work

## 🔮 Future Enhancements

- **Type-Specific Features**: Custom UI elements per type (e.g., size selector for shoes)
- **Multi-Item Try-On**: Try multiple items simultaneously (glasses + outfit)
- **AI Model Selection**: Different AI models optimized for different categories
- **Analytics**: Track usage by type to inform product decisions
- **A/B Testing**: Test different prompts/configs per type

## 📝 Notes

- This design maintains full backward compatibility with existing glasses try-on functionality
- The migration can be done incrementally without downtime
- All existing URLs and API endpoints continue to work
- The configuration-driven approach makes it easy to customize each type's behavior
- Future types can be added without touching core logic

---

**Document Version**: 1.0
**Created**: 2025-11-21
**Author**: VisuTry Development Team
**Status**: Design Approved

