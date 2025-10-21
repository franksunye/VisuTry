# Middleware 测试计划

## 问题诊断

从 `/api/check-session` 的返回可以看到：
- ✅ JWT Token role: "USER" - 正确
- ✅ Server Session role: "USER" - 正确
- ❌ 但是用户仍然可以访问 `/admin/dashboard`

**结论：Middleware 根本没有运行！**

## 修复内容

### 问题原因
之前的 matcher 配置：
```javascript
matcher: ['/admin', '/admin/:path*']
```

这个配置在某些 Next.js 14 + Vercel 的环境中可能不工作。

### 解决方案
改用 Next.js 官方推荐的 matcher 模式：
```javascript
matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
```

这个模式：
- ✅ 匹配所有路由（包括 /admin）
- ✅ 排除 API 路由和静态文件
- ✅ 在 Vercel 上更可靠

## 测试步骤

### 等待部署完成
1. 等待 1-2 分钟让 Vercel 完成部署
2. 检查 Vercel 部署状态：https://vercel.com/franksunye/visutry

### 测试 1: 测试路由（验证 middleware 运行）
访问：
```
https://www.visutry.com/test-middleware
```

**预期结果：**
- ❌ 不应该看到测试页面
- ✅ 应该被重定向到首页，URL 变成 `/?blocked=true`
- ✅ Vercel 日志中应该看到：
  ```
  [Middleware] Invoked for path: /test-middleware
  [Middleware] TEST ROUTE - Blocking access to /test-middleware
  ```

**如果看到测试页面：** Middleware 仍然没有运行

### 测试 2: Admin 访问（USER 角色）
使用 Twitter 账号登录后，访问：
```
https://www.visutry.com/admin/dashboard
```

**预期结果：**
- ❌ 不应该看到 admin dashboard
- ✅ 应该被重定向到首页，URL 变成 `/?error=Forbidden`
- ✅ Vercel 日志中应该看到：
  ```
  [Middleware] Invoked for path: /admin/dashboard
  [Admin Middleware] Access attempt: { ..., userRole: 'USER' }
  [Admin Middleware] Access DENIED - User role: USER
  ```

### 测试 3: Admin 访问（ADMIN 角色）
使用 franksunye@hotmail.com 登录后，访问：
```
https://www.visutry.com/admin/dashboard
```

**预期结果：**
- ✅ 应该能看到 admin dashboard
- ✅ Vercel 日志中应该看到：
  ```
  [Middleware] Invoked for path: /admin/dashboard
  [Admin Middleware] Access attempt: { ..., userRole: 'ADMIN' }
  [Admin Middleware] Access GRANTED - Admin user: franksunye@hotmail.com
  ```

## 如何查看 Vercel 日志

### 方法 1: Runtime Logs
1. 访问：https://vercel.com/franksunye/visutry
2. 点击 "Logs" 标签
3. 选择 "Runtime Logs"
4. 在过滤器中选择 "All" 或 "Edge"
5. 访问测试 URL
6. 刷新日志页面

### 方法 2: Real-time Logs
1. 访问：https://vercel.com/franksunye/visutry
2. 点击 "Logs" 标签
3. 点击右上角 "Real-time" 按钮
4. 保持页面打开
5. 在另一个标签访问测试 URL
6. 实时查看日志输出

## 预期日志示例

### 成功的 Middleware 日志：
```
[Middleware] Invoked for path: /admin/dashboard
[Middleware] Full URL: https://www.visutry.com/admin/dashboard
[Middleware] Method: GET
[Admin Middleware] Access attempt: {
  pathname: '/admin/dashboard',
  hasSession: true,
  userEmail: null,
  userRole: 'USER',
  timestamp: '2025-10-21T09:32:13.323Z'
}
[Admin Middleware] Access DENIED - User role: USER Email: null
```

### 失败的情况（没有日志）：
如果完全看不到 `[Middleware]` 开头的日志，说明：
1. Middleware 文件没有被部署
2. Matcher 配置仍然有问题
3. Vercel 配置有问题

## 如果仍然失败

如果修改后 middleware 仍然不运行，可能需要：

### 选项 1: 检查 Vercel 部署
```bash
# 在 Vercel 部署详情中，检查 "Source" 标签
# 确认 middleware.ts 文件存在
```

### 选项 2: 强制重新部署
```bash
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### 选项 3: 清除 Vercel 缓存
在 Vercel 项目设置中：
1. Settings → General
2. 找到 "Build & Development Settings"
3. 清除构建缓存

## 下一步

请按照上述测试步骤操作，并告诉我：
1. 测试 1 的结果（/test-middleware）
2. 测试 2 的结果（USER 访问 admin）
3. Vercel 日志中是否出现 `[Middleware]` 日志

这将帮助我们确认 middleware 是否开始工作。

