# Gemini API "fetch failed" 错误修复

## 🐛 问题描述

在 Vercel 生产环境中，Gemini API 调用失败，错误信息：

```
[error] ❌ Gemini API error: TypeError: fetch failed
[error] Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent: fetch failed
```

**处理时间**: 32秒后失败

---

## 🔍 根本原因分析

### 1. Vercel Serverless 函数超时

**问题**：
- Vercel 默认超时：10秒（免费/Hobby）
- Gemini API 调用：4-10秒
- 加上图片下载、上传：总共需要 15-30秒
- **超过默认超时限制**

### 2. Fetch 超时

**问题**：
- Node.js 的 `fetch` (undici) 有默认超时
- 长时间的网络请求可能被中断
- 没有明确的超时配置

### 3. 网络连接问题

**可能原因**：
- Vercel serverless 函数的网络限制
- Google API 端点在某些区域可能不稳定
- API key 配置问题

---

## ✅ 修复方案

### 1. 增加函数超时时间 ⭐⭐⭐⭐⭐

**文件**: `src/app/api/try-on/route.ts`

```typescript
// Set maximum duration for this serverless function
// Gemini API can take 4-10 seconds, plus upload/download time
// Free tier: max 10s, Hobby: max 10s, Pro: max 60s
export const maxDuration = 60 // 60 seconds for Pro plan
```

**文件**: `vercel.json`

```json
{
  "framework": "nextjs",
  "functions": {
    "src/app/api/try-on/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**效果**：
- 允许函数运行最多 60 秒
- 足够完成整个流程
- **需要 Vercel Pro 计划**（免费版最多 10 秒）

---

### 2. 添加 Fetch 超时控制 ⭐⭐⭐⭐

**文件**: `src/lib/gemini.ts`

```typescript
const fetchWithTimeout = async (url: string, timeoutMs: number = 30000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeoutMs}ms for ${url}`)
    }
    throw error
  }
}
```

**效果**：
- 明确的 30 秒超时
- 防止无限等待
- 更好的错误信息

---

### 3. 增强错误处理和日志 ⭐⭐⭐⭐

**添加详细日志**：

```typescript
console.log(`📥 Downloading images from Blob Storage...`)
console.log(`   User image: ${userImageUrl}`)
console.log(`   Glasses image: ${glassesImageUrl}`)
```

**增强错误检测**：

```typescript
// Network/fetch errors
if (errorMessage.includes('fetch failed') || 
    errorMessage.includes('ECONNREFUSED') || 
    errorMessage.includes('ETIMEDOUT')) {
  console.error("🌐 Network error detected - possible causes:")
  console.error("   1. Vercel serverless function network restrictions")
  console.error("   2. Google API endpoint unreachable")
  console.error("   3. Timeout (check if GEMINI_API_KEY is set)")
  console.error("   4. Regional restrictions")
  
  return {
    success: false,
    error: "Network error: Unable to connect to Gemini API. Please check your internet connection and try again."
  }
}
```

**效果**：
- 更清晰的错误信息
- 便于诊断问题
- 用户友好的错误提示

---

## 🔧 部署检查清单

### 1. Vercel 环境变量

确保在 Vercel Dashboard 中设置了：

```
GEMINI_API_KEY=your-api-key-here
```

**检查方法**：
1. 登录 Vercel Dashboard
2. 选择项目 → Settings → Environment Variables
3. 确认 `GEMINI_API_KEY` 存在且正确

---

### 2. Vercel 计划检查

**重要**：`maxDuration = 60` 需要 **Pro 计划**

| 计划 | 最大超时 | 是否足够 |
|------|---------|---------|
| Hobby (免费) | 10秒 | ❌ 不够 |
| Pro | 60秒 | ✅ 足够 |
| Enterprise | 900秒 | ✅ 足够 |

**如果是免费计划**：
- 需要升级到 Pro
- 或者优化流程到 10 秒以内（很困难）

---

### 3. 测试步骤

部署后测试：

1. **上传图片**
2. **查看 Vercel 日志**：
   ```
   📥 Downloading images from Blob Storage...
   ⏱️ Image download time: XXXms
   🚀 Calling Gemini API...
   ⏱️ Gemini API call time: XXXms
   ✅ Task completed in XXXms
   ```

3. **检查错误**：
   - 如果仍然超时 → 检查 Vercel 计划
   - 如果网络错误 → 检查 API key
   - 如果其他错误 → 查看详细日志

---

## 📊 预期结果

### 修复前

```
❌ Gemini API error: TypeError: fetch failed
⏱️ AI processing time: 32137ms (32.14s)
❌ Try-on failed
```

### 修复后

```
📥 Downloading images from Blob Storage...
⏱️ Image download time: 500ms
🚀 Calling Gemini API...
⏱️ Gemini API call time: 4500ms
✅ Gemini API responded
⏱️ Base64 converted to Blob URL in 1200ms
✅ Task completed in 8500ms (8.50s) ⭐ TOTAL TIME
```

---

## 🚨 常见问题

### Q1: 仍然出现 "fetch failed" 错误

**可能原因**：
1. **Vercel 计划不支持 60 秒超时**
   - 解决：升级到 Pro 计划
   
2. **GEMINI_API_KEY 未设置或无效**
   - 解决：检查环境变量
   
3. **网络连接问题**
   - 解决：检查 Vercel 状态页面

---

### Q2: 超时时间设置无效

**检查**：
```typescript
// 确保两个地方都设置了
// 1. route.ts
export const maxDuration = 60

// 2. vercel.json
{
  "functions": {
    "src/app/api/try-on/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**重新部署**：
```bash
git push origin main
```

---

### Q3: 如何确认是否使用了 Pro 计划？

**方法 1**：查看 Vercel Dashboard
- Settings → General → Plan

**方法 2**：查看部署日志
- 如果超过 10 秒仍在运行 → Pro 计划
- 如果 10 秒就超时 → 免费计划

---

## 💡 优化建议

### 短期（立即）

1. ✅ 确保 `GEMINI_API_KEY` 正确设置
2. ✅ 确认 Vercel 计划支持 60 秒超时
3. ✅ 部署修复代码

### 中期（1-2周）

1. 添加重试机制
2. 实施缓存策略
3. 监控 API 响应时间

### 长期（1个月+）

1. 考虑使用队列系统（如 Vercel Queue）
2. 实施 WebSocket 实时更新
3. 优化图片处理流程

---

## 📝 修改文件列表

1. ✅ `src/app/api/try-on/route.ts` - 添加 maxDuration
2. ✅ `src/lib/gemini.ts` - 添加 fetch 超时和错误处理
3. ✅ `vercel.json` - 配置函数超时
4. ✅ `GEMINI_API_ERROR_FIX.md` - 本文档

---

## ✅ 总结

### 核心问题

**Vercel serverless 函数默认超时太短**（10秒），无法完成 Gemini API 调用（需要 15-30秒）

### 解决方案

1. **增加超时到 60 秒**（需要 Pro 计划）
2. **添加 fetch 超时控制**（30秒）
3. **增强错误处理**（更好的诊断）

### 前提条件

⚠️ **需要 Vercel Pro 计划**（$20/月）

如果是免费计划，需要：
- 升级到 Pro
- 或者接受 10 秒限制（很难达成）

### 下一步

1. 确认 Vercel 计划
2. 确认 GEMINI_API_KEY 设置
3. 部署修复代码
4. 测试验证

---

## 🔗 相关文档

- [Vercel Functions Timeout](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [REALISTIC_PERFORMANCE_TEST_RESULTS.md](./REALISTIC_PERFORMANCE_TEST_RESULTS.md)

