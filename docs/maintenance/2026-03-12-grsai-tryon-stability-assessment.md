# GrsAi Try-On 稳定性评估与处置建议 (2026-03-12)

## 1. 结论

当前 VisuTry 的 `GrsAi` 试戴方案可以继续作为线上免费用户主链路使用，但还不能视为“已经稳定可靠”。

更准确的判断是：

- 架构方向是正确的。
- 接入实现存在过可修复的稳定性缺口，已完成一轮加固。
- 第三方平台今天存在明确的上游波动证据。
- 输入图片兼容性问题仍未完全收口，后续还需要继续治理。

因此，当前状态应定义为：

- 可继续运行
- 已补关键兜底
- 仍需持续加固

---

## 2. 现状与背景

VisuTry 当前 Try-On 主链路中：

- Premium 用户优先走 `Gemini`
- Free 用户优先走 `GrsAi`
- `GrsAi` 采用异步架构：提交任务 -> 返回 `externalTaskId` -> 前端轮询结果

相关代码位置：

- `src/app/api/try-on/submit/route.ts`
- `src/app/api/try-on/poll/route.ts`
- `src/lib/tryon-service.ts`
- `src/lib/grsai.ts`

这一架构本身没有问题，核心价值是规避 Vercel Serverless 的同步超时限制。

---

## 3. 本次排查观察到的问题类型

### 3.1 第三方平台侧失败

根据 2026-03-12 的 GrsAi 控制台样本，存在明确的上游报错：

- `google gemini timeout...`

这说明：

- `nano-banana-fast` 背后依赖的上游生成链路存在超时波动
- 同时段并非全部失败，说明更像平台抖动或容量不稳，而不是接口整体不可用

这一类问题无法通过前端修复，只能通过：

- 自动重试
- 更强的监控与错误分桶
- 必要时准备备用供应商

### 3.2 请求输入/图片兼容性失败

同一天的失败样本中还出现：

- `The image format is incorrect. Please check if there are any issues with the image format`

这说明并非所有失败都来自平台波动。至少部分失败来自：

- 图片格式不被上游接受
- MIME 与真实图片编码不一致
- 图片内容损坏或非标准编码

这类问题不会因为简单重试而自动恢复。

### 3.3 Host 文档漂移风险

本次排查期间发现 GrsAi 文档的当前节点信息为：

- 海外：`https://grsaiapi.com`
- 国内直连：`https://grsai.dakka.com.cn`

而项目中旧默认值曾为：

- `https://api.grsai.com`

这会带来配置漂移风险：

- 即使接口路径 `/v1/draw/nano-banana` 与 `/v1/draw/result` 没变
- 如果 host 更新而环境变量或默认值未同步，线上会存在潜在不稳定性

该问题已经修正，代码默认值已切换到海外节点。

---

## 4. 本次确认的实现缺口

### 4.1 业务失败曾被误判为处理中

此前 `src/lib/grsai.ts` 的轮询解析主要依赖：

- HTTP 状态码
- `data.status`

这会遗漏一类关键情况：

- HTTP 200
- 但 `code != 0`

例如：

- 任务不存在
- 业务失败
- 平台返回非成功业务状态

此前这类情况可能继续被归为 `processing`，导致后台看到任务长期停留在 `PROCESSING`。

### 4.2 第三方“成功但无结果图”缺少终态处理

如果上游返回：

- `status = succeeded`
- 但没有可用 `imageUrl`

此前服务层没有把它明确收敛为失败，可能继续造成状态不清晰。

### 4.3 timeout 缺少自动兜底

此前面对：

- `google gemini timeout...`

系统只会直接失败，没有做一次自动重提。这导致用户直接承受第三方瞬时抖动。

---

## 5. 已完成修复

### 5.1 修正 GrsAi 业务失败判定

已在 `src/lib/grsai.ts` 中补充：

- `code`
- `msg`
- `rawStatus`
- `failureReason`

并将：

- `HTTP 200 + code != 0`

明确归类为失败，而不是继续当作处理中。

### 5.2 补充外部轮询诊断信息

已在 `src/lib/tryon-service.ts` 中为任务 metadata 记录：

- `lastExternalPollAt`
- `lastExternalStatus`
- `lastExternalProgress`
- `lastExternalError`
- `lastExternalDiagnostics`

