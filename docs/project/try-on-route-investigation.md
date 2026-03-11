# Try-On Route Investigation

## 背景

近期在后台 `Try-On` 详情中观察到一类偶发问题：

- `User Image` 正常
- `Result Image` 看起来正常
- 但中间的 `Item/Glasses Image` 偶发变成另一张人脸图，或与预期素材不符

这类问题历史上已经排查过多次，但一直没有稳定收敛。

本次排查的目标不是立刻修复，而是先确认：

1. 当前线上主链路到底走哪条路由
2. 为什么项目里同时存在 `/api/try-on` 和 `/api/try-on/submit`
3. 之前为“串图/重复图”加的诊断逻辑是否真的跑在主链路上

## 结论摘要

### 1. 当前主提交流程不走旧路由

前端 `TryOnInterface` 当前提交时调用的是：

- `POST /api/try-on/submit`

代码位置：

- `src/components/try-on/TryOnInterface.tsx`

对应实现：

- `src/app/api/try-on/submit/route.ts`
- `src/lib/tryon-service.ts`

这意味着：

- `src/app/api/try-on/route.ts` 不是当前主提交入口
- 它属于遗留的同步式实现，可视为“旧路由”

### 2. 改路由的原因是异步架构重构，不是单纯重命名

路由切换发生在提交 `a05235f`：

- `feat: Implement async try-on flow with GrsAi, service tiering, and task recovery`

这次改动新增了：

- `src/app/api/try-on/submit/route.ts`
- `src/app/api/try-on/poll/route.ts`
- `src/app/api/try-on/pending-tasks/route.ts`
- `src/lib/tryon-service.ts`

目标是把旧的单请求同步处理模式拆成：

1. `submit` 提交任务
2. `poll` 轮询结果
3. `pending-tasks` 恢复未完成任务

设计原因见：

- `docs/archive/project/async-tryon-plan.md`

文档中明确说明：

- 旧模式 `POST /api/try-on` 是 synchronous，准备被替换
- 新模式的核心动机是规避 Vercel Serverless 超时，并支持 GrsAi 异步队列和服务分级

### 3. 后台弹窗展示的就是数据库原值

后台详情接口：

- `src/app/api/admin/try-on/[id]/route.ts`

后台弹窗组件：

- `src/components/admin/TryOnDetailDialog.tsx`

这里没有把 `userImageUrl` 和 `itemImageUrl` 做额外交换或重写，只是直接读取数据库字段并展示。

因此，如果后台弹窗里看到 `Item Image` 错了，优先应判断为：

- 问题在任务入库前已发生

而不是后台展示层串值。

### 4. 历史上的“串图诊断修复”主要留在旧路由里

旧路由 `src/app/api/try-on/route.ts` 中存在一批专门用于诊断重复图/串图的保护逻辑，包括：

- 比较 `userImageFile === itemImageFile`
- 比较两张图的 name/size 是否相同
- 读取文件内容并计算 fingerprint
- 校验上传后的两个 blob URL 是否一致
- 先读取 buffer 再上传，避免重复读取文件流

这些逻辑是后来为了排查偶发串图问题补进去的。

但当前主链路：

- `src/app/api/try-on/submit/route.ts`
- `src/lib/tryon-service.ts`

并没有接入同等级别的诊断或保护。

## 推断

### 当前最可能的问题不是“修过但无效”，而是“修过但没有跑在主链路上”

从代码结构看，历史上确实做过一轮围绕“重复图片/串图”的排查和加固。

但这些加固主要留在旧的 `/api/try-on` 实现中，而前端流量已经切到 `/api/try-on/submit`。

因此非常可能出现以下情况：

1. 团队以为这个问题已经加过保护
2. 实际线上主提交流程没有使用这些保护
3. 导致问题仍然偶发，且缺少足够诊断信息

## 当前风险判断

按优先级排序，当前更值得怀疑的是：

1. 主链路 `submitTryOnTask()` 在上传前没有对两张图做内容级校验和证据落库
2. 服务端对 `File` 的直接上传缺少 buffer 化保护，偶发串值时无法回溯
3. 前端选图状态串值的可能性相对更低，但不能完全排除

## 建议的后续工作

下一步建议分两层推进。

### 第一层：先补“发现问题”的能力

把旧路由里的关键诊断迁移到当前主链路：

- 在 `/api/try-on/submit` 中记录两张输入文件的基础信息
- 计算内容 fingerprint/hash
- 校验两张图是否内容相同
- 校验上传后的 blob URL 是否异常
- 把关键证据写入 `TryOnTask.metadata`

目标是让下一次复现时，能明确知道问题出在：

- 前端传错
- 服务端解析错
- 上传错
- 后续服务调用错

### 第二层：再补“防止问题”的保护

主链路统一改成：

1. 先读取 `arrayBuffer()`
2. 计算 hash/fingerprint
3. 再用 buffer 上传 blob
4. 必要时对明显异常任务直接拒绝或标红

## 相关文件

- `src/components/try-on/TryOnInterface.tsx`
- `src/app/api/try-on/submit/route.ts`
- `src/lib/tryon-service.ts`
- `src/app/api/try-on/route.ts`
- `src/app/api/admin/try-on/[id]/route.ts`
- `src/components/admin/TryOnDetailDialog.tsx`
- `docs/archive/project/async-tryon-plan.md`

