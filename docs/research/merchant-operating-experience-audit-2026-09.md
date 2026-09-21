# P1-M2 Merchant Operating Experience Audit — 2026-09

## Scope and evidence

This is a read-only Local Merchant Growth Lab audit. No application code,
schema, billing rule, production data, Preview data, or deployment was
changed.

- Main audited: `b9c2fc71866f8d3b840afe1c34038185370ed161`
- Audit branch: `codex/p1-m2-merchant-operating-experience-audit`
- Runtime: `APP_ENV=local`, repository-local PostgreSQL, PrismaPg, mock auth
- Fixture: TEST Merchant `p1-m2-operating-audit-eyewear`, one manual product,
  DRAFT Store, zero campaigns, no shopper activity, Free plan, Agent not
  connected
- Viewports: `1440×900` and `390×844`
- Activation ledger: workspace created → first item → catalog ready → Store
  configured → Store previewed; `orderValid=true`
- Browser errors: 0; HTTP 5xx: 0; remote GA/GTM/Axiom requests: 0

## 1. Current operating journey

The Merchant experience is currently one `/en/merchant` page with hash
navigation. The top navigation is lifecycle-aware:

- Before First Value: `Overview / Catalog / Store`
- After First Value: `Overview / Insights / Setup / Status / Catalog / Store`

Activation order is effectively:

`workspace banner → First Value checklist → Catalog → Store → Overview →
Workspace details → Plan & Usage → Commerce Intelligence → Agent connection →
Workspace Status`.

After First Value, CSS ordering moves `Overview` first, followed by workspace
details, commercial state, intelligence, Agent, status, Catalog, and Store.
This is a useful lifecycle distinction, but the operating experience remains a
single long page rather than separate business workspaces.

## 2. Desktop findings

- The empty Activation Mode first viewport contains a workspace-created banner,
  the First Value checklist, and the beginning of the Catalog form. The next
  action is visible without scrolling.
- The operating first viewport is materially better than the activation view:
  `Workspace overview` appears first with Store, Catalog, Campaign, and shopper
  activity status chips.
- The operating page is still a long composition. The measured full-page
  height was approximately `3628px` at 1440×900.
- Catalog combines URL inspection, CSV upload, manual entry, and Catalog review
  in one large section.
- Store combines draft creation, details, product selection, preview, and
  publish in one large section.
- Workspace Status exposes useful state, but also exposes implementation-level
  fields such as `Objective`, `Gate`, and `Presentation`.
- Commerce Intelligence has a clear empty state, but is a full-width section
  embedded in the same page and includes an Agent CTA even with no activity.
- Agent connection is a large three-step setup surface and remains visually
  prominent after First Value.
- Plan & Usage contains plan state, limits, feature state, and several plan
  actions in the same page flow.

## 3. Mobile findings

- Activation navigation occupies two compact rows: merchant identity/switcher
  and a horizontal navigation row. It is usable, but the second row consumes a
  meaningful part of the first viewport.
- The activation mobile page measured approximately `6293px` full height.
- Operating mobile correctly changes to `Workspace overview` first and places
  Store/Catalog/Campaign/shopper status in the first viewport.
- The operating navigation is horizontally scrollable, but there is no strong
  visual affordance that more destinations exist off-screen.
- The operating mobile page measured approximately `6026px` full height.
- The first viewport starts to show operating status but not a complete task
  workspace; most actions remain below long stacked sections.
- The private preview is visually strong and product-first, but the preview,
  readiness, approval, and publish controls create a long mobile continuation.

## 4. Information architecture findings

The current structure is an anchor-based control center, not a resource-based
operating product. It is efficient for a first implementation, but it creates
three problems:

1. Home, configuration, monitoring, and commercial decisions are mixed in one
   scroll sequence.
2. Catalog and Store are both primary navigation destinations and large inline
   sections, so the same business objects are represented twice: as status in
   Overview/Status and as editors lower on the page.
3. Campaigns are represented in counts, intelligence context, and Workspace
   Status, but there is no dedicated Merchant self-service Campaign workspace
   in this control center. The visible action is generally `Ask Agent to
   update`, which makes the human operating boundary unclear.

Recommended long-term top-level structure, to validate in implementation:

`Home / Catalog / Store / Campaigns / Analytics / Integrations`

