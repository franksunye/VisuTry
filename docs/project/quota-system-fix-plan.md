# 配额系统修复项目计划

## 📋 项目概述

**目标**: 修复配额系统的设计和实现问题，确保所有用户类型的配额显示和计算正确一致

**优先级**: 高（影响年费用户体验和系统安全性）

**参考文档**:
- [QUOTA_DESIGN_ISSUE.md](./QUOTA_DESIGN_ISSUE.md) - 设计问题分析
- [QUOTA_CALCULATION_FIX.md](./QUOTA_CALCULATION_FIX.md) - 实现修复方案

---

## 🎯 核心问题

1. **年费用户配额显示错误**: Try-On/Pricing 页面显示 30 而非 420
2. **订阅类型无法识别**: User 表缺少 `currentSubscriptionType` 字段
3. **Premium 用户无配额限制**: API 未检查 Premium 用户配额，可无限使用
4. **Credits 追踪设计不一致**: 只存储剩余量，无法追踪购买和使用历史

---

## 📅 实施计划

### 阶段一：修复订阅类型识别（高优先级）

#### 步骤 1.1: 数据库迁移 - 添加订阅类型字段
**文件**: 新建 Prisma migration
```sql
ALTER TABLE "User" ADD COLUMN "currentSubscriptionType" VARCHAR(50);
```

**影响**: 无，仅添加字段，不影响现有功能

**验证**:
```bash
# 执行迁移
npx prisma migrate dev --name add_current_subscription_type
# 检查字段是否添加成功
npx prisma studio
```

---

#### 步骤 1.2: 更新 Webhook - 设置订阅类型
**文件**: `src/app/api/payment/webhook/route.ts`

**修改点**:
1. `handleSubscriptionCreatedEvent`: 设置 `currentSubscriptionType`
2. `handleSubscriptionUpdatedEvent`: 更新 `currentSubscriptionType`
3. `handleSubscriptionDeletedEvent`: 清除 `currentSubscriptionType`

**影响**: 新订阅/更新/取消时正确记录订阅类型

**验证**:
- 测试订阅创建: 检查数据库 `currentSubscriptionType` 是否为 `PREMIUM_MONTHLY` 或 `PREMIUM_YEARLY`
- 测试订阅取消: 检查字段是否清空为 `null`

---

#### 步骤 1.3: 修复 JWT Token 计算
**文件**: `src/lib/auth.ts` (第 199-211 行)

**修改点**: 根据 `currentSubscriptionType` 计算正确配额
```typescript
if (token.isPremiumActive && dbUser.currentSubscriptionType) {
  const quota = dbUser.currentSubscriptionType === 'PREMIUM_YEARLY' 
    ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION 
    : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
  // ...
}
```

**影响**: 
- ✅ 年费用户: Try-On/Pricing 页面显示 420
- ✅ 月费用户: 保持显示 30

**验证**:
- 登录年费用户 → 检查 Try-On 页面显示 420
- 登录月费用户 → 检查 Try-On 页面显示 30
- 检查 JWT Token: `console.log(session.user.remainingTrials)`

---

#### 步骤 1.4: 更新类型定义
**文件**: `types/next-auth.d.ts`

**修改点**: 添加 `subscriptionType` 到 Session 和 JWT 接口

**影响**: TypeScript 类型安全，前端可访问订阅类型

**验证**: TypeScript 编译无错误

---

#### 步骤 1.5: 添加 Premium 配额检查
**文件**: `src/app/api/try-on/route.ts` (第 92-103 行)

**修改点**: 添加 Premium 用户配额检查逻辑

**影响**: 
- ✅ 防止 Premium 用户超额使用
- ✅ 提高系统安全性

**验证**:
- 创建测试用户，设置 `premiumUsageCount = 30` (月费) 或 `420` (年费)
- 尝试 Try-On → 应返回 403 错误
- 检查日志: 配额检查是否生效

---

### 阶段二：优化 Credits 追踪设计（中优先级）

