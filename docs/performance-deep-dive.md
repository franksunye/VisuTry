# Dashboard 性能问题深度分析

## 🔬 问题根源分析

### 1. Next.js App Router 渲染流程

当用户从 Try-On 页面点击 "Back to Dashboard" 时，发生以下过程：

```
用户点击链接
    ↓
Next.js Router 拦截导航
    ↓
检查 Router Cache (被 force-dynamic 禁用)
    ↓
向服务器发起请求
    ↓
服务器执行 getServerSession() - ~50-100ms
    ↓
服务器执行 3 个数据库查询 (Promise.all) - ~200-500ms
    ├─ groupBy 查询统计
    ├─ findMany 查询最近记录
    └─ findUnique 查询用户信息
    ↓
服务器渲染 React 组件树 - ~50-100ms
    ↓
生成 RSC Payload (React Server Component)
    ↓
传输到客户端 - ~50-200ms (取决于网络)
    ↓
客户端 hydration - ~50-100ms
    ↓
页面显示
```

**总延迟：400-1000ms+**

### 2. `force-dynamic` 的代价

#### 被禁用的优化：

**A. Router Cache (客户端)**
```typescript
// 正常情况下，Next.js 会缓存路由
// 用户第二次访问 Dashboard 时，可以立即显示缓存的内容
// 然后在后台重新验证

// force-dynamic 禁用后：
// 每次导航都需要完整的服务器往返
```

**B. Full Route Cache (服务端)**
```typescript
// 正常情况下，Next.js 会缓存整个路由的渲染结果
// 多个用户访问相同路由时，可以复用渲染结果

// force-dynamic 禁用后：
// 每个请求都需要重新渲染
```

**C. Data Cache**
```typescript
// 正常情况下，fetch 请求会被缓存
// Prisma 查询不使用 fetch，但可以通过 unstable_cache 缓存

// force-dynamic 禁用后：
// 所有数据请求都是实时的
```

**D. Prefetching**
```typescript
// 正常情况下，<Link> 组件会预取目标页面
// 用户点击前，数据已经在后台加载

// force-dynamic 禁用后：
// 预取被禁用，必须等待点击后才开始加载
```

### 3. 数据库查询性能分析

#### 当前查询：

```typescript
// 查询 1: groupBy - 统计各状态的任务数
prisma.tryOnTask.groupBy({
  by: ['status'],
  where: { userId: session.user.id },
  _count: { id: true },
})
// 预估时间：50-150ms (取决于数据量和索引)

// 查询 2: findMany - 获取最近 6 条记录
prisma.tryOnTask.findMany({
  where: { userId: session.user.id },
  orderBy: { createdAt: "desc" },
  take: 6,
  select: { id, status, userImageUrl, resultImageUrl, createdAt },
})
// 预估时间：30-100ms

// 查询 3: findUnique - 获取用户信息
prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPremium, premiumExpiresAt, freeTrialsUsed },
})
// 预估时间：10-50ms

// Promise.all 总时间 = max(查询1, 查询2, 查询3)
// 预估：50-150ms
```

#### 潜在问题：

1. **缺少索引**
   - `TryOnTask.userId` 可能没有索引
   - `TryOnTask.userId + status` 复合索引可能缺失
   - `TryOnTask.userId + createdAt` 复合索引可能缺失

2. **N+1 查询风险**
   - 虽然当前代码没有 N+1 问题
   - 但如果未来添加关联查询，需要注意

3. **数据库连接延迟**
   - 本地开发：数据库可能在远程（Vercel Postgres）
   - 每次查询都需要建立连接
   - Prisma 连接池可能未优化

### 4. 网络延迟分析

#### 本地开发环境：

```
客户端 (浏览器)
    ↓ ~1-5ms (localhost)
Next.js Dev Server (localhost:3000)
    ↓ ~50-200ms (如果数据库在云端)
数据库 (Vercel Postgres / 其他云数据库)
```

#### 生产环境 (Vercel)：