这使得后台和后续排查能更快判断问题属于：

- 上游平台异常
- 输入问题
- 任务不存在
- 结果缺失

### 5.3 成功但无结果图时明确失败

若 GrsAi 返回成功状态但没有图片 URL，系统现在会直接标记：

- `FAILED`

避免继续伪装成处理中状态。

### 5.4 timeout 自动重试一次

已为 GrsAi 失败中的 `timeout / timed out` 场景加入自动兜底：

- 仅自动重试 1 次
- 复用当前 `TryOnTask`
- 不生成新的前端任务 ID
- 复用已上传的输入图和原始 prompt

新增的任务 metadata 包括：

- `retryCount`
- `lastRetryAt`
- `lastRetryReason`
- `previousExternalTaskId`

### 5.5 默认 Host 已切换

`src/lib/grsai.ts` 的默认 `GRSAI_BASE_URL` 已切换为：

- `https://grsaiapi.com`

用于避免环境变量漏配时回退到旧节点。

### 5.6 浏览器端图片格式规范化已上线

已在前端上传预处理链路中补充图片规范化，目标是在不增加 Vercel Serverless CPU 的前提下，降低上游图片兼容性失败率。

当前策略为：

- 用户人脸图统一转为标准 `JPEG`
- 商品图先压缩到处理尺寸后做轻量透明检测
- 检测到透明像素时保留为标准 `PNG`
- 不含透明时统一转为标准 `JPEG`

实现位置：

- `src/utils/image.ts`
- `src/components/upload/ImageUpload.tsx`

这一调整的收益是：

- 降低 `image format incorrect` 类失败
- 降低 MIME 与真实编码不一致导致的兼容性问题
- 保持图片预处理仍发生在浏览器端，不额外增加服务端成本

---

## 6. 当前判断：GrsAi 方案是否可继续使用

### 6.1 可以继续使用的原因

- 异步提交 + 轮询的架构适合 Vercel 环境
- 当前问题更多来自上游波动与输入兼容性，而不是架构方向错误
- 关键的状态误判与 timeout 无兜底问题已经修复

### 6.2 仍然不能视为“完全稳定”的原因

- 上游 `timeout` 仍然可能发生
- 图片格式兼容问题尚未根治
- 目前只有单供应商兜底，没有多供应商 fallback
- 后台可观测性虽然增强，但还未完全产品化展示

因此，结论不是“方案不行”，而是：

- 方案成立
- 接入已改善
- 稳定性仍需继续收口

---

## 7. 下一步建议

### 7.1 高优先级

1. 对上传到 GrsAi 的图片做更强制的格式规范化
   - 已完成浏览器端 `jpeg/png` 规范化
   - 后续继续观察 `image format incorrect` 告警是否显著下降
   - 如仍有残留，再评估是否需要增加更严格的异常图片拦截

2. 在后台展示关键 GrsAi 诊断字段
   - `lastExternalDiagnostics`
   - `retryCount`
   - `lastRetryReason`

3. 在 Axiom 中按错误类型做分桶统计
   - `timeout`
   - `image format incorrect`
   - `task not found`
   - 其他 `failure_reason = error`

### 7.2 中优先级

1. 为高频失败类型增加更明确的用户提示
   - 平台超时：提示系统重试中或请稍后再试
   - 图片格式问题：提示重新上传 PNG/JPG

2. 评估是否需要第二供应商或备用模型
   - 仅当 `timeout` 和平台失败占比长期偏高时再推进

---

## 8. 操作性结论

对当前方案的最终建议如下：

- 不建议立即替换 GrsAi
- 建议继续沿用当前异步架构
- 建议把后续工作重点放在“输入格式治理 + 可观测性 + 错误分桶”

如果后续 3 到 7 天内监控数据表明：

- `timeout` 失败占比依然偏高
- 且一次自动重试仍不能显著改善成功率

再进入下一轮评估：

- 是否切换模型
- 是否增加备用供应商
- 是否按用户等级做更强服务分流

---

## 9. 相关文件

- `src/lib/grsai.ts`
- `src/lib/tryon-service.ts`
- `src/app/api/try-on/submit/route.ts`
- `src/app/api/try-on/poll/route.ts`
- `tests/unit/lib/grsai.test.ts`
- `tests/unit/lib/tryon-service.test.ts`
