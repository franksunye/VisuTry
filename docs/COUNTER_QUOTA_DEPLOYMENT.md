# 计数器配额系统部署指南

## 📋 概述

我们已经从**时间窗口模式**切换到**计数器模式**来追踪 Premium 用户的配额使用。

### 为什么要改？

**之前的问题**（时间窗口模式）：
- ❌ 月度订阅续费时配额不会重置（严重 bug）
- ❌ 依赖 Payment 表记录，但续费时不创建新记录
- ❌ 性能差（需要统计 TryOnTask 表）
- ❌ 逻辑复杂，难以维护

**现在的方案**（计数器模式）：
- ✅ 简单可靠（业界标准模式）
- ✅ 性能好（直接读取计数器字段）
- ✅ 配额正确重置（在 webhook 中处理）
- ✅ 易于调试和维护

---

## 🔧 技术实现

### 数据库变更

**新增字段**：
```sql
ALTER TABLE "User" ADD COLUMN "premiumUsageCount" INTEGER NOT NULL DEFAULT 0;
```

**字段说明**：
- `premiumUsageCount`: Premium 用户在当前计费周期内的使用次数
- 每次 try-on 时递增
- 订阅续费时重置为 0

### 核心逻辑

#### 1️⃣ Try-On 时递增计数器
```typescript
// src/app/api/try-on/route.ts
if (isPremiumActive) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      premiumUsageCount: { increment: 1 }
    }
  })
}
```

#### 2️⃣ 订阅续费时重置计数器
```typescript
// src/app/api/payment/webhook/route.ts
// 处理 invoice.payment_succeeded 事件
await prisma.user.update({
  where: { id: userId },
  data: {
    premiumUsageCount: 0
  }
})
```

#### 3️⃣ Dashboard 显示剩余配额
```typescript
// src/components/dashboard/DashboardStatsAsync.tsx
const subscriptionRemaining = Math.max(0, QUOTA_CONFIG.MONTHLY_SUBSCRIPTION - premiumUsageCount)
const totalRemaining = subscriptionRemaining + creditsBalance
```

---

## 🚀 部署步骤

### 步骤 1: 部署到 Vercel

代码已经推送到 GitHub，Vercel 会自动部署。

**检查部署状态**：
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 查看最新的部署状态
3. 确认部署成功

### 步骤 2: 运行数据库迁移

**⚠️ 重要**：必须在生产环境运行数据库迁移！

#### 方法 A: 通过 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 链接到项目
vercel link

# 4. 运行迁移
vercel env pull .env.production
npx prisma migrate deploy
```

#### 方法 B: 通过本地连接生产数据库

```bash
# 1. 从 Vercel 获取生产数据库 URL
# Settings -> Environment Variables -> DATABASE_URL

# 2. 临时设置环境变量
export DATABASE_URL="your-production-database-url"
export DIRECT_URL="your-production-direct-url"

# 3. 运行迁移
npx prisma migrate deploy

# 4. 清除环境变量
unset DATABASE_URL
unset DIRECT_URL
```

#### 方法 C: 通过 Supabase Dashboard（最简单）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 运行以下 SQL：

```sql
-- Add premiumUsageCount field to User table
ALTER TABLE "User" ADD COLUMN "premiumUsageCount" INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN "User"."premiumUsageCount" IS 'Premium subscription usage count (resets on billing cycle renewal)';
```

5. 点击 **Run** 执行

### 步骤 3: 验证迁移

运行以下查询确认字段已添加：

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'premiumUsageCount';
```

**预期结果**：
```
column_name         | data_type | column_default
--------------------+-----------+----------------
premiumUsageCount   | integer   | 0
```

### 步骤 4: 测试功能

#### 测试 1: 免费用户
1. 使用免费账号登录
2. 进行 1 次 try-on
3. 检查 Dashboard 显示：剩余 2 次（3 - 1）

#### 测试 2: Premium 用户（如果有）
1. 使用 Premium 账号登录
2. 进行 1 次 try-on
3. 检查 Dashboard 显示：剩余配额正确递减

#### 测试 3: 数据库检查
```sql
-- 查看用户的配额使用情况
SELECT 
  id,
  email,
  isPremium,
  freeTrialsUsed,
  premiumUsageCount,
  creditsBalance
FROM "User"
WHERE email = 'your-test-email@example.com';
```

