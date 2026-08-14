# Vercel ISR Reads Audit

## Executive Summary

当前最可能的 ISR Reads 驱动因素是 Store/Campaign 两条 `dynamicParams=true` 的公开动态路由对任意 locale + slug 组合开放按需 ISR；随机/无效 slug 会形成无限 key surface，而真实 Vercel route-level Reads 仍需要线上 telemetry 才能确认占比。

本审计只读完成。未访问生产数据库、未访问真实客户数据、未触发 Stripe/邮件/OAuth/Campaign mutation，也未修改 runtime 代码。

## Environment

- Starting HEAD: `d35bb23b5a9a0143cd0de67ccec99f2b7656fc4d` (`codex/universal-agent-access`)
- 当前工作区分支不是本地 `main`；目标 Store/Campaign 文件与本地 `main` (`898edab2b8c069e23af8570ef1d5ea9e8f86da40`) 无差异。该事实已保留，避免把当前 HEAD 误称为 main。
- Ending HEAD: `805d64791e57618694ab997b65733343f800cb07`
- Concurrent workspace change: another process advanced this branch from the starting HEAD to `805d647` during the audit (two cherry-picks and one commit between 16:10 and 16:12). Store/Campaign routes, discovery cache, sitemap and middleware were unchanged; the current merchant profile mutation was re-checked before writing the coverage result.
- Node: `v25.8.0`
- Next.js: `14.2.32`
- Prisma Client: `7.1.0`
- Build command: `pnpm build:ci` (`prisma generate && next build`)
- `pnpm build`: 未运行。仓库的 `build` script 还会执行 `scripts/migrate-deploy.sh`，在本次只读审计中不安全。
- Build status: PASS。构建期间使用显式不可达 loopback DB `127.0.0.1:59999`；未连接 `.env` 中的 Neon 数据库。构建中的非目标 DB 查询被项目自身 catch 并跳过，进程最终 exit 0。
- DB isolation status: ISOLATED。没有安全的 Store/Campaign fixture DB；`.env`、development、preview、production backup 均指向同一 Neon project，未使用。
- Build output: 两条目标路由显示为 `● (SSG)`，同时保留 dynamic route definition；Next 14 的摘要没有单独输出 “ISR” 字样。由于 `generateStaticParams()=[]`，没有具体 Store/Campaign slug 被构建为静态页面。

Vercel 官方将 ISR Read Unit 定义为从 ISR cache 读取的 8 KB 数据；CDN 与 ISR 是不同层，不能把本地 `.next` server bundle 大小直接当作计费 payload。[Vercel ISR usage and pricing](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing)

## Confirmed Findings

- Store route: `revalidate = 1800`, `dynamicParams = true`, `generateStaticParams() = []`。
- Campaign route: `revalidate = 300`, `dynamicParams = true`, `generateStaticParams() = []`。
- 两条 route 都在 `generateMetadata()` 和 Page body 中调用 `getPublicExperienceDiscoveryForRoute()`。
- Store/Campaign 的 route-level discovery data 通过 `unstable_cache` 缓存；key 明确包含 locale、merchant slug 和 campaign slug。
- `unstable_cache` tags 是 merchant、merchant catalog、experience 三个 slug-scoped tag；公共 sitemap 另有一个全局 tag。
- `revalidatePath()` 没有出现在这些 Store/Campaign invalidation paths 中；Store discovery invalidation 只调用 `revalidateTag()`。
- 构建没有生成具体 Store/Campaign HTML、RSC、`.meta` 或 per-slug prerender entry。
- 当前本地没有可安全使用的真实 Store/Campaign fixture，因此 valid slug response size、DB query count、真实 404/negative-cache、真实 ISR artifact 和真实 Vercel billing 均不能从本地确认。
- `InteractiveCommerceLauncher` 使用 `next/dynamic(..., { ssr: false })`。初始公开页面的 server render 不会把 `StoreShopperExperience` 的交互运行时当作 server HTML 内容；这有利于控制页面 payload，但不等于能推导实际 ISR payload 大小。

