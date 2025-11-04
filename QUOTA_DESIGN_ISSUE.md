# Try-On 配额设计问题分析

## 🔴 核心问题

三个配额来源的设计**不一致**，导致后续实现都是错误的：

| 配额来源 | 字段 | 含义 | 问题 |
|---------|------|------|------|
| **Free Trial** | `freeTrialsUsed` | ✅ 已使用次数 | 正确：可以计算剩余 = 3 - freeTrialsUsed |
| **Premium** | `premiumUsageCount` | ✅ 已使用次数 | 正确：可以计算剩余 = quota - premiumUsageCount |
| **Credits Pack** | `creditsBalance` | ❌ **剩余次数** | **错误**：直接是剩余，没有记录总购买量和已使用量 |

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
    }
  }
})
```

### 步骤 4：更新计算公式
```typescript
const creditsRemaining = creditsPurchased - creditsUsed
const remainingTotal = freeRemaining + creditsRemaining + subscriptionRemaining
```

### 步骤 5：更新所有显示逻辑
- Dashboard 进度条
- Try-On Page 显示
- Pricing Page 显示
- 所有计算公式

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

