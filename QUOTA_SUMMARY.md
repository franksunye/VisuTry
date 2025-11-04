# Try-On 剩余次数计算 - 快速总结

## 📐 核心公式

```
remainingTotal = freeRemaining + creditsBalance + subscriptionRemaining

Free Users:
  remainingTotal = (3 - freeTrialsUsed) + creditsBalance

Premium Users:
  subscriptionQuota = 30 (Monthly) or 420 (Yearly)
  remainingTotal = (subscriptionQuota - premiumUsageCount) + creditsBalance
```

---

## 🔴 4 个核心问题

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 1 | JWT Token 计算错误 | `src/lib/auth.ts` | 年费用户显示 30 而不是 420 |
| 2 | 无法识别订阅类型 | User 表缺字段 | 订阅变更后显示错误 |
| 3 | 页面显示不一致 | Try-On vs Dashboard | 用户困惑 |
| 4 | 进度条不完整 | SubscriptionCard | 只显示 Free，不含 Credits |

---

## ✅ 6 步修复方案

1. **数据库**: 添加 `currentSubscriptionType` 字段
2. **Webhook**: 订阅创建/取消时更新该字段
3. **JWT Token**: 使用正确的 subscriptionType 计算
4. **类型定义**: 添加 `subscriptionType` 到 Session
5. **前端组件**: 使用 `session.user.subscriptionType`
6. **API 检查**: 添加 Premium 用户配额检查

---

## 📊 组件问题详情

### Try-On Page
- **UserStatusBanner**: ✅ 逻辑正确，❌ 基于错误的 JWT
- **TryOnInterface**: ✅ 逻辑正确，❌ 基于错误的 JWT

### Dashboard
- **DashboardStatsAsync**: ✅ 完全正确
- **DashboardStats**: ✅ 完全正确
- **SubscriptionCard** (免费用户):
  - ❌ 进度条只计算 Free，不含 Credits
  - ❌ 显示文本只说 "free try-ons"，没有拆开显示
  - ❌ 没有 Premium 用户的进度条

---

## 🔧 SubscriptionCard 修复

### 问题 1: 进度条不含 Credits
```typescript
// 修改前
const usagePercentage = ((user.freeTrialsUsed || 0) / freeTrialLimit) * 100

// 修改后
const totalQuota = freeTrialLimit + (user.creditsBalance || 0)
const totalUsed = (user.freeTrialsUsed || 0)
const usagePercentage = totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0
```

### 问题 2: 显示文本不拆开
```typescript
// 修改前
{remainingTrials} free try-ons remaining

// 修改后
{remainingTrials} try-ons remaining
{creditsBalance > 0 && (
  <p className="text-xs text-gray-500">
    Free: {Math.max(0, freeTrialLimit - freeTrialsUsed)}, Credits: {creditsBalance}
  </p>
)}
```

### 问题 3: 无 Premium 进度条 + 不含 Credits
```typescript
// 修改前：无 Premium 进度条
if (user.isPremiumActive) {
  // 没有显示进度条
}

// 修改后：显示 Premium 进度条，包含 Credits
if (user.isPremiumActive) {
  const quota = user.isYearlySubscription ? 420 : 30
  const creditsBalance = (user as any).creditsBalance || 0
  const totalQuota = quota + creditsBalance
  const usagePercentage = totalQuota > 0
    ? ((user.premiumUsageCount || 0) / totalQuota) * 100
    : 0

  // 显示进度条
  // 显示文本：{remainingTrials} try-ons remaining
  // 拆开显示：Subscription: {subscriptionRemaining}, Credits: {creditsBalance}
}
```

**注意**: `creditsBalance` 已经在 `session.user` 中可用（来自 JWT Token），SubscriptionCard 的 User 接口需要添加这个字段。

---

## 📋 修复优先级

1. **高**: 步骤 1-3（修复 JWT Token）- 影响所有页面
2. **高**: 步骤 4-5（前端组件）- 确保一致性
3. **中**: 步骤 6（API 检查）- 防止无限使用
4. **中**: SubscriptionCard 修复 - 改进用户体验

---

## 🧪 验收标准

- [ ] 年费用户: 所有页面显示 420
- [ ] 月费用户: 所有页面显示 30
- [ ] 免费用户: 所有页面显示 3
- [ ] 进度条: 包含 Free + Credits 的总进度
- [ ] 拆开显示: 各部分清晰可见
- [ ] Premium 进度条: 正确显示

