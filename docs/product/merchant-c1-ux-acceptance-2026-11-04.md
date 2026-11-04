# C1 Merchant First Value independent UX acceptance

> **Historical C1.0 result — superseded by [C1.1 acceptance](./merchant-c1-1-ux-acceptance-2026-11-04.md).** The HOLD below recorded the original mobile task-hierarchy issue. C1.1 passed the focused task-first UX review. Real Auth0 registration and callback remain a separate launch gate.

**Disposition: HOLD**

**App/tested commit:** `39262a9ab8d0b36273e62cd340420ba1dd59927a`

**Target:** Draft [PR #516](https://github.com/franksunye/VisuTry/pull/516), C1 only

**Date:** 2026-11-04

## Scope and method

I reviewed the latest handoff in [Issue #359](https://github.com/franksunye/VisuTry/issues/359) and the C-stage design in PR #516, then exercised the actual Chromium UI on isolated Local PostgreSQL databases with `APP_ENV=local`, `ENABLE_MOCKS=true`, and seeded QA identities. N and R used a clean merchant identity; E used the existing Consumer identity with no merchant membership. These fixtures test the post-auth workspace journey; they do **not** prove a real Auth0 registration.

The browser used 1440×900 desktop and 390×844 mobile viewports. No production data or merchant URLs were accessed. A sample website was saved during N, but the catalog was deliberately added manually; no URL inspection ran. C3 URL import was not implemented or accepted here.

## Journey results

| Journey | Result and observed actions | Persistence and First Value proof |
| --- | --- | --- |
| N — clean new merchant workspace | **PASS in Local Mock.** 8 clicks: Merchant Sign In → Clean Merchant → Create workspace → Add manually → Review → Approve and import → Create Store → Preview. | One required workspace field; website optional. Catalog inspection and preview POSTs returned 200. Private draft was visible and marked `DRAFT · not public`. One `merchant_store_previewed` A6 event persisted. |
| E — existing Consumer, no merchant | **PASS in Local Mock, mobile.** Same 8-step path after Start Free → Consumer. | Consumer identity received its first merchant membership; inspection and preview POSTs returned 200. Private draft remained unpublished. One A6 event persisted. |
| R — returning incomplete workspace | **PASS in Local Mock.** 10 clicks including the second sign-in; logout/re-auth restored the same merchant ID and name, then continued through the manual path. | No duplicate workspace. The returned user could add the first product and finish preview; inspection and preview POSTs returned 200; one A6 event persisted. |

Database readback confirmed one `merchant_store_previewed` event per N/E/R merchant, plus one for the clean First Value RC run. Browser journeys reported zero console errors, page errors, or HTTP responses ≥400. The harness recorded `ERR_ABORTED` only for old document requests interrupted by normal navigation. The full First Value RC test also passed with no browser or server errors.

On mobile, every captured surface fit the 390px viewport without horizontal overflow. The full page measured 6,659px at the empty-catalog state and 8,725px at private preview, about 10.3 viewport heights. The product form visually marks name and image as required and explains that either SKU or product URL supplies product identity. The browser reports two native required inputs for that form.

## Changes made

- Replaced the Merchant sign-in promise about copying an Agent Key and Skill with the actual GUI path to a private Store preview; agent connection is described as optional and later.
- Replaced the inaccurate “Merchant setup · 1 of 1” label with “Step 1 of 3 · Workspace,” and aligned the catalog/preview checklist numbers to steps 2 and 3.
- Updated the workspace heading and supporting text to state the next product and private-preview actions.
- Updated regression assertions and captured before/after Chromium screenshots.

## Before/after screenshots

| Surface | Before | After |
| --- | --- | --- |
| N sign-in, desktop | [1440px](./merchant-c1-evidence/N-signin-before-1440.png) | [1440px](./merchant-c1-evidence/N-signin-after-1440.png) |
| N workspace, desktop | [1440px](./merchant-c1-evidence/N-workspace-before-1440.png) | [1440px](./merchant-c1-evidence/N-workspace-after-1440.png) |
| E sign-in, mobile | [390px](./merchant-c1-evidence/E-signin-before-390.png) | [390px](./merchant-c1-evidence/E-signin-after-390.png) |
| E workspace, mobile | [390px](./merchant-c1-evidence/E-workspace-before-390.png) | [390px](./merchant-c1-evidence/E-workspace-after-390.png) |
| E catalog, mobile | [390px](./merchant-c1-evidence/E-catalog-before-390.png) | [390px](./merchant-c1-evidence/E-catalog-after-390.png) |
| E first-product form, mobile | [390px](./merchant-c1-evidence/E-product-form-before-390.png) | [390px](./merchant-c1-evidence/E-product-form-after-390.png) |
| E private preview, mobile | [390px](./merchant-c1-evidence/E-preview-before-390.png) | [390px](./merchant-c1-evidence/E-preview-after-390.png) |
| R returning incomplete state, desktop | [1440px](./merchant-c1-evidence/R-incomplete-before-1440.png) | [1440px](./merchant-c1-evidence/R-incomplete-after-1440.png) |
| R private preview, desktop | — | [1440px](./merchant-c1-evidence/R-preview-after-1440.png) |

## HOLD items

The direct path works, but the mobile workspace still stacks the First Value task beside substantial lower-priority content: plan and capacity, Insights, Agent setup, and workspace status. At 8,725px total height, a first-time owner must scan a long control-center page even though the needed task is near the top. Before C1 UX can pass, add a progressive first-value view that keeps the Agent channel available while collapsing unrelated workspace panels until A6.

The N route used a seeded clean Local Mock identity, not a newly registered Auth0 identity. A real Auth0 signup and callback remain outside this local acceptance and must be verified before claiming registration UX is accepted.

## Validation

- `npm run typecheck` — pass.
- `npm run lint` — pass with existing repository warnings; no lint errors.
- Merchant workspace and activation-checklist Jest tests — 10/10 pass.
- Chromium `p0-m1-merchant-auth-boundary.spec.ts` — 4/4 pass.
- Chromium `p0-l1-local-merchant-growth-lab.spec.ts` First Value RC — 1/1 pass; desktop/mobile route checks passed.
- Chromium `p1-m2-5-local-campaign-workspace.spec.ts` — 1/1 pass after correcting its stale workspace-heading expectation; this was test drift, not an application failure.
- N/E/R Chromium journeys on the app commit above — pass; private preview stayed non-public and A6 was deduplicated once per merchant.
- [Merchant Executed RC workflow](https://github.com/franksunye/VisuTry/actions/runs/41791807541) at PR head `beac9e07bcbf1d8ae1673980efefa4a38ef30cfb` — pass. Its sanitized Local/Mock ledger reports 4/4 required scenarios passed (First Value private preview, Campaign lifecycle, native-photo Catalog, CSV recovery); 0 failed, skipped, or ambiguous.
- [Quality Gate workflow](https://github.com/franksunye/VisuTry/actions/runs/41791807434) — Static + Critical Business Regression, Revenue Critical Browser Gate, and Sponsored PostgreSQL Contract all pass.
- The Vercel check was canceled by its Ignored Build Step; no preview or production deployment was performed.

**Historical decision at C1.0:** Keep PR #516 in Draft and C1 at **HOLD** until the mobile first-value view is simplified and Auth0 registration is independently observed. C1.1 resolved the UX item; Auth0 is now treated as a separate launch gate. See the current [C1.1 acceptance report](./merchant-c1-1-ux-acceptance-2026-11-04.md). No merge or production deployment was performed. C3 remains out of scope.
