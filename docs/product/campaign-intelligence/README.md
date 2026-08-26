# Campaign Intelligence 文档入口

**Status:** Active documentation entry point
**Owner:** Product / Engineering / Growth
**Last updated:** 2026-08-26
**Scope:** VisuTry consumer funnel、Store/Campaign merchant analytics、事件契约和 GA4 配置。

## 当前阅读顺序

1. `event-taxonomy.md` — 当前唯一的业务事件契约。它定义事件命名、上下文、B2B 与 shopper 边界、归因和 GA4 cardinality 规则。
2. `implementation-progress.md` — 当前进度台账和未决事项。它回答“代码迁移完成到哪里、接下来等什么”。
3. `ga4-dashboard-spec.md` — 将事件契约映射到 campaign / merchant 报表的指标和探索。
4. `ga4-console-checklist.md` — 需要在 GA4 控制台执行的配置和验证步骤。

## 当前结论

- Phases 1–3 的工程事件层已经完成，生产代码通过 `analytics.ts` / `analytics-v2.ts` 发出 canonical business events。
- `/store` 是 merchant prospect acquisition，必须使用 `b2b_*` 事件；不能用 shopper campaign 事件替代。
- GA4 是事件消费者，不是 VisuTry 的产品数据模型；代码中的 event registry 和本 taxonomy 才是契约。
- 当前等待项集中在 GA4 观测、DebugView 和控制台 key-event/custom-dimension 配置，不应重新开启已完成的迁移计划。
- `frame_favorited` 等没有真实产品交互的事件保持 backlog，不为填报表而伪造埋点。

## 文档边界

| 文档 | 作用 | 当前状态 |
| --- | --- | --- |
| `event-taxonomy.md` | 业务事件契约和语义规则 | Active source of truth |
| `implementation-progress.md` | 当前进度、follow-up 和等待条件 | Active operating ledger |
| `ga4-dashboard-spec.md` | GA4 报表与 campaign 指标设计 | Active supporting spec |
| `ga4-console-checklist.md` | 控制台执行清单 | Active runbook / partially implemented |
| `archive/` | 迁移过程和已完成阶段的历史证据 | Historical reference only |

## 创建规则

新事件先更新 `event-taxonomy.md` 和代码 registry，再更新 `implementation-progress.md`。不要为每个阶段另建一份 completion report；只有可复现的验证证据、事故记录或外部研究才单独成文，并在完成后放入 `archive/` 或 evidence 目录。
