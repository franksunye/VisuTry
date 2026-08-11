# Campaign Intelligence Taxonomy Hardening Notes

Date: 2026-08-11  
Status: Implemented in code

## P0 — Separate VisuTry Store B2B LP from shopper campaigns

`/store` marketing visitors are **merchant prospects**, not shoppers inside a brand campaign.

| Funnel | Events | actor_type | journey_type | entry_point |
|---|---|---|---|---|
| VisuTry Store B2B LP | `b2b_landing_viewed`, `b2b_sales_intent_clicked`, `b2b_lead_form_started`, `b2b_lead_created` | `merchant_prospect` | `visutry_b2b_acquisition` | `b2b` |
| Merchant/brand shopper campaign | `campaign_landed`, `campaign_engaged`, `tryon_*`, `purchase_intent_clicked`, `lead_created` | `shopper` (implicit) | `shopper_campaign` | `campaign` / `store` |

Do **not** use `campaign_landed` for `/store` product sales LP.

## P1 — campaign_id vs campaign_name

| Field | Source | Rule |
|---|---|---|
| `campaign_id` | `?campaign_id=` only | Stable VisuTry internal id; never invent |
| `campaign_name` | `?utm_campaign=` | External marketing label only |

## P1 — GA4 cardinality hygiene

| Avoid in GA4 | Prefer |
|---|---|
| `preset_ids` CSV lists | `recommendation_count`, `frame_category`, `style_intent`, `occasion` |
| raw `href` | `cta_location` / `intent_type` |
| raw `error_message` | normalized `failure_reason` enum |

Normalized `failure_reason` values:

```text
no_face
multiple_faces
invalid_image
quality_too_low
processing_error
network_error
quota
timeout
unknown
```
