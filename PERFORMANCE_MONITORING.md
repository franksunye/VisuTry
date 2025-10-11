# 性能监控指南

本文档说明如何使用新增的性能日志来定位 Dashboard 页面加载慢的问题。

## 🎯 监控目标

我们在以下关键位置添加了性能日志：

### 1. **Dashboard 页面** (`src/app/dashboard/page.tsx`)

监控的操作：
- ✅ `dashboard:page-start` - 页面开始加载
- ✅ `dashboard:getSession` - 获取用户 Session（NextAuth）
- ✅ `dashboard:session-validated` - Session 验证完成
- ✅ `dashboard:db-queries` - 数据库查询总时间
  - `dashboard:db:getUserBasicData` - 获取用户基本信息（缓存）
  - `dashboard:db:getUserTasks` - 获取用户任务列表（不缓存）
  - `dashboard:db:exactTaskCount` - 精确任务计数（仅当任务 > 50 时）
  - `dashboard:db:exactCompletedCount` - 精确完成数计数（仅当任务 > 50 时）
- ✅ `dashboard:data-processing` - 数据处理时间
- ✅ `dashboard:compute-stats` - 统计计算时间
- ✅ `dashboard:rendering-start` - 开始渲染

### 2. **NextAuth 认证** (`src/lib/auth.ts`)

监控的操作：
- ✅ `auth:session-callback` - Session callback 执行时间
- ✅ `auth:jwt-callback` - JWT callback 执行时间
- ✅ `auth:jwt:db-sync` - JWT 中的数据库同步（仅在特定情况下）

### 3. **Prisma 数据库查询** (`src/lib/prisma.ts`)

监控的操作：
- ✅ 所有 Prisma 查询都会记录执行时间
- ✅ 慢查询会自动标记（> 200ms）

## 📊 日志级别说明

我们使用颜色编码的日志级别来快速识别性能问题：

| 符号 | 级别 | 耗时 | 说明 |
|------|------|------|------|
| ⚡ | DEBUG | < 200ms | 正常速度，无需关注 |
| 🟢 | INFO | 200-500ms | 可接受的速度 |
| 🟡 | WARN | 500-1000ms | 较慢，需要关注 |
| 🔴 | ERROR | > 1000ms | 非常慢，需要立即优化 |

## 🔍 如何在 Vercel 中查看日志

### 方法 1：实时日志（推荐）

1. 访问 Vercel Dashboard：https://vercel.com/
2. 选择你的项目：`VisuTry`
3. 点击顶部导航栏的 **"Logs"** 标签
4. 选择 **"Runtime Logs"**
5. 访问你的 Dashboard 页面：https://visutry.vercel.app/dashboard
6. 在 Vercel Logs 中实时查看性能日志

### 方法 2：部署日志

1. 访问 Vercel Dashboard
2. 选择项目 → **"Deployments"**
3. 点击最新的部署
4. 点击 **"Functions"** 标签
5. 选择相关的 Serverless Function
6. 查看函数执行日志

### 方法 3：使用 Vercel CLI（本地）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 查看实时日志
vercel logs --follow
```

## 📈 日志输出示例

### 正常情况（快速加载）

```
📍 [Performance Mark] dashboard:page-start
⚡ [Performance] dashboard:getSession took 45ms
📍 [Performance Mark] dashboard:session-validated { userId: 'user_123' }
📍 [Performance Mark] dashboard:fetching-user-and-tasks
⚡ [Performance] dashboard:db:getUserBasicData took 12ms { userId: 'user_123', cached: true, success: true }
⚡ [Performance] dashboard:db:getUserTasks took 156ms { userId: 'user_123', cached: false, success: true }
⚡ [Performance] dashboard:db-queries took 168ms { userFound: true, tasksCount: 15 }
⚡ [Performance] dashboard:data-processing took 3ms { totalTryOns: 15, completedTryOns: 10, recentCount: 6 }
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

