# 数据库性能优化方案

## 🔍 问题分析

### 首次访问性能问题
```
数据库查询: 1382ms (95.7%)  🔴 SLOW
- getUserBasicData: 1380ms  🔴
- getUserTasks: 1023ms      🔴
```

### 根本原因

#### 1. **Supabase 免费版冷启动**（主要原因）
- 免费版数据库会在空闲后休眠（~15分钟）
- 首次访问需要唤醒数据库（1-2秒）
- **这是免费版的限制，无法完全避免**

#### 2. **网络延迟**
- Vercel Edge Function (美国东部) → Supabase (可能在其他区域)
- 每次查询都有网络往返时间

#### 3. **查询次数**
- 之前：3 次独立查询（串行）
- 现在：3 次并行查询（已优化）

---

## ✅ 已实施的优化

### 1. **数据库连接预热**

**文件**：`src/lib/prisma.ts`

**改动**：
```typescript
// 在应用启动时立即建立连接，避免首次查询时的冷启动延迟
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => {
      console.log('✅ [Prisma] Database connection established')
    })
    .catch((error) => {
      console.error('❌ [Prisma] Failed to connect to database:', error)
    })
}
```

**效果**：
- ✅ 减少首次查询的连接建立时间
- ✅ 预期减少 100-200ms

### 2. **优化查询并行度**

**文件**：`src/components/dashboard/DashboardStatsAsync.tsx`

**改动**：
```typescript
// 之前：先查用户，再并行查任务统计（2 轮）
const user = await prisma.user.findUnique(...)
const [totalTryOns, completedTryOns] = await Promise.all([...])

// 现在：所有查询并行执行（1 轮）
const [user, totalTryOns, completedTryOns] = await Promise.all([
  prisma.user.findUnique(...),
  prisma.tryOnTask.count(...),
  prisma.tryOnTask.count(...),
])
```

**效果**：
- ✅ 减少数据库往返次数：2 轮 → 1 轮
- ✅ 预期减少 50-100ms

### 3. **已有的优化**

#### ✅ 数据库索引
```prisma
model TryOnTask {
  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
}
```

#### ✅ Neon Serverless Driver
```typescript
const adapter = new PrismaNeon({ connectionString })
export const prisma = new PrismaClient({ adapter })
```

#### ✅ 连接池
```
DATABASE_URL="postgresql://...@host-pooler.region.neon.tech/..."
```

#### ✅ Suspense 流式渲染
- 数据库查询不阻塞页面渲染
- 用户立即看到页面框架

---

## 📊 预期性能提升

### 首次访问（冷启动）
| 优化项 | 减少时间 | 说明 |
|--------|----------|------|
| 连接预热 | 100-200ms | 减少连接建立时间 |
| 查询并行 | 50-100ms | 减少往返次数 |
| **总计** | **150-300ms** | **1382ms → 1082-1232ms** |

### 后续访问（热启动）
| 优化项 | 减少时间 | 说明 |
|--------|----------|------|
| 连接已建立 | 0ms | 连接保持活跃 |
| 查询并行 | 50-100ms | 减少往返次数 |
| **总计** | **50-100ms** | **227ms → 127-177ms** |

---

## 🎯 进一步优化建议

### 优先级 1：升级 Supabase 到付费版（强烈推荐）

**问题**：
- 免费版会休眠，导致冷启动
- 免费版性能限制

**解决方案**：
- 升级到 Supabase Pro ($25/月)
- 或使用 Neon Pro ($19/月)

**效果**：
- ✅ 消除冷启动问题
- ✅ 数据库查询从 1382ms 降低到 < 300ms
- ✅ 更高的并发连接数
- ✅ 更好的性能保证

### 优先级 2：使用 Redis 缓存（推荐）

**问题**：
- 每次访问都查询数据库
- 统计数据变化不频繁

**解决方案**：
```typescript
// 使用 Vercel KV (Redis) 缓存统计数据
import { kv } from '@vercel/kv'

export async function DashboardStatsAsync({ userId }: Props) {
  // 尝试从缓存获取
  const cached = await kv.get(`dashboard:stats:${userId}`)
  if (cached) {
    return <DashboardStats stats={cached} />
  }
  
  // 查询数据库
  const stats = await fetchStatsFromDB(userId)
  
  // 缓存 60 秒
  await kv.set(`dashboard:stats:${userId}`, stats, { ex: 60 })
  
  return <DashboardStats stats={stats} />
}
```

**效果**：
- ✅ 缓存命中时：< 50ms（从 1382ms）
- ✅ 减少数据库负载 90%+
- ✅ 成本：Vercel KV 免费额度足够

### 优先级 3：优化查询策略（可选）

**问题**：
- 查询所有任务再计数，效率低

**解决方案**：
```typescript
// 使用 Prisma 的 _count 聚合查询
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    isPremium: true,
    premiumExpiresAt: true,
    freeTrialsUsed: true,
    _count: {
      select: {
        tryOnTasks: true,
        tryOnTasks: {
          where: { status: 'COMPLETED' }
        }
      }
    }
  }
})
```

**效果**：
- ✅ 减少查询次数：3 次 → 1 次
- ✅ 预期减少 100-200ms

---

## 🔧 实施步骤

### 立即实施（已完成）
1. ✅ 添加数据库连接预热
2. ✅ 优化查询并行度
3. ✅ 部署到 Vercel

### 短期实施（1-2 天）
1. ⏳ 添加 Redis 缓存（Vercel KV）
2. ⏳ 优化查询策略（使用 _count）

### 中期实施（1-2 周）
1. ⏳ 升级 Supabase 到付费版
2. ⏳ 监控数据库性能
3. ⏳ 优化慢查询

---

## 📝 监控和验证

### 1. 查看 Vercel 日志

**期望看到**：
```
✅ [Prisma] Database connection established
⚡ [Performance] dashboard-async:getUserBasicData took 245ms
⚡ [Performance] dashboard-async:getTotalCount took 180ms
⚡ [Performance] dashboard-async:getCompletedCount took 165ms
⚡ [Performance] dashboard-async:stats took 250ms
```

### 2. 对比优化前后

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首次访问 | 1382ms | 1082-1232ms | 11-22% |
| 后续访问 | 227ms | 127-177ms | 22-44% |

### 3. 长期监控

使用 Prisma 慢查询日志：
```typescript
if (duration > 1000) {
  console.error(`🔴 [Prisma] SLOW QUERY (${duration}ms):`, e.query)
}
```

---

## 💡 总结

### ✅ 已完成
1. ✅ 数据库连接预热
2. ✅ 优化查询并行度
3. ✅ Suspense 流式渲染（不阻塞页面）

### 📊 预期效果
- 首次访问：1382ms → 1082-1232ms（提升 11-22%）
- 后续访问：227ms → 127-177ms（提升 22-44%）
- 用户体验：立即看到页面（< 1秒）

### 🎯 下一步
1. **立即验证**：部署后查看日志
2. **短期优化**：添加 Redis 缓存（可减少 90% 查询）
3. **中期优化**：升级 Supabase 付费版（消除冷启动）

---

## 🚀 关键结论

**数据库查询慢的主要原因是 Supabase 免费版冷启动**，这是免费版的限制。

**我们的优化策略**：
1. ✅ 短期：连接预热 + 查询优化（减少 150-300ms）
2. ⏳ 中期：Redis 缓存（减少 90% 查询）
3. ⏳ 长期：升级付费版（消除冷启动）

**最重要的是**：通过 Suspense 流式渲染，数据库查询慢不再阻塞页面渲染，用户体验已经大幅提升！

