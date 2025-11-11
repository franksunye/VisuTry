# 数据保留与通知系统实施计划

## 📋 目标

实现完整的数据生命周期管理和用户通知系统：
1. 任务自动过期清理（基于用户类型）
2. 订阅过期前提醒邮件
3. 用户升级时延长数据保留期

---

## 🎯 核心设计

### 数据保留策略

| 用户类型 | 保留时间 | 理由 |
|---------|---------|------|
| 免费用户 | 7 天 | 足够试用，促进转化 |
| Credits 用户 | 90 天 | 中等时长，鼓励订阅 |
| Premium 用户 | 1 年 | 长期保存，体现价值 |

### 通知策略

| 事件 | 提前时间 | 目的 |
|------|---------|------|
| 订阅过期 | 3 天 | 提醒续订，保留数据 |
| 任务过期 | 3 天 | 提醒下载（可选） |

---

## 🛠 技术方案

### 方案选择：expiresAt 字段 + Vercel Cron Jobs

**为什么选这个方案**：
- ✅ 明确的过期时间 - 每个任务都有清晰的过期日期
- ✅ 自动化清理 - 无需手动干预
- ✅ 查询效率高 - 有专门的索引
- ✅ 用户体验好 - 可以显示剩余天数
- ✅ 灵活性高 - 用户升级时可动态调整

**技术栈**：
- **邮件服务**：Resend（免费 3000 封/月）
- **定时任务**：Vercel Cron Jobs（免费）
- **总成本**：$0

---

## 📅 实施步骤

### 阶段 1：数据库和配置（30 分钟）

#### 1.1 数据库 Schema 变更

```prisma
// prisma/schema.prisma
model TryOnTask {
  id              String    @id @default(cuid())
  userId          String
  userImageUrl    String
  glassesImageUrl String
  resultImageUrl  String?
  status          TaskStatus @default(PENDING)
  errorMessage    String?
  prompt          String?
  metadata        Json?
  expiresAt       DateTime?  // 新增：过期时间
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([expiresAt])  // 新增索引
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
}
```

**执行迁移**：
```bash
npx prisma migrate dev --name add_expires_at_to_try_on_task
```

#### 1.2 创建配置文件

```typescript
// src/config/retention.ts
export const RETENTION_CONFIG = {
  FREE_USER: 7,        // 7 天
  CREDITS_USER: 90,    // 90 天
  PREMIUM_USER: 365,   // 1 年
}

export const NOTIFICATION_CONFIG = {
  SUBSCRIPTION_EXPIRY_DAYS: 3,  // 订阅过期前 3 天提醒
  TASK_EXPIRY_DAYS: 3,          // 任务过期前 3 天提醒（可选）
}
```

#### 1.3 环境变量配置

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
CRON_SECRET=random-secret-string-here
```

**Vercel Dashboard 也需添加**

---

### 阶段 2：任务过期逻辑（45 分钟）

#### 2.1 过期时间计算函数

```typescript
// src/lib/retention.ts
import { RETENTION_CONFIG } from '@/config/retention'

