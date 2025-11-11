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

