# Gemini API 优化指南

## 📊 Token 优化：仅输出图像模式

### 背景

根据 [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs/image-generation#output-type)，Gemini 2.5 Flash Image 模型支持两种输出模式：

1. **默认模式**：`responseModalities: ["Text", "Image"]` - 同时输出文本和图像
2. **仅图像模式**：`responseModalities: ["Image"]` - 仅输出图像，不附带文本

### 优化收益

使用 `responseModalities: ["Image"]` 可以获得以下收益：

✅ **节省 Token 使用** - 不生成文本描述，减少输出 token 消耗  
✅ **降低成本** - 按 token 计费，减少 token 即减少费用  
✅ **提高响应速度** - 不需要生成文本，API 响应更快  
✅ **减少冗余信息** - 对于图像生成任务，文本描述通常是冗余的  
✅ **适用场景** - 电商展示、设计工具、虚拟试穿等纯图像输出场景

### 实施方案

#### 修改前（默认模式）

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: ["IMAGE", "TEXT"]  // 同时输出图像和文本
  }
})
```

#### 修改后（仅图像模式）

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
  generationConfig: {
    // Only output image without text to save tokens and reduce redundant information
    // Reference: https://ai.google.dev/gemini-api/docs/image-generation#output-type
    responseModalities: ["Image"]  // 仅输出图像
  }
})
```

### 已修改的文件

以下文件已更新为仅图像输出模式：

1. ✅ `src/lib/gemini.ts` - 主要的 Gemini API 调用逻辑
2. ✅ `scripts/verify-gemini-model.ts` - 模型验证脚本
3. ✅ `scripts/verify-gemini-model-with-proxy.ts` - 带代理的模型验证脚本
4. ✅ `docs/PROMPT_MANAGEMENT_QUICKSTART.md` - Prompt 管理文档示例

### 响应处理

使用仅图像模式后，API 响应中将**不包含文本部分**，只包含图像数据：

```typescript
const response = result.response
const candidates = response.candidates

if (candidates && candidates.length > 0) {
  const parts = candidates[0].content.parts
  
  for (const part of parts) {
    if (part.inlineData) {
      // ✅ 图像数据存在
      const imageData = part.inlineData.data
      const mimeType = part.inlineData.mimeType
      // 处理图像...
    }
    // ❌ part.text 将不存在或为空
  }
}
```

### 成本对比

假设每次 API 调用：

- **默认模式**：图像 token (1290) + 文本 token (约 50-200) = **1340-1490 tokens**
- **仅图像模式**：图像 token (1290) = **1290 tokens**

**节省比例**：约 **3.7% - 13.4%** 的 token 使用

对于高频使用场景（如虚拟试穿），这个优化可以显著降低成本。

### 参考资料

- [Gemini API 图像生成文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [输出类型配置](https://ai.google.dev/gemini-api/docs/image-generation#output-type)
- [Gemini 定价](https://ai.google.dev/gemini-api/docs/pricing)

### 更新日期

2025-01-15

