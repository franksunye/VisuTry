# 📄 VisuTry 页面设计模板

**版本 1.0 | 4 种页面类型的设计规范**

---

## 1️⃣ 品牌/型号页 (`/try/[brand]-[model]`)

### 页面结构

```
┌─────────────────────────────────────┐
│ 面包屑导航                           │
│ Home > Glasses > {Brand} > {Model}  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ H1: {Brand} {Model} Virtual Try-On  │
│ 副标题: Find Your Perfect Fit       │
└─────────────────────────────────────┘

┌──────────────────┬──────────────────┐
│ 产品图片         │ 产品信息         │
│ (左侧)           │ (右侧)           │
│                  │ - 品牌           │
│                  │ - 型号           │
│                  │ - 价格           │
│                  │ - 材质           │
│                  │ - 颜色           │
│                  │ - 推荐脸型       │
└──────────────────┴──────────────────┘

┌─────────────────────────────────────┐
│ 试戴模块 (CTA)                       │
│ [Try On Now] 按钮                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 产品描述 (200-300 字)               │
│ 包含关键词和 SEO 优化内容           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 推荐脸型 (3-5 个)                   │
│ "Best for Round Face"               │
│ "Best for Square Face"              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 相似推荐 (5-10 个)                  │
│ 同品牌的其他型号                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 类别推荐 (3-5 个)                   │
│ "Browse Prescription Glasses"       │
└─────────────────────────────────────┘
```

### SEO 元素

- **H1**: `{Brand} {Model} Virtual Try-On | Find Your Perfect Fit`
- **Meta Title**: `{Brand} {Model} Virtual Try-On | Find Your Perfect Fit | VisuTry`
- **Meta Description**: `Try on {Brand} {Model} glasses virtually with AI technology. See how they look on your face shape. Free online try-on tool.`
- **Schema**: Product Schema + BreadcrumbList
- **Canonical**: `/try/{brand}-{model}`

---

## 2️⃣ 脸型风格页 (`/style/[faceShape]`)

### 页面结构

```
┌─────────────────────────────────────┐
│ 面包屑导航                           │
│ Home > Styles > {FaceShape}         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ H1: Best Glasses for {FaceShape}    │
│ 副标题: Style Guide & Recommendations│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 脸型特征描述 (150-200 字)           │
│ - 脸型特征                          │
│ - 推荐风格                          │
│ - 避免风格                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 推荐眼镜网格 (10-15 个)             │
│ 显示该脸型推荐的眼镜                │
│ 每个卡片包含:                       │
│ - 产品图片                          │
│ - 品牌和型号                        │
│ - 价格                              │
│ - [Try On] 按钮                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 相关脸型 (3-5 个)                   │
│ "Also explore Round Face"           │
└─────────────────────────────────────┘
```

### SEO 元素

- **H1**: `Best Glasses for {FaceShape} Face`
- **Meta Title**: `Best Glasses for {FaceShape} Face | Style Guide & Try-On | VisuTry`
- **Meta Description**: `Discover the best glasses styles for {FaceShape} face shapes. Get personalized recommendations and try them on virtually with VisuTry.`
- **Schema**: CollectionPage Schema + BreadcrumbList
- **Canonical**: `/style/{faceShape}`

---

## 3️⃣ 类别页 (`/category/[category]`)

### 页面结构

```
┌─────────────────────────────────────┐
│ 面包屑导航                           │
│ Home > Categories > {Category}      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ H1: {Category} Glasses              │
│ 副标题: Virtual Try-On & Selection  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 类别描述 (150-200 字)               │
│ - 类别用途                          │
│ - 特点和优势                        │
│ - 选择建议                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 眼镜网格 (20-30 个)                 │
│ 该类别的所有眼镜                    │
│ 支持筛选:                           │
│ - 品牌                              │
│ - 价格范围                          │
│ - 脸型                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 相关类别 (3-5 个)                   │
│ "Also browse Sunglasses"            │
└─────────────────────────────────────┘
```

### SEO 元素

- **H1**: `{Category} Glasses`
- **Meta Title**: `{Category} Glasses | Virtual Try-On | VisuTry`
- **Meta Description**: `Browse and try on {Category} glasses virtually. Find your perfect pair with our AI-powered try-on technology.`
- **Schema**: CollectionPage Schema + BreadcrumbList
- **Canonical**: `/category/{category}`

---

## 4️⃣ 品牌页 (`/brand/[brand]`)

### 页面结构

```
┌─────────────────────────────────────┐
│ 面包屑导航                           │
│ Home > Brands > {Brand}             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ H1: {Brand} Glasses                 │
│ 副标题: Explore & Try-On            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 品牌描述 (150-200 字)               │
│ - 品牌历史                          │
│ - 品牌特点                          │
│ - 产品范围                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 品牌型号网格 (所有型号)             │
│ 该品牌的所有眼镜                    │
│ 支持筛选:                           │
│ - 类别                              │
│ - 价格范围                          │
│ - 脸型                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 相关品牌 (3-5 个)                   │
│ "Also explore Oliver Peoples"       │
└─────────────────────────────────────┘
```

### SEO 元素

- **H1**: `{Brand} Glasses`
- **Meta Title**: `{Brand} Glasses | Virtual Try-On | VisuTry`
- **Meta Description**: `Explore {Brand} glasses and try them on virtually. See how different styles look on your face with VisuTry.`
- **Schema**: CollectionPage Schema + BreadcrumbList
- **Canonical**: `/brand/{brand}`

---

## 🎨 通用设计元素

### 颜色方案
- 主色: 蓝色 (#3B82F6)
- 辅助色: 灰色 (#6B7280)
- 背景: 白色 (#FFFFFF)
- 文本: 深灰色 (#1F2937)

### 排版
- H1: 32px, 粗体
- H2: 24px, 粗体
- 正文: 16px, 常规
- 小文本: 14px, 常规

### 间距
- 页面边距: 32px
- 卡片间距: 16px
- 行高: 1.6

### 响应式设计
- 桌面: 1200px+
- 平板: 768px-1199px
- 手机: <768px

---

## ✅ 设计验证清单

- [ ] 所有页面都有 H1 标签
- [ ] Meta 标题和描述已优化
- [ ] 面包屑导航正确
- [ ] 内部链接合理
- [ ] 图片已优化
- [ ] 移动端响应式
- [ ] 加载速度 < 2.5s
- [ ] 无 404 错误

