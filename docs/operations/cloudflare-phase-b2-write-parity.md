# Cloudflare Phase B2 — Scoped Write Parity

## 1. Scope

B2 covers only the approved write boundary: Auth0/JWT adapter user and account writes, merchant provisioning, Merchant Agent credential/audit/rate-limit dependencies required by the existing MCP entrypoint, Store DRAFT creation and frame selection, and Campaign DRAFT creation, update, and frame selection. Publish, archive, Stripe, Blob/upload, AI, MCP/OAuth redesign, cron, schema migration, DNS, and production changes remain out of scope.

## 2. Write dependency matrix

| Write | Existing entrypoint | Cloudflare implementation | Transaction |
| --- | --- | --- | --- |
| Auth `createUser` | NextAuth Auth0 callback | `src/data/auth-cloudflare.ts` | single upsert |
| Auth `updateUser` | NextAuth adapter | `src/data/auth-cloudflare.ts` | single update |
| Auth `linkAccount` | NextAuth Auth0 callback | `src/data/auth-cloudflare.ts` | idempotent insert/read |
| Merchant provisioning | `POST /api/merchant/workspaces` | `merchant-provisioning-cloudflare.ts` | Serializable |
| MCP request limit | `POST /api/mcp` pre-tool guard | `merchant-agent-rate-limit-cloudflare.ts` | atomic upsert |
| Credential/audit writes | merchant credential API and MCP tools | `merchant-agent-credentials-cloudflare.ts` | Serializable where multi-row |
| Store DRAFT | MCP `create_store`, `set_store_frames` | `merchant-onboarding-cloudflare.ts` | Serializable |
| Campaign DRAFT | MCP `create_campaign`, `update_campaign`, `set_campaign_frames` | `campaign-service-cloudflare.ts` | Serializable for frames |

Store has no separate Store table. Store and Campaign are tenant-owned `Experience` rows; selected frames are tenant-owned `ExperienceFrame` rows with composite tenant keys.

## 3. Auth write implementation

The Cloudflare Auth0 adapter now implements `createUser`, `updateUser`, and `linkAccount` with bound direct-Neon SQL. `createUser` uses the existing unique email constraint for safe retry/idempotency and only touches adapter-owned profile fields. It does not accept or update role, quota, subscription, or premium fields. `linkAccount` is idempotent for the same provider identity and rejects an account already linked to another user.

Unit coverage includes fresh adapter shape, retry/idempotency, update field boundaries, and cross-user account-link rejection. The first-login callback was exercised in the preceding B1.2 staging verification.

## 4. Transaction model

All multi-row direct writes use `sql.transaction(..., { isolationLevel: 'Serializable' })`. Merchant provisioning preserves the existing first-membership invariant and retries a unique slug collision with a deterministic suffix. Store/Campaign frame replacement deletes and recreates only rows carrying the authenticated merchant ID. Credential lifecycle writes keep the audit record in the same transaction where applicable.

## 5. Merchant provisioning

The existing `POST /api/merchant/workspaces` route is mapped to the direct-Neon provisioning module in Cloudflare builds. It preserves owner membership, idempotent retry behavior, parameterized user/merchant filters, and slug retry behavior. The Vercel/default path remains the existing Prisma implementation.

## 6. Store draft writes

The existing MCP tools now create a merchant-owned `Experience` with `type=STORE` and `status=DRAFT`, then replace active catalog frame selection through `ExperienceFrame`. Repeated create calls return the existing Store. The current workflow exposes create, set frames, and preview; it has no distinct Store update tool, so no new update surface was invented for B2. Store publication remains explicitly rejected in the Cloudflare B2 provider.

## 7. Campaign draft writes

The existing MCP tools now create and safely reuse Campaign DRAFTs, update bounded copy/policy/date/CTA fields, and replace active catalog frame selection. Campaign slug conflicts remain 409-style tool errors. Campaign and Store are sibling Experience types; the current schema has no separate Store-association field, so “Store association” is not applicable to this workflow. Campaign publish/archive remain explicitly outside B2.

## 8. Tenant/ownership isolation

Every direct query includes the authenticated merchant or user boundary. Experience-frame inserts carry both `experienceId` and `merchantId`, and frame eligibility queries require the same merchant plus `ACTIVE` status. Unit tests cover cross-tenant Store/Campaign rejection. The staging MCP check passed a foreign resource ID and received `RESOURCE_NOT_FOUND` without revealing whether the resource exists.

## 9. Failure/rollback tests

The direct staging verification deliberately failed transactions for Auth user/account, merchant/membership, Store/ExperienceFrame, and Campaign/ExperienceFrame. Each transaction was confirmed to leave zero rollback rows. Unit tests also assert Serializable transaction options for provisioning and Store/Campaign frame replacement.

## 10. Bundle progression

- B1.2 baseline: `2757.26 KiB` gzip.
- B2 final dry-run: `2780.26 KiB` gzip.
- Delta: `+23.00 KiB`.
- Workers Free headroom against `3072 KiB`: `291.74 KiB`.

## 11. Prisma exclusion

The final OpenNext Worker and MCP server function were scanned for the Prisma query engine/compiler, WASM engine, and `@prisma/client` runtime. No `query_compiler`, `libquery_engine`, `@prisma/client`, or WASM engine artifact was present. The only `PrismaClient` text is the existing lightweight Cloudflare build-time compatibility stub; it contains no query compiler and throws if an unsupported Prisma-backed route reaches runtime. Cloudflare-only webpack aliases keep the existing Prisma/Vercel source path unchanged while replacing the approved B2 dependency roots with narrow direct-Neon providers.

## 12. Staging evidence

Worker: `visutry-cf-staging`
Version: `8b1407a1-e112-4f3d-835f-c7cc87389aa0`
URL: <https://visutry-cf-staging.sunye.workers.dev>

The real workers.dev MCP flow passed Store DRAFT create/set frames, Campaign DRAFT create/set frames/update, Store idempotent retry (`created=false`), Campaign idempotent retry (same DRAFT ID), and cross-tenant resource rejection. A TEST-only frame and credential were used; no production record, DNS route, or production secret was changed.

## 13. Deferred integrations

Deferred: Store update as a new MCP surface, publishing/archiving, MCP OAuth persistence redesign, Stripe, Blob/R2 uploads, AI/task writes, cron/background writes, admin Prisma routes, consumer writes, schema migrations, custom domains, DNS, and production deployment.

## 14. Cleanup/test fixture policy

All B2 resources are marked by deterministic `cloudflare-b2` naming and belong to the existing B1.2 TEST merchant. They are safe to retain for repeatable staging checks. The temporary staging harness and its known test credential material were not committed. Before any production-like staging reset, remove only those exact TEST resources by ID after confirming no test run is active; do not use broad merchant or database cleanup.

## 15. B3 readiness

**READY for scoped B3 planning; NOT ready for production migration.** B2 closes the approved Auth/merchant/Store DRAFT/Campaign DRAFT write slice on Workers Free. B3 still needs explicit scope and safe implementations for the deferred integrations above, plus longer staging soak, authenticated browser-session regression, and a production cutover decision.
