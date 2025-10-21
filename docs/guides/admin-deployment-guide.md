# Admin Panel Deployment Guide

本指南详细说明如何将 Admin Panel 功能部署到 Vercel 生产环境。

---

## 📋 部署前检查清单

在开始部署之前，请确认以下事项：

- [ ] 代码已合并到 `main` 分支
- [ ] 本地测试通过
- [ ] 已了解数据库 schema 变更
- [ ] 已准备好管理员邮箱

---

## 🗄️ 数据库迁移

Admin Panel 功能需要对数据库 schema 进行以下变更：

### Schema 变更内容

```prisma
model User {
  // ... existing fields
  role  UserRole @default(USER)  // 新增字段
}

enum UserRole {  // 新增枚举
  USER
  ADMIN
}
```

### 步骤 1: 生成 Migration

在本地开发环境运行：

```bash
# 生成 migration 文件
npx prisma migrate dev --name add_user_role
```

这将创建一个新的 migration 文件在 `prisma/migrations/` 目录下。

### 步骤 2: 提交 Migration

```bash
# 添加 migration 文件到 git
git add prisma/migrations/

# 提交
git commit -m "feat: add user role migration for admin panel"

# 推送到远程
git push origin main
```

### 步骤 3: 在 Vercel 上运行 Migration

有两种方法在 Vercel 生产环境运行 migration：

#### 方法 A: 自动部署 (推荐)

Vercel 会在每次部署时自动运行 `npm run build`。确保你的 `package.json` 包含：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**注意**: 检查你的 `package.json`，确认 build 脚本包含 `prisma migrate deploy`。

#### 方法 B: 手动运行 (备选)

如果需要手动控制 migration 时机：

```bash
# 1. 安装 Vercel CLI (如果还没安装)
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 链接到你的项目
vercel link

# 4. 运行 migration
vercel env pull .env.production  # 拉取生产环境变量
npx prisma migrate deploy        # 运行 migration
```

### 步骤 4: 验证 Migration

连接到生产数据库验证 schema 变更：

```bash
# 使用 Prisma Studio
npx prisma studio --browser none

# 或使用 psql 连接 Neon
psql $DATABASE_URL
```

检查 `User` 表是否包含 `role` 列：

```sql
\d "User"  -- 查看表结构
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'role';
```

---

## 👤 设置管理员用户

Migration 完成后，需要为至少一个用户授予 ADMIN 角色。

### 方法 1: 使用 Seed 脚本 (推荐)

```bash
# 1. 设置管理员邮箱环境变量
export ADMIN_EMAIL="your-email@example.com"

# 2. 运行 seed 脚本
npx tsx scripts/seed-admin.ts
```

脚本会：
1. 查找指定邮箱的用户
2. 检查用户是否已是 ADMIN
3. 如果不是，更新 role 为 ADMIN

### 方法 2: 直接修改数据库

如果你有数据库访问权限：

```sql
-- 查找用户
SELECT id, email, name, role FROM "User" WHERE email = 'your-email@example.com';

-- 更新为 ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- 验证
SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN';
```

### 方法 3: 使用 Prisma Studio

```bash
# 1. 打开 Prisma Studio
npx prisma studio

# 2. 在浏览器中：
#    - 选择 User 表
#    - 找到目标用户
#    - 编辑 role 字段为 ADMIN
#    - 保存
```

---

## 🚀 Vercel 部署

### 自动部署

当你推送代码到 `main` 分支时，Vercel 会自动触发部署：

```bash
git push origin main
```

### 监控部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 查看 "Deployments" 标签
4. 等待部署完成 (通常 2-5 分钟)

### 检查部署日志

如果部署失败，检查日志：

1. 点击失败的 deployment
2. 查看 "Build Logs"
3. 查找错误信息

常见错误：
- **Prisma migration failed**: 检查 DATABASE_URL 环境变量
- **Build timeout**: 可能需要优化 build 脚本
- **Module not found**: 检查依赖是否正确安装

---

## ✅ 部署后验证

### 1. 验证 Admin 访问

```bash
# 访问 admin 页面
https://your-domain.com/admin

# 预期结果：
# - 如果未登录：重定向到登录页
# - 如果已登录但非 ADMIN：重定向到首页并显示 "Forbidden" 错误
# - 如果是 ADMIN：成功进入 Dashboard
```

### 2. 测试 Dashboard

访问 `/admin/dashboard`，检查：
- [ ] 总用户数显示正确
- [ ] Premium 用户数显示正确
- [ ] 总订单数显示正确
- [ ] 总收入显示正确
- [ ] 最近活动列表加载正常

