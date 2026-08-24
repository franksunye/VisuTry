# VisuTry Universal Agent Access

**Status:** DEPLOYED / HISTORICAL CODEX PROOF / CURRENT GATE REVALIDATION REQUIRED<br>
**Reviewed:** 2026-08-24<br>
**Main SHA:** `3b60c43de2a40ab0c74facbadeff52717af115ef`<br>
**Primary endpoint:** `https://www.visutry.com/api/mcp`

## 1. Executive decision

VisuTry is built once as a standards-based Remote MCP server. OAuth is the normal merchant connection path; `vt_live_*` Agent Keys remain a developer/CI fallback. Marketplace listings are optional setup and discovery adapters, never a prerequisite.

The implementation is production-deployed and real-DB verified with a dedicated test Merchant. Architecture viability is **YES**. The Codex CLI Golden Path is **CONFIRMED on the recorded SHA**; current-SHA Codex, Cursor, and independent merchant direct connection remain **NOT YET CONFIRMED** under the active Product Advantage Gate.

The 2026-08-24 reconciliation confirmed that these interoperability and
external-Pilot limitations remain current. The list/revoke backend endpoints
exist, but Merchant Control Center still exposes Agent Key lifecycle rather
than connected OAuth authorizations; expired OAuth artifact cleanup and the
additional real-client/database Golden Paths also remain outstanding. The
dated Product Advantage Gate baseline is the current evidence verdict.

## 2. Why marketplace-first was rejected

OpenAI, Anthropic, Cursor, and other agent products can consume the same Remote MCP endpoint. A marketplace-specific backend would duplicate authentication and tenant authorization. The old [`openai-app-distribution-feasibility.md`](./openai-app-distribution-feasibility.md) is retained as research, but is explicitly superseded as the primary architecture.

## 3. Universal Agent Access architecture

```text
Codex / Claude Code / Cursor / other MCP clients
                         |
                         v
             https://www.visutry.com/api/mcp
                         |
          OAuth 2.x authorization-code + PKCE
                         |
     Auth0/NextAuth identity -> one MerchantMembership
                         |
             MerchantActorContext (tenant + scopes)
                         |
       existing Store / Campaign / Analytics services
```

The MCP server never accepts a caller-supplied `merchantId` as the tenant boundary. The authenticated principal supplies it.

## 4. MCP transport compatibility

`POST /api/mcp` uses the MCP SDK `WebStandardStreamableHTTPServerTransport` with stateless JSON responses. `initialize`, `notifications/initialized`, `tools/list`, and `tools/call` are supported. Unsupported `GET`/`DELETE` requests return `405 Allow: POST`, which is valid for this stateless JSON transport; no session lifecycle is needed.

The endpoint returns a protected-resource `WWW-Authenticate` challenge on missing/invalid bearer authentication. Discovery is available at both root RFC well-known paths and path-scoped aliases:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-authorization-server`
- `/api/mcp/.well-known/oauth-protected-resource`
- `/api/mcp/.well-known/oauth-authorization-server`

## 5. Authentication architecture

OAuth endpoints:

- `POST /api/mcp/oauth/register` — public PKCE client registration (DCR); only `token_endpoint_auth_method=none` is accepted.
- `GET/POST /api/mcp/oauth/authorize` — OAuth authorization request, VisuTry login, one-Merchant selection, scope consent, and authorization-code issuance.
- `POST /api/mcp/oauth/token` — authorization-code + PKCE exchange and refresh-token rotation.
- `POST /api/mcp/oauth/revoke` — access/refresh token revocation.

Tokens are opaque, short-lived, hashed at rest, resource-bound, scope-bound, revocable, and never logged. Refresh tokens are rotated on use; reuse of a rotated refresh token revokes the entire authorization family and requires fresh consent. Authorization codes are single-use and expire after five minutes.

Auth0 is reused as the existing identity provider through the existing NextAuth/Auth0 session. VisuTry owns the merchant-specific authorization transaction because Auth0 identity alone cannot choose exactly one internal Merchant workspace or map VisuTry scopes.

### Client registration decision

The current MCP Authorization specification describes pre-registration first, Client ID Metadata Documents (CIMD) second, and Dynamic Client Registration (DCR) as a backward-compatible fallback. VisuTry exposes both CIMD and DCR so clients can use the current primary path while older clients retain a bounded standards-based registration fallback.

VisuTry now supports CIMD as the primary no-pre-registration path. The implementation accepts only HTTPS metadata URLs with a path, resolves all DNS answers before rejecting any local/private/reserved target, and pins the subsequent HTTPS connection to the validated public IP while preserving the original hostname for TLS SNI and certificate verification. Redirects are not followed; response size and fetch time are bounded; exact `client_id` matching plus redirect/grant/response metadata are validated; and bounded cache headers are honored. DCR remains available as the backward-compatible fallback and is protected by a distributed database-backed registration bucket. Authorization metadata advertises `client_id_metadata_document_supported: true` and `registration_endpoint` together.

### MCP transport Origin and DCR proxy boundary

Streamable HTTP requests with an absent `Origin` are accepted for native/non-browser clients. When present, `Origin` must be an exact configured origin from `MCP_ALLOWED_ORIGINS`; malformed, untrusted, suffix-matching, path-bearing, or otherwise similar values return HTTP 403 before OAuth authentication. The production default is `https://www.visutry.com`; local development defaults to `http://localhost:3000` when no explicit list is configured. The server never derives this allowlist from `Host` or forwarded host headers.

