# 定价配置设计方案

> **设计原则**: 简洁、实用、低风险
> 
> **目标**: 解决硬编码问题，提升可维护性，不引入复杂性

---

## 一、问题现状

### 1.1 硬编码位置汇总

| 文件 | 硬编码内容 | 行号 |
|------|-----------|------|
| `src/lib/stripe.ts` | 价格: 899, 8999, 299<br>额度: 30, 420, 10 | 21, 29, 37 |
| `src/app/pricing/page.tsx` | 价格: $2.99, $8.99, $89.99<br>额度: 10, 30, 420 | 44, 61, 80, 47, 64, 84 |
| `src/app/payments/page.tsx` | 额度: 3, 30, 420 | 49, 52, 56 |
| `src/components/dashboard/DashboardStatsAsync.tsx` | 额度: 3 | 83 |
| `src/app/api/payment/webhook/route.ts` | 额度: 10 | 105 |
| `src/lib/auth.ts` | 额度: 3 | 175 |

### 1.2 核心问题

1. **维护成本高**: 修改价格需要改 6+ 个文件
2. **一致性风险**: 容易出现不同文件数值不一致
3. **测试困难**: 无法快速切换测试配置
4. **扩展性差**: 添加新套餐需要大量修改

---

## 二、设计方案

### 2.1 方案选择

**推荐方案**: 配置文件集中化（环境变量 + 配置文件）

**理由**:
- ✅ 实施简单，2-3天完成
- ✅ 风险极低，不影响现有功能
- ✅ 不需要数据库迁移
- ✅ 支持环境变量覆盖
- ✅ 易于版本控制和回滚

**不推荐**: 数据库配置化
- ❌ 复杂度高，需要 1-2 周
- ❌ 需要数据库迁移
- ❌ 需要管理后台
- ❌ 对于简单工具产品过度设计

### 2.2 架构设计

```
┌─────────────────────────────────────────────────────┐
│                  环境变量 (.env)                      │
│  FREE_TRIAL_LIMIT, MONTHLY_QUOTA, YEARLY_QUOTA...   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│            配置文件 (src/config/pricing.ts)          │
│  - QUOTA_CONFIG: 额度配置                            │
│  - PRICE_CONFIG: 价格配置                            │
│  - PRODUCT_METADATA: 产品元数据                      │
│  - 辅助函数: 计算、格式化                             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                  业务代码                             │
│  stripe.ts, pricing/page.tsx, webhook/route.ts...  │
└─────────────────────────────────────────────────────┘
```

### 2.3 配置文件结构

**文件**: `src/config/pricing.ts`

```typescript
// 1️⃣ 额度配置 - 从环境变量读取，提供默认值
export const QUOTA_CONFIG = {
  FREE_TRIAL: parseInt(process.env.FREE_TRIAL_LIMIT || "3"),
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_QUOTA || "30"),
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_QUOTA || "420"),
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_AMOUNT || "10"),
} as const

// 2️⃣ 价格配置 - 单位：美分
export const PRICE_CONFIG = {
  MONTHLY_SUBSCRIPTION: parseInt(process.env.MONTHLY_PRICE || "899"),
  YEARLY_SUBSCRIPTION: parseInt(process.env.YEARLY_PRICE || "8999"),
  CREDITS_PACK: parseInt(process.env.CREDITS_PACK_PRICE || "299"),
} as const

// 3️⃣ 产品元数据 - 集中管理所有产品信息
export const PRODUCT_METADATA = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    name: "Standard - Monthly",
    quota: QUOTA_CONFIG.MONTHLY_SUBSCRIPTION,
    price: PRICE_CONFIG.MONTHLY_SUBSCRIPTION,
    currency: "usd",
    interval: "month" as const,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month`,
      "High-quality image processing",
      "Priority processing queue",
      // ... 其他功能
    ],
  },
  // PREMIUM_YEARLY, CREDITS_PACK 类似
} as const

