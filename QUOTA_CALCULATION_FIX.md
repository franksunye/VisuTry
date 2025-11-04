# Try-On 剩余次数计算 - 现状、问题和修复方案

> **文档说明**: 本文档从**实现角度**分析配额系统的当前问题和修复方案。
>
> 如需了解**设计问题的根本原因**，请参考 `QUOTA_DESIGN_ISSUE.md`。
>
> **关系**: 设计问题 → 实现问题 → 修复方案

---

## 📍 当前显示位置

1. **Try-On Page** - UserStatusBanner + TryOnInterface
2. **Pricing Page** - Banner
3. **Dashboard** - DashboardStatsAsync + SubscriptionCard
4. **Payments Page** - getSubscriptionQuotaLabel

---

## 📐 正确的计算公式

### 剩余次数计算（用于显示剩余）

**Free Users**:
```typescript
remainingTrials = (3 - freeTrialsUsed) + (creditsPurchased - creditsUsed)
```

**Premium Users (Monthly/Yearly)**:
```typescript
subscriptionQuota = 30 (Monthly) or 420 (Yearly)
remainingTrials = (subscriptionQuota - premiumUsageCount) + (creditsPurchased - creditsUsed)
```

**设计一致性**：
- Free Trial: `3 - freeTrialsUsed` ✅
- Premium: `quota - premiumUsageCount` ✅
- Credits: `creditsPurchased - creditsUsed` ✅ 统一的"总 - 已使用"模式

### 进度条计算（用于显示使用百分比）

详见下面的 "SubscriptionCard 修复方案" 部分，使用 `creditsPurchased` 和 `creditsUsed`。

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

## 📊 组件修复详情

### Try-On Page 修复

**UserStatusBanner** (`src/components/try-on/UserStatusBanner.tsx`):
- ✅ 显示总数: `remainingTrials`（逻辑正确）
- ✅ 拆开显示: `(Free: X/3, Credits: Y)`（逻辑正确）
- ❌ **问题**: `remainingTrials` 来自 JWT Token，年费用户显示错误（30 而不是 420）

**TryOnInterface** (`src/components/try-on/TryOnInterface.tsx`):
- ✅ 使用 `remainingTrials` 检查配额（逻辑正确）
- ❌ **问题**: 基于错误的 JWT Token 值

**修复方案**: 修复 JWT Token 中的 `remainingTrials` 计算（见步骤 3），UserStatusBanner 和 TryOnInterface 会自动正确。

---

### Dashboard 修复

**DashboardStatsAsync** (`src/components/dashboard/DashboardStatsAsync.tsx`):
- ✅ 计算正确: `totalRemaining = subscriptionRemaining + creditsBalance`
- ✅ 拆开显示: `Annual (X) + Credits (Y)`（正确）
- ✅ 显示总数: `remainingDisplay`（正确）

**DashboardStats** (`src/components/dashboard/DashboardStats.tsx`):
- ✅ 显示总数: `remainingDisplay`（正确）
- ✅ 显示描述: `remainingDescription`（正确）

**SubscriptionCard** (`src/components/dashboard/SubscriptionCard.tsx`) - 需要修复：
- ❌ 只显示免费用户的进度条（基于 `freeTrialsUsed`）
- ❌ 进度条只计算免费额度，没有包含 Credits
- ❌ 显示 `remainingTrials` 但没有拆开显示各部分
- ❌ 没有显示 Premium 用户的进度条

---

## 🔧 SubscriptionCard 修复方案

### 问题 1: 免费用户进度条不含 Credits

**修改前**:
```typescript
const usagePercentage = ((user.freeTrialsUsed || 0) / freeTrialLimit) * 100
```

**修改后** (正确的计算方式):
```typescript
// 总额度 = 免费额度 + 购买的credits总数
const totalQuota = freeTrialLimit + (user.creditsPurchased || 0)
// 总使用 = 已用免费次数 + 已用credits
const totalUsed = (user.freeTrialsUsed || 0) + (user.creditsUsed || 0)
const usagePercentage = totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0
```

**关键点**:
- 分子（已使用）= `freeTrialsUsed + creditsUsed`
- 分母（总额度）= `freeTrialLimit + creditsPurchased`
- ❌ 不能用 `creditsBalance`（那是剩余的，不是总的）

### 问题 2: 显示文本不拆开

**修改前**:
```typescript
{remainingTrials} free try-ons remaining
```

**修改后**:
```typescript
const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)
{remainingTrials} try-ons remaining
{creditsRemaining > 0 && (
  <p className="text-xs text-gray-500">
    Free: {Math.max(0, freeTrialLimit - freeTrialsUsed)}, Credits: {creditsRemaining}
  </p>
)}
```

### 问题 3: Premium 用户无进度条 + 不含 Credits

首先，更新 User 接口添加 Credits 追踪字段和 `premiumUsageCount`:
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
  // Credits 追踪字段
  creditsPurchased?: number  // ✅ 购买的总数
  creditsUsed?: number  // ✅ 已使用的数量
  // Premium 追踪字段
  premiumUsageCount?: number  // ✅ 已使用的订阅次数
}
```

**说明**：删除 `creditsBalance`，所有计算都用 `creditsPurchased - creditsUsed`。

然后，添加 Premium 用户的进度条（包含 Credits）:
```typescript
if (user.isPremiumActive) {
  const subscriptionQuota = user.isYearlySubscription ? 420 : 30
  // 总额度 = 订阅额度 + 购买的credits总数
  const totalQuota = subscriptionQuota + (user.creditsPurchased || 0)
  // 总使用 = 已用订阅次数 + 已用credits
  const totalUsed = (user.premiumUsageCount || 0) + (user.creditsUsed || 0)
  const usagePercentage = totalQuota > 0
    ? (totalUsed / totalQuota) * 100
    : 0

  // 显示进度条
  // 显示文本：{remainingTrials} try-ons remaining
  // 拆开显示：Subscription: {subscriptionRemaining}, Credits: {creditsBalance}
}
```

**关键点**:
- 分子（已使用）= `premiumUsageCount + creditsUsed`
- 分母（总额度）= `subscriptionQuota + creditsPurchased`
- ❌ 不能用 `creditsBalance`（那是剩余的，不是总的）

**数据可用性**: `creditsBalance` 和 `premiumUsageCount` 已经在 `session.user` 中可用（来自 JWT Token），通过 `userForCard` 传入 SubscriptionCard。

---

## 📋 修复优先级

1. **高**: 步骤 1-3（修复 JWT Token）- 影响所有页面
2. **高**: 步骤 4-5（前端组件）- 确保一致性
3. **中**: 步骤 6（API 检查）- 防止无限使用
4. **中**: SubscriptionCard 修复 - 改进用户体验

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

---

## 🧪 验收标准

- [ ] 年费用户: 所有页面显示 420
- [ ] 月费用户: 所有页面显示 30
- [ ] 免费用户: 所有页面显示 3
- [ ] 进度条: 包含 Free + Credits 的总进度
- [ ] 拆开显示: 各部分清晰可见
- [ ] Premium 进度条: 正确显示

