# Stripe Payment API 手动测试指南

## 📋 测试概述

本指南将帮助你手动测试 VisuTry 项目的 Stripe 支付功能，验证所有核心支付流程是否正确实现。

## 🎯 测试目标

验证以下功能：
1. ✅ 用户认证检查
2. ✅ 创建月度订阅支付会话
3. ✅ 创建年度订阅支付会话
4. ✅ 创建积分包支付会话
5. ✅ 错误处理（未认证、无效参数等）
6. ✅ Mock 模式和生产模式切换

## 🚀 开始测试

### 步骤 1: 启动开发服务器

```bash
npm run dev
```

服务器应该在 `http://localhost:3000` 启动

### 步骤 2: 访问测试页面

在浏览器中打开：
```
http://localhost:3000/test-stripe
```

### 步骤 3: 登录

如果你还没有登录，页面会提示你登录。点击 "Sign In" 按钮进行登录。

### 步骤 4: 执行测试

登录后，你会看到三个测试按钮：

1. **💳 Monthly ($9.99/mo)** - 测试月度订阅
2. **💎 Yearly ($99.99/yr)** - 测试年度订阅
3. **🎫 Credits ($2.99)** - 测试积分包

点击每个按钮，验证：
- ✅ 请求成功返回
- ✅ 获得有效的 Session ID
- ✅ 获得 Checkout URL（在 Mock 模式下是模拟 URL）
- ✅ 没有错误信息

## 📊 测试检查清单

### 基础功能测试

- [ ] **测试 1: 未认证访问**
  - 退出登录状态访问测试页面
  - 应该看到 "Not Authenticated" 提示
  - 点击 "Sign In" 应该跳转到登录页面

- [ ] **测试 2: 月度订阅支付会话**
  - 登录后点击 "Monthly" 按钮
  - 应该看到成功消息
  - Session ID 格式: `cs_mock_*` (Mock 模式) 或 `cs_test_*` (生产模式)
  - URL 应该存在

- [ ] **测试 3: 年度订阅支付会话**
  - 点击 "Yearly" 按钮
  - 应该看到成功消息
  - Session ID 和 URL 应该存在

- [ ] **测试 4: 积分包支付会话**
  - 点击 "Credits" 按钮
  - 应该看到成功消息
  - Session ID 和 URL 应该存在

### 高级功能测试

- [ ] **测试 5: 并发请求**
  - 快速连续点击多个按钮
  - 所有请求都应该成功
  - 每个请求应该返回不同的 Session ID

- [ ] **测试 6: 响应数据验证**
  - 点击 "View Full Response" 查看完整响应
  - 验证响应包含:
    - `success: true`
    - `data.sessionId`
    - `data.url`

## 🔍 验证要点

### Mock 模式 (ENABLE_MOCKS=true)

在 Mock 模式下，你应该看到：
- Session ID 格式: `cs_mock_1234567890_abc123`
- URL 格式: `https://checkout.stripe.com/mock/session/cs_mock_*`
- 请求立即返回（无需真实 Stripe API 调用）

### 生产模式 (ENABLE_MOCKS=false)

在生产模式下，你应该看到：
- Session ID 格式: `cs_test_*` (测试密钥) 或 `cs_live_*` (生产密钥)
- URL 格式: `https://checkout.stripe.com/c/pay/cs_test_*`
- 可以点击 URL 跳转到真实的 Stripe 支付页面

## 🐛 常见问题排查

### 问题 1: "未授权访问" 错误

**原因**: 用户未登录

**解决方案**:
1. 点击 "Sign In" 按钮登录
2. 确保 NextAuth 配置正确
3. 检查 `.env.local` 中的 `NEXTAUTH_SECRET` 和 `NEXTAUTH_URL`

### 问题 2: "创建支付会话失败" 错误

**原因**: Stripe 配置问题

**解决方案**:
1. 检查 `.env.local` 中的 Stripe 密钥
2. 确认 Price IDs 已配置:
   - `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
   - `STRIPE_PREMIUM_YEARLY_PRICE_ID`
   - `STRIPE_CREDITS_PACK_PRICE_ID`
3. 在 Mock 模式下，这些可以是占位符值

### 问题 3: Session ID 为空

**原因**: API 响应格式问题

**解决方案**:
1. 查看浏览器控制台的网络请求
2. 检查 API 响应的完整内容
3. 确认 `src/lib/stripe.ts` 中的函数正确返回 session 对象

## 📝 测试结果记录

### 测试环境

- **日期**: _______________
- **测试人**: _______________
- **环境模式**: [ ] Mock Mode  [ ] Production Mode
- **浏览器**: _______________

### 测试结果

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 未认证访问拦截 | [ ] ✅ [ ] ❌ | |
| 月度订阅会话创建 | [ ] ✅ [ ] ❌ | Session ID: __________ |
| 年度订阅会话创建 | [ ] ✅ [ ] ❌ | Session ID: __________ |
| 积分包会话创建 | [ ] ✅ [ ] ❌ | Session ID: __________ |
| 并发请求处理 | [ ] ✅ [ ] ❌ | |
| 响应数据完整性 | [ ] ✅ [ ] ❌ | |

### 总体评估

- **通过率**: _____ / 6
- **是否通过**: [ ] 是  [ ] 否
- **其他问题**: 

_______________________________________________
_______________________________________________
_______________________________________________

## 🎉 测试完成

如果所有测试都通过，恭喜！你的 Stripe 支付功能已经正确实现。

### 下一步

1. ✅ 单元测试已完成 (14/14 通过)
2. ✅ 手动 API 测试已完成
3. ⏳ 可选: 测试真实 Stripe 支付流程（使用测试卡号）
4. ⏳ 可选: 测试 Webhook 处理

## 📚 相关文档

- [Stripe 测试卡号](https://stripe.com/docs/testing#cards)
- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [项目 Stripe 集成文档](../../docs/stripe-integration.md)

