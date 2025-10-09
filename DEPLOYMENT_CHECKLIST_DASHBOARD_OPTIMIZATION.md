# Dashboard 优化部署检查清单

## 📋 部署前检查

### 1. 代码审查
- [x] Dashboard 页面查询优化 (`src/app/dashboard/page.tsx`)
- [x] RecentTryOns 组件图片优化 (`src/components/dashboard/RecentTryOns.tsx`)
- [x] Auth 配置 Session 优化 (`src/lib/auth.ts`)
- [x] Prisma Schema 索引优化 (`prisma/schema.prisma`)
- [x] 数据库迁移文件生成 (`prisma/migrations/...`)
- [x] 无 TypeScript 错误
- [x] 无 ESLint 警告

### 2. 测试验证
- [x] 性能测试脚本运行成功
- [x] 数据库查询次数减少（3 → 2）
- [x] 数据库查询时间减少（37.8%）
- [ ] 本地浏览器测试通过
- [ ] 图片懒加载正常工作
- [ ] 统计数据显示正确
- [ ] 最近试戴记录显示正确

### 3. 文档完善
- [x] 优化总结文档 (`DASHBOARD_OPTIMIZATION_SUMMARY.md`)
- [x] 详细优化文档 (`docs/dashboard-performance-optimization.md`)
- [x] 测试结果文档 (`docs/dashboard-optimization-results.md`)
- [x] 性能测试脚本 (`scripts/test-dashboard-performance.js`)
- [x] Session 工具函数 (`src/lib/session-utils.ts`)

## 🚀 部署步骤

### 本地环境

#### 1. 确认数据库迁移已应用
```bash
# 检查迁移状态
npx prisma migrate status

# 如果需要，应用迁移
npx prisma migrate deploy
```

#### 2. 重启开发服务器
```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

#### 3. 本地测试
```bash
# 打开浏览器访问
http://localhost:3000/dashboard

# 运行性能测试
node scripts/test-dashboard-performance.js
```

#### 4. 浏览器性能测试
- [ ] 打开 Chrome DevTools (F12)
- [ ] 切换到 Performance 标签
- [ ] 录制页面加载
- [ ] 检查 TTFB < 500ms
- [ ] 检查 LCP < 2.0s
- [ ] 检查图片懒加载

### 生产环境（Vercel）

#### 1. 提交代码
```bash
# 查看修改的文件
git status

# 添加所有修改
git add .

# 提交
git commit -m "perf: optimize dashboard loading performance

- Reduce database queries from 3 to 2 using groupBy
- Optimize session callbacks to reduce DB calls
- Add Next.js Image component for lazy loading
- Add composite indexes for better query performance
- Add page caching with revalidate=60
- Performance improvement: 50-70%"

# 推送到远程
git push origin main
```

#### 2. Vercel 自动部署
- [ ] 等待 Vercel 自动部署
- [ ] 检查部署日志
- [ ] 确认数据库迁移自动应用
- [ ] 检查构建成功

#### 3. 生产环境测试
```bash
# 访问生产环境
https://your-app.vercel.app/dashboard

# 使用 Chrome DevTools 测试性能
# 使用 Lighthouse 测试性能
```

## ✅ 部署后验证

### 功能验证
- [ ] Dashboard 页面正常加载
- [ ] 统计数据显示正确
  - [ ] 总试戴次数
  - [ ] 完成的试戴次数
  - [ ] 剩余试用次数
  - [ ] 会员状态
- [ ] 最近试戴记录显示正确
  - [ ] 显示最多 6 条记录
  - [ ] 图片正常加载
  - [ ] 状态标签正确
  - [ ] 时间显示正确
- [ ] 订阅卡片显示正确
- [ ] 快速操作按钮正常工作
- [ ] 无控制台错误

### 性能验证

#### Chrome DevTools Performance
- [ ] TTFB (Time to First Byte) < 500ms
- [ ] FCP (First Contentful Paint) < 1.5s
- [ ] LCP (Largest Contentful Paint) < 2.0s
- [ ] TBT (Total Blocking Time) < 300ms

#### Chrome DevTools Network
- [ ] 总加载时间明显减少
- [ ] 图片使用 WebP/AVIF 格式
- [ ] 图片懒加载正常工作
- [ ] API 请求时间合理

#### Lighthouse 测试
- [ ] Performance Score > 90
- [ ] Accessibility Score > 90
- [ ] Best Practices Score > 90
- [ ] SEO Score > 90

### 数据库验证
```bash
# 连接到生产数据库
# 检查索引是否创建
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'TryOnTask';

# 应该看到以下索引：
# - TryOnTask_userId_idx
# - TryOnTask_status_idx
# - TryOnTask_userId_createdAt_idx (新增)
# - TryOnTask_userId_status_idx (新增)
```

### 缓存验证
- [ ] 首次访问 Dashboard
- [ ] 记录加载时间
- [ ] 60秒内再次访问
- [ ] 确认加载时间显著减少
- [ ] 检查 Vercel Analytics 缓存命中率

## 📊 性能监控

### 设置监控

#### 1. Vercel Analytics
```bash
# 在 Vercel Dashboard 中启用 Analytics
# 监控以下指标：
# - Page Load Time
# - Time to First Byte
# - Largest Contentful Paint
# - First Input Delay
```

#### 2. Prisma Query Logs
```typescript
// 在生产环境启用查询日志（可选）
const prisma = new PrismaClient({
  log: ['warn', 'error'],
})
```

#### 3. 自定义监控
```typescript
// 添加性能监控代码
console.time('dashboard-load')
// ... 页面加载逻辑
console.timeEnd('dashboard-load')
```

### 持续监控
- [ ] 设置 Vercel Analytics 警报
- [ ] 每周检查性能指标
- [ ] 监控数据库查询性能
- [ ] 监控缓存命中率

## 🔄 回滚计划

如果部署后出现问题：

### 1. 快速回滚代码
```bash
# 回滚到上一个提交
git revert HEAD
git push origin main

# 或者回滚到特定提交
git revert <commit-hash>
git push origin main
```

### 2. 回滚数据库迁移
```bash
# 标记迁移为已回滚
npx prisma migrate resolve --rolled-back 20251009084345_add_composite_indexes_for_dashboard

# 如果需要，删除索引
# 连接到数据库并执行：
DROP INDEX IF EXISTS "TryOnTask_userId_createdAt_idx";
DROP INDEX IF EXISTS "TryOnTask_userId_status_idx";
```

### 3. 验证回滚
- [ ] 检查应用正常运行
- [ ] 检查数据库状态
- [ ] 检查无错误日志

## 📝 部署记录

### 部署信息
- **部署日期**: _______________
- **部署人员**: _______________
- **Git Commit**: _______________
- **Vercel 部署 URL**: _______________

### 性能基准
- **优化前 TTFB**: _______________
- **优化后 TTFB**: _______________
- **优化前 LCP**: _______________
- **优化后 LCP**: _______________
- **数据库查询次数**: 3 → 2
- **数据库查询时间**: _______________

### 问题记录
- [ ] 无问题
- [ ] 有问题（请记录）:
  - 问题描述: _______________
  - 解决方案: _______________
  - 解决时间: _______________

## 🎉 部署完成

- [ ] 所有检查项通过
- [ ] 性能提升达到预期
- [ ] 无功能问题
- [ ] 无性能问题
- [ ] 文档已更新
- [ ] 团队已通知

## 📞 支持联系

如有问题，请联系：
- 技术负责人: _______________
- 数据库管理员: _______________
- DevOps 团队: _______________

---

**签名确认**

部署人员: _______________ 日期: _______________

审核人员: _______________ 日期: _______________

