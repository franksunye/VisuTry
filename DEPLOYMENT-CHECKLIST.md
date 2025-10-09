# 🚀 Vercel OAuth 修复部署清单

## 📋 问题总结

**错误**: Twitter OAuth 在 Vercel 上失败,错误代码 P6001
```
Error validating datasource `db`: the URL must start with the protocol `prisma://`
```

**根本原因**: 
1. ✅ `vercel.json` 中设置了 `PRISMA_GENERATE_DATAPROXY=true`,但没有使用 Data Proxy URL
2. ✅ NextAuth API route 没有明确指定 Node.js runtime

## ✅ 已完成的修复

### 1. 修复 `vercel.json`
- ✅ 移除了 `PRISMA_GENERATE_DATAPROXY` 配置
- ✅ 保留了 30 秒的函数超时设置

### 2. 修复 NextAuth API Route
- ✅ 添加了 `export const runtime = 'nodejs'`
- ✅ 添加了 `export const dynamic = 'force-dynamic'`

### 3. 改进 Proxy Setup
- ✅ 增强了 Vercel 环境检测
- ✅ 确保代理只在本地开发环境启用

### 4. 增强错误日志
- ✅ 添加了环境变量验证
- ✅ 改进了数据库错误处理
- ✅ 添加了详细的调试日志

## 🔧 部署步骤

### 步骤 1: 提交代码更改

```bash
# 查看更改
git status

# 添加修改的文件
git add vercel.json
git add src/app/api/auth/[...nextauth]/route.ts
git add src/lib/proxy-setup.ts
git add src/lib/auth.ts
git add docs/VERCEL-OAUTH-FIX.md
git add scripts/verify-prisma-config.js
git add scripts/diagnose-vercel-oauth.js

# 提交
git commit -m "Fix: Prisma P6001 error on Vercel - Remove Data Proxy config

- Remove PRISMA_GENERATE_DATAPROXY from vercel.json
- Explicitly set Node.js runtime for NextAuth API route
- Improve Vercel environment detection in proxy setup
- Add comprehensive error logging and diagnostics

Fixes Twitter OAuth callback error on Vercel production"

# 推送到远程
git push origin main
```

### 步骤 2: 验证 Vercel 环境变量

访问: https://vercel.com/franksunye/visutry/settings/environment-variables

确认以下环境变量已正确设置:

#### ✅ 必需的环境变量
- [ ] `NEXTAUTH_URL` = `https://visutry.vercel.app` (无尾部斜杠)
- [ ] `NEXTAUTH_SECRET` = (你的密钥)
- [ ] `TWITTER_CLIENT_ID` = (你的 Twitter Client ID)
- [ ] `TWITTER_CLIENT_SECRET` = (你的 Twitter Client Secret)
- [ ] `DATABASE_URL` = `postgresql://...` (Neon 数据库连接字符串)

#### ❌ 不应该存在的环境变量
- [ ] `HTTP_PROXY` - 应该删除
- [ ] `HTTPS_PROXY` - 应该删除
- [ ] `ENABLE_PROXY` - 应该删除
- [ ] `PRISMA_GENERATE_DATAPROXY` - 应该删除

### 步骤 3: 等待部署完成

1. 访问: https://vercel.com/franksunye/visutry/deployments
2. 等待最新部署完成 (通常 2-3 分钟)
3. 检查部署日志,确保没有错误

### 步骤 4: 测试 OAuth 登录

1. 访问: https://visutry.vercel.app
2. 点击 "Sign in with Twitter"
3. 在 Twitter 授权页面点击 "Authorize app"
4. 应该成功重定向回应用并登录

### 步骤 5: 验证功能

登录成功后,验证:
- [ ] 用户信息正确显示
- [ ] 可以访问需要登录的功能
- [ ] Session 持久化 (刷新页面仍然登录)
- [ ] 数据库中创建了用户记录

## 🔍 故障排查

### 如果部署后仍然失败:

#### 1. 检查 Vercel 函数日志
```
访问: https://vercel.com/franksunye/visutry/logs
筛选: 只看 /api/auth 相关的日志
查找: 任何错误或警告信息
```

#### 2. 启用 NextAuth 调试模式
在 Vercel 环境变量中添加:
```
NEXTAUTH_DEBUG=true
```
然后重新部署,查看详细日志

#### 3. 验证 Twitter Developer Portal
访问: https://developer.twitter.com/en/portal/dashboard

确认:
- [ ] Callback URL 包含: `https://visutry.vercel.app/api/auth/callback/twitter`
- [ ] OAuth 2.0 已启用
- [ ] App permissions 至少为 "Read"
- [ ] Client ID 和 Secret 与 Vercel 环境变量匹配

#### 4. 测试数据库连接
```bash
# 本地测试数据库连接
npx prisma db pull

# 如果失败,检查 DATABASE_URL 是否正确
```

#### 5. 检查 Neon 数据库状态
访问: https://console.neon.tech
- 检查数据库是否在线
- 检查连接限制是否达到
- 检查是否有任何警告或错误

## 📊 预期结果

### 部署成功的标志:
✅ Vercel 部署状态显示 "Ready"
✅ 没有构建错误
✅ 函数日志中看到环境验证通过:
```
✅ NextAuth Environment Check:
  - NODE_ENV: production
  - NEXTAUTH_URL: https://visutry.vercel.app
  - VERCEL: Yes
  - Database: Configured
  - Twitter OAuth: Configured
```

### OAuth 成功的标志:
✅ 点击 "Sign in with Twitter" 后跳转到 Twitter
✅ 授权后成功返回应用
✅ 用户信息正确显示
✅ 没有 P6001 错误
✅ 没有 adapter_error

## 🆘 如果问题仍然存在

### 联系支持或进一步调查:

1. **收集信息**:
   - Vercel 部署 URL
   - 完整的错误日志 (从 Vercel 函数日志)
   - Twitter Developer Portal 截图
   - Vercel 环境变量列表 (隐藏敏感信息)

2. **运行诊断脚本**:
   ```bash
   node scripts/diagnose-vercel-oauth.js
   node scripts/verify-prisma-config.js
   ```

3. **检查相关文档**:
   - `docs/VERCEL-OAUTH-FIX.md` - 详细的问题分析和解决方案
   - `TWITTER-OAUTH-PROXY-SOLUTION.md` - 本地开发代理配置

4. **备选方案**:
   如果问题仍然无法解决,考虑:
   - 使用 Prisma Data Proxy (需要额外配置)
   - 使用 Neon Serverless Driver with Adapter (更复杂但更强大)
   - 临时使用 Mock 模式进行开发

## 📝 验证清单

部署完成后,逐项检查:

- [ ] 代码已提交并推送到 GitHub
- [ ] Vercel 自动部署已完成
- [ ] 部署状态为 "Ready"
- [ ] 没有构建错误
- [ ] Vercel 环境变量已验证
- [ ] Twitter OAuth 登录成功
- [ ] 用户数据正确保存到数据库
- [ ] Session 持久化正常工作
- [ ] 没有 P6001 错误
- [ ] 函数日志中没有错误

## 🎉 成功!

如果所有检查都通过,恭喜! Twitter OAuth 现在应该在 Vercel 上正常工作了。

---

**创建日期**: 2025-01-09
**最后更新**: 2025-01-09
**状态**: 待部署

