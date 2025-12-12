# 🚀 VisuTry Programmatic SEO 实现指南

**版本 1.0 | 阶段 0 & 1 完成后的下一步**

---

## 📋 已完成的工作

### 阶段 0：准备与基线建立 ✅

#### 数据库
- ✅ Prisma schema 已扩展，包含 FaceShape, GlassesCategory 模型
- ✅ 迁移文件已创建: `prisma/migrations/20251029_add_programmatic_seo_models/migration.sql`
- ✅ 关联表已创建: FrameFaceShapeRecommendation, FrameCategoryAssociation

#### 数据
- ✅ 品牌数据: `data/brands.json` (10 个品牌)
- ✅ 脸型数据: `data/face-shapes.json` (7 个脸型)
- ✅ 类别数据: `data/categories.json` (10 个类别)
- ✅ 型号数据: `data/models.json` (10 个示例型号)

#### 后台管理
- ✅ Frames 管理页面: `/admin/frames`
- ✅ Data Stats 统计页面: `/admin/data-stats`
- ✅ Frames API: `/api/admin/frames`
- ✅ 导航菜单已更新

#### 工具库
- ✅ SEO 工具库: `src/lib/programmatic-seo.ts`
- ✅ 数据导入脚本: `scripts/import-programmatic-seo-data.ts`

### 阶段 1：关键词研究 + 页面设计 ✅

#### 关键词研究
- ✅ 品牌/型号关键词: `docs/strategy/keywords-mapping.md`
- ✅ 脸型关键词: `docs/strategy/keywords-mapping.md`
- ✅ 类别关键词: `docs/strategy/keywords-mapping.md`
- ✅ 品牌页关键词: `docs/strategy/keywords-mapping.md`

#### 页面设计
- ✅ 4 种页面模板设计: `docs/strategy/page-design-templates.md`
- ✅ URL 规范化规则
- ✅ 面包屑导航设计
- ✅ 内部链接策略

---

## 🔧 立即执行的步骤

### 步骤 1：部署数据库迁移

```bash
# 运行迁移
npx prisma migrate deploy

# 或者如果需要创建新迁移
npx prisma migrate dev --name add_programmatic_seo_models
```

**预期结果**：
- 创建 FaceShape 表
- 创建 GlassesCategory 表
- 创建 FrameFaceShapeRecommendation 表
- 创建 FrameCategoryAssociation 表
- 扩展 GlassesFrame 表

### 步骤 2：导入数据

```bash
# 运行导入脚本
npx tsx scripts/import-programmatic-seo-data.ts
```

**预期结果**：
- 导入 7 个脸型
- 导入 10 个类别
- 导入 10 个品牌
- 导入 10 个型号
- 创建脸型推荐关联

### 步骤 3：验证数据

访问以下页面验证数据：

1. **Admin Dashboard**: `http://localhost:3000/admin/dashboard`
   - 检查总用户数、订单数等

2. **Frames 管理**: `http://localhost:3000/admin/frames`
   - 应该看到 10 个导入的型号
   - 支持搜索和分页

3. **Data Stats**: `http://localhost:3000/admin/data-stats`
   - 应该看到数据统计
   - 检查数据质量指标

---

## 📄 第 2 阶段：模板开发 + 自动化生成（第 5-8 周）

### 创建动态页面模板

#### 1. 品牌/型号页 (`/try/[brand]-[model]/page.tsx`)

```typescript
// 基本结构
export async function generateStaticParams() {
  // 获取所有 frames
  // 返回 { brand, model } 数组
}

export async function generateMetadata({ params }) {
  // 使用 generateFrameTitle() 和 generateFrameDescription()
  // 返回 meta 对象
}

export default async function FramePage({ params }) {
  // 获取 frame 数据
  // 获取推荐数据
  // 返回页面 JSX
}
```

**参考文件**：
- `docs/strategy/programmatic-seo-technical-guide.md` (第 120-183 行)
- `src/lib/programmatic-seo.ts` (SEO 函数)

#### 2. 脸型页 (`/style/[faceShape]/page.tsx`)

