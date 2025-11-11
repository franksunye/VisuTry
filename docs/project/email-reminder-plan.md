# 订阅过期提醒邮件功能计划

## 📋 目标

在用户订阅过期前 3 天自动发送提醒邮件，提高续订率。

---

## 🛠 技术方案

### 邮件服务：Resend
- **原因**：Vercel 官方推荐，专为 Next.js 设计
- **免费额度**：3000 封/月
- **集成难度**：⭐ 简单（5 分钟）

### 定时任务：Vercel Cron Jobs
- **原因**：原生集成，零配置
- **成本**：免费（包含在 Vercel Pro）
- **可靠性**：⭐⭐⭐⭐⭐

---

## 📅 实施步骤

### 阶段 1：基础设施（30 分钟）

#### 1.1 安装依赖
```bash
npm install resend
```

#### 1.2 配置环境变量
```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
CRON_SECRET=random-secret-string-here
```

**Vercel Dashboard 也需添加**

#### 1.3 注册 Resend
1. 访问 https://resend.com
2. 注册账号
3. 验证域名（或使用测试域名 `onboarding@resend.dev`）
4. 创建 API Key

---

### 阶段 2：邮件功能（30 分钟）

#### 2.1 创建邮件工具函数

**文件**：`src/lib/email.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendExpirationReminder(
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
        <p>Renew now to continue enjoying unlimited try-ons!</p>
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

---

### 阶段 3：Cron Job API（30 分钟）

#### 3.1 创建 API 路由

**文件**：`src/app/api/cron/check-expiring-subscriptions/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendExpirationReminder } from '@/lib/email'

