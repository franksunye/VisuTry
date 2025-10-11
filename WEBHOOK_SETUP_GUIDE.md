# Stripe Webhook 本地测试设置指南

## 🎯 问题说明

你已经成功完成了 3 笔支付，Stripe Dashboard 中也显示了支付记录。但是：

❌ **数据库中没有支付记录**  
❌ **用户状态没有更新**  
❌ **Webhook 回调没有被处理**

**原因**: 在本地开发环境（localhost）中，Stripe 无法直接向你的电脑发送 Webhook，因为 localhost 不是公网可访问的地址。

---

## ✅ 解决方案：使用 Stripe CLI

Stripe CLI 可以将 Stripe 的 Webhook 事件转发到你的本地开发服务器。

---

## 📋 步骤 1: 安装 Stripe CLI

### Windows (推荐使用 Scoop)

#### 方法 1: 使用 Scoop (推荐)

```bash
# 如果还没有安装 Scoop，先安装 Scoop
# 在 PowerShell 中运行:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 安装 Stripe CLI
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### 方法 2: 直接下载

1. 访问: https://github.com/stripe/stripe-cli/releases/latest
2. 下载 `stripe_X.X.X_windows_x86_64.zip`
3. 解压到一个目录（例如: `C:\stripe`）
4. 将该目录添加到系统 PATH

### 验证安装

```bash
stripe --version
```

应该显示类似: `stripe version 1.x.x`

---

## 📋 步骤 2: 登录 Stripe

```bash
stripe login
```

这会：
1. 打开浏览器
2. 要求你登录 Stripe 账户
3. 授权 Stripe CLI 访问你的账户

成功后会显示:
```
Done! The Stripe CLI is configured for [你的账户名] with account id acct_xxxxx
```

---

## 📋 步骤 3: 启动 Webhook 转发

### 3.1 确保开发服务器正在运行

在一个终端窗口中：

```bash
npm run dev
```

### 3.2 在另一个终端窗口中启动 Webhook 转发

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

你会看到类似的输出：

```
> Ready! You are using Stripe API Version [2023-10-16]. Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

**重要**: 复制这个 `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 签名密钥！

---

## 📋 步骤 4: 配置 Webhook 签名密钥

### 4.1 打开 `.env.local` 文件

### 4.2 添加或更新 Webhook 密钥

```env
# Stripe Webhook Secret (从 stripe listen 命令获取)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.3 重启开发服务器

停止当前的 `npm run dev` (Ctrl+C)，然后重新启动：

```bash
npm run dev
```

---

## 📋 步骤 5: 测试 Webhook

现在你有两种方式测试 Webhook：

### 方法 1: 触发测试事件（推荐）

在第三个终端窗口中：

```bash
# 测试支付成功事件
stripe trigger checkout.session.completed

# 测试订阅创建事件
stripe trigger customer.subscription.created

# 测试订阅更新事件
stripe trigger customer.subscription.updated
```

你应该在 Webhook 转发终端看到事件被接收：

```
2025-10-11 12:00:00   --> checkout.session.completed [evt_xxxxx]
2025-10-11 12:00:01   <-- [200] POST http://localhost:3000/api/payment/webhook [evt_xxxxx]
```

### 方法 2: 重新支付（真实测试）

1. 访问: http://localhost:3000/test-stripe
2. 点击任意支付按钮
3. 使用测试卡号完成支付: `4242 4242 4242 4242`
4. 观察 Webhook 转发终端的输出

---

## 📋 步骤 6: 验证数据库更新

### 6.1 运行检查脚本

```bash
node scripts/check-payments.js
```

### 6.2 预期结果

你应该看到：

```
✅ 找到 X 条支付记录:

1. 支付 ID: cxxxxxx
   用户: Yeah (franksunye@hotmail.com)
   金额: $9.99 USD
   产品: PREMIUM_MONTHLY
   状态: COMPLETED
   ...
```

### 6.3 使用 Prisma Studio 查看

```bash
npx prisma studio
```

