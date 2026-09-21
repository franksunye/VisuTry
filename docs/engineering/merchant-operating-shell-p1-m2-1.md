# Merchant Operating Shell — P1-M2.1

P1-M2.1 establishes the route and composition boundary for the Merchant operating experience. It does not change Merchant authorization, tenant resolution, Catalog/Store state machines, billing, or publishing rules.

## Route map

All operating routes preserve `?merchantId=<id>` and resolve the selected Merchant through the authenticated membership boundary:

- `/[locale]/merchant` — Home
- `/[locale]/merchant/catalog` — Catalog
- `/[locale]/merchant/store` — Store
- `/[locale]/merchant/campaigns` — Campaigns status surface
- `/[locale]/merchant/analytics` — Commerce Intelligence
- `/[locale]/merchant/integrations` — Agent/MCP connection
- `/[locale]/merchant/plan` — Plan & Usage
- `/[locale]/merchant/settings` — Workspace settings

Primary navigation is Home, Catalog, Store, Campaigns, and Analytics. Integrations, Plan & Usage, and Settings are utility destinations behind More. Account and access remain account-level concerns.

## Lifecycle boundary

Before the durable `merchant_store_previewed` milestone, `/merchant` keeps the P1-M1 same-page activation journey: Add product → create Store draft → private Preview. It is not forced through route navigation.

After that milestone, `/merchant` is a compact Operating Home. Catalog, Store, Campaigns, Analytics, Integrations, Plan & Usage, and Settings are route-scoped surfaces. Home is not a second full Control Center and does not render the long Catalog/Store/Agent/Billing/Analytics stack.

## Context and safety

`merchant-workspace-context.ts` is the server boundary for session, available Merchants, selected Merchant, and OWNER/ADMIN membership. Route pages use it before loading workspace data. The client shell only owns navigation, selected-Merchant routing, active-route presentation, and workspace-entry telemetry; it is not an authorization boundary.

Campaigns intentionally exposes only merchant-readable status and readiness. Campaign CRUD, Agent capabilities, billing, and publishing remain in their existing application boundaries and are deferred to later gates.