---

## 📊 监控和验证

### 关键指标

1. **配额计数器正确性**
   - 免费用户：`freeTrialsUsed` 递增
   - Premium 用户：`premiumUsageCount` 递增

2. **续费重置**
   - 订阅续费后 `premiumUsageCount` 应该为 0

3. **Dashboard 显示**
   - 剩余配额 = 总配额 - 使用次数 + Credits 余额

### 监控查询

```sql
-- 查看所有 Premium 用户的配额使用情况
SELECT 
  email,
  isPremium,
  premiumUsageCount,
  creditsBalance,
  premiumExpiresAt
FROM "User"
WHERE isPremium = true
ORDER BY premiumUsageCount DESC
LIMIT 20;

-- 查看配额使用异常的用户（使用次数超过配额）
SELECT 
  email,
  isPremium,
  premiumUsageCount,
  CASE 
    WHEN premiumExpiresAt > NOW() + INTERVAL '6 months' THEN 'YEARLY'
    ELSE 'MONTHLY'
  END as subscription_type
FROM "User"
WHERE isPremium = true 
  AND (
    (premiumExpiresAt > NOW() + INTERVAL '6 months' AND premiumUsageCount > 420) OR
    (premiumExpiresAt <= NOW() + INTERVAL '6 months' AND premiumUsageCount > 30)
  );
```

---

## 🔄 回滚方案

如果出现问题，可以快速回滚：

### 步骤 1: 回滚代码

```bash
# 回滚到上一个版本
git revert HEAD
git push origin main
```

### 步骤 2: 回滚数据库（可选）

如果需要删除 `premiumUsageCount` 字段：

```sql
ALTER TABLE "User" DROP COLUMN "premiumUsageCount";
```

**注意**：通常不需要回滚数据库，因为新字段不会影响旧代码。

---

## ⚠️ 注意事项

### 1. 现有 Premium 用户

- 现有 Premium 用户的 `premiumUsageCount` 初始值为 0
- 这意味着他们会获得完整的配额（即使之前已经使用过）
- 这是**有意的设计**，作为对现有用户的小福利

### 2. 订阅续费

- 确保 Stripe webhook 正确配置
- `invoice.payment_succeeded` 事件必须能够触发
- 测试续费流程，确认配额重置

### 3. Credits Pack

- Credits Pack 的逻辑不变
- 仍然使用 `creditsBalance` 字段
- 永不过期

### 4. 免费用户

- 免费用户逻辑不变
- 仍然使用 `freeTrialsUsed` 字段

---

## 📝 常见问题

### Q1: 为什么现有 Premium 用户的 premiumUsageCount 是 0？

**A**: 这是有意的设计。我们无法准确知道他们在当前计费周期内使用了多少次，所以给他们一个完整的配额作为福利。

### Q2: 如果用户在迁移期间进行 try-on 会怎样？

**A**: 不会有问题。迁移只是添加一个新字段，默认值为 0。旧代码和新代码都能正常工作。

### Q3: 月度订阅和年度订阅的重置逻辑一样吗？

**A**: 是的。两者都在 `invoice.payment_succeeded` 事件中重置 `premiumUsageCount` 为 0。

### Q4: 如果 webhook 失败了怎么办？

**A**: 
- Stripe 会自动重试 webhook
- 可以在 Stripe Dashboard 中手动重新发送事件
- 也可以手动在数据库中重置 `premiumUsageCount`

---

## 🎉 完成确认

部署完成后，请确认：

- [ ] Vercel 部署成功
- [ ] 数据库迁移成功（`premiumUsageCount` 字段存在）
- [ ] 免费用户 try-on 正常，配额正确递减
- [ ] Premium 用户 try-on 正常，配额正确递减
- [ ] Dashboard 显示正确的剩余配额
- [ ] Payments 页面显示正确的配额信息
- [ ] Stripe webhook 配置正确（测试续费场景）

---

## 📞 支持

如果遇到问题：
1. 检查 Vercel 部署日志
2. 检查 Supabase 数据库日志
3. 检查 Stripe webhook 日志
4. 查看本文档的"监控和验证"部分

**紧急回滚**：参考"回滚方案"部分

