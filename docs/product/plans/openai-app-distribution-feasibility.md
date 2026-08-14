# VisuTry OpenAI App / MCP Distribution Feasibility

> **Superseded as primary strategy (2026-08-14).** Universal Remote MCP + OAuth is now the primary agent-access architecture. This document is retained as a channel-specific OpenAI/App distribution appendix; marketplace publication is optional discovery/setup, not a capability dependency. See [`universal-agent-access.md`](./universal-agent-access.md).

**Status:** FEASIBILITY / DECISION RECORD<br>
**Reviewed:** 2026-08-14<br>
**Repository:** `main` at `9214005413ba54f8b0219ef238704b450bfc3a62`<br>
**Code changes:** No production feature code, schema, or credential changes were made.

## 1. Executive decision

**Decision: YES WITH MATERIAL PLAN/WORKSPACE LIMITATIONS.**

The public distribution path exists, and the current VisuTry MCP is close enough to reuse as the resource server. A Merchant who is not part of VisuTry's OpenAI developer organization can eventually discover a public VisuTry plugin, connect it, authenticate with VisuTry, select one Merchant workspace, and use tenant-bound tools. The path is not ready for submission today.

The important commercial limitation is writes: OpenAI's current documentation explicitly places full MCP write/modify support in ChatGPT Business and Enterprise/Edu, while Pro is documented for custom MCP read/fetch use in developer mode. Therefore:

- Public plugin distribution is viable as a read-heavy channel across supported personal and workspace surfaces, subject to plan, region, role, and workspace controls.
- A supported write path for a normal SMB Merchant should be positioned around Business or Enterprise/Edu, with an administrator-controlled app and action policy.
- `MerchantAgentCredential` and `vt_live_*` keys should remain as the developer/CI/advanced fallback. OAuth should be an additional adapter, not a replacement.

The next step is a bounded staging OAuth and metadata proof. Do not submit the current endpoint or implement a full production OAuth rollout until that proof passes.

## 2. Official OpenAI findings

Sources were checked against official OpenAI documentation on 2026-08-14. Where the page did not expose a calendar last-updated date, this record uses the review date.

