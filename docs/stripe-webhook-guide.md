# Stripe Webhook 回调处理指南

## 📋 概述

本文档详细说明了 VisuTry 项目如何处理 Stripe 支付成功后的回调（Webhook），以及如何验证用户支付信息是否正确更新。

---

## 🔄 Webhook 工作流程

### 1. 支付流程

```
用户点击支付按钮
    ↓
创建 Checkout Session (API: /api/payment/create-session)
    ↓
跳转到 Stripe Checkout 页面
    ↓
用户完成支付
    ↓
Stripe 发送 Webhook 到服务器 (API: /api/payment/webhook)
    ↓
服务器处理 Webhook 并更新数据库
    ↓
用户跳转回 Success 页面
```

### 2. Webhook 端点

**URL**: `/api/payment/webhook`  
**文件**: `src/app/api/payment/webhook/route.ts`  
**方法**: POST

---

## 📊 处理的 Webhook 事件

### 事件 1: `checkout.session.completed`

**触发时机**: 用户完成支付后

**处理逻辑**:
1. 提取支付数据（用户ID、金额、产品类型等）
2. 创建支付记录到 `Payment` 表
3. 如果是积分包，增加用户的试戴次数（减少 `freeTrialsUsed`）

**代码位置**: `handleCheckoutSessionCompleted()` 函数

**数据库更新**:
```sql
-- 创建支付记录
INSERT INTO Payment (userId, stripeSessionId, amount, productType, status)
VALUES (...)

-- 如果是积分包，更新用户试戴次数
UPDATE User 
SET freeTrialsUsed = freeTrialsUsed - 20 
WHERE id = ?
```

---

### 事件 2: `customer.subscription.created`

**触发时机**: 订阅创建成功后（月度/年度订阅）

**处理逻辑**:
1. 提取订阅数据（用户ID、过期时间等）
2. 更新用户的高级会员状态

**代码位置**: `handleSubscriptionCreatedEvent()` 函数

**数据库更新**:
```sql
UPDATE User 
SET isPremium = true, 
    premiumExpiresAt = ?
WHERE id = ?
```

---

### 事件 3: `customer.subscription.updated`

**触发时机**: 订阅状态更新时（续费、取消等）

**处理逻辑**:
1. 检查订阅状态（active/canceled/past_due等）
2. 更新用户的高级会员状态

**代码位置**: `handleSubscriptionUpdatedEvent()` 函数

**数据库更新**:
```sql
UPDATE User 
SET isPremium = ?, 
    premiumExpiresAt = ?
WHERE id = ?
```

---

### 事件 4: `customer.subscription.deleted`

**触发时机**: 订阅被删除/取消时

**处理逻辑**:
1. 取消用户的高级会员状态

**代码位置**: `handleSubscriptionDeletedEvent()` 函数

**数据库更新**:
```sql
UPDATE User 
SET isPremium = false, 
    premiumExpiresAt = NULL
WHERE id = ?
```

---

### 事件 5: `invoice.payment_succeeded`

**触发时机**: 订阅续费成功时

**处理逻辑**:
1. 记录日志
2. 可以添加通知用户的逻辑

---

### 事件 6: `invoice.payment_failed`

**触发时机**: 订阅续费失败时

**处理逻辑**:
1. 记录日志
2. 可以添加通知用户的逻辑

---

## 🗄️ 数据库表结构

### User 表