📍 [Performance Mark] dashboard:rendering-start
```

### 慢速情况（需要优化）

```
📍 [Performance Mark] dashboard:page-start
🟡 [Performance] dashboard:getSession took 650ms
📍 [Performance Mark] dashboard:session-validated { userId: 'user_123' }
📍 [Performance Mark] dashboard:fetching-user-and-tasks
⚡ [Performance] dashboard:db:getUserBasicData took 15ms { userId: 'user_123', cached: true, success: true }
🔴 [Performance] SLOW: dashboard:db:getUserTasks took 2340ms { userId: 'user_123', cached: false, success: true }
🔴 [Performance] SLOW: dashboard:db-queries took 2355ms { userFound: true, tasksCount: 50 }
📍 [Performance Mark] dashboard:need-exact-count
🟡 [Performance] dashboard:db:exactTaskCount took 780ms { userId: 'user_123', success: true }
🟡 [Performance] dashboard:db:exactCompletedCount took 820ms { userId: 'user_123', success: true }
⚡ [Performance] dashboard:data-processing took 5ms { totalTryOns: 125, completedTryOns: 98, recentCount: 6 }
⚡ [Performance] dashboard:compute-stats took 2ms

============================================================
📊 [Page Load Summary] Dashboard
   Total Duration: 4612ms
   Breakdown:
     - Session获取: 650ms (14.1%)
     - 数据库查询: 3955ms (85.8%)
     - 数据处理: 5ms (0.1%)
     - 统计计算: 2ms (0.0%)
============================================================

📍 [Performance Mark] dashboard:rendering-start
```

## 🎯 性能瓶颈分析

根据日志输出，你可以快速定位问题：

### 场景 1：Session 获取慢
```
🟡 [Performance] dashboard:getSession took 650ms
```
**可能原因**：
- NextAuth JWT 验证慢
- 数据库连接问题（如果使用数据库 session）
- 网络延迟

**解决方案**：
- 检查 `auth:jwt-callback` 日志
- 确认使用 JWT 策略而非数据库策略
- 检查 Vercel 区域设置

### 场景 2：数据库查询慢
```
🔴 [Performance] SLOW: dashboard:db:getUserTasks took 2340ms
```
**可能原因**：
- Neon 数据库连接慢
- 查询未优化（缺少索引）
- 数据量过大
- 未使用 Neon Serverless Driver

**解决方案**：
- 确认使用 Neon Serverless Driver（Prisma 6.x + adapter）
- 检查数据库索引
- 减少查询的数据量（limit）
- 使用缓存策略

### 场景 3：Prisma 查询慢
```
🔴 [Prisma] SLOW QUERY (2340ms): SELECT * FROM "TryOnTask" WHERE ...
```
**可能原因**：
- 缺少数据库索引
- 查询条件不优化
- 数据库性能问题

**解决方案**：
- 添加数据库索引
- 优化查询条件
- 使用 `select` 只查询需要的字段

## 🛠️ 优化建议

### 1. 数据库查询优化

如果 `dashboard:db:getUserTasks` 慢：

```typescript
// 优化前
const tasks = await prisma.tryOnTask.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
  take: 50,
})

// 优化后：只查询需要的字段
const tasks = await prisma.tryOnTask.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
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

### 2. 添加数据库索引

在 `prisma/schema.prisma` 中：

```prisma
model TryOnTask {
  // ...
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
}
```

### 3. 使用缓存

对于不常变化的数据，使用 Next.js 缓存：

```typescript
import { unstable_cache } from 'next/cache'

const getCachedTasks = unstable_cache(
  async (userId: string) => {
    return await prisma.tryOnTask.findMany({
      where: { userId },
      take: 6,
    })
  },
  ['user-recent-tasks'],
  { revalidate: 60 }
)
```

## 📝 下一步

1. **部署代码**：推送到 GitHub，触发 Vercel 部署
2. **访问 Dashboard**：https://visutry.vercel.app/dashboard
3. **查看 Vercel Logs**：实时监控性能日志
4. **分析瓶颈**：根据日志定位慢的操作
5. **优化代码**：针对性优化慢的部分
6. **重新部署**：验证优化效果

## 🎉 预期效果

添加性能日志后，你可以：

- ✅ 精确定位哪个操作慢（Session、数据库、计算等）
- ✅ 看到每个操作的具体耗时
- ✅ 快速识别性能瓶颈（红色/黄色警告）
- ✅ 验证优化效果（对比优化前后的日志）
- ✅ 在 Vercel Dashboard 中实时监控

---

**提示**：所有日志都会自动输出到 Vercel 的日志系统，无需额外配置！