| Official document | Last updated shown | Relevant requirement |
|---|---:|---|
| [Plugin architecture – Plugins](https://developers.openai.com/plugins/concepts/plugins) | Not shown | Plugins are the discover/install/publish package; a plugin may contain skills, an MCP server, or both. ChatGPT and Codex share the universal plugin directory, while individual capabilities remain surface-specific. |
| [Skills – Plugins](https://developers.openai.com/plugins/concepts/skills) | Not shown | Skills provide repeatable workflow instructions; the MCP server provides live data, authentication, authorization, and controlled actions. |
| [MCP server – Plugins](https://developers.openai.com/plugins/concepts/mcp-server) | Not shown | Production servers should use stable HTTPS and Streamable HTTP; private data and actions require MCP authorization. |
| [Authentication – Plugins](https://developers.openai.com/plugins/build/auth) | Not shown | Authenticated MCP servers are expected to implement OAuth 2.1 conforming to the MCP authorization spec, including protected-resource metadata, authorization-server metadata, `resource` propagation, PKCE, and token verification. Auth0 is listed as an established provider option. |
| [Submit plugins](https://developers.openai.com/plugins/deploy/submission) | Not shown | Public submission is supported through the OpenAI Platform. It requires verified developer identity, Apps Management write access, listing metadata, public MCP URL, authentication details, tool metadata/annotations, prompts, test cases, countries, and attestations. |
| [MCP server review requirements](https://developers.openai.com/plugins/deploy/app-review) | Not shown | Every tool must expose accurate `readOnlyHint`, `openWorldHint`, and `destructiveHint`; review checks authentication, test credentials, output privacy, tool behavior, and annotations. |
| [Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt) | Page currently says “Updated: yesterday” | Developer mode and full MCP, including write/modify actions, are available to Business and Enterprise/Edu on ChatGPT web. Pro can connect custom MCP with read/fetch permissions in developer mode; full MCP is currently limited to Business and Enterprise/Edu. |
| [Plugins in ChatGPT and Codex](https://help.openai.com/en/articles/20001256) | Page-relative update shown in current page | The Plugins Directory is the primary discovery surface for ChatGPT and Codex. A listing can include apps, skills, and app templates; actual use depends on plan, workspace settings, role, surface, region, and included app capabilities. |

### Product model answers

| Question | Current answer |
|---|---|
| Public third-party app/plugin submission | **YES.** The current submission portal accepts public plugins for review and publication. |
| Ordinary developer eligibility | **YES, conditional.** A verified individual or business identity and organization Apps Management write access are required. Approval is not automatic. |
| Standalone App Directory | **NO as the current primary name.** The current public discovery surface is the universal Plugins Directory; new app-backed submissions arrive as plugins. |
| Public external-user distribution | **YES, conditional.** A published plugin can be discovered by users outside VisuTry's developer organization, but connection and invocation remain subject to the user's plan, workspace policy, role, region, and app controls. |
| ChatGPT Developer Mode | Private/custom MCP app creation and testing for eligible accounts/workspaces; it is not proof of public directory distribution. |
| ChatGPT App / app-backed MCP | The connected integration that exposes tools, authentication, and actions to ChatGPT. Custom UI is optional. |
| Codex Plugin | The distributable package shared through the universal Plugins Directory; it may contain skills, an MCP server, or both, and can be surface-specific in behavior. |
| Codex MCP | The MCP server capability as consumed by Codex. It is not the same thing as a plugin listing or ChatGPT Developer Mode draft. |
| Skill | Workflow instructions and resources. Installing/publishing a skill alone does not create an MCP connection or grant tool access. |
| MCP server | The remote resource server that owns tool schemas, authentication, authorization, execution, and results. |

## 3. Plan/workspace compatibility

The matrix below records only what current official documentation establishes. `NOT CONFIRMED` is intentional where the docs do not establish a plan-specific answer.

| Surface/plan | Discover public plugin | Connect app | Custom MCP | Write tools | Admin/workspace approval | SMB suitability |
|---|---|---|---|---|---|---|
| ChatGPT Free | YES: directory is visible across plans | CONDITIONAL: listing/app availability may disable Connect | NOT CONFIRMED | NOT CONFIRMED for custom MCP | Personal settings; workspace rules if applicable | Not suitable as the target write channel |
| ChatGPT Go | YES | CONDITIONAL | NOT CONFIRMED | NOT CONFIRMED for custom MCP | Personal settings; workspace rules if applicable | Not suitable as the target write channel |
| ChatGPT Plus | YES | YES/CONDITIONAL | YES in the current apps capability table | NOT CONFIRMED; do not promise full custom-MCP writes | Personal settings | Suitable for read-heavy validation only |
| ChatGPT Pro | YES | YES/CONDITIONAL | YES in the current apps capability table; developer-mode custom MCP is documented as read/fetch | NO for the full MCP write path documented here | Personal settings | Suitable for read-heavy validation only |
| ChatGPT Business | YES | YES, unless workspace-disabled | YES | YES, subject to app permissions and action controls | Admin/owner controls; apps enabled by default but can be disabled | **Best first SMB write target** |
| ChatGPT Enterprise/Edu | YES | YES after workspace enablement | YES | YES, subject to admin/RBAC/action controls | Admin/owner enablement; apps disabled by default; RBAC available | Suitable for controlled pilots and review |
| Codex-supported plugin surface | YES through the universal Plugins Directory | Conditional on surface, plan, role, and app access | Plugin/MCP support is documented, but exact plan/action behavior is surface-specific | NOT CONFIRMED outside the ChatGPT Business/Enterprise/Edu write evidence | Workspace/plugin controls may apply | Validate separately from ChatGPT |

### Answer to the primary user question

An ordinary eyewear Merchant without VisuTry internal permissions and outside VisuTry's OpenAI developer workspace **can use the public path after publication and approval**, provided the Merchant's ChatGPT surface and workspace permit the plugin and the Merchant completes VisuTry OAuth. For the requested read plus approved write flow, the defensible target is **Business or Enterprise/Edu**. A personal Plus/Pro account must not be presented as supporting the full write flow.

## 4. Current VisuTry state

### Already implemented

- `POST /api/mcp` exists at [`src/app/api/mcp/route.ts`](/Users/yesun/Code/visutry/src/app/api/mcp/route.ts).
- The route uses `WebStandardStreamableHTTPServerTransport` with no server session ID and JSON responses.
- The route authenticates `Authorization: Bearer <vt_live_...>` with `MerchantAgentCredential`, consumes a merchant/credential rate limit, creates a tenant-bound MCP server, and returns `Cache-Control: no-store`.
- `MerchantMembership` is explicit and unique per `(userId, merchantId)`, with `OWNER` and `ADMIN` roles.
- `MerchantAgentCredential` stores a hashed secret, merchant ID, scopes, status, rotation lineage, last-used timestamp, and creator.
- `MerchantActorContext` carries `actorType`, `actorId`, `merchantId`, and scopes. Domain services consistently receive the actor or merchant ID and reject cross-tenant resource access.
- Agent operations are written to `MerchantOperationAudit`; MCP requests are rate-limited per merchant and credential.
- The MCP server exposes 22 Store, Campaign, and aggregate Analytics tools.
- The public Merchant Skill is available at `/skills/merchant` and combines Merchant Onboarding, Campaign Creation, and Commerce Analyst workflow guidance in one connection-neutral document: [`src/lib/merchant-skill.ts`](/Users/yesun/Code/visutry/src/lib/merchant-skill.ts).
- Merchant Control Center provides Merchant selection, the simplified Agent setup, endpoint copy, the single Skill URL, and explicit publish language in [`src/components/merchant/MerchantControlCenter.tsx`](/Users/yesun/Code/visutry/src/components/merchant/MerchantControlCenter.tsx).
- Public privacy and terms routes exist, and support/legal email addresses are present in the site.

### Required specifically for OpenAI public distribution

- OAuth 2.1 resource-server integration and OpenAI/MCP discovery metadata.
- A production redirect allowlist for `https://chatgpt.com/connector/oauth/{callback_id}`; the exact callback is shown in the app/plugin management flow and must be copied exactly.
- PKCE S256, `resource` propagation, token issuer/audience/expiry/scope validation, and refresh/revocation behavior.
- A merchant-selection and consent transaction that binds one token to one Merchant.
- OAuth-aware `WWW-Authenticate` challenges and tool-level OAuth metadata/security schemes.
- Accurate `readOnlyHint`, `openWorldHint`, and `destructiveHint` annotations for every tool.
- Public submission metadata, verified publisher identity, domain verification challenge, starter prompts, five positive and three negative test cases, reviewer-safe credentials/fixtures, release notes, and country availability.
- A privacy/support submission surface specific enough to disclose what the plugin returns and what remains in VisuTry.
- Actual Developer Mode and independent-workspace tests. Current repository unit tests are not a substitute for those tests.

## 5. MCP compatibility audit

**Overall result: PARTIAL.** The transport and core tool execution are compatible; authentication discovery, OAuth, and review metadata are missing.

| Contract | Current evidence | Result |
|---|---|---|
| Stable HTTPS endpoint shape | The app builds the endpoint as `https://<host>/api/mcp`; production host configuration exists, but live endpoint reachability was not tested in this spike. | PARTIAL |
| Streamable HTTP | `WebStandardStreamableHTTPServerTransport` is used. | YES |
| `initialize` | Automated MCP route test passes. | PASS |
| `tools/list` | Automated test returns all 22 tools. | PASS |
| `tools/call` | Automated tests pass for read, Campaign create/publish, Analytics, and scope rejection. | PASS |
| Schemas | Zod input schemas are present for every tool. | YES |
| Output shape | Model-readable JSON is returned as MCP text content; no output schemas are declared. | PARTIAL |
| Auth | Only long-lived, manually-created Agent Keys are accepted. | NO for public OAuth |
| Protected resource metadata | No `/.well-known/oauth-protected-resource` route found. | MISSING |
| Authorization-server discovery | No VisuTry OAuth discovery route/configuration found. | MISSING |
| OAuth security schemes | No MCP tool `securitySchemes` metadata found. | MISSING |
| Tool annotations | No `readOnlyHint`, `openWorldHint`, or `destructiveHint` found. | MISSING / submission blocker |
| Error/auth challenge | Current route returns JSON 401 for missing/invalid Agent Key; it does not return the OAuth `WWW-Authenticate`/MCP auth challenge. | PARTIAL |
| Session behavior | Stateless transport is compatible with a bearer-token resource server. | YES, pending auth adapter |

The current automated evidence is [`tests/unit/app/api/mcp-route.test.ts`](/Users/yesun/Code/visutry/tests/unit/app/api/mcp-route.test.ts). It passed 5/5 tests on this run. The test proves the VisuTry route contract, not a ChatGPT host connection.

## 6. Tool review and write safety

### READ

`get_onboarding_status`, `get_merchant`, `list_frames`, `validate_catalog`, `preview_store`, `list_campaigns`, `get_campaign`, `preview_campaign`, `get_experience_summary`, `get_experience_funnel`, `get_top_frames`, `get_intent_summary`, `compare_experiences`.

These are good candidates for a first read-heavy public surface. Analytics returns merchant-scoped aggregate signals and explicitly marks unavailable revenue, order, ROAS, identified-intent, and lead metrics.

### WRITE

`import_frames`, `create_store`, `set_store_frames`, `create_campaign`, `set_campaign_frames`, `update_campaign`.

These mutate merchant-owned state but are bounded by existing scope checks, merchant IDs derived from the actor, validation, and audit writes. They require `readOnlyHint: false`; `openWorldHint` should be set according to whether the action changes a public/external state; `destructiveHint` should be conservative and reviewed per tool.

### HIGH-IMPACT WRITE

`publish_store`, `publish_campaign`, `archive_campaign`.

Publishing changes public availability. Archiving stops interactive operation and should be treated as a high-impact state change even though the data is retained. These tools need especially clear descriptions, annotations, negative test cases, and workspace action controls.

### Double approval contract

Keep both layers:

1. OpenAI's app permission/confirmation layer decides whether ChatGPT asks before an action.
2. VisuTry remains the server authority. `publish_store` and `publish_campaign` must continue to require `approved=true`, validate deterministic readiness, bind the request to the selected Merchant, and record the operation audit.

OpenAI confirmation does not prove that a request is authorized for the Merchant, and it must not replace `approved=true`.

## 7. Authentication gap and recommended architecture

### Current path

```text
Authorization: Bearer vt_live_...
        -> authenticateMerchantAgentCredential
        -> AgentMerchantActor { merchantId, scopes }
        -> existing domain services
```

### Target path

```text
ChatGPT/Codex plugin
        -> OAuth 2.1 authorization-code + PKCE S256
        -> Auth0 login / VisuTry merchant consent
        -> token bound to exactly one Merchant and approved scopes
        -> /api/mcp resource-server verification
        -> OAuth actor adapter
        -> existing MerchantActorContext/domain services
```

### Reuse vs. addition

| Area | Reuse | Addition |
|---|---|---|
| Merchant authorization | `MerchantMembership`, `requireMerchantMembership`, OWNER/ADMIN roles | Authorization transaction must call membership resolution after login and before code/token issuance. |
| Scope semantics | Existing `merchant:*`, `catalog:*`, `experience:*`, and `analytics:read` scopes | Publish a reviewed subset in OAuth metadata; do not create a second permission vocabulary. |
| Tenant enforcement | `MerchantActorContext`, `requireAgentScope`, tenant-scoped Prisma queries, anti-enumeration errors | OAuth token claims/authorization record must supply the same single `merchantId`; no tool may accept an arbitrary merchant ID. |
| Audit | `MerchantOperationAudit`, existing actor/action/resource fields | Use an OAuth authorization or stable token subject as `actorId`; never log raw access or refresh tokens. |
| Rate limiting | Existing per-merchant/per-credential counter | Add a stable OAuth authorization/token subject bucket, with the same merchant boundary. |
| Credentials | Agent Key hashing, rotation, revocation UI | Add bearer-token resolver branch; do not route OAuth through a fake Agent Key. |
| Domain services | Store, Campaign, and Analytics services | No domain-service rewrite should be required if the adapter returns a compatible actor. |

### Auth0 feasibility

**Auth0 reusable: PARTIAL / likely YES after a staging proof.** OpenAI's current authentication guide explicitly lists Auth0 as a provider that can provide metadata discovery, CIMD registration, API security, and token exchange, and recommends an established identity provider instead of implementing authentication from scratch.

The existing VisuTry Auth0 integration is currently a NextAuth login provider and internal User synchronizer. That is not by itself an MCP authorization server. The staging proof must confirm the configured Auth0 tenant can provide:

- authorization code + PKCE S256;
- discovery metadata at OpenID or OAuth well-known endpoints;
- the OpenAI callback URI;
- `resource` propagation and an audience/resource claim that VisuTry verifies;
- short-lived access tokens and refresh/offline access where needed;
- scopes for identity plus VisuTry permissions;
- a way to bind the selected Merchant to the authorization/token and revoke that binding.

Do not add a VisuTry authorization-server schema until this Auth0 proof answers whether Auth0 can own the code, token, refresh, and revocation lifecycle.

### Minimum OAuth domain model (design only)

If Auth0 can own token issuance, the minimum VisuTry persistence is likely one `MerchantOAuthAuthorization` concept containing:

- VisuTry internal `userId` and external Auth0 subject;
- exactly one `merchantId`;
- normalized granted scopes;
- provider/client/resource identifiers;
- status, created/last-used/revoked timestamps, and consent/version metadata;
- a stable audit subject or token identifier reference, never a raw token.

Use Auth0's refresh-token storage/rotation if it is the chosen authorization server. Add local refresh-token/grant state only if VisuTry becomes the issuer or must independently revoke opaque grants. A short-lived temporary authorization transaction may be needed for merchant selection, but it should not become a durable credential.

### Merchant selection and scopes

For a user with multiple Merchant memberships:

1. ChatGPT starts the OAuth authorization-code + PKCE flow.
2. Auth0 authenticates the user and returns the identity to the VisuTry authorization transaction.
3. VisuTry lists only that user's `MerchantMembership` rows.
4. The user selects exactly one Merchant and reviews requested scopes.
5. VisuTry verifies membership and role, records the selected Merchant in the authorization transaction, and issues/requests a token bound to that Merchant.
6. The MCP resource server verifies issuer, audience/resource, expiry, scopes, and the Merchant binding on every request.

Never authorize all Merchants automatically. A later “switch Merchant” operation should create a new authorization/token or explicit re-consent, not mutate the meaning of an existing token.

Recommended public v0.1 scopes are `merchant:read`, `catalog:read`, `experience:read`, and `analytics:read`. Add `catalog:write` and `experience:write` only for the controlled-write submission and only after the Business/Enterprise/Edu path is proven.

## 8. Privacy and review surface

### Current MCP exposure

| Data class | Current MCP result | Finding |
|---|---|---|
| Raw shopper photos | No MCP tool returns `MerchantSession` image/blob fields or raw shopper images. Catalog `imageUrl` values are merchant-owned frame assets, not shopper photos. | **NO** |
| Consumer account PII | Analytics MCP tools do not return shopper names, emails, IPs, payment details, or Auth0 identity. `get_merchant` returns the Merchant's own contact email, not consumer PII. | **NO in current MCP surface** |
| Raw sessions | Analytics exposes aggregate counts/signals only; it does not return raw session rows or session IDs. | **NO** |
| Analytics | Merchant-scoped aggregate read models; revenue, orders, ROAS, identified intent, and lead metrics are marked unavailable. | **YES, aggregate-only** |
| Merchant/catalog data | Merchant profile, catalog metadata, public product URLs, frame image URLs, Store/Campaign configuration, and aggregate performance are returned. | Must be disclosed |

The separate admin insights implementation contains richer internal fields, including recent sessions and inquiry data, but it is not wired to the MCP server. Do not expose it through the public plugin without a separate privacy review.

### Privacy readiness

The existing `/en/privacy` route is an advantage because a public policy exists, but it currently describes the general consumer service, uploaded photos, IP/usage data, and third-party processing. It does not yet clearly describe the Merchant plugin's MCP data categories, ChatGPT transfer boundary, OAuth revocation behavior, or that the app returns aggregate merchant analytics rather than shopper photos/PII. Treat privacy as **PARTIAL**, not READY.

## 9. Submission readiness

| Requirement | Status | Evidence/gap |
|---|---|---|
| Public production MCP endpoint | PARTIAL | `/api/mcp` and Streamable HTTP exist; live HTTPS reachability and stable production behavior were not tested in this spike. |
| Privacy policy URL | PARTIAL | `/en/privacy` exists; Merchant app data-flow disclosure needs an update before submission. |
| Terms URL | PARTIAL | `/en/terms` exists; confirm it covers Merchant/plugin use and current authentication language. |
| Support URL | PARTIAL | `support@visutry.com` exists, but a public support URL/process should be supplied to the portal. |
| OAuth | MISSING | No OAuth resource-server adapter, discovery metadata, merchant-selection consent, or token validation exists. |
| App/plugin metadata | PARTIAL | Existing brand assets include `public/favicon.svg` and `public/assets/marketing/visutry-new-logo.png`; the submission listing, verified identity, category, descriptions, URLs, and screenshots are not prepared. |
| Domain verification | MISSING | No `/.well-known/openai-apps-challenge` route/token was added. |
| Tool descriptions | PARTIAL | Descriptions are generally explicit about reads, writes, side effects, and approval. |
| Tool annotations | MISSING / P0 | No `readOnlyHint`, `openWorldHint`, or `destructiveHint` metadata is declared. |
| Output schemas | PARTIAL | Input schemas exist; output schemas are not declared. Review whether structured output is needed for the selected v0.1 tools. |
| Write safety | PARTIAL | Scope checks, readiness validation, `approved=true`, and audits exist; official annotations and actual ChatGPT confirmation tests do not. |
| Reviewer test instructions | MISSING | No five positive/three negative public test cases or reviewer-safe account/fixture process exists. |
| Account revocation/deletion | PARTIAL | Agent Key revoke/rotate exists; OAuth disconnect/revoke semantics are not implemented. |

### Recommended first submission

**READ + CONTROLLED WRITE, but only after the staging OAuth/annotation proof and only with the write surface targeted at Business/Enterprise/Edu.**

The value of VisuTry is not only reporting; a controlled Campaign draft and preview flow proves the agent can help a Merchant operate. Keep `publish_*` out of the first public submission unless the review environment and confirmation behavior are demonstrated end-to-end. A practical first write set is:

- Read: `get_merchant`, `get_onboarding_status`, `list_frames`, `list_campaigns`, `get_campaign`, the aggregate Analytics tools, and previews.
- Controlled write: `create_campaign`, `set_campaign_frames`, `update_campaign`.
- Defer initially: `publish_store`, `publish_campaign`, `archive_campaign`, and broad catalog import unless the reviewer test account and action controls are ready.

If submission timing is more important than proving operational value, a read-only plugin is a lower-risk fallback, but it should be treated as a validation channel rather than the final product shape.

## 10. Skills/plugin relationship

The single public Merchant Skill is reusable as workflow content and uses connection-neutral language (for example, “authenticated VisuTry Merchant connection”). Its safety rules—tenant derived from the connection, no client-supplied `merchantId`, explicit publish approval, aggregate-only analytics—remain.

The official plugin model supports a plugin containing both skills and an MCP server. The server supplies live data, auth, authorization, and actions; the skill teaches the model how to combine those tools. Installing or publishing a skill alone **does not** make VisuTry MCP tools available. A combined plugin can package the relationship, but the underlying app/MCP connection must still be enabled and authenticated, and workspace controls still apply.

The current Merchant Control Center is an internal Agent Key onboarding surface. It is useful as a fallback and operator control plane, but it is not a public OpenAI plugin registration or directory submission.

## 11. External workspace validation plan

Use two genuinely independent OpenAI contexts:

```text
OpenAI workspace/account A (test Merchant)
!= VisuTry developer organization/workspace
```

### Golden path

1. Publish or configure a public HTTPS staging MCP endpoint with the OAuth discovery/challenge metadata.
2. In workspace/account A, discover/import the VisuTry plugin or create a private custom MCP app in Developer Mode if public approval is not yet complete.
3. Select Connect and complete VisuTry/Auth0 login.
4. If the identity has multiple memberships, select one Merchant and approve only the displayed scopes.
5. Open a new ChatGPT conversation and select the VisuTry app/plugin.
6. Invoke `get_merchant`; verify the returned Merchant is the selected tenant.
7. Invoke one aggregate Analytics read; verify no shopper photo, session row, consumer PII, or token is returned.
8. Invoke one controlled write such as `create_campaign`; verify the OAuth scope and selected Merchant are enforced.
9. Attempt a cross-tenant resource ID and a write without the required scope; expect safe rejection.
10. Attempt `publish_campaign` without `approved=true`; expect server-side rejection. Then use an internal test Merchant only for the approved publish test, never an external production Merchant.
11. Disconnect/revoke the app and verify subsequent MCP calls fail and refresh/re-authorization behavior is correct.

### Manual vs. automatable

| Step | Automatable before public approval? | Notes |
|---|---|---|
| MCP Inspector initialize/list/call | YES | Use staging fixtures and no production write. |
| Auth0 discovery and PKCE exchange | YES in a temporary staging proof | Validate the exact ChatGPT callback/resource behavior. |
| ChatGPT Developer Mode connection | MANUAL | Requires an eligible ChatGPT account/workspace and UI interaction. |
| Public plugin discover/install | NO before approval | Requires portal submission, review, and publication. |
| Business workspace action controls | MANUAL | Admin/owner policy and confirmation behavior must be inspected. |
| External workspace Golden Path | MANUAL + evidence capture | Must be run in a workspace/account independent of VisuTry's developer organization. |
| Production Merchant write | NO for this spike | Use only an internal test Merchant and a reversible/draft action. |

### Current spike result

| Test | Result |
|---|---|
| Internal custom app connection in ChatGPT Developer Mode | NOT RUN |
| `tools/list` | PASS at repository unit-test level; OpenAI-host connection not run |
| Real read tool | PASS at repository unit-test level; external host not run |
| Write tool | PASS at repository unit-test level; no production write and external host not run |

## 12. Risks and blockers

### P0

- OAuth is not implemented; the public Connect/login/merchant-selection path cannot work today.
- Tool annotations required by the current submission/review contract are absent.
- There is no actual independent OpenAI workspace evidence for the external Golden Path.

### P1

- Full write/modify support has a material Business/Enterprise/Edu limitation and admin/action-control dependency.
- Auth0's configured tenant has not yet been proven to satisfy OpenAI's MCP-specific `resource`, PKCE, callback, refresh, and merchant-binding requirements.
- Public privacy/support/test-account submission materials are incomplete.
- The endpoint's live public HTTPS reachability, domain verification, and production auth error behavior are unverified.
- `publish_*` and `archive_campaign` need a deliberate annotation and reviewer test decision.

### P2

- Output schemas and structured result ergonomics could be improved after the connection proof.
- The Merchant Skill should remain connection/auth neutral across Agent Key and OAuth connections.
- Custom embedded UI is not needed for this spike; add it only if a real preview/compare/edit experience demonstrates material value.

## 13. Decision record

```text
Branch: main
Head SHA: 9214005413ba54f8b0219ef238704b450bfc3a62
PR: none
Code changes made = NO (documentation only)

OFFICIAL OPENAI FINDINGS

Public third-party app submission supported = YES
Ordinary developer eligible = YES, conditional on verified identity and Apps Management write access
Public external-user distribution = YES, conditional on approval and user/workspace eligibility
App Directory available = NO as a standalone current name; Plugins Directory is the current public equivalent
Apps SDK status: preview/current packaging and UI layer around MCP; custom UI optional
MCP support status: Streamable HTTP + OAuth 2.1/MCP authorization expected for authenticated public servers

APP / PLUGIN / SKILL MODEL

App responsibility: Connected external integration, authentication, tools, data, and actions
Plugin responsibility: Discoverable/installable package combining skills, MCP, and optional UI
Skill responsibility: Repeatable workflow instructions and resources
MCP responsibility: Live tools, schemas, authorization, execution, and results
Does installing/publishing Skill alone provide tools = NO

TARGET USER ELIGIBILITY

Free: Discover YES; custom MCP/write NOT CONFIRMED
Go: Discover YES; custom MCP/write NOT CONFIRMED
Plus: Custom MCP listed YES; read-heavy use viable; write NOT CONFIRMED
Pro: Custom MCP listed YES; developer-mode read/fetch documented; full write NO for this target
Business: Read/write YES subject to admin and action controls
Enterprise/Edu: Read/write YES subject to admin, RBAC, and action controls

Write MCP availability: Full MCP write/modify is currently documented for Business and Enterprise/Edu; Pro is documented for read/fetch custom MCP in developer mode.
Critical plan/workspace limitation: Write distribution is a managed-workspace channel, not a general personal-plan promise.

VISUTRY CURRENT STATE

/api/mcp compatible = PARTIAL
Authentication currently: MerchantAgentCredential Bearer vt_live_* key
Agent Key supported = YES
OAuth supported today = NO
Existing tenant/scopes reusable for OAuth = YES, with an adapter and explicit Merchant binding
Existing tools reusable = YES for transport/domain behavior; annotations/auth metadata required
Existing Skills reusable = YES, after auth-neutral wording and plugin packaging

AUTHENTICATION GAP

Recommended authorization model: OAuth 2.1 authorization-code + PKCE S256; Auth0-backed identity; VisuTry merchant-selection consent; access token bound to one Merchant, audience/resource, and scopes; MCP resource-server verification on every request
Auth0 reusable = PARTIAL / likely YES after staging proof
Required additions: protected-resource metadata, authorization-server discovery, OAuth actor adapter, token verification, WWW-Authenticate challenge, merchant-bound authorization state, revocation/refresh semantics, rate-limit/audit integration, and tool security metadata
Merchant selection during OAuth: after Auth0 identity resolution, show only the user's memberships and require one explicit Merchant selection before issuance
Token tenant-bound = MUST be YES before production
Scopes reused = YES

TOOL REVIEW

Read tools suitable: Merchant profile/onboarding, catalog listing/validation, Store/Campaign listing/detail/preview, aggregate Analytics
Write tools suitable: create/update Campaign draft and frame selection after OAuth/annotations proof
High-impact writes: publish_store, publish_campaign, archive_campaign
Publish server approval retained = YES
Submission blocker tools: all 22 tools are currently missing required annotations; high-impact tools also need dedicated review cases

PRIVACY

Raw photos exposed = NO in current MCP surface
Consumer PII exposed = NO in current MCP surface
Raw sessions exposed = NO in current MCP surface
Analytics aggregate-only = YES

SUBMISSION READINESS

MCP endpoint: PARTIAL
Privacy: PARTIAL
Terms: PARTIAL
Support: PARTIAL
OAuth: MISSING
App metadata: PARTIAL
Tool descriptions: PARTIAL
Write safety: PARTIAL
Test instructions: MISSING

Recommended first submission: READ + CONTROLLED WRITE
Reason: Proves Merchant value while keeping irreversible/public actions deferred; target write support is Business/Enterprise/Edu.

EXTERNAL WORKSPACE TEST

Can test before public approval = PARTIAL (private Developer Mode/custom MCP, eligible workspace only)
Requires Business/Enterprise admin = YES for full MCP write; read-only testing can use supported personal/custom-MCP surfaces
Independent workspace validation path: staging HTTPS endpoint -> Developer Mode or public plugin -> OAuth/Auth0 -> one Merchant selection -> read -> aggregate Analytics -> controlled Campaign draft write -> negative cross-tenant/scope/approval tests -> disconnect/revoke

SPIKE RESULT

Internal custom app connection = NOT RUN
tools/list = PASS (unit test only)
real read tool = PASS (unit test only)
write tool = PASS (unit test only; no production write)

BLOCKERS

P0: OAuth/merchant binding absent; tool annotations absent; external OpenAI host proof absent
P1: plan/workspace write limitation; Auth0 MCP contract unproven; submission/privacy/support/test materials incomplete
P2: output schemas, auth-neutral Skill wording, optional UI

DECISION

OpenAI App is viable primary VisuTry agent distribution channel = YES WITH LIMITATIONS
Should we implement OAuth now = NO for a full production rollout; YES for a bounded staging proof
Should Agent Key remain = YES
Should we build VisuTry internal Agent now = NO
Exact next engineering task: Create `codex/openai-app-distribution-spike` as a bounded staging task that (1) verifies Auth0 discovery, PKCE S256, OpenAI callback, resource/audience, refresh, and revocation; (2) adds temporary/proper MCP protected-resource and OAuth metadata; (3) adds a dual Agent-Key/OAuth actor resolver preserving MerchantMembership, scopes, rate limits, and audit; (4) adds accurate tool annotations/security metadata; and (5) validates read plus one Campaign-draft write in ChatGPT Developer Mode using an internal test Merchant only.
READY TO PROCEED = NO for public submission; YES for the bounded staging proof
```

## 14. Stop conditions

Stop the next engineering task and report a no-go if any of these are proven:

- OpenAI's public plugin submission or external-user connection becomes unavailable for the target surface.
- The supported target plan cannot invoke the required write actions.
- Merchant selection would require bypassing `MerchantMembership` or accepting a client-supplied tenant ID.
- OAuth tokens cannot be bound to one Merchant and one scope set.
- Any selected public tool exposes raw shopper photos, consumer PII, raw sessions, payment data, or authentication secrets.
- The solution requires rebuilding VisuTry as a separate internal agent platform rather than adding an MCP/OAuth distribution adapter.
