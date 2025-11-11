# 配额系统设计与实现

## 📊 核心设计原则

### 统一的"总-已使用"模式

所有配额来源使用相同的设计模式：

| 配额来源 | 总量 | 已使用 | 剩余计算 |
|---------|------|--------|---------|
| Free Trial | 3 | `freeTrialsUsed` | `3 - freeTrialsUsed` |
| Premium Monthly | 30 | `premiumUsageCount` | `30 - premiumUsageCount` |
| Premium Yearly | 420 | `premiumUsageCount` | `420 - premiumUsageCount` |
| Credits Pack | `creditsPurchased` | `creditsUsed` | `creditsPurchased - creditsUsed` |

**关键点**：所有配额都记录"已使用"而非"剩余"，确保可追踪和可审计。

---

## 🗄️ 数据库设计

### User 表关键字段

```sql
-- 免费试用
freeTrialsUsed INT DEFAULT 0

-- Premium 订阅
isPremium BOOLEAN DEFAULT false
premiumExpiresAt TIMESTAMP
premiumUsageCount INT DEFAULT 0
currentSubscriptionType VARCHAR(50)  -- 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'

-- Credits Pack
creditsPurchased INT DEFAULT 0
creditsUsed INT DEFAULT 0
```

### Payment 表关键字段

```sql
stripeSessionId VARCHAR(255) UNIQUE
stripeSubscriptionId VARCHAR(255)  -- 用于订阅续费
productType VARCHAR(50)  -- 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | 'CREDITS_PACK'
```

---

## 🔢 配额计算公式

### 剩余配额计算

```typescript
// 免费用户
const freeRemaining = Math.max(0, 3 - freeTrialsUsed)
const creditsRemaining = creditsPurchased - creditsUsed
const totalRemaining = freeRemaining + creditsRemaining

// Premium 用户
const quota = currentSubscriptionType === 'PREMIUM_YEARLY' ? 420 : 30
const subscriptionRemaining = Math.max(0, quota - premiumUsageCount)
const creditsRemaining = creditsPurchased - creditsUsed
const totalRemaining = subscriptionRemaining + creditsRemaining
```

### 进度条计算

```typescript
// 免费用户
const totalQuota = 3 + creditsPurchased
const totalUsed = freeTrialsUsed + creditsUsed
const usagePercentage = (totalUsed / totalQuota) * 100

// Premium 用户
const totalQuota = quota + creditsPurchased
const totalUsed = premiumUsageCount + creditsUsed
const usagePercentage = (totalUsed / totalQuota) * 100
```

---

## 🔄 配额使用优先级

### 免费用户
1. **Credits** (如果有)
2. Free Trial (3次)

### Premium 用户
1. **订阅配额** (30次/月 或 420次/年)
2. **Credits** (订阅配额用完后)

**实现位置**：`src/app/api/try-on/route.ts`

---

## 🎨 前端显示规范

### 统一显示格式

**场景 1：免费用户（有 Credits）**
```
Try-ons Used: 3 / 13
Free: 1/3, Credits: 2/10
Total: 10 try-ons remaining
```

**场景 2：年费用户（有 Credits）**
```
Try-ons Used: 35 / 440
Annual: 32/420, Credits: 3/20
Total: 405 try-ons remaining
```

### 关键组件

| 组件 | 位置 | 显示内容 |
|------|------|---------|
| **UserStatusBanner** | Try-On 页面 | 总剩余 + 拆开显示 |
| **DashboardStatsAsync** | Dashboard 左侧 | 总剩余数字 + 详细描述 |
| **SubscriptionCard** | Dashboard 右侧 | 进度条 + 详细使用情况 |

---

## 🔐 JWT Token 设计

### Token 中的配额字段

```typescript
interface JWT {
  remainingTrials: number        // 总剩余（所有来源）
  subscriptionType: string | null // 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
  isPremiumActive: boolean
  freeTrialsUsed: number
  premiumUsageCount: number
  creditsPurchased: number
  creditsUsed: number
}
```

### 计算逻辑

**位置**：`src/lib/auth.ts`

