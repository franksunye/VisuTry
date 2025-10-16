# 充值配置重构技术方案

## 1. 问题分析

### 1.1 当前硬编码问题

经过系统分析，发现以下硬编码问题：

#### 产品配置硬编码
**位置**: `src/lib/stripe.ts`
```typescript
export const PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: "Standard - Monthly",
    description: "30 AI try-ons per month + Standard features",
    price: 899, // 8.99 USD
    currency: "usd",
    interval: "month",
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  },
  PREMIUM_YEARLY: {
    name: "Standard - Annual",
    description: "420 AI try-ons per year (360 + 60 bonus) + Standard features",
    price: 8999, // 89.99 USD
    currency: "usd",
    interval: "year",
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  },
  CREDITS_PACK: {
    name: "Credits Pack",
    description: "Get 10 AI try-on credits (never expire)",
    price: 299, // 2.99 USD
    currency: "usd",
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID,
  },
}
```

#### 前端页面硬编码
**位置**: `src/app/pricing/page.tsx`
- 价格显示: `$2.99`, `$8.99`, `$89.99`
- 次数描述: `10 AI try-ons`, `30 AI try-ons per month`, `420 AI try-ons per year`
- 功能列表完全硬编码

#### 额度计算硬编码
**位置**: 多个文件
- `src/app/payments/page.tsx`: 行49, 52, 56
- `src/components/dashboard/DashboardStatsAsync.tsx`: 行60, 69, 83
- `src/app/api/payment/webhook/route.ts`: 行105
- `src/lib/auth.ts`: 行175

**问题代码示例**:
```typescript
// payments/page.tsx
if (isYearlySubscription) {
  subscriptionQuota = Math.max(0, 420 - user.freeTrialsUsed)  // 硬编码 420
  subscriptionQuotaLabel = `Annual quota (${subscriptionQuota} of 420)`
} else {
  subscriptionQuota = Math.max(0, 30 - user.freeTrialsUsed)   // 硬编码 30
  subscriptionQuotaLabel = `Monthly quota (${subscriptionQuota} of 30)`
}

// webhook/route.ts
if (paymentData.productType === "CREDITS_PACK") {
  await prisma.user.update({
    data: {
      creditsBalance: { increment: 10 }  // 硬编码 10
    }
  })
}
```

### 1.2 问题影响

1. **维护困难**: 修改价格或额度需要改动多个文件
2. **一致性风险**: 容易造成不同位置的数值不一致
3. **扩展性差**: 添加新套餐需要大量代码修改
4. **测试困难**: 无法轻松切换测试配置

---

## 2. 技术方案

### 2.1 方案选择

考虑到项目当前状态（功能相对稳定，不期望频繁引入修改），推荐采用**渐进式重构方案**：

**阶段一（推荐优先实施）**: 配置文件集中化
- 风险: ⭐ 低
- 工作量: ⭐⭐ 小
- 收益: ⭐⭐⭐ 高

**阶段二（可选）**: 数据库配置化
- 风险: ⭐⭐⭐ 中
- 工作量: ⭐⭐⭐⭐ 大
- 收益: ⭐⭐⭐⭐ 很高

### 2.2 阶段一：配置文件集中化（推荐）

#### 2.2.1 方案概述

创建统一的配置文件，将所有硬编码的价格、额度、描述集中管理。

**优点**:
- ✅ 实施简单，风险低
- ✅ 不需要数据库迁移
- ✅ 不影响现有功能
- ✅ 易于版本控制和回滚
- ✅ 支持环境变量覆盖

**缺点**:
- ❌ 修改配置仍需重新部署
- ❌ 不支持运营后台动态修改

#### 2.2.2 实施方案

##### 步骤1: 创建配置文件

**文件**: `src/config/pricing.ts`

```typescript
/**
 * 定价配置
 * 集中管理所有产品的价格、额度、描述
 */

// 产品额度配置
export const QUOTA_CONFIG = {
  FREE_TRIAL: parseInt(process.env.FREE_TRIAL_LIMIT || "3"),
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_QUOTA || "30"),
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_QUOTA || "420"),
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_AMOUNT || "10"),
} as const

// 产品价格配置（单位：美分）
export const PRICE_CONFIG = {
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_PRICE || "899"),    // $8.99
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_PRICE || "8999"),     // $89.99
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_PRICE || "299"),       // $2.99
} as const

// 产品元数据配置
export const PRODUCT_METADATA = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    name: "Standard - Monthly",
    shortName: "Standard",
    description: "Most popular choice",
    quota: QUOTA_CONFIG.MONTHLY_SUBSCRIPTION,
    price: PRICE_CONFIG.MONTHLY_SUBSCRIPTION,
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month`,
      "High-quality image processing",
      "Priority processing queue",
      "Unlimited downloads and sharing",
      "Standard glasses frame library",
      "Priority customer support",
      "Ad-free experience"
    ],
    popular: true,
  },
  PREMIUM_YEARLY: {
    id: "PREMIUM_YEARLY",
    name: "Standard - Annual",
    shortName: "Standard Annual",
    description: "Best value",
    quota: QUOTA_CONFIG.YEARLY_SUBSCRIPTION,
    price: PRICE_CONFIG.YEARLY_SUBSCRIPTION,
    currency: "usd",
    interval: "year" as const,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (360 + 60 bonus)`,
      "High-quality image processing",
      "Priority processing queue",
      "Unlimited downloads and sharing",
      "Standard glasses frame library",
      "Priority customer support",
      "Ad-free experience",
      "Save 2 months + 60 bonus try-ons"
    ],
    popular: false,
  },
  CREDITS_PACK: {
    id: "CREDITS_PACK",
    name: "Credits Pack",
    shortName: "Credits Pack",
    description: "Perfect for occasional users",
    quota: QUOTA_CONFIG.CREDITS_PACK,
    price: PRICE_CONFIG.CREDITS_PACK,
    currency: "usd",
    interval: null,
    priceId: process.env.STRIPE_CREDITS_PACK_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.CREDITS_PACK} AI try-ons`,
      "Credits never expire",
      "High-quality image processing",
      "Unlimited downloads and sharing",
      "Priority customer support"
    ],
    popular: false,
  },
} as const

// 辅助函数：获取产品配额
export function getProductQuota(productType: keyof typeof PRODUCT_METADATA): number {
  return PRODUCT_METADATA[productType].quota
}

// 辅助函数：获取产品价格（美元）
export function getProductPriceInDollars(productType: keyof typeof PRODUCT_METADATA): string {
  const cents = PRODUCT_METADATA[productType].price
  return `$${(cents / 100).toFixed(2)}`
}

// 辅助函数：计算用户剩余额度
export function calculateRemainingQuota(
  isPremiumActive: boolean,
  subscriptionType: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | null,
  freeTrialsUsed: number,
  creditsBalance: number
): {
  subscriptionRemaining: number
  creditsRemaining: number
  totalRemaining: number
  description: string
} {
  let subscriptionRemaining = 0
  let description = ""

  if (isPremiumActive && subscriptionType) {
    const quota = subscriptionType === 'PREMIUM_YEARLY' 
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION 
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    subscriptionRemaining = Math.max(0, quota - freeTrialsUsed)
    description = subscriptionType === 'PREMIUM_YEARLY' ? 'Annual' : 'Monthly'
  } else {
    subscriptionRemaining = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - freeTrialsUsed)
    description = 'Free'
  }

  const totalRemaining = subscriptionRemaining + creditsBalance

  return {
    subscriptionRemaining,
    creditsRemaining: creditsBalance,
    totalRemaining,
    description: creditsBalance > 0
      ? `${description} (${subscriptionRemaining}) + Credits (${creditsBalance})`
      : `${description} Plan`
  }
}
```

##### 步骤2: 更新环境变量配置

**文件**: `.env.example`

```bash
# 现有配置...

# Pricing Configuration
FREE_TRIAL_LIMIT=3
MONTHLY_QUOTA=30
YEARLY_QUOTA=420
CREDITS_PACK_AMOUNT=10

# Prices (in cents)
MONTHLY_PRICE=899      # $8.99
YEARLY_PRICE=8999      # $89.99
CREDITS_PACK_PRICE=299 # $2.99
```

##### 步骤3: 重构现有代码

需要修改的文件清单：

1. ✅ `src/lib/stripe.ts` - 使用 PRODUCT_METADATA
2. ✅ `src/app/pricing/page.tsx` - 使用 PRODUCT_METADATA
3. ✅ `src/app/payments/page.tsx` - 使用 QUOTA_CONFIG 和辅助函数
4. ✅ `src/components/dashboard/DashboardStatsAsync.tsx` - 使用辅助函数
5. ✅ `src/app/api/payment/webhook/route.ts` - 使用 QUOTA_CONFIG
6. ✅ `src/lib/auth.ts` - 使用 QUOTA_CONFIG

#### 2.2.3 实施风险评估

| 风险项 | 风险等级 | 缓解措施 |
|--------|---------|---------|
| 配置读取错误 | 低 | 提供默认值，添加配置验证 |
| 环境变量缺失 | 低 | 使用默认值，添加启动检查 |
| 计算逻辑错误 | 中 | 编写单元测试，保持向后兼容 |
| 部署后配置不一致 | 低 | 部署前验证环境变量 |

#### 2.2.4 测试计划

1. **单元测试**: 测试配置读取和计算函数
2. **集成测试**: 测试支付流程和额度扣减
3. **回归测试**: 确保现有功能不受影响
4. **配置验证**: 测试不同环境变量组合

---

### 2.3 阶段二：数据库配置化（可选）

#### 2.3.1 方案概述

将配置存储到数据库，支持运营后台动态修改。

**适用场景**:
- 需要频繁调整价格策略
- 需要 A/B 测试不同定价
- 需要运营人员自主配置
- 需要支持多地区定价

#### 2.3.2 数据库设计

```prisma
model PricingConfig {
  id          String   @id @default(cuid())
  key         String   @unique  // 配置键，如 "MONTHLY_QUOTA"
  value       String              // 配置值
  type        ConfigType          // 配置类型：NUMBER, STRING, JSON
  description String?             // 配置说明
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([key, isActive])
}

