# VisuTry 项目架构与功能文档

## 📋 项目概述

VisuTry是一个基于Next.js的全栈AI眼镜试戴应用，用户可以上传照片并通过AI技术实时预览不同眼镜的试戴效果。

## 🛠 技术架构

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **UI库**: React 18 + TypeScript
- **样式**: Tailwind CSS + Lucide React
- **状态管理**: React Hooks + Context API

### 后端技术栈
- **API**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js (Twitter OAuth)
- **支付**: Stripe
- **文件存储**: Vercel Blob
- **AI服务**: Google Gemini API

### 部署架构
- **平台**: Vercel
- **数据库**: 托管PostgreSQL (推荐Supabase/PlanetScale)
- **CDN**: Vercel Edge Network
- **监控**: Vercel Analytics

## ✅ 已实现功能

### Phase 1: MVP核心功能

#### 1. 用户认证系统
- Twitter OAuth登录
- 用户会话管理
- 用户资料显示
- 登录/登出功能

#### 2. 图片上传功能
- 拖拽上传支持
- 图片压缩和预览
- 多格式支持 (JPEG, PNG, WebP)
- 文件大小限制 (5MB)

#### 3. AI试戴功能
- 用户照片上传
- 眼镜框架选择
- AI图像处理 (Gemini API)
- 异步任务处理
- 实时状态轮询
- 结果展示

#### 4. 支付系统
- Stripe集成
- 免费试用额度管理
- 付费套餐 (月度/年度)
- 积分包购买
- 支付历史记录

#### 5. 分享功能
- 试戴结果分享链接
- 社交媒体集成
- 公开访问页面

#### 6. 用户仪表板
- 试戴历史记录
- 使用统计
- 账户管理
- 支付记录

## 数据库设计

### 核心表结构

1. **User** - 用户信息
   - 基本信息 (id, name, email, image)
   - 试用次数管理 (freeTrialsUsed)
   - 付费状态 (isPremium, premiumExpiresAt)

2. **TryOnTask** - 试戴任务
   - 输入图片 (userImageUrl, glassesImageUrl)
   - 输出结果 (resultImageUrl)
   - 任务状态 (status: PENDING/PROCESSING/COMPLETED/FAILED)

3. **Payment** - 支付记录
   - Stripe集成 (stripeSessionId, stripePaymentId)
   - 产品类型 (productType: PREMIUM_MONTHLY/YEARLY/CREDITS_PACK)

4. **GlassesFrame** - 眼镜框架库
   - 框架信息 (name, description, imageUrl)
   - 分类管理 (category, brand)

## API设计

### 认证相关
```
POST /api/auth/signin     # 用户登录
POST /api/auth/signout    # 用户登出
GET  /api/auth/session    # 获取会话信息
```

### 试戴功能
```
POST /api/try-on          # 创建试戴任务
GET  /api/try-on/[id]     # 获取试戴结果
GET  /api/try-on/history  # 获取用户历史
```

### 支付系统
```
POST /api/payment/create-session  # 创建支付会话
POST /api/payment/webhook         # Stripe Webhook
GET  /api/payment/status          # 支付状态查询
```

### 文件管理
```
POST /api/upload          # 文件上传
GET  /api/frames          # 获取眼镜框架列表
```

## 组件架构

### 页面组件
```
src/app/
├── page.tsx              # 首页
├── auth/                 # 认证页面
├── dashboard/            # 用户仪表板
├── try-on/               # 试戴功能页面
└── share/[id]/           # 分享页面
```

### UI组件
```
src/components/
├── ui/                   # 基础UI组件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Loading.tsx
├── auth/                 # 认证组件
│   ├── LoginButton.tsx
│   └── UserProfile.tsx
├── upload/               # 上传组件
│   ├── ImageUpload.tsx
│   └── DragDropZone.tsx
└── try-on/               # 试戴组件
    ├── TryOnInterface.tsx
    ├── ResultDisplay.tsx
    └── FrameSelector.tsx
```

## 工作流程

### 试戴流程
1. 用户上传头像照片
2. 选择眼镜框架或上传自定义框架
3. 系统调用Gemini API进行图像合成
4. 返回试戴结果并保存到数据库
5. 用户可分享结果到社交媒体

### 付费流程
1. 用户选择付费套餐
2. 创建Stripe Checkout会话
3. 用户完成支付
4. Webhook更新用户付费状态
5. 解锁高级功能

## 安全考虑

### 数据安全
- 所有API路由都有适当的认证检查
- 用户只能访问自己的数据
- 敏感信息使用环境变量存储

### 文件安全
- 图片上传大小限制 (5MB)
- 文件类型验证 (JPEG/PNG/WebP)
- 自动图片压缩和优化

### 支付安全
- 使用Stripe安全支付处理
- Webhook签名验证
- 敏感支付信息不存储在本地

## 性能优化

### 前端优化
- Next.js自动代码分割
- 图片懒加载和优化
- Tailwind CSS按需加载

### 后端优化
- 数据库查询优化
- API响应缓存
- 图片CDN加速

### AI服务优化
- 异步任务处理
- 错误重试机制
- 结果缓存策略

## 监控和分析

### 应用监控
- Vercel Analytics集成
- 错误日志收集
- 性能指标监控

### 业务分析
- 用户使用统计
- 试戴成功率分析
- 付费转化率跟踪

## 扩展性设计

### 水平扩展
- 无状态API设计
- 数据库读写分离准备
- CDN和缓存策略

### 功能扩展
- 模块化组件设计
- 插件化架构准备
- 多语言支持框架

## 开发工作流

### 代码质量
- TypeScript类型检查
- ESLint代码规范
- Prettier代码格式化

### 测试策略
- 单元测试 (Jest)
- 集成测试 (Cypress)
- API测试 (Postman/Newman)

### 部署流程
- Git提交触发自动部署
- 环境变量管理
- 数据库迁移自动化
