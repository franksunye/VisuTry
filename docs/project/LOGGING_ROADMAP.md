# 日志系统工作清单

## ✅ 已完成

- [x] 集成 Axiom 日志系统
- [x] 修复日志同时发送到 Vercel 和 Axiom
- [x] 迁移 try-on 路由 (57 个 console 调用)
- [x] 迁移 payment/webhook 路由 (16 个 console 调用)
- [x] 迁移 upload 路由 (3 个 console 调用)
- [x] 迁移 admin/frames 路由 (2 个 console 调用)
- [x] 迁移 admin/import 路由 (1 个 console 调用)
- [x] 迁移 lib/gemini.ts (部分，关键日志)
- [x] 迁移 lib/auth.ts (部分，关键日志)
- [x] 迁移 components/try-on/TryOnInterface.tsx (6 个 console 调用)
- [x] 迁移 payment/create-session/route.ts (2 个 console 调用)
- [x] 迁移 components/dashboard/PaymentSuccessHandler.tsx (3 个 console 调用)
- [x] 迁移 components/try-on/ResultDisplay.tsx (1 个 console 调用)
- [x] 迁移 components/upload/ImageUpload.tsx (1 个 console 调用)
- [x] 迁移 hooks/useAutoRefreshSession.ts (3 个 console 调用)

## 📋 待做

### 高优先级
- [ ] 设置 Axiom 告警规则 (30 分钟)
  - 错误告警：5 分钟内超过 10 个错误
  - 支付告警：支付失败事件
  - 性能告警：请求超时

- [ ] 添加日志上下文 (1 小时)
  - 请求 ID (requestId)
  - 用户信息 (userId)
  - 请求元数据 (url, method, ip)

### 中优先级
- [ ] 优化日志策略 (1-2 小时)
  - 实现日志采样 (info 级别 10% 采样)
  - 添加日志级别控制
  - 批量发送日志

- [ ] 迁移其他页面和组件 (可选)
  - Dashboard 相关页面
  - Admin 相关页面
  - 其他工具函数

### 低优先级
- [ ] 添加日志级别控制 (30 分钟)
- [ ] 性能监控集成 (1 小时)

## 📊 统计

- 总 console 调用数：349 行
- 已迁移：~152 行 (43.6%)
- 待迁移：~197 行 (56.4%)

### ✅ 已迁移的核心功能（完整覆盖）
- **Try-On 工作流**
  - ✅ API 路由：try-on/route.ts (59 行)
  - ✅ 前端组件：TryOnInterface.tsx (6 行)
  - ✅ 结果显示：ResultDisplay.tsx (1 行)

- **支付工作流**
  - ✅ API 路由：payment/webhook/route.ts (16 行)
  - ✅ API 路由：payment/create-session/route.ts (2 行)
  - ✅ 前端组件：PaymentSuccessHandler.tsx (3 行)

- **认证和会话**
  - ✅ 库文件：auth.ts (部分)
  - ✅ Hook：useAutoRefreshSession.ts (3 行)

- **AI 处理**
  - ✅ 库文件：gemini.ts (部分，关键日志)

- **文件上传**
  - ✅ API 路由：upload/route.ts (3 行)
  - ✅ 前端组件：ImageUpload.tsx (1 行)

## 🔗 相关文件

- Logger 系统：`src/lib/logger.ts`
- Axiom 配置：环境变量 `AXIOM_TOKEN`, `AXIOM_ORG_ID`, `AXIOM_DATASET`
- 已迁移路由：
  - `src/app/api/try-on/route.ts`
  - `src/app/api/payment/webhook/route.ts`
  - `src/app/api/upload/route.ts`
  - `src/app/api/admin/frames/route.ts`
  - `src/app/api/admin/import/route.ts`

