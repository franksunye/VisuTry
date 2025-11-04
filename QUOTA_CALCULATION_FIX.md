# Try-On 剩余次数计算 - 现状、问题和修复方案

## 📍 当前显示位置

1. **Try-On Page** - UserStatusBanner + TryOnInterface
2. **Pricing Page** - Banner
3. **Dashboard** - DashboardStatsAsync + SubscriptionCard
4. **Payments Page** - getSubscriptionQuotaLabel

---

## 📐 正确的计算公式

### Free Users
```
remainingTrials = (3 - freeTrialsUsed) + creditsBalance
```

### Premium Users (Monthly/Yearly)
```
subscriptionQuota = 30 (Monthly) or 420 (Yearly)
remainingTrials = (subscriptionQuota - premiumUsageCount) + creditsBalance
```

---

## 🔴 当前问题

### 问题 1: JWT Token 中的计算错误
**位置**: `src/lib/auth.ts` 第 199-211 行

**当前代码**:
```typescript
if (token.isPremiumActive) {
  const conservativeQuota = QUOTA_CONFIG.MONTHLY_SUBSCRIPTION  // ❌ 总是 30
  const subscriptionRemaining = Math.max(0, conservativeQuota - (dbUser.premiumUsageCount || 0))
  token.remainingTrials = subscriptionRemaining + creditsRemaining
}
```

**问题**: 年费用户显示 30（应该 420）

**影响**: Try-On Page、Pricing Page 显示错误

---

### 问题 2: 无法识别当前订阅类型
**原因**: User 表中没有 `currentSubscriptionType` 字段

**场景**: 用户订阅年费 → 取消 → 订阅月费
- 系统无法判断当前是月费还是年费
- Payment 表中有多条记录，无法确定哪个是活跃的

---

### 问题 3: 页面显示不一致

| 页面 | 数据源 | 年费用户 | 月费用户 |
|------|--------|--------|--------|
| Try-On Page | JWT Token | ❌ 30 | ✅ 30 |
| Pricing Page | JWT Token | ❌ 30 | ✅ 30 |
| Dashboard | Payment 表 | ✅ 420 | ✅ 30 |
| Payments Page | Payment 表 | ✅ 420 | ✅ 30 |

---

### 问题 4: Try-On API 没有检查 Premium 用户配额
**位置**: `src/app/api/try-on/route.ts` 第 92-103 行

**问题**: 只检查免费用户，Premium 用户可以无限使用

---

## ✅ 修复方案

### 步骤 1: 数据库迁移
```sql
ALTER TABLE "User" ADD COLUMN "currentSubscriptionType" VARCHAR(50);
```

### 步骤 2: 更新 Webhook
**文件**: `src/app/api/payment/webhook/route.ts`

```typescript
// handleSubscriptionCreatedEvent
await prisma.user.update({
  where: { id: subscriptionData.userId },
  data: {
    isPremium: true,
    premiumExpiresAt: subscriptionData.expiresAt,
    currentSubscriptionType: subscriptionData.productType,  // ✅ 新增
  }
})

// handleSubscriptionDeletedEvent
await prisma.user.update({
  where: { id: subscriptionData.userId },
  data: {
    isPremium: false,
    premiumExpiresAt: null,
    currentSubscriptionType: null,  // ✅ 清除
  }
})
```

### 步骤 3: 修复 JWT Token
**文件**: `src/lib/auth.ts` 第 199-211 行

```typescript
if (token.isPremiumActive && dbUser.currentSubscriptionType) {
  const quota = dbUser.currentSubscriptionType === 'PREMIUM_YEARLY' 
    ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION 
    : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
  const subscriptionRemaining = Math.max(0, quota - (dbUser.premiumUsageCount || 0))
  const creditsRemaining = dbUser.creditsBalance || 0
  token.remainingTrials = subscriptionRemaining + creditsRemaining
  token.subscriptionType = dbUser.currentSubscriptionType  // ✅ 新增
} else {
  // 免费用户
  const freeRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - dbUser.freeTrialsUsed)
  const creditsRemaining = dbUser.creditsBalance || 0
  token.remainingTrials = freeRemaining + creditsRemaining
}
```

