# Stripe Webhook 生产环境设置指南

## 📋 概述

本指南说明如何在生产环境（Vercel 部署后）配置 Stripe Webhook。

---

## 🎯 何时需要在 Stripe Dashboard 设置 Webhook

| 环境 | 是否需要设置 | 方法 |
|------|-------------|------|
| **本地开发** | ❌ 不需要 | 使用 `stripe listen` 命令 |
| **生产环境** | ✅ 需要 | 在 Stripe Dashboard 中配置 |

---

## 🚀 生产环境 Webhook 设置步骤

### 步骤 1: 部署项目到 Vercel

首先确保你的项目已经部署到 Vercel，并获得生产环境 URL。

例如: `https://visutry.vercel.app`

---

### 步骤 2: 访问 Stripe Dashboard

1. 打开浏览器访问: https://dashboard.stripe.com/webhooks
2. 确保你在正确的模式：
   - **测试模式**: 用于测试环境
   - **生产模式**: 用于正式上线

**重要**: 测试模式和生产模式需要分别配置 Webhook！

---

### 步骤 3: 添加 Webhook 端点

#### 3.1 点击 "Add endpoint" 或 "+ 添加端点"

#### 3.2 填写端点信息

**Endpoint URL (端点 URL)**:
```
https://your-domain.vercel.app/api/payment/webhook
```

例如:
```
https://visutry.vercel.app/api/payment/webhook
```

**Description (描述)** (可选):
```
VisuTry Payment Webhook
```

#### 3.3 选择要监听的事件

点击 "Select events" 或 "选择事件"，然后选择以下事件：

**必选事件**:
- ✅ `checkout.session.completed` - 支付完成
- ✅ `customer.subscription.created` - 订阅创建
- ✅ `customer.subscription.updated` - 订阅更新
- ✅ `customer.subscription.deleted` - 订阅删除
- ✅ `invoice.payment_succeeded` - 发票支付成功
- ✅ `invoice.payment_failed` - 发票支付失败

**可选事件** (根据需要):
- `payment_intent.succeeded` - 支付意图成功
- `payment_intent.payment_failed` - 支付意图失败
- `charge.succeeded` - 收费成功
- `charge.failed` - 收费失败

#### 3.4 点击 "Add endpoint" 保存

---

### 步骤 4: 获取 Webhook 签名密钥

保存端点后，你会看到端点详情页面。

#### 4.1 找到 "Signing secret"

在端点详情页面，找到 **Signing secret** 部分。

#### 4.2 点击 "Reveal" 或 "显示"

会显示类似这样的密钥:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 4.3 复制这个密钥

点击复制按钮或手动复制整个密钥。

---

### 步骤 5: 配置 Vercel 环境变量

#### 5.1 访问 Vercel 项目设置

1. 登录 Vercel: https://vercel.com
2. 选择你的项目 (VisuTry)
3. 点击 "Settings" (设置)
4. 点击 "Environment Variables" (环境变量)

#### 5.2 添加 Webhook 密钥

**Variable name (变量名)**:
```
STRIPE_WEBHOOK_SECRET
```

**Value (值)**:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(粘贴你刚才复制的密钥)

**Environment (环境)**:
- ✅ Production (生产环境)
- ✅ Preview (预览环境) - 可选
- ❌ Development (开发环境) - 不需要，本地使用 stripe listen

#### 5.3 保存

点击 "Save" 保存环境变量。

---

### 步骤 6: 重新部署

添加环境变量后，需要重新部署项目以使其生效。

#### 方法 1: 自动重新部署

Vercel 会提示你重新部署，点击 "Redeploy" 即可。

#### 方法 2: 手动触发部署

```bash
# 在项目目录中
git commit --allow-empty -m "Trigger redeploy for webhook config"
git push
```

---

### 步骤 7: 测试 Webhook

#### 7.1 在 Stripe Dashboard 中测试

1. 回到 Webhook 端点详情页面
2. 点击 "Send test webhook" 或 "发送测试 webhook"
3. 选择一个事件类型（例如: `checkout.session.completed`）
4. 点击 "Send test webhook"

#### 7.2 查看响应

你应该看到:
- **Status**: `200 OK` (成功)
- **Response body**: `{"received":true}`

如果看到错误（400, 500 等），检查：
- Webhook URL 是否正确
- 环境变量是否正确配置
- 项目是否已重新部署

#### 7.3 真实支付测试

1. 访问你的生产环境网站
2. 进行一次测试支付
3. 检查数据库是否更新

---

## 🔍 验证 Webhook 是否正常工作

### 方法 1: 查看 Stripe Dashboard

1. 访问: https://dashboard.stripe.com/webhooks
2. 点击你的 Webhook 端点
3. 查看 "Recent deliveries" 或 "最近的交付"
4. 应该看到事件列表和响应状态

