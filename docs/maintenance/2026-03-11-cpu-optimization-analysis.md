# Vercel Fluid Active CPU 使用率分析与优化方案 (2026-03-11)

## 1. 现状调研 (Foundations & Research)

目前 Vercel 项目（尤其是 `visutry`）的 **Fluid Active CPU** 持续处于高位。通过对代码库的审查和 Vercel 运行机制的分析，确定的主要原因如下：

### 1.1 中间件高频日志 (Middleware Logging Overhead)
*   **代码位置**: `src/middleware.ts`
*   **现象**: 中间件对每一个页面请求（Page Request，包括静态资源预取）都会调用 `logger.info('web', 'Page request', ...)`。
*   **CPU 消耗点**: 
    1.  **序列化开销**: 构造 `ctx` 对象（包含 IP、User-Agent 等）并在 `logger.info` 中将其序列化。
    2.  **网络 I/O 初始化**: 生产环境下 `logger.info` 会触发 Axiom SDK 的异步请求初始化，消耗 CPU 周期。
    3.  **调用频率**: 中间件是整站流量的入口，其开销会被流量规模成倍放大。

### 1.2 图像指纹计算 (Image Processing & Checksum)
*   **代码位置**: `src/app/api/try-on/route.ts` 和 `src/lib/tryon-service.ts`
*   **现象**: 系统会计算用户上传图片的指纹（使用 SHA256 或自定义哈希算法）以检测重复上传。
*   **CPU 消耗点**: 
    1.  **哈希运算**: 对 0.5MB - 1MB 的图片数据进行哈希计算是非常典型的 CPU 密集型操作。
    2.  **内存压力**: 多次调用 `arrayBuffer()` 和创建大型 `Uint8Array` 会增加垃圾回收（GC）频率，间接推高 CPU 占用。

### 1.3 运行时开销 (Node.js Execution Time)
*   **现象**: 权限检查、限额校验等逻辑全部在 Node.js 运行时执行。
*   **CPU 消耗点**: 相比于 Edge Runtime，Node.js 容器的冷启动和单次执行开销更大。

---

## 2. 优化方案 (Proposed Optimization Plan)

### 阶段一：即时生效的调整 (Short-term / Quick Wins)

1.  **降低日志级别 (Middleware Reduction)**:
    *   将中间件中的 `logger.info` 改为 `logger.debug`。
    *   调整日志系统，使其在生产环境下默认不发送 `debug` 级别的普通访问日志，仅保留 `error` 和关键业务日志。
2.  **禁用重型指纹校验 (Disable Heavy Checksums)**:
    *   在生产环境中禁用对上传文件的 SHA256 完整哈希计算。
    *   改用轻量级属性（文件大小 + 文件名 + 用户 ID）进行重复项判定，或者仅在后台进程中异步进行深度去重。

### 阶段二：架构性优化 (Mid-term / Architectural Changes)

1.  **边缘逻辑迁移 (Edge Migration)**:
    *   将简单的权限校验、国际化路由和基础限额判断迁移到 **Vercel Edge Runtime**。Edge Runtime 的 CPU 成本远低于标准的 Serverless Functions。
2.  **流式上传优化 (Streaming & Buffering)**:
    *   优化图片处理流程，减少 Buffer 在内存中的多次复制和转换。

### 阶段三：长效治理 (Long-term / Strategy)

1.  **客户端预计算 (Client-side Intelligence)**:
    *   在前端 (Client side) 使用 Web Workers 计算图片哈希，后端仅校验哈希值，实现 CPU 压力的转移。
2.  **异步化 Gemini 流程**:
    *   目前的 Gemini 试戴是同步等待模式。建议将其改为与 GrsAi 一致的异步模式：提交任务 -> 立即返回 ID -> 轮询结果。这能缩短单个请求的 CPU 活跃时长。

---

## 3. 预期目标

*   **Fluid Active CPU**: 期望降低 **40%** 以上。
*   **Vercel 账单**: 预计 Function 相关的费用将大幅减少。
*   **系统响应性**: 减轻 CPU 压力后，API 响应的 p95 延迟预计会有所改善量。

---

## 4. 后续步骤 (Next Steps)

1.  [ ] 批准方案一：修改 `src/middleware.ts` 降低日志频率。
2.  [ ] 批准方案二：清理 `src/lib/tryon-service.ts` 中的哈希计算逻辑。
3.  [ ] 监控优化后的 Dashboard 曲线观察效果。
