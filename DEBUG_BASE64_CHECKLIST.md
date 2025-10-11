# Base64 图片问题 - 系统性检查清单

## 🔍 可能导致 Base64 的所有原因

### 1. ❌ 图片域名不在白名单
- [ ] 检查 `next.config.js` 的 `remotePatterns`
- [ ] 确认所有图片域名都在白名单中

### 2. ❌ 使用了 `unoptimized` 属性
- [ ] 检查 `<Image>` 组件是否有 `unoptimized` 属性
- [ ] 检查 `next.config.js` 是否全局设置了 `unoptimized: true`

### 3. ❌ 图片 URL 格式问题
- [ ] 图片 URL 必须是绝对路径（http:// 或 https://）
- [ ] 不能是相对路径（/uploads/...）
- [ ] 不能是 data URL

### 4. ❌ `fill` 属性使用不当
- [ ] 使用 `fill` 时，父元素必须有 `position: relative`
- [ ] 父元素必须有明确的尺寸

### 5. ❌ Suspense 流式渲染问题
- [ ] 服务端组件中的 Image 可能在 Suspense 边界内
- [ ] 可能导致序列化问题

### 6. ❌ 图片加载失败
- [ ] 图片 URL 无法访问
- [ ] CORS 问题
- [ ] 网络超时

### 7. ❌ Next.js 版本问题
- [ ] 某些版本的 Next.js 有 Image 组件的 bug

### 8. ❌ Vercel 部署配置问题
- [ ] Image Optimization 功能未启用
- [ ] 配额用完

### 9. ❌ 客户端 vs 服务端组件问题
- [ ] Image 组件在服务端组件中的行为可能不同

### 10. ❌ 图片太大
- [ ] 超过 Next.js 的大小限制（默认 10MB）