### 方法 2: 查看 Vercel 日志

1. 在 Vercel 项目页面
2. 点击 "Deployments" (部署)
3. 点击最新的部署
4. 点击 "Functions" 标签
5. 查找 `/api/payment/webhook` 的日志

### 方法 3: 查看数据库

使用 Prisma Studio 或数据库客户端查看：
- `Payment` 表应该有新记录
- `User` 表的 `isPremium` 和 `premiumExpiresAt` 应该更新

---

## 📊 完整配置对比

### 本地开发环境

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # 从 stripe listen 获取
ENABLE_MOCKS=false
```

**Webhook 设置**:
- 使用 `stripe listen --forward-to localhost:3000/api/payment/webhook`
- 不需要在 Stripe Dashboard 配置

---

### 生产环境 (Vercel)

**Vercel 环境变量**:
```
STRIPE_SECRET_KEY=sk_live_xxxxx  # 或 sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # 从 Stripe Dashboard 获取
ENABLE_MOCKS=false
```

**Stripe Dashboard 配置**:
- Webhook URL: `https://visutry.vercel.app/api/payment/webhook`
- 选择需要的事件
- 获取签名密钥并配置到 Vercel

---

## 🔧 故障排查

### 问题 1: Webhook 返回 400 错误

**可能原因**:
- Webhook 签名验证失败
- `STRIPE_WEBHOOK_SECRET` 配置错误

**解决方案**:
1. 确认 Vercel 环境变量中的密钥与 Stripe Dashboard 中的一致
2. 重新部署项目
3. 在 Stripe Dashboard 中重新发送测试 webhook

---

### 问题 2: Webhook 返回 404 错误

**可能原因**:
- Webhook URL 配置错误
- API 路由不存在

**解决方案**:
1. 确认 URL 格式: `https://your-domain.vercel.app/api/payment/webhook`
2. 确认文件存在: `src/app/api/payment/webhook/route.ts`
3. 检查部署日志确认文件已部署

---

### 问题 3: Webhook 返回 500 错误

**可能原因**:
- 代码错误
- 数据库连接问题
- 环境变量缺失

**解决方案**:
1. 查看 Vercel 函数日志
2. 检查所有必需的环境变量是否配置
3. 测试数据库连接

---

### 问题 4: 数据库没有更新

**检查步骤**:

1. **确认 Webhook 被调用**:
   - 在 Stripe Dashboard 查看 webhook 交付状态
   - 应该显示 200 OK

2. **查看 Vercel 日志**:
   - 查找 "Payment completed for user xxx" 日志
   - 查找任何错误信息

3. **检查数据库连接**:
   - 确认 `DATABASE_URL` 环境变量正确
   - 测试数据库连接

4. **手动触发事件**:
   ```bash
   # 使用 Stripe CLI 向生产环境发送测试事件
   stripe trigger checkout.session.completed --api-key sk_live_xxx
   ```

---

## 📝 最佳实践

### 1. 分离测试和生产环境

**测试环境**:
- 使用测试 API 密钥 (`sk_test_xxx`)
- 配置测试 Webhook 端点
- 使用测试卡号

**生产环境**:
- 使用生产 API 密钥 (`sk_live_xxx`)
- 配置生产 Webhook 端点
- 处理真实支付

### 2. 监控 Webhook

定期检查:
- Stripe Dashboard 中的 Webhook 交付状态
- Vercel 函数日志
- 数据库记录

### 3. 错误处理

在 Webhook 处理代码中:
- 记录详细的错误日志
- 实现重试机制
- 发送错误通知

### 4. 安全性

- 始终验证 Webhook 签名
- 不要在客户端暴露 Webhook 密钥
- 使用 HTTPS（Vercel 自动提供）

---

## 🎯 快速参考

### 本地开发

```bash
# 1. 启动 Webhook 转发
stripe listen --forward-to localhost:3000/api/payment/webhook

# 2. 复制 whsec_xxx 到 .env.local

# 3. 重启开发服务器
npm run dev

# 4. 测试
stripe trigger checkout.session.completed
```

### 生产环境

1. **Stripe Dashboard**:
   - URL: `https://your-domain.vercel.app/api/payment/webhook`
   - 选择事件
   - 复制签名密钥

2. **Vercel**:
   - 添加环境变量: `STRIPE_WEBHOOK_SECRET`
   - 重新部署

3. **测试**:
   - 发送测试 webhook
   - 进行真实支付测试

---

## 📚 相关链接

- [Stripe Webhook 文档](https://stripe.com/docs/webhooks)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks)

---

**总结**: 本地开发使用 `stripe listen`，生产环境在 Stripe Dashboard 配置！

