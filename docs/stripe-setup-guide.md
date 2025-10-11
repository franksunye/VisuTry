# Stripe 产品和价格设置指南

## 📋 概述

本指南将帮助你在 Stripe Dashboard 中创建产品和价格，以便在真实环境中测试 VisuTry 的支付功能。

## 🎯 需要创建的产品

我们需要创建 3 个产品：

1. **Premium Monthly** - 月度订阅 ($9.99/月)
2. **Premium Yearly** - 年度订阅 ($99.99/年)
3. **Credits Pack** - 积分包 ($2.99/20 积分)

## 🚀 步骤 1: 访问 Stripe Dashboard

1. 打开浏览器访问: https://dashboard.stripe.com/test/products
2. 确保你在 **测试模式** (Test Mode) - 左上角应该显示 "TEST DATA"
3. 如果还没有 Stripe 账户，需要先注册: https://dashboard.stripe.com/register

## 📦 步骤 2: 创建产品 1 - Premium Monthly

### 2.1 创建产品

1. 点击右上角的 **"+ Add product"** 或 **"+ 添加产品"** 按钮
2. 填写产品信息：

   **Product information (产品信息)**:
   - **Name (名称)**: `Premium - Monthly`
   - **Description (描述)**: `Unlimited AI try-ons + Premium features`
   - **Image (图片)**: 可选，暂时跳过

### 2.2 设置价格

在同一页面的 **Pricing (定价)** 部分：

1. **Pricing model (定价模式)**: 选择 `Standard pricing`
2. **Price (价格)**: 输入 `9.99`
3. **Currency (货币)**: 选择 `USD - US Dollar`
4. **Billing period (计费周期)**: 选择 `Recurring` (循环订阅)
5. **Billing interval (计费间隔)**: 选择 `Monthly` (每月)

### 2.3 保存并获取 Price ID

1. 点击 **"Save product"** 或 **"保存产品"** 按钮
2. 产品创建后，你会看到产品详情页
3. 在 **Pricing** 部分，找到刚创建的价格
4. 点击价格右侧的 **"⋮"** (三个点) 菜单
5. 选择 **"Copy price ID"** 或直接复制显示的 Price ID
6. Price ID 格式类似: `price_1Abc123XYZ...`
7. **保存这个 Price ID**，稍后需要配置到 `.env.local` 文件中

## 📦 步骤 3: 创建产品 2 - Premium Yearly

重复步骤 2，但使用以下信息：

### 3.1 产品信息
- **Name**: `Premium - Annual`
- **Description**: `Unlimited AI try-ons + Premium features + 2 months free`

### 3.2 定价信息
- **Price**: `99.99`
- **Currency**: `USD`
- **Billing period**: `Recurring`
- **Billing interval**: `Yearly` (每年)

### 3.3 获取 Price ID
- 复制并保存这个产品的 Price ID

## 📦 步骤 4: 创建产品 3 - Credits Pack

### 4.1 产品信息
- **Name**: `Credits Pack`
- **Description**: `Get 20 additional AI try-on credits`

### 4.2 定价信息
- **Price**: `2.99`
- **Currency**: `USD`
- **Billing period**: 选择 `One time` (一次性付款)
  - **注意**: 这不是订阅，而是一次性购买

### 4.3 获取 Price ID
- 复制并保存这个产品的 Price ID

## ⚙️ 步骤 5: 配置环境变量

现在你应该有 3 个 Price IDs。打开项目的 `.env.local` 文件，更新以下配置：

```env
# Stripe Price IDs (替换为你刚才创建的真实 Price IDs)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1Abc123...  # 替换为月度订阅的 Price ID
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1Def456...   # 替换为年度订阅的 Price ID
STRIPE_CREDITS_PACK_PRICE_ID=price_1Ghi789...     # 替换为积分包的 Price ID
```

### 示例配置

```env
# 示例 (使用你自己的真实 Price IDs)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1QRZabS0GPogHnihXYZ12345
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1QRZcdS0GPogHnihXYZ67890
STRIPE_CREDITS_PACK_PRICE_ID=price_1QRZefS0GPogHnihXYZ11111
```

