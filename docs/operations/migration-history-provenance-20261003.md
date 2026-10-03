# Migration History Provenance — 2026-10-03

This immutable repository-history manifest makes the exact bytes of all **53 active migration SQL files** at DB1A base recoverable without copying them under Prisma’s configured migrations path.

- Source commit: `acbb581c03c1931e4e14c2e8715b8ef902dc9a47`
- Configured active path: `prisma/migrations`
- Entry count: 53 `migration.sql` files
- Each Git blob SHA-1 identifies the exact Git object and therefore the exact file bytes at the immutable source commit.
- Recover a row with `git show <source-commit>:prisma/migrations/<directory>/migration.sql`; verify its object identity with `git rev-parse <source-commit>:prisma/migrations/<directory>/migration.sql` (or hash stdin with `git hash-object --stdin`).
- No archive directory is placed under `prisma/migrations`; the active migration files are not changed by DB1A.

| Migration directory | Git blob SHA-1 |
| --- | --- |
| `20250116_add_premium_usage_count` | `b0d81bb4803adebdbeb77a61005eaa88ba9d5c6d` |
| `20250118_add_promo_product_types` | `00d7b911846206a80a6b5dd5c4479110c894cb2b` |
| `20250918030414_init` | `920038c0740cc0588b46648efa26f3b1a02c2705` |
| `20251009084345_add_composite_indexes_for_dashboard` | `dd85049ea6bf672bfbbe2abf60df29711bda014f` |
| `20251015_add_credits_balance` | `5c2704ce776706893e86155f1cf7a2b2218eab62` |
| `20251021_add_user_role` | `a05d6cd14e00f5352c3ec27078caedd374932318` |
| `20251029_add_programmatic_seo_models` | `e5a28e1de74c62190a2b6fdbec82b49f4205c985` |
| `20260605120000_add_face_analysis_task` | `023f521f8ac5aed61475b0330c3dd10eba6cd0f8` |
| `20260702090000_add_face_shape_detection` | `f97c7fa2b1ce1ddc6d2492af3b75af475b56cca3` |
| `20260709090000_add_face_shape_detection_failure_reason` | `1c89bbc4998074a9452820ce8044b2215a4b794f` |
| `20260722120000_optimize_indexes_and_price_cents` | `74dd177682f20066db2e4be8229bca9532ed56ea` |
| `20260724120000_add_tryon_quota_settlement` | `8f65e98ffb8ed0a9a4f9d75226b7ca9962d0e02a` |
| `20260803130000_add_payment_attribution` | `c60231666a5cb1145c48e7ed4eab059cb7511ff1` |
| `20260803150000_add_tryon_submission_idempotency` | `b3f96e4bb6f718bc43d42ffb9c9556bcc4068146` |
| `20260805120000_add_store_foundation` | `01e2b03caa152ce64638fa97199159164c74db17` |
| `20260805160000_store_gate_a1_hardening` | `0525cbfbfbdcecbc0896175b94446de60d682f28` |
| `20260805180000_store_gate_a1_four_epics` | `35ce3fcabdb6d1ac1d886ae31b48172c61e7a424` |
| `20260805190000_add_tryon_task_fenced_leases` | `f9bbd532d8914761e8fa3234249cb0f43f91c616` |
| `20260806120000_merchant_acquisition_entitlement` | `36352e5a9bec213a85f33b15af5d94d45bab5fa6` |
| `20260810131500_track_checkout_lifecycle` | `0f0d026c04434998c6fa7a217af539f533088081` |
| `20260811090000_add_payment_refund_tracking` | `8a5a7651892763338c320a6727f2415c56437d11` |
| `20260811120000_add_pilot_provenance_and_catalog_dimensions` | `427fa53ad5a6037da9db6a3e4b35f851c4b104d2` |
| `20260811130000_add_merchant_default_acquisition` | `cc3da69c4eb05db05a54264f4d6e7d5f83d52036` |
| `20260811150000_add_merchant_experience_policy` | `6a3f27303162003bf47d2b52ac9da9cea7d1517e` |
| `20260811170000_add_store_tryon_batch_id` | `3c91d323fa5efcb98dd133c278ad81f12051fbf1` |
| `20260812100000_add_experiences` | `f918d816e683306c388d43decfeba082a8ddd755` |
| `20260812113000_harden_experience_tenant_foreign_keys` | `02b1caeb9ec400f32fa3976b56afa0ab56d6da1e` |
| `20260812140000_add_merchant_frame_brand` | `c57d428941a42b89233f049e2f28a19f1154c7c0` |
| `20260812150000_add_acquisition_surface` | `2d65f4ac4b895d55147424d0309c67563ae6a7aa` |
| `20260812190000_add_merchant_sponsored_usage` | `1f4a56885a9203e12aadbeaaed53a191fc31c8c0` |
| `20260813090000_add_merchant_memberships` | `1d0d7f5c79d0d51988f4c2b45b898433bddf7764` |
| `20260813100000_add_merchant_agent_credentials` | `65da6ae75b4ab928c525c759595fad2234c63510` |
| `20260813110000_add_campaign_policy_foundation` | `0df8782c890eb61162f16dd4f1068980483bbbe2` |
| `20260814120000_add_mcp_oauth` | `9abff654eaa5867ee0daa0258f4a3096fa2fca81` |
| `20260814160000_add_mcp_oauth_dcr_counter` | `af56dfc52fc791bad3bc61e939a17b917d6edeb2` |
| `20260824143000_add_business_pilot_leads` | `2e2f2021f5f507481d95e19de7faa7b2c5b88458` |
| `20260826120000_backfill_ello_sponsored_usage` | `52bb22e4d9e2b8c9de7b94977a52f26e0400f38b` |
| `20260826150000_reconcile_ello_sponsored_usage` | `0650da2e2682965c1d8390cb64f6065237ae9154` |
| `20260826170000_add_merchant_classification` | `04c335da58886bc846884157f8a56b5cbd1221d0` |
| `20260827100000_add_commercial_entitlement_foundation` | `4131aca623b5f6215fa9f013ed60413973c381ba` |
| `20260828120000_add_generation_telemetry` | `5564849b8765de2af11257582d9e633bc6cb0c2c` |
| `20260828120000_add_merchant_billing` | `3483047bb92c35a0cc63751bfc74a3b2b7dbd6cf` |
| `20260828140000_add_billing_event_operations` | `cd97b68a8e46a2fc9d6b56a4c5b364c07cd47b3b` |
| `20260828140000_generation_telemetry_validation` | `25ffe75f8e1d8f915d798307e41082f68e294444` |
| `20260828150000_add_billing_event_checkout_identity` | `8674f3016410fbfb363650458603c3146ba23479` |
| `20260828150000_harden_merchant_tenant_foreign_keys` | `4a79164768daa8afd50494c5dbad24197be36f64` |
| `20260828220000_add_environment_identity` | `47dca8ba0fca423b5594fe6b1b27c28053e73367` |
| `20260829100000_add_billing_event_plan_code` | `f8b24a008ba519d90b446f31bd8d06f72e1d7be4` |
| `20260907120000_add_merchant_activation_events` | `aaca7e5c0ae826a8cfdf5a1bb299080c671ce03c` |
| `20260926090000_add_experience_journey_policy` | `e8e61b75c0916d49caf369c82b17e18d1a076d82` |
| `20260926100000_add_decision_results` | `fbc6a9239cfe2fe9eb62be3e507a0340b02977a7` |
| `20260926120000_add_experience_delivery_policy` | `ad8ec3ece58e2dbd73296821a5033f0120b2aa50` |
| `20260927170000_add_merchant_commercial_add_ons` | `4df2c3defa7078a66212767dd4536e83fcdac874` |

