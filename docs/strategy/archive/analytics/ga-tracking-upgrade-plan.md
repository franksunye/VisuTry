# Google Analytics 用户行为追踪升级方案

## 📊 当前状态分析

### 已有的追踪能力
- ✅ Google Analytics 4 基础配置
- ✅ Google Tag Manager 集成
- ✅ 基础事件追踪函数（`trackEvent`, `trackPageView`）
- ✅ 部分预定义事件（`trackTryOnEvent`, `trackPhotoUpload`, `trackSignUp`, `trackSignIn`）
- ✅ Web Vitals 性能追踪

### 缺失的追踪
- ❌ 用户登录后的试用行为
- ❌ 定价页面的具体点击行为
- ❌ Dashboard 的升级按钮点击
- ❌ Payment History 的访问
- ❌ 购买流程的漏斗追踪
- ❌ 用户旅程的完整追踪

---

## 🎯 追踪目标与事件设计

### 1. 用户认证事件（Authentication Events）

#### 1.1 登录成功
```typescript
Event: 'login_success'
Parameters:
  - method: 'google' | 'twitter' | 'auth0'
  - user_type: 'new' | 'returning'
  - has_premium: boolean
```

#### 1.2 首次试用
```typescript
Event: 'first_try_on'
Parameters:
  - user_id: string
  - time_since_signup: number (minutes)
```

---

### 2. Try-On 相关事件（Try-On Events）

#### 2.1 开始试戴
```typescript
Event: 'try_on_start'
Parameters:
  - user_type: 'free' | 'premium' | 'credits'
  - remaining_quota: number
  - glasses_id: string
  - glasses_name: string
```

#### 2.2 试戴完成
```typescript
Event: 'try_on_complete'
Parameters:
  - user_type: 'free' | 'premium' | 'credits'
  - processing_time: number (seconds)
  - success: boolean
```

#### 2.3 配额用尽点击 Buy Credits
```typescript
Event: 'quota_exhausted_cta'
Parameters:
  - source: 'try_on_interface' | 'error_modal'
  - remaining_quota: 0
  - user_type: 'free' | 'premium'
```

---

### 3. 定价页面事件（Pricing Events）

#### 3.1 查看定价页面
```typescript
Event: 'view_pricing'
Parameters:
  - source: 'nav' | 'dashboard' | 'try_on' | 'direct'
  - user_type: 'anonymous' | 'free' | 'premium' | 'credits'
  - remaining_quota: number
```

#### 3.2 点击购买按钮
```typescript
Event: 'click_purchase_button'
Parameters:
  - plan_type: 'CREDITS_PACK' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
  - plan_price: number
  - user_type: 'anonymous' | 'free' | 'premium' | 'credits'
  - source_page: 'pricing' | 'dashboard' | 'try_on'
```

---

### 4. Dashboard 事件（Dashboard Events）

#### 4.1 点击 Upgrade to Standard（Quick Actions）
```typescript
Event: 'click_upgrade_button'
Parameters:
  - location: 'quick_actions'
  - user_type: 'free' | 'credits'
  - remaining_quota: number
```

#### 4.2 点击 Upgrade to Standard（Subscription Card）
```typescript
Event: 'click_upgrade_button'
Parameters:
  - location: 'subscription_card'
  - user_type: 'free' | 'credits'
  - remaining_quota: number
  - quota_warning: boolean
```

#### 4.3 点击 Payment History
```typescript
Event: 'view_payment_history'
Parameters:
  - user_type: 'free' | 'premium' | 'credits'
  - has_payments: boolean
```

---

### 5. 购买流程事件（Purchase Funnel Events）

#### 5.1 开始结账
```typescript
Event: 'begin_checkout'
Parameters:
  - plan_type: string
  - value: number
  - currency: 'USD'
```

#### 5.2 支付成功
```typescript
Event: 'purchase'
Parameters:
  - transaction_id: string
  - plan_type: string
  - value: number
  - currency: 'USD'
```

#### 5.3 支付取消
```typescript
Event: 'checkout_cancelled'
Parameters:
  - plan_type: string
  - value: number
```

---

## 🛠️ 实施方案

### Phase 1: 创建统一的追踪工具（Week 1）