```
客户端 (用户浏览器)
    ↓ ~50-200ms (取决于地理位置)
Vercel Edge Network (最近的边缘节点)
    ↓ ~10-50ms
Vercel Serverless Function (us-east-1 或其他区域)
    ↓ ~5-20ms (同区域) 或 ~50-200ms (跨区域)
数据库 (Vercel Postgres 或其他)
```

## 🎯 优化技术详解

### 技术 1: React Suspense + Streaming

#### 原理：

React 18 引入了 Suspense for Data Fetching，Next.js 14 完全支持。

```typescript
// 传统方式：等待所有数据
async function Page() {
  const data = await fetchAllData() // 等待 500ms
  return <UI data={data} />
}
// 用户等待：500ms 空白屏幕

// Streaming 方式：立即返回框架
async function Page() {
  return (
    <div>
      <Header /> {/* 立即显示 */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent /> {/* 异步加载 */}
      </Suspense>
    </div>
  )
}
// 用户等待：0ms 空白，立即看到框架
```

#### 实现细节：

```typescript
// 1. 创建异步组件
// src/components/dashboard/DashboardStatsAsync.tsx
async function DashboardStatsAsync({ userId }: { userId: string }) {
  // 这个查询会在组件内部执行
  const stats = await getStats(userId)
  return <DashboardStats stats={stats} />
}

// 2. 在页面中使用 Suspense
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  return (
    <div>
      {/* 立即渲染 */}
      <PageHeader user={session.user} />
      
      {/* 异步渲染，显示骨架屏 */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStatsAsync userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

#### HTTP Streaming 流程：

```
客户端请求 /dashboard
    ↓
服务器立即返回 HTML 头部和框架
    ↓
客户端开始渲染框架 (FCP: ~200ms)
    ↓
服务器继续执行数据库查询
    ↓
服务器流式传输 Suspense 内容
    ↓
客户端接收并渲染数据 (LCP: ~600ms)
```

### 技术 2: 智能缓存策略

#### 问题：为什么使用 force-dynamic？

```typescript
// 原因：Session 数据缓存问题
// 用户支付后，数据库更新了 isPremium: true
// 但 Session 中仍然是 isPremium: false
// 所以使用 force-dynamic 强制每次查询数据库
```

#### 更好的方案：

```typescript
// 方案 A: 使用 unstable_cache + revalidateTag
import { unstable_cache, revalidateTag } from 'next/cache'

// 缓存用户数据，30秒过期
const getUserData = unstable_cache(
  async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true, freeTrialsUsed: true }
    })
  },
  ['user-data'],
  { 
    revalidate: 30,
    tags: (userId) => [`user-${userId}`]
  }
)

// 在支付成功后，清除缓存
// src/app/api/payment/webhook/route.ts
async function handlePaymentSuccess(userId: string) {
  await updateUserPremiumStatus(userId)
  revalidateTag(`user-${userId}`) // 清除该用户的缓存
}
```

```typescript
// 方案 B: 使用 fetch + cache
// Prisma 不支持 fetch，但可以包装
async function getUserData(userId: string) {
  return fetch(`/api/user/${userId}`, {
    next: { 
      revalidate: 30,
      tags: [`user-${userId}`]
    }
  }).then(r => r.json())
}
```

```typescript
// 方案 C: 部分动态
export const dynamic = 'auto' // 默认值
export const revalidate = 30  // 30秒缓存

// 只对需要实时的数据使用 no-cache
const userStats = await prisma.user.findUnique({
  where: { id: userId },
  // Prisma 不直接支持 cache 选项
  // 但可以通过 unstable_cache 包装
})
```

### 技术 3: 数据库优化

#### A. 添加索引

```prisma
// prisma/schema.prisma
model TryOnTask {
  id            String   @id @default(cuid())
  userId        String
  status        String
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  // 添加索引
  @@index([userId, status])           // 用于 groupBy 查询
  @@index([userId, createdAt(sort: Desc)]) // 用于 findMany 排序
}
```

```sql
-- 生成的 SQL
CREATE INDEX "TryOnTask_userId_status_idx" ON "TryOnTask"("userId", "status");
CREATE INDEX "TryOnTask_userId_createdAt_idx" ON "TryOnTask"("userId", "createdAt" DESC);
```

#### B. 查询优化

```typescript
// 优化前：3 个查询
const [statusGroups, tasks, currentUser] = await Promise.all([
  prisma.tryOnTask.groupBy(...),
  prisma.tryOnTask.findMany(...),
  prisma.user.findUnique(...)
])