Next 官方说明 `unstable_cache` 会跨请求持久化结果，默认 key 还包含函数字符串和调用参数；本项目额外传入的 `keyParts` 又显式加入了 locale/slug。[Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

## Store Route

### 当前行为

文件：`src/app/[locale]/(store)/store/[merchantSlug]/page.tsx`

- `revalidate = 30 * 60`。
- `dynamicParams = true`。
- `generateStaticParams()` 返回 `[]`，所以没有 build-time Store snapshot。
- `generateMetadata()` 与 Page 都传入 `(merchantSlug, null, locale)`。
- 无 discovery 时，metadata 返回 noindex/not-follow 的 “Store not found”；Page 随后调用 `notFound()`。
- route-level `unstable_cache` key 为：

  ```text
  ['public-experience-discovery', locale, merchantSlug, 'store']
  ```

- tags 为 merchant、catalog、`experience:<merchantSlug>:store`。

### Build artifact size

目标 route 没有 per-slug artifact；以下只记录可确认的部署代码，不计入 RU：

| Artifact | Bytes | 是否可当作 ISR durable payload |
|---|---:|---|
| `.next/server/app/[locale]/(store)/store/[merchantSlug]/page.js` | 4,889 | No，server bundle |
| `page.js.nft.json` | 959 | No，trace metadata |
| `page_client-reference-manifest.js` | 18,767 | No，client reference manifest |
| `/en/store/*` HTML/RSC/.meta | 不存在 | 无具体 slug 被 prerender |

Store valid page response bytes: **BLOCKED**。不能用上面的 bundle bytes 代替实际 HTML/RSC/ISR payload。

### Estimated RU

Store estimated RU/read: **BLOCKED**，因为没有安全 fixture 能生成一个成功 Store 页面，也没有 Vercel route-level payload telemetry。

理论计算方式：`ceil(relevant durable ISR bytes / 8192)`。本地能够确认的是 route code 和 data-cache key，不能确认 Vercel 将哪些具体 response bytes 写入/读取为该 ISR entry。

### Invalid slug behavior

代码级别：任意 merchant slug 都能进入动态 route；只有 discovery DB read 返回 null 后才会走 `notFound()`。因此随机 Store slug 具有进入 route render 和 discovery cache lookup 的条件。

本地 HTTP：使用假 DB 时 `/en/store/ello-sunglasses` 与两个 invalid Store slug 首次/第二次均为 `500`、`2105` bytes，`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`；这是 DB 连接失败，不是 Store 404 或 ISR 结果，不用于 RU 估算。

## Campaign Route

### 当前行为

文件：`src/app/[locale]/(store)/c/[merchantSlug]/[experienceSlug]/page.tsx`

- `revalidate = 5 * 60`。
- `dynamicParams = true`。
- `generateStaticParams()` 返回 `[]`，所以没有 build-time Campaign snapshot。
- `generateMetadata()` 与 Page 都传入 `(merchantSlug, experienceSlug, locale)`。
- 无 discovery 时，metadata 返回 noindex/not-follow 的 “Campaign not found”；Page 随后调用 `notFound()`。
- route-level `unstable_cache` key 为：

  ```text
  ['public-experience-discovery', locale, merchantSlug, experienceSlug]
  ```

- tags 为 merchant、catalog、`experience:<merchantSlug>:<experienceSlug>`。

### Build artifact size

目标 route 没有 per-slug artifact；以下只记录可确认的部署代码，不计入 RU：

| Artifact | Bytes | 是否可当作 ISR durable payload |
|---|---:|---|
| `.next/server/app/[locale]/(store)/c/[merchantSlug]/[experienceSlug]/page.js` | 5,078 | No，server bundle |
| `page.js.nft.json` | 1,043 | No，trace metadata |
| `page_client-reference-manifest.js` | 18,199 | No，client reference manifest |
| `/en/c/*/*` HTML/RSC/.meta | 不存在 | 无具体 slug 被 prerender |

Campaign valid page response bytes: **BLOCKED**。不能用上面的 bundle bytes 代替实际 HTML/RSC/ISR payload。

### Estimated RU

Campaign estimated RU/read: **BLOCKED**，原因同 Store。当前唯一可确认的数值是 TTL `300s`，不是 payload size 或 RU/read。

### Invalid slug behavior

代码级别：任意 merchant/campaign slug 组合都能进入动态 route；只有 discovery DB read 结果为 null 后才会走 `notFound()`。每个不同的 locale + merchantSlug + experienceSlug 都会产生不同的 discovery cache key。

本地 HTTP：使用假 DB 时 `/en/c/ello-sunglasses/everyday-fit` 和两个 invalid Campaign route 首次/第二次均为 `500`、`2105` bytes，并带 no-store Cache-Control；不能据此确认 404 negative cache 或 ISR fallback。

## Invalid Slug Test

### Required URL matrix

| URL | 第一次 | 第二次 | DB/discovery read | 新 cache/artifact | `notFound()` / ISR fallback |
|---|---|---|---|---|---|
| `/en/store/__isr_audit_invalid_001__` | 500 / 2105 B | 500 / 2105 B | DB 失败；未返回 discovery | 未观察到 per-slug `.next/server/app` artifact | 未到达 `notFound()`；不是有效测试 |
| `/en/store/__isr_audit_invalid_002__` | 500 / 2105 B | 500 / 2105 B | DB 失败；未返回 discovery | 未观察到 per-slug `.next/server/app` artifact | 未确认 |
| `/en/c/__isr_audit_invalid_001__/__campaign_invalid_001__` | 500 / 2105 B | 500 / 2105 B | DB 失败；未返回 discovery | 未观察到 per-slug `.next/server/app` artifact | 未到达 `notFound()`；不是有效测试 |
| `/en/c/__isr_audit_invalid_002__/__campaign_invalid_002__` | 500 / 2105 B | 500 / 2105 B | DB 失败；未返回 discovery | 未观察到 per-slug `.next/server/app` artifact | 未确认 |

### Three-level answer

- **Code-level answer:** YES，存在无限 key-surface 条件。`dynamicParams=true` + empty `generateStaticParams()` 接受任意 path params；`unstable_cache` key 又把每个 locale/slug 组合分开。返回 `null` 的 discovery 结果也位于可缓存 callback 的结果域内。代码不能证明每个 404 一定写入 Vercel ISR route artifact。
- **Runtime-local answer:** BLOCKED。没有安全 fixture DB；假 DB 请求只证明错误会被 `no-store` 返回，不能证明 404、negative cache、`x-nextjs-cache` 或 callback 次数。
- **Vercel billing answer:** NOT CONFIRMED。Vercel ISR Reads 的真正 route-level 影响必须用生产/preview telemetry 按 `request_path`、`path_type`、`cache_result` 和 ISR read/write units 验证。不能把 Next 本地缓存行为直接等同于 Vercel billing。

> Random slug amplification is therefore a **real architecture risk**, but the exact multiplier and whether 404 entries are durably stored are **not proven in this isolated run**.

## Cache Invalidation Coverage

### Covered

- `src/app/api/admin/store/merchants/[id]/experiences/[experienceId]/route.ts` 的 PUT：覆盖 Campaign metadata/policy/date/CTA/status，以及该路由允许更新的 Experience 字段；按 merchant + old experience slug 调用 `revalidatePublicDiscoveryByRoute()`。
- `src/app/api/admin/store/merchants/[id]/experiences/[experienceId]/frames/route.ts` 的 PUT：覆盖 Store/Campaign experience-frame selection，调用同一 invalidation helper。
- Helper 同时 invalidates merchant tag、merchant catalog tag、experience tag 和 `public-discovery:sitemap` tag；这些 tag 会覆盖所有 locale 的同 slug data-cache entries。

### Not Covered

以下路径在当前代码中没有 discovery invalidation：

- MCP/merchant self-service 的 `import_frames`：catalog frame create/update 会影响 Store/Campaign 页面。
- MCP 的 `create_store`、`set_store_frames`、`publish_store`。
- MCP 的 `create_campaign`、`set_campaign_frames`、`update_campaign`、`publish_campaign`、`archive_campaign`。
- `src/app/api/merchant/[merchantId]/profile/route.ts` PATCH 的 merchant name/website 更新：页面 metadata、JSON-LD、sitemap 都可能变化。
- `src/modules/merchant/application/merchant-onboarding.ts` 中直接写 Store 的 create/frame/publish service path。
- `scripts/seed-store-luna.ts`、`scripts/seed-store-pilot.ts`、`scripts/seed-store-visutry-demo.ts` 等 seed/upsert writer，以及 catalog import/direct DB writer。
- 全局搜索没有发现 Store/Campaign 专用的 `revalidatePath()`。

### Unknown

- 没有找到应用层 merchant slug 修改或 public Experience slug 修改 endpoint；数据库管理员、外部批处理或未纳入 repo 的 writer 是否会改 slug/delete row，无法确认。
- 生产 Vercel 是否在这些缺少 invalidation 的路径上通过别的 webhook/tag 处理，仓库内无法确认。
- 生产是否配置了 host-level `www.visutry.com` ↔ `visutry.com` redirect，仓库内无法确认。

结论：当前不是 CASE A，而是 **CASE B**。TTL 仍是必要 safety net。

## Sitemap

- `src/app/sitemap.ts` 自身 `revalidate = 3600`。
- `src/lib/store-discovery-sitemap.ts` 的 DB read 使用 `unstable_cache`，TTL 为 `PUBLIC_DISCOVERY_CACHE.sitemapRevalidateSeconds = 1800`，tag 为 `public-discovery:sitemap`。
- DB query 先限制 `merchant.status = ACTIVE`，experience 只取 `STORE`/`CAMPAIGN`，active frames 只取 active ExperienceFrame 且 merchant frame 为 ACTIVE。
- 最终只有 `resolveExperienceSearchVisibility(...) === PUBLIC_INDEX` 的条目进入 Store/Campaign sitemap。DRAFT 为 PRIVATE；ENDED/ARCHIVED 为 PUBLIC_NOINDEX；缺少可读内容、足够 frames、merchant/product destination、合法 merchant policy 或 reference-data policy 时也不会进 index。
- Store 每 merchant 最多取一个 active Store；若没有 active Store，则会检查一个 fallback Store，但 visibility policy 会过滤不应公开的状态。
- 当前 sitemap 只输出英文 Store/Campaign URL，并以 `en`/`x-default` alternates 表示；没有为这些 discovery entries 输出 9 个 locale 的独立 sitemap URL。
- Sitemap invalidation 依赖 `revalidatePublicDiscoveryByRoute()`；未覆盖的 mutation path 会让 sitemap 继续依赖 1800s/3600s safety TTL。
- Store URL count: **COUNT BLOCKED**。
- Campaign URL count: **COUNT BLOCKED**。
- Total Store/Campaign URL count: **COUNT BLOCKED**。未连接任何 DB。

## URL Variant / Locale Analysis

本地安全 HTTP smoke 使用假 DB，只观察 redirect/routing，不把 500 页面当作业务结果：

| Variant | 本地结果 | 影响判断 |
|---|---|---|
| `/en/store/foo` | 进入 dynamic route，假 DB 下 500 | canonical route shape |
| `/en/store/foo/` | 308 → `/en/store/foo` | trailing slash 不形成独立最终 path |
| `/EN/store/foo` | 307 → `/en/store/foo` | 当前 middleware 规范化大写 locale |
| `/en-US/store/foo` | 307 → `/en/en-US/store/foo` | 不会规范化为 `/en-US` locale；不是同一 canonical entity |
| `/store/foo` | 307 → `/en/store/foo` | `localePrefix: 'always'`，无 locale 的入口被补 `/en` |
| `/en/c/foo/bar` | 进入 dynamic route，假 DB 下 500 | canonical Campaign route shape |
| `/en/c/foo/bar/` | 308 → `/en/c/foo/bar` | trailing slash 不形成独立最终 path |

- `middleware.ts` 使用 next-intl `localePrefix: 'always'`，matcher 排除小写支持 locale；`next.config.js`/build `routes-manifest.json` 还确认 trailing slash internal redirect。
- canonical metadata 使用 `SITE_CONFIG.url`；默认值是 `https://www.visutry.com`，部署环境可由 `NEXT_PUBLIC_SITE_URL` 覆盖。
- repo 没有 `www`/apex host redirect；`www.visutry.com` 与 `visutry.com` 的实际 Vercel domain behavior 为 **UNKNOWN**。
- Page 和 discovery helper 都不读取 `searchParams`。query 参数只在 client-side `StoreShopperExperience` 启动后用于 acquisition/continuation；当前代码没有把 `utm_source`、`gclid`、`fbclid` 放进 discovery `unstable_cache` key。
- 因此代码层不能证明这些 query 会产生独立 ISR artifact；Vercel CDN/ISR 对 query 的实际 cache-key behavior 在本地无有效页面时未确认。不要把 query string 自动计为独立 ISR key。

## Estimated ISR Read Economics

Vercel 官方单位是 8 KB/read；下表是纯模型：

| Relevant durable bytes | RU/read |
|---:|---:|
| 8 KB | 1 |
| 16 KB | 2 |
| 32 KB | 4 |
| 64 KB | 8 |
| 128 KB | 16 |
| 256 KB | 32 |

公式：`ceil(bytes / 8192)`。

| Route | Low | Base | High | 说明 |
|---|---:|---:|---:|---|
| Store | BLOCKED | BLOCKED | BLOCKED | 无安全 fixture 的成功 response/artifact bytes |
| Campaign | BLOCKED | BLOCKED | BLOCKED | 无安全 fixture 的成功 response/artifact bytes |

不能把 Store `page.js=4,889 B`、Campaign `page.js=5,078 B`、client manifest 或 NFT trace 加总；它们是部署代码/trace，不是一次 durable ISR read 的确认 payload。

也不能把假 DB 的 `2105 B` error response 用作 route payload。因而无法诚实地给出 `40,000 RU/day ÷ RU/read` 的 route-level read 数字；该数字需要 Vercel telemetry，而不是本地 build。

## Root Cause Assessment

### HIGH confidence

- Store/Campaign 是无 build-time allowlist 的 on-demand dynamic route：`dynamicParams=true` 且 `generateStaticParams()=[]`。
- discovery data cache key 按 locale + merchant slug + experience slug 分离；随机 slug 不会复用正常 slug 的 key。
- 公开写路径的 invalidation coverage 不完整；CASE B 成立，不能把 TTL 拉到 indefinite/on-demand-only。
- build 没有具体 Store/Campaign HTML/RSC/.meta artifact，所以当前部署不是“把整个现有 catalog snapshot 预先生成”导致的 Reads。

### MEDIUM confidence

- bot/random slug traffic 很可能放大 function render、discovery cache lookup，以及在 Vercel 上潜在的 ISR read/write path；但本地无法确认 404 是否持久化为 Vercel ISR artifact，也没有生产 path telemetry。
- 5-minute Campaign TTL 和 30-minute Store TTL 会在有真实访问的有效 path 上提供较短 safety window；它可能增加 revalidation/write 频率，但单凭 TTL 不能解释 ISR Reads 总量。

### LOW confidence

- `generateMetadata()` 和 Page body 都调用 discovery helper，存在两次 wrapper/read invocation 的代码路径；由于两者使用相同 cache key，实际 DB callback 是否重复执行需要 fixture instrumentation/线上 trace。它不是当前最可信的 ISR Reads 主因。
- query-string 或 apex/www host variant 是否在 Vercel 产生额外 ISR entries，repo 与本地隔离环境均不足以证明。

## Recommendations

### P0

- 为 Store/Campaign 增加 bounded public-slug admission：未知/随机 merchant 或 campaign slug 在进入可缓存页面 render 前被拒绝，只有 ACTIVE/PUBLIC slug index 中的路径允许进入 on-demand render；新发布路径走显式 publish/warm 流程。目标是直接压缩无限 random-slug key surface，并用同一批路径指标验证 ISR Reads 是否下降。

### P1

- 把所有 Store/Campaign public mutation（MCP/onboarding/import/admin/profile/batch writer）收口到同一个带 discovery invalidation 的 service boundary。完成前继续保留 TTL safety net。

### P2

- 在 P0/P1 和生产 telemetry 之后再评估 TTL：若 mutation coverage 完整，可考虑 Store 6h/24h、Campaign 30m/6h，或按业务实时性采用 on-demand 为主；当前证据不足以安全改成 indefinite cache。

## Recommended Next Change

唯一优先代码修改方向：**先为 Store/Campaign 实施“只允许已知 ACTIVE/PUBLIC slug 进入公开 ISR render”的 bounded admission layer，并保留 publish 时显式放行新 slug 的路径；不要先改 TTL。**

## Audit Acceptance

- Starting HEAD: `d35bb23b5a9a0143cd0de67ccec99f2b7656fc4d`
- Ending HEAD: `805d64791e57618694ab997b65733343f800cb07`
- Code changes required: NO
- Runtime code modified: NO
- Audit document: `docs/audits/vercel-isr-read-audit-2026-08.md`
- Build: PASS (`pnpm build:ci`; `pnpm build` intentionally not run because it migrates DB)
- Invalid slug local test: BLOCKED for business 404/negative-cache semantics; safe smoke executed with isolated fake DB and produced only 500 DB-error responses
- Production DB accessed: NO
- Production customer data accessed: NO

### Final conclusion

- Primary ISR driver = HIGH-confidence architectural exposure from unbounded on-demand Store/Campaign route variants; exact production share NOT CONFIRMED.
- Random slug amplification risk = YES at code level; Vercel durable 404/artifact behavior NOT CONFIRMED.
- Store estimated RU/read = BLOCKED without valid fixture/artifact bytes.
- Campaign estimated RU/read = BLOCKED without valid fixture/artifact bytes.
- Mutation invalidation completeness = INCOMPLETE; admin paths covered, MCP/onboarding/import/profile/batch paths not covered.
- TTL reduction safe = NO under current CASE B coverage.
- Recommended P0 = bounded ACTIVE/PUBLIC slug admission before public ISR render; do not implement in this audit.
