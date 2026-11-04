# C1.1 Merchant First Value UX acceptance

| | |
| --- | --- |
| Disposition | **PASS — C1 Local Mock UX** |
| Separate launch gate | Real Auth0 registration and callback |
| App/tested commit | [`a1ed88f17bb1546e759cc9441e3a2650e6230f3c`](https://github.com/franksunye/VisuTry/commit/a1ed88f17bb1546e759cc9441e3a2650e6230f3c) |
| Target | Draft [PR #516](https://github.com/franksunye/VisuTry/pull/516), C1.1 only |
| Date | 2026-11-04 |

## Decision

The C1.1 task-first workspace closes the mobile information-architecture hold. In the first-value state, the primary path is **Workspace → Add product → Private preview**. Plan, Insights, Agent setup, and workspace status remain available in a collapsed, keyboard-accessible “More workspace tools” section. Completing the private preview immediately changes the workspace to its full operating layout; a refresh routes to the normal Home workspace.

N/E/R Local Mock journeys passed in Chromium at 1440×900 and 390×844. New merchants, existing Consumers without merchant membership, and returning merchants with an incomplete Store draft all saw the correct next action. The private preview stayed a draft and was never published. The revised layout does not change the business protocol, database schema, or First Value event rules.

Real Auth0 registration and callback observation remain an independent launch gate. That gate does not block this Mock-equivalent UX acceptance. C3 third-party URL import was not implemented or tested.

## UX changes

- The activation checklist now names all three stages, including the completed Workspace step.
- The merchant header points to Workspace, Add product, and Private preview while First Value is incomplete.
- Catalog and Store tasks lead the page. Plan, Insights, Agent setup, and workspace status are collapsed but remain reachable.
- On A6/private-preview completion, the full operating workspace is shown immediately. Returning Home after refresh exposes the normal operating navigation.
- Task mode follows the existing First Value and Store state. Returning users resume the same merchant, catalog, and unfinished preview step.

No merchant protocol, API contract, database schema, persisted First Value behavior, or C3 functionality changed.

## N/E/R browser journeys

All journeys used the isolated Local PostgreSQL database marked `LOCAL`, seeded deterministic Mock identities, the actual Next.js app, and Chromium UI. The Mock Auth callback establishes a local test session; it does not simulate or attest to Auth0 signup or callback behavior.

| Journey | Browser result | State and recovery evidence |
| --- | --- | --- |
| **N — new merchant** | **PASS.** Created a workspace, manually added and reviewed a product, created a Store draft, and opened its private preview. The 3-step progress and collapsed secondary tools were visible at desktop and mobile sizes. | The preview remained `DRAFT · not public`. A reload opened the normal Home workspace, with Catalog, Store, Analytics, Integrations, and Plan & Usage available. |
| **E — existing Consumer without a merchant** | **PASS.** Started from the existing Consumer entry, created a merchant workspace, and completed the same manual product-to-preview path, including mobile screenshots. | The new merchant membership and private Store draft were retained. After completion, the full operating layout and normal Home state appeared. |
| **R — returning incomplete merchant** | **PASS.** Signed back into the same identity after adding its first product and preparing a Store draft. | The same merchant ID and one product were retained. Workspace and product steps were complete, Preview remained the next action, and secondary tools stayed collapsed until First Value. |

The separate Local Mock onboarding regression also passed workspace creation, repeat-create idempotency, return to the existing workspace, and rejection of cross-tenant profile access.

## Screenshot comparison

The C1.0 screenshots below are the prior baseline. Page height is included as context only; the acceptance change is the task hierarchy and the collapsed state of secondary operating tools.

| Surface | C1.0 baseline | C1.1 result |
| --- | --- | --- |
| New/empty Catalog, mobile | [390×6659](./merchant-c1-evidence/E-catalog-after-390.png) | [First task screen, 390×844](./merchant-c1-1-evidence/N-task-first-screen-mobile-390.png); [full task workspace, 390×2664](./merchant-c1-1-evidence/N-task-workspace-mobile-390.png) |
| Existing Consumer task view, mobile | [C1.0 workspace, 390×844](./merchant-c1-evidence/E-workspace-after-390.png) | [First task screen, 390×844](./merchant-c1-1-evidence/E-task-first-screen-mobile-390.png); [full task workspace, 390×2770](./merchant-c1-1-evidence/E-task-workspace-mobile-390.png) |
| Returning incomplete merchant, desktop | [1440×3996](./merchant-c1-evidence/R-incomplete-after-1440.png) | [1440×1527](./merchant-c1-1-evidence/R-resumed-incomplete-desktop-1440.png); [mobile 390×2211](./merchant-c1-1-evidence/R-resumed-incomplete-mobile-390.png) |
| Completed First Value, mobile | [C1.0 full preview page, 390×8725](./merchant-c1-evidence/E-preview-after-390.png) | [Full operating workspace, 390×8021](./merchant-c1-1-evidence/N-after-private-preview-mobile-390.png) |
| Desktop first task screen | — | [1440×900](./merchant-c1-1-evidence/N-task-first-screen-desktop-1440.png) |
| Completed Home after refresh | — | [1440×949](./merchant-c1-1-evidence/N-returned-home-desktop-1440.png) |

The task-first first screen foregrounds the next useful action at both target sizes. After Private Preview, the full-height operating workspace is intentional and the supplementary sections are open. All tested 390px routes fit horizontally without overflow.

## Validation

- N/R private-preview lifecycle and post-preview operating routes: Playwright Chromium, **2/2 passed** in the Local Mock P0-L1 suite.
- Existing Consumer-to-preview mobile journey: Playwright Chromium, **1/1 passed** in the Local Mock P0-L1 suite.
- Onboarding, idempotent workspace retry, return state, and tenant ownership: Playwright Chromium, **1/1 passed**.
- Merchant checklist and control-center unit tests: **14/14 passed**.
- `npm run typecheck`: passed.
- `npm run lint`: passed with existing repository warnings; no lint errors.
- Browser run checked for horizontal overflow on desktop and mobile, JavaScript/console errors, and HTTP 5xx responses; none were reported by the passing N/E/R run.
- Catalog inspection and private-preview requests returned 200. Private preview stayed unpublished.
- Final code diff passed `git diff --check`.

## Release status

C1 Local Mock UX is **PASS** after C1.1. Real Auth0 registration and callback remain a separate **launch gate** and are not represented as tested here. Keep PR #516 in Draft for the next merge decision. No merge or production deployment was performed. C3 remains out of scope.