// 优化后：1 个查询 + 内存计算
const userWithTasks = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    tryOnTasks: {
      orderBy: { createdAt: 'desc' },
      take: 100, // 获取更多数据用于统计
      select: {
        id: true,
        status: true,
        userImageUrl: true,
        resultImageUrl: true,
        createdAt: true,
      }
    }
  }
})

// 在内存中计算统计数据
const totalTryOns = userWithTasks.tryOnTasks.length
const completedTryOns = userWithTasks.tryOnTasks.filter(t => t.status === 'COMPLETED').length
const recentTryOns = userWithTasks.tryOnTasks.slice(0, 6)
```

**权衡**：
- ✅ 减少数据库往返（1 次 vs 3 次）
- ✅ 减少连接开销
- ❌ 传输更多数据（如果任务很多）
- ❌ 内存计算开销（通常可忽略）

#### C. Prisma 连接池

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    // 连接池配置（Prisma 5.0+）
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// 在应用关闭时断开连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

### 技术 4: Partial Prerendering (PPR)

#### 概念：

PPR 是 Next.js 14 的实验性功能，结合了静态生成和动态渲染的优势。

```typescript
// 启用 PPR
export const experimental_ppr = true

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  return (
    <div>
      {/* 静态部分：预渲染为 HTML */}
      <StaticHeader />
      <StaticSidebar />
      
      {/* 动态部分：运行时渲染 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicStats userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

#### 工作原理：

1. **构建时**：Next.js 分析组件树，识别静态和动态部分
2. **请求时**：
   - 立即返回静态 HTML（包含 Suspense fallback）
   - 异步渲染动态部分
   - 流式传输动态内容

#### 优势：

- ✅ 最快的 FCP（静态内容）
- ✅ 实时的动态数据
- ✅ 自动优化，无需手动拆分

#### 限制：

- ⚠️ 实验性功能，API 可能变化
- ⚠️ 需要 Next.js 14.1+
- ⚠️ 某些动态 API 可能不兼容

## 📊 性能指标定义

### Core Web Vitals

1. **LCP (Largest Contentful Paint)**
   - 最大内容绘制时间
   - 目标：< 2.5s
   - Dashboard 的 LCP 通常是统计卡片或图表

2. **FID (First Input Delay)** / **INP (Interaction to Next Paint)**
   - 首次输入延迟 / 交互到下次绘制
   - 目标：< 100ms / < 200ms
   - Dashboard 的交互：点击链接、按钮

3. **CLS (Cumulative Layout Shift)**
   - 累积布局偏移
   - 目标：< 0.1
   - Dashboard 需要注意：骨架屏尺寸要与实际内容一致

### Next.js 特定指标

1. **TTFB (Time To First Byte)**
   - 首字节时间
   - 目标：< 600ms
   - 受服务器渲染和数据库查询影响

2. **FCP (First Contentful Paint)**
   - 首次内容绘制
   - 目标：< 1.8s
   - Streaming 可以显著改善

## 🔧 调试工具

### 1. Next.js 内置工具

```bash
# 开启详细日志
DEBUG=* npm run dev

# 分析构建产物
ANALYZE=true npm run build
```

### 2. Chrome DevTools

```javascript
// Performance tab
// 1. 开始录制
// 2. 导航到 Dashboard
// 3. 停止录制
// 4. 分析：
//    - Server Timing: 服务器处理时间
//    - Network: 请求时间
//    - Rendering: 渲染时间
```

### 3. Prisma 查询日志

```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Duration: ' + e.duration + 'ms')
})
```

## 下一步

请确认优化方案，我将开始实施。

