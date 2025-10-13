# Gemini Performance Testing Scripts

这个目录包含用于测试 Gemini API 性能的独立脚本。

## 📋 脚本列表

### 1. `quick-test.ts` - 快速测试 ⭐ 推荐

**用途**：快速测试 Gemini API 的响应时间

**特点**：
- 单次测试
- 简洁输出
- 快速获得关键数据
- 适合日常检查

**运行**：
```bash
npx tsx scripts/quick-test.ts
```

**输出示例**：
```
🚀 Quick Gemini Performance Test

1️⃣  Initializing Gemini API...
2️⃣  Downloading test images...
   ✅ Downloaded in 234ms
   📊 Sizes: 45.2KB + 23.1KB
3️⃣  Converting to base64...
   ✅ Converted in 12ms
4️⃣  Calling Gemini API...
   ⏳ This is the KEY METRIC - please wait...

   ✅ Gemini responded in 8234ms (8.23s)
   📊 Result size: 156.7KB

============================================================
📊 PERFORMANCE SUMMARY
============================================================
Download:       234ms
Base64:         12ms
Gemini API:     8234ms (8.23s) ⭐
Total:          8480ms (8.48s)
============================================================

🎯 10-SECOND TARGET ANALYSIS:
Current overhead (non-API): 246ms
Gemini API time: 8234ms

With optimizations:
Estimated total: 8357ms (8.36s)

✅ 10-second target is ACHIEVABLE!
```

---

### 2. `test-gemini-performance.ts` - 完整测试

**用途**：全面的性能测试和分析

**特点**：
- 多场景测试（不同 prompt）
- 多次迭代（统计平均值）
- 详细的性能报告
- 适合深度分析

**运行**：
```bash
npx tsx scripts/test-gemini-performance.ts
```

**测试场景**：
1. **Full Prompt** - 当前使用的完整 prompt
2. **Simplified Prompt** - 简化版 prompt
3. **Minimal Prompt** - 最小化 prompt

**输出示例**：
```
🧪 Gemini API Performance Testing Script
================================================================================

📝 Test Configuration:
  Scenarios: 3
  Iterations per scenario: 3
  Total tests: 9
  User image: https://via.placeholder.com/800x800/...
  Glasses image: https://via.placeholder.com/400x400/...

================================================================================
Testing: Full Prompt (Current) (Iteration 1)
================================================================================

📥 Downloading images...
✅ Download completed: 245ms (0.25s)
   User image: 45.23KB
   Glasses image: 23.45KB

🔄 Converting to base64...
✅ Base64 conversion completed: 15ms (0.02s)
   User image base64: 60.31KB
   Glasses image base64: 31.27KB

🚀 Calling Gemini API...
   Prompt length: 456 characters
✅ Gemini API responded: 8456ms (8.46s)
   Result image size: 167.89KB

================================================================================
⏱️  TOTAL TIME: 8716ms (8.72s)
================================================================================

[... more iterations ...]

================================================================================
📊 PERFORMANCE TEST REPORT
================================================================================

📋 Scenario: Full Prompt (Current)
--------------------------------------------------------------------------------
Success rate: 3/3

Average times:
  Download:        243ms
  Base64 convert:  14ms
  Gemini API:      8523ms (8.52s) ⭐ KEY METRIC
  Total:           8780ms (8.78s)

Gemini API range:
  Fastest:         8234ms (8.23s)
  Slowest:         8912ms (8.91s)

[... more scenarios ...]

================================================================================
🎯 10-SECOND TARGET ANALYSIS
================================================================================

Current performance:
  Average Gemini API time: 8345ms (8.35s)
  Average total time:      8602ms (8.60s)
  Other overhead:          257ms

With optimizations (estimated):
  Estimated total time:    8473ms (8.47s)

✅ 10-second target is ACHIEVABLE!

================================================================================
```

---

## 🚀 使用指南

### 前置要求

1. **安装依赖**（如果还没有）：
```bash
npm install
```

2. **设置 API Key**：

在项目根目录的 `.env.local` 文件中添加：
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

或者临时设置：
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### 快速开始

**第一次测试**（推荐）：
```bash
npx tsx scripts/quick-test.ts
```

**深度分析**：
```bash
npx tsx scripts/test-gemini-performance.ts
```

---

## 📊 如何解读结果

### 关键指标

