# Stripe 产品创建快速参考

## 🎯 需要创建的 3 个产品

---

### 产品 1: Premium Monthly

**产品信息**:
```
Name: Premium - Monthly
Description: Unlimited AI try-ons + Premium features
```

**定价信息**:
```
Pricing model: Standard pricing
Price: 9.99 USD
Billing period: Recurring
Billing interval: Monthly
```

**配置到环境变量**:
```env
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxxxxxxx
```

---

### 产品 2: Premium Yearly

**产品信息**:
```
Name: Premium - Annual
Description: Unlimited AI try-ons + Premium features + 2 months free
```

**定价信息**:
```
Pricing model: Standard pricing
Price: 99.99 USD
Billing period: Recurring
Billing interval: Yearly
```

**配置到环境变量**:
```env
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxxxxxxx
```

---

### 产品 3: Credits Pack

**产品信息**:
```
Name: Credits Pack
Description: Get 20 additional AI try-on credits
```

**定价信息**:
```
Pricing model: Standard pricing
Price: 2.99 USD
Billing period: One time (一次性付款)
```

**配置到环境变量**:
```env
STRIPE_CREDITS_PACK_PRICE_ID=price_xxxxxxxxxx
```

---

## 📋 创建步骤

1. 访问: https://dashboard.stripe.com/test/products
2. 点击 "+ Add product"
3. 填写产品信息（参考上面）
4. 设置定价信息（参考上面）
5. 点击 "Save product"
6. 复制 Price ID
7. 重复 3 次（每个产品）

---

## ⚙️ 配置 .env.local

创建完所有产品后，更新 `.env.local` 文件：

```env
# Stripe Price IDs (替换为你的真实 Price IDs)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1QRZabS0GPogHnihXYZ12345
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1QRZcdS0GPogHnihXYZ67890
STRIPE_CREDITS_PACK_PRICE_ID=price_1QRZefS0GPogHnihXYZ11111

# 确保禁用 Mock 模式
ENABLE_MOCKS=false
```

---

## 🔄 重启服务器

```bash
npm run dev
```

---

## 🧪 测试

访问: http://localhost:3000/test-stripe

预期结果:
- Session ID 格式: `cs_test_*` (不是 `cs_mock_*`)
- 可以点击 URL 跳转到真实 Stripe Checkout 页面

---

## 💳 测试卡号

**成功支付**:
```
卡号: 4242 4242 4242 4242
过期: 12/34 (任意未来日期)
CVC: 123 (任意 3 位数字)
邮编: 12345 (任意 5 位数字)
```

---

## 📚 详细指南

查看完整指南: `docs/stripe-setup-guide.md`

