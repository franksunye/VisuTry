# Credits余额实时更新修复方案

## 问题描述

购买Credits Pack后，Dashboard页面和Payments页面的统计数据不会立即更新：

1. **Dashboard页面**：
   - "Remaining Uses" 数字不变
   - 底部credits统计不变

2. **Payments页面**：
   - "Credits Balance" 不从20变为30

3. **Try-on消费后**：
   - 使用次数统计不会实时更新

这些数据只有在重新登录后才会更新。

## 根本原因分析

### 数据流架构

```
支付完成 → Webhook更新数据库 → 清除缓存
                                    ↓
用户浏览器 ← 显示旧数据 ← Session (JWT Token) ← 未更新！
```

### 问题根源

1. **UI数据来源**：Dashboard和Payments页面从`session.user`获取数据
2. **Session数据来源**：`session.user`的数据来自JWT token
3. **JWT更新时机**：
   - 用户登录时
   - 每5分钟自动刷新（`auth.ts` line 129-133）
   - 手动调用`update()`时
4. **支付流程缺陷**：
   - Webhook正确更新了数据库
   - 清除了缓存（`clearUserCache`）
   - **但用户的JWT token没有更新**
   - 用户看到的是旧的token数据

### 配额检查和消费逻辑问题

原有的try-on配额检查逻辑：
```typescript
// 只检查免费试用是否用完，不考虑creditsBalance
if (!isPremiumActive && user.freeTrialsUsed >= freeTrialLimit) {
  return error
}
```

原有的消费逻辑：
```typescript
// 只增加freeTrialsUsed或premiumUsageCount，不扣除creditsBalance
if (!isPremiumActive) {
  freeTrialsUsed++
} else {
  premiumUsageCount++
}
```

## 解决方案

### 1. 支付成功后强制刷新Session

**文件**：`src/app/success/page.tsx`

**修改**：
```typescript
const { data: session, status, update } = useSession()
const [sessionRefreshed, setSessionRefreshed] = useState(false)

useEffect(() => {
  // 支付成功后立即刷新session
  if (status === 'authenticated' && !sessionRefreshed) {
    console.log('💳 Payment success: Refreshing session...')
    update().then(() => {
      console.log('✅ Session refreshed with latest credits')
      setSessionRefreshed(true)
    })
  }
}, [status, sessionRefreshed, update])
```

**原理**：
- `update()`触发NextAuth的JWT callback
- JWT callback设置了`trigger === 'update'`
- 触发数据库查询，获取最新的`creditsBalance`
- 更新JWT token
- Session自动更新
- UI重新渲染显示新数据

### 2. Try-on完成后刷新Session

**文件**：`src/components/try-on/TryOnInterface.tsx`

**修改**：
```typescript
const { update } = useSession()

// 在try-on完成时
if (task.status === "completed") {
  setResult(...)
  
  // 刷新session以更新使用次数
  console.log('✅ Try-on completed: Refreshing session...')
  update().catch((error) => {
    console.error('❌ Failed to refresh session:', error)
  })
}
```

### 3. 修复配额检查逻辑

**文件**：`src/app/api/try-on/route.ts`

**修改前**：
```typescript
if (!isPremiumActive && user.freeTrialsUsed >= freeTrialLimit) {
  return error("Free trial limit reached")
}
```

**修改后**：
```typescript
if (!isPremiumActive) {
  const freeRemaining = Math.max(0, freeTrialLimit - user.freeTrialsUsed)
  const creditsRemaining = user.creditsBalance || 0
  const totalRemaining = freeRemaining + creditsRemaining
  
  if (totalRemaining <= 0) {
    return error("No remaining quota. Please purchase Credits Pack")
  }
}
```

### 4. 修复消费逻辑

**文件**：`src/app/api/try-on/route.ts`

**修改后**：
```typescript
if (!isPremiumActive) {
  const hasCredits = (user.creditsBalance || 0) > 0
  
  if (hasCredits) {
    // 优先消费credits
    await prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: 1 } }
    })
    console.log(`💳 Consumed 1 credit`)
  } else {
    // 没有credits则使用免费试用
    await prisma.user.update({
      where: { id: userId },
      data: { freeTrialsUsed: { increment: 1 } }
    })
    console.log(`🆓 Used free trial`)
  }
} else {
  // Premium用户增加使用计数
  await prisma.user.update({
    where: { id: userId },
    data: { premiumUsageCount: { increment: 1 } }
  })
}
```

