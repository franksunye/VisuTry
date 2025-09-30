# Dashboard Error Fix - 2024

## 问题描述

用户报告：在 https://visutry.vercel.app/try-on 页面，登录后点击 "Start AI try on"，然后点击右上角返回个人中心时，出现服务端异常错误：

```
Application error: a server-side exception has occurred (see the server logs for more information).
```

## 问题分析

### 根本原因

1. **架构不一致**：
   - 认证层使用 JWT 策略，但 `adapter` 被设置为 `undefined`
   - 用户通过 Twitter OAuth 登录后，只创建了 JWT token，**没有在数据库中创建用户记录**
   - 应用层（dashboard、try-on API）假设用户存在于数据库中

2. **错误流程**：
   ```
   用户登录 → JWT token 创建 → 用户不在数据库
   ↓
   访问 /try-on → 页面正常显示（不需要数据库）
   ↓
   点击 "Start AI try on" → API 查询用户 → 用户不存在 → 可能失败
   ↓
   返回 /dashboard → Prisma 查询用户数据 → 用户不存在 → 抛出异常
   ```

3. **具体问题点**：
   - `src/lib/auth.ts` 第 21 行：`adapter: undefined`
   - `src/app/dashboard/page.tsx` 第 19-38 行：直接查询数据库，无错误处理
   - `src/app/api/try-on/route.ts` 第 43-52 行：查询用户，不存在返回 404

### 为什么之前禁用了 Adapter？

代码注释显示：`// 暂时使用 JWT 策略避免数据库连接问题`

这说明之前可能遇到了数据库连接问题，临时禁用了 adapter。但这导致了架构不一致。

## 解决方案

### 策略：多层防御

1. **启用 Prisma Adapter**（根本解决）
2. **增强 Callbacks**（数据同步）
3. **防御性编程**（错误处理）

### 具体修改

#### 1. src/lib/auth.ts - 启用 Prisma Adapter

```typescript
// 修改前
adapter: undefined, // isMockMode ? undefined : PrismaAdapter(prisma),

// 修改后
adapter: isMockMode ? undefined : PrismaAdapter(prisma),
```

**效果**：用户登录时自动创建到数据库

#### 2. src/lib/auth.ts - 增强 Session Callback

```typescript
async session({ session, token, user }) {
  // 从数据库同步最新的用户数据
  if (session.user && token) {
    const userId = user?.id || (token.sub as string) || (token.id as string)
    
    if (userId && userId !== "unknown") {
      try {
        // 从数据库获取最新用户数据
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            freeTrialsUsed: true,
            isPremium: true,
            premiumExpiresAt: true,
          }
        })

        if (dbUser) {
          // 同步所有字段到 session
          session.user.id = dbUser.id
          session.user.freeTrialsUsed = dbUser.freeTrialsUsed
          session.user.isPremium = dbUser.isPremium
          // ... 其他字段
          
          // 动态计算活跃状态
          session.user.isPremiumActive = dbUser.isPremium && 
            (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())
          
          // 动态计算剩余次数
          const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
          session.user.remainingTrials = Math.max(0, freeTrialLimit - dbUser.freeTrialsUsed)
        }
      } catch (error) {
        console.error('Error fetching user from database:', error)
        // 使用 token 中的值作为后备
      }
    }
  }
  return session
}
```

**效果**：
- 每次获取 session 时从数据库读取最新数据
- 确保 freeTrialsUsed、isPremium 等字段是最新的
- 如果数据库查询失败，使用 token 中的值作为后备

#### 3. src/lib/auth.ts - 增强 JWT Callback

```typescript
async jwt({ token, user, account, profile }) {
  // 首次登录时设置基本信息
  if (user) {
    token.id = user.id
    token.name = user.name
    token.email = user.email
    token.image = user.image
  }

  // Twitter 登录补充用户名
  if (account?.provider === 'twitter' && profile) {
    const p: any = profile
    token.username = p?.data?.username ?? p?.username ?? p?.screen_name
  }

  // 定期从数据库同步用户数据到 token
  if (token.sub) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          freeTrialsUsed: true,
          isPremium: true,
          premiumExpiresAt: true,
        }
      })

      if (dbUser) {
        token.freeTrialsUsed = dbUser.freeTrialsUsed
        token.isPremium = dbUser.isPremium
        token.premiumExpiresAt = dbUser.premiumExpiresAt
      }
    } catch (error) {
      console.error('Error syncing user data to token:', error)
    }
  }

  return token
}
```