export async function GET(request: Request) {
  // 安全验证
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 查找 3 天后过期的用户
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)
    
    const fourDaysFromNow = new Date()
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4)
    fourDaysFromNow.setHours(0, 0, 0, 0)

    const expiringUsers = await prisma.user.findMany({
      where: {
        isPremium: true,
        premiumExpiresAt: {
          gte: threeDaysFromNow,
          lt: fourDaysFromNow
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

    console.log(`[Cron] Found ${expiringUsers.length} expiring subscriptions`)

    // 发送邮件
    const results = await Promise.allSettled(
      expiringUsers.map(user =>
        sendExpirationReminder(
          user.email,
          user.name || 'User',
          user.premiumExpiresAt!,
          user.currentSubscriptionType || 'Premium'
        )
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`[Cron] Sent: ${successful}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      checked: expiringUsers.length,
      sent: successful,
      failed
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### 3.2 配置 Vercel Cron

**文件**：`vercel.json`（项目根目录）

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-subscriptions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**说明**：
- `0 9 * * *` = 每天 UTC 9:00 运行
- 相当于北京时间 17:00（UTC+8）

---

## 🧪 测试

### 本地测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 手动触发 Cron Job
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/check-expiring-subscriptions
```

### 生产测试

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://visutry.com/api/cron/check-expiring-subscriptions
```

---

## 📊 验收标准

- [ ] Resend 账号创建并获取 API Key
- [ ] 环境变量配置完成（本地 + Vercel）
- [ ] `src/lib/email.ts` 创建并测试
- [ ] Cron API 创建并测试
- [ ] `vercel.json` 配置完成
- [ ] 本地测试通过
- [ ] 部署到 Vercel
- [ ] 生产环境测试通过
- [ ] 监控首次自动运行

---

## 💰 成本

| 项目 | 成本 |
|------|------|
| Resend（3000 封/月） | $0 |
| Vercel Cron Jobs | $0（包含在 Pro） |
| **总计** | **$0** |

---

## 🔄 后续优化（可选）

### 优先级 1：避免重复发送
- 添加 `lastReminderSent` 字段到 User 表
- Cron Job 检查该字段避免重复

### 优先级 2：多次提醒
- 7 天前提醒
- 3 天前提醒
- 1 天前提醒（最后机会）

### 优先级 3：邮件模板优化
- 使用 React Email 组件
- 添加品牌 logo
- 响应式设计

### 优先级 4：国际化
- 根据用户 locale 发送不同语言邮件
- 支持 9 种语言

---

## ⚠️ 注意事项

1. **域名验证**：生产环境需要验证自己的域名
2. **发件人地址**：使用 `noreply@yourdomain.com`
3. **Cron Secret**：使用强随机字符串，不要泄露
4. **时区**：Vercel Cron 使用 UTC 时间
5. **日志**：监控 Vercel Logs 确保正常运行

---

## 📅 预计时间

- **开发**：1.5 小时
- **测试**：0.5 小时
- **部署**：0.5 小时
- **总计**：2.5 小时

---

## 🚀 开始实施

准备好后，按照阶段 1 → 2 → 3 的顺序实施即可。

---

## 📎 附录：任务过期清理技术方案

### 背景

邮件提醒功能的前提是有明确的过期时间。当前系统需要实现：
1. 任务自动过期清理
2. 明确的过期时间显示
3. 用户升级后延长保存时间

### 方案对比

#### 方案 A：添加 expiresAt 字段 + Vercel Cron（推荐）⭐⭐⭐⭐⭐

**数据库变更**：

```prisma
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
  @@index([expiresAt])  // 新增索引，优化清理查询
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, status])
}
```

**保存时间配置**：

```typescript
// src/config/retention.ts
export const RETENTION_CONFIG = {
  FREE_USER: 7,        // 7 天
  PREMIUM_USER: 365,   // 1 年
  CREDITS_USER: 90,    // 90 天
}
```

**创建任务时设置过期时间**：

```typescript
// src/app/api/try-on/route.ts
function calculateExpiresAt(
  isPremium: boolean,
  creditsPurchased: number,
  creditsUsed: number
): Date {
  const now = new Date()
  const hasCredits = (creditsPurchased - creditsUsed) > 0

  if (isPremium) {
    // 付费用户：1年
    return new Date(now.setDate(now.getDate() + RETENTION_CONFIG.PREMIUM_USER))
  } else if (hasCredits) {
    // Credits 用户：90天
    return new Date(now.setDate(now.getDate() + RETENTION_CONFIG.CREDITS_USER))
  } else {
    // 免费用户：7天
    return new Date(now.setDate(now.getDate() + RETENTION_CONFIG.FREE_USER))
  }
}

// 创建任务时
const expiresAt = calculateExpiresAt(
  user.isPremium,
  user.creditsPurchased,
  user.creditsUsed
)

await prisma.tryOnTask.create({
  data: {
    userId,
    userImageUrl: userImageBlob.url,
    glassesImageUrl: glassesImageBlob.url,
    status: "PENDING",
    expiresAt,  // 设置过期时间
    // ...
  }
})
```

**清理 Cron Job**：

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
        expiresAt: {
          lte: new Date()  // 小于等于当前时间
        }
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
      where: {
        id: { in: expiredTasks.map(t => t.id) }
      }
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

**Vercel Cron 配置**：

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-subscriptions",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/cleanup-expired-tasks",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**优点**：
- ✅ 明确的过期时间 - 每个任务都有清晰的过期日期
- ✅ 自动化清理 - 无需手动干预
- ✅ 查询效率高 - 有专门的索引
- ✅ 用户体验好 - 可以显示剩余天数
- ✅ 灵活性高 - 可以根据用户升级动态调整

**缺点**：
- ⚠️ 需要数据库迁移
- ⚠️ Vercel Cron 有限制（Hobby 计划每天最多 1 次）

---

#### 方案 B：基于 createdAt 动态计算（简单版）⭐⭐⭐⭐

不修改数据库，在查询和清理时动态计算：

```typescript
// 查询时过滤过期数据
async function getUserTasks(userId: string, isPremium: boolean) {
  const retentionDays = isPremium ? 365 : 7
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  return await prisma.tryOnTask.findMany({
    where: {
      userId,
      createdAt: {
        gte: cutoffDate  // 只返回未过期的
      }
    }
  })
}
```

**优点**：
- ✅ 无需数据库迁移
- ✅ 实现简单

**缺点**：
- ⚠️ 查询复杂 - 需要 JOIN user 表
- ⚠️ 性能较差 - 没有专门的索引
- ⚠️ 用户体验差 - 难以显示准确的过期时间
- ⚠️ 升级问题 - 用户升级后，历史数据的保存时间难以处理

---

### 推荐方案：方案 A

**实施步骤**：

1. **数据库迁移**
   ```bash
   npx prisma migrate dev --name add_expires_at_to_try_on_task
   ```

2. **创建配置文件**
   - `src/config/retention.ts`

3. **修改创建任务逻辑**
   - 在 `src/app/api/try-on/route.ts` 中添加 `expiresAt` 计算

4. **创建清理 API**
   - `src/app/api/cron/cleanup-expired-tasks/route.ts`

5. **更新 Vercel Cron 配置**
   - 在 `vercel.json` 中添加清理任务

6. **用户界面更新**
   - 在 History 页面显示过期时间

---

### 保存时间建议

| 用户类型 | 保存时间 | 理由 |
|---------|---------|------|
| 免费用户 | 7 天 | 足够试用，促进转化 |
| Credits Pack | 90 天 | 中等时长，鼓励订阅 |
| Premium 订阅 | 1 年 | 长期保存，体现价值 |

---

### 成本影响

**假设**：
- 每张图片 ~300KB
- 每个任务 3 张图片 = ~900KB

**免费用户（7天保存）**：
- 3 次试用 × 900KB = 2.7MB
- 成本：几乎可忽略

**付费用户（1年保存）**：
- 30 次/月 × 12 月 × 900KB = 324MB/年
- Vercel Blob: $0.15/GB = ~$0.05/年/用户

**结论**：成本影响很小，完全可行！

---

### 用户升级处理

当用户从免费升级到 Premium 时，延长现有任务的过期时间：

```typescript
// src/app/api/payment/webhook/route.ts
async function extendTasksOnUpgrade(userId: string) {
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + 365)

  await prisma.tryOnTask.updateMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }  // 只延长未过期的任务
    },
    data: { expiresAt: newExpiresAt }
  })

  console.log(`Extended task retention for user ${userId}`)
}

// 在订阅创建事件中调用
if (productType === 'PREMIUM_MONTHLY' || productType === 'PREMIUM_YEARLY') {
  await extendTasksOnUpgrade(userId)
}
```

---

### 与邮件提醒的集成

有了 `expiresAt` 字段后，邮件提醒功能可以：

1. **订阅过期提醒**：提醒用户续订以保留数据
2. **任务过期提醒**：在任务过期前 3 天提醒用户下载
3. **批量导出功能**：允许用户在过期前批量下载所有图片

---

### 实施优先级

1. **高优先级**：添加 `expiresAt` 字段和清理 Cron Job
2. **中优先级**：订阅过期邮件提醒
3. **低优先级**：任务过期提醒、批量导出功能

