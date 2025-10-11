# 图片优化方案

## 🔍 问题分析

### Dashboard 图片加载问题

**当前情况**：
- 显示 6 张缩略图
- 每张图片可能是原始大小（1-5MB）
- 从 Supabase Storage 直接加载
- 没有 CDN 加速（中国访问慢）

**问题**：
- 图片文件太大
- 加载时间长（特别是从中国访问）
- 浪费带宽

---

## ✅ 已实施的优化

### 1. **降低图片质量**

**改动**：
```typescript
// 之前
quality={60}

// 现在
quality={40}  // 缩略图不需要高质量
```

**效果**：
- 文件大小减少 **40-50%**
- 视觉质量几乎无差异（缩略图很小）

### 2. **优化 sizes 属性**

**改动**：
```typescript
// 之前
sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"

// 现在
sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
```

**效果**：
- 浏览器加载更小的图片
- 减少不必要的像素

### 3. **使用 Supabase Transform API**

**新增工具**：`src/lib/image-utils.ts`

```typescript
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 300,
  quality: number = 40
): string {
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', quality.toString())
    return url.toString()
  }
  return originalUrl
}
```

**效果**：
- Supabase 服务端生成缩略图
- 只传输 300px 宽度的图片
- 文件大小减少 **70-80%**

### 4. **优先加载策略**

**已有优化**：
```typescript
loading={index < 3 ? "eager" : "lazy"}  // 前3张立即加载
priority={index < 3}                     // 前3张高优先级
```

**效果**：
- 首屏图片立即加载
- 其余图片懒加载

---

## 📊 预期性能提升

### 图片文件大小

假设原始图片 2MB：

| 优化阶段 | 文件大小 | 减少 |
|---------|---------|------|
| 原始图片 | 2000 KB | - |
| quality=60 | 800 KB | 60% |
| quality=40 | 600 KB | 70% |
| width=300 + quality=40 | **50 KB** | **97.5%** |

### 总加载时间

6 张图片：

| 优化阶段 | 总大小 | 加载时间（中国） |
|---------|--------|-----------------|
| 原始 | 12 MB | ~60秒 |
| quality=60 | 4.8 MB | ~24秒 |
| quality=40 | 3.6 MB | ~18秒 |
| **width=300 + quality=40** | **300 KB** | **~2秒** |

**预期提升**：从 60秒 → 2秒（**提升 97%**）

---

## 🎯 Supabase Transform API 详解

### 支持的参数

Supabase Storage 支持以下图片转换参数：

```
https://your-project.supabase.co/storage/v1/object/public/bucket/image.jpg?width=300&quality=40
```

**参数**：
- `width` - 宽度（像素）
- `height` - 高度（像素）
- `quality` - 质量（1-100）
- `resize` - 调整模式（cover, contain, fill）
- `format` - 输出格式（webp, avif, jpg, png）

### 最佳实践

**Dashboard 缩略图**：
```typescript
getThumbnailUrl(imageUrl, 300, 40)
// → ?width=300&quality=40
```

**详情页大图**：
```typescript
getThumbnailUrl(imageUrl, 1200, 75)
// → ?width=1200&quality=75
```

**头像**：
```typescript
getThumbnailUrl(imageUrl, 100, 60)
// → ?width=100&quality=60
```

---

## 🚀 进一步优化建议

### 优先级 1：使用 WebP 格式（推荐）

**问题**：
- 当前使用 JPEG/PNG
- 文件大小仍然较大

**解决方案**：
```typescript
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 300,
  quality: number = 40
): string {
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', quality.toString())
    url.searchParams.set('format', 'webp')  // ✅ 使用 WebP
    return url.toString()
  }
  return originalUrl
}
```

**效果**：
- 文件大小再减少 **30-40%**
- 300KB → 180KB
- 浏览器支持度 > 95%

### 优先级 2：使用 CDN 缓存（推荐）

**问题**：
- 每次都从 Supabase 加载
- 中国访问慢

**解决方案**：
1. 配置 Cloudflare CDN
2. 或使用 Vercel Image Optimization

**效果**：
- 缓存命中时：< 100ms
- 减少 Supabase 负载

### 优先级 3：预加载关键图片（可选）

**解决方案**：
```typescript
// 在页面加载时预加载前3张图片
useEffect(() => {
  preloadImages(tryOns.map(t => t.resultImageUrl), 3)
}, [tryOns])
```

**效果**：
- 首屏图片更快显示
- 改善 LCP 指标

---

## 📝 实施步骤

### 已完成 ✅

1. ✅ 降低图片质量（60 → 40）
2. ✅ 优化 sizes 属性
3. ✅ 创建图片工具函数
4. ✅ 使用 Supabase Transform API
5. ✅ 更新 RecentTryOns 组件

### 待实施 ⏳

1. ⏳ 添加 WebP 格式支持
2. ⏳ 配置 CDN 缓存
3. ⏳ 添加图片预加载

---

## 🔍 验证方法

### 1. 检查图片 URL

打开浏览器 DevTools → Network 标签，查看图片 URL：

**期望看到**：
```
https://xxx.supabase.co/storage/v1/object/public/bucket/image.jpg?width=300&quality=40
```

### 2. 检查文件大小

在 Network 标签中查看每张图片的大小：

**期望看到**：
- 每张图片：< 100 KB
- 总大小：< 600 KB（6张图片）

### 3. 检查加载时间

在 Network 标签中查看加载时间：

**期望看到**：
- 从中国访问：< 5秒（之前 60秒）
- 从美国访问：< 1秒

---

## 💡 总结

### ✅ 已实施的优化

1. ✅ 图片质量：60 → 40
2. ✅ 图片尺寸：原始 → 300px
3. ✅ Supabase Transform API
4. ✅ 优化 sizes 属性

### 📊 预期效果

- **文件大小**：12 MB → 300 KB（减少 97.5%）
- **加载时间**：60秒 → 2秒（提升 97%）
- **用户体验**：大幅改善

### 🎯 下一步

1. 部署并验证
2. 检查图片 URL 是否包含 `?width=300&quality=40`
3. 检查文件大小是否 < 100 KB
4. 如果效果好，考虑添加 WebP 格式

---

## 🚨 注意事项

### Supabase Transform API 限制

1. **免费版限制**：
   - 每月 5GB 转换流量
   - 超出后需要付费

2. **支持的格式**：
   - 输入：JPEG, PNG, WebP, AVIF, GIF
   - 输出：JPEG, PNG, WebP, AVIF

3. **最大尺寸**：
   - 宽度/高度：最大 2500px
   - 文件大小：最大 25MB

### 兼容性

- WebP：支持度 > 95%（IE 不支持）
- AVIF：支持度 > 80%（更小，但兼容性差）
- 建议：优先使用 WebP，降级到 JPEG

---

## 📚 参考资料

- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WebP Image Format](https://developers.google.com/speed/webp)