```typescript
if (isPremiumActive && currentSubscriptionType) {
  const quota = currentSubscriptionType === 'PREMIUM_YEARLY' ? 420 : 30
  const subscriptionRemaining = Math.max(0, quota - premiumUsageCount)
  const creditsRemaining = creditsPurchased - creditsUsed
  token.remainingTrials = subscriptionRemaining + creditsRemaining
} else {
  const freeRemaining = Math.max(0, 3 - freeTrialsUsed)
  const creditsRemaining = creditsPurchased - creditsUsed
  token.remainingTrials = freeRemaining + creditsRemaining
}
```

---

## 💳 Stripe Webhook 处理

### 订阅创建/更新

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    isPremium: true,
    premiumExpiresAt: expiresAt,
    currentSubscriptionType: productType  // 关键：记录订阅类型
  }
})
```

### 订阅续费（重置配额）

```typescript
// invoice.payment_succeeded 事件
await prisma.user.update({
  where: { id: userId },
  data: {
    premiumUsageCount: 0  // 重置为 0
  }
})
```

### Credits 购买

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    creditsPurchased: { increment: 10 }
  }
})
```

---

## ✅ 配额检查逻辑

**位置**：`src/app/api/try-on/route.ts`

```typescript
if (isPremiumActive && currentSubscriptionType) {
  const quota = currentSubscriptionType === 'PREMIUM_YEARLY' ? 420 : 30
  const subscriptionRemaining = Math.max(0, quota - premiumUsageCount)
  const creditsRemaining = creditsPurchased - creditsUsed

  if (subscriptionRemaining + creditsRemaining <= 0) {
    return error('No remaining quota')
  }
} else {
  const freeRemaining = Math.max(0, 3 - freeTrialsUsed)
  const creditsRemaining = creditsPurchased - creditsUsed

  if (freeRemaining + creditsRemaining <= 0) {
    return error('No remaining quota')
  }
}
```

---

## 🔄 配额使用逻辑

**位置**：`src/app/api/try-on/route.ts`

### 免费用户

```typescript
const creditsRemaining = creditsPurchased - creditsUsed

if (creditsRemaining > 0) {
  // 优先使用 Credits
  await prisma.user.update({
    where: { id: userId },
    data: { creditsUsed: { increment: 1 } }
  })
} else {
  // 使用免费试用
  await prisma.user.update({
    where: { id: userId },
    data: { freeTrialsUsed: { increment: 1 } }
  })
}
```

### Premium 用户

```typescript
const quota = currentSubscriptionType === 'PREMIUM_YEARLY' ? 420 : 30
const subscriptionRemaining = Math.max(0, quota - premiumUsageCount)
const creditsRemaining = creditsPurchased - creditsUsed

if (subscriptionRemaining > 0) {
  // 优先使用订阅配额
  await prisma.user.update({
    where: { id: userId },
    data: { premiumUsageCount: { increment: 1 } }
  })
} else if (creditsRemaining > 0) {
  // 订阅配额用完，使用 Credits
  await prisma.user.update({
    where: { id: userId },
    data: { creditsUsed: { increment: 1 } }
  })
}
```

---

## 🎯 关键要点

### 1. 设计一致性
- ✅ 所有配额使用"总-已使用"模式
- ✅ 可追踪、可审计、可回溯

### 2. 订阅类型识别
- ✅ `currentSubscriptionType` 字段记录当前活跃订阅
- ✅ Webhook 事件同步更新

### 3. 配额计算
- ✅ JWT Token 中计算总剩余
- ✅ 前端组件拆开显示各部分
- ✅ 进度条显示总使用百分比

### 4. 使用优先级
- ✅ 免费用户：Credits → Free Trial
- ✅ Premium 用户：Subscription → Credits

### 5. 续费重置
- ✅ `invoice.payment_succeeded` 事件重置 `premiumUsageCount`
- ✅ 使用 `stripeSubscriptionId` 查询用户

---

## 📚 相关文件

### 核心逻辑
- `src/lib/auth.ts` - JWT Token 计算
- `src/app/api/try-on/route.ts` - 配额检查和使用
- `src/app/api/payment/webhook/route.ts` - Stripe 事件处理

### 前端组件
- `src/components/try-on/UserStatusBanner.tsx`
- `src/components/dashboard/DashboardStatsAsync.tsx`
- `src/components/dashboard/SubscriptionCard.tsx`

### 配置
- `src/config/pricing.ts` - 配额常量定义
- `types/next-auth.d.ts` - 类型定义

### 数据库
- `prisma/schema.prisma` - 数据模型