# VisuTry 开发指南

## 环境配置清单

### 必需的外部服务账户

1. **Google Cloud Platform**
   - 创建项目并启用Gemini API
   - 获取API密钥
   - 配置计费账户

2. **Twitter Developer Account**
   - 创建Twitter应用
   - 获取Client ID和Client Secret
   - 配置OAuth回调URL

3. **Stripe账户**
   - 创建Stripe账户
   - 获取测试和生产环境密钥
   - 配置Webhook端点

4. **数据库服务**
   - 推荐使用Supabase或PlanetScale
   - 创建PostgreSQL数据库
   - 获取连接字符串

5. **Vercel账户**
   - 用于部署和Blob存储
   - 连接GitHub仓库

### 环境变量配置

复制`.env.example`到`.env.local`并填入以下配置：

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Twitter OAuth
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"

# 应用配置
FREE_TRIAL_LIMIT=3
PREMIUM_PRICE_ID="price_..."
```

## 开发流程

### 1. 本地开发环境设置

```bash
# 克隆项目
git clone https://github.com/franksunye/VisuTry.git
cd VisuTry

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际配置

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

### 2. 数据库操作

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma db push --force-reset

# 生成客户端
npx prisma generate

# 创建迁移
npx prisma migrate dev --name init
```

### 3. 代码规范

```bash
# 代码检查
npm run lint

# 类型检查
npm run type-check

# 构建检查
npm run build
```

## 开发阶段任务

### 阶段1: MVP核心功能

#### 1.1 用户认证系统
- [ ] 配置NextAuth.js
- [ ] 实现Twitter OAuth登录
- [ ] 创建用户会话管理
- [ ] 实现登录/登出功能

#### 1.2 图片上传功能
- [ ] 创建图片上传组件
- [ ] 实现拖拽上传
- [ ] 添加图片压缩和验证
- [ ] 集成Vercel Blob存储

#### 1.3 AI试戴功能
- [ ] 集成Gemini API
- [ ] 创建试戴任务管理
- [ ] 实现异步任务处理
- [ ] 添加错误处理和重试

#### 1.4 付费系统
- [ ] 集成Stripe Checkout
- [ ] 实现套餐管理
- [ ] 创建Webhook处理
- [ ] 添加使用次数限制

#### 1.5 分享功能
- [ ] 创建分享页面
- [ ] 实现短链接生成
- [ ] 添加社交媒体分享
- [ ] 优化OG标签

#### 1.6 用户个人页面
- [ ] 创建用户仪表板
- [ ] 显示历史记录
- [ ] 实现套餐管理
- [ ] 添加使用统计

## API开发指南

### 认证中间件

```typescript
// src/lib/auth.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
```

### 错误处理

```typescript
// src/lib/api-response.ts
export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}
```

### 数据库查询示例

```typescript
// src/lib/db/users.ts
import { prisma } from "@/lib/prisma"

export async function getUserWithStats(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tryOnTasks: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      _count: {
        select: {
          tryOnTasks: true,
          payments: { where: { status: "COMPLETED" } }
        }
      }
    }
  })
}
```

## 组件开发指南

### 基础UI组件

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'primary', size = 'md', loading, children, onClick }: ButtonProps) {
  // 实现...
}
```

### 业务组件

```typescript
// src/components/try-on/TryOnInterface.tsx
interface TryOnInterfaceProps {
  onSubmit: (data: TryOnRequest) => void
  loading?: boolean
}

export function TryOnInterface({ onSubmit, loading }: TryOnInterfaceProps) {
  // 实现...
}
```

## 测试指南

### 单元测试

```typescript
// __tests__/utils/image.test.ts
import { validateImageFile } from '@/utils/image'

describe('validateImageFile', () => {
  it('should validate correct image file', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})
```

### API测试

```typescript
// __tests__/api/try-on.test.ts
import { POST } from '@/app/api/try-on/route'

describe('/api/try-on', () => {
  it('should create try-on task', async () => {
    const request = new Request('http://localhost:3000/api/try-on', {
      method: 'POST',
      body: JSON.stringify({ /* test data */ })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

## 部署指南

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 设置构建命令: `npm run build`
4. 设置输出目录: `.next`

### 环境变量配置

在Vercel Dashboard中配置所有生产环境变量，确保：
- 数据库URL指向生产数据库
- API密钥使用生产环境密钥
- Webhook URL指向生产域名

### 数据库迁移

```bash
# 生产环境数据库迁移
npx prisma migrate deploy
```

## 故障排除

### 常见问题

1. **NextAuth配置错误**
   - 检查NEXTAUTH_URL是否正确
   - 确认OAuth应用回调URL配置

2. **数据库连接失败**
   - 验证DATABASE_URL格式
   - 检查数据库服务状态

3. **API调用失败**
   - 确认API密钥有效性
   - 检查网络连接和防火墙

4. **图片上传问题**
   - 验证Blob存储配置
   - 检查文件大小和格式限制

### 调试技巧

```typescript
// 开发环境调试
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data })
}

// 错误日志
try {
  // 业务逻辑
} catch (error) {
  console.error('Error:', error)
  // 发送到错误监控服务
}
```

## 性能优化建议

1. **图片优化**
   - 使用Next.js Image组件
   - 实现懒加载
   - 压缩上传图片

2. **API优化**
   - 实现响应缓存
   - 使用数据库索引
   - 优化查询语句

3. **前端优化**
   - 代码分割
   - 预加载关键资源
   - 使用React.memo优化渲染