export function calculateExpiresAt(
  isPremium: boolean,
  creditsPurchased: number,
  creditsUsed: number
): Date {
  const now = new Date()
  const hasCredits = (creditsPurchased - creditsUsed) > 0

  let days: number
  if (isPremium) {
    days = RETENTION_CONFIG.PREMIUM_USER
  } else if (hasCredits) {
    days = RETENTION_CONFIG.CREDITS_USER
  } else {
    days = RETENTION_CONFIG.FREE_USER
  }

  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

export function extendTaskRetention(userId: string, days: number) {
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + days)

  return prisma.tryOnTask.updateMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }  // 只延长未过期的任务
    },
    data: { expiresAt: newExpiresAt }
  })
}
```

---

### 阶段 4：Cron Jobs（45 分钟）

#### 4.1 清理过期任务 API

```typescript
// src/app/api/cron/cleanup-expired-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function GET(request: NextRequest) {
  // 安全验证
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 查找过期的任务
    const expiredTasks = await prisma.tryOnTask.findMany({
      where: {
        expiresAt: { lte: new Date() }
      },
      select: {
        id: true,
        userImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
      }
    })

    console.log(`[Cleanup] Found ${expiredTasks.length} expired tasks`)

    // 收集需要删除的 Blob URLs
    const urlsToDelete: string[] = []
    expiredTasks.forEach(task => {
      if (task.userImageUrl) urlsToDelete.push(task.userImageUrl)
      if (task.glassesImageUrl) urlsToDelete.push(task.glassesImageUrl)
      if (task.resultImageUrl) urlsToDelete.push(task.resultImageUrl)
    })

    // 删除数据库记录
    await prisma.tryOnTask.deleteMany({
      where: { id: { in: expiredTasks.map(t => t.id) } }
    })

    // 删除 Blob 文件
    if (urlsToDelete.length > 0) {
      await del(urlsToDelete)
    }

    console.log(`[Cleanup] Deleted ${expiredTasks.length} tasks, ${urlsToDelete.length} files`)

    return NextResponse.json({
      success: true,
      deletedTasks: expiredTasks.length,
      deletedFiles: urlsToDelete.length
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
```

#### 4.2 订阅过期提醒 API

```typescript
// src/app/api/cron/check-expiring-subscriptions/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionExpiryReminder } from '@/lib/email'
import { NOTIFICATION_CONFIG } from '@/config/retention'

export async function GET(request: Request) {
  // 安全验证
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const daysAhead = NOTIFICATION_CONFIG.SUBSCRIPTION_EXPIRY_DAYS

    // 查找 N 天后过期的订阅
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysAhead)
    targetDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const expiringUsers = await prisma.user.findMany({
      where: {
        isPremium: true,
        premiumExpiresAt: {
          gte: targetDate,
          lt: nextDay
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        premiumExpiresAt: true,
        currentSubscriptionType: true
      }
    })

    console.log(`[Notification] Found ${expiringUsers.length} expiring subscriptions`)

    // 发送邮件
    const results = await Promise.allSettled(
      expiringUsers.map(user =>
        sendSubscriptionExpiryReminder(
          user.email,
          user.name || 'User',
          user.premiumExpiresAt!,
          user.currentSubscriptionType || 'Premium'
        )
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`[Notification] Sent: ${successful}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      checked: expiringUsers.length,
      sent: successful,
      failed
    })
  } catch (error) {
    console.error('[Notification] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### 4.3 配置 Vercel Cron

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-tasks",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-expiring-subscriptions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**说明**：
- `0 2 * * *` = 每天 UTC 2:00 清理过期任务
- `0 9 * * *` = 每天 UTC 9:00 检查即将过期的订阅

---

### 阶段 5：用户界面（30 分钟）

#### 5.1 显示过期时间

```typescript
// src/components/dashboard/TryOnHistoryItem.tsx
export function TryOnHistoryItem({ task }: { task: TryOnTask }) {
  const daysUntilExpiry = task.expiresAt
    ? Math.ceil((new Date(task.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="...">
      {/* ... 其他内容 ... */}

      {daysUntilExpiry !== null && (
        <div className="text-xs text-gray-500 mt-2">
          {daysUntilExpiry > 0
            ? `Expires in ${daysUntilExpiry} days`
            : 'Expired'
          }
        </div>
      )}
    </div>
  )
}
```

---

## 🧪 测试

### 本地测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 测试清理 API
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup-expired-tasks

# 3. 测试通知 API
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/check-expiring-subscriptions
```

### 生产测试

```bash
# 测试清理
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://visutry.com/api/cron/cleanup-expired-tasks

# 测试通知
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://visutry.com/api/cron/check-expiring-subscriptions
```

---

## 📊 验收标准

### 数据库
- [ ] `expiresAt` 字段添加成功
- [ ] 索引创建成功
- [ ] 迁移无错误

### 任务过期逻辑
- [ ] 创建任务时正确设置 `expiresAt`
- [ ] 免费用户：7 天
- [ ] Credits 用户：90 天
- [ ] Premium 用户：1 年
- [ ] 用户升级时延长保留期

### 邮件功能
- [ ] Resend 账号创建
- [ ] API Key 配置
- [ ] 邮件发送测试通过

### Cron Jobs
- [ ] 清理 API 创建并测试
- [ ] 通知 API 创建并测试
- [ ] `vercel.json` 配置完成
- [ ] 部署到 Vercel
- [ ] 监控首次自动运行

### 用户界面
- [ ] History 页面显示过期时间
- [ ] 过期任务标记清晰

---

## 💰 成本分析

### Vercel Blob 存储

**假设**：
- 每张图片 ~300KB
- 每个任务 3 张图片 = ~900KB

**免费用户（7天保存）**：
- 3 次试用 × 900KB = 2.7MB
- 成本：几乎可忽略

**付费用户（1年保存）**：
- 30 次/月 × 12 月 × 900KB = 324MB/年
- Vercel Blob: $0.15/GB = ~$0.05/年/用户

### Resend 邮件

- 免费额度：3000 封/月
- 假设 100 个付费用户，每月提醒 1 次 = 100 封/月
- 成本：$0

### 总成本

| 项目 | 成本 |
|------|------|
| Vercel Blob | ~$0.05/年/用户 |
| Resend | $0（免费额度内） |
| Vercel Cron | $0（包含在 Pro） |
| **总计** | **~$0.05/年/用户** |

**结论**：成本极低，完全可行！

---

## 🔄 后续优化（可选）

### 优先级 1：避免重复发送邮件

添加字段到 User 表：

```prisma
model User {
  // ...
  lastReminderSent DateTime?
}
```

在通知 API 中检查：

```typescript
where: {
  isPremium: true,
  premiumExpiresAt: { gte: targetDate, lt: nextDay },
  OR: [
    { lastReminderSent: null },
    { lastReminderSent: { lt: targetDate } }
  ]
}
```

### 优先级 2：多次提醒

- 7 天前提醒
- 3 天前提醒
- 1 天前提醒（最后机会）

### 优先级 3：任务过期提醒

在任务过期前 3 天提醒用户下载。

### 优先级 4：批量导出功能

允许用户在过期前批量下载所有图片。

### 优先级 5：邮件国际化

根据用户的 locale 发送不同语言的邮件。

---

## ⚠️ 注意事项

1. **域名验证**：生产环境需要验证自己的域名
2. **发件人地址**：使用 `noreply@yourdomain.com`
3. **Cron Secret**：使用强随机字符串，不要泄露
4. **时区**：Vercel Cron 使用 UTC 时间
5. **日志监控**：监控 Vercel Logs 确保正常运行
6. **数据迁移**：现有任务需要设置 `expiresAt`（可选）

---

## 📅 预计时间

| 阶段 | 时间 |
|------|------|
| 阶段 1：数据库和配置 | 30 分钟 |
| 阶段 2：任务过期逻辑 | 45 分钟 |
| 阶段 3：邮件功能 | 30 分钟 |
| 阶段 4：Cron Jobs | 45 分钟 |
| 阶段 5：用户界面 | 30 分钟 |
| 测试和部署 | 30 分钟 |
| **总计** | **3.5 小时** |

---

## 🚀 开始实施

准备好后，按照阶段 1 → 2 → 3 → 4 → 5 的顺序实施即可。

每个阶段完成后建议提交一次代码，便于回滚和追踪。
```

#### 2.2 修改创建任务逻辑

```typescript
// src/app/api/try-on/route.ts
import { calculateExpiresAt } from '@/lib/retention'

// 在创建任务时
const expiresAt = calculateExpiresAt(
  user.isPremium,
  user.creditsPurchased || 0,
  user.creditsUsed || 0
)

const tryOnTask = await prisma.tryOnTask.create({
  data: {
    userId,
    userImageUrl: userImageBlob.url,
    glassesImageUrl: glassesImageUrl,
    status: "PENDING",
    expiresAt,  // 设置过期时间
    // ...
  }
})
```

#### 2.3 用户升级时延长保留期

```typescript
// src/app/api/payment/webhook/route.ts
import { extendTaskRetention } from '@/lib/retention'
import { RETENTION_CONFIG } from '@/config/retention'

// 在订阅创建/更新事件中
if (productType === 'PREMIUM_MONTHLY' || productType === 'PREMIUM_YEARLY') {
  await extendTaskRetention(userId, RETENTION_CONFIG.PREMIUM_USER)
  console.log(`Extended task retention for user ${userId}`)
}
```

---

### 阶段 3：邮件功能（30 分钟）

#### 3.1 注册 Resend

1. 访问 https://resend.com
2. 注册账号
3. 验证域名（或使用测试域名）
4. 创建 API Key

#### 3.2 安装依赖

```bash
npm install resend
```

#### 3.3 创建邮件工具函数

```typescript
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSubscriptionExpiryReminder(
  email: string,
  name: string,
  expiresAt: Date,
  subscriptionType: string
) {
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return await resend.emails.send({
    from: 'VisuTry <noreply@yourdomain.com>',
    to: email,
    subject: `Your ${subscriptionType} subscription expires in ${daysLeft} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Hi ${name},</h1>
        <p>Your <strong>${subscriptionType}</strong> subscription will expire on
           <strong>${expiresAt.toLocaleDateString()}</strong>.</p>
        <p>⚠️ After expiration, your try-on history will be deleted in 7 days.</p>
        <p>Renew now to keep your data and continue enjoying unlimited try-ons!</p>
        <a href="https://visutry.com/pricing"
           style="display: inline-block; padding: 12px 24px; background: #0070f3;
                  color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Renew Subscription
        </a>
      </div>
    `
  })
}
```

