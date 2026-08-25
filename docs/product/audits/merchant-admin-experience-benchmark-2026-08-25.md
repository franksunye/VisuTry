# Merchant Admin Experience Benchmark — 2026-08-25

## Scope and decision rule

This audit covers the authenticated B2B Merchant Workspace at `/en/merchant` under the Agent-first operating model:

> Professional to understand. Simple to control. Agent-first to operate.

The audit asks whether a merchant can understand, inspect, approve, control, review results, and ask an Agent to act without being forced into a heavy manual backend. It does not require VisuTry to copy Shopify's manual surface area, and it does not assess Gate A/A4 Agent distribution proof.

The browser audit used the authenticated `VisuTry Demo` workspace in real Chrome on 2026-08-25. The live browser evidence below is the pre-deployment baseline for this pass. Code changes made after that audit are explicitly identified as local/test-verified rather than claimed as deployed browser proof.

## Industry benchmark references

- [Shopify Admin](https://help.shopify.com/en/manual/shopify-admin): central merchant hub with desktop/mobile access and object status management.
- [Shopify Analytics overview](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/using-the-overview-dashboard): date range, comparison, metric cards, visualizations, freshness, and drill-through to reports.
- [Klaviyo analytics dashboards](https://help.klaviyo.com/hc/en-us/articles/13267004984859): date range, comparison period, conversion context, refresh state, customizable cards, and export/report workflows.
- [Meta Ads Manager](https://www.facebook.com/business/tools/ads-manager): campaign-oriented operational hierarchy, delivery state, review/publish controls, filtering, preview, and performance inspection. The public surface is account-gated in this environment, so it was used as an industry IA benchmark and not represented as local browser evidence.

## Chrome evidence

### Desktop — 1365×768

- URL: `https://www.visutry.com/en/merchant`
- Authenticated workspace: `VisuTry Demo`
- `innerWidth=1365`, `innerHeight=768`, `scrollWidth=1350`, `scrollHeight=2704`.
- Header exposed the active merchant selector and `Overview`, `Insights`, `Setup`, and `Status` navigation.
- The first viewport exposed the Merchant Workspace identity, Agent connection state, Store state, active Campaign count, Insights state, and next actions.
- The Commerce Intelligence section exposed Visitors, Engaged Shoppers, Recommendation, Try-On, Compare, Product Click, High-Intent Shoppers, Store/Campaign context, and Acquisition Source.
- The Agent section exposed the one-time key setup sequence, Skill/endpoint details, and the conversation handoff.
- The status section exposed Store/Campaign type, status, selected-frame count, updated date, public URL, objective, gate, and presentation mode.
- Visual hierarchy was clean and professional. No internal database/table styling, clipping, or horizontal overflow was observed.

### Mobile — 390×844

- URL: `https://www.visutry.com/en/merchant`
- Authenticated workspace: `VisuTry Demo`
- `innerWidth=390`, `innerHeight=844`, `scrollWidth=375`, `scrollHeight=5294`.
- Header controls wrapped into a usable second row; the active merchant selector and section navigation remained visible.
- Hero buttons became full-width stacked actions; overview cards stacked without clipping.
- Commerce Intelligence cards, Store/Campaign context, Agent setup, and experience status remained in the DOM and usable through the long page.
- No horizontal overflow, broken card width, or obvious mobile-only dead end was observed.
- The main mobile cost is scan depth: the page is long, and analytics/Agent/status sections require scrolling rather than a compact mobile summary. This is P1, not a functional blocker.

## B1 — Merchant Home / Operational Overview

**Verdict: PASS with P1 operational-summary gaps.**

The first viewport answers the core questions within approximately ten seconds: workspace identity (`VisuTry Demo`), Agent state (`Not connected`), Store state (`Active`), Campaign count (`1`), shopper activity (`Available`), and immediate actions (`Connect your Agent`, `View status`). The page is readable as a merchant product, not an engineering console.

| Benchmark behavior | Current VisuTry behavior | Browser evidence | Priority | Recommended change |
| --- | --- | --- | --- | --- |
| Admin home makes status and the next action obvious. | Hero and four status cards expose workspace, Agent, Store, Campaign, and Insights state; the primary CTA changes with Agent readiness. | Desktop first viewport; mobile stacked hero/cards. | None | Keep the current hierarchy. |
| Mature admin surfaces expose an attention/freshness signal when something needs review. | No explicit `Needs attention`, last activity, or stale-data indicator exists on the overview. `Insights Available` and `Updated` dates provide partial context lower on the page. | Overview cards contain state and counts but no alert/freshness field. | P1 | Add a derived attention summary only when supported by an actual status/error/freshness source; do not add an empty alert panel. |
| Admin surfaces provide a recent activity or operational pulse. | Overview has aggregate state but not a recent event/activity line. | No recent activity element in the authenticated DOM. | P1 | Add a compact “Last workspace activity” value when a durable source exists; otherwise retain the current simple overview. |

The missing overview signals do not block operation because current state and next setup action are visible. They are material improvements for a premium admin standard, not evidence of hidden core functionality.

## B2 — Store / Catalog Control

**Verdict: PARTIAL under the current Agent-first model.**

The page makes the Store understandable and inspectable: `Active`, selected-frame count, updated date, public URL, `PRODUCT_FIRST` presentation, and Reference data status are all visible. The Agent Skill/MCP path is the intended control surface for catalog inspection, validation, Store configuration, preview, and approved operations. The current UI does not pretend to be a manual catalog editor.

| Benchmark behavior | Current VisuTry behavior | Browser/code evidence | Priority | Recommended change |
| --- | --- | --- | --- | --- |
| Product/admin objects show explicit lifecycle state and a clear preview/live distinction. | Store shows `Active` and a public URL. Draft experiences show `Private draft` in the component, but the audited Reference Store had no visible preview action in Merchant Workspace. | Status card: `VisuTry Demo Store`, `Active`, `6 selected frames`, public URL. `Experiences` component disables public link for `DRAFT`. | P1 | Keep preview and publish in the Agent workflow, but expose the current lifecycle/provenance in the status card (`Draft`, `Preview available`, `Published`) when the backend contract supplies it. |
| Merchants can inspect the actual selected catalog items, not only a count. | Workspace shows `6 selected frames`, not item names, validation state, or image errors. Agent can inspect catalog state through the merchant Skill/MCP path. | Desktop/mobile status card shows count only; no product-level list in the page. | P1 | Add a read-only “selected catalog” summary or link to Agent inspection once the existing catalog read contract can provide it; do not create a manual editor. |
| A merchant can recover or control a live object. | No Store archive/revert/control action appears in the Workspace; status copy says the Agent manages experiences. Rotation/revocation is available for Agent keys, but Store recovery is Agent-mediated. | Browser control inventory had status/public URL/copy actions, not Store update/archive controls. | P1 | Make the Agent-mediated recovery path explicit in the status card and ensure the Agent can inspect before proposing an update. Avoid destructive manual controls. |
| Errors and validation results are visible at the point of operation. | Merchant Workspace has no current Store validation/error panel; the Agent workflow carries validation/preview context. | No validation/error state in the live Store card. | P1 | Surface a persisted validation state or last validation result when available; do not display raw tool logs. |

This is intentional simplification only where the Agent can perform the operation and the merchant can inspect the resulting object. The current inspect/control boundary is not yet as explicit as a mature admin surface, so B2 remains partial rather than being marked PASS from Agent-tool existence alone.

## B3 — Campaign Operations

**Verdict: PARTIAL with no P0 shopper or visual blocker.**

The audited Campaign is an understandable operational object: `Everyday Fit`, `Campaign`, `Active`, `4 selected frames`, updated date, public URL, `INTENT` objective, `NONE` gate, and `EDITORIAL_FIRST` presentation. Campaign is visibly differentiated from a generic Store by type, color treatment, presentation mode, and policy context. Commerce Intelligence also separates Campaign activity from Store activity.

| Benchmark behavior | Current VisuTry behavior | Browser/code evidence | Priority | Recommended change |
| --- | --- | --- | --- | --- |
| Campaign tools expose lifecycle and delivery state such as Draft → Preview → Approve → Publish → Active. | Merchant Workspace shows the current status and public link but not the lifecycle stage or an approval/publish history. Agent prompt requires read-only startup and separate approval decisions. | Live card: `Campaign / Active / Everyday Fit / Open public page`; source `buildAgentSetup` contains explicit approval boundary. | P1 | Show a compact lifecycle/provenance line when supported by existing experience state/audit data; keep execution in Agent conversation. |
| Campaign objects state purpose, audience/context, selected subset, and destination. | Objective and presentation are visible; name and selected-frame count are visible; audience/narrative/context is not shown in the status card. | `Objective INTENT`, `Presentation EDITORIAL_FIRST`, `4 selected frames`, public path; no audience/narrative field in the live card. | P1 | Add a short campaign context/brief field only if it already exists in the campaign contract; do not invent a generalized Campaign Builder. |
| Campaign operations provide review, update, archive, and recovery. | Public-page and copy-URL actions are available; update/archive/recovery are Agent-mediated and not visible as merchant controls. | Browser control inventory; Agent Skill/MCP is the intended operational path. | P1 | Add explicit “Ask Agent to update/archive” guidance or lifecycle status, rather than manual controls that duplicate the Agent workflow. |
| Campaign performance can be read in campaign context. | Commerce Intelligence separates Campaign and Store metrics and source activity. | `Store / Campaign context` cards in authenticated Commerce Intelligence; Campaign `Everyday Fit` visible. | None | Preserve this context split. |

Campaign does not look like “Store with a different label”; it has distinct editorial/policy presentation. The remaining gap is operational confidence and lifecycle visibility, not a missing shopper path.

## B4 — Commerce Intelligence

**Verdict: PARTIAL.** The populated/empty metric contract is merchant-readable and passes its core proof boundary; comparison, trend, drill-down, and interpretation remain P1 benchmark gaps.

The current production Merchant Workspace is already merchant-readable rather than raw telemetry. The populated state showed:

- Visitors: `14`
- Engaged Shoppers: `10` / `71.4% engagement rate`
- Recommendation: `10` / `71.4% of visitors`
- Try-On: `4` / `28.6% of visitors`
- Compare: `0` / `0% of visitors`
- Product Click: `0` / merchant destination intent
- High-Intent Shoppers: `0` / aggregate behavioral signal
- Store/Campaign context: `Everyday Fit` and `VisuTry Demo Store`
- Acquisition Source: `visutry 14`
- Source → decision actions with an explicit consumer-event boundary

The controlled empty state is also deterministic in the same component contract and has unit coverage: `No shopper activity yet` and `Share a published Store or Campaign to start collecting decision signals.` No raw event payload, shopper identity, photo, revenue, or purchase claim is shown.

| Benchmark behavior | Current VisuTry behavior | Browser/code evidence | Priority | Recommended change |
| --- | --- | --- | --- | --- |
| Analytics makes the exact time context and freshness understandable. | Production copy said only `last 30 days`; the server contract already returned `period.from`, `period.to`, and UTC. | Live DOM hardcoded “last 30 days”; `MerchantCommerceIntelligence.period` exists in `merchant-control-center-cloudflare.ts`. | P1 — implemented in this pass | Render the exact UTC data window in Commerce Intelligence and Source → decision actions. The local component change does this without changing the data contract. |
| Analytics supports comparison/trend and change detection. | No date selector, prior-period comparison, trend chart, delta, or refresh/as-of control. | Authenticated populated page showed cards and context only. | P1 | Add comparison/trend only when a bounded supported data contract exists; do not fabricate revenue or unsupported conversion metrics. |
| Analytics supports drill-down or a clear next action. | Cards are readable but not drillable; original page lacked an explicit Agent handoff near the metrics. | Live DOM contained metric cards and Agent setup lower on the page. | P1 — implemented in this pass | Add the `Continue with Agent` handoff from the metric header to the existing Agent setup. It is a handoff, not a false direct action. |
| Analytics makes best/worst performer or interpretation easy to find. | Store/Campaign context is visible, but no ranked performer, interpretation, or recommendation is generated. | Context cards show counts for each Experience; no ranking/insight text. | P1 | Add a bounded interpretation only when the underlying data can support it; prefer Agent summarization over speculative dashboard claims. |
| Empty state is intentional and merchant-readable. | Empty state explains no activity and how to start; component/unit test covers the same production contract. | `MerchantControlCenter.test.tsx` empty-state regression; live component structure. | None | Keep the current empty state. |

The local implementation in this pass changes only the presentation layer: exact UTC window, rolling-window wording, source-report window label, and `Continue with Agent`. It does not claim that comparison, trend, or real distribution proof exists.

## B5 — Agent Control / Governance

**Verdict: PASS for the Agent-first control boundary, with P1 visibility work remaining.**

The page provides a secure connection path with a one-time Agent startup prompt containing the Skill, MCP endpoint, and Agent Key. The secret is shown once and the key management implementation uses masked credentials with rotate/revoke actions and merchant membership checks. The startup contract explicitly says to begin read-only and to keep create/update/set-frames/publish/archive/revoke/delete behind separate explicit approvals. The current Workspace now also states the human approval boundary directly beside the connection setup.

| Benchmark behavior | Current VisuTry behavior | Browser/code evidence | Priority | Recommended change |
| --- | --- | --- | --- | --- |
| Admin access shows safe connection setup, secret handling, and lifecycle controls. | Three-step setup, one-time secret modal, masked key metadata, rotate/revoke API paths, and no secret persistence in page state after close. | Live Chrome: `Create your secure key`, `Copy the Agent prompt`, `Talk to your Agent`; source tests cover one-time secret close. | None | Preserve the current key lifecycle and tenancy checks. |
| Human approval and destructive-action safeguards are visible. | Approval boundary existed in the generated Agent prompt; this pass adds a visible Merchant Workspace statement: human approval remains required before publish, archive, revoke, or delete. | `buildAgentSetup` contract plus updated Agent connection copy; unit test asserts the visible statement. | P1 — implemented in this pass | Keep this copy synchronized with the actual MCP safety contract. |
| Scopes and tenant context are understandable before an Agent acts. | Active merchant selector is visible; exact scope rows appear only after key setup in the current implementation, while the workspace copy now states the default scope count. | Live selector `VisuTry Demo`; source `MERCHANT_AGENT_SCOPES` defines seven default scopes. | P1 | Show a concise human-readable scope summary before key creation, without exposing secrets or adding technical clutter. |
| Admin can audit who/what acted and recover access. | Merchant operation audit exists server-side; the Workspace exposes key status/created/last-used/revoke/rotate, but not a merchant-readable operation history. | Key management source and audit writes; no visible operation-history section in live DOM. | P1 | Add an audit summary only when it can be presented as business-readable actions, not raw logs. |
| Reference/Simulation/Live provenance is visible. | Reference data is shown on experience/insight context; live status and public URL are shown for active experiences. | `Reference / Simulation` and `Reference data` badges; Store/Campaign `Active` and public URLs. | None | Preserve provenance labels. |

This is intentional Agent-first simplicity: the merchant retains authority while the Agent handles analysis/configuration/preview/execution/summarization. The remaining P1 work is making the control and recovery contract more visible, not introducing a parallel manual backend.

## Priority backlog

### P0

- None identified in this audit. The authenticated Merchant Workspace is usable on desktop/mobile, the populated Commerce Intelligence state is merchant-readable, the empty state is deterministic and covered by component/unit tests, and Store/Campaign shopper paths are represented by current status/public links.

### P1

- B1: add a real attention/freshness/recent-activity signal when a durable source exists.
- B2: expose Store lifecycle/preview provenance, selected catalog summary, and Agent-mediated recovery/validation state.
- B3: expose Campaign lifecycle/provenance and campaign context without building a manual Campaign Builder.
- B4: add supported period comparison/trend/drill-down/interpretation; this pass adds exact UTC window and Agent handoff.
- B5: show a concise pre-key scope summary and merchant-readable operation history when supported by existing audit data.
- Mobile: reduce long-page scan depth with bounded section navigation or a compact sticky context treatment after the core P1 data contracts are available.

### P2

- Export/shareable Commerce Intelligence snapshot.
- Configurable metric cards or saved merchant views.
- Richer product-level ranking and historical trend visualizations once the underlying event joins are durable.
- More granular mobile information architecture for advanced Agent governance details.

## Implemented in this pass

- `src/components/merchant/MerchantControlCenter.tsx`
  - uses the existing `MerchantCommerceIntelligence.period` contract to render the exact UTC data window;
  - replaces the ambiguous hardcoded analytics-window label in Source → decision actions;
  - adds an accurate `Continue with Agent` handoff from Commerce Intelligence to the existing Agent setup;
  - makes the human approval boundary visible in the Agent connection surface;
  - explains the existing default Agent scope domains without exposing a credential or pulling server-only credential code into the client bundle.
- `tests/unit/components/merchant/MerchantControlCenter.test.tsx`
  - covers the exact date-window rendering, Agent handoff, empty state, and visible approval boundary.
- This audit document records the real Chrome baseline and the remaining benchmark backlog.

## Tests and evidence status

- Real Chrome authenticated audit: PASS for desktop/mobile rendering and no horizontal overflow at the viewports above.
- `npx jest tests/unit/components/merchant/MerchantControlCenter.test.tsx --runInBand --testTimeout=30000`: PASS, 4 tests.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- The modified presentation code is local to the current branch and requires the normal deployment path before the new date-window/Agent-copy evidence can be called production browser proof.

## Final assessment

### Historical pre-deployment assessment — superseded by Production Acceptance below

### Final merchant admin experience: PARTIAL

Exact reason: the current authenticated workspace clears the professional visual and basic operational-confidence bar, with no P0 blocker found. It is already a credible Agent-first overview, Store/Campaign status surface, merchant-readable intelligence view, and governed connection flow. It is not yet at the full benchmark bar because lifecycle/recovery visibility in B2/B3 and comparison/trend/drill-down/actionability in B4 remain P1 gaps. These are bounded improvements; they do not justify adding a heavy manual backend or blocking the current Agent operating model.

## Production Acceptance — 2026-08-25

This section supersedes the deployment-pending evidence boundary above for the current acceptance decision. It records authenticated Chrome evidence against the production alias after deploying commit `83a770b7c79d77edc95d0a02775debee53d7d6d5`.

### Deployment and authenticated workspace

- Preview build: `dpl_FqjCWh7vL63SwXMe2STp8sJTMJ49`, `https://visutry-k6eligi4o-sunye.vercel.app`, READY.
- Production deployment: `dpl_81EpsvfbBNvAG6vgvigLkrfUBta3`, `https://visutry-8dzbdl19x-sunye.vercel.app`, READY; aliases include `https://www.visutry.com`, `https://visutry.com`, and `https://visutry.vercel.app`.
- Authenticated route: `https://www.visutry.com/en/merchant`.
- Workspace: `VisuTry Demo`.
- Evidence type: authenticated real Chrome session, read-only navigation and inspection; no fixture mutation, database shortcut, or auth bypass.

### B1 — Merchant Overview

**PASS.** Desktop at 1365×768 and mobile at 390×844 render the workspace identity, Agent state, Store, Campaign, Insights, primary actions, and sticky section navigation without horizontal overflow. The mobile hero stacks its actions cleanly. The prior mobile Status anchor collision was reproduced, fixed with responsive `scroll-mt-44 sm:scroll-mt-24`, and re-tested: all four section targets landed at `targetTop=176` with a `headerBottom=175`.

### B2 — Store / Catalog Control

**PASS.** Production showed `VisuTry Demo Store`, `Active`, `6 selected frames`, `Catalog 6 products · 6 active · 6 valid`, `Catalog ready`, `Live`, public-page access, selected product names, `PRODUCT_FIRST` presentation, and last recorded action. The Agent-first boundary is explicit: the page exposes the current tenant-scoped state and hands mutations to the Agent; no manual editor or unsupported direct mutation was introduced. No P0 remains. Non-blocking P1 work is richer lifecycle/recovery provenance when the existing audit contract can expose it.

### B3 — Campaign Operations

**PASS.** Production showed `Everyday Fit`, `Campaign`, `Active`, `4 selected products`, `Catalog ready`, `Live`, public-page access, selected frames, campaign headline/description, `INTENT` objective, `NONE` gate, and `EDITORIAL_FIRST` presentation. Campaign is materially differentiated from Store by narrative and editorial context, and its public shopper route remains available. No P0 remains. Non-blocking P1 work is more visible lifecycle/recovery history without adding a Campaign Builder.

### B4 — Commerce Intelligence

**PASS for the defined pre-outreach acceptance contract.** Authenticated production Chrome showed the populated merchant-readable metrics: Visitors `14`, Engaged Shoppers `10` / `71.4%`, Recommendation `10` / `71.4%`, Try-On `4` / `28.6%`, Compare `0`, Product Click `0`, and High-Intent `0`. It showed the exact UTC window, Store/Campaign context for `VisuTry Demo Store` and `Everyday Fit`, first-touch acquisition source `visutry 14`, and the `Source → decision actions` report. The comparison state was intentionally low-data-safe: `Not enough activity for a reliable comparison`, ranked context `1. VisuTry Demo Store` / `2. Everyday Fit`, and `No reliable leader yet` for unsupported/tied downstream leaders. `What to review next` and `Ask Agent to compare these Experiences` were visible. The same production component/data contract's empty state remains deterministically covered by `MerchantControlCenter.test.tsx`; no artificial authenticated empty fixture was created. No raw engineering telemetry, shopper identity, photo, revenue, or purchase claim was exposed.

### B5 — Agent Control / Governance

**PASS.** Production showed `Not connected`, secure key setup, explicit Agent scope domains, and the visible boundary: `Human approval remains required before publish, archive, revoke, or delete actions.` No secret was exposed in the inspected DOM, and no consequential action was executed during acceptance. The control model remains Agent-first with merchant approval, not an internal-tool console.

### Viewport evidence

- Desktop: `innerWidth=1365`, `innerHeight=768`, `scrollWidth=1350`, `scrollHeight=3762`; no horizontal overflow. Visual hierarchy and presentation were professional, with no clipping or internal raw-data styling.
- Mobile: `innerWidth=390`, `innerHeight=844`, `scrollWidth=375`, `scrollHeight=7418`; no horizontal overflow. Header, merchant selector, navigation, hero, cards, intelligence, and status sections remained usable. The long scan depth is a bounded P2 ergonomics item, not an acceptance blocker, because the sticky section navigation works without collision.

### Acceptance defects found and fixed

- Mobile sticky navigation: clicking `Status` previously positioned `Store and Campaign status` at `top=145` beneath the 175px sticky header. Fixed in `83a770b7c79d77edc95d0a02775debee53d7d6d5` by adding the mobile section offset; production re-test now reports `targetTop=176` for Overview, Insights, Setup, and Status.

### Final merchant admin experience

- P0 remaining: none.
- P1 remaining: non-blocking lifecycle/recovery/audit visibility for B2/B3 and richer analytics controls only where supported by durable data; no material P1 acceptance defect remains.
- P2: long mobile scan depth; export/shareable intelligence and richer historical visualization remain future enhancements.
- **FINAL MERCHANT ADMIN EXPERIENCE: PASS**
- **Merchant Experience Excellence is PASS under the Agent-first industry benchmark.**

### Validation note

- `npm run typecheck`: PASS.
- Focused Merchant Admin Jest suites: 4 suites / 13 tests PASS.
- `npm run build:ci`: PASS; only pre-existing lint and stale browser-data warnings.
- `npx playwright test tests/e2e/business.spec.ts --project=chromium`: 5/5 PASS.
- `npx playwright test tests/e2e/store-pilot.spec.ts --project=chromium --workers=1`: 7/8 PASS in the local environment. The one failure is the pre-existing real-session-dependent Campaign handoff test: `/api/store/sessions` did not complete, leaving `Starting session…`; the mock-driven Store/Campaign compare test passed. The production acceptance above is independent authenticated Chrome evidence and did not mutate a shopper session.
- `git diff --check`: PASS.

### Agent-first assessment

- Agent responsibilities: analyze workspace/catalog state; configure and create Store/Campaign objects; modify catalog/experience configuration; validate; preview; execute separately approved actions; read analytics; summarize results and next supported actions.
- Human responsibilities: select the merchant workspace; create/rotate/revoke Agent credentials; inspect current Store/Campaign/insight state; approve consequential actions; review public results and business-readable outcomes; decide whether to continue, update, archive, or stop.
- Is simplicity intentional and complete: intentional, but not complete. The lack of a manual catalog editor or Campaign Builder is correct because the Agent is the operating surface. The page still needs more visible lifecycle/recovery/provenance and analytics context so “simple” does not become “hidden.”

## Next 3 actions

1. Deploy this branch and re-run the same authenticated Chrome desktop/mobile checks so the exact UTC window and Agent handoff are live-proven.
2. Close B2/B3 P1 visibility gaps using existing experience status/audit contracts: lifecycle/provenance, selected-catalog summary, validation state, and Agent-mediated recovery guidance.
3. Extend the existing Commerce Intelligence contract with one bounded comparison/trend or Agent-readable interpretation, only after confirming the underlying durable data supports it.

## Closure pass — 2026-08-25

This closure pass stayed inside the existing Agent-first Merchant Workspace. It did not add manual Shopify-style catalog or Campaign CRUD, touch Gate A/A4, start outreach, or run real-merchant validation.

### B2 — Store / Catalog Control

**Implementation status: PASS. Browser evidence status: deployment pending.**

The production read model now exposes the actual tenant-scoped catalog and selected catalog rows through the existing `MerchantFrame` / `ExperienceFrame` contracts. `/en/merchant` renders:

- catalog totals: total, active, valid, invalid, and source counts;
- selected product names rather than only a frame count;
- deterministic readiness: `Catalog ready`, `Needs attention`, or `Select products to continue`;
- validation issues/warnings derived from the existing `validateCatalogFrame` contract;
- actual Store lifecycle status and public/private distinction;
- last recorded Store operation with merchant-readable action and actor class;
- an Agent handoff for updates, without pretending the page performs the mutation.

The selected frame query remains merchant-scoped and uses the same validation function as onboarding/preview. No manual catalog editor or hidden database path was added.

### B3 — Campaign Operations

**Implementation status: PASS. Browser evidence status: deployment pending.**

Campaign cards now expose the existing Campaign contract: lifecycle status, public/private distinction, selected catalog names, deterministic readiness, headline, description, CTA label, optional start/end dates, objective, gate, presentation mode, and last recorded operation. Campaign context is visibly distinct from Store context through its Campaign identity and editorial context block. The `Ask Agent to update` action is an explicit conversation handoff; it does not claim to publish or mutate from the browser.

No Campaign Builder, unsupported archive control, revenue metric, audience claim, or fabricated approval record was introduced.

### B4 — Commerce Intelligence

**Implementation status: PASS for the supported contract. Browser evidence status: deployment pending.**

The existing MerchantSession/Event/Intent data is now presented with bounded, deterministic interpretation:

- exact current UTC window and previous equivalent UTC window;
- metric-level deltas, with `No prior activity` rather than a fabricated percentage when the denominator is zero;
- a reliability threshold requiring at least two visitors in both periods;
- Experience ranking only when there are at least two Experiences and sufficient visitor volume per Experience;
- source leaders for visitors, downstream intent, and high-intent shoppers, with no leader claimed on ties/zero data;
- a `What to review next` explanation and Agent handoff;
- existing Store/Campaign context and source → decision-action cards remain unchanged in scope.

The interpretation is pure deterministic code, not an unsupported AI or revenue claim. The empty state continues to use the same production component/data contract and is covered by the existing component regression test; an authenticated empty browser fixture remains P1 and non-blocking.

### Post-change browser boundary

Real Chrome checks were rerun against the currently deployed authenticated `https://www.visutry.com/en/merchant` at 1365×768 and 390×844. Both retained the existing clean baseline: Store/Campaign/Insights sections were reachable and there was no horizontal overflow (`scrollWidth <= innerWidth`). The deployed DOM still contains the pre-pass `last 30 days` copy and does not contain the new comparison/readiness fields. The branch build was also opened in Chrome locally, but normal auth correctly redirected `/en/merchant` to `/en/auth/signin`; no local auth bypass was used. Therefore the new B2/B3/B4 fields are code/type/unit/build verified, not yet post-deployment browser-proven.

### Closure evidence

- `src/modules/merchant/application/merchant-control-center-cloudflare.ts` reads merchant-scoped catalog, selected ExperienceFrame rows, Experience narrative/lifecycle fields, and merchant-readable operation provenance from existing production tables.
- `src/modules/merchant/domain/merchant-control-insights.ts` contains the bounded comparison, ranking, source-highlight, and interpretation rules.
- `src/components/merchant/MerchantControlCenter.tsx` renders the new evidence and Agent handoffs without direct mutation controls.
- Focused unit coverage includes component states, Prisma read-model mapping, distribution report compatibility, and low-data/zero-denominator insight rules.
- `npx playwright test tests/e2e/store-pilot.spec.ts --project=chromium`: 8/8 passed, including Store/Campaign desktop/mobile presentation and attribution checks.
- `npx playwright test tests/e2e/business.spec.ts --project=chromium`: 5/5 passed, including Business/Pilot market-facing checks.
- `npm run typecheck` and `npm run build:ci` pass; build output contains only pre-existing lint warnings.

### Updated decision

No new P0 was found. B2, B3, and B4 are ready for the normal deployment/reverification step, but the overall Merchant Admin Experience remains **PARTIAL until the current SHA is deployed and the authenticated Chrome proof is repeated against that deployment**. This is an evidence boundary, not a new product blocker.