创建 `src/lib/analytics.ts`：
```typescript
// 统一的事件追踪接口
export const analytics = {
  // 用户认证
  trackLogin(method: string, isNewUser: boolean, isPremium: boolean),
  trackFirstTryOn(userId: string, timeSinceSignup: number),
  
  // Try-On 行为
  trackTryOnStart(userType, remainingQuota, glassesInfo),
  trackTryOnComplete(userType, processingTime, success),
  trackQuotaExhaustedCTA(source, userType),
  
  // 定价页面
  trackViewPricing(source, userType, remainingQuota),
  trackClickPurchase(planType, price, userType, sourcePage),
  
  // Dashboard
  trackUpgradeClick(location, userType, remainingQuota, quotaWarning),
  trackViewPaymentHistory(userType, hasPayments),
  
  // 购买流程
  trackBeginCheckout(planType, value),
  trackPurchase(transactionId, planType, value),
  trackCheckoutCancelled(planType, value),
}
```

### Phase 2: 在关键位置添加追踪（Week 2）

#### 2.1 Navigation - Pricing Link
文件：`src/components/layout/Header.tsx`
```typescript
<Link
  href={`/${locale}/pricing`}
  onClick={() => analytics.trackViewPricing('nav', userType, remainingQuota)}
>
  {t('pricing')}
</Link>
```

#### 2.2 Try-On Interface - Buy Credits
文件：`src/components/try-on/TryOnInterface.tsx`
```typescript
<Link
  href="/pricing"
  onClick={() => analytics.trackQuotaExhaustedCTA('error_modal', userType)}
>
  View Plans
</Link>
```

#### 2.3 Dashboard - Upgrade Buttons
文件：`src/app/[locale]/(main)/dashboard/page.tsx`
```typescript
// Quick Actions
<Link
  href="/pricing"
  onClick={() => analytics.trackUpgradeClick('quick_actions', userType, remainingQuota, false)}
>
  Upgrade to Standard
</Link>
```

文件：`src/components/dashboard/SubscriptionCard.tsx`
```typescript
<Link
  href="/pricing"
  onClick={() => analytics.trackUpgradeClick('subscription_card', userType, remainingQuota, remainingTrials <= 1)}
>
  Upgrade to Standard
</Link>
```

#### 2.4 Dashboard - Payment History
```typescript
<Link
  href="/payments"
  onClick={() => analytics.trackViewPaymentHistory(userType, hasPayments)}
>
  Payment History
</Link>
```

#### 2.5 Pricing Page - Purchase Buttons
文件：`src/components/pricing/PricingCard.tsx`
```typescript
const handleSubscribe = async () => {
  analytics.trackClickPurchase(plan.id, plan.price, userType, 'pricing')
  // ... existing code
}
```

### Phase 3: 设置 GA4 转化目标（Week 3）

在 Google Analytics 4 中配置以下转化事件：
1. ✅ `purchase` - 购买完成
2. ✅ `begin_checkout` - 开始结账
3. ✅ `first_try_on` - 首次试戴
4. ✅ `click_purchase_button` - 点击购买按钮
5. ✅ `quota_exhausted_cta` - 配额用尽点击升级

---

## 📈 预期收益

### 1. 用户行为洞察
- 了解用户从注册到首次试戴的时间
- 识别购买意向最强的触点
- 优化定价页面的转化率

### 2. 漏斗分析
```
访问定价页面 → 点击购买按钮 → 开始结账 → 完成支付
```

### 3. A/B 测试基础
- 不同 CTA 文案的效果对比
- 不同位置的升级按钮点击率
- 定价策略的影响

---

## 🎯 关键指标（KPIs）

1. **转化率指标**
   - 定价页面访问 → 点击购买：目标 >15%
   - 点击购买 → 完成支付：目标 >60%
   - 配额用尽 → 购买：目标 >10%

2. **用户参与度**
   - 首次试戴时间：目标 <5分钟
   - Dashboard 升级按钮点击率：目标 >5%
   - Payment History 访问率：目标 >20%

3. **收入指标**
   - 每用户平均收入（ARPU）
   - 客户生命周期价值（LTV）
   - 购买转化率

---

## ⚠️ 注意事项

1. **隐私合规**
   - 不追踪个人身份信息（PII）
   - 遵守 GDPR/CCPA 规定
   - 提供 Cookie 同意机制

2. **性能影响**
   - 使用 `lazyOnload` 策略加载 GA
   - 避免阻塞主线程
   - 批量发送事件

3. **数据质量**
   - 定期验证事件是否正确触发
   - 使用 GA4 DebugView 调试
   - 设置数据过滤器排除内部流量

