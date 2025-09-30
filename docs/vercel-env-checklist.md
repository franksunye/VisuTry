# Vercel 环境变量配置清单

## 🚀 快速配置指南

在 Vercel Dashboard 中配置以下环境变量：

### 1️⃣ NextAuth 配置

```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_HERE
```

> ⚠️ **重要**：`NEXTAUTH_URL` 必须使用 `https://` 并匹配你的 Vercel 域名
> 生成 NEXTAUTH_SECRET: `openssl rand -base64 32`

### 2️⃣ Twitter OAuth 2.0 配置

```bash
TWITTER_CLIENT_ID=YOUR_TWITTER_CLIENT_ID_HERE
TWITTER_CLIENT_SECRET=YOUR_TWITTER_CLIENT_SECRET_HERE
```

> ✅ 这是 **OAuth 2.0** 的凭证（不是 OAuth 1.0a）

### 3️⃣ 数据库配置

```bash
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

### 4️⃣ API Keys

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
BLOB_READ_WRITE_TOKEN=YOUR_VERCEL_BLOB_TOKEN_HERE
```

### 5️⃣ Stripe 配置

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```

### 6️⃣ 应用配置

```bash
FREE_TRIAL_LIMIT=3
```

---

## ❌ 不要设置的环境变量

以下变量**仅用于本地开发**，**不要**在 Vercel 上设置：

```bash
# ❌ 不要设置
HTTP_PROXY=...
HTTPS_PROXY=...
ENABLE_PROXY=...
ENABLE_MOCKS=...
NODE_ENV=...  # Vercel 会自动设置
```

---

## 📋 Twitter App 回调 URL 配置

在 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) 中：

1. 进入你的 App 设置
2. 找到 **User authentication settings**
3. 在 **Callback URI / Redirect URL** 中添加：

```
https://visutry.vercel.app/api/auth/callback/twitter
```

> 💡 **提示**：可以同时保留本地开发的回调 URL：
> - `http://localhost:3000/api/auth/callback/twitter` （本地）
> - `https://visutry.vercel.app/api/auth/callback/twitter` （生产）

---

## 🔧 Vercel 配置步骤

### 步骤 1：进入项目设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择 **VisuTry** 项目
3. 点击 **Settings** 标签
4. 选择左侧的 **Environment Variables**

### 步骤 2：添加环境变量

对于每个环境变量：

1. 在 **Key** 输入框中输入变量名（例如：`NEXTAUTH_URL`）
2. 在 **Value** 输入框中输入变量值
3. 选择环境：
   - ✅ **Production** （必选）
   - ✅ **Preview** （推荐）
   - ⬜ **Development** （可选，本地开发用 `.env.local`）
4. 点击 **Add** 按钮

### 步骤 3：重新部署

添加所有环境变量后：

1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋯** 菜单
4. 选择 **Redeploy**
5. 确认重新部署

---

## ✅ 验证部署

部署完成后，访问你的网站测试 Twitter 登录：

```
https://visutry.vercel.app
```

### 测试步骤：

1. 点击 **"Sign in with Twitter"** 按钮
2. 应该跳转到 Twitter 授权页面
3. 点击 **"Authorize app"**
4. 应该成功回调并登录

### 如果出现错误：

1. 检查 Vercel 的 **Functions** 日志（Deployments → 点击部署 → Functions 标签）
2. 确认所有环境变量都已正确设置
3. 确认 Twitter App 的回调 URL 与 `NEXTAUTH_URL` 匹配
4. 确认使用的是 **OAuth 2.0** 凭证（不是 OAuth 1.0a）

---

## 📊 环境变量对比表

| 变量名 | 本地开发 | Vercel 生产 | 说明 |
|--------|---------|------------|------|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://visutry.vercel.app` | 必须匹配实际域名 |
| `NEXTAUTH_SECRET` | ✅ 相同 | ✅ 相同 | 保持一致 |
| `TWITTER_CLIENT_ID` | ✅ OAuth 2.0 | ✅ OAuth 2.0 | 使用 OAuth 2.0 凭证 |
| `TWITTER_CLIENT_SECRET` | ✅ OAuth 2.0 | ✅ OAuth 2.0 | 使用 OAuth 2.0 凭证 |
| `HTTP_PROXY` | ✅ 需要（中国大陆） | ❌ 不需要 | Vercel 在国外 |
| `HTTPS_PROXY` | ✅ 需要（中国大陆） | ❌ 不需要 | Vercel 在国外 |
| `ENABLE_PROXY` | ✅ 设为 `1` | ❌ 不设置 | 仅本地开发 |
| `DATABASE_URL` | ✅ 相同 | ✅ 相同 | 保持一致 |
| `GEMINI_API_KEY` | ✅ 相同 | ✅ 相同 | 保持一致 |
| `STRIPE_*` | ✅ 测试密钥 | ✅ 测试密钥 | 生产环境应使用生产密钥 |

---

## 🔍 常见问题

### Q: 为什么 Vercel 上不需要代理？

**A**: Vercel 的服务器在国外（美国、欧洲等），可以直接访问 Twitter API，不受中国防火墙限制。

### Q: 如何知道部署是否成功？

**A**: 
1. Vercel 会在 GitHub commit 上显示部署状态（✅ 或 ❌）
2. 访问 Vercel Dashboard 查看部署日志
3. 访问你的网站测试功能

### Q: 环境变量更新后需要重新部署吗？

**A**: 是的！环境变量更新后必须重新部署才能生效。

### Q: 如何查看 Vercel 的错误日志？

**A**: 
1. 进入 Vercel Dashboard
2. 选择项目 → Deployments
3. 点击最新部署
4. 查看 **Functions** 标签（Serverless Functions 日志）
5. 查看 **Build Logs** 标签（构建日志）

---

## 📚 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js 部署指南](https://next-auth.js.org/deployment)
- [Twitter OAuth 2.0 文档](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [完整部署指南](./vercel-deployment.md)

---

## ✨ 部署成功后

恭喜！你的应用已成功部署到 Vercel。现在你可以：

- ✅ 使用 Twitter OAuth 2.0 登录
- ✅ 上传照片进行 AI 眼镜试戴
- ✅ 分享试戴结果到社交媒体
- ✅ 享受 3 次免费试戴

如有问题，请查看 [完整部署指南](./vercel-deployment.md) 或联系技术支持。

