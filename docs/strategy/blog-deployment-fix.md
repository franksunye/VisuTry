# 博客部署错误修复

## 问题描述

部署时出现以下错误：

```
NormalizeError: Requested and resolved page mismatch: 
/[locale]//(main/)/blog/best-glasses-for-face-shapes-guide/page 
/[locale]/(main/)/blog/best-glasses-for-face-shapes-guide/page
```

## 根本原因

文件路径中的括号被转义了：
```
❌ 错误: src/app/[locale]/\(main\)/blog/...
✅ 正确: src/app/[locale]/(main)/blog/...
```

这是由于在使用 `save-file` 工具时，路径中的括号被自动转义导致的。

## 解决方案

### 步骤 1: 删除错误的文件
```bash
rm -rf "src/app/[locale]/\(main\)/blog/prescription-glasses-virtual-tryon-guide"
rm -rf "src/app/[locale]/\(main\)/blog/best-glasses-for-face-shapes-guide"
rm -rf "src/app/[locale]/\(main\)/blog/find-perfect-glasses-online-guide"
```

### 步骤 2: 创建正确的目录
```bash
mkdir -p "src/app/[locale]/(main)/blog/prescription-glasses-virtual-tryon-guide"
mkdir -p "src/app/[locale]/(main)/blog/best-glasses-for-face-shapes-guide"
mkdir -p "src/app/[locale]/(main)/blog/find-perfect-glasses-online-guide"
```

### 步骤 3: 使用正确的路径创建文件
```
src/app/[locale]/(main)/blog/prescription-glasses-virtual-tryon-guide/page.tsx
src/app/[locale]/(main)/blog/best-glasses-for-face-shapes-guide/page.tsx
src/app/[locale]/(main)/blog/find-perfect-glasses-online-guide/page.tsx
```

### 步骤 4: 提交修复
```bash
git add -A
git commit -m "fix: Correct blog article file paths (remove escaped parentheses)"
git push origin main
```

## 验证

✅ 所有文件现在位于正确的路径：
- `src/app/[locale]/(main)/blog/prescription-glasses-virtual-tryon-guide/page.tsx`
- `src/app/[locale]/(main)/blog/best-glasses-for-face-shapes-guide/page.tsx`
- `src/app/[locale]/(main)/blog/find-perfect-glasses-online-guide/page.tsx`

✅ 文件结构与其他博客文章一致

✅ 部署应该现在成功

## 学习点

在使用 `save-file` 工具创建 Next.js 动态路由文件时，需要注意：

1. **不要在路径中使用转义的括号** - 工具会自动处理
2. **先创建目录** - 使用 `mkdir -p` 确保目录存在
3. **验证文件位置** - 使用 `ls` 或 `view` 工具验证文件是否在正确的位置

## 第二个错误：Breadcrumbs 导入路径错误

### 问题描述
```
Module not found: Can't resolve '@/components/blog/Breadcrumbs'
```

### 根本原因
使用了错误的导入路径：
```typescript
❌ 错误: import { Breadcrumbs } from '@/components/blog/Breadcrumbs'
✅ 正确: import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
```

### 解决方案
修改所有三个新文章的导入语句：
```typescript
// prescription-glasses-virtual-tryon-guide/page.tsx
// best-glasses-for-face-shapes-guide/page.tsx
// find-perfect-glasses-online-guide/page.tsx

import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
```

### 验证
✅ 导入路径与其他博客文章一致
✅ Breadcrumbs 组件位于 `src/components/seo/Breadcrumbs.tsx`

---

## 相关文件

- `docs/strategy/blog-longtail-keyword-strategy.md` - 完整策略
- `docs/strategy/blog-implementation-summary.md` - 实施总结
- `src/app/[locale]/(main)/blog/page.tsx` - 博客列表页面
- `src/components/seo/Breadcrumbs.tsx` - Breadcrumbs 组件

