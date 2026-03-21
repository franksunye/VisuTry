# Try-On 串图 / 图片错位日志排查手册（Axiom）

> 目标：当后台出现「User 正常、Result 正常，但中间 Item/Glasses 图明显错位」时，快速通过 Axiom 日志定位问题大致落在哪一环。

---

## 1. 先从后台拿到关键信息

在 Admin 后台 `Try-On` 详情弹窗中记下：

- **Task ID**：`Task ID: xxx`（最重要）
- **User ID**：`User Information` 区块里的 `User ID`
- **时间**：`Created` 或 `Updated` 的时间（精确到分钟即可）

有 Task ID 即可，其余是辅助过滤。

---

## 2. 在 Axiom 中筛选这一条任务的日志

> 下面用的是通用操作步骤，根据你自己的 Axiom Space / Dataset 名字替换。

1. 打开 Axiom 控制台，进入对应项目。
2. 选择日志 Dataset（例如：`visutry-logs`）。
3. 在时间范围里选择：**以任务创建时间为中心，前后各 10 分钟**。
4. 在搜索栏中输入（示例）：

   - 直接搜 Task ID（推荐）：
     - `task-xxxxxxxx`（把后台弹窗里的 Task ID 粘进去）
   - 或者按 `userId` 搜：
     - `userId: "cmmr582f20..."`（从后台复制完整 userId）

5. 如果有结构化字段，可加上类别过滤：

   - `category == "tryon-service" OR category == "upload"`

这样基本能把这一条任务的所有相关日志拉出来。

---

## 3. 重点查看的几类日志

找到这批日志后，按类别看信息：

### 3.1 `/api/try-on/submit` 路由（category: `upload`）

关键字段：

- `sameObjectReference`：两张图是否是同一个 File 对象
- `sameFileName`：两张图文件名是否相同
- `sameFileSize`：两张图大小是否相同

如果这里已经是：

- `sameObjectReference: true` 或  
- 名称和大小完全一致  

则更偏向 **前端/用户层面传了同一张图**。

### 3.2 `tryon-service` 输入诊断（`Try-on input diagnostics collected`）

字段在 `inputDiagnostics` 里：

- `userFile` / `itemFile`：名字、大小、类型
- `sameObjectReference`
- `sameFileName`
- `sameFileSize`
- `sameContentSha256`：只有在 `hashEnabled: true` 且内容真相同时才会是 `true`
- `hashEnabled`：是否真的对内容做了 hash 检查

解读：

- `hashEnabled: false`：当前这条任务没有做内容 hash，对 `sameContentSha256` 忽略。
- `hashEnabled: true` 且 `sameContentSha256: true`：**两张图文件内容完全一致**。

### 3.3 `tryon-service` 上传诊断（`Try-on upload diagnostics collected`）

字段在 `uploadDiagnostics` 里：

- `userImageUrl`
- `itemImageUrl`
- `identicalUploadUrls`

这里和数据库字段的关系：

- 后台弹窗里的 `User Image` / `Item Image`，直接来自 DB 中的 `userImageUrl` / `itemImageUrl`。
- 如果：
  - `uploadDiagnostics.userImageUrl === uploadDiagnostics.itemImageUrl`，或者  
  - `identicalUploadUrls: true`  
  则说明 **上传环节就已经把两张图写成同一个 URL**。

---

## 4. 如何根据日志做快速归因

结合 3.1–3.3，可以用一个简单的决策：

1. **前端/用户层面更可疑：**
   - `sameObjectReference: true`  
   - 或 `sameFileName: true` 且 `sameFileSize: true`  
   - 上传后的 `userImageUrl` / `itemImageUrl` 不相同  
   ⇒ 倾向「两次选图其实是同一个文件」，重点检查 `TryOnInterface` / `ImageUpload` 的交互和用户操作。

2. **上传/入库层面更可疑：**
   - 前端/submit 日志里 `sameObjectReference: false`，name/size 也不完全一样；
   - 但 `identicalUploadUrls: true`，或者 DB 中 `userImageUrl === itemImageUrl`；  
   ⇒ 倾向「上传/写库时出现串值」，重点检查 blob 上传和 `tryon-service` 的 URL 写入逻辑。

3. **下游 AI 生成层面更可疑：**

   - 输入侧（文件名/大小/URL）看起来都正常；
   - 但视觉上合成结果的脸/眼镜对不上；  
   ⇒ 更像是模型本身的对齐问题，而非系统串图。

---

## 5. 实际排查时怎么协作

1. 在后台发现一次「图片错位」案例。
2. 记录：
   - Task ID
   - User ID
   - Created/Updated 时间
3. 按本手册到 Axiom 拉出这条任务的相关日志。
4. 把关键几条日志（去掉隐私值）贴给开发或在 Chat 里发给 AI，按第 4 节的决策树一起判断问题落在哪一层。

---

## 6. Axiom 快速查询模板（按 `clientSubmissionId` 一键拉全链路）

> 适用时间：2026-03-21 之后的新请求。前端会在提交时附带 `clientSubmissionId`，并透传到 `upload` 与 `tryon-service` 日志。

### 6.1 先从后端 `upload` 日志拿 `clientSubmissionId`

过滤条件（Stream UI）：

- `category == "upload"`
- `message == "Submit route received try-on files"`
- 时间范围：任务时间前后 10 分钟

在日志详情里复制：

- `data.clientSubmissionId`

---

### 6.2 用同一个 `clientSubmissionId` 拉全链路

过滤条件（推荐）：

- `data.clientSubmissionId == "<复制到的clientSubmissionId>"`
- 时间范围：任务时间前后 10 分钟

可选追加：

- `category in ("upload", "tryon-service", "grsai", "api")`
- `level in ("info", "warn", "error")`

---

### 6.3 重点事件清单（按顺序）

1. `Submit route received try-on files`（后端接收快照）
2. `Submit route duplicate guard checked`（后端重复文件校验）
3. `Try-on input diagnostics collected`（service 输入诊断）
4. `Try-on upload diagnostics collected`（service 上传诊断）
5. `Service selection: ...`（服务分流）
6. 结果相关日志（`Gemini result uploaded to blob` / `GrsAi result uploaded to blob` / failed/retry 类）

---

### 6.4 常用定位结论

- 如果第 1 步就显示两图同名同大小，且第 2 步 `sameContentSha256 = true`：
  - 结论：输入侧重复文件（用户操作或前端状态复用）。
- 如果第 3 步输入正常，但第 4 步 `identicalUploadUrls = true`：
  - 结论：上传/写库层异常。
- 如果输入和上传都正常，但最终视觉错位：
  - 结论：更偏模型对齐问题（下游生成）。
