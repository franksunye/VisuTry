# VisuTry Merchant Onboarding

Use this skill only with an authenticated VisuTry Merchant Agent Credential. The credential determines the merchant tenant; never ask for or send a client-supplied merchantId.

## Workflow

1. Call get_onboarding_status and get_merchant.
2. Call list_frames and/or import_frames with normalized structured frame records. Each import is limited to 100 records and is idempotent by merchant SKU. Imports never delete catalog records.
3. Call validate_catalog. Resolve all blocking validation issues before continuing.
4. Call create_store. Stores are created as DRAFT and repeated calls are safe.
5. Call set_store_frames with frame IDs returned for this merchant.
6. Call preview_store. Preview is side-effect free: it does not create shopper sessions, consume consumer credits, record Sponsored Usage, invoke AI, or create attribution.
7. Ask the merchant for explicit approval to publish. Do not infer approval from preview, a chat message unrelated to publication, or a successful validation.
8. Call publish_store with approved=true only after that explicit approval.

## Safety and scope

- The public Store path is /en/store/{merchantSlug}; a DRAFT Store is not public.
- Do not invent catalog facts, image URLs, prices, or product links.
- Do not log, repeat, or persist the raw agent credential secret.
- Do not call campaign, analytics, consumer, Sponsored Usage, or AI operations as part of onboarding.
- Treat RESOURCE_NOT_FOUND as a tenant-scoped not-found response; do not probe another merchant's resources.
- A successful publish means the Store status is ACTIVE and the returned public path is the canonical handoff.

## Tool order

get_onboarding_status -> get_merchant -> list_frames/import_frames -> validate_catalog -> create_store -> set_store_frames -> preview_store -> explicit approval -> publish_store
