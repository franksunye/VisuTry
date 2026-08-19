# VisuTry Operations Archive Index

**Status:** Historical reference index  
**Date:** 2026-08-19  
**Owner:** Product / Engineering

## Purpose

This index classifies completed Cloudflare/Vercel migration documents that remain useful as evidence but must not be used as current production-routing instructions.

Current production truth lives in:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `docs/operations/README.md`
4. `cloudflare-router/b4-production-routes.ts` / generated manifest

Historical documents are intentionally preserved because they contain benchmark, rollout, dependency, incident, and rollback evidence. They are **archive-by-status**, not current authority.

## Archived migration milestones

| Document | Archive status | Why retained |
| --- | --- | --- |
| `cloudflare-phase-a-build-parity.md` | Archived historical evidence | Original build-parity and OpenNext feasibility work. |
| `cloudflare-phase-a3-prisma-import-inventory.md` | Archived historical evidence | Prisma/import dependency investigation. |
| `cloudflare-phase-b1-auth-prisma-dependency-matrix.md` | Archived historical evidence | Auth/Prisma compatibility matrix. |
| `cloudflare-phase-b1-auth-read-parity.md` | Archived historical evidence | Read-parity experiments. |
| `cloudflare-phase-b2-write-parity.md` | Archived historical evidence | Scoped write-parity experiments; not current production ownership. |
| `cloudflare-phase-b3-integration-audit.md` | Archived historical evidence | Integration and bundle feasibility audit. |
| `cloudflare-production-route-boundary.md` | Superseded historical boundary | Replaced by ADR-011 + current hosting strategy. |
| `cloudflare-b3-2-capability-routing.md` | Archived historical milestone | Staging capability-router phase. |
| `cloudflare-b4-production-cutover-readiness.md` | Archived historical milestone | Pre-production route/cutover readiness. |
| `cloudflare-b4-2a-staging-public-slice.md` | Archived historical milestone | Staging public-slice activation evidence. |
| `cloudflare-b4-2b-scoped-production-routes.md` | **Superseded / do not execute** | Historical 286-route migration plan. Current production manifest is only 12 approved non-Next routes. |
| `cloudflare-b4-2c-phase-a-dns-zone.md` | Archived completed milestone | DNS-zone preparation. |
| `cloudflare-b4-2c-phase-b1-ns-cutover.md` | Archived completed milestone | Nameserver cutover evidence. |
| `cloudflare-b4-2c-phase-b2-universal-ssl.md` | Archived completed milestone | SSL activation evidence. |
| `cloudflare-b4-2c-phase-b3-www-proxy.md` | Archived completed milestone | www proxy cutover evidence. |
| `cloudflare-b4-2d-p0-production-cutover.md` | Archived completed milestone | Initial 12-route P0 production cutover evidence. |
| `vercel-cpu-static-page-pilot.md` | Historical implementation reference | Useful optimization evidence; not current hosting authority. |

## Incident record

`cloudflare-next-static-route-incident-2026-08-19.md` is **not deleted** and is not ordinary active guidance. It is a resolved incident + permanent guardrail record supporting ADR-011.

## Active operational documents

These remain current and are not archived:

- `hosting-strategy-vercel-cloudflare.md` — canonical hosting/runtime ownership.
- `hybrid-performance-benchmark.md` — long-term performance measurement discipline.
- `production-route-migration-performance-protocol.md` — applies only to future **non-Next capability** migrations unless ADR-011 is explicitly superseded.
- `vercel-quota-emergency-reduction.md` — Vercel quota emergency playbook.

## Deletion policy

Do not delete historical rollout/evidence documents merely because they are superseded: they are useful for incident analysis, rollback history, and future migration design.

Delete only documents that are duplicate, factually empty, or fully incorporated elsewhere with no audit value. During this 2026-08-19 governance pass, no operation document met that threshold.

## Guardrail

If an archived document conflicts with ADR-011, `hosting-strategy-vercel-cloudflare.md`, or the generated production route manifest, the archived document loses.
