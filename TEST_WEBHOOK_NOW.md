# 🚀 立即开始 Webhook 测试 - 完整指南

## 📋 测试前准备

当前状态检查：
- ✅ 支付功能已测试（3笔支付成功）
- ✅ Stripe Dashboard 显示支付记录
- ❌ 数据库没有支付记录（Webhook 未处理）
- ❌ Stripe CLI 未安装

---

## 🎯 测试目标

完成 Webhook 测试后，你应该看到：
1. ✅ 数据库中有支付记录（Payment 表）
2. ✅ 用户状态已更新（User 表的 isPremium = true）
3. ✅ 积分包购买后试戴次数增加

---

## 📝 完整测试步骤

### 第 1 步: 安装 Stripe CLI

#### 选项 A: 使用 PowerShell 自动安装（推荐）

1. **打开 PowerShell**（以管理员身份）
   - 按 `Win + X`
   - 选择 "Windows PowerShell (管理员)"

2. **运行安装脚本**
   ```powershell
   cd C:\cygwin64\home\frank\VisuTry
   .\scripts\install-stripe-cli.ps1
   ```

3. **如果遇到执行策略错误**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\scripts\install-stripe-cli.ps1
   ```

4. **关闭并重新打开终端**

5. **验证安装**
   ```bash
   stripe --version
   ```
   应该显示: `stripe version 1.19.5`

#### 选项 B: 手动下载安装

1. 访问: https://github.com/stripe/stripe-cli/releases/latest
2. 下载: `stripe_1.19.5_windows_x86_64.zip`
3. 解压到: `C:\stripe`
4. 添加 `C:\stripe` 到系统 PATH
5. 重新打开终端
6. 验证: `stripe --version`

---

### 第 2 步: 登录 Stripe

```bash
stripe login
```

这会：
1. 打开浏览器
2. 要求你登录 Stripe 账户（franksunye@hotmail.com）
3. 授权 Stripe CLI

成功后显示:
```
Done! The Stripe CLI is configured for VisuTry with account id acct_1S8Y2vS0GPogHnih
```

---

### 第 3 步: 准备终端窗口

你需要 **3 个终端窗口**：

#### 终端 1: 开发服务器
```bash
cd C:\cygwin64\home\frank\VisuTry
npm run dev
```

保持运行，应该显示:
```
- Local:        http://localhost:3000
```

#### 终端 2: Webhook 转发
```bash
cd C:\cygwin64\home\frank\VisuTry
stripe listen --forward-to localhost:3000/api/payment/webhook
```

**重要**: 复制输出的签名密钥！
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 终端 3: 测试命令
```bash
cd C:\cygwin64\home\frank\VisuTry
# 稍后用于运行测试命令
```

---

### 第 4 步: 配置 Webhook 签名密钥

1. **打开 `.env.local` 文件**

2. **添加或更新这一行**（使用终端 2 中复制的密钥）
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **保存文件**

4. **重启开发服务器**
   - 在终端 1 中按 `Ctrl+C` 停止
   - 重新运行: `npm run dev`

---

### 第 5 步: 触发测试事件

在终端 3 中运行：

```bash
# 测试支付完成事件
stripe trigger checkout.session.completed
```

**预期输出**:

终端 2 (Webhook 转发) 应该显示:
```
2025-10-11 12:00:00   --> checkout.session.completed [evt_xxxxx]
2025-10-11 12:00:01   <-- [200] POST http://localhost:3000/api/payment/webhook [evt_xxxxx]
```

终端 1 (开发服务器) 应该显示:
```
Payment completed for user cmgj1ii6h0000ti1h35uxukv7
```

---

### 第 6 步: 验证数据库更新

在终端 3 中运行：

```bash
node scripts/check-payments.js
```

**预期输出**:
```
✅ 找到 1 条支付记录:

1. 支付 ID: cxxxxxx
   用户: Yeah (franksunye@hotmail.com)
   金额: $10.00 USD
   产品: PREMIUM_MONTHLY
   状态: COMPLETED
   ...

✅ 找到 1 个付费用户:

1. 用户: Yeah (franksunye@hotmail.com)
   高级会员: ✅ 是
   ...
```

---

### 第 7 步: 测试其他事件类型

```bash
# 测试订阅创建
stripe trigger customer.subscription.created

# 测试订阅更新
stripe trigger customer.subscription.updated

