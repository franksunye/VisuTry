# Google Analytics 追踪实施指南

## 📋 实施清单

### Phase 1: 基础设施（已完成 ✅）
- [x] 创建统一追踪工具 `src/lib/analytics.ts`
- [x] 定义事件类型和参数
- [x] 创建辅助函数 `getUserType()`

### Phase 2: 添加追踪代码（待实施）

#### 2.1 Navigation - Pricing Link
**文件**: `src/components/layout/Header.tsx`

**位置**: 第 37 行附近的 navLinks

**修改**:
```typescript
// 在组件顶部导入
import { analytics, getUserType } from '@/lib/analytics'

// 在 navLinks 的 Pricing 链接上添加 onClick
<Link
  href={`/${locale}/pricing`}
  onClick={() => {
    const userType = getUserType(
      session?.user?.isPremiumActive || false,
      (session?.user as any)?.creditsBalance || 0,
      !!session
    )
    analytics.trackViewPricing('nav', userType, session?.user?.remainingTrials || 0)
  }}
>
  {t('pricing')}
</Link>
```

---

#### 2.2 Try-On Interface - Buy Credits Button
**文件**: `src/components/try-on/TryOnInterface.tsx`

**位置 1**: 第 228-232 行（Error Modal 中的 View Plans 按钮）

**修改**:
```typescript
// 在组件顶部导入
import { analytics, getUserType } from '@/lib/analytics'

// 在 Link 上添加 onClick
<Link
  href="/pricing"
  onClick={() => {
    analytics.trackQuotaExhaustedCTA('error_modal', userType)
  }}
  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-center"
>
  View Plans
</Link>
```

**位置 2**: 第 363-365 行（配额用尽提示中的 Upgrade now 链接）

**修改**:
```typescript
<Link 
  href="/pricing" 
  onClick={() => analytics.trackQuotaExhaustedCTA('try_on', userType)}
  className="font-semibold underline hover:text-red-700"
>
  Upgrade now
</Link>
```

---

#### 2.3 Dashboard - Upgrade Buttons

**文件 1**: `src/app/[locale]/(main)/dashboard/page.tsx`

**位置**: 第 131-136 行（Quick Actions 中的 Upgrade to Standard）

**修改**:
```typescript
// 在文件顶部导入
import { analytics, getUserType } from '@/lib/analytics'

// 在 Link 上添加 onClick
<Link
  href="/pricing"
  onClick={() => {
    const userType = getUserType(
      session.user.isPremiumActive,
      (session.user as any).creditsBalance || 0,
      true
    )
    analytics.trackUpgradeClick('quick_actions', userType, session.user.remainingTrials, false)
  }}
  className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
>
  Upgrade to Standard
</Link>
```

**文件 2**: `src/components/dashboard/SubscriptionCard.tsx`

**位置**: 第 129-136 行（Subscription Card 中的 Upgrade to Standard）

**修改**:
```typescript
// 在组件顶部导入
'use client'
import { analytics, getUserType } from '@/lib/analytics'

// 在 Link 上添加 onClick
<Link
  href="/pricing"
  onClick={() => {
    const userType = getUserType(false, 0, true) // Free user
    analytics.trackUpgradeClick('subscription_card', userType, remainingTrials, remainingTrials <= 1)
  }}
  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
>
  <Star className="w-5 h-5 mr-2" />
  Upgrade to Standard
  <ArrowUpRight className="w-4 h-4 ml-2" />
</Link>
```

---

#### 2.4 Dashboard - Payment History Link
**文件**: `src/app/[locale]/(main)/dashboard/page.tsx`

**位置**: 第 138-144 行

**修改**:
```typescript
<Link
  href="/payments"
  onClick={() => {
    const userType = getUserType(
      session.user.isPremiumActive,
      (session.user as any).creditsBalance || 0,
      true
    )
    // 需要查询用户是否有支付记录，这里暂时设为 true
    analytics.trackViewPaymentHistory(userType, true)
  }}
  className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <Receipt className="w-5 h-5 mr-2" />
  Payment History
</Link>
```

---

#### 2.5 Pricing Page - Purchase Buttons
**文件**: `src/components/pricing/PricingCard.tsx`

**位置**: 第 40-70 行（handleSubscribe 函数）

**修改**:
```typescript
// 在组件顶部导入
import { analytics, getUserType, ProductType } from '@/lib/analytics'

const handleSubscribe = async () => {
  if (!currentUser) {
    alert("Please sign in to subscribe")
    return
  }

  setLoading(true)

  // 追踪点击购买按钮
  const userType = getUserType(
    currentUser.isPremiumActive || false,
    (currentUser as any).creditsBalance || 0,
    true
  )
  analytics.trackClickPurchase(
    plan.id as ProductType,
    parseFloat(plan.price.replace('$', '')),
    userType,
    'pricing'
  )

  try {
    const response = await fetch("/api/payment/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productType: plan.id,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
      }),
    })

    const data = await response.json()

    if (data.success && data.data.url) {
      // 追踪开始结账
      analytics.trackBeginCheckout(
        plan.id as ProductType,
        parseFloat(plan.price.replace('$', ''))
      )
      
      // Redirect to Stripe Checkout
      window.location.href = data.data.url
    } else {
      throw new Error(data.error || "Failed to create payment session")
    }
  } catch (error) {
    console.error("Payment failed:", error)
    alert("Payment failed, please try again")
  } finally {
    setLoading(false)
  }
}
```

---

## 🧪 测试步骤

### 1. 本地测试
```bash
# 启动开发服务器
npm run dev

# 打开浏览器控制台，查看追踪日志
# 应该看到类似：📊 Analytics Event: view_pricing { source: 'nav', ... }
```

### 2. GA4 DebugView 测试
1. 安装 Chrome 扩展：Google Analytics Debugger
2. 访问网站并执行操作
3. 在 GA4 中打开 DebugView（Admin > DebugView）
4. 验证事件是否正确发送

### 3. 生产环境验证
1. 部署到 Vercel
2. 使用 GA4 实时报告验证事件
3. 检查事件参数是否完整

---

## 📊 GA4 配置

### 1. 设置转化事件
在 GA4 中标记以下事件为转化：
- `purchase` - 购买完成
- `begin_checkout` - 开始结账
- `click_purchase_button` - 点击购买按钮
- `first_try_on` - 首次试戴

### 2. 创建自定义报告
- **购买漏斗**: view_pricing → click_purchase_button → begin_checkout → purchase
- **升级路径**: click_upgrade_button → view_pricing → click_purchase_button
- **用户旅程**: login_success → first_try_on → quota_exhausted_cta → purchase

---

## ⚠️ 注意事项

1. **SubscriptionCard 需要改为客户端组件**
   - 添加 `'use client'` 指令
   - 因为需要使用 onClick 事件

2. **用户类型判断**
   - 确保 session 数据包含所有必要字段
   - 使用 `getUserType()` 辅助函数统一判断

3. **价格解析**
   - 从 `plan.price` 字符串中提取数字
   - 使用 `parseFloat(plan.price.replace('$', ''))`

4. **隐私合规**
   - 不追踪用户 ID（除非用户同意）
   - 使用匿名化的用户类型

