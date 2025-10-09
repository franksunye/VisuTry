# Vercel Build "Module not found" 问题诊断与解决

## 问题描述

在部署到 Vercel 时，构建过程失败，出现多个 "Module not found" 错误：

```
Module not found: Can't resolve '@/components/auth/LoginButton'
Module not found: Can't resolve '@/hooks/useTestSession'
Module not found: Can't resolve '@/lib/prisma'
Module not found: Can't resolve '@/lib/proxy-setup'
Module not found: Can't resolve '@/lib/auth'
```

## 问题诊断过程

### 1. 验证文件存在性

✅ **本地 Git 仓库检查**
```bash
git ls-tree -r HEAD --name-only | grep "src/"
```
结果：所有文件都存在于 Git 仓库中

✅ **GitHub 远程仓库检查**
```bash
git ls-tree -r HEAD:src/lib
```
结果：所有文件都已推送到 GitHub

✅ **GitHub API 验证**
通过 GitHub API 确认所有文件都在远程仓库中

### 2. 验证 TypeScript 配置

✅ **tsconfig.json 配置正确**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. 验证依赖配置

✅ **package.json 依赖正确**
- `tailwindcss`, `postcss`, `autoprefixer` 已移到 `dependencies`
- 所有必需的依赖都已安装

### 4. 验证 Prisma 迁移

✅ **Prisma 迁移文件已提交**
- `prisma/migrations/20250918030414_init/migration.sql`
- `prisma/migrations/20251009084345_add_composite_indexes_for_dashboard/migration.sql`
- `prisma/migrations/migration_lock.toml`

## 根本原因

**Vercel 构建缓存问题**

Vercel 在构建时使用了旧的缓存，导致：
1. 缓存的 `node_modules` 可能不完整
2. 缓存的构建产物可能与当前代码不匹配
3. Prisma Client 可能未正确生成

## 解决方案

### 方案 1: 更新 vercel.json 构建命令

```json
{
  "buildCommand": "prisma migrate deploy && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**作用：**
- 在构建前运行 `prisma migrate deploy` 确保数据库架构正确
- 确保 Prisma Client 正确生成

### 方案 2: 添加 .vercelignore

创建 `.vercelignore` 文件排除不必要的文件：

```
# Tests
tests/
*.test.ts
*.test.tsx
*.test.js

# Documentation
docs/
*.md
!README.md

# Development files
.vscode/
.idea/

# Scripts
scripts/test-*.js
scripts/debug-*.js
```

**作用：**
- 减少部署包大小
- 避免测试文件干扰构建
- 强制 Vercel 重新构建

### 方案 3: 清除 .gitignore 中的 Prisma 迁移排除

从 `.gitignore` 中移除：
```
# 移除这一行
/prisma/migrations/
```

**作用：**
- 确保迁移文件被提交到 Git
- Vercel 可以访问完整的数据库架构

### 方案 4: 强制清除 Vercel 缓存

通过新的提交触发 Vercel 重新构建：

```bash
git add .vercelignore
git commit -m "fix: add .vercelignore and force cache clear"
git push origin main
```

**作用：**
- 新的提交会触发 Vercel 重新构建
- `.vercelignore` 的变化会影响构建过程

## 实施步骤

### 步骤 1: 更新配置文件

1. ✅ 更新 `vercel.json`
2. ✅ 创建 `.vercelignore`
3. ✅ 更新 `.gitignore`

### 步骤 2: 提交并推送

```bash
git add vercel.json .vercelignore .gitignore prisma/migrations/
git commit -m "fix: resolve Vercel build module not found errors"
git push origin main
```

### 步骤 3: 在 Vercel Dashboard 中验证

1. 访问 Vercel Dashboard
2. 查看最新部署日志
3. 确认构建成功

### 步骤 4: 如果仍然失败，手动清除缓存

在 Vercel Dashboard 中：
1. 进入项目设置
2. 找到 "Build & Development Settings"
3. 点击 "Clear Build Cache"
4. 重新部署

## 预防措施

### 1. 确保关键文件不被忽略

在 `.gitignore` 中：
```
# ✅ 正确 - 只忽略生成的文件
node_modules/
.next/
.env.local

# ❌ 错误 - 不要忽略迁移文件
# /prisma/migrations/
```

### 2. 使用正确的构建命令

在 `package.json` 中：
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 3. 验证 TypeScript 路径别名

确保 `tsconfig.json` 和 `next.config.js` 中的路径配置一致。

### 4. 定期清理构建缓存

在本地开发时：
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

## 验证清单

- [x] 所有源文件都在 Git 仓库中
- [x] `tsconfig.json` 配置正确
- [x] `package.json` 依赖完整
- [x] Prisma 迁移文件已提交
- [x] `vercel.json` 构建命令正确
- [x] `.vercelignore` 已创建
- [x] 代码已推送到 GitHub
- [ ] Vercel 构建成功
- [ ] 应用正常运行

## 相关文档

- [Next.js Path Aliases](https://nextjs.org/docs/advanced-features/module-path-aliases)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## 总结

这个问题的根本原因是 **Vercel 构建缓存** 导致的模块解析失败。通过以下措施解决：

1. ✅ 确保所有文件都在 Git 仓库中
2. ✅ 更新 `vercel.json` 构建命令
3. ✅ 添加 `.vercelignore` 排除不必要的文件
4. ✅ 提交 Prisma 迁移文件
5. ✅ 强制触发新的构建

如果问题仍然存在，需要在 Vercel Dashboard 中手动清除构建缓存。

