# 支付记录描述国际化修复

## 问题描述

支付记录的 `description` 字段仍然使用硬编码的中文描述，而不是使用统一的价格配置：

**问题示例**：
```
Credits Pack (10 credits)
Completed
试戴次数包 - 20次  ← 中文描述，且数量错误（应该是10不是20）
```

## 根本原因

在 `src/app/api/payment/webhook/route.ts` 中，`getProductDescription` 函数使用了硬编码的中文描述：

```typescript
function getProductDescription(productType: ProductType): string {
  switch (productType) {
    case "PREMIUM_MONTHLY":
      return "高级会员 - 月付"
    case "PREMIUM_YEARLY":
      return "高级会员 - 年付"
    case "CREDITS_PACK":
      return "试戴次数包 - 20次"  // ❌ 硬编码中文，且数量错误
    default:
      return "未知产品"
  }
}
```

这违反了我们在 `PRICING_CONFIG_REFACTORING.md` 中定义的设计原则：
> 所有硬编码的价格和额度都从配置文件读取

## 解决方案

### 修改前
```typescript
// 硬编码的中文描述
function getProductDescription(productType: ProductType): string {
  switch (productType) {
    case "PREMIUM_MONTHLY":
      return "高级会员 - 月付"
    case "PREMIUM_YEARLY":
      return "高级会员 - 年付"
    case "CREDITS_PACK":
      return "试戴次数包 - 20次"
    default:
      return "未知产品"
  }
}
```

### 修改后

**步骤1：在配置中添加 `paymentDescription` 字段**
```typescript
// src/config/pricing.ts
export const PRODUCT_METADATA = {
  PREMIUM_MONTHLY: {
    // ... 其他字段
    paymentDescription: `${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION} AI try-ons per month + Standard features`,
  },
  PREMIUM_YEARLY: {
    // ... 其他字段
    paymentDescription: `${QUOTA_CONFIG.YEARLY_SUBSCRIPTION} AI try-ons per year (360 + 60 bonus) + Standard features`,
  },
  CREDITS_PACK: {
    // ... 其他字段
    paymentDescription: `Get ${QUOTA_CONFIG.CREDITS_PACK} AI try-on credits (never expire)`,
  },
}
```

**步骤2：使用 `paymentDescription` 字段**
```typescript
import { QUOTA_CONFIG, PRODUCT_METADATA } from "@/config/pricing"

// 🔥 使用统一的价格配置，确保描述与产品元数据一致
function getProductDescription(productType: ProductType): string {
  const product = PRODUCT_METADATA[productType]
  if (!product) {
    return "Unknown Product"
  }

  // 使用专门为支付记录设计的详细描述
  return product.paymentDescription
}
```

## 新的描述格式

| 产品类型 | 旧描述（中文） | 新描述（英文，友好详细） |
|---------|--------------|----------------------|
| PREMIUM_MONTHLY | 高级会员 - 月付 | **30 AI try-ons per month + Standard features** |
| PREMIUM_YEARLY | 高级会员 - 年付 | **420 AI try-ons per year (360 + 60 bonus) + Standard features** |
| CREDITS_PACK | 试戴次数包 - 20次 | **Get 10 AI try-on credits (never expire)** |

## 优势

1. **用户友好**：描述清晰易懂，突出产品价值
   - Credits Pack: "Get 10 AI try-on credits (never expire)" - 强调永不过期
   - Monthly: "30 AI try-ons per month + Standard features" - 明确配额和功能
   - Yearly: "420 AI try-ons per year (360 + 60 bonus) + Standard features" - 突出奖励
2. **国际化**：使用英文描述，符合国际化标准
3. **数据一致性**：从 `PRODUCT_METADATA` 读取，确保与产品配置一致
4. **动态更新**：配额变化时自动更新描述，无需修改代码
5. **类型安全**：利用 TypeScript 类型系统，避免拼写错误
6. **可维护性**：单一数据源，易于维护

## 数据流

```
PRODUCT_METADATA (配置文件)
    ↓
getProductDescription (webhook)
    ↓
Payment.description (数据库)
    ↓
Payments页面显示
```

## 测试验证

运行测试脚本：
```bash
npx tsx scripts/test-payment-description.ts
```

输出：
```
✅ PREMIUM_MONTHLY: "30 AI try-ons per month + Standard features"
✅ PREMIUM_YEARLY: "420 AI try-ons per year (360 + 60 bonus) + Standard features"
✅ CREDITS_PACK: "Get 10 AI try-on credits (never expire)"
```

## 影响范围

### 新支付记录
- ✅ 所有新的支付记录将使用英文描述
- ✅ 描述格式统一：`产品名称 (配额 credits)`

### 历史支付记录
- ⚠️ 已存在的支付记录保持不变（数据库中的旧记录）
- 💡 如需更新历史记录，可运行数据迁移脚本（可选）

## 相关文件

| 文件 | 修改内容 |
|------|---------|
| `src/app/api/payment/webhook/route.ts` | 更新 `getProductDescription` 函数 |
| `scripts/test-payment-description.ts` | 新增测试脚本 |
| `docs/PAYMENT_DESCRIPTION_FIX.md` | 本文档 |

## 配置文件位置

所有产品元数据定义在：
- `src/config/pricing.ts` - `PRODUCT_METADATA` 对象

## 后续建议

### 可选：更新历史支付记录

如果需要更新数据库中的历史支付记录，可以创建迁移脚本：

```typescript
// scripts/migrate-payment-descriptions.ts
import { PrismaClient } from '@prisma/client'
import { PRODUCT_METADATA, ProductType } from '../src/config/pricing'

const prisma = new PrismaClient()

async function main() {
  const payments = await prisma.payment.findMany()
  
  for (const payment of payments) {
    const productType = payment.productType as ProductType
    const product = PRODUCT_METADATA[productType]
    
    if (product) {
      const newDescription = `${product.name} (${product.quota} credits)`
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { description: newDescription }
      })
      
      console.log(`Updated payment ${payment.id}: ${newDescription}`)
    }
  }
}

main()
```

### 国际化支持

未来如需支持多语言，可以扩展配置：

```typescript
export const PRODUCT_METADATA = {
  CREDITS_PACK: {
    // ... existing fields
    i18n: {
      en: "Credits Pack (10 credits)",
      zh: "次数包 (10次)",
      ja: "クレジットパック (10クレジット)"
    }
  }
}
```

## 总结

通过使用统一的价格配置系统，我们确保了：
1. ✅ 支付记录描述使用英文
2. ✅ 描述内容与产品配置一致
3. ✅ 配额数量准确（10 credits，不是20）
4. ✅ 易于维护和扩展

