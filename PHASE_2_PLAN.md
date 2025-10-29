# 第 2 阶段：动态页面模板开发计划

## 📋 概述

第 2 阶段将创建 4 个动态页面模板，用于展示眼镜产品、脸型、类别和品牌信息。这些页面将使用 Next.js 的 `generateStaticParams()` 进行静态生成，并包含完整的 SEO 优化。

**时间估计:** 5-8 周  
**当前数据:** 10 个型号，7 个脸型，10 个类别  
**目标数据:** 200+ 型号（为扩展做准备）

---

## 🎯 核心任务

### 1. 创建 API 端点（支持动态页面）

#### 1.1 `/api/glasses/frames` - 获取所有眼镜型号
```
GET /api/glasses/frames
Response: { frames: GlassesFrame[] }
```

#### 1.2 `/api/glasses/frames/[id]` - 获取单个眼镜型号
```
GET /api/glasses/frames/[id]
Response: { frame: GlassesFrame, recommendations: FaceShape[] }
```

#### 1.3 `/api/glasses/brands` - 获取所有品牌
```
GET /api/glasses/brands
Response: { brands: string[] }
```

#### 1.4 `/api/glasses/categories` - 获取所有类别
```
GET /api/glasses/categories
Response: { categories: GlassesCategory[] }
```

#### 1.5 `/api/glasses/face-shapes` - 获取所有脸型
```
GET /api/glasses/face-shapes
Response: { shapes: FaceShape[] }
```

---

### 2. 创建动态页面

#### 2.1 `/try/[brand]-[model]/page.tsx` - 产品页

**功能:**
- 显示特定眼镜型号的详细信息
- 推荐的脸型列表
- 相关产品链接（同品牌、同类别）
- 虚拟试戴按钮
- 内部链接到脸型页、类别页、品牌页

**SEO:**
- 动态 meta 标签（标题、描述）
- Product Schema 结构化数据
- Breadcrumb Schema
- 规范 URL

**文件:**
- `src/app/(main)/try/[brand]-[model]/page.tsx`
- `src/components/product/ProductDetail.tsx`
- `src/components/product/RelatedProducts.tsx`

---

#### 2.2 `/style/[faceShape]/page.tsx` - 脸型页

**功能:**
- 显示脸型特征和推荐
- 该脸型适合的所有眼镜列表
- 脸型对比（可选）
- 内部链接到产品页、类别页

**SEO:**
- 动态 meta 标签
- CollectionPage Schema
- Breadcrumb Schema

**文件:**
- `src/app/(main)/style/[faceShape]/page.tsx`
- `src/components/face-shape/FaceShapeDetail.tsx`
- `src/components/face-shape/FrameGrid.tsx`

---

#### 2.3 `/category/[category]/page.tsx` - 类别页

**功能:**
- 显示类别信息
- 该类别的所有眼镜列表
- 按品牌、风格、价格过滤
- 内部链接到产品页、脸型页、品牌页

**SEO:**
- 动态 meta 标签
- CollectionPage Schema
- Breadcrumb Schema

**文件:**
- `src/app/(main)/category/[category]/page.tsx`
- `src/components/category/CategoryDetail.tsx`
- `src/components/category/FrameGrid.tsx`

---

#### 2.4 `/brand/[brand]/page.tsx` - 品牌页

**功能:**
- 显示品牌信息
- 该品牌的所有眼镜型号列表
- 按类别、风格分组
- 内部链接到产品页、脸型页、类别页

**SEO:**
- 动态 meta 标签
- CollectionPage Schema
- Breadcrumb Schema

**文件:**
- `src/app/(main)/brand/[brand]/page.tsx`
- `src/components/brand/BrandDetail.tsx`
- `src/components/brand/FrameGrid.tsx`

---

### 3. 更新 Sitemap

**文件:** `src/app/sitemap.ts`

**更新内容:**
- 添加所有产品页面 (`/try/[brand]-[model]`)
- 添加所有脸型页面 (`/style/[faceShape]`)
- 添加所有类别页面 (`/category/[category]`)
- 添加所有品牌页面 (`/brand/[brand]`)

**优先级:**
- 产品页: 0.8
- 脸型页: 0.7
- 类别页: 0.7
- 品牌页: 0.6

---

### 4. 创建共享组件

#### 4.1 `src/components/seo/StructuredData.tsx`
- 渲染 JSON-LD 结构化数据

#### 4.2 `src/components/common/FrameCard.tsx`
- 眼镜卡片组件（用于列表展示）

#### 4.3 `src/components/common/Breadcrumbs.tsx`
- 面包屑导航组件

#### 4.4 `src/components/common/RelatedLinks.tsx`
- 相关链接组件（内部链接策略）

---

## 📊 数据流

```
Database (Prisma)
    ↓
API Routes (/api/glasses/*)
    ↓
Page Components (generateStaticParams)
    ↓
UI Components (ProductDetail, FaceShapeDetail, etc.)
    ↓
HTML + Structured Data + Meta Tags
```

---

## 🔄 实现顺序

### 第 1 周：基础设施
1. 创建 API 端点 (`/api/glasses/*`)
2. 创建共享组件 (FrameCard, Breadcrumbs, etc.)
3. 创建 SEO 工具函数

### 第 2-3 周：产品页
1. 创建 `/try/[brand]-[model]/page.tsx`
2. 创建 ProductDetail 组件
3. 实现 generateStaticParams 和 generateMetadata
4. 测试和优化

### 第 4-5 周：脸型页
1. 创建 `/style/[faceShape]/page.tsx`
2. 创建 FaceShapeDetail 组件
3. 实现 generateStaticParams 和 generateMetadata
4. 测试和优化

### 第 6-7 周：类别页和品牌页
1. 创建 `/category/[category]/page.tsx`
2. 创建 `/brand/[brand]/page.tsx`
3. 创建相关组件
4. 测试和优化

### 第 8 周：集成和优化
1. 更新 Sitemap
2. 内部链接优化
3. 性能测试
4. SEO 验证

---

## 📈 性能目标

- **首屏加载时间:** < 2 秒
- **LCP (Largest Contentful Paint):** < 2.5 秒
- **CLS (Cumulative Layout Shift):** < 0.1
- **FID (First Input Delay):** < 100 ms

---

## 🧪 测试清单

- [ ] 所有动态路由生成正确
- [ ] Meta 标签正确生成
- [ ] 结构化数据有效
- [ ] 内部链接正确
- [ ] 图片优化
- [ ] 移动端响应式
- [ ] 性能指标达标
- [ ] SEO 验证

---

## 📝 数据扩展

当前数据不足以生成大量页面。建议：

1. **扩展 `data/models.json`**
   - 添加更多眼镜型号（目标: 200+）
   - 每个型号需要: id, brand, name, displayName, description, imageUrl, category, style, material, color, price, faceShapes

2. **运行导入脚本**
   ```bash
   python3 import_data.py
   ```

3. **验证数据**
   ```bash
   python3 verify_data.py
   ```

---

## 🚀 下一步

1. **确认计划** - 与团队讨论并确认上述计划
2. **开始第 1 周** - 创建 API 端点和共享组件
3. **数据扩展** - 准备更多眼镜型号数据
4. **持续集成** - 每周进行代码审查和测试


