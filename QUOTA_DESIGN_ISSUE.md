# Try-On 配额设计问题分析

> **文档说明**: 本文档从**设计角度**分析配额系统的根本问题。
>
> 如需了解**实现修复方案**，请参考 `QUOTA_CALCULATION_FIX.md`。
>
> **关系**: 设计问题 → 实现问题 → 修复方案

---

## 🔴 核心问题概览

系统中存在 **4 个核心问题**，根本原因是三个配额来源的设计**不一致**：

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 1 | JWT Token 计算错误 | `src/lib/auth.ts` | 年费用户显示 30 而不是 420 |
| 2 | 无法识别订阅类型 | User 表缺字段 | 订阅变更后显示错误 |
| 3 | 页面显示不一致 | Try-On vs Dashboard | 用户困惑 |
| 4 | 进度条不完整 | SubscriptionCard | 只显示 Free，不含 Credits |

---

## 🔴 设计不一致的根本原因

三个配额来源的设计**不一致**，导致后续实现都是错误的：

| 配额来源 | 字段 | 含义 | 问题 |
|---------|------|------|------|
| **Free Trial** | `freeTrialsUsed` | ✅ 已使用次数 | 正确：可以计算剩余 = 3 - freeTrialsUsed |
| **Premium** | `premiumUsageCount` | ✅ 已使用次数 | 正确：可以计算剩余 = quota - premiumUsageCount |
| **Credits Pack** | `creditsBalance` | ❌ **剩余次数** | **错误**：直接是剩余，没有记录总购买量和已使用量 |

---

## 📊 组件显示不一致问题

### 核心原则
**用户视角的剩余总数** = 免费送的剩余 + Pack 购买剩的 + 订阅剩的

```
remainingTotal = freeRemaining + creditsBalance + subscriptionRemaining
```

需要拆开展示时可以拆开，需要汇总时汇总。**进度条应该只显示总的进度条**。

### Try-On Page 问题

**UserStatusBanner** (`src/components/try-on/UserStatusBanner.tsx`):
- ✅ 显示总数: `remainingTrials`（正确）
- ✅ 拆开显示: `(Free: X/3, Credits: Y)`（正确）
- ❌ 但 `remainingTrials` 来自 JWT Token，年费用户显示错误

**TryOnInterface** (`src/components/try-on/TryOnInterface.tsx`):
- ✅ 使用 `remainingTrials` 检查配额（正确）
- ❌ 但基于错误的 JWT Token 值

### Dashboard 问题

**DashboardStatsAsync** (`src/components/dashboard/DashboardStatsAsync.tsx`):
- ✅ 计算正确: `totalRemaining = subscriptionRemaining + creditsBalance`
- ✅ 拆开显示: `Annual (X) + Credits (Y)`（正确）
- ✅ 显示总数: `remainingDisplay`（正确）

**SubscriptionCard** (`src/components/dashboard/SubscriptionCard.tsx`):
- ❌ 只显示免费用户的进度条（基于 `freeTrialsUsed`）
- ❌ 进度条只计算免费额度，没有包含 Credits
- ❌ 显示 `remainingTrials` 但没有拆开显示各部分
- ❌ 没有显示 Premium 用户的进度条

**DashboardStats** (`src/components/dashboard/DashboardStats.tsx`):
- ✅ 显示总数: `remainingDisplay`（正确）
- ✅ 显示描述: `remainingDescription`（正确）

---

## 📊 设计不一致的后果

### Free Trial 和 Premium 的设计
```
总配额 = 固定值（3 或 30/420）
已使用 = freeTrialsUsed 或 premiumUsageCount
剩余 = 总配额 - 已使用
```

### Credits Pack 的设计
```
总配额 = ❌ 未记录
已使用 = ❌ 未记录
剩余 = creditsBalance（直接存储）
```

---

## 🔧 问题导致的实现错误

### 1. 无法追踪 Credits 的使用历史
- 用户购买 10 个 credits，使用 3 个
- 系统只知道 `creditsBalance = 7`
- 无法知道用户购买了多少，使用了多少

### 2. 无法生成准确的使用报告
- Dashboard 无法显示 "Credits: 7/10"
- 只能显示 "Credits: 7"（不知道总数）

### 3. 进度条计算错误
```typescript
// 当前错误的计算
const totalQuota = freeTrialLimit + creditsBalance  // ❌ 混合了不同的概念
const usagePercentage = (freeTrialsUsed / totalQuota) * 100  // ❌ 错误

// 应该是
const freeQuota = 3
const freeUsed = freeTrialsUsed
const creditsPurchased = 10  // ❌ 系统没有记录这个
const creditsUsed = creditsPurchased - creditsBalance  // ❌ 无法计算
```

### 4. 无法处理 Credits 的过期或失效
- 如果要添加 Credits 过期功能，无法实现
- 因为没有记录购买时间和使用时间

---

## ✅ 正确的设计方案

### 方案 A：在 User 表中添加 Credits 追踪字段（推荐）

```sql
ALTER TABLE "User" ADD COLUMN "creditsPurchased" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "creditsUsed" INT DEFAULT 0;

-- creditsBalance = creditsPurchased - creditsUsed
```

**优点**:
- 与 Free Trial 和 Premium 的设计一致
- 可以追踪完整的使用历史
- 支持未来的过期功能

**缺点**:
- 需要数据库迁移
- 需要更新 webhook 逻辑