### 步骤 4: 更新类型定义
**文件**: `types/next-auth.d.ts`

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      // ... 现有字段
      subscriptionType?: string | null  // ✅ 新增
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // ... 现有字段
    subscriptionType?: string | null  // ✅ 新增
  }
}
```

### 步骤 5: 更新前端组件
**文件**: `src/components/try-on/UserStatusBanner.tsx`

使用 `session.user.subscriptionType` 计算正确的配额

**文件**: `src/app/[locale]/(main)/pricing/page.tsx`

同上

### 步骤 6: 添加 Premium 用户配额检查
**文件**: `src/app/api/try-on/route.ts` 第 92-103 行

```typescript
if (isPremiumActive && user.currentSubscriptionType) {
  const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY' ? 420 : 30
  const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
  const creditsRemaining = user.creditsBalance || 0
  const totalRemaining = subscriptionRemaining + creditsRemaining
  
  if (totalRemaining <= 0) {
    return NextResponse.json(
      { success: false, error: "No remaining quota" },
      { status: 403 }
    )
  }
} else if (!isPremiumActive) {
  // 现有的免费用户检查
  const freeRemaining = Math.max(0, freeTrialLimit - user.freeTrialsUsed)
  const creditsRemaining = user.creditsBalance || 0
  const totalRemaining = freeRemaining + creditsRemaining
  
  if (totalRemaining <= 0) {
    return NextResponse.json(
      { success: false, error: "No remaining quota" },
      { status: 403 }
    )
  }
}
```

---

## 📊 修复效果

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 年费用户显示 | ❌ 30 | ✅ 420 |
| 月费用户显示 | ✅ 30 | ✅ 30 |
| 页面一致性 | ❌ 不一致 | ✅ 一致 |
| 订阅变更处理 | ❌ 错误 | ✅ 正确 |
| Premium 配额检查 | ❌ 无检查 | ✅ 有检查 |

---

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

### 修复方案

#### Try-On Page
1. 修复 JWT Token 中的 `remainingTrials` 计算（见前面的步骤 3）
2. UserStatusBanner 和 TryOnInterface 会自动正确

#### Dashboard
1. **SubscriptionCard** - 修改免费用户的进度条显示:
```typescript
// 修改前：只计算免费额度
const usagePercentage = ((user.freeTrialsUsed || 0) / freeTrialLimit) * 100

// 修改后：计算总的使用百分比
const totalQuota = freeTrialLimit + (user.creditsBalance || 0)
const totalUsed = (user.freeTrialsUsed || 0)
const usagePercentage = totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0
```

2. **SubscriptionCard** - 修改显示文本:
```typescript
// 修改前：只显示免费额度
{remainingTrials} free try-ons remaining

// 修改后：显示总的剩余次数和拆开的详情
{remainingTrials} try-ons remaining
{creditsBalance > 0 && (
  <p className="text-xs text-gray-500">
    Free: {Math.max(0, freeTrialLimit - freeTrialsUsed)}, Credits: {creditsBalance}
  </p>
)}
```

3. **SubscriptionCard** - Premium 用户也应该显示进度条（包含 Credits）:

首先，更新 User 接口添加 `creditsBalance` 和 `premiumUsageCount`:
```typescript
interface User {
  id: string
  name?: string | null
  isPremium?: boolean
  premiumExpiresAt?: Date | null
  freeTrialsUsed?: number
  isPremiumActive?: boolean
  remainingTrials?: number
  subscriptionType?: string | null
  isYearlySubscription?: boolean
  creditsBalance?: number  // ✅ 新增
  premiumUsageCount?: number  // ✅ 新增
}
```

然后，添加 Premium 用户的进度条（包含 Credits）:
```typescript
if (user.isPremiumActive) {
  const quota = user.isYearlySubscription ? 420 : 30
  const creditsBalance = user.creditsBalance || 0
  const totalQuota = quota + creditsBalance
  const usagePercentage = totalQuota > 0
    ? ((user.premiumUsageCount || 0) / totalQuota) * 100
    : 0

  // 显示进度条
  // 显示文本：{remainingTrials} try-ons remaining
  // 拆开显示：Subscription: {subscriptionRemaining}, Credits: {creditsBalance}
}
```

**数据可用性**: `creditsBalance` 和 `premiumUsageCount` 已经在 `session.user` 中可用（来自 JWT Token），通过 `userForCard` 传入 SubscriptionCard。

---

## 🧪 测试清单

- [ ] 年费用户: 所有页面显示 420
- [ ] 月费用户: 所有页面显示 30
- [ ] 免费用户: 所有页面显示 3
- [ ] 订阅变更: 年费 → 月费，显示正确更新
- [ ] 订阅取消: 显示为免费用户
- [ ] Try-On API: Premium 用户配额检查生效
- [ ] Dashboard 进度条: 包含 Free + Credits 的总进度
- [ ] Dashboard 进度条: Premium 用户也显示进度条
- [ ] 拆开显示: 各部分（Free/Credits/Subscription）清晰可见

