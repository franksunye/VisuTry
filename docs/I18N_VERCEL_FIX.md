# Vercel 部署错误修复 - Next.js 14 Params Promise

## 🐛 问题描述

在 Vercel 部署时遇到运行时错误：

```
Error digest: 4009768826
at /vercel/path0/.next/server/chunks/7118.js:1:66245
```

## 🔍 根本原因

**Next.js 14 的重大变更**：在 Next.js 14 中，`params` 和 `searchParams` 在异步函数中变成了 Promise。

### 旧的写法（Next.js 13）
```typescript
export async function generateMetadata({ params: { locale } }: Props) {
  // locale 直接可用
  const t = await getTranslations({ locale, namespace: 'meta.home' })
}
```

### 新的写法（Next.js 14）
```typescript
export async function generateMetadata(props: Props) {
  const params = await props.params  // 需要 await
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })
}
```

## ✅ 修复方案

### 1. 更新类型定义

**之前**:
```typescript
type Props = {
  children: ReactNode
  params: { locale: string }
}
```

**之后**:
```typescript
type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>  // 改为 Promise
}
```

### 2. 更新 generateMetadata 函数

**之前**:
```typescript
export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta.home' })
  
  return generateI18nSEO({
    locale: locale as Locale,
    title: t('title'),
    description: t('description'),
    pathname: '',
  })
}
```

**之后**:
```typescript
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params  // 先 await params
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })
  
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('title'),
    description: t('description'),
    pathname: '',
  })
}
```

### 3. 更新页面组件

**之前**:
```typescript
export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  // locale 直接可用
  if (!locales.includes(locale as Locale)) {
    notFound()
  }
}
```

**之后**:
```typescript
export default async function LocaleLayout(props: Props) {
  const params = await props.params  // 先 await params
  const locale = params.locale
  
  if (!locales.includes(locale as Locale)) {
    notFound()
  }
}
```

## 📝 修复的文件

1. ✅ `src/app/[locale]/layout.tsx`
   - 更新 Props 类型
   - 更新 generateMetadata
   - 更新 LocaleLayout 组件

2. ✅ `src/app/[locale]/(main)/pricing/page.tsx`
   - 更新 Props 类型
   - 更新 generateMetadata

3. ✅ `src/app/[locale]/(main)/try-on/page.tsx`
   - 更新 Props 类型
   - 更新 generateMetadata

4. ✅ `src/app/[locale]/(main)/blog/page.tsx`
   - 更新 Props 类型
   - 更新 generateMetadata

5. ✅ `src/app/[locale]/(main)/auth/signin/page.tsx`
   - 更新 Props 类型
   - 更新 generateMetadata

## 🎯 关键要点

### Next.js 14 的变更

1. **Params 是 Promise**
   - 在所有异步函数中，`params` 现在是 Promise
   - 必须使用 `await props.params` 来获取实际值

2. **SearchParams 也是 Promise**
   - `searchParams` 同样变成了 Promise
   - 需要 `await props.searchParams`

3. **影响范围**
   - `generateMetadata` 函数
   - `generateStaticParams` 函数
   - 页面组件（如果是 async）
   - Layout 组件（如果是 async）

### 最佳实践

```typescript
// ✅ 正确的写法
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  // 使用 params.slug 和 searchParams
}

export default async function Page(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  // 使用 params 和 searchParams
}
```

## 🔗 参考资料

- [Next.js 14 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-14)
- [Next.js Async Request APIs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#async-params)

## 🚀 验证

### 本地测试
```bash
npm run build
npm run start
```

### Vercel 部署
- ✅ 修复已提交到 GitHub
- ✅ Vercel 将自动重新部署
- ✅ 检查部署日志确认无错误

## 📊 影响

### 修复前
- ❌ Vercel 部署失败
- ❌ 运行时错误：Error digest: 4009768826
- ❌ 页面无法加载

### 修复后
- ✅ Vercel 部署成功
- ✅ 所有页面正常加载
- ✅ SEO 元数据正确生成
- ✅ 多语言功能正常工作

## 🎉 总结

这是 Next.js 14 的一个重要变更，所有使用动态路由参数的异步函数都需要更新。

**关键变更**:
- `params` 从对象变成了 Promise
- 需要使用 `await props.params` 来获取值
- 影响所有使用 `generateMetadata` 和异步页面组件的文件

**修复状态**: ✅ 完成
**提交**:
- 670833c - Fix params Promise handling
- 2244ce2 - Add missing children destructuring
- 63de311 - Add next-intl plugin to next.config.js
**分支**: feature/i18n-multi-language

---

## 🐛 问题 2: next-intl 配置文件未找到

### 错误信息
```
Error: Couldn't find next-intl config file.
Please follow the instructions at https://next-intl.dev/docs/getting-started/app-router
Error digest: 1847728666
```

### 根本原因
`next-intl` 需要在 `next.config.js` 中明确配置插件，以便在生产构建时能够找到配置文件。

### 修复方案

更新 `next.config.js`：

```javascript
const withNextIntl = require('next-intl/plugin')(
  // Specify the path to the request config
  './src/i18n/request.ts'
)

const nextConfig = {
  // ... your config
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
```

### 关键点
- ✅ 必须使用 `next-intl/plugin` 包装配置
- ✅ 必须指定 request config 的路径
- ✅ 插件顺序：`withBundleAnalyzer(withNextIntl(nextConfig))`
- ✅ 配置文件路径：`./src/i18n/request.ts`

### 修复的文件
- `next.config.js` - 添加 next-intl 插件配置