1. **Gemini API time** ⭐ 最重要
   - 这是 Gemini API 的实际响应时间
   - 无法优化（由 Google 控制）
   - 决定了是否能达到 10秒目标

2. **Download time**
   - 下载图片的时间
   - 可以通过并行下载优化（已实施）
   - 可以通过图片压缩优化

3. **Base64 conversion time**
   - 通常很快（<50ms）
   - 不是瓶颈

4. **Total time**
   - 完整流程的时间
   - 包含所有开销

### 判断标准

**Gemini API 时间**：
- ✅ **< 5秒**：10秒目标很容易达成
- ⚠️ **5-8秒**：10秒目标可以达成（需要优化）
- ❌ **> 8秒**：10秒目标很困难（需要考虑其他方案）

**总时间**：
- ✅ **< 10秒**：目标达成
- ⚠️ **10-12秒**：接近目标（继续优化）
- ❌ **> 12秒**：需要重新评估方案

---

## 🔧 自定义测试

### 使用真实图片

修改脚本中的图片 URL：

```typescript
// 在 quick-test.ts 或 test-gemini-performance.ts 中
const userImageUrl = 'https://your-blob-storage.com/user-photo.jpg'
const glassesImageUrl = 'https://your-blob-storage.com/glasses.png'
```

### 测试不同的 Prompt

在 `test-gemini-performance.ts` 中修改 `SCENARIOS` 数组：

```typescript
const SCENARIOS = [
  {
    name: "My Custom Prompt",
    prompt: "Your custom prompt here..."
  }
]
```

### 调整测试次数

在 `test-gemini-performance.ts` 中修改：

```typescript
const TEST_ITERATIONS = 5 // 每个场景测试5次
```

---

## 📝 测试建议

### 最佳实践

1. **多次测试**：
   - 至少运行 3 次
   - 取平均值
   - 注意异常值

2. **不同时间段**：
   - 高峰期测试
   - 低峰期测试
   - 对比差异

3. **不同图片大小**：
   - 小图片（400x400）
   - 中图片（800x800）
   - 大图片（1200x1200）

4. **记录结果**：
   - 保存测试日志
   - 对比优化前后
   - 追踪性能趋势

### 注意事项

⚠️ **API 配额**：
- Gemini API 有免费配额限制
- 避免过度测试
- 测试间隔 5-10 秒

⚠️ **网络环境**：
- 测试结果受网络影响
- 在稳定网络环境下测试
- 中国大陆可能需要代理

⚠️ **Rate Limiting**：
- 如果遇到 429 错误
- 等待 20-30 秒后重试
- 减少测试频率

---

## 🎯 下一步行动

根据测试结果：

### 如果 Gemini API < 5秒
✅ **太好了！**
- 继续实施图片压缩优化
- 10秒目标很容易达成

### 如果 Gemini API 5-8秒
⚠️ **需要优化**
1. 实施图片压缩（减少输入大小）
2. 简化 Prompt
3. 优化其他环节

### 如果 Gemini API > 8秒
❌ **需要重新评估**
1. 考虑其他模型（Stability AI, DALL-E）
2. 考虑混合方案（传统 CV + AI）
3. 调整用户期望（接受 15秒）

---

## 📚 相关文档

- [GEMINI_PERFORMANCE_ANALYSIS.md](../GEMINI_PERFORMANCE_ANALYSIS.md) - 完整性能分析
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)
- [性能优化指南](../docs/performance-optimization.md)

---

## 🐛 故障排除

### 问题：`GEMINI_API_KEY not found`

**解决**：
```bash
# 检查环境变量
echo $GEMINI_API_KEY

# 设置环境变量
export GEMINI_API_KEY="your-key"

# 或者在 .env.local 中设置
```

### 问题：`Failed to fetch images`

**解决**：
- 检查网络连接
- 确认图片 URL 可访问
- 尝试使用其他测试图片

### 问题：`429 Too Many Requests`

**解决**：
- 等待 20-30 秒
- 减少测试频率
- 检查 API 配额

### 问题：`No image found in response`

**解决**：
- 检查 Gemini API 配额
- 确认使用正确的模型
- 查看完整错误信息

---

## 💡 提示

- 🚀 首次使用建议运行 `quick-test.ts`
- 📊 需要详细分析时使用 `test-gemini-performance.ts`
- 📝 记录每次测试的结果，便于对比
- 🔄 定期测试，监控性能变化