#### 步骤 2.1: 数据库迁移 - Credits 追踪字段
**文件**: 新建 Prisma migration
```sql
-- 添加新字段
ALTER TABLE "User" ADD COLUMN "creditsPurchased" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "creditsUsed" INT DEFAULT 0;

-- 迁移现有数据
UPDATE "User" 
SET creditsPurchased = creditsBalance, creditsUsed = 0
WHERE creditsBalance > 0;

-- 删除冗余字段
ALTER TABLE "User" DROP COLUMN "creditsBalance";
```

**影响**: 
- ✅ 可追踪完整的 Credits 购买和使用历史
- ✅ 支持显示 "7/10" 格式

**验证**:
- 检查数据迁移: 现有用户的 `creditsPurchased` = 原 `creditsBalance`
- 检查字段删除: `creditsBalance` 不再存在

---

#### 步骤 2.2: 更新 Webhook - Credits 购买
**文件**: `src/app/api/payment/webhook/route.ts`

**修改点**: 购买 Credits 时增加 `creditsPurchased`
```typescript
creditsPurchased: { increment: QUOTA_CONFIG.CREDITS_PACK }
```

**影响**: 正确记录 Credits 购买总量

**验证**: 购买 Credits Pack → 检查 `creditsPurchased` 增加 10

---

#### 步骤 2.3: 更新 Try-On API - Credits 使用
**文件**: `src/app/api/try-on/route.ts`

**修改点**: 使用 Credits 时增加 `creditsUsed`
```typescript
creditsUsed: { increment: 1 }
```

**影响**: 正确记录 Credits 使用量

**验证**: 使用 Try-On → 检查 `creditsUsed` 增加 1

---

#### 步骤 2.4: 更新计算逻辑
**文件**: 
- `src/lib/auth.ts` - JWT Token 计算
- `src/components/dashboard/DashboardStatsAsync.tsx` - Dashboard 显示
- `src/components/dashboard/SubscriptionCard.tsx` - 进度条计算

**修改点**: 所有 `creditsBalance` 改为 `creditsPurchased - creditsUsed`

**影响**: 
- ✅ 显示完整使用情况 (如 "7/10")
- ✅ 进度条包含 Credits 使用

**验证**: 
- Dashboard 显示 "Credits: 7/10"
- 进度条正确反映总使用百分比

---

## 🧪 验证方法

### 功能测试矩阵

| 用户类型 | 测试场景 | 预期结果 | 验证页面 |
|---------|---------|---------|---------|
| 年费用户 | 登录查看配额 | 显示 420 | Try-On, Pricing, Dashboard |
| 月费用户 | 登录查看配额 | 显示 30 | Try-On, Pricing, Dashboard |
| 免费用户 | 登录查看配额 | 显示 3 | Try-On, Pricing, Dashboard |
| 年费用户 | 使用 420 次后 | 无法继续使用 | Try-On API |
| 月费用户 | 使用 30 次后 | 无法继续使用 | Try-On API |
| 免费用户 | 购买 10 Credits | 显示 "Credits: 10/10" | Dashboard |
| 免费用户 | 使用 3 Credits | 显示 "Credits: 7/10" | Dashboard |

### 数据一致性检查

```bash
# 检查订阅类型设置
SELECT id, email, currentSubscriptionType, isPremium 
FROM "User" 
WHERE isPremium = true;

# 检查 Credits 追踪
SELECT id, email, creditsPurchased, creditsUsed 
FROM "User" 
WHERE creditsPurchased > 0;
```

---

## ⚠️ 风险控制

### 回滚策略
1. **阶段一**: 如果出现问题，可回滚 migration 并恢复旧代码
2. **阶段二**: 保留 `creditsBalance` 字段直到确认新逻辑正常工作

### 灰度发布
1. 先在测试环境完整验证
2. 生产环境先发布阶段一，观察 1-2 天
3. 确认无问题后发布阶段二

---

## 📊 成功标准

- [ ] 年费用户所有页面显示 420
- [ ] 月费用户所有页面显示 30
- [ ] Premium 用户配额检查生效
- [ ] Credits 显示格式为 "X/Y"
- [ ] 进度条包含所有配额来源
- [ ] 所有测试场景通过
- [ ] 无数据丢失或不一致