```prisma
model User {
  id               String    @id @default(cuid())
  name             String?
  email            String?   @unique
  
  // 支付相关字段
  freeTrialsUsed   Int       @default(0)      // 已使用的免费试戴次数
  isPremium        Boolean   @default(false)  // 是否是高级会员
  premiumExpiresAt DateTime?                  // 高级会员过期时间
  
  payments         Payment[]                  // 支付记录
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### Payment 表

```prisma
model Payment {
  id              String        @id @default(cuid())
  userId          String
  stripeSessionId String        @unique
  stripePaymentId String?       @unique
  
  amount          Int           // 金额（分）
  currency        String        @default("usd")
  status          PaymentStatus @default(PENDING)
  
  productType     ProductType   // PREMIUM_MONTHLY | PREMIUM_YEARLY | CREDITS_PACK
  description     String?
  
  user            User          @relation(fields: [userId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

---

## 🧪 如何验证 Webhook 是否正常工作

### 方法 1: 检查数据库（推荐）

#### 1.1 查看支付记录

```sql
-- 查看所有支付记录
SELECT * FROM Payment ORDER BY createdAt DESC;

-- 查看特定用户的支付记录
SELECT * FROM Payment WHERE userId = 'your-user-id';
```

#### 1.2 查看用户状态

```sql
-- 查看用户的高级会员状态
SELECT id, name, email, isPremium, premiumExpiresAt, freeTrialsUsed 
FROM User 
WHERE id = 'your-user-id';
```

---

### 方法 2: 使用 Prisma Studio

```bash
# 启动 Prisma Studio
npx prisma studio
```

然后在浏览器中查看：
- **Payment** 表 - 查看支付记录
- **User** 表 - 查看用户的 `isPremium` 和 `premiumExpiresAt` 字段

---

### 方法 3: 查看 Stripe Dashboard

1. 访问: https://dashboard.stripe.com/test/webhooks
2. 查看 Webhook 事件列表
3. 点击具体事件查看详情
4. 检查响应状态（应该是 200 OK）

---

### 方法 4: 查看服务器日志

在开发服务器的终端中，你应该看到类似的日志：

```
Payment completed for user cmgj1ii6h0000ti1h35uxukv7
Subscription created for user cmgj1ii6h0000ti1h35uxukv7
```

---

## ⚙️ 本地测试 Webhook

### 问题：本地开发环境无法接收 Webhook

Stripe 无法直接向 `localhost` 发送 Webhook，因为它不是公网可访问的地址。

### 解决方案 1: 使用 Stripe CLI（推荐）

#### 1. 安装 Stripe CLI

**Windows**:
```bash
# 使用 Scoop
scoop install stripe

# 或下载安装包
# https://github.com/stripe/stripe-cli/releases
```

**Mac**:
```bash
brew install stripe/stripe-cli/stripe
```

#### 2. 登录 Stripe

```bash
stripe login
```

#### 3. 转发 Webhook 到本地

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

这会输出一个 Webhook 签名密钥，类似：
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

#### 4. 更新 .env.local

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### 5. 重启开发服务器

```bash
npm run dev
```

#### 6. 触发测试事件

在另一个终端窗口：

```bash
# 测试支付成功事件
stripe trigger checkout.session.completed

# 测试订阅创建事件
stripe trigger customer.subscription.created
```

---

### 解决方案 2: 使用 ngrok

#### 1. 安装 ngrok

访问: https://ngrok.com/download

#### 2. 启动 ngrok

```bash
ngrok http 3000
```

#### 3. 配置 Stripe Webhook

1. 复制 ngrok 提供的公网 URL（例如: `https://abc123.ngrok.io`）
2. 访问: https://dashboard.stripe.com/test/webhooks
3. 点击 "Add endpoint"
4. 输入 URL: `https://abc123.ngrok.io/api/payment/webhook`
5. 选择要监听的事件
6. 复制 Webhook 签名密钥
7. 更新 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET`

---

## 🔍 验证你的支付是否成功处理

根据你的截图，你已经完成了 3 笔支付：
- $2.99 - Credits Pack
- $99.99 - Yearly Subscription
- $9.99 - Monthly Subscription

### 验证步骤：

#### 1. 检查数据库中的支付记录

```bash
# 启动 Prisma Studio
npx prisma studio
```

在 **Payment** 表中，你应该看到 3 条记录：
- 金额: 299, 9999, 999 (分)
- 产品类型: CREDITS_PACK, PREMIUM_YEARLY, PREMIUM_MONTHLY
- 状态: COMPLETED

#### 2. 检查用户状态

在 **User** 表中，查找你的用户（email: franksunye@hotmail.com）：

**预期结果**:
- `isPremium`: `true` （因为你购买了订阅）
- `premiumExpiresAt`: 应该有一个未来的日期
- `freeTrialsUsed`: 应该减少了 20（如果 Webhook 正确处理了积分包）

#### 3. 检查 Stripe Dashboard 中的 Webhook

访问: https://dashboard.stripe.com/test/webhooks

查看是否有 Webhook 事件被发送，以及响应状态。

---

## ⚠️ 当前状态分析

### 可能的情况：

#### 情况 1: Webhook 未配置（最可能）

**症状**: 
- 支付成功
- Stripe Dashboard 显示支付记录
- 但数据库中没有更新

**原因**: 
- 本地开发环境无法接收 Stripe Webhook
- 没有配置 `STRIPE_WEBHOOK_SECRET`

**解决方案**: 
使用 Stripe CLI 或 ngrok（见上文）

---

#### 情况 2: Webhook 配置错误

**症状**:
- Webhook 被发送
- 但返回错误（400/500）

**检查**:
1. `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 是否正确
2. 服务器日志中是否有错误信息

---

#### 情况 3: Webhook 正常工作

**症状**:
- 数据库中有支付记录
- 用户状态已更新

**验证**:
使用 Prisma Studio 或 SQL 查询确认

---

## 📝 Success 页面处理

你在 backlog 中提到的问题：

> 当前是在测试页面进行的测试，http://localhost:3000/test-stripe，测试支付后，返回的页面是 http://localhost:3000/success，这个在正式项目中是否得到了正确的处理？

### 当前状态

测试页面使用的 Success URL:
```javascript
successUrl: `${window.location.origin}/success`
```

### 需要创建的页面

你需要创建一个 Success 页面来处理支付成功后的跳转：

**文件**: `src/app/success/page.tsx`

这个页面应该：
1. 显示支付成功的消息
2. 显示订单详情
3. 提供返回主页或仪表板的链接
4. 可选：从 URL 参数中获取 session_id 并显示详情

---

## 🎯 下一步行动

### 立即执行：

1. **验证数据库更新**
   ```bash
   npx prisma studio
   ```
   检查 Payment 和 User 表

2. **设置本地 Webhook 测试**
   ```bash
   # 安装 Stripe CLI
   stripe login
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```

3. **创建 Success 页面**
   创建 `src/app/success/page.tsx`

4. **创建 Cancel 页面**
   创建 `src/app/cancel/page.tsx`

---

## 📚 相关文档

- [Stripe Webhook 文档](https://stripe.com/docs/webhooks)
- [Stripe CLI 文档](https://stripe.com/docs/stripe-cli)
- [测试 Webhook](https://stripe.com/docs/webhooks/test)

---

**文档版本**: 1.0  
**最后更新**: 2025-10-11

