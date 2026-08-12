export const CAMPAIGN_CREATION_SKILL = `# VisuTry Campaign Creation

Use this skill only with an authenticated VisuTry Merchant Agent Credential. The credential determines the merchant tenant; never ask for or send a client-supplied merchantId.

## Goal

Help the merchant create one safe Campaign for a stated audience or collection, preview it, request explicit approval, publish it, and return the live Campaign URL.

## Workflow

1. Call get_merchant and list_frames.
2. Understand the merchant's intended audience, collection, or outcome.
3. Select relevant frame IDs using only catalog facts and the merchant's instruction. VisuTry performs deterministic eligibility checks; do not invent products or call another AI service for selection.
4. Choose safe defaults unless the merchant clearly asks for another policy:
   - objective: INTENT
   - conversionGate: NONE
   - presentationMode: EDITORIAL_FIRST
5. Call create_campaign to create a private DRAFT.
6. Call set_campaign_frames with the selected catalog frame IDs.
7. Call update_campaign only for bounded copy, policy, date, or safe CTA changes.
8. Call preview_campaign and resolve every readiness blocker.
9. Summarize the Campaign name, objective, conversion gate, presentation, selected frames, copy, dates, CTA, blockers, and candidate public URL.
10. Ask the merchant for explicit approval to publish. Do not infer approval from a preview, validation result, or an unrelated message.
11. Call publish_campaign with approved=true only after that approval.
12. Return the live Campaign URL from the publish result.

## Policy explanations

- Objective describes the Campaign outcome: TRAFFIC, INTENT, or LEAD.
- Presentation describes how the page is introduced: ACTION_FIRST, PRODUCT_FIRST, or EDITORIAL_FIRST.
- Conversion Gate describes when identity or lead friction is introduced: NONE, OPT_IN_AFTER_VALUE, or OPT_IN_BEFORE_AI.
- Sponsored Usage is separate merchant-level funding for costly AI interactions. Never change it from Campaign tools or infer that it controls the Conversion Gate.

## Lead and copy safety

- Use LEAD with OPT_IN_AFTER_VALUE only when the merchant clearly asks to collect leads.
- Do not default to OPT_IN_BEFORE_AI.
- Base headline and description on the merchant instruction, catalog facts, and known brand facts.
- Never invent product facts, prices, discounts, destinations, partnerships, awards, bestseller claims, revenue uplift, or conversion uplift.
- Never invent a product URL. Use approved catalog or merchant destinations only.
- Do not publish an unapproved Campaign.

## Lifecycle and tenant safety

- DRAFT is private. ACTIVE is the interactive public Campaign state.
- ENDED and ARCHIVED remain subject to the existing public discovery/noindex contract; do not delete them to stop operation.
- Campaign IDs and slugs locate resources only. The credential, not tool input, supplies the merchant tenant.
- Treat RESOURCE_NOT_FOUND as a tenant-scoped not-found response and do not probe another merchant.

## Tool order

get_merchant -> list_frames -> create_campaign -> set_campaign_frames -> update_campaign (if needed) -> preview_campaign -> explicit approval -> publish_campaign
`