enum ConfigType {
  NUMBER
  STRING
  JSON
}

model Product {
  id          String   @id @default(cuid())
  productType ProductType @unique
  name        String
  description String?
  price       Int                 // 价格（美分）
  currency    String   @default("usd")
  quota       Int                 // 额度
  features    Json                // 功能列表
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([isActive, sortOrder])
}
```

#### 2.3.3 实施步骤

1. 创建数据库表和迁移
2. 创建配置管理 API
3. 创建管理后台界面（可选）
4. 实现配置缓存机制
5. 逐步迁移现有配置

#### 2.3.4 风险评估

| 风险项 | 风险等级 | 缓解措施 |
|--------|---------|---------|
| 数据库迁移失败 | 中 | 充分测试，准备回滚方案 |
| 配置缓存不一致 | 中 | 实现缓存失效机制 |
| 性能影响 | 低 | 使用缓存，减少数据库查询 |
| 配置错误影响业务 | 高 | 添加配置验证，审批流程 |

---

## 3. 推荐实施路径

### 3.1 第一阶段（立即实施）

**目标**: 解决硬编码问题，提升可维护性

**步骤**:
1. 创建 `src/config/pricing.ts` 配置文件
2. 更新 `.env.example` 添加配置项
3. 重构 6 个核心文件
4. 编写单元测试
5. 进行回归测试
6. 部署到测试环境验证
7. 部署到生产环境

**预计工作量**: 2-3 天
**风险等级**: 低

### 3.2 第二阶段（可选，根据需求决定）

**触发条件**:
- 需要频繁调整价格（每月 > 2次）
- 需要运营人员自主配置
- 需要支持多地区定价
- 需要 A/B 测试定价策略

**步骤**:
1. 设计数据库表结构
2. 实现配置管理 API
3. 实现配置缓存机制
4. 创建管理界面（可选）
5. 数据迁移和测试
6. 灰度发布

**预计工作量**: 1-2 周
**风险等级**: 中

---

## 4. 实施检查清单

### 4.1 开发阶段
- [ ] 创建配置文件 `src/config/pricing.ts`
- [ ] 更新环境变量配置
- [ ] 重构 `src/lib/stripe.ts`
- [ ] 重构 `src/app/pricing/page.tsx`
- [ ] 重构 `src/app/payments/page.tsx`
- [ ] 重构 `src/components/dashboard/DashboardStatsAsync.tsx`
- [ ] 重构 `src/app/api/payment/webhook/route.ts`
- [ ] 重构 `src/lib/auth.ts`
- [ ] 编写单元测试
- [ ] 更新文档

### 4.2 测试阶段
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 回归测试通过
- [ ] 配置验证测试
- [ ] 性能测试

### 4.3 部署阶段
- [ ] 更新测试环境环境变量
- [ ] 测试环境验证
- [ ] 更新生产环境环境变量
- [ ] 生产环境部署
- [ ] 生产环境验证
- [ ] 监控告警配置

---

## 5. 总结

本方案采用渐进式重构策略，优先实施低风险、高收益的配置文件集中化方案，解决当前硬编码带来的维护困难和一致性问题。

**核心优势**:
- ✅ 风险可控，不影响现有功能
- ✅ 实施简单，工作量小
- ✅ 立即见效，提升可维护性
- ✅ 为未来扩展预留空间

**建议**:
1. **立即实施阶段一**，解决当前痛点
2. **观察 3-6 个月**，评估是否需要阶段二
3. **根据业务需求**，决定是否实施数据库配置化