`Settings / Account` should remain outside the core business workflow. Plan &
Usage should be a secondary commercial destination or a compact Home status
surface that links to a dedicated plan detail view.

## 5. Home findings

The current operating Home is a compact summary after First Value, which is the
right direction. It currently answers basic status questions through chips and
four cards, but it does not yet provide a clear attention model or recent
outcome model.

Target Home contract:

1. Workspace identity and one recommended next action.
2. Attention/status: Store state, catalog issues, campaign state, usage state.
3. Small set of supported outcome metrics: shopper sessions, intent, Store
   state, catalog readiness.
4. Current Store and Campaign experiences with lifecycle state.
5. Useful next actions, with Agent as an accelerator rather than the default
   destination.

Home should summarize and route. It should not contain the full Catalog editor,
Store editor, Agent setup, billing feature matrix, or full Analytics report.

## 6. Catalog findings

Current user job: add, inspect, approve, correct, and search Merchant catalog
items. The implementation supports URL-first inspection, CSV, and manual entry;
the first-product path also gives a readable result such as `1 product is ready
to add` and a direct continuation to Store.

Observed issues:

- The section is both onboarding and ongoing catalog management.
- `Human catalog` is implementation-oriented language; `Catalog` is sufficient
  for the operating product.
- URL inspection copy is helpful but consumes significant vertical space in the
  same section as the resource list.
- Readiness is presented in a mostly merchant-readable way, but labels such as
  `Recommendation ready` and detailed correction states should be progressive
  detail rather than the primary resource identity.
- Search, add/import, review corrections, and item detail/edit are not yet
  separated into a clear collection/detail model.

Target Catalog workspace: collection header with count/readiness/attention,
primary Add or Import action, search/filter, compact resource list, and a
detail/review surface. Agent-prepared changes should appear as reviewable
proposals; approval remains human-controlled.

## 7. Store findings

Current user job: understand Store state, select products, preview, customize,
and publish. The private Preview uses the existing presentation shell and shows
the actual product early; `Private draft preview` and `DRAFT · not public` are
clear.

Observed issues:

- Store draft creation, product selection, detail editing, private Preview,
  readiness, and Publish are all one section.
- `Create Store draft` is still implementation language in the creation state;
  merchant-facing wording should be `Create your Store` with private-draft
  explanation.
- Store management appears below Catalog in the long operating page even when a
  Store already exists.
- Publish is correctly a separate consequential action and must remain so.

Target Store workspace: status header, selected products, shopper-facing
presentation, Preview, customization, and an explicit Publish approval area.
Agent may prepare changes, but Preview and Publish remain visible human review
boundaries.

## 8. Campaign findings

The audited fixture had zero Campaigns, so no populated Campaign card was
invented. Source inspection shows Campaigns are counted in Overview and Plan &
Usage, included in Commerce Intelligence context, and rendered alongside Store
in Workspace Status. The current Merchant control center does not expose a
dedicated Campaign collection/create/edit/publish workspace; the primary visible
operation is Agent-assisted.

Target Campaign workspace: campaigns list, Draft/Active/Archived lifecycle,
creation/editing, Preview, Publish approval, and performance. The next phase
must explicitly decide which human operations are direct and which are Agent-
prepared, rather than leaving Campaigns as a status-only concept.

## 9. Analytics findings

Commerce Intelligence currently provides a rolling 30-day window, Store/Campaign
context, source distribution, interpretation, and a clear no-activity state.
The empty state says to share a published Store or Campaign and offers Agent
continuation.

This is useful monitoring content, but it should become a dedicated Analytics
workspace with a compact Home summary. The Home should not duplicate the full
metric grid, source distribution, and experience ranking. Empty Analytics should
state what is missing and the single next action: publish/share an experience
or inspect setup.

## 10. Agent / Integrations findings

Agent connection is currently an embedded three-step setup area: create key,
copy prompt, talk to Agent. Advanced endpoint/key management is progressively
disclosed, which is appropriate for safety.

The current surface is larger and more prominent than an operating Merchant
needs after First Value. It belongs under `Integrations` or a dedicated Agent
detail surface. Home can retain a compact connection status and one action.
Credentials, rotation, and revoke are consequential integration actions and
should remain human-controlled.

## 11. Plan / Billing findings

Plan & Usage is server-derived and communicates Free, limits, feature
availability, and Store state. The audited DRAFT Store correctly said:
`Your Store is in draft on the Free plan.`

