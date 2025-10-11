# Dashboard 页面性能优化方案

## 📊 问题分析

### 现象
从 Try-On 页面点击 "Back to Dashboard" 链接时，有明显的停顿（延迟）。

### 初步诊断

#### 1. **当前架构分析**

**Dashboard 页面 (`src/app/dashboard/page.tsx`)**
- 使用 `export const dynamic = 'force-dynamic'` - 强制动态渲染
- 使用 `export const revalidate = 60` - 60秒缓存（但被 force-dynamic 覆盖）
- 执行 3 个并行数据库查询：
  1. `groupBy` 查询统计数据
  2. `findMany` 查询最近 6 条试戴记录
  3. `findUnique` 查询用户信息
- 所有数据在服务端完全加载后才返回页面

**Try-On 页面 (`src/app/try-on/page.tsx`)**
- 同样使用 `force-dynamic`
- 执行 1 个数据库查询（用户信息）

**Pricing 页面 (`src/app/pricing/page.tsx`)**
- 同样使用 `force-dynamic`
- 执行 1 个数据库查询（用户信息）

#### 2. **性能瓶颈识别**

根据 Next.js 14 App Router 的特性和社区反馈，主要瓶颈包括：

**A. `force-dynamic` 的影响**
- 完全禁用所有缓存（Router Cache、Data Cache、Full Route Cache）
- 每次导航都需要完整的服务端渲染
- 无法利用 Next.js 的预取（prefetch）优化
- 参考：[Reddit - Next.JS app router is 15x slower](https://www.reddit.com/r/nextjs/comments/1c1iymy/)

**B. 数据库查询延迟**
- Dashboard 需要等待 3 个查询全部完成
- 即使使用 `Promise.all` 并行，仍需等待最慢的查询
- 本地开发环境数据库连接可能较慢
- Vercel 生产环境：数据库地理位置可能影响延迟

**C. 缺少加载状态**
- 没有 `loading.tsx` 文件
- 用户在页面加载期间看到空白
- 感知性能差

**D. 服务端组件渲染开销**
- 整个页面作为单一服务端组件
- 无法利用 Streaming 和 Suspense
- 无法部分渲染

## 🎯 优化策略

### 策略 1: 实现 Streaming 和 Suspense（推荐）

**原理**：
- 将页面拆分为多个独立的服务端组件
- 使用 React Suspense 包裹慢速组件
- 快速组件立即渲染，慢速组件流式传输

**优势**：
- ✅ 显著改善感知性能（TTFB 和 FCP）
- ✅ 保持数据实时性
- ✅ 用户立即看到页面框架
- ✅ 符合 Next.js 14 最佳实践

**实现方案**：

```typescript
// src/app/dashboard/page.tsx
import { Suspense } from 'react'
import { DashboardStatsSkeleton } from '@/components/dashboard/DashboardStatsSkeleton'
import { RecentTryOnsSkeleton } from '@/components/dashboard/RecentTryOnsSkeleton'
import { DashboardStatsAsync } from '@/components/dashboard/DashboardStatsAsync'
import { RecentTryOnsAsync } from '@/components/dashboard/RecentTryOnsAsync'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // 快速返回页面框架
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 立即渲染的静态内容 */}
      <PageHeader user={session.user} />
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 统计数据 - 使用 Suspense */}
          <Suspense fallback={<DashboardStatsSkeleton />}>
            <DashboardStatsAsync userId={session.user.id} />
          </Suspense>
          
          {/* 最近试戴 - 使用 Suspense */}
          <Suspense fallback={<RecentTryOnsSkeleton />}>
            <RecentTryOnsAsync userId={session.user.id} />
          </Suspense>
        </div>
        
        <div className="space-y-6">
          {/* 侧边栏 - 立即渲染 */}
          <SubscriptionCard user={session.user} />
          <QuickActions />
          <Tips />
        </div>
      </div>
    </div>
  )
}
```

### 策略 2: 添加 loading.tsx（快速实现）

**原理**：
- Next.js 自动为路由创建 Suspense 边界
- 在数据加载时显示加载状态

**优势**：
- ✅ 实现简单，改动最小
- ✅ 改善感知性能
- ✅ 符合 Next.js 约定

**实现方案**：

```typescript
// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* 页面骨架屏 */}
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        {/* ... 更多骨架屏 */}
      </div>
    </div>
  )
}
```

### 策略 3: 优化缓存策略

**问题**：
- 当前使用 `force-dynamic` 完全禁用缓存
- 这是为了解决 Session 缓存问题而采用的权宜之计

**更好的方案**：

```typescript
// 移除 force-dynamic，使用更精细的缓存控制
export const dynamic = 'auto' // 或移除此行
export const revalidate = 30 // 30秒缓存

// 对特定查询使用 no-cache
const currentUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  // 使用 Next.js 的 fetch 缓存控制
})

// 或使用 unstable_cache
import { unstable_cache } from 'next/cache'

const getCachedUserStats = unstable_cache(
  async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true, freeTrialsUsed: true }
    })
  },
  ['user-stats'],
  { revalidate: 30, tags: ['user'] }
)
```

### 策略 4: 数据库查询优化

**当前查询分析**：

```typescript
// 3 个并行查询
const [statusGroups, tasks, currentUser] = await Promise.all([
  prisma.tryOnTask.groupBy(...),      // 查询 1
  prisma.tryOnTask.findMany(...),     // 查询 2
  prisma.user.findUnique(...)         // 查询 3
])
```

**优化方案**：

1. **添加数据库索引**（如果还没有）：
```sql
CREATE INDEX idx_tryontask_userid_status ON "TryOnTask"("userId", "status");
CREATE INDEX idx_tryontask_userid_createdat ON "TryOnTask"("userId", "createdAt" DESC);
```

2. **合并查询**（减少往返）：
```typescript
// 使用单个查询获取用户和统计数据
const userWithStats = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: {
    tryOnTasks: {
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        status: true,
        userImageUrl: true,
        resultImageUrl: true,
        createdAt: true,
      }
    },
    _count: {
      select: {
        tryOnTasks: {
          where: { status: 'COMPLETED' }
        }
      }
    }
  }
})
```

3. **使用 Prisma 连接池优化**：
```typescript
// src/lib/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 添加连接池配置
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

### 策略 5: 使用 Partial Prerendering (PPR) - 实验性

**原理**：
- Next.js 14 的实验性功能
- 静态部分预渲染，动态部分流式传输

**配置**：

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    ppr: 'incremental', // 启用部分预渲染
  },
}
```

```typescript
// src/app/dashboard/page.tsx
export const experimental_ppr = true
```

## 📋 推荐实施方案

### 阶段 1: 快速改善（1-2小时）

**优先级：高**

1. **添加 loading.tsx**
   - 创建 `src/app/dashboard/loading.tsx`
   - 实现骨架屏 UI
   - 立即改善感知性能

2. **添加数据库索引**
   - 在 Prisma schema 中添加索引
   - 运行 migration

3. **优化 Prisma 查询**
   - 合并相关查询
   - 减少数据库往返

### 阶段 2: 结构优化（4-6小时）

**优先级：中**

1. **实现 Streaming + Suspense**
   - 拆分 Dashboard 为多个异步组件
   - 为每个慢速组件添加 Suspense
   - 创建对应的 Skeleton 组件

2. **优化缓存策略**
   - 移除 `force-dynamic`（或改为更精细的控制）
   - 使用 `unstable_cache` 缓存用户数据
   - 使用 `revalidateTag` 在数据更新时清除缓存

### 阶段 3: 高级优化（可选）

**优先级：低**

1. **启用 PPR**
   - 实验性功能，需要测试
   - 可能带来最佳性能

2. **实现客户端预取**
   - 使用 `<Link prefetch={true}>`
   - 在用户可能点击前预加载数据

## 🧪 性能测试方法

### 本地测试

```bash
# 1. 使用 Next.js 内置性能分析
ANALYZE=true npm run build

# 2. 使用 Chrome DevTools
# - Network tab: 查看 TTFB (Time To First Byte)
# - Performance tab: 查看渲染时间
# - Lighthouse: 综合性能评分

# 3. 测量具体指标
# - FCP (First Contentful Paint): 首次内容绘制
# - LCP (Largest Contentful Paint): 最大内容绘制
# - TTI (Time to Interactive): 可交互时间
```

### 生产环境测试

```bash
# Vercel Analytics
# - 在 Vercel Dashboard 查看 Real Experience Score
# - 查看 Core Web Vitals

# 使用 WebPageTest
# https://www.webpagetest.org/
```

## 📊 预期性能改善

| 指标 | 当前 | 阶段1 | 阶段2 | 阶段3 |
|------|------|-------|-------|-------|
| TTFB | ~500ms | ~500ms | ~200ms | ~100ms |
| FCP | ~1000ms | ~600ms | ~300ms | ~200ms |
| LCP | ~1500ms | ~1000ms | ~600ms | ~400ms |
| 感知延迟 | 明显 | 轻微 | 几乎无 | 无 |

## 🔍 相关资源

- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching)
- [Next.js Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [React Suspense for Data Fetching](https://react.dev/reference/react/Suspense)

## 下一步

请审阅此方案，确认后我将开始实施。建议从阶段 1 开始，逐步推进。

