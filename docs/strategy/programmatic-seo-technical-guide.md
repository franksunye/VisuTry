# 🛠️ VisuTry Programmatic SEO 技术实现指南

**版本 1.0 | 针对 Next.js 14 + Prisma**

---

## 📐 架构设计

### 数据流

```
Admin Panel (数据管理)
    ↓
数据库 (Prisma)
    ↓
getStaticPaths (生成路由)
    ↓
getStaticProps (获取数据)
    ↓
页面模板 (渲染)
    ↓
Sitemap (SEO)
```

---

## 🗄️ 数据库模型设计

### 1. 扩展 GlassesFrame

```prisma
model GlassesFrame {
  id          String   @id @default(cuid())
  name        String   // 型号名称
  description String?
  imageUrl    String
  
  // 新增字段
  brand       String   // 品牌名
  model       String   // 型号代码
  category    String   // 类别
  price       Float?   // 价格
  
  // 关联
  faceShapes  FrameFaceShapeRecommendation[]
  categories  FrameCategoryAssociation[]
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([brand])
  @@index([category])
  @@index([isActive])
}
```

### 2. 新增 FaceShape 模型

```prisma
model FaceShape {
  id              String   @id @default(cuid())
  name            String   @unique // round, square, oval, etc.
  displayName     String   // "Round Face"
  description     String?
  characteristics String?  // 脸型特征
  
  frames          FrameFaceShapeRecommendation[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3. 新增 GlassesCategory 模型

```prisma
model GlassesCategory {
  id          String   @id @default(cuid())
  name        String   @unique // prescription, sunglasses, etc.
  displayName String   // "Prescription Glasses"
  description String?
  
  frames      FrameCategoryAssociation[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4. 关联表

```prisma
model FrameFaceShapeRecommendation {
  id          String   @id @default(cuid())
  frameId     String
  faceShapeId String
  reason      String?  // 推荐原因
  
  frame       GlassesFrame @relation(fields: [frameId], references: [id], onDelete: Cascade)
  faceShape   FaceShape    @relation(fields: [faceShapeId], references: [id], onDelete: Cascade)
  
  @@unique([frameId, faceShapeId])
}

model FrameCategoryAssociation {
  id         String   @id @default(cuid())
  frameId    String
  categoryId String
  
  frame      GlassesFrame    @relation(fields: [frameId], references: [id], onDelete: Cascade)
  category   GlassesCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([frameId, categoryId])
}
```

---

## 📄 页面模板实现

### 1. 品牌/型号页 - `/try/[brand]-[model]/page.tsx`

```typescript
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSEO, generateStructuredData } from '@/lib/seo'

export async function generateStaticParams() {
  const frames = await prisma.glassesFrame.findMany({
    where: { isActive: true },
    select: { brand: true, model: true },
  })
  
  return frames.map(f => ({
    brand: slugify(f.brand),
    model: slugify(f.model),
  }))
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const frame = await getFrameBySlug(params.brand, params.model)
  
  return generateSEO({
    title: `${frame.brand} ${frame.model} Virtual Try-On | VisuTry`,
    description: `Try on ${frame.brand} ${frame.model} glasses virtually. See how they look on your face with AI technology.`,
    url: `/try/${params.brand}-${params.model}`,
    type: 'product',
  })
}

export default async function FramePage({ params }) {
  const frame = await getFrameBySlug(params.brand, params.model)
  const recommendations = await getRecommendations(frame.id)
  
  const structuredData = generateStructuredData('product', {
    name: `${frame.brand} ${frame.model}`,
    description: frame.description,
    image: frame.imageUrl,
    brand: frame.brand,
    price: frame.price,
  })
  
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      <div className="container mx-auto px-4 py-8">
        <h1>{frame.brand} {frame.model}</h1>
        <img src={frame.imageUrl} alt={frame.name} />
        
        {/* 试戴模块 */}
        <TryOnModule frameId={frame.id} />
        
        {/* 推荐 */}
        <RecommendationList items={recommendations} />
      </div>
    </>
  )
}
```

### 2. 脸型风格页 - `/style/[faceShape]/page.tsx`

```typescript
export async function generateStaticParams() {
  const shapes = await prisma.faceShape.findMany()
  return shapes.map(s => ({ faceShape: slugify(s.name) }))
}

export default async function FaceShapePage({ params }) {
  const shape = await prisma.faceShape.findUnique({
    where: { name: unslugify(params.faceShape) },
    include: {
      frames: {
        include: { frame: true },
        take: 20,
      },
    },
  })
  
  return (
    <div>
      <h1>Best Glasses for {shape.displayName}</h1>
      <p>{shape.characteristics}</p>
      
      {/* 推荐眼镜列表 */}
      <FrameGrid frames={shape.frames.map(f => f.frame)} />
    </div>
  )
}
```

---

## 🔗 Sitemap 生成

### 更新 `src/app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'
  
  // 静态页面
  const staticPages = [...]
  
  // 动态品牌/型号页
  const frames = await prisma.glassesFrame.findMany({
    where: { isActive: true },
    select: { id, brand, model, updatedAt },
  })
  
  const framePages = frames.map(f => ({
    url: `${baseUrl}/try/${slugify(f.brand)}-${slugify(f.model)}`,
    lastModified: f.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  
  // 脸型页
  const shapes = await prisma.faceShape.findMany()
  const shapePages = shapes.map(s => ({
    url: `${baseUrl}/style/${slugify(s.name)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  
  return [...staticPages, ...framePages, ...shapePages]
}
```

---

## 🎯 SEO 优化

### 动态 Meta 生成

```typescript
// src/lib/programmatic-seo.ts

export function generateFrameTitle(brand: string, model: string): string {
  return `${brand} ${model} Virtual Try-On | Find Your Perfect Fit | VisuTry`
}

export function generateFrameDescription(brand: string, model: string): string {
  return `Try on ${brand} ${model} glasses virtually with AI technology. See how they look on your face shape. Free online try-on tool.`
}

export function generateFaceShapeTitle(shape: string): string {
  return `Best Glasses for ${shape} Face | Style Guide & Try-On | VisuTry`
}
```

### 结构化数据

```typescript
// Product Schema for frames
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: `${frame.brand} ${frame.model}`,
  image: frame.imageUrl,
  description: frame.description,
  brand: { '@type': 'Brand', name: frame.brand },
  offers: {
    '@type': 'Offer',
    price: frame.price,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
}
```

---

## 📊 内部链接策略

### 相似推荐

```typescript
async function getSimilarFrames(frameId: string, limit = 5) {
  const frame = await prisma.glassesFrame.findUnique({
    where: { id: frameId },
  })
  
  return prisma.glassesFrame.findMany({
    where: {
      AND: [
        { brand: frame.brand },
        { id: { not: frameId } },
        { isActive: true },
      ],
    },
    take: limit,
  })
}
```

### 脸型推荐

```typescript
async function getRecommendedFrames(faceShapeId: string, limit = 10) {
  return prisma.frameFaceShapeRecommendation.findMany({
    where: { faceShapeId },
    include: { frame: true },
    take: limit,
  })
}
```

---

## 🚀 部署检查清单

- [ ] 数据库迁移完成
- [ ] 数据导入完成
- [ ] 页面模板测试通过
- [ ] Sitemap 生成正确
- [ ] SEO meta 标签验证
- [ ] 结构化数据验证
- [ ] 性能测试（LCP < 2.5s）
- [ ] 移动端测试
- [ ] 404 错误检查
- [ ] 内部链接验证

---

## 📈 监控指标

- **索引率**：GSC 中的索引页面数
- **排名**：关键词排名位置
- **流量**：GA4 中的页面访问
- **转化**：试戴点击率
- **性能**：Core Web Vitals