在浏览器中打开 http://localhost:5555，查看：
- **Payment** 表 - 应该有支付记录
- **User** 表 - 你的用户应该有 `isPremium: true`

---

## 🔍 故障排查

### 问题 1: `stripe: command not found`

**解决方案**: 
- 确认 Stripe CLI 已正确安装
- 检查 PATH 环境变量
- 重启终端

### 问题 2: Webhook 转发显示 404 错误

```
<-- [404] POST http://localhost:3000/api/payment/webhook
```

**解决方案**:
- 确认开发服务器正在运行
- 确认 URL 路径正确: `/api/payment/webhook`
- 检查 `src/app/api/payment/webhook/route.ts` 文件存在

### 问题 3: Webhook 转发显示 400 错误

```
<-- [400] POST http://localhost:3000/api/payment/webhook
```

**可能原因**:
- Webhook 签名验证失败
- `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 不正确

**解决方案**:
1. 确认 `.env.local` 中的密钥与 `stripe listen` 输出的密钥一致
2. 重启开发服务器

### 问题 4: 数据库仍然没有记录

**检查步骤**:

1. **查看服务器日志**:
   在 `npm run dev` 的终端中查找错误信息

2. **查看 Webhook 转发日志**:
   在 `stripe listen` 的终端中查看响应状态

3. **手动触发事件**:
   ```bash
   stripe trigger checkout.session.completed
   ```

4. **检查数据库连接**:
   ```bash
   npx prisma db push
   ```

---

## 📊 完整的测试流程

### 终端 1: 开发服务器

```bash
cd c:\cygwin64\home\frank\VisuTry
npm run dev
```

### 终端 2: Webhook 转发

```bash
cd c:\cygwin64\home\frank\VisuTry
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### 终端 3: 测试命令

```bash
cd c:\cygwin64\home\frank\VisuTry

# 触发测试事件
stripe trigger checkout.session.completed

# 或检查数据库
node scripts/check-payments.js

# 或打开 Prisma Studio
npx prisma studio
```

---

## 🎯 成功标志

当一切正常工作时，你应该看到：

### 1. Webhook 转发终端

```
2025-10-11 12:00:00   --> checkout.session.completed [evt_xxxxx]
2025-10-11 12:00:01   <-- [200] POST http://localhost:3000/api/payment/webhook [evt_xxxxx]
```

### 2. 开发服务器终端

```
Payment completed for user cmgj1ii6h0000ti1h35uxukv7
Subscription created for user cmgj1ii6h0000ti1h35uxukv7
```

### 3. 数据库检查脚本

```
✅ 找到 1 条支付记录
✅ 找到 1 个付费用户
```

### 4. Prisma Studio

- Payment 表有记录
- User 表中 `isPremium = true`

---

## 📝 注意事项

1. **每次重启 `stripe listen`**，都会生成新的 Webhook 签名密钥
   - 需要更新 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET`
   - 需要重启开发服务器

2. **生产环境配置**
   - 在 Vercel 部署后，需要在 Stripe Dashboard 中配置真实的 Webhook URL
   - URL 格式: `https://your-domain.vercel.app/api/payment/webhook`
   - 使用 Stripe Dashboard 提供的签名密钥

3. **测试 vs 生产**
   - 本地开发使用 `stripe listen`
   - 生产环境使用 Stripe Dashboard 配置的 Webhook

---

## 🚀 快速开始命令

```bash
# 1. 安装 Stripe CLI (如果还没有)
scoop install stripe

# 2. 登录
stripe login

# 3. 启动 Webhook 转发
stripe listen --forward-to localhost:3000/api/payment/webhook

# 4. 复制输出的 whsec_xxx 到 .env.local

# 5. 重启开发服务器
npm run dev

# 6. 测试
stripe trigger checkout.session.completed

# 7. 验证
node scripts/check-payments.js
```

---

## 📚 相关文档

- [Stripe CLI 文档](https://stripe.com/docs/stripe-cli)
- [测试 Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook 事件类型](https://stripe.com/docs/api/events/types)

---

**准备好了吗？开始设置 Stripe CLI 吧！** 🚀

