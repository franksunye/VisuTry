# Vercel 环境 Webhook 测试指南

## 📋 概述

在 Vercel 生产环境中测试 Stripe Webhook 有两种主要方法：
1. 使用 Stripe Dashboard 发送测试事件
2. 创建真实的测试支付

---

## 方法 1: 使用 Stripe Dashboard 发送测试事件 ⭐ 推荐

### 步骤 1: 找到 "Send test event" 按钮

在你的截图中，右上角有一个 **"Send test event"** 按钮。

### 步骤 2: 点击 "Send test event"

1. 点击右上角的 **"Send test event"** 按钮
2. 会弹出一个对话框，让你选择要发送的事件类型

### 步骤 3: 选择事件类型

选择你想测试的事件，例如：
- `checkout.session.completed` - 支付完成
- `customer.subscription.created` - 订阅创建
- `invoice.payment_succeeded` - 发票支付成功

### 步骤 4: 发送测试事件

1. 选择事件后，点击 **"Send test event"** 按钮
2. Stripe 会向你的 Vercel endpoint 发送一个测试事件
3. 在 "Event deliveries" 标签页查看结果

### 步骤 5: 查看结果

在 "Event deliveries" 部分，你会看到：
- ✅ 绿色勾号 = 成功（200 响应）
- ❌ 红色叉号 = 失败（非 200 响应）
- 响应时间
- 响应状态码

---

## 方法 2: 创建真实的测试支付

### 步骤 1: 访问你的 Vercel 应用

```
https://visu-try-vercel.app/pricing
```

### 步骤 2: 点击支付按钮

选择任意价格方案，点击支付按钮

### 步骤 3: 使用测试卡号完成支付

在 Stripe Checkout 页面使用测试卡号：
- 卡号：`4242 4242 4242 4242`
- 日期：任意未来日期（例如：12/34）
- CVC：任意 3 位数字（例如：123）
- 邮编：任意（例如：12345）

### 步骤 4: 完成支付

完成支付后，Stripe 会自动向你的 Webhook endpoint 发送事件

### 步骤 5: 在 Stripe Dashboard 查看事件

1. 返回 Stripe Dashboard
2. 在 "Event deliveries" 标签页查看新的事件
3. 点击事件查看详细信息

---

## 🔍 如何查看 Webhook 事件详情

### 在 Stripe Dashboard

1. **进入 Webhooks 页面**
   - 访问：https://dashboard.stripe.com/webhooks
   - 点击你的 webhook endpoint（`whimsical-glow`）

2. **查看 Event deliveries**
   - 点击 "Event deliveries" 标签
   - 查看所有发送的事件列表

3. **查看单个事件详情**
   - 点击任意事件
   - 查看：
     - 请求 payload
     - 响应状态码
     - 响应时间
     - 响应 body
     - 重试历史

---

## 🔧 在 Vercel 查看日志

### 方法 1: Vercel Dashboard

1. **访问 Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **选择你的项目**
   - 点击 `VisuTry` 项目

3. **查看 Logs**
   - 点击顶部的 "Logs" 标签
   - 或访问：`https://vercel.com/your-team/visutry/logs`

4. **筛选 Webhook 日志**
   - 在搜索框输入：`/api/payment/webhook`
   - 查看所有 webhook 请求的日志

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 登录
vercel login

# 查看实时日志
vercel logs --follow