```typescript
// 基本结构
export async function generateStaticParams() {
  // 获取所有 face shapes
  // 返回 { faceShape } 数组
}

export default async function FaceShapePage({ params }) {
  // 获取 face shape 数据
  // 获取推荐的 frames
  // 返回页面 JSX
}
```

#### 3. 类别页 (`/category/[category]/page.tsx`)

```typescript
// 基本结构
export async function generateStaticParams() {
  // 获取所有 categories
  // 返回 { category } 数组
}

export default async function CategoryPage({ params }) {
  // 获取 category 数据
  // 获取该类别的所有 frames
  // 返回页面 JSX
}
```

#### 4. 品牌页 (`/brand/[brand]/page.tsx`)

```typescript
// 基本结构
export async function generateStaticParams() {
  // 获取所有唯一的 brands
  // 返回 { brand } 数组
}

export default async function BrandPage({ params }) {
  // 获取该品牌的所有 frames
  // 返回页面 JSX
}
```

### 实现 SEO 优化

1. **动态 Meta 生成**
   - 使用 `generateFrameTitle()` 等函数
   - 参考: `src/lib/programmatic-seo.ts`

2. **结构化数据**
   - 使用 `generateProductSchema()` 等函数
   - 参考: `src/lib/programmatic-seo.ts`

3. **Sitemap 生成**
   - 更新 `src/app/sitemap.ts`
   - 参考: `docs/strategy/programmatic-seo-technical-guide.md` (第 218-253 行)

### 内部链接实现

1. **相似推荐**
   - 同品牌的其他型号
   - 参考: `docs/strategy/programmatic-seo-technical-guide.md` (第 301-320 行)

2. **脸型推荐**
   - 使用 FrameFaceShapeRecommendation 表
   - 参考: `docs/strategy/programmatic-seo-technical-guide.md` (第 322-332 行)

3. **品牌推荐**
   - 同类别的其他品牌

---

## 📊 数据扩展指南

### 添加更多品牌

1. 编辑 `data/brands.json`
2. 添加新品牌对象
3. 重新运行导入脚本

### 添加更多型号

1. 编辑 `data/models.json`
2. 添加新型号对象
3. 确保 brand 和 category 存在
4. 重新运行导入脚本

### 添加脸型推荐

1. 编辑 `data/models.json` 中的 `faceShapes` 数组
2. 重新运行导入脚本

---

## 🧪 测试清单

- [ ] 数据库迁移成功
- [ ] 数据导入成功
- [ ] Admin 页面可访问
- [ ] Frames 列表显示正确
- [ ] Data Stats 显示正确的统计
- [ ] 搜索功能正常
- [ ] 分页功能正常

---

## 📈 性能优化

### 数据库查询优化
- 使用索引: `@@index([brand])`, `@@index([category])`
- 使用 `select` 限制返回字段
- 使用 `take` 和 `skip` 实现分页

### 页面生成优化
- 使用 ISR (Incremental Static Regeneration)
- 配置 `revalidate` 时间
- 使用 `generateStaticParams` 预生成路由

### 图片优化
- 使用 Next.js Image 组件
- 配置 `width` 和 `height`
- 使用 `priority` 加载关键图片

---

## 🔗 相关文档

- [执行计划](./programmatic-seo-execution-plan.md)
- [技术实现指南](./programmatic-seo-technical-guide.md)
- [数据准备指南](./data-preparation-guide.md)
- [关键词映射](./keywords-mapping.md)
- [页面设计模板](./page-design-templates.md)
- [完成检查清单](./PHASE_0_1_COMPLETION_CHECKLIST.md)

---

## 💡 常见问题

### Q: 如何添加更多数据？
A: 编辑 `data/` 目录下的 JSON 文件，然后运行 `npx tsx scripts/import-programmatic-seo-data.ts`

### Q: 如何测试动态页面？
A: 创建页面模板后，运行 `npm run build` 生成静态页面，然后 `npm run start` 启动生产服务器

### Q: 如何监控 SEO 性能？
A: 使用 Google Search Console 和 Google Analytics 4 追踪排名和流量

---

## 📞 支持

如有问题，请查看相关文档或联系开发团队。