### 5. 更新TypeScript类型定义

**文件**：
- `src/lib/test-session.ts`
- `src/hooks/useTestSession.ts`
- `src/lib/mocks/index.ts`

**添加字段**：
```typescript
interface TestUser {
  // ... existing fields
  creditsBalance: number
  premiumUsageCount: number
}
```

## 数据流（修复后）

```
支付完成 → Webhook更新数据库 → 清除缓存
                                    ↓
成功页面 → update() → JWT Callback → 查询数据库 → 更新Token
                                                      ↓
用户浏览器 ← 显示新数据 ← Session (新JWT Token) ← 已更新！
```

## 配额优先级

### 免费用户
1. **检查配额**：免费试用剩余 + Credits余额
2. **消费顺序**：
   - 优先使用Credits（`creditsBalance--`）
   - Credits用完后使用免费试用（`freeTrialsUsed++`）

### Premium用户
1. **检查配额**：订阅配额（无限或固定）+ Credits余额
2. **消费顺序**：
   - 使用订阅配额（`premiumUsageCount++`）
   - 订阅配额用完后使用Credits（`creditsBalance--`）

## 测试验证

### 测试脚本
运行 `npx tsx scripts/test-credit-updates.ts` 验证：
- ✅ Credits增加（购买Credits Pack）
- ✅ Credits消费（Try-on）
- ✅ 数据库更新正确

### 手动测试步骤

1. **测试支付流程**：
   ```bash
   # 1. 登录应用
   # 2. 查看Dashboard的Credits Balance（记录初始值）
   # 3. 购买Credits Pack
   # 4. 支付成功后自动跳转到Success页面
   # 5. 等待5秒自动跳转到Dashboard
   # 6. 验证Credits Balance增加了10
   ```

2. **测试Try-on消费**：
   ```bash
   # 1. 在Dashboard查看Remaining Uses（记录初始值）
   # 2. 进行一次Try-on
   # 3. Try-on完成后返回Dashboard
   # 4. 验证Remaining Uses减少了1
   # 5. 如果有Credits，验证Credits Balance减少了1
   ```

3. **测试Payments页面**：
   ```bash
   # 1. 访问 /payments 页面
   # 2. 查看Credits Balance
   # 3. 购买Credits Pack
   # 4. 返回Payments页面
   # 5. 验证Credits Balance立即更新
   ```

## 关键代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| Session刷新（支付） | `src/app/success/page.tsx` | 22-32 |
| Session刷新（Try-on） | `src/components/try-on/TryOnInterface.tsx` | 42-46 |
| 配额检查 | `src/app/api/try-on/route.ts` | 85-103 |
| Credits消费 | `src/app/api/try-on/route.ts` | 210-264 |
| JWT同步逻辑 | `src/lib/auth.ts` | 105-215 |
| Webhook更新 | `src/app/api/payment/webhook/route.ts` | 100-110 |

## 性能考虑

1. **Session刷新频率**：
   - 只在关键时刻刷新（支付成功、Try-on完成）
   - 避免频繁刷新导致性能问题

2. **数据库查询**：
   - JWT callback已有5分钟缓存机制
   - `update()`触发时会查询数据库
   - 查询已优化（只选择必要字段）

3. **用户体验**：
   - 刷新是异步的，不阻塞UI
   - 失败时有错误处理，不影响用户操作

## 后续优化建议

1. **实时通知**：考虑使用WebSocket或Server-Sent Events实现真正的实时更新
2. **乐观更新**：在客户端先更新UI，然后同步到服务器
3. **状态管理**：使用Zustand或Redux统一管理用户状态
4. **缓存策略**：优化缓存失效策略，减少不必要的数据库查询

## 总结

通过在关键时刻（支付成功、Try-on完成）调用`update()`强制刷新Session，确保用户看到的数据始终是最新的。同时修复了配额检查和消费逻辑，正确处理Credits余额的增减。