# 测试订阅删除
stripe trigger customer.subscription.deleted
```

每次触发后，检查终端 2 的输出确认事件被接收。

---

### 第 8 步: 真实支付测试

1. **访问测试页面**
   ```
   http://localhost:3000/test-stripe
   ```

2. **点击任意支付按钮**

3. **使用测试卡号完成支付**
   - 卡号: `4242 4242 4242 4242`
   - 日期: 任意未来日期
   - CVC: 任意 3 位数字

4. **观察终端 2 的输出**
   应该看到 Webhook 事件被接收

5. **再次验证数据库**
   ```bash
   node scripts/check-payments.js
   ```

---

## 🔍 故障排查

### 问题 1: `stripe: command not found`

**解决方案**:
- 确认 Stripe CLI 已安装
- 重新打开终端
- 检查 PATH 环境变量

### 问题 2: Webhook 返回 400 错误

```
<-- [400] POST http://localhost:3000/api/payment/webhook
```

**解决方案**:
1. 确认 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 正确
2. 确认密钥与 `stripe listen` 输出的一致
3. 重启开发服务器

### 问题 3: Webhook 返回 404 错误

```
<-- [404] POST http://localhost:3000/api/payment/webhook
```

**解决方案**:
1. 确认开发服务器正在运行
2. 确认 URL 正确: `localhost:3000/api/payment/webhook`
3. 检查文件存在: `src/app/api/payment/webhook/route.ts`

### 问题 4: 数据库仍然没有记录

**检查步骤**:

1. **查看开发服务器日志**
   在终端 1 中查找错误信息

2. **查看 Webhook 转发日志**
   在终端 2 中查看响应状态（应该是 200）

3. **手动检查数据库**
   ```bash
   npx prisma studio
   ```
   在浏览器中打开 http://localhost:5555

4. **检查环境变量**
   ```bash
   # 在终端中
   echo $STRIPE_WEBHOOK_SECRET
   ```

---

## ✅ 成功标志

当一切正常工作时，你应该看到：

### 1. 终端 2 (Webhook 转发)
```
✓ Ready! Your webhook signing secret is whsec_xxxxx
2025-10-11 12:00:00   --> checkout.session.completed [evt_xxxxx]
2025-10-11 12:00:01   <-- [200] POST http://localhost:3000/api/payment/webhook [evt_xxxxx]
```

### 2. 终端 1 (开发服务器)
```
Payment completed for user cmgj1ii6h0000ti1h35uxukv7
```

### 3. 数据库检查
```
✅ 找到 1 条支付记录
✅ 找到 1 个付费用户
总收入: $10.00
高级会员数: 1
```

### 4. Prisma Studio
- Payment 表有记录
- User 表中 `isPremium = true`
- User 表中 `premiumExpiresAt` 有日期

---

## 📊 测试检查清单

完成以下所有步骤：

- [ ] 安装 Stripe CLI
- [ ] 验证安装: `stripe --version`
- [ ] 登录 Stripe: `stripe login`
- [ ] 启动开发服务器: `npm run dev`
- [ ] 启动 Webhook 转发: `stripe listen --forward-to localhost:3000/api/payment/webhook`
- [ ] 复制 Webhook 签名密钥
- [ ] 更新 `.env.local` 文件
- [ ] 重启开发服务器
- [ ] 触发测试事件: `stripe trigger checkout.session.completed`
- [ ] 验证终端 2 显示 200 响应
- [ ] 验证终端 1 显示 "Payment completed" 日志
- [ ] 运行数据库检查: `node scripts/check-payments.js`
- [ ] 确认数据库有支付记录
- [ ] 确认用户状态已更新
- [ ] 进行真实支付测试
- [ ] 再次验证数据库

---

## 🎯 快速命令参考

```bash
# 安装 Stripe CLI (PowerShell)
.\scripts\install-stripe-cli.ps1

# 验证安装
stripe --version

# 登录
stripe login

# 启动 Webhook 转发
stripe listen --forward-to localhost:3000/api/payment/webhook

# 启动开发服务器
npm run dev

# 触发测试事件
stripe trigger checkout.session.completed

# 验证数据库
node scripts/check-payments.js

# 打开 Prisma Studio
npx prisma studio
```

---

## 📞 需要帮助？

如果遇到问题：
1. 检查上面的故障排查部分
2. 查看终端输出的错误信息
3. 检查 `.env.local` 配置
4. 确认所有服务都在运行

---

**准备好了吗？从第 1 步开始吧！** 🚀