## 🔄 步骤 6: 重启开发服务器

配置完成后，需要重启开发服务器以加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 🧪 步骤 7: 测试真实 Stripe 集成

1. 访问测试页面: http://localhost:3000/test-stripe
2. 登录你的账户
3. 点击三个支付按钮测试
4. 这次你应该看到真实的 Stripe Session IDs (格式: `cs_test_*`)
5. 点击返回的 URL 会跳转到真实的 Stripe Checkout 页面

## 💳 步骤 8: 使用测试卡号完成支付

Stripe 提供了测试卡号，可以模拟真实支付而不会产生实际费用：

### 成功支付测试卡

- **卡号**: `4242 4242 4242 4242`
- **过期日期**: 任意未来日期 (例如: `12/34`)
- **CVC**: 任意 3 位数字 (例如: `123`)
- **邮编**: 任意 5 位数字 (例如: `12345`)

### 其他测试卡号

| 卡号 | 用途 |
|------|------|
| `4242 4242 4242 4242` | 成功支付 |
| `4000 0000 0000 0002` | 卡被拒绝 |
| `4000 0000 0000 9995` | 余额不足 |
| `4000 0000 0000 0069` | 过期卡 |

更多测试卡号: https://stripe.com/docs/testing#cards

## ✅ 验证清单

完成以下检查以确保设置正确：

- [ ] 在 Stripe Dashboard 中创建了 3 个产品
- [ ] 每个产品都有对应的价格
- [ ] 复制了所有 3 个 Price IDs
- [ ] 更新了 `.env.local` 文件中的 Price IDs
- [ ] `.env.local` 中 `ENABLE_MOCKS=false`
- [ ] 重启了开发服务器
- [ ] 测试页面显示真实的 Session IDs (`cs_test_*`)
- [ ] 可以访问 Stripe Checkout 页面
- [ ] 使用测试卡号完成了支付

## 🔍 常见问题

### Q1: 找不到 Price ID 在哪里？

**A**: 在产品详情页，向下滚动到 **Pricing** 部分，Price ID 会显示在价格下方。格式类似 `price_1Abc123...`

### Q2: 创建产品时没有 "Recurring" 选项？

**A**: 确保你选择的是 **Standard pricing** 而不是其他定价模式。

### Q3: Credits Pack 应该选择什么计费周期？

**A**: 选择 **One time** (一次性)，因为积分包是一次性购买，不是订阅。

### Q4: 测试卡号支付后会真的扣款吗？

**A**: 不会！在测试模式下使用测试卡号不会产生任何实际费用。所有交易都是模拟的。

### Q5: 如何切换回 Mock 模式？

**A**: 在 `.env.local` 中设置 `ENABLE_MOCKS=true`，然后重启服务器。

## 📊 Stripe Dashboard 快速链接

- **产品列表**: https://dashboard.stripe.com/test/products
- **支付列表**: https://dashboard.stripe.com/test/payments
- **客户列表**: https://dashboard.stripe.com/test/customers
- **订阅列表**: https://dashboard.stripe.com/test/subscriptions
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **API 密钥**: https://dashboard.stripe.com/test/apikeys

## 🎉 完成！

设置完成后，你就可以在真实的 Stripe 环境中测试支付功能了！

### 下一步

1. 完成真实环境的支付测试
2. 记录测试结果到 `tests/reports/stripe-test-results.md`
3. 验证支付成功后的数据库更新
4. 测试订阅管理功能

## 📝 注意事项

⚠️ **重要提醒**:
- 始终在 **测试模式** 下进行开发和测试
- 不要在生产环境中使用测试密钥
- 不要将 API 密钥提交到 Git 仓库
- 使用 `.env.local` 文件存储本地配置（已在 .gitignore 中）

---

**文档版本**: 1.0  
**最后更新**: 2025-10-11  
**相关文档**: [Stripe 测试文档](https://stripe.com/docs/testing)

