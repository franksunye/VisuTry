# Async Try-On Implementation Plan (GrsAi + Vercel)

## Objective
Implement a Vercel-compatible asynchronous virtual try-on flow using the GrsAi API. This architecture overcomes Vercel Serverless function timeout limits (10-60s) by splitting the submission and result polling into separate client-driven requests.

## Service分级 Strategy (SaaS 服务分级)

### 付费用户 (Premium Users)
- **服务**: 原生 Gemini 实时服务
- **体验**: 实时处理 (<10秒)
- **优势**: 最佳用户体验，即时反馈

### 免费用户 (Free Users)  
- **服务**: GrsAi 异步服务
- **体验**: 异步处理 (10-60秒)
- **优势**: 成本优化，支持更多用户

## Architecture

### 1. Current (Synchronous) - *To be replaced*
- Client sends `POST /api/try-on` with images.
- Server keeps connection open, uploads images, calls GrsAi, waits for generation.
- Server returns image result.
- **Problem**: GrsAi generation can take >10s (queueing), leading to Vercel 504 Gateway Timeouts.

### 2. New (Asynchronous) - *Target*
- **Step 1: Submission**
  - Client sends `POST /api/try-on/submit` with images.
  - Server:
    - Validates Auth & Quota.
    - **Service Routing**: 根据用户付费状态选择服务 (Gemini/GrsAi)
    - Uploads images (or converts to Data URI).
    - Calls GrsAi `/v1/draw/nano-banana` with `webHook="-1"`.
    - Returns `{ taskId: "...", status: "submitted", serviceType: "grsai" }` immediately (< 3s).

- **Step 2: Polling (Client-Side)**
  - Client receives `taskId`.
  - Client enters a polling loop (every 2-3s).
  - Client calls `POST /api/try-on/poll` with `{ taskId }`.
  - Server calls GrsAi `/v1/draw/result` (POST).
  - Server returns status (`processing`, `succeeded`, `failed`).
  - If `succeeded`, Server handles post-processing (save to DB, deduct quota) and returns final image URL.

## Database Requirements

### 当前状态 (No Major Changes Needed)
现有的 `TryOnTask` 模型已支持异步任务持久化：
- ✅ `status` - 任务状态管理
- ✅ `userImageUrl`, `itemImageUrl`, `resultImageUrl` - 输入输出存储
- ✅ `errorMessage` - 错误处理
- ✅ `userId` - 用户关联
- ✅ `createdAt`, `updatedAt` - 时间追踪
- ✅ `metadata` Json - 扩展数据存储

### 可选优化字段
```prisma
// 在 TryOnTask 模型中添加：
progress        Int      @default(0)    // 进度百分比 (0-100)
estimatedTime   Int?     // 预计剩余时间（秒）
serviceType     String?  // 服务类型: "gemini" 或 "grsai"
isAsync         Boolean  @default(false) // 是否为异步任务
```

## Component Changes

### 1. Service Layer: `src/lib/tryon-service.ts` (New)
- **Purpose**: 统一服务分发层，根据用户付费状态路由到不同服务
- **Methods**:
  - `submitTryOnTask(user, userImage, itemImage, type)`: 返回 `{ taskId, serviceType, isAsync }`
  - `getTryOnResult(taskId)`: 返回状态和结果

### 2. GrsAi Service: `src/lib/grsai.ts` (New)
- **Purpose**: 封装 GrsAi API 异步交互
- **Methods**:
  - `submitAsyncTask(userImageUrl, itemImageUrl, prompt)`: 返回 `taskId`
  - `pollTaskResult(taskId)`: 返回状态和结果
  - Helper: `fileToDataUri` (如需直接提交)

### 3. API Endpoints
- **`src/app/api/try-on/submit/route.ts` (New)**
  - Handle file upload
  - Call `tryon-service.submitTryOnTask`
  - Return `{ taskId, serviceType, isAsync }`
- **`src/app/api/try-on/poll/route.ts` (New)**
  - Input: `taskId`
  - Call `tryon-service.getTryOnResult`
  - Return status/image
- **`src/app/api/try-on/route.ts` (Refactor)**
  - 保持向后兼容，但前端将切换到新端点

### 4. Frontend: `src/components/try-on/TryOnInterface.tsx`
- **State Management**: 添加 `taskId`, `pollingStatus`, `serviceType` 状态
- **Service分级 UI**: 显示当前使用的服务类型（Gemini 实时 / GrsAi 异步）
- **Polling Logic**:
  - `handleTryOn`: 调用 `/api/try-on/submit`
  - 设置 `taskId`, 开始轮询
  - `pollResult` (useEffect 或递归函数):
    - 调用 `/api/try-on/poll`
    - 如果 `processing`: 等待 2s, 递归
    - 如果 `success`: 更新 UI, 停止轮询
    - 如果 `failed`: 显示错误, 停止轮询

## 用户中断处理 (User Interruption Handling)

### 完美体验设计
1. **任务持久化**: 所有任务自动保存到数据库
2. **页面恢复**: 用户重新打开页面时检查未完成任务
3. **恢复提示**: 显示"继续您的虚拟试穿"模态框
4. **进度跟踪**: 显示上次的进度百分比
5. **资源优化**: 自动清理过期任务

### 前端恢复逻辑
```typescript
// 页面加载时检查未完成任务
useEffect(() => {
  checkPendingTasks();
}, []);

const checkPendingTasks = async () => {
  const response = await fetch('/api/try-on/pending-tasks');
  const tasks = await response.json();
  if (tasks.length > 0) {
    setRecoveryTask(tasks[0]); // 显示恢复模态框
  }
};
```

## Implementation Steps

1.  **Setup**: 创建功能分支 `feature/async-grsai-tryon`
2.  **Service Layer**: 实现 `src/lib/tryon-service.ts` 统一服务分发
3.  **GrsAi Service**: 实现 `src/lib/grsai.ts` 异步支持
4.  **Backend - Submit**: 创建 `api/try-on/submit/route.ts`
5.  **Backend - Poll**: 创建 `api/try-on/poll/route.ts`
6.  **Frontend**: 更新 `TryOnInterface.tsx` 支持异步轮询和服务分级UI
7.  **用户中断处理**: 实现任务恢复功能
8.  **Cleanup**: 移除不再需要的遗留同步代码

## Testing Strategy
- **Unit**: 使用模拟响应测试 `tryon-service.ts` 和 `grsai.ts`
- **Integration**: 使用 `scripts/test-grsai-poll-only.ts` 逻辑验证 API 连通性
- **E2E**: 在 localhost 上手动测试完整流程

## 环境变量配置
```bash
# GrsAi 配置
GRSAI_API_KEY=your_grsai_api_key
GRSAI_BASE_URL=https://grsai.dakka.com.cn

# 服务选择配置
ENABLE_SERVICE_TIERING=true
GEMINI_PREMIUM_ONLY=true
```

## 预计时间线
- Phase 1: 基础异步架构 (2-3天)
- Phase 2: 服务分级实现 (1-2天)  
- Phase 3: 用户中断处理 (1天)
- Phase 4: 测试和优化 (1-2天)