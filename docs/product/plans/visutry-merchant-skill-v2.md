# VisuTry Merchant Skill v2 — Capability Audit

Status: Implemented on the Merchant Agent feature branch  
Scope: Skill workflow guidance, bootstrap alignment, and capability documentation. No OAuth, MCP transport, or analytics infrastructure changes.

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

Result: **PARTIAL**.

The existing MCP surface can complete this when a merchant already has usable catalog records or can provide normalized frame data with the required fields:

```text
list_frames / import_frames
→ validate_catalog
→ create_store (DRAFT)
→ set_store_frames
→ preview_store
→ publish_store (approved=true only)
```

The exact missing capability is source intake from a website URL or arbitrary catalog. There is no MCP website crawler, URL-to-catalog importer, file upload tool, or enrichment tool. `import_frames` requires structured frame records, including SKU, name, shape, and usable image data. The Skill therefore asks for the minimum usable catalog information or uses data already in the workspace; it does not invent a crawler.

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

- merchant/onboarding: `get_merchant`, `get_onboarding_status`, `list_frames`, `import_frames`, `validate_catalog`;
- Store: `create_store`, `set_store_frames`, `preview_store`, `publish_store`;
- Campaign: `list_campaigns`, `get_campaign`, `create_campaign`, `set_campaign_frames`, `update_campaign`, `preview_campaign`, `publish_campaign`, `archive_campaign`;
- aggregate analytics: `get_experience_summary`, `get_experience_funnel`, `get_top_frames`, `get_intent_summary`, `compare_experiences`.

No new MCP tool was added in v2. The current gaps are documented as limitations rather than hidden behind imaginary tool calls.

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

To move **No Store → usable Store** from PARTIAL to YES, add a reviewed source-intake capability (for example, an approved catalog upload/normalization path or a bounded merchant-provided catalog import flow). This is intentionally outside Skill v2 because the current task is workflow guidance, not crawler or catalog infrastructure.
