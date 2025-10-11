# 性能日志实施总结

## ✅ 已完成的工作

我已经在关键位置添加了全面的性能监控日志，帮助你在 Vercel 后台精确定位 Dashboard 页面加载慢的问题。

---

## 🎯 监控覆盖范围

### 1. **Dashboard 页面** (`src/app/dashboard/page.tsx`)

添加了以下性能监控点：

```typescript
// ✅ 页面加载开始
perfLogger.mark('dashboard:page-start')

// ✅ Session 获取（NextAuth）
perfLogger.start('dashboard:getSession')
const session = await getServerSession(authOptions)
perfLogger.end('dashboard:getSession')

// ✅ 数据库查询（并行）
perfLogger.measure('dashboard:db:getUserBasicData', ...)  // 用户基本信息（缓存）
perfLogger.measure('dashboard:db:getUserTasks', ...)      // 用户任务列表（不缓存）

// ✅ 额外的计数查询（仅当任务 > 50 时）
perfLogger.measure('dashboard:db:exactTaskCount', ...)
perfLogger.measure('dashboard:db:exactCompletedCount', ...)

// ✅ 数据处理
perfLogger.start('dashboard:data-processing')
// ... 处理逻辑
perfLogger.end('dashboard:data-processing')

// ✅ 统计计算
perfLogger.start('dashboard:compute-stats')
// ... 计算逻辑
perfLogger.end('dashboard:compute-stats')

// ✅ 总体摘要
logPageLoad('Dashboard', totalDuration, breakdown)
```

### 2. **NextAuth 认证** (`src/lib/auth.ts`)

添加了以下性能监控点：

```typescript
// ✅ Session callback
perfLogger.start('auth:session-callback')
// ... session 处理
perfLogger.end('auth:session-callback', { userId })

// ✅ JWT callback
perfLogger.start('auth:jwt-callback')
// ... JWT 处理
perfLogger.end('auth:jwt-callback', { userId, shouldSync, trigger })

// ✅ JWT 数据库同步（仅在特定情况下）
perfLogger.start('auth:jwt:db-sync')
const dbUser = await prisma.user.findUnique(...)
perfLogger.end('auth:jwt:db-sync', { userId, userFound, trigger })
```

### 3. **Prisma 数据库查询** (`src/lib/prisma.ts`)

添加了查询监听器：

```typescript
// ✅ 监听所有 Prisma 查询
prisma.$on('query', (e) => {
  const duration = e.duration
  if (duration > 1000) {
    console.error(`🔴 [Prisma] SLOW QUERY (${duration}ms):`, e.query)
  } else if (duration > 500) {
    console.warn(`🟡 [Prisma] Slow query (${duration}ms):`, e.query)
  } else if (duration > 200) {
    console.info(`🟢 [Prisma] Query (${duration}ms):`, e.query)
  }
})
```

---

## 📊 日志级别说明

| 符号 | 级别 | 耗时 | 说明 |
|------|------|------|------|
| ⚡ | DEBUG | < 200ms | 正常速度 |
| 🟢 | INFO | 200-500ms | 可接受 |
| 🟡 | WARN | 500-1000ms | 较慢，需关注 |
| 🔴 | ERROR | > 1000ms | 很慢，需优化 |

---

## 🔍 如何查看日志

### 方法 1：Vercel Dashboard（推荐）

1. 访问：https://vercel.com/
2. 选择项目：`VisuTry`
3. 点击 **"Logs"** → **"Runtime Logs"**
4. 访问 Dashboard：https://visutry.vercel.app/dashboard
5. 实时查看性能日志

### 方法 2：Vercel CLI

```bash
# 安装 CLI
npm i -g vercel

# 查看实时日志
vercel logs --follow
```

---

## 📈 日志输出示例

### 正常情况（快速）

```
📍 [Performance Mark] dashboard:page-start
⚡ [Performance] dashboard:getSession took 45ms
📍 [Performance Mark] dashboard:session-validated { userId: 'user_123' }
⚡ [Performance] dashboard:db:getUserBasicData took 12ms { cached: true }
⚡ [Performance] dashboard:db:getUserTasks took 156ms { cached: false }
⚡ [Performance] dashboard:db-queries took 168ms { tasksCount: 15 }
⚡ [Performance] dashboard:data-processing took 3ms
⚡ [Performance] dashboard:compute-stats took 1ms

============================================================
📊 [Page Load Summary] Dashboard
   Total Duration: 217ms
   Breakdown:
     - Session获取: 45ms (20.7%)
     - 数据库查询: 168ms (77.4%)
     - 数据处理: 3ms (1.4%)
     - 统计计算: 1ms (0.5%)
============================================================
```