## Production-specific provenance

- Production ledger-only `00000000000000_canonical_baseline`: checksum `f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e`; exact SQL bytes are recoverable from `b1d5442ac8aa9d3297db12ca77abc498b2bc83a6:prisma/migrations/00000000000000_canonical_baseline/migration.sql`.
- Production ledger-only `20241121_add_try_on_type`: recorded checksum `0`; source not found in the audited repository history.
- `20260805180000_store_gate_a1_four_epics` as applied in Production: commit `3cb445f8c96b2e4ee547aac1e7db1f439621629a`, file SHA-256 `0a188ff7e5ef2abf6311247f7c5e7e436952f0facd384ded4b0c1bbb0cc5e4c9`.
- Same migration at DB1A base: Git blob `35ce3fcabdb6d1ac1d886ae31b48172c61e7a424`, file SHA-256 `6cbfc91e29ff2e176cfff1fce8f3da46f55390347474107d3de1ff36df53ccc4`. This mismatch is recorded, not repaired.
- `20260605120000_add_face_analysis_task` has one rolled-back and one finished Production row. Historical row count at DB0 was 56 rows / 55 unique names, 55 finished / one rolled back.

Historical backfill/reconciliation SQL, including `20260826120000_backfill_ello_sponsored_usage` and `20260826150000_reconcile_ello_sponsored_usage`, is preserved as provenance and must not be replayed on a fresh database.
