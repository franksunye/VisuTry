# 自定义域名配置指南

本指南帮助你将 VisuTry 从 `visutry.vercel.app` 迁移到自定义域名 `visutry.com`。

## 📋 配置清单

### 1. DNS 配置（在域名注册商）

#### 方式 1：使用 A 记录（推荐）

在你的域名注册商（如 GoDaddy、Namecheap、Cloudflare 等）添加以下 DNS 记录：

```
类型: A
名称: @
值: 76.76.21.21
TTL: 自动或 3600
```

```
类型: CNAME
名称: www
值: cname.vercel-dns.com
TTL: 自动或 3600
```

#### 方式 2：使用 CNAME（备选）

```
类型: CNAME
名称: @
值: cname.vercel-dns.com
TTL: 自动或 3600
```

**注意**：某些域名注册商不支持根域名（@）使用 CNAME，此时请使用方式 1。

---

### 2. Vercel 项目配置

#### 步骤 1：添加域名

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的 VisuTry 项目
3. 进入 **Settings** → **Domains**
4. 点击 **Add Domain**
5. 输入 `visutry.com`，点击 **Add**
6. 重复步骤添加 `www.visutry.com`

#### 步骤 2：设置主域名

- 选择 `visutry.com` 作为主域名
- 设置 `www.visutry.com` 重定向到 `visutry.com`

#### 步骤 3：等待 DNS 验证

- Vercel 会自动验证 DNS 配置
- 通常需要 5-30 分钟
- 验证成功后会自动配置 SSL 证书

---

### 3. Vercel 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 中更新：

#### 生产环境（Production）

```bash
NEXT_PUBLIC_SITE_URL=https://visutry.com
NEXTAUTH_URL=https://visutry.com
```

#### 预览环境（Preview）- 可选

```bash
NEXT_PUBLIC_SITE_URL=https://visutry.com
NEXTAUTH_URL=https://visutry.com
```

#### 开发环境（Development）- 保持不变

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

**重要**：修改环境变量后需要重新部署项目！

---

### 4. 第三方服务配置

#### Twitter OAuth

1. 登录 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. 选择你的应用
3. 进入 **Settings** → **User authentication settings**
4. 更新 **Callback URLs**：
   ```
   https://visutry.com/api/auth/callback/twitter
   ```
5. 更新 **Website URL**：
   ```
   https://visutry.com
   ```

#### Stripe Webhook

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** → **Webhooks**
3. 找到现有的 webhook 或创建新的
4. 更新 **Endpoint URL**：
   ```
   https://visutry.com/api/payment/webhook
   ```
5. 确保监听以下事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

#### Google Search Console（可选但推荐）

1. 登录 [Google Search Console](https://search.google.com/search-console)
2. 添加新的资源：`https://visutry.com`
3. 验证所有权（使用 HTML 标签或 DNS 验证）
4. 提交 sitemap：`https://visutry.com/sitemap.xml`

---

### 5. 代码修改（已完成）

以下文件已经更新为使用 `visutry.com`：

✅ `.env.example` - 环境变量示例
✅ `next-sitemap.config.js` - Sitemap 配置
✅ `public/robots.txt` - 搜索引擎爬虫配置
✅ `src/lib/seo.ts` - SEO 配置
✅ `src/app/sitemap.ts` - 动态 sitemap
✅ `src/lib/blog.ts` - 博客 sitemap

**需要手动检查的文件**：
- `src/app/auth/error/page.tsx` - Twitter 回调 URL 提示信息

---

## 🚀 部署步骤

### 1. 提交代码更改

```bash
git add .
git commit -m "chore: update domain to visutry.com"
git push origin main
```

### 2. 触发 Vercel 部署

- 推送到 main 分支会自动触发部署
- 或在 Vercel Dashboard 手动触发部署

### 3. 验证部署

部署完成后，访问以下 URL 验证：

- ✅ https://visutry.com - 主页
- ✅ https://www.visutry.com - 应重定向到主域名
- ✅ https://visutry.com/sitemap.xml - Sitemap
- ✅ https://visutry.com/robots.txt - Robots.txt
- ✅ https://visutry.com/api/health - 健康检查（如果有）

---

## 🔍 故障排查

### DNS 未生效

**症状**：访问 visutry.com 显示"域名未解析"或"找不到服务器"

**解决方案**：
1. 检查 DNS 记录是否正确配置
2. 使用 [DNS Checker](https://dnschecker.org/) 检查全球 DNS 传播状态
3. 等待 DNS 传播（最多 48 小时，通常 5-30 分钟）
4. 清除本地 DNS 缓存：
   ```bash
   # Windows
   ipconfig /flushdns
   
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL 证书问题

**症状**：浏览器显示"不安全"或 SSL 错误

**解决方案**：
1. 在 Vercel Dashboard 检查 SSL 证书状态
2. 确保 DNS 已正确配置
3. 等待 Vercel 自动配置 SSL（通常几分钟）
4. 如果超过 1 小时仍未配置，联系 Vercel 支持

### 环境变量未生效

**症状**：网站仍显示旧域名或功能异常

**解决方案**：
1. 确认在 Vercel Dashboard 中已更新环境变量
2. **重新部署项目**（环境变量修改后必须重新部署）
3. 清除浏览器缓存
4. 使用无痕模式测试

### OAuth 回调失败

**症状**：Twitter 登录失败，显示回调错误

**解决方案**：
1. 检查 Twitter Developer Portal 中的回调 URL
2. 确保 `NEXTAUTH_URL` 环境变量正确
3. 检查 `NEXTAUTH_SECRET` 是否设置
4. 重新部署项目

### Stripe Webhook 失败

**症状**：支付完成但用户状态未更新

**解决方案**：
1. 检查 Stripe Dashboard 中的 webhook URL
2. 查看 Stripe webhook 日志
3. 确保 `STRIPE_WEBHOOK_SECRET` 正确
4. 测试 webhook endpoint：`https://visutry.com/api/payment/webhook`

---

## 📊 监控和维护

### 定期检查

- [ ] 每周检查 SSL 证书有效期
- [ ] 每月检查 DNS 记录状态
- [ ] 监控 Vercel 部署日志
- [ ] 检查 Google Search Console 索引状态

### 性能优化

- 启用 Vercel Analytics
- 配置 CDN 缓存策略
- 监控 Core Web Vitals

---

## 🔗 相关资源

- [Vercel 域名配置文档](https://vercel.com/docs/concepts/projects/domains)
- [DNS 配置指南](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [SSL 证书说明](https://vercel.com/docs/concepts/projects/domains/ssl)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ 配置完成检查清单

- [ ] DNS A 记录已添加
- [ ] DNS CNAME 记录已添加（www）
- [ ] Vercel 项目已添加域名
- [ ] Vercel 环境变量已更新
- [ ] 代码已提交并部署
- [ ] Twitter OAuth 回调 URL 已更新
- [ ] Stripe Webhook URL 已更新
- [ ] SSL 证书已自动配置
- [ ] 主域名可正常访问
- [ ] www 子域名重定向正常
- [ ] Sitemap 可访问
- [ ] Robots.txt 可访问
- [ ] 登录功能正常
- [ ] 支付功能正常
- [ ] Google Search Console 已配置

---

**最后更新**: 2025-10-16
**维护者**: VisuTry Team

