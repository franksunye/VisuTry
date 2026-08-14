# VisuTry Merchant Skill v2 — Capability Audit

Status: Implemented on the Merchant Agent feature branch
Scope: Skill workflow guidance, reviewed catalog source intake, bootstrap alignment, and capability documentation. No OAuth, MCP transport, or analytics infrastructure changes.

## Operating model

```text
Prompt = bootstrap connection and safety
Skill  = state-based operating knowledge
MCP    = authenticated merchant actions
VisuTry = system of record
```

The bootstrap prompt stays concise. The detailed Store Builder, Campaign Builder, Analyst, and confirmation policy live at `/skills/merchant`.

## Current capability audit before v2

| Capability | Before v2 | Evidence |
| --- | --- | --- |
| Connection guidance | COMPLETE | Existing bootstrap prompt and `get_merchant` / `get_onboarding_status` tools |
| Store onboarding | PARTIAL | Existing Skill described the tool sequence, but did not classify workspace state or explain the website/catalog intake limitation |
| Delivery Factory workflow | PARTIAL | Prior Delivery Factory documentation existed, but the public Skill did not translate it into an Agent playbook |
| Campaign Builder workflow | PARTIAL | Existing Skill described creation and publication safety, but not the guided business-intent proposal flow |
| Analytics / optimization workflow | PARTIAL | Aggregate tools and privacy limits existed, but the Skill did not define Analyst mode or observation vs recommendation clearly |
| State-based next step | MISSING | The Skill could stop after connection/readiness reporting |

## Skill v2 behavior

The Skill now explicitly defines:

- State A: no usable Store → Store Builder / Delivery Factory;
- State B: Store exists, no Campaign → Campaign Builder;
- State C: Campaigns exist → operations and one best next action;
- State D: analytics available → aggregate Analyst mode in addition to resource state.

The Store Builder sequence is:

```text
Understand merchant
→ inspect workspace and catalog
→ identify source material
→ gather minimum assets
→ validate catalog
→ construct Store DRAFT
→ select frames
→ preview readiness
→ merchant review and approval
→ write
→ recommend next action
```

The Campaign Builder sequence starts from “What would you like this Campaign to achieve?”, reuses known Store/catalog facts, presents a business-level proposal, creates only a private draft after approval, previews it, and reports the next action.

Analytics guidance now requires:

```text
query → interpret → explain → recommend
```

The Skill distinguishes Observed facts, Interpretation, and Recommendation and does not present unavailable revenue, order, ROAS, identified shopper, lead, or Merchant CTA metrics as facts.

## Executability audit

### No Store → usable Store

Result: **YES for the reviewed v1 source-intake path**.

The MCP surface now supports a read-only proposal before the existing catalog and Store tools:

```text
inspect_catalog_source
→ merchant approval
→ import_frames
→ validate_catalog
→ create_store (DRAFT)
→ set_store_frames
→ preview_store
→ publish_store (approved=true only)
```

`inspect_catalog_source` is bounded and read-only. It accepts public HTTP/HTTPS product/page URLs, collection or homepage URLs with bounded same-origin product links, and small structured product records. It extracts deterministic JSON-LD product facts, normalizes candidates to the existing `import_frames` shape, checks the existing merchant catalog for duplicates, and returns a review proposal. It never writes catalog records. `import_frames` is called only after explicit approval.

The path remains intentionally bounded: no authenticated sites, recursive domain crawling, arbitrary PDFs, Drive crawling, Shopify/WooCommerce sync, inventory sync, or arbitrary file formats. CSV-like data must be supplied as normalized structured records in v1. Missing SKU, image, or shape remains `NEEDS_REVIEW`; unsupported or malformed data is not guessed.

### Catalog Source Intake

Supported sources:

- one public product URL, or a small list of explicit public product URLs;
- a public collection/homepage URL with at most the bounded directly discoverable same-origin product links;
- a small structured product set supplied by the merchant/Agent. This is the normalized fallback for CSV-like data.

Unsupported sources:

- login-required websites, merchant dashboards, checkout/account pages, and customer data;
- recursive site crawling, arbitrary PDFs, Google Drive, Shopify/WooCommerce account sync, and inventory synchronization;
- arbitrary files or background catalog synchronization.

Security boundaries:

- only HTTP/HTTPS source URLs without credentials are accepted;
- localhost, private, reserved, link-local, metadata, and mixed public/private DNS answers are rejected;
- each request pins a validated DNS address, keeps the original hostname for HTTPS verification, and revalidates every redirect target;
- redirects are same-origin and bounded; timeout, response bytes, source URL count, and discovered product count are bounded;
- no cookies, Agent Keys, OAuth tokens, merchant credentials, or internal headers are sent to source websites;
- source pages are not logged as raw HTML and shopper/customer data is not a catalog source.

Normalization and duplicate handling:

```text
source product
→ normalized candidate
→ READY | NEEDS_REVIEW | INVALID
→ NEW | ALREADY_EXISTS | POSSIBLE_DUPLICATE
→ merchant proposal
```

Existing merchant SKU or canonical product URL matches are not re-imported automatically. Source candidates retain `EXTERNAL` provenance and `externalId` when the existing schema supports it. Existing `import_frames` remains the only catalog write path.

The No-Store Golden Path is now reviewable end to end: detect State A, inspect source, show candidates and issues, obtain import approval, import and validate catalog, obtain Store approval, create a DRAFT Store, select frames, preview readiness, and recommend the first Campaign. Store publication remains a separate explicit approval.

### Store → draft Campaign

Result: **YES**, when the Store/catalog context and `experience:write` scope are available.

The real path is:

```text
list_campaigns / list_frames / get_campaign as needed
→ business-level proposal and approval
→ create_campaign (private DRAFT)
→ set_campaign_frames
→ update_campaign for bounded fields only
→ preview_campaign
```

Publishing remains a separate explicit decision through `publish_campaign` with `approved=true`.

### Analytics

| Question / capability | Status | Real MCP evidence |
| --- | --- | --- |
| Campaign list and state | SUPPORTED | `list_campaigns`, `get_campaign` |
| Interaction volume | SUPPORTED | `get_experience_summary`, `get_intent_summary`, `get_top_frames` |
| Engagement / Try-On / Favorite / Compare | SUPPORTED | Aggregate summary, funnel, intent, and frame tools |
| High-intent signals | SUPPORTED | `get_intent_summary`, `get_top_frames` |
| Conversion / Merchant CTA | PARTIAL | Merchant CTA is unavailable; Try-On completion and high-intent signals are available |
| Campaign comparison | SUPPORTED | `compare_experiences` for 2–5 resources and metric-specific winners |
| Time-series performance | PARTIAL | Date-range summaries exist; no dedicated time-series tool |
| Revenue, orders, ROAS | NOT AVAILABLE | Explicitly marked unavailable by tool responses |
| Identified shoppers, identified intent, lead metrics | NOT AVAILABLE | Explicitly excluded by the aggregate analytics contract |

## Real MCP tool boundaries

The Skill only documents tools implemented by `src/modules/merchant/mcp/server.ts`:

- merchant/onboarding: `get_merchant`, `get_onboarding_status`, `list_frames`, `inspect_catalog_source`, `import_frames`, `validate_catalog`;
- Store: `create_store`, `set_store_frames`, `preview_store`, `publish_store`;
- Campaign: `list_campaigns`, `get_campaign`, `create_campaign`, `set_campaign_frames`, `update_campaign`, `preview_campaign`, `publish_campaign`, `archive_campaign`;
- aggregate analytics: `get_experience_summary`, `get_experience_funnel`, `get_top_frames`, `get_intent_summary`, `compare_experiences`.

The source-intake MCP tool is read-only and merchant-onboarding-specific. It returns a normalized proposal; it is not a generic browser or crawler tool. The current limits are documented rather than hidden behind imaginary capabilities.

## Safety invariants retained

- tenant is derived from the authenticated connection;
- internal IDs are not requested unless a real tool needs a locator;
- startup is read-only;
- all material writes require conversational approval;
- drafts and publication remain separate;
- `approved=true` remains required for publication;
- analytics remain aggregate and privacy-safe;
- missing scopes and tenant-scoped not-found responses remain security boundaries.

## Exact next implementation step

Run the controlled No-Store Golden Path against a sanitized local fixture source and a test merchant, then perform one permitted public-URL smoke test. The source-intake implementation is deliberately not a general crawler or ecommerce synchronization platform.