### 3. 测试用户管理

访问 `/admin/users`，检查：
- [ ] 用户列表加载正常
- [ ] 搜索功能工作正常
- [ ] 分页功能工作正常
- [ ] 用户详情可以查看

### 4. 测试订单管理

访问 `/admin/orders`，检查：
- [ ] 订单列表加载正常
- [ ] 状态筛选工作正常
- [ ] 搜索功能工作正常
- [ ] 分页功能工作正常

### 5. 测试权限控制

使用非 ADMIN 用户测试：
- [ ] 无法访问 `/admin` 路径
- [ ] 被正确重定向
- [ ] 显示权限错误提示

---

## 🔧 环境变量检查

确保 Vercel 项目配置了以下环境变量：

### 必需的环境变量

```bash
# 数据库
DATABASE_URL=postgresql://...          # Neon pooled connection
DIRECT_URL=postgresql://...            # Neon direct connection

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Auth0
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_ISSUER=https://your-tenant.auth0.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 其他
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 检查环境变量

在 Vercel Dashboard：
1. 进入项目设置
2. 点击 "Environment Variables"
3. 确认所有必需变量都已设置
4. 确认变量在 "Production" 环境中可用

---

## 🐛 故障排查

### 问题 1: 无法访问 /admin

**症状**: 访问 `/admin` 时被重定向到首页

**可能原因**:
1. 用户未登录
2. 用户 role 不是 ADMIN
3. Session 中没有 role 信息

**解决方案**:
```bash
# 1. 检查用户 role
psql $DATABASE_URL -c "SELECT id, email, role FROM \"User\" WHERE email = 'your-email@example.com';"

# 2. 如果 role 不是 ADMIN，运行 seed 脚本
ADMIN_EMAIL=your-email@example.com npx tsx scripts/seed-admin.ts

# 3. 清除浏览器 cookies 并重新登录
```

### 问题 2: Dashboard 数据不显示

**症状**: Dashboard 页面空白或显示 0

**可能原因**:
1. 数据库连接问题
2. Prisma 查询错误
3. 权限问题

**解决方案**:
```bash
# 1. 检查 Vercel 部署日志
vercel logs

# 2. 检查数据库连接
npx prisma db pull

# 3. 验证数据存在
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

### 问题 3: Migration 失败

**症状**: 部署时 migration 报错

**可能原因**:
1. DATABASE_URL 配置错误
2. Migration 文件冲突
3. 数据库权限不足

**解决方案**:
```bash
# 1. 验证 DATABASE_URL
echo $DATABASE_URL

# 2. 重置 migration (谨慎!)
npx prisma migrate reset

# 3. 重新生成 migration
npx prisma migrate dev --name add_user_role

# 4. 部署 migration
npx prisma migrate deploy
```

### 问题 4: 中间件不工作

**症状**: 非 ADMIN 用户可以访问 /admin

**可能原因**:
1. middleware.ts 未正确配置
2. Session 中缺少 role 信息
3. JWT callback 未更新

**解决方案**:
1. 检查 `middleware.ts` 配置
2. 检查 `src/lib/auth.ts` 中的 JWT callback
3. 确保 session 包含 role 信息

---

## 📊 监控和维护

### 日志监控

定期检查 Vercel 日志：
```bash
# 查看实时日志
vercel logs --follow

# 查看最近的错误
vercel logs --since 1h | grep ERROR
```

### 性能监控

在 Vercel Dashboard 监控：
- 页面加载时间
- API 响应时间
- 数据库查询性能

### 定期检查

建议每周检查：
- [ ] Admin 功能正常工作
- [ ] 数据准确性
- [ ] 无异常错误日志
- [ ] 性能指标正常

---

## 🔄 回滚计划

如果部署出现严重问题，可以快速回滚：

### 在 Vercel Dashboard 回滚

1. 进入项目的 "Deployments" 页面
2. 找到上一个稳定的 deployment
3. 点击 "..." 菜单
4. 选择 "Promote to Production"

### 使用 Git 回滚

```bash
# 1. 回滚到上一个 commit
git revert HEAD

# 2. 推送
git push origin main

# 3. Vercel 会自动重新部署
```

---

## 📚 相关文档

- [Admin Panel Design Document](../project/admin-panel-design.md)
- [Admin Panel User Guide](./admin-panel-guide.md)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)

---

## 🆘 获取帮助

如遇到问题：
1. 查看本文档的故障排查部分
2. 检查 Vercel 部署日志
3. 联系技术团队

---

**部署完成后，请更新此文档记录实际部署日期和遇到的问题。**