DCR registration uses `DCR_RATE_LIMIT_TRUSTED_PROXY_MODE` to make the deployment boundary explicit. `vercel` trusts only a single valid `x-vercel-forwarded-for`; missing or malformed values use the fixed `unknown` bucket and never fall back to `x-forwarded-for`. `cloudflare` trusts only a single valid `cf-connecting-ip`; missing or malformed values use `unknown` and never fall back to `x-forwarded-for` or `x-real-ip`. `none` uses a fixed `untrusted` identity. Multiple or malformed addresses do not select an attacker-controlled bucket.

### DCR security review

- Redirect URIs are exact-match validated after one canonicalization pass; loopback hosts are normalized to `localhost` to account for Vercel edge normalization.
- HTTPS is required for web clients; HTTP is accepted only for exact `localhost`, `127.0.0.1`, or `[::1]` native callbacks.
- Credentials and fragments are rejected from redirect URIs.
- `application_type`, `grant_types`, `response_types`, and `token_endpoint_auth_method` are constrained to public PKCE authorization-code clients.
- The server generates the client ID; callers cannot choose or impersonate an existing client ID.
- The consent screen shows the registered client name, generated client ID, and redirect host before Merchant approval. Client metadata remains untrusted display data and is HTML-escaped.
- DCR is rate-limited by a privacy-preserving, distributed database bucket keyed from the deployment's client address headers; registration itself does not grant Merchant access.

## 6. Merchant tenant selection

After login, the user sees all `MerchantMembership` workspaces and must select exactly one. The request stores `userId`, `merchantId`, requested scopes, OAuth client, redirect URI, PKCE challenge, and resource. A token for Merchant A cannot be replayed against Merchant B, even when the same user belongs to both.

Write scopes require an `OWNER` or `ADMIN` membership at consent time. Read scopes can be granted to any valid membership. Domain services remain the final authorization authority.

## 7. Scope mapping

OAuth reuses the existing scope vocabulary without a second permission language:

`merchant:read`, `merchant:write`, `catalog:read`, `catalog:write`, `experience:read`, `experience:write`, `analytics:read`.

The OAuth actor carries the same scope array as an Agent Key actor. `requireAgentScope` now applies to both `AGENT_CREDENTIAL` and `AGENT_OAUTH` actors.

## 8. MerchantActorContext convergence

Both authentication methods converge before MCP server creation:

```text
vt_live_* Agent Key  ─┐
                      ├─> AgentMerchantActor -> MerchantActorContext
OAuth access token  ──┘
```

OAuth actors retain `userId` and `authorizationId` for auditability. MCP tools do not branch on the authentication method; they receive the same tenant and scope boundary.

## 9. Agent Key coexistence

Existing `MerchantAgentCredential` storage, hashing, rotation, revocation, limits, rate limiting, and API behavior remain supported. Agent Keys are not exposed by the OAuth flow and are not the normal merchant onboarding path.

## 10. Tool and write-safety model

All exposed tools receive accurate MCP annotations and `_meta.securitySchemes` scope hints. Read tools advertise `readOnlyHint=true`; mutation tools advertise `readOnlyHint=false`; publish/archive advertise `destructiveHint=true`.