The card still mixes status, usage, feature matrix, plan comparison, and
conversion CTAs (`Unlock AI Try-On`, `Start Founding Pilot`, `View plan options`,
`Compare plans`). This is too much for the operating Home. Keep a compact plan
status/usage summary on Home and move detailed commercial comparison/actions to
Plan & Usage. Do not change entitlement or billing semantics in P1-M2.

## 12. Human / Agent responsibility model

| Domain | Human direct | Agent prepare/recommend | Agent execute with approval | System automatic | Never automatic |
|---|---|---|---|---|---|
| Catalog | approve/import, edit, remove | inspect sources, propose fields, flag issues | apply approved catalog changes | validate, dedupe, readiness | silently delete or publish |
| Store | review Preview, customize, Publish | prepare copy/product selection | save approved draft changes | readiness/cache/status | auto-publish |
| Campaign | create/approve/publish/archive | draft campaign, recommend timing/content | apply approved lifecycle changes | schedule/status aggregation | spend/send/delete without approval |
| Analytics | interpret, choose action | summarize/analyze/recommend | prepare follow-up actions | aggregate sessions/events | claim revenue or causality without evidence |
| Billing / commercial | choose plan, payment, cancel/restore | explain state and prepare options | execute only after explicit approval | entitlement/usage resolution | silent plan change or charge |
| Integrations | connect, rotate, revoke | guide setup and check connection | execute approved setup step | health/status reporting | expose keys or revoke silently |

The existing application boundaries are the right base for future Agent/MCP
work. P1-M2 should not introduce a second command bus or browser-only Agent
workflow.

## 13. Visual system findings

- Current outer sections use very large radii and blue-tinted surfaces in some
  activation areas, while operating cards are more restrained.
- The page has repeated card-inside-card patterns in Catalog, Store, Analytics,
  Agent, and Plan & Usage.
- The visual direction should keep the P1-M1.1 restrained neutral base,
  reserve blue for guidance/selected states, amber for attention, green for
  success, and use one dominant action per surface.
- Keep one outer section radius and one inner card radius; avoid nesting a full
  card inside a full card when a divider or resource row is sufficient.
- Preserve the existing sticky header, but make mobile discoverability of
  horizontally overflowed destinations explicit in P1-M2.
- Empty states should state current status, why it is empty, and one next
  action; avoid using Agent as the only resolution path.

## Issues

### P0

None observed in this read-only audit.

### P1

1. Operating Home, resource management, configuration, monitoring, and billing
   remain one long anchor page rather than clear operating workspaces.
2. Campaigns have no dedicated Merchant self-service workspace in the current
   control center; human lifecycle ownership is unclear.
3. Operating mobile is still a very long stacked page and requires too much
   scrolling to reach resource actions.

### P2

1. Rename `Human catalog` to `Catalog`.
2. Replace `Create Store draft` with `Create your Store` while keeping private
   draft semantics.
3. Improve horizontal navigation discoverability on mobile.
4. Move detailed Plan & Usage actions off Home.
5. Move Workspace Details into Settings or a quieter workspace control.
6. Reduce Agent prominence after First Value.
7. Reassess whether `Experiences / Workspace Status` is a first-class concept
   or a compact Home/status aggregation.

## Target IA

Proposed primary navigation:

```text
Home
Catalog
Store
Campaigns
Analytics
Integrations
```

Secondary/utility destinations:

```text
Plan & Usage
Workspace Details
Account / access
```

Page responsibilities:

- **Home:** status, attention, outcomes, recent/current experiences, next
  actions; no full editors.
- **Catalog:** product collection, import/add, search/filter, review/correction,
  product detail; no Store configuration.
- **Store:** Store status, selected products, presentation, Preview,
  customization, Publish approval.
- **Campaigns:** campaign lifecycle, create/edit, Preview, Publish, performance.
- **Analytics:** shopper activity, source/intent signals, interpretation,
  empty state, next action.
- **Integrations:** Agent/MCP connection, credentials, future commerce
  integrations, health/status.
- **Plan & Usage:** commercial state, usage, feature availability, plan actions;
  linked from Home rather than a dominant Home section.
- **Workspace Details:** brand identity and website settings.

Activation Mode may keep the focused `Overview / Catalog / Store` shell. Once
First Value is achieved, the full operating shell should become a real
resource-oriented workspace, not only a reordered long page.

