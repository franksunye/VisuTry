# Webhook 设置对比：本地 vs 生产环境

## 🎯 快速回答

### 问题：我需要在 Stripe 后台设置 Webhook 地址吗？

**答案**：取决于你的环境

| 环境 | 需要在 Stripe Dashboard 设置？ | 使用方法 |
|------|------------------------------|---------|
| 本地开发 (localhost) | ❌ **不需要** | 使用 `stripe listen` 命令 |
| 生产环境 (Vercel) | ✅ **需要** | 在 Stripe Dashboard 配置 |

---

## 📊 详细对比

### 方案 1: 本地开发 - 使用 Stripe CLI

```
┌─────────────────────────────────────────────────────────────┐
│                    本地开发环境                              │
└─────────────────────────────────────────────────────────────┘

  Stripe 服务器                你的电脑
  ┌──────────┐               ┌──────────────────────────┐
  │          │               │                          │
  │  Stripe  │               │  stripe listen           │
  │  Events  │──────────────>│  (Stripe CLI)            │
  │          │   Webhook     │         │                │
  └──────────┘   Events      │         ▼                │
                             │  localhost:3000          │
                             │  /api/payment/webhook    │
                             │                          │
                             └──────────────────────────┘

配置步骤:
1. 安装 Stripe CLI: scoop install stripe
2. 登录: stripe login
3. 启动转发: stripe listen --forward-to localhost:3000/api/payment/webhook
4. 复制 whsec_xxx 到 .env.local
5. 重启开发服务器

优点:
✅ 无需配置 Stripe Dashboard
✅ 自动接收所有事件
✅ 实时查看事件日志
✅ 适合开发和调试

缺点:
❌ 需要保持 stripe listen 运行
❌ 每次重启会生成新的签名密钥
```

---

### 方案 2: 生产环境 - Stripe Dashboard 配置

```
┌─────────────────────────────────────────────────────────────┐
│                    生产环境 (Vercel)                         │
└─────────────────────────────────────────────────────────────┘

  Stripe 服务器                Vercel 服务器
  ┌──────────┐               ┌──────────────────────────┐
  │          │               │                          │
  │  Stripe  │               │  https://visutry         │
  │  Events  │──────────────>│  .vercel.app             │
  │          │   Webhook     │  /api/payment/webhook    │
  └──────────┘   Events      │                          │
       ▲                     └──────────────────────────┘
       │
       │ 配置在 Stripe Dashboard
       │
  ┌────┴──────┐
  │  Webhook  │
  │  Endpoint │
  │  Settings │
  └───────────┘

配置步骤:
1. 访问: https://dashboard.stripe.com/webhooks
2. 点击 "Add endpoint"
3. 输入 URL: https://visutry.vercel.app/api/payment/webhook
4. 选择事件类型
5. 保存并复制签名密钥 (whsec_xxx)
6. 在 Vercel 添加环境变量: STRIPE_WEBHOOK_SECRET
7. 重新部署

优点:
✅ 稳定可靠
✅ 自动处理重试
✅ 可查看历史记录
✅ 适合生产环境

缺点:
❌ 需要公网可访问的 URL
❌ 需要手动配置
```

---

## 🔧 在哪里设置 Webhook 地址

### 本地开发：不需要设置

直接使用命令行：

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

---

### 生产环境：在 Stripe Dashboard 设置

#### 步骤 1: 访问 Webhook 设置页面

**测试模式**:
```
https://dashboard.stripe.com/test/webhooks
```

**生产模式**:
```
https://dashboard.stripe.com/webhooks
```

#### 步骤 2: 添加端点

1. 点击 **"+ Add endpoint"** 按钮

2. 填写表单：

   **Endpoint URL**:
   ```
   https://your-domain.vercel.app/api/payment/webhook
   ```
   
   例如:
   ```
   https://visutry.vercel.app/api/payment/webhook
   ```

3. 点击 **"Select events"**

4. 选择以下事件：
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed

5. 点击 **"Add endpoint"** 保存

#### 步骤 3: 获取签名密钥

保存后，在端点详情页面：

1. 找到 **"Signing secret"** 部分
2. 点击 **"Reveal"** 显示密钥
3. 复制密钥（格式: `whsec_xxxxxxxx...`）

#### 步骤 4: 配置到 Vercel

