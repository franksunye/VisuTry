# VisuTry - AI眼镜试戴应用

VisuTry是一个基于AI技术的虚拟眼镜试戴应用，让用户能够通过上传照片体验不同款式的眼镜效果。

## 功能特性

- 🤖 **AI试戴技术**: 使用Google Gemini API实现智能眼镜试戴
- 👤 **用户认证**: 支持Twitter OAuth登录
- 💳 **付费系统**: 集成Stripe支付，支持免费试用和付费套餐
- 📱 **响应式设计**: 支持桌面和移动设备
- 🔗 **分享功能**: 生成分享链接，支持社交媒体分享
- 📊 **用户管理**: 个人历史记录和使用统计

## 技术栈

- **前端**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **认证**: NextAuth.js
- **支付**: Stripe
- **AI服务**: Google Gemini API
- **部署**: Vercel

## 项目结构

```
VisuTry/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API路由
│   │   ├── auth/           # 认证页面
│   │   ├── dashboard/      # 用户仪表板
│   │   ├── share/          # 分享页面
│   │   └── try-on/         # 试戴功能页面
│   ├── components/         # React组件
│   │   ├── ui/            # 基础UI组件
│   │   ├── auth/          # 认证相关组件
│   │   ├── upload/        # 上传相关组件
│   │   └── try-on/        # 试戴相关组件
│   ├── lib/               # 工具库
│   │   ├── auth.ts        # NextAuth配置
│   │   ├── prisma.ts      # Prisma客户端
│   │   ├── stripe.ts      # Stripe配置
│   │   └── gemini.ts      # Gemini API客户端
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── prisma/                # 数据库模型
│   └── schema.prisma
├── public/                # 静态资源
└── docs/                  # 项目文档
```

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/franksunye/VisuTry.git
cd VisuTry
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境变量配置

复制 `.env.example` 到 `.env.local` 并填入相应的配置：

```bash
cp .env.example .env.local
```

需要配置的环境变量：
- `DATABASE_URL`: PostgreSQL数据库连接字符串
- `NEXTAUTH_SECRET`: NextAuth.js密钥
- `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`: Twitter OAuth应用凭据
- `GEMINI_API_KEY`: Google Gemini API密钥
- `STRIPE_PUBLISHABLE_KEY` & `STRIPE_SECRET_KEY`: Stripe支付密钥

### 4. 数据库设置

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# (可选) 填充示例数据
npx prisma db seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署

### Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

确保在生产环境中配置所有必要的环境变量，特别是：
- 数据库连接字符串
- API密钥
- OAuth应用凭据
- Stripe Webhook密钥

## API文档

### 认证相关
- `POST /api/auth/signin` - 用户登录
- `POST /api/auth/signout` - 用户登出

### 试戴功能
- `POST /api/try-on` - 创建试戴任务
- `GET /api/try-on/[id]` - 获取试戴结果
- `GET /api/try-on/history` - 获取用户历史记录

### 支付相关
- `POST /api/payment/create-session` - 创建支付会话
- `POST /api/payment/webhook` - Stripe Webhook处理

### 文件上传
- `POST /api/upload` - 上传图片文件

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目链接: [https://github.com/franksunye/VisuTry](https://github.com/franksunye/VisuTry)
- 问题反馈: [GitHub Issues](https://github.com/franksunye/VisuTry/issues)
