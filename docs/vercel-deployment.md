# Vercel 部署指南

## 环境变量配置

在 Vercel 项目设置中，需要配置以下环境变量：

### 必需的环境变量

#### NextAuth 配置
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

#### Twitter OAuth 2.0 配置
```bash
TWITTER_CLIENT_ID=your-twitter-oauth2-client-id
TWITTER_CLIENT_SECRET=your-twitter-oauth2-client-secret
```

> **重要提示**：
> - 使用 **OAuth 2.0** 的凭证（不是 OAuth 1.0a）
> - 在 Twitter Developer Portal 中，确保回调 URL 设置为：`https://your-domain.vercel.app/api/auth/callback/twitter`
> - `NEXTAUTH_URL` 必须使用 `https://`（生产环境）

#### 数据库配置
```bash
DATABASE_URL=your-postgresql-connection-string
```

#### 其他 API Keys
```bash
GEMINI_API_KEY=your-gemini-api-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

#### 应用配置
```bash
FREE_TRIAL_LIMIT=3
```

### 不需要的环境变量

以下环境变量**仅用于本地开发**，**不要**在 Vercel 上设置：

```bash
# ❌ 不要在 Vercel 上设置这些
HTTP_PROXY=...
HTTPS_PROXY=...
ENABLE_PROXY=...
ENABLE_MOCKS=...
```

## Twitter App 配置

### 回调 URL 设置

在 Twitter Developer Portal 中，需要配置以下回调 URL：

**开发环境**：
```
http://localhost:3000/api/auth/callback/twitter
```

**生产环境**：
```
https://your-domain.vercel.app/api/auth/callback/twitter
```

> **提示**：可以同时添加多个回调 URL，这样开发和生产环境都能正常工作。

### OAuth 2.0 设置

1. 在 Twitter Developer Portal 中，确保你的 App 启用了 **OAuth 2.0**
2. 设置 **Type of App** 为 **Web App**
3. 配置 **App permissions** 至少包含：
   - Read users
   - Read tweets
4. 获取 **Client ID** 和 **Client Secret**（OAuth 2.0）

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "feat: migrate to Twitter OAuth 2.0"
git push origin main
```

### 2. Vercel 自动部署

- Vercel 会自动检测到 GitHub 的推送
- 自动触发构建和部署
- 部署完成后会生成预览 URL

### 3. 配置环境变量

1. 登录 Vercel Dashboard
2. 进入项目设置 → Environment Variables
3. 添加上述所有必需的环境变量
4. 选择环境：Production, Preview, Development（根据需要）

### 4. 重新部署

配置环境变量后，需要重新部署：

1. 在 Vercel Dashboard 中，进入 Deployments
2. 点击最新部署旁边的 "..." 菜单
3. 选择 "Redeploy"

### 5. 测试

访问你的 Vercel 域名，测试 Twitter 登录功能：

```
https://your-domain.vercel.app
```

## 常见问题

### Q: 为什么要从 OAuth 1.0a 迁移到 OAuth 2.0？

**A**: Twitter/X 已将 API 域名从 `api.twitter.com` 更改为 `api.x.com`。OAuth 2.0 的实现已更新使用新域名，而 OAuth 1.0a 可能仍在使用旧域名，导致连接问题。

### Q: 本地开发需要代理，Vercel 上需要吗？

**A**: 不需要。Vercel 的服务器在国外，可以直接访问 Twitter API。代理配置仅用于本地开发（中国大陆网络环境）。

### Q: 如何获取 OAuth 2.0 凭证？

**A**: 
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. 选择你的 App
3. 进入 "Keys and tokens" 标签
4. 在 "OAuth 2.0 Client ID and Client Secret" 部分生成凭证

### Q: 回调 URL 不匹配怎么办？

**A**: 确保 Twitter App 设置中的回调 URL 与 `NEXTAUTH_URL + /api/auth/callback/twitter` 完全一致，包括协议（http/https）和域名。

## 技术细节

### OAuth 2.0 vs OAuth 1.0a

| 特性 | OAuth 2.0 | OAuth 1.0a |
|------|-----------|------------|
| API 域名 | `api.x.com` ✅ | `api.twitter.com` ⚠️ |
| 实现复杂度 | 简单 | 复杂 |
| Token 类型 | Bearer Token | OAuth Token + Secret |
| PKCE 支持 | ✅ 是 | ❌ 否 |
| 推荐使用 | ✅ 是 | ⚠️ 已过时 |

### NextAuth TwitterProvider 配置

```typescript
TwitterProvider({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  version: "2.0", // 使用 OAuth 2.0
})
```

## 相关文档

- [NextAuth.js Twitter Provider](https://next-auth.js.org/providers/twitter)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