### 方案 B：在 Payment 表中记录 Credits 的购买和使用

创建 `CreditTransaction` 表：
```sql
CREATE TABLE "CreditTransaction" (
  id TEXT PRIMARY KEY,
  userId TEXT,
  type ENUM('PURCHASE', 'USAGE'),
  amount INT,
  balance INT,  -- 交易后的余额
  createdAt TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

**优点**:
- 完整的审计日志
- 支持复杂的业务逻辑

**缺点**:
- 更复杂
- 查询性能可能受影响

---

## 📋 当前系统的实现现状

### 购买 Credits 时（webhook）
```typescript
// 正确：增加 creditsBalance
await prisma.user.update({
  where: { id: userId },
  data: {
    creditsBalance: {
      increment: QUOTA_CONFIG.CREDITS_PACK  // 增加 10
    }
  }
})
```

### 使用 Credits 时（try-on API）
```typescript
// 错误：直接减少 creditsBalance
if (hasCredits) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      creditsBalance: {
        decrement: 1  // 减少 1
      }
    }
  })
}
```

**问题**：无法区分"购买"和"使用"，只能看到最终的"剩余"

---

## 🎯 建议修复步骤

### 步骤 1：添加数据库字段（方案 A）
```sql
ALTER TABLE "User" ADD COLUMN "creditsPurchased" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "creditsUsed" INT DEFAULT 0;

-- 迁移现有数据
UPDATE "User" 
SET creditsPurchased = creditsBalance,
    creditsUsed = 0
WHERE creditsBalance > 0;
```

### 步骤 2：更新 Webhook
```typescript
// 购买 Credits 时
await prisma.user.update({
  where: { id: userId },
  data: {
    creditsPurchased: {
      increment: QUOTA_CONFIG.CREDITS_PACK
    },
    creditsBalance: {
      increment: QUOTA_CONFIG.CREDITS_PACK  // 同时更新冗余字段
    }
  }
})
```

### 步骤 3：更新 Try-On API
```typescript
// 使用 Credits 时
await prisma.user.update({
  where: { id: userId },
  data: {
    creditsUsed: {
      increment: 1
    },
    creditsBalance: {
      decrement: 1  // 同时更新冗余字段
    }
  }
})
```

### 步骤 4：更新计算公式

**剩余次数计算**（用于显示剩余）:
```typescript
const creditsRemaining = creditsPurchased - creditsUsed
const remainingTotal = freeRemaining + creditsRemaining + subscriptionRemaining
```

**进度条计算**（用于显示使用百分比）:
```typescript
// 免费用户
const totalQuota = freeTrialLimit + creditsPurchased  // 总额度
const totalUsed = freeTrialsUsed + creditsUsed  // 总使用
const usagePercentage = (totalUsed / totalQuota) * 100

// Premium 用户
const totalQuota = subscriptionQuota + creditsPurchased  // 总额度
const totalUsed = premiumUsageCount + creditsUsed  // 总使用
const usagePercentage = (totalUsed / totalQuota) * 100
```

**关键点**：
- ✅ 剩余计算用 `creditsPurchased - creditsUsed`
- ✅ 进度条分子用 `creditsUsed`（已使用）
- ✅ 进度条分母用 `creditsPurchased`（总购买）
- ❌ 进度条分母不能用 `creditsBalance`（那是剩余的）

### 步骤 5：更新所有显示逻辑
- Dashboard 进度条（使用正确的公式）
- Try-On Page 显示（使用 `remainingTotal`）
- Pricing Page 显示（使用 `remainingTotal`）
- 所有计算公式（区分"剩余"和"进度条"）

---

## 📊 修复前后对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 用户购买 10 个 credits | `creditsBalance = 10` | `creditsPurchased = 10, creditsUsed = 0` |
| 用户使用 3 个 credits | `creditsBalance = 7` | `creditsPurchased = 10, creditsUsed = 3` |
| 显示使用情况 | ❌ 无法显示 "7/10" | ✅ 可以显示 "7/10" |
| 生成报告 | ❌ 无法追踪 | ✅ 完整的审计日志 |

---

## ⚠️ 重要提示

这是一个**根本的设计问题**，不修复的话：
- ❌ 所有后续的配额计算都会不一致
- ❌ 无法生成准确的使用报告
- ❌ 无法支持 Credits 过期等功能
- ❌ 用户体验会很差（无法看到 "7/10"）

**建议立即修复**，否则技术债会越来越大。

---

## 📋 修复优先级

1. **高**: 设计问题修复（方案 A）- 修复 Credits 追踪设计
2. **高**: 实现修复（步骤 1-3）- 修复 JWT Token 计算
3. **高**: 实现修复（步骤 4-5）- 确保前端一致性
4. **中**: 实现修复（步骤 6）- 防止 Premium 用户无限使用
5. **中**: 组件修复 - SubscriptionCard 改进用户体验

**注意**: 设计问题和实现修复是两个独立的工作流，可以并行进行。详见 QUOTA_CALCULATION_FIX.md 中的具体实现步骤。

---

## 🧪 验收标准

- [ ] 年费用户: 所有页面显示 420
- [ ] 月费用户: 所有页面显示 30
- [ ] 免费用户: 所有页面显示 3
- [ ] 进度条: 包含 Free + Credits 的总进度
- [ ] 拆开显示: 各部分清晰可见
- [ ] Premium 进度条: 正确显示

