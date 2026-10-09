# Merchant Commercial Measurement v1

**Status:** Active measurement contract
**Scope:** Business-site acquisition through Pilot / Enterprise inquiry and Merchant First Value
**Last updated:** 2026-10-08

This contract keeps acquisition observation, persisted business inquiries,
Merchant activation, and billing evidence separate. It does not introduce a
new analytics platform or treat a browser event as a commercial outcome.

| Funnel question | Source of truth | What it proves | What it does not prove |
| --- | --- | --- | --- |
| Where did an inquiry originate? | Persisted `BusinessPilotLead` acquisition fields (`acquisitionSource`, `acquisitionMedium`, `campaignName`, `landingPath`, `referrerHost`) | A consented Pilot request or Enterprise inquiry was stored with bounded attribution | A visit or click by itself is not an inquiry |
| Which Business CTA was clicked? | Existing B2B `b2b_sales_intent_clicked`, with `source=business_site`, bounded `cta_location`, and `intent_type=pilot_request` or `enterprise_inquiry` | The visitor clicked a Pilot or Enterprise CTA at a known Business-site placement | It is not a lead, signup, or revenue event |
| Was an inquiry submitted? | Successful `BusinessPilotLead` persistence; `b2b_lead_created` is emitted after API success with matching bounded `intent_type` / `lead_type` | A request reached the existing lead workflow as a Pilot request or Enterprise inquiry | GA4 delivery is not the durable lead record |
| Did the Merchant reach First Value? | Durable `MerchantActivationEvent` cohort and milestones | A self-service Merchant reached the contract-defined activation stages | It does not imply payment or a successful production billing configuration |
| Was revenue collected? | Canonical billing records and verified Stripe Live evidence | A billing state backed by the appropriate live transaction evidence | Stripe Test Mode is not Production revenue |

Business-site inquiry events use `source=business_site`; existing `/store`
marketing events retain `source=store_landing`. Form analytics contain only
bounded business type, inquiry intent/goal, and frame-count values—never
contact name, email, free-text message, or a full URL. The existing
`BusinessPilotLead.goal` field stores `enterprise` for Enterprise inquiries;
no new persistence field is introduced. The durable lead record remains the
source of truth and retains the existing consent and server-side validation.

Merchant activation reporting admits only `SELF_SERVICE_SIGNUP` workspaces
classified as `REAL` or `POSSIBLE_EXTERNAL` with `referenceData=false`. It
reports confirmed `REAL` merchants separately from unverified
`POSSIBLE_EXTERNAL` candidates; rates using the combined denominator are
candidate-cohort rates, not confirmed-merchant conversion rates. Untrusted and
operational classifications fail closed. Public shopper analytics remains a
separate B2C funnel and keeps its existing exclusions.

The first-touch attribution snapshot is cohort-level evidence, not permission
to join people across systems. No new person-level identity stitching, CRM, or
Production data query is part of this contract.
