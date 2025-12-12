# GrsAi API 集成指南

> 本文档记录 VisuTry 项目中 GrsAi 服务的集成方式和 API 使用说明。

## 概述

GrsAi 是我们用于 AI 图片生成的第三方服务，主要用于处理非 Premium 用户的 Try-On 请求。

### 服务选择逻辑

| 用户类型 | 使用服务 | 处理模式 | 预计时间 |
|----------|----------|----------|----------|
| Premium 用户 | Gemini | 同步 (实时) | ~15-30秒 |
| Free 用户 | GrsAi | 异步 (轮询) | ~2-3分钟 |

相关代码: `src/lib/tryon-service.ts`

```typescript
if (ENABLE_SERVICE_TIERING && isPremiumActive) {
  serviceType = 'gemini'
  isAsync = false
} else {
  serviceType = 'grsai'
  isAsync = true
}
```

---

## API 端点

### 基础配置

```
Base URL: https://api.grsai.com (配置在 GRSAI_BASE_URL 环境变量)
Authorization: Bearer {GRSAI_API_KEY}
Content-Type: application/json
```

---

## 1. Nano Banana 绘画接口

### 端点

```
POST /v1/draw/nano-banana
```

### 响应方式

接口支持三种响应模式：

| 模式 | webHook 参数 | 说明 |
|------|-------------|------|
| **流式响应** | 不填 / 空 | 默认模式，接口以 Stream 方式实时返回进度和结果 |
| **回调模式** | URL 地址 | 进度和结果通过 POST 请求发送到指定 URL |
| **轮询模式** ✅ | `"-1"` | 立即返回任务 ID，后续通过 `/v1/draw/result` 轮询获取结果 |

> ⚠️ **我们使用轮询模式** (`webHook: "-1"`)，因为 Vercel Serverless 有 60 秒超时限制，而 GrsAi 处理可能需要 2-3 分钟。

### 请求参数

```json
{
  "model": "nano-banana-fast",
  "prompt": "提示词",
  "aspectRatio": "auto",
  "imageSize": "1K",
  "urls": [
    "data:image/jpeg;base64,..." ,
    "data:image/jpeg;base64,..."
  ],
  "webHook": "-1",
  "shutProgress": false
}
```

#### 参数说明

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `model` | ✅ | string | 支持: `nano-banana-fast`, `nano-banana`, `nano-banana-pro`, `nano-banana-pro-vt` |
| `prompt` | ✅ | string | 提示词 |
| `urls` | 选填 | array | 参考图 URL 或 Base64 数据 |
| `aspectRatio` | 选填 | string | 输出比例: `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4` 等，默认 `auto` |
| `imageSize` | 选填 | string | 输出大小 (仅 nano-banana-pro): `1K`, `2K`, `4K`，默认 `1K` |
| `webHook` | 选填 | string | 回调 URL 或 `"-1"` 表示轮询模式 |
| `shutProgress` | 选填 | boolean | 是否关闭进度回复，默认 `false` |

### 响应 (webHook="-1" 模式)

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "4-33f51f6f-de39-46ce-adbc-8d6b6a423ced"
  }
}
```

- `code`: 状态码，0 表示成功
- `data.id`: GrsAi 任务 ID，用于后续轮询

---

## 2. 获取结果接口

### 端点

```
POST /v1/draw/result
```

### 请求参数

```json
{
  "id": "4-33f51f6f-de39-46ce-adbc-8d6b6a423ced"
}
```

### 响应参数

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "4-33f51f6f-de39-46ce-adbc-8d6b6a423ced",
    "results": [
      {
        "url": "https://file65.grsai.com/file/xxx.png",
        "content": "图片描述内容"
      }
    ],
    "progress": 100,
    "status": "succeeded",
    "failure_reason": "",
    "error": ""
  }
}
```

#### 状态说明

| status | 说明 |
|--------|------|
| `running` | 任务进行中 |
| `succeeded` | 任务成功 |
| `failed` | 任务失败 |

#### 失败原因 (failure_reason)

| 值 | 说明 |
|------|------|
| `output_moderation` | 输出内容违规 |
| `input_moderation` | 输入内容违规 |
| `error` | 其他错误 |