High-impact operations retain server-side explicit approval:

- `publish_store` requires `approved=true`.
- `publish_campaign` requires `approved=true`.
- `archive_campaign` remains an explicit mutation.

Client confirmation is additive and cannot replace VisuTry's server-side approval boundary.

## 11. Privacy guarantees

The MCP analytics adapter exposes aggregate merchant-safe metrics only. It does not expose raw shopper photos, face images, consumer account PII, IP addresses, payment data, or raw MerchantSession records. Tool descriptions and server instructions repeat this invariant.

## 12. MCP server instructions

Initialization instructions tell clients to stay within the authorized Merchant, use aggregate analytics, preview before mutation, require explicit publication approval, and respect scope failures. Detailed workflow knowledge remains in the public Merchant Skill rather than being embedded into the initialization payload.

## 13. Skill vs MCP responsibilities

The single public Merchant Skill (`/skills/merchant`) contains the reusable Store, Campaign, and Commerce Analyst operating knowledge. It contains no credentials and is not required for MCP capability. MCP executes live operations; OAuth authorizes them; the Skill teaches workflows.

## 14. Client compatibility

The same endpoint and authorization server are intended for all clients. Client-specific differences are setup commands only.

### Codex

Use the current Codex Remote MCP add/login flow for `https://www.visutry.com/api/mcp`. The endpoint is HTTPS Streamable HTTP, publishes OAuth discovery, supports CIMD with DCR + PKCE fallback, and returns server instructions. Codex CLI `0.147.0` was configured and completed the real production OAuth flow with the dedicated test Merchant; `tools/list` and `get_merchant` both passed. This confirms Codex interoperability only, not Claude Code or Cursor interoperability.

### Claude Code

Official Claude Code documentation supports remote HTTP MCP, OAuth, automatic token refresh, and `/mcp`/`claude mcp login` authentication. The setup shape is:

```bash
claude mcp add --transport http visutry https://www.visutry.com/api/mcp
# In Claude Code:
/mcp
```

The endpoint supports CIMD first and DCR as a compatibility fallback with a public PKCE client, so no long-lived VisuTry Agent Key is needed.

## Real Agent Interoperability Validation

Status: **REAL DB GOLDEN PATH PARTIAL PASS**. Production was deployed from main SHA `3b60c43de2a40ab0c74facbadeff52717af115ef` with the formal OAuth migrations applied. The dedicated public test account used the existing isolated workspace `VisuTry Golden Path Test 20260813` (`cmsrbe9qc000b04jotskfikmz`), OWNER role, and no customer data.

- Environment: production `https://www.visutry.com`; `MCP_RESOURCE_URL=https://www.visutry.com/api/mcp`; `MCP_OAUTH_ISSUER_URL=https://www.visutry.com`; trusted proxy mode `vercel`.
- MCP endpoint / OAuth issuer: production discovery and protected-resource metadata PASS.
- Migrations: production build reported the schema up to date; OAuth tables and DCR counter were verified read-only.
- DCR + PKCE: production registration, Auth0 login session, Merchant selection, consent, authorization code, and token exchange PASS.
- Codex CLI: `codex-cli 0.147.0`; real OAuth login PASS; real `tools/list` and `get_merchant` calls PASS for the test Merchant.
- Direct MCP harness: `initialize`, `tools/list`, `get_merchant`, and controlled `create_campaign` PASS. Created campaign `cmssn810u000f05i7p6sham3s` remains `DRAFT`.
- Claude Code and Cursor: not run; interoperability remains **NOT YET CONFIRMED**.
- Real customer data, shopper PII, raw photos, payment data, and production customer Merchant writes: **not accessed**.

The interoperability decision is confirmed only for the tested Codex path. One VisuTry implementation serving Codex + Claude Code + Cursor and independent merchant direct connection remain **NOT YET CONFIRMED**.

### Cursor

Official Cursor documentation lists remote Streamable HTTP with OAuth. Configure the same URL in Cursor's MCP settings; no Cursor-specific VisuTry backend exists. Live Cursor authentication/tool execution was not run in this repository change.

### Compatibility matrix

