# Vercel Storage Retention P0.1 — 2026-09-07

## Scope

This closeout covers the Vercel Pro Deployment Storage retention hardening
for the `sunye/visutry` project. It does not change application behavior,
Blob, Images, Functions architecture, ISR, Cloudflare, database, Axiom,
payments, or product behavior.

## Release evidence

- PR #193: merged
- PR #193 head: `2c14c80f84690dca63d491aafc042c6afbc120b7`
- Merge SHA: `111f17513508c4adab493bfb789041f9ec65ad03`
- Main SHA after merge: `111f17513508c4adab493bfb789041f9ec65ad03`
- Production deployment: `visutry-nwkxu25qg-sunye.vercel.app`
- Production deployment ID: `dpl_FuifrsdN5gWYKJ4snVs5ADqnQoDH`
- Deployed SHA: `111f17513508c4adab493bfb789041f9ec65ad03`
- Deployment created: `2026-09-07T04:37:20.193Z`
- Deployment READY: `2026-09-07T04:40:13.474Z`
- Production aliases preserved: `www.visutry.com`, `visutry.com`,
  `visutry.vercel.app`, and the project production aliases.

## Production health

The merged deployment was READY before retention configuration was changed.
Read-only endpoint verification after deployment returned:

- `/`: HTTP 200 (canonical redirect to `/en`)
- `/en`: HTTP 200
- `/api/health`: HTTP 200
- Recent Production 5xx log query (`1h`): 0 records

## Storage baseline

Captured from the authenticated Vercel Usage page for the current billing
cycle (`Sep 6, 3pm – Oct 6, 3pm`):

- Deployment Storage: `6 GB-months`, `$0.63`
- Function Storage: `2 GB-months`, `$0.18`
- Infrastructure subtotal at the final capture: `$1.28`
- Earlier baseline capture: `$1.27`

The small subtotal movement reflects normal billing-data refresh. No savings
estimate is made from this partial billing cycle, and Function Storage is not
expected or claimed to fall from this change.

## Deployment inventory

The latest Vercel deployment inventory page contained 20 deployments:

- READY: 14
- CANCELED: 6
- Production target: 7
- Preview target: 13

The latest deployment is the READY Production deployment listed above. The
previous Production deployment remained READY during rollout and was not
deleted. No manual deployment deletion occurred.

## Retention policy

Project-level policy observed before the change:

| Deployment class | Before |
| --- | --- |
| Canceled | 1 day |
| Errored | 1 day |
| Pre-Production | 2 weeks (14 days) |
| Production | 30 days |

Only the Pre-Production value was changed through the authenticated Vercel
project settings UI. Vercel confirmed the update with a success toast.

Project-level policy after the change:

| Deployment class | After |
| --- | --- |
| Canceled | 1 day |
| Errored | 1 day |
| Pre-Production | 1 week (7 days) |
| Production | 30 days |

The project settings expose these four explicit retention values. No minimum
Production-deployment count control, pinned/locked deployment control, or
retention inheritance selector was exposed on the project page. No such
setting was altered. The Production policy remains separately governed at 30
days.

## Safety checks

- The active production aliases resolve to the new READY Production
  deployment, not a Preview deployment.
- Previous READY Production deployments remain present as rollback candidates.
- No active alias was observed on an older Pre-Production deployment.
- No pinned or locked deployment was identified in the project deployment
  inventory; no deployment action was used to alter protection state.
- Canceled and Errored retention remained at 1 day.
- Production retention remained at 30 days.
- Vercel automatic retention remains enabled for this project.
- No manual mass deletion or individual deployment deletion occurred.

## Observation checkpoints

Retention cleanup and billing effects must be observed from Vercel Usage and
Deployment views; they are not inferred in advance.

- 24h checkpoint: `2026-09-08T04:42:10.571Z`
- 72h checkpoint: `2026-09-10T04:42:10.571Z`
- 7d checkpoint: `2026-09-14T04:42:10.571Z`

At each checkpoint, record Deployment Storage usage/cost, deployment counts by
state and environment, active Production identity, and rollback candidates.
Do not attribute a Function Storage reduction to this policy without direct
Usage evidence.

## Out of scope / deferred

- No Blob, Images, Functions architecture, ISR, Cloudflare, DB, Axiom,
  payment, or product behavior changes.
- No manual deployment deletion.
- No production retention reduction below 30 days.
- No minimum rollback-count change.
- No P1 work.