### 慢速情况（需优化）

```
📍 [Performance Mark] dashboard:page-start
🟡 [Performance] dashboard:getSession took 650ms
🔴 [Performance] SLOW: dashboard:db:getUserTasks took 2340ms
🔴 [Performance] SLOW: dashboard:db-queries took 2355ms
🟡 [Performance] dashboard:db:exactTaskCount took 780ms
🟡 [Performance] dashboard:db:exactCompletedCount took 820ms

============================================================
📊 [Page Load Summary] Dashboard
   Total Duration: 4612ms
   Breakdown:
     - Session获取: 650ms (14.1%)
     - 数据库查询: 3955ms (85.8%)  ← 🔴 主要瓶颈！
     - 数据处理: 5ms (0.1%)
     - 统计计算: 2ms (0.0%)
============================================================
```

---

## 🎯 如何定位问题

根据日志输出，你可以快速定位瓶颈：

### 场景 1：Session 获取慢
```
🟡 [Performance] dashboard:getSession took 650ms
```
**查看**：`auth:session-callback` 和 `auth:jwt-callback` 日志  
**可能原因**：JWT 验证慢、数据库连接问题  
**解决方案**：确认使用 JWT 策略、检查 Vercel 区域

### 场景 2：数据库查询慢
```
🔴 [Performance] SLOW: dashboard:db:getUserTasks took 2340ms
```
**查看**：Prisma 查询日志  
**可能原因**：
- 未使用 Neon Serverless Driver
- 缺少数据库索引
- 查询数据量过大

**解决方案**：
- 确认 Prisma 6.x + Neon adapter 已部署
- 添加数据库索引
- 优化查询（使用 `select`）

### 场景 3：Prisma 查询慢
```
🔴 [Prisma] SLOW QUERY (2340ms): SELECT * FROM "TryOnTask" WHERE ...
```
**可能原因**：缺少索引、查询不优化  
**解决方案**：添加索引、优化查询条件

---

## 🛠️ 优化建议

### 1. 添加数据库索引

在 `prisma/schema.prisma` 中：

```prisma
model TryOnTask {
  // ...
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
}
```

然后运行：
```bash
npx prisma migrate dev --name add_performance_indexes
```

### 2. 优化查询

只查询需要的字段：

```typescript
// 优化前
const tasks = await prisma.tryOnTask.findMany({
  where: { userId },
  take: 50,
})

// 优化后
const tasks = await prisma.tryOnTask.findMany({
  where: { userId },
  take: 50,
  select: {
    id: true,
    status: true,
    userImageUrl: true,
    resultImageUrl: true,
    createdAt: true,
  }
})
```

### 3. 使用缓存

对于不常变化的数据：

```typescript
import { unstable_cache } from 'next/cache'

const getCachedData = unstable_cache(
  async (userId: string) => {
    return await prisma.tryOnTask.findMany({ ... })
  },
  ['user-tasks'],
  { revalidate: 60 }
)
```

---

## 📝 下一步行动

1. ✅ **代码已推送**：性能日志已部署到 GitHub
2. ⏳ **等待 Vercel 部署**：约 2-3 分钟
3. 🔍 **访问 Dashboard**：https://visutry.vercel.app/dashboard
4. 📊 **查看 Vercel Logs**：实时监控性能
5. 🎯 **定位瓶颈**：根据日志找出慢的操作
6. 🛠️ **优化代码**：针对性优化
7. ✅ **验证效果**：对比优化前后的日志

---

## 📚 相关文档

- [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md) - 详细的性能监控指南
- [NEON_SETUP.md](./NEON_SETUP.md) - Neon Serverless Driver 配置
- [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md) - Vercel 部署修复说明

---

## 🎉 预期效果

添加性能日志后，你可以：

- ✅ **精确定位**：知道哪个操作慢（Session、数据库、计算等）
- ✅ **量化分析**：看到每个操作的具体耗时和占比
- ✅ **快速识别**：通过颜色编码快速发现问题
- ✅ **验证优化**：对比优化前后的性能提升
- ✅ **实时监控**：在 Vercel Dashboard 中持续监控

---

**提示**：所有日志会自动输出到 Vercel 的日志系统，无需额外配置！现在就去 Vercel Dashboard 查看吧！🚀

