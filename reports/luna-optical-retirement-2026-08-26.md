# Luna Optical retirement audit

- Decision date: 2026-08-26 (Asia/Shanghai)
- Merchant slug: `luna-optical`
- Merchant ID: `cmsfv079x0000fps6mrokbs8v`
- Classification before retirement: `ACTIVE`, `pilotType=LIVE`, `referenceData=false`, `planCode=FOUNDING_PILOT`
- Reason: obsolete fictional demo tenant superseded by the internal `visutry-demo` tenant.

## Pre-deletion inventory

| Record | Count |
| --- | ---: |
| MerchantFrame | 16 |
| Experience | 0 |
| MerchantSession | 65 |
| MerchantEvent | 335 |
| MerchantIntent | 35 |
| StoreAsset | 2 |
| MerchantUsageLedger | 13 |
| StoreAbuseCounter | 10 |
| TryOnTask | 0 |
| MerchantMembership | 0 |
| MerchantAgentCredential | 0 |
| MerchantOAuthAuthorization | 0 |

Of the activity above, 9 sessions, 50 events, and 1 favorite intent were not created by the Luna seed identifiers. The non-seed activity occurred from 2026-08-05 through 2026-08-12 and consisted primarily of internal page, Admin insights, recommendation, and try-on testing. The intent contained no email address.

Both associated `SHOPPER_PHOTO` assets were already marked `DELETED`; their latest retention expiry was 2026-08-12. No live blob deletion or user notification was required during merchant retirement.

## Disposal policy

- Do not migrate Luna sessions, events, intents, or usage into `visutry-demo`.
- Remove Luna from public discovery and from production seed commands.
- Delete only rows scoped to the resolved merchant ID, in foreign-key-safe order.
- Verify that the merchant slug and all tenant-scoped dependent rows are absent after the transaction.

## Execution result

The merchant was first changed from `ACTIVE` to `INACTIVE`, then deleted in a single foreign-key-safe transaction. The transaction removed:

- 13 usage-ledger rows
- 35 intents
- 335 events
- 2 already-deleted asset records
- 65 sessions
- 16 frames
- 10 abuse counters
- 1 merchant

Post-transaction verification returned zero residual rows for the merchant ID and slug across Merchant, frames, Experiences, sessions, events, intents, assets, usage, and TryOnTask. The replacement `visutry-demo` tenant remained `ACTIVE`, with 6 frames and 2 Experiences.