| Capability | Codex | Claude Code | Cursor |
|---|---|---|---|
| Remote HTTP MCP | REAL PASS | NOT YET RUN | NOT YET RUN |
| OAuth | REAL PASS | NOT YET RUN | NOT YET RUN |
| Custom server without marketplace | REAL PASS | NOT YET RUN | NOT YET RUN |
| `tools/list` | REAL PASS | NOT YET RUN | NOT YET RUN |
| Read tools | REAL PASS | NOT YET RUN | NOT YET RUN |
| Write tools | REAL controlled draft PASS | NOT YET RUN | NOT YET RUN |
| Explicit write confirmation | Server enforced | Server enforced | Server enforced |
| Server instructions | LOCAL PASS; external not tested | LOCAL PASS; external not tested | LOCAL PASS; external not tested |

## 15. Revocation and audit model

OAuth revocation updates the hashed access/refresh token rows. Authorization records are independently statused and can be revoked by a future Merchant Control Center action without changing the MCP route. OAuth-originated mutations write `MerchantOperationAudit.actorType=AGENT_OAUTH` and retain the authorization identity; Agent Key mutations remain `AGENT_CREDENTIAL`. MCP requests remain rate-limited per merchant and authenticated actor.

The existing Agent Access UI is still the practical Agent Key management surface. A small connected-authorizations/revoke UI should be added before an external merchant pilot; the backend revoke endpoint is already present.

## 16. Remaining limitations

- Production migration status is verified; local direct Prisma migration execution remains limited by the local Neon/IPv6 connection path.
- `MCP_RESOURCE_URL` must be set per environment: local `http://localhost:3000/api/mcp`, preview/staging `https://<environment-host>/api/mcp`, production `https://www.visutry.com/api/mcp`. Tokens are rejected when their stored resource differs from the request environment's canonical resource.
- Auth0 callback/NextAuth production configuration and public email login were verified through the production consent flow; Auth0 admin access was not required.
- Claude Code and Cursor live flows still require their client installations/accounts and authenticated sessions.
- `tests/unit/app/api/mcp-oauth-http.integration.test.ts` is intentionally an HTTP handler contract test with mocked OAuth boundaries, not a database-backed protocol integration test.
- Automated cleanup of expired authorization requests/codes/tokens should be added to the existing maintenance job.
- Add a Merchant Control Center list/revoke view for OAuth authorizations before external pilot.
- Run the real database-backed OAuth integration suite and the Claude Code and Cursor Golden Paths.

## 17. Exact production Golden Path

1. Deploy the migration and set the environment-specific `MCP_RESOURCE_URL`.
2. Add `https://www.visutry.com/api/mcp` in a compatible client without a static Authorization header.
3. Client receives `401` and discovers protected-resource/auth-server metadata.
4. Client performs CIMD, or DCR when CIMD is unavailable, then starts PKCE authorization and opens the VisuTry login page.
5. User logs in with Auth0, selects exactly one Merchant, and approves requested scopes.
6. Client exchanges the single-use code and sends the opaque bearer token to `/api/mcp`.
7. Client initializes, receives server instructions, calls `tools/list`, reads Merchant/analytics data, and creates an unpublished test Campaign.
8. Never use the external proof to publish a production Store/Campaign. Revoke the OAuth authorization after the isolated test.

## 18. Review-preparation decision

Architecture viability = **YES**<br>
Independent merchant direct connection = **NOT YET CONFIRMED**<br>
One VisuTry MCP implementation serving Codex + Claude Code + Cursor = **NOT YET CONFIRMED**<br>
Codex interoperability = **YES — REAL GOLDEN PATH CONFIRMED**<br>
Cursor interoperability = **NOT YET CONFIRMED**<br>
Claude Code interoperability = **NOT YET CONFIRMED**<br>
Ready for external merchant pilot = **NO**

## Official protocol references

- [OpenAI MCP authentication](https://developers.openai.com/plugins/build/auth) — OAuth 2.1, protected-resource metadata, resource propagation, PKCE, and bearer verification.
- [OpenAI MCP server guidance](https://developers.openai.com/plugins/concepts/mcp-server) — stable HTTPS Streamable HTTP and authorization for private data/actions.
- [Anthropic Claude Code MCP](https://code.claude.com/docs/en/mcp) — remote HTTP MCP, OAuth login, DCR/CIMD setup, and token refresh behavior.
- [Cursor MCP documentation](https://docs.cursor.com/context/model-context-protocol) — remote Streamable HTTP and OAuth support.
- [MCP Authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization) — CIMD, pre-registration, DCR priority, resource indicators, redirect URI, and token security requirements.
