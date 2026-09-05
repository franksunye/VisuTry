# Campaign Intelligence 历史记录

**Status:** Archived historical reference  
**Owner:** Product / Engineering  
**Last reviewed:** 2026-09-04

这些文档记录 2026-08-10 至 2026-08-11 的 Campaign Intelligence 迁移过程、基线审计、阶段验收和提案。它们保留用于审计、回滚和理解决策背景，**不是当前执行说明**。

当前权威入口：

1. `../../../project/observability-and-analytics-contract.md`
2. `../event-taxonomy.md`
3. `../ga4-console-checklist.md`
4. `../README.md`

`implementation-progress.md` 和旧 `ga4-dashboard-spec.md` 已在 2026-09-04 治理中删除：前者是已经关闭的迁移进度台账，后者把 GA4 作为 merchant-facing Campaign dashboard 的旧模型已被当前 PostgreSQL `MerchantSession / MerchantEvent / MerchantIntent` 业务事实模型和跨域 Observability & Analytics Contract 吸收。

归档内容包括：

- v2 analytics layer / implementation proposals
- historical event audit and call-site coverage report
- event migration plan and migration summary
- Phase 1–3 completion and acceptance reports
- taxonomy hardening notes（durable rules已吸收进当前 taxonomy / contract）

归档内链接可指向当时存在的文档/实现；如果历史记录与当前 authority 冲突，以当前 authority 和代码实现为准。
