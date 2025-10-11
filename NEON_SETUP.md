# Neon Serverless Driver 配置指南

本项目使用 Neon Serverless Driver 优化 Vercel 部署的数据库性能。

## 为什么使用 Neon Serverless Driver？

- ✅ **更低延迟**：使用 HTTP/WebSocket 而不是传统 TCP 连接
- ✅ **更好的 Serverless 性能**：专为 serverless 环境优化
- ✅ **连接池优化**：自动管理连接，避免连接耗尽
- ✅ **官方支持**：Prisma 6.x 正式支持（GA）

## 版本要求

```json
{
  "@prisma/client": "^6.17.0",
  "@prisma/adapter-neon": "^6.17.1",
  "prisma": "^6.17.0"
}
```

## Vercel 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

### 1. DATABASE_URL（必需）
使用 **Pooled Connection** 字符串（带 `-pooler` 后缀）：

```
postgresql://username:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
```

**如何获取**：
1. 登录 Neon 控制台
2. 选择你的项目和数据库
3. 在 "Connection Details" 中选择 "Pooled connection"
4. 复制连接字符串

### 2. DIRECT_URL（必需，用于 migrations）
使用 **Direct Connection** 字符串（不带 `-pooler` 后缀）：

```
postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

**如何获取**：
1. 在 Neon 控制台的 "Connection Details" 中
2. 选择 "Direct connection"
3. 复制连接字符串

## 本地开发配置

1. 复制 `.env.example` 到 `.env`：
```bash
cp .env.example .env
```

2. 更新 `.env` 文件中的数据库连接：
```env
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

3. 运行 Prisma 迁移：
```bash
npx prisma migrate dev
```

4. 生成 Prisma Client：
```bash
npx prisma generate
```

## 技术实现

### Prisma Schema 配置

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")        // Direct connection for migrations
}

generator client {
  provider = "prisma-client-js"
  // 注意：Prisma 6.x 中 driverAdapters 已经 GA，无需 previewFeatures
}
```

### Prisma Client 初始化

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })

export const prisma = new PrismaClient({ adapter })
```

## 部署到 Vercel

1. 确保在 Vercel 项目设置中配置了 `DATABASE_URL` 和 `DIRECT_URL`
2. 推送代码到 GitHub
3. Vercel 会自动触发部署
4. 构建过程中会自动安装 Prisma 6.x 和 Neon adapter

## 性能对比

| 指标 | 标准 Prisma | Neon Serverless Driver |
|------|-------------|------------------------|
| 冷启动延迟 | ~500ms | ~100ms |
| 连接建立 | TCP (慢) | HTTP/WebSocket (快) |
| 连接池 | 需手动管理 | 自动优化 |
| Serverless 适配 | 一般 | 优秀 |

## 故障排查

### 构建错误：Type 'PrismaNeon' is missing properties

**原因**：Prisma 版本和 adapter 版本不匹配

**解决**：确保使用 Prisma 6.x：
```bash
npm install @prisma/client@latest prisma@latest
```

### 运行时错误：Cannot find module '@prisma/client'

**原因**：Prisma Client 未生成

**解决**：
```bash
npx prisma generate
```

### 连接错误：Connection timeout

**原因**：使用了错误的连接字符串

**解决**：
- 确保 `DATABASE_URL` 使用 pooled connection（带 `-pooler`）
- 确保 `DIRECT_URL` 使用 direct connection（不带 `-pooler`）

## 参考资料

- [Prisma Neon 官方文档](https://www.prisma.io/docs/orm/overview/databases/neon)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Prisma 6.x 发布说明](https://github.com/prisma/prisma/releases)