**效果**：
- 保持 token 中的数据与数据库同步
- 每次刷新 token 时更新使用统计

#### 4. src/app/dashboard/page.tsx - 防御性编程

```typescript
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // 验证用户 ID
  if (!session.user?.id || session.user.id === "unknown") {
    console.error('Invalid user ID in session:', session.user?.id)
    redirect("/auth/signin?error=InvalidSession")
  }

  let tryOnStats, recentTryOns, completedTryOns

  try {
    // 首先确保用户存在于数据库中
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    // 如果用户不存在，创建用户记录（防御性编程）
    if (!user) {
      console.log('User not found in database, creating user:', session.user.id)
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          username: session.user.username,
          freeTrialsUsed: 0,
          isPremium: false,
        },
        select: { id: true }
      })
    }

    // 获取用户统计数据
    [tryOnStats, recentTryOns] = await Promise.all([...])
    completedTryOns = await prisma.tryOnTask.count({...})
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    // 使用默认值
    tryOnStats = { _count: { id: 0 } }
    recentTryOns = []
    completedTryOns = 0
  }

  const stats = {
    totalTryOns: tryOnStats?._count?.id || 0,
    completedTryOns: completedTryOns || 0,
    remainingTrials: session.user.remainingTrials || 0,
    isPremium: session.user.isPremiumActive || false,
  }
  
  // ... 渲染页面
}
```

**效果**：
- 检查用户 ID 有效性
- 如果用户不存在，自动创建
- 捕获所有数据库错误
- 使用默认值确保页面能正常渲染

#### 5. src/app/api/try-on/route.ts - 防御性编程

```typescript
// 验证用户 ID
if (userId === 'unknown' || !userId) {
  return NextResponse.json(
    { success: false, error: "无效的用户会话" },
    { status: 401 }
  )
}

// 查询用户
user = await prisma.user.findUnique({
  where: { id: userId }
})

// 如果用户不存在，自动创建
if (!user && session?.user) {
  console.log('User not found, creating user:', userId)
  user = await prisma.user.create({
    data: {
      id: userId,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      username: session.user.username,
      freeTrialsUsed: 0,
      isPremium: false,
    }
  })
}
```

**效果**：
- 验证用户 ID
- 自动创建缺失的用户
- 更友好的错误信息

## 测试建议

### 1. 新用户登录测试
```
1. 清除浏览器 cookies
2. 访问 https://visutry.vercel.app
3. 使用 Twitter 登录
4. 验证用户在数据库中被创建
5. 访问 /dashboard - 应该正常显示
6. 访问 /try-on - 应该正常显示
7. 点击 "Start AI try on" - 应该正常工作
8. 返回 /dashboard - 应该正常显示，无错误
```

### 2. 现有用户测试
```
1. 使用已有账号登录
2. 访问 /dashboard - 应该显示历史数据
3. 访问 /try-on - 应该显示正确的剩余次数
4. 完成一次试戴
5. 返回 /dashboard - 应该更新统计数据
```

### 3. 错误恢复测试
```
1. 模拟数据库连接失败
2. 访问 /dashboard - 应该显示默认值，不崩溃
3. 恢复数据库连接
4. 刷新页面 - 应该正常显示数据
```

## 预期效果

1. ✅ 用户登录后自动创建到数据库
2. ✅ Dashboard 页面不再抛出服务端异常
3. ✅ Try-on 功能正常工作
4. ✅ 使用统计正确同步
5. ✅ 即使数据库出现问题，页面也能优雅降级

## 提交信息

```
Commit: 32d94b0
Message: fix: resolve dashboard error by enabling Prisma Adapter and adding defensive user creation
Files Changed:
- src/lib/auth.ts (启用 adapter，增强 callbacks)
- src/app/dashboard/page.tsx (防御性编程，错误处理)
- src/app/api/try-on/route.ts (防御性编程，自动创建用户)
```

## 后续监控

1. 监控 Vercel 日志，确认没有类似错误
2. 检查数据库中用户创建情况
3. 监控 session 同步性能
4. 如有必要，考虑添加缓存优化

## 相关文档

- [NextAuth.js Prisma Adapter](https://next-auth.js.org/adapters/prisma)
- [NextAuth.js Callbacks](https://next-auth.js.org/configuration/callbacks)
- [Prisma Error Handling](https://www.prisma.io/docs/concepts/components/prisma-client/error-reference)