# 查看特定部署的日志
vercel logs [deployment-url]
```

---

## 📊 验证 Webhook 是否工作

### 检查清单

1. **Stripe Dashboard 检查**
   - [ ] Event deliveries 显示绿色勾号（200 响应）
   - [ ] 响应时间合理（< 5 秒）
   - [ ] 没有错误信息

2. **Vercel Logs 检查**
   - [ ] 看到 `POST /api/payment/webhook 200` 日志
   - [ ] 看到 "Payment completed for user xxx" 日志
   - [ ] 看到 "Subscription created for user xxx" 日志
   - [ ] 没有错误日志

3. **数据库检查**
   - [ ] Payment 表有新记录
   - [ ] User 表的 isPremium 和 premiumExpiresAt 已更新

---

## 🐛 常见问题排查

### 问题 1: Webhook 返回 401 或 403

**原因**：Webhook 签名验证失败

**解决方案**：
1. 检查 Vercel 环境变量中的 `STRIPE_WEBHOOK_SECRET`
2. 确保使用的是生产环境的 webhook secret（以 `whsec_` 开头）
3. 在 Stripe Dashboard 复制正确的 signing secret

**步骤**：
```bash
# 1. 在 Stripe Dashboard 复制 signing secret
# 2. 在 Vercel Dashboard 设置环境变量
# 3. 重新部署应用
vercel --prod
```

---

### 问题 2: Webhook 返回 500

**原因**：服务器内部错误

**解决方案**：
1. 查看 Vercel Logs 获取详细错误信息
2. 检查数据库连接是否正常
3. 检查代码逻辑是否有错误

**步骤**：
```bash
# 查看 Vercel 日志
vercel logs --follow

# 查找错误信息
# 修复代码后重新部署
vercel --prod
```

---

### 问题 3: Webhook 超时

**原因**：处理时间过长（> 30 秒）

**解决方案**：
1. 优化数据库查询
2. 使用异步处理
3. 减少不必要的操作

---

### 问题 4: 事件重复处理

**原因**：Stripe 会重试失败的事件

**解决方案**：
1. 实现幂等性检查
2. 使用事件 ID 去重
3. 在数据库中记录已处理的事件

**示例代码**：
```typescript
// 在处理事件前检查是否已处理
const existingEvent = await prisma.webhookEvent.findUnique({
  where: { stripeEventId: event.id }
})

if (existingEvent) {
  console.log(`Event ${event.id} already processed`)
  return NextResponse.json({ received: true })
}

// 处理事件...

// 记录已处理的事件
await prisma.webhookEvent.create({
  data: {
    stripeEventId: event.id,
    type: event.type,
    processedAt: new Date()
  }
})
```

---

## 🔐 安全最佳实践

### 1. 始终验证 Webhook 签名

```typescript
import { verifyWebhookSignature } from '@/lib/stripe'

const signature = headers.get('stripe-signature')
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

try {
  const event = verifyWebhookSignature(body, signature, webhookSecret)
  // 处理事件...
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

### 2. 使用环境变量

```bash
# .env.production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 3. 限制 Webhook 来源

在 Vercel 中配置 IP 白名单（可选）：
- Stripe Webhook IP 范围：https://stripe.com/docs/ips

---

## 📝 测试检查清单

### 本地测试（已完成）
- [x] Stripe CLI 安装
- [x] Webhook 转发配置
- [x] 本地测试通过
- [x] 数据库更新验证

### Vercel 测试（待完成）
- [ ] Webhook endpoint 创建
- [ ] Signing secret 配置到 Vercel
- [ ] 发送测试事件
- [ ] 验证事件接收（200 响应）
- [ ] 查看 Vercel 日志
- [ ] 验证数据库更新
- [ ] 真实支付测试
- [ ] 验证 Success/Cancel 页面跳转

---

## 🎯 快速测试步骤

### 立即测试（5 分钟）

1. **在 Stripe Dashboard 点击 "Send test event"**
   - 选择 `checkout.session.completed`
   - 点击发送

2. **查看结果**
   - 检查是否返回 200
   - 查看响应时间

3. **查看 Vercel Logs**
   ```bash
   vercel logs --follow
   ```

4. **验证数据库**
   - 检查 Payment 表
   - 检查 User 表

---

## 📚 相关文档

- [Stripe Webhook 文档](https://stripe.com/docs/webhooks)
- [Stripe 测试事件](https://stripe.com/docs/webhooks/test)
- [Vercel 日志文档](https://vercel.com/docs/observability/logs)
- [Stripe IP 地址](https://stripe.com/docs/ips)

---

## ✅ 成功标志

当你看到以下情况时，说明 Webhook 配置成功：

1. ✅ Stripe Dashboard 显示绿色勾号
2. ✅ 响应时间 < 5 秒
3. ✅ Vercel Logs 显示 200 响应
4. ✅ 数据库有新记录
5. ✅ 用户状态正确更新

---

**现在你可以点击 "Send test event" 按钮开始测试了！** 🚀

