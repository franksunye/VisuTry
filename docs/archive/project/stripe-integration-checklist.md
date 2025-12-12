# Stripe 对接完整性检查清单

## 📋 当前监听的事件

系统当前监听 **6 个 Stripe 事件**：

### ✅ 核心事件（必需）

| 事件 | 用途 | 处理函数 | 状态 |
|------|------|---------|------|
| `checkout.session.completed` | 支付完成（一次性购买 + 订阅首次支付） | `handleCheckoutSessionCompleted` | ✅ 已实现 |
| `customer.subscription.created` | 订阅创建 | `handleSubscriptionCreatedEvent` | ✅ 已实现 |
| `customer.subscription.updated` | 订阅更新（状态/计划变更） | `handleSubscriptionUpdatedEvent` | ✅ 已实现 |
| `customer.subscription.deleted` | 订阅取消/删除 | `handleSubscriptionDeletedEvent` | ✅ 已实现 |
| `invoice.payment_succeeded` | 订阅续费成功 | `handleInvoicePaymentSucceeded` | ⚠️ 有 Bug |
| `invoice.payment_failed` | 订阅续费失败 | `handleInvoicePaymentFailed` | ✅ 已实现 |

---

## 🔍 Stripe Dashboard 检查步骤

### 1. 检查 Webhook 端点

**路径**: Stripe Dashboard → **Developers** → **Webhooks**

**检查项**:
- [ ] Webhook URL: `https://your-domain.com/api/payment/webhook`
- [ ] 状态: **Enabled**
- [ ] 签名密钥已配置到环境变量 `STRIPE_WEBHOOK_SECRET`

### 2. 检查监听的事件

在 Webhook 详情页面，点击 **"Select events"**，确保勾选：

```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

### 3. 检查产品元数据

**路径**: Stripe Dashboard → **Products** → 选择产品 → **Metadata**

每个产品必须包含 `productType` 元数据：

**月费订阅**:
```
Key: productType
Value: PREMIUM_MONTHLY
```

**年费订阅**:
```
Key: productType
Value: PREMIUM_YEARLY
```

**Credits Pack**:
```
Key: productType
Value: CREDITS_PACK
```

### 4. 检查价格 ID

确保环境变量中的价格 ID 与 Stripe Dashboard 中的一致：

```bash
# .env.local
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_xxx
STRIPE_PRICE_CREDITS=price_xxx
```

**验证方法**:
- Stripe Dashboard → **Products** → 选择产品 → 复制 Price ID
- 对比环境变量中的值

---

## 🚨 发现的问题

### 问题 1: `invoice.payment_succeeded` 查询逻辑错误

**位置**: `src/app/api/payment/webhook/route.ts:204-211`

**问题**:
```typescript
const subscription = await prisma.payment.findFirst({
  where: {
    stripeSessionId: invoice.subscription as string,  // ❌ 错误
  }
})
```

**原因**:
- `invoice.subscription` 是 **Stripe Subscription ID** (如 `sub_xxx`)
- `stripeSessionId` 存储的是 **Checkout Session ID** (如 `cs_xxx`)
- 两者不匹配，导致续费时无法重置 `premiumUsageCount`

**影响**:
- ❌ 订阅续费后，`premiumUsageCount` 不会重置
- ❌ 用户在新计费周期仍然看到旧的使用次数

**修复方案**:

需要在 Payment 表中添加 `stripeSubscriptionId` 字段：

```sql
ALTER TABLE "Payment" ADD COLUMN "stripeSubscriptionId" VARCHAR(255);
CREATE INDEX "Payment_stripeSubscriptionId_idx" ON "Payment"("stripeSubscriptionId");
```

然后修改查询逻辑：
```typescript
const subscription = await prisma.payment.findFirst({
  where: {
    stripeSubscriptionId: invoice.subscription as string,
  }
})
```

---

## 📝 完整的订阅生命周期

### 场景 1: 用户首次订阅

1. **用户点击订阅** → 创建 Checkout Session
2. **支付成功** → `checkout.session.completed`
   - 创建 Payment 记录
   - 设置 `isPremium = true`
3. **订阅创建** → `customer.subscription.created`
   - 设置 `currentSubscriptionType`
   - 设置 `premiumExpiresAt`

### 场景 2: 订阅续费

1. **Stripe 自动扣款** → `invoice.payment_succeeded`
   - ⚠️ 应该重置 `premiumUsageCount = 0`
   - ⚠️ 当前有 Bug，无法找到用户

### 场景 3: 订阅取消

1. **用户取消订阅** → `customer.subscription.deleted`
   - 设置 `isPremium = false`
   - 清除 `currentSubscriptionType`
   - 清除 `premiumExpiresAt`

### 场景 4: 续费失败

1. **扣款失败** → `invoice.payment_failed`
   - 当前仅记录日志
   - 建议：发送邮件通知用户

---

## ✅ 测试清单

### 手动测试

使用 Stripe Dashboard 的 **"Send test webhook"** 功能：

- [ ] 测试 `checkout.session.completed`
- [ ] 测试 `customer.subscription.created`
- [ ] 测试 `customer.subscription.updated`
- [ ] 测试 `customer.subscription.deleted`
- [ ] 测试 `invoice.payment_succeeded`
- [ ] 测试 `invoice.payment_failed`

### 端到端测试

使用 Stripe 测试模式：

- [ ] 完成一次月费订阅购买
- [ ] 完成一次年费订阅购买
- [ ] 完成一次 Credits Pack 购买
- [ ] 取消订阅
- [ ] 模拟续费（使用 Stripe CLI）

---

## 🔧 建议的改进

### 1. 添加 Subscription ID 追踪

**数据库迁移**:
```sql
ALTER TABLE "Payment" ADD COLUMN "stripeSubscriptionId" VARCHAR(255);
CREATE INDEX "Payment_stripeSubscriptionId_idx" ON "Payment"("stripeSubscriptionId");
```

**Webhook 更新**:
在 `handleSubscriptionCreatedEvent` 中保存 subscription ID

### 2. 添加更多事件监听（可选）

考虑添加以下事件以提高健壮性：

- `customer.subscription.trial_will_end` - 试用期即将结束
- `customer.subscription.paused` - 订阅暂停
- `customer.subscription.resumed` - 订阅恢复

### 3. 添加 Webhook 重试机制

Stripe 会自动重试失败的 webhook，但建议：
- 记录所有 webhook 事件到数据库
- 添加幂等性检查（避免重复处理）

---

## 📊 监控建议

### Stripe Dashboard 监控

定期检查：
- **Webhooks** → 查看失败的 webhook
- **Logs** → 查看 API 错误

### 应用日志监控

关键日志：
```
✅ Subscription created for user {userId}, type: {type}
✅ Reset premiumUsageCount for user {userId} on subscription renewal
❌ 处理订阅创建事件失败: {error}
```