1. 访问 Vercel 项目设置
2. 进入 **Environment Variables**
3. 添加变量：
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxx...`
   - Environment: Production
4. 保存并重新部署

---

## 🎨 可视化界面位置

### Stripe Dashboard - Webhook 设置页面

```
┌────────────────────────────────────────────────────────────┐
│ Stripe Dashboard                                    [测试] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  开发者 > Webhooks                                         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  Webhooks                          [+ Add endpoint] │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │ Endpoint URL                                   │ │ │
│  │  │ https://visutry.vercel.app/api/payment/webhook │ │ │
│  │  │                                                │ │ │
│  │  │ Events to send                                 │ │ │
│  │  │ ☑ checkout.session.completed                   │ │ │
│  │  │ ☑ customer.subscription.created                │ │ │
│  │  │ ☑ customer.subscription.updated                │ │ │
│  │  │ ☑ customer.subscription.deleted                │ │ │
│  │  │ ☑ invoice.payment_succeeded                    │ │ │
│  │  │ ☑ invoice.payment_failed                       │ │ │
│  │  │                                                │ │ │
│  │  │ Signing secret                                 │ │ │
│  │  │ whsec_••••••••••••••••••••  [Reveal] [Copy]   │ │ │
│  │  │                                                │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 配置检查清单

### 本地开发环境

- [ ] 安装 Stripe CLI
- [ ] 运行 `stripe login`
- [ ] 运行 `stripe listen --forward-to localhost:3000/api/payment/webhook`
- [ ] 复制 `whsec_xxx` 到 `.env.local`
- [ ] 重启开发服务器 (`npm run dev`)
- [ ] 测试: `stripe trigger checkout.session.completed`
- [ ] 验证: `node scripts/check-payments.js`

### 生产环境

- [ ] 项目已部署到 Vercel
- [ ] 获取生产环境 URL (例如: `https://visutry.vercel.app`)
- [ ] 访问 Stripe Dashboard Webhooks 页面
- [ ] 添加 Webhook 端点
- [ ] 输入完整 URL: `https://your-domain.vercel.app/api/payment/webhook`
- [ ] 选择需要的事件
- [ ] 保存并复制签名密钥
- [ ] 在 Vercel 添加环境变量 `STRIPE_WEBHOOK_SECRET`
- [ ] 重新部署项目
- [ ] 测试: 在 Stripe Dashboard 发送测试 webhook
- [ ] 验证: 检查数据库或 Vercel 日志

---

## 🚦 当前你应该做什么

### 现在（本地开发阶段）

**不需要在 Stripe Dashboard 设置 Webhook！**

只需要：

```bash
# 1. 安装 Stripe CLI
scoop install stripe

# 2. 登录
stripe login

# 3. 启动 Webhook 转发
stripe listen --forward-to localhost:3000/api/payment/webhook

# 4. 复制输出的 whsec_xxx 到 .env.local

# 5. 重启开发服务器
npm run dev
```

### 将来（部署到生产环境后）

**需要在 Stripe Dashboard 设置 Webhook！**

访问: https://dashboard.stripe.com/webhooks

按照上面的步骤配置。

---

## 💡 常见问题

### Q1: 我现在就想在 Stripe Dashboard 设置可以吗？

**A**: 可以，但没有必要。因为：
- Stripe 无法访问 `localhost`
- 即使设置了也不会工作
- 本地开发使用 `stripe listen` 更方便

### Q2: 测试模式和生产模式的 Webhook 需要分别设置吗？

**A**: 是的！
- **测试模式**: 用于开发和测试，使用测试 API 密钥
- **生产模式**: 用于正式上线，使用生产 API 密钥
- 两者的 Webhook 端点和签名密钥是独立的

### Q3: 我可以同时使用 stripe listen 和 Dashboard 配置吗？

**A**: 可以，但通常不需要：
- 本地开发: 只用 `stripe listen`
- 生产环境: 只用 Dashboard 配置
- 如果同时配置，Stripe 会向两个端点都发送事件

### Q4: 签名密钥 (whsec_xxx) 有什么用？

**A**: 用于验证 Webhook 的真实性：
- 确保请求确实来自 Stripe
- 防止恶意请求伪造支付成功
- 这是安全性的重要保障

---

## 🎯 总结

| 问题 | 答案 |
|------|------|
| 现在需要在 Stripe Dashboard 设置吗？ | ❌ 不需要 |
| 使用什么方法？ | ✅ 使用 `stripe listen` |
| 在哪里设置？ | 在命令行运行 `stripe listen` |
| 将来部署后需要设置吗？ | ✅ 需要 |
| 在哪里设置？ | https://dashboard.stripe.com/webhooks |

---

**下一步**: 按照 `WEBHOOK_SETUP_GUIDE.md` 设置 Stripe CLI！

