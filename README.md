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

## 🚀 快速开始

### 测试模式 (推荐)
无需任何API密钥，立即体验所有功能：

```bash
# 1. 克隆项目
git clone https://github.com/franksunye/VisuTry.git
cd VisuTry

# 2. 安装依赖
npm install

# 3. 启动测试模式
npm run test:start:windows  # Windows
npm run test:start          # Linux/Mac

# 或手动启动
cp .env.test .env.local && npm run dev
```

访问 http://localhost:3000 开始使用

### 生产模式
需要配置真实的API服务，参考 `docs/development-guide.md`

## 🧪 测试

```bash
# 运行集成测试
npm run test:integration

# 运行认证API测试
node tests/legacy/authenticated-apis-legacy.js

# 运行所有测试
npm test
```

## 📊 当前状态

✅ **Mock环境**: 集成测试通过率 89%
🎯 **下一步**: 前端组件测试 → 真实环境配置 → 生产部署

详细计划见 `docs/backlog.md`

## 📚 文档

- `docs/backlog.md` - 开发计划和任务清单
- `docs/development-guide.md` - 生产环境配置指南
- `docs/testing-guide.md` - 测试使用说明
- `docs/architecture.md` - 项目架构文档

## 🚀 部署

生产部署指南请参考 `docs/development-guide.md`

## 📞 联系

- 项目链接: [https://github.com/franksunye/VisuTry](https://github.com/franksunye/VisuTry)
- 问题反馈: [GitHub Issues](https://github.com/franksunye/VisuTry/issues)