// 4️⃣ 辅助函数 - 统一计算逻辑
export function calculateRemainingQuota(
  isPremiumActive: boolean,
  subscriptionType: 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | null,
  freeTrialsUsed: number,
  creditsBalance: number
) {
  // 统一的额度计算逻辑
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
```

### 2.4 环境变量配置

**文件**: `.env.example`

```bash
# 现有配置...

# ========== 定价配置 ==========
# 免费试用额度
FREE_TRIAL_LIMIT=3

# 订阅额度
MONTHLY_QUOTA=30
YEARLY_QUOTA=420

# 充值包额度
CREDITS_PACK_AMOUNT=10

# 价格（单位：美分）
MONTHLY_PRICE=899      # $8.99
YEARLY_PRICE=8999      # $89.99
CREDITS_PACK_PRICE=299 # $2.99
```

---

## 三、实施计划

### 3.1 实施步骤

#### 第一步：创建配置文件（30分钟）
- [ ] 创建 `src/config/pricing.ts`
- [ ] 定义 QUOTA_CONFIG, PRICE_CONFIG, PRODUCT_METADATA
- [ ] 实现辅助函数

#### 第二步：更新环境变量（10分钟）
- [ ] 更新 `.env.example`
- [ ] 更新本地 `.env`
- [ ] 更新 Vercel 环境变量

#### 第三步：重构业务代码（2-3小时）
- [ ] `src/lib/stripe.ts` - 使用 PRODUCT_METADATA
- [ ] `src/app/pricing/page.tsx` - 使用 PRODUCT_METADATA
- [ ] `src/app/payments/page.tsx` - 使用 calculateRemainingQuota
- [ ] `src/components/dashboard/DashboardStatsAsync.tsx` - 使用 QUOTA_CONFIG
- [ ] `src/app/api/payment/webhook/route.ts` - 使用 QUOTA_CONFIG
- [ ] `src/lib/auth.ts` - 使用 QUOTA_CONFIG

#### 第四步：测试验证（1-2小时）
- [ ] 本地测试所有支付流程
- [ ] 测试额度计算逻辑
- [ ] 测试环境变量覆盖
- [ ] 回归测试现有功能

#### 第五步：部署上线（30分钟）
- [ ] 部署到测试环境
- [ ] 验证测试环境
- [ ] 部署到生产环境
- [ ] 验证生产环境

**总工作量**: 1个工作日

### 3.2 风险评估

| 风险 | 等级 | 影响 | 缓解措施 |
|------|------|------|---------|
| 配置读取错误 | 低 | 应用启动失败 | 提供默认值，添加启动检查 |
| 计算逻辑错误 | 中 | 额度显示错误 | 充分测试，保持向后兼容 |
| 环境变量缺失 | 低 | 使用默认值 | 文档说明，部署检查 |
| 部署后不一致 | 低 | 显示错误 | 部署前验证环境变量 |

**总体风险**: 🟢 低

### 3.3 回滚方案

如果出现问题，可以快速回滚：
1. Git revert 代码变更
2. 重新部署上一个版本
3. 预计回滚时间：5-10分钟

---

## 四、代码示例

### 4.1 重构前 vs 重构后

#### 示例 1: stripe.ts

**重构前**:
```typescript
export const PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: "Standard - Monthly",
    description: "30 AI try-ons per month + Standard features",
    price: 899, // 硬编码
    // ...
  },
}
```

**重构后**:
```typescript
import { PRODUCT_METADATA } from '@/config/pricing'

export const PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: PRODUCT_METADATA.PREMIUM_MONTHLY.name,
    description: `${PRODUCT_METADATA.PREMIUM_MONTHLY.quota} AI try-ons per month + Standard features`,
    price: PRODUCT_METADATA.PREMIUM_MONTHLY.price,
    // ...
  },
}
```

#### 示例 2: webhook/route.ts

**重构前**:
```typescript
if (paymentData.productType === "CREDITS_PACK") {
  await prisma.user.update({
    data: {
      creditsBalance: { increment: 10 } // 硬编码
    }
  })
}
```

**重构后**:
```typescript
import { QUOTA_CONFIG } from '@/config/pricing'

if (paymentData.productType === "CREDITS_PACK") {
  await prisma.user.update({
    data: {
      creditsBalance: { increment: QUOTA_CONFIG.CREDITS_PACK }
    }
  })
}
```

---

## 五、测试清单

### 5.1 功能测试
- [ ] 购买月度订阅，验证额度正确
- [ ] 购买年度订阅，验证额度正确
- [ ] 购买充值包，验证额度正确
- [ ] 免费用户额度显示正确
- [ ] 价格页面显示正确
- [ ] 支付页面显示正确
- [ ] Dashboard 额度显示正确

### 5.2 配置测试
- [ ] 修改环境变量，验证配置生效
- [ ] 缺失环境变量，验证使用默认值
- [ ] 无效环境变量，验证错误处理

### 5.3 回归测试
- [ ] 现有支付流程正常
- [ ] 现有额度计算正常
- [ ] 现有用户数据不受影响

---

## 六、后续优化建议

### 6.1 短期（1-3个月）
- 添加配置验证函数，启动时检查配置有效性
- 添加单元测试，覆盖配置和计算逻辑
- 添加配置文档，说明每个配置项的含义

### 6.2 中期（3-6个月）
- 观察配置修改频率
- 评估是否需要更灵活的配置方式
- 收集用户反馈

### 6.3 长期（6个月+）
**仅在以下情况考虑数据库配置化**:
- 价格调整频率 > 每月2次
- 需要 A/B 测试定价
- 需要多地区定价
- 需要运营人员自主配置

---

## 七、决策建议

### ✅ 推荐立即实施

**理由**:
1. **风险可控**: 不改变业务逻辑，只是重构配置
2. **收益明显**: 立即解决维护痛点
3. **工作量小**: 1个工作日完成
4. **易于回滚**: 出问题可快速恢复

### ⏸️ 暂不推荐

**数据库配置化**: 对于当前简单工具产品过度设计

### 📋 实施前确认

- [ ] 团队成员理解方案
- [ ] 确认测试环境可用
- [ ] 确认有足够时间测试
- [ ] 确认生产环境变量访问权限

---

## 八、总结

这是一个**简洁、实用、低风险**的重构方案：

- 🎯 **聚焦**: 只解决硬编码问题，不引入额外复杂性
- 🛡️ **安全**: 风险低，易回滚
- ⚡ **高效**: 1天完成，立即见效
- 🔧 **灵活**: 支持环境变量覆盖，易于测试
- 📈 **可扩展**: 为未来需求预留空间

**建议**: 先实施此方案，观察 3-6 个月，根据实际需求决定是否需要更复杂的配置系统。

