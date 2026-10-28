# CPU Observability Governance

**Status:** proposed in PR; not enabled in Production.
**RCA:** Issue [#472](https://github.com/franksunye/VisuTry/issues/472) remains OPEN and INCONCLUSIVE. Preserve its existing evidence; do not rerun historical SHA profiling.

## Decision and boundaries

The purpose is to join three separate facts without conflating them:

1. **Function Active CPU** — Vercel's platform aggregate, grouped by the finest available time bucket, project, deployment and Function route.
2. **Request structure** — sampled application records for a fixed route family, actor segment, HTTP result and handler wall time.
3. **Release context** — the deployed Git SHA and whether the request ran in Production or Preview.

The Vercel Active CPU aggregate is the CPU source of truth. Do not estimate per-request CPU with `process.cpuUsage()` in concurrent Functions; its process-wide value can include other concurrent work. Do not substitute HTTP duration, database wait or provider wait for CPU. If current Vercel access cannot return a comparable CPU/deployment/route dimension, mark that dimension unavailable. Never infer a route's CPU share by multiplying wall time or sampled invocation counts.

This PR adds no provider, package, paid plan, project setting, deployed environment variable, Cron schedule or deployment. Instrumentation is **off by default**. Do not set `VISUTRY_CPU_OBSERVABILITY=1` in Production until the separate observability acceptance is approved and the 7-day P0/P1 baseline window is complete.

## Correlation contract

The first implementation samples high-value API families that distinguish Consumer, Merchant, shared Auth and background System work:

| Actor segment | Initial sample rate | Initial route families |
|---|---:|---|
| Consumer | 100% | Low-volume Try-On submit, Face Analysis submit and Store Try-On submit |
| Consumer | 10% | Higher-frequency Store session create |
| Merchant | 100% | Campaign collection, Store workspace and billing checkout |
| Admin | 100% | Reserved segment; no Admin-only route is instrumented in this first slice |
| System | 100% | The five scheduled retention, cleanup and pending-task Cron handlers |
| Shared | 10% | NextAuth handler |

Sampling is keyed by **stable route**, not actor. Rare high-value AI operations remain at 100% so a day with only a handful of requests does not disappear from the observed cohort. To avoid unbounded ingestion during a burst or bot attack, each warm Function instance permits at most **120 emitted observation records per route per UTC minute**, plus one `function_request_observation_capped` warning for that route/minute. This is a best-effort **per-instance** protection, not a global rate limit. When a cap marker occurs, sampled counts from that route/minute **must not be multiplied by `1 / sample_rate`** or reported as complete. The marker's delivery is also best-effort and must be included in the separate sink-loss acceptance.

The event is sent through the existing logger to the Vercel console and the existing Axiom transport. Console output is synchronous; Axiom ingestion is asynchronous best-effort and is not awaited by the request. Indexed fields reuse the existing audited schema: `event`, `route`, `role`, `httpStatus`, `durationMs`, `contentLength`, `environment`, and `method`. The bounded JSON message carries `schema_version`, `deployment_sha`, and `sample_rate` without expanding the Axiom indexed-field allowlist. Stable route labels are source constants; no raw path is recorded. The independent acceptance must verify delivered records and quantify any sink loss.

This is an initial high-value API slice, not complete request coverage. Dynamic/SSR pages and Edge/Middleware are not wrapped; use Vercel's native route/invocation view for them when exposed, and keep Edge/Middleware separate from Node Function CPU. The `admin` actor is reserved for a later explicit route annotation.

Records deliberately omit user, session, merchant, task and request IDs; URLs and query strings; IP addresses; cookies and authorization; request/response bodies; images; provider payloads; and external customer identifiers. `contentLength` comes only from a validated `Content-Length` header. `durationMs` is sampled handler wall time to the Response object, not CPU and not necessarily the full streamed-response lifetime.

Join order for analysis:

1. Match the exact Production environment and deployment SHA.
2. Align to the same complete UTC day (or an explicitly agreed timezone, applied to every source); retain raw timestamps and flag partial buckets.
3. Compare Vercel Active CPU and Function invocations at the same route/deployment grain when the connected plan exposes it.
4. Use sampled request events to estimate actor-segment and workload mix. Apply each **route's** sample rate only for uncapped, complete buckets; report sample counts, uncertainty and any cap markers, and do not treat the estimate as a platform invocation count.
5. Keep Preview, Edge/Middleware, static/cache-served responses, Cron, Consumer and Merchant separate. State which sources are missing and leave unmatched CPU as residual.

Vercel Custom Metrics are intentionally not used: querying them requires Observability Plus. The plan does not authorize a paid upgrade. Existing native Vercel CPU aggregates and the current Axiom/Vercel log path are the only sources in scope.

## P0/P1 post-release baseline

The active daily record is [Issue #476](https://github.com/franksunye/VisuTry/issues/476).

P0 #470 was deployed at 2026-10-27 19:32:31 +08:00 and P1 #471 at 2026-10-27 22:58:21 +08:00. The baseline is therefore a combined post-P0/P1 observation, not a separate estimate of either change.

Observe seven consecutive complete calendar days, 2026-10-28 through 2026-11-03 inclusive, using `Asia/Shanghai` day labels and recording the underlying UTC window. Capture each completed day on the following morning, read-only, and record:

- Vercel Function Active CPU seconds and invocations, exact dashboard/API grain, environment, bucket timezone, completeness and retrieval time.
- Production deployment SHA(s) active in that bucket; flag any deployment or configuration change.
- Axiom sampled event count and estimated Consumer/Shared/Merchant/System mix, with sample rates and raw sample counts.
- Available route-family and platform CPU dimensions; mark missing dimensions explicitly.
- Errors or material changes in traffic, bot/cache mix, Cron activity, request size or provider retry behavior only when directly evidenced.

Do not fill gaps with chart-pixel estimates as if they were raw data. If Vercel exposes only total CPU/invocations, report total CPU per invocation as an aggregate and state that route attribution remains unavailable. A seven-day baseline is descriptive; it does not by itself pass #472 or prove P0/P1 caused a change.

Daily baseline record template:

```text
date_label | UTC start/end | env | deployment SHA(s) | Active CPU seconds | Function invocations | CPU/invocation | route grain | actor sample counts/rates | completeness/source | notes
```

## Independent acceptance for the implementation

Do not enable this telemetry or close #472 until a separate review confirms:

- Disabled/default and local paths emit no CPU-observation records and do not change route responses.
- Production and Preview records carry the expected deployment SHA and stable route/actor values.
- The sampled count can be weighted by the recorded **route** rate and is reported with uncertainty; Merchant/System are 100% until a per-instance burst cap is reached. Capped buckets are marked incomplete and never extrapolated.
- No PII, secrets, request bodies, user-controlled path labels or new indexed Axiom fields are emitted.
- The source remains Vercel Active CPU for CPU totals; wall time is labeled separately.
- Ingestion volume, sampling and query access work under existing service entitlements without a plan purchase.
- Instrumentation's own cost/latency is acceptable before any Production enablement.

Until then, this PR is code and governance only: no Production environment change, data write, synthetic load, merge or deployment is authorized by this proposal.