## Target Home

At 1440×900, the first viewport should contain:

1. Workspace identity plus a compact Store/Catalog status line.
2. One primary recommended action, e.g. `Preview your Store`, `Publish Store`,
   or `Review catalog issue`.
3. An attention row with only current exceptions: draft Store, catalog issue,
   campaign issue, usage warning, or no shopper activity.
4. Three or four supported outcome cards: Store status, catalog ready count,
   shopper sessions, and high-intent/intent signals where available.
5. A compact current experiences list with Store/Campaign status.

Full Catalog, Store editor, Analytics, Agent setup, and billing comparison
should be one click away, not stacked into the Home first viewport.

## Remove / move / keep

| Current section | Decision | Reason |
|---|---|---|
| First Value checklist | Keep in Activation Mode only | It is a first-use guide, not an operating dashboard |
| Workspace-created success banner | Keep compact and state-aware | Useful continuation signal; should not persist as a generic long panel |
| Overview | Keep, evolve into Home | Correct operating entry point after First Value |
| Catalog editor | Move to Catalog workspace | Resource management should not be an inline Home block |
| Store editor/Preview | Move to Store workspace | Preserve Preview/Publish boundary while reducing Home length |
| Workspace Status / Experiences | Reduce and split | Home needs summary; resource pages need full lifecycle detail |
| Commerce Intelligence | Move to Analytics | Home keeps only an actionable summary |
| Agent connection | Move to Integrations | Keep compact status/action on Home |
| Plan & Usage | Move to commercial detail | Home keeps plan/usage summary and warning only |
| Workspace Details | Move to Settings | Identity settings should not compete with operations |
| Merchant switcher | Keep in shell | Merchant context is essential and must remain isolated |

## Implementation plan

The recommended gates are small and preserve current canonical application
actions:

1. **P1-M2.1 — Merchant shell + navigation:** establish lifecycle-aware shell,
   mobile overflow affordance, route/anchor compatibility, and Merchant context
   isolation.
2. **P1-M2.2 — Operating Home:** build status/attention/outcome summary using
   existing server control-center data; no new domain semantics.
3. **P1-M2.3 — Catalog workspace:** separate collection/import/review/detail
   presentation while reusing existing Catalog application APIs and actions.
4. **P1-M2.4 — Store workspace:** separate status/Preview/customization/Publish
   presentation while preserving the current private Preview and approval
   boundaries.
5. **P1-M2.5 — Campaign workspace:** make campaign lifecycle and human approval
   visible; reuse existing Experience/Campaign application boundaries.
6. **P1-M2.6 — Analytics + Integrations:** move full intelligence and Agent
   setup out of Home; keep compact summaries and safe links.
7. **P1-M2.7 — Mobile/cross-surface polish:** validate 390px/1440px density,
   navigation discovery, empty/error states, and cross-Merchant state reset.

No implementation should begin until Lead approves this target IA and the
scope of P1-M2.1.

## Screenshot evidence

Viewport screenshots and full-page copies are stored in:

`/tmp/visutry-p1-m2-operating-audit-3/`

The capture README/index is intended to accompany this audit. Key files:

| # | State | Viewport screenshot |
|---|---|---|
| 01 | Workspace creation | `01-workspace-create-desktop.png` |
| 02 | Activation Mode, empty Catalog | `02-activation-empty-desktop.png` |
| 03 | Manual first product | `03-first-product-desktop.png` |
| 04 | Product review | `04-product-review-desktop.png` |
| 05 | First product success | `05-first-product-success-desktop.png` |
| 06 | Create Store | `06-create-store-desktop.png` |
| 07 | Store ready for Preview | `07-store-preview-ready-desktop.png` |
| 08 | Private Store Preview | `08-first-value-preview-desktop.png` |
| 09 | Operating Mode | `09-operating-mode-desktop.png` |
| 10 | Activation Mode mobile | `10-activation-mobile.png` |
| 11 | Private Preview mobile | `11-first-value-preview-mobile.png` |
| 12 | Operating Mode mobile | `12-operating-mobile.png` |
| 13–17 | Catalog, Store, Status, Analytics, Agent | `13-*` through `17-*` |

## Final

`READY FOR LEAD ARCHITECTURE REVIEW`

`NOT READY FOR IMPLEMENTATION`