> 💡 当报错或违规不出图时，GrsAi 会返还积分。触发 "error" 时可尝试重新提交任务。

---

## 项目中的实现

### 核心文件

| 文件 | 说明 |
|------|------|
| `src/lib/grsai.ts` | GrsAi API 封装 |
| `src/lib/tryon-service.ts` | Try-On 服务层，处理服务选择和任务管理 |
| `src/app/api/try-on/submit/route.ts` | 提交 Try-On 任务的 API 端点 |
| `src/app/api/try-on/poll/route.ts` | 轮询任务状态的 API 端点 |

### 关键函数

#### `submitAsyncTask` (grsai.ts)

提交任务到 GrsAi，返回 `externalTaskId`。

```typescript
export async function submitAsyncTask(
  userImageDataUri: string,
  itemImageDataUri: string,
  detailedInstructions: string
): Promise<string> {
  // 调用 /v1/draw/nano-banana
  // webHook: "-1" -> 轮询模式
  // 返回 data.id 作为 externalTaskId
}
```

#### `pollTaskResult` (grsai.ts)

轮询任务结果。

```typescript
export async function pollTaskResult(grsaiTaskId: string): Promise<GrsAiResult> {
  // 调用 /v1/draw/result
  // 返回标准化的状态和结果
}
```

### ID 说明

项目中有两种不同的任务 ID，请注意区分：

| 名称 | 示例 | 说明 | 存储位置 |
|------|------|------|----------|
| `taskId` | `cmj1n8afn0005kz04r4hm2n3c` | 我们系统的 TryOnTask ID (cuid 格式) | `TryOnTask.id` |
| `grsaiTaskId` / `externalTaskId` | `4-33f51f6f-de39-46ce-adbc-8d6b6a423ced` | GrsAi 返回的任务 ID | `TryOnTask.metadata.externalTaskId` |

---

## 数据流程

```
1. 用户提交 Try-On 请求
   ↓
2. 后端调用 submitAsyncTask()
   → POST /v1/draw/nano-banana (webHook="-1")
   ← 返回 { id: "grsaiTaskId" }
   ↓
3. 保存 externalTaskId 到数据库 metadata
   status: PROCESSING
   ↓
4. 前端每 2 秒轮询 /api/try-on/poll
   ↓
5. 后端调用 pollTaskResult(grsaiTaskId)
   → POST /v1/draw/result { id: grsaiTaskId }
   ← 返回状态和结果
   ↓
6. 如果 status === "succeeded":
   - 下载结果图片
   - 上传到 Vercel Blob 持久化
   - 更新数据库 status: COMPLETED
   ↓
7. 前端显示结果
```

---

## 环境变量

```bash
# GrsAi API 配置
GRSAI_API_KEY=your-api-key
GRSAI_BASE_URL=https://api.grsai.com

# 服务分层开关
ENABLE_SERVICE_TIERING=true  # true: 启用 Premium/Free 区分, false: 全部使用 GrsAi
```

---

## 错误处理

### 常见错误码

| HTTP 状态 | 说明 |
|-----------|------|
| 401 | API Key 无效 |
| 429 | 请求过于频繁 |
| 500 | GrsAi 服务器错误 |

### 重试逻辑

目前实现中没有自动重试。如果任务失败 (`status: "failed"`)，需要用户手动重新提交。

### Admin 手动获取结果

对于卡在 PENDING/PROCESSING 状态的任务，管理员可以通过 Admin 后台手动触发结果获取：

```
POST /api/admin/try-on/{taskId}/fetch-result
```

---

## 注意事项

1. **图片 URL 有效期**: GrsAi 返回的结果图片 URL 有效期为 **2 小时**，我们会将其下载并上传到 Vercel Blob 持久化存储。

2. **超时处理**: 前端轮询最多 150 次 (每 2 秒一次，约 5 分钟)，超时后会提示用户任务失败。

3. **积分返还**: GrsAi 在任务失败时会自动返还积分。

4. **模型选择**: 我们使用 `nano-banana-fast` 模型，在速度和质量之间取得平衡。

---

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2025-12-12 | 初始文档创建，整理 API 接口和项目集成说明 |
