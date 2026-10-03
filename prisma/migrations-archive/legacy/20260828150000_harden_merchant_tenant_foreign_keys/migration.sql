-- Fail-close merchant-tenant ownership for core commerce relationships.
-- PostgreSQL MATCH SIMPLE keeps nullable merchantSessionId / merchantFrameId /
-- experienceId optional. Delete semantics stay RESTRICT (ON UPDATE CASCADE).
--
-- Integrity matrix (child.merchantId + referenced entity):
--
--   MerchantIntent.merchantSessionId (required)
--     current: merchantSessionId -> MerchantSession.id
--     desired: (merchantSessionId, merchantId) -> MerchantSession(id, merchantId)
--
--   MerchantIntent.merchantFrameId (nullable)
--     current: merchantFrameId -> MerchantFrame.id
--     desired: (merchantFrameId, merchantId) -> MerchantFrame(id, merchantId)
--
--   MerchantEvent.merchantSessionId (nullable)
--     current: merchantSessionId -> MerchantSession.id
--     desired: (merchantSessionId, merchantId) -> MerchantSession(id, merchantId)
--
--   MerchantEvent.merchantFrameId (nullable)
--     current: merchantFrameId -> MerchantFrame.id
--     desired: (merchantFrameId, merchantId) -> MerchantFrame(id, merchantId)
--
--   MerchantUsageLedger.merchantSessionId (nullable)
--     current: merchantSessionId -> MerchantSession.id
--     desired: (merchantSessionId, merchantId) -> MerchantSession(id, merchantId)
--
--   TryOnTask.merchantSessionId (nullable; CONSUMER null via actor CHECK)
--     current: merchantSessionId -> MerchantSession.id
--     desired: (merchantSessionId, merchantId) -> MerchantSession(id, merchantId)
--
--   TryOnTask.merchantFrameId (nullable; CONSUMER null via actor CHECK)
--     current: merchantFrameId -> MerchantFrame.id
--     desired: (merchantFrameId, merchantId) -> MerchantFrame(id, merchantId)
--
--   StoreAsset.merchantSessionId (nullable)
--     current: merchantSessionId -> MerchantSession.id
--     desired: (merchantSessionId, merchantId) -> MerchantSession(id, merchantId)
--
-- MerchantFrame already has UNIQUE (id, merchantId).
-- Experience tenant FKs are unchanged.
-- MerchantSponsoredUsage and MerchantSession.photoAssetId keep single-column
-- SET NULL FKs so deleting the parent cannot null child.merchantId.
--
-- Do not rewrite rows. If any cross-tenant combination exists, abort.

DO $$
DECLARE
  intent_session_violations integer;
  intent_frame_violations integer;
  event_session_violations integer;
  event_frame_violations integer;
  usage_session_violations integer;
  tryon_session_violations integer;
  tryon_frame_violations integer;
  asset_session_violations integer;
  total integer;
BEGIN
  SELECT COUNT(*) INTO intent_session_violations
  FROM "MerchantIntent" AS child
  INNER JOIN "MerchantSession" AS parent ON parent."id" = child."merchantSessionId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO intent_frame_violations
  FROM "MerchantIntent" AS child
  INNER JOIN "MerchantFrame" AS parent ON parent."id" = child."merchantFrameId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO event_session_violations
  FROM "MerchantEvent" AS child
  INNER JOIN "MerchantSession" AS parent ON parent."id" = child."merchantSessionId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO event_frame_violations
  FROM "MerchantEvent" AS child
  INNER JOIN "MerchantFrame" AS parent ON parent."id" = child."merchantFrameId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO usage_session_violations
  FROM "MerchantUsageLedger" AS child
  INNER JOIN "MerchantSession" AS parent ON parent."id" = child."merchantSessionId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO tryon_session_violations
  FROM "TryOnTask" AS child
  INNER JOIN "MerchantSession" AS parent ON parent."id" = child."merchantSessionId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO tryon_frame_violations
  FROM "TryOnTask" AS child
  INNER JOIN "MerchantFrame" AS parent ON parent."id" = child."merchantFrameId"
  WHERE child."merchantId" <> parent."merchantId";

  SELECT COUNT(*) INTO asset_session_violations
  FROM "StoreAsset" AS child
  INNER JOIN "MerchantSession" AS parent ON parent."id" = child."merchantSessionId"
  WHERE child."merchantId" <> parent."merchantId";

  total :=
    intent_session_violations +
    intent_frame_violations +
    event_session_violations +
    event_frame_violations +
    usage_session_violations +
    tryon_session_violations +
    tryon_frame_violations +
    asset_session_violations;

  IF total > 0 THEN
    RAISE EXCEPTION
      'Cross-tenant commerce rows exist; refusing to add composite FKs. intent_session=%, intent_frame=%, event_session=%, event_frame=%, usage_session=%, tryon_session=%, tryon_frame=%, asset_session=%',
      intent_session_violations,
      intent_frame_violations,
      event_session_violations,
      event_frame_violations,
      usage_session_violations,
      tryon_session_violations,
      tryon_frame_violations,
      asset_session_violations;
  END IF;
END $$;

CREATE UNIQUE INDEX "MerchantSession_id_merchantId_key"
  ON "MerchantSession"("id", "merchantId");

ALTER TABLE "MerchantIntent"
  DROP CONSTRAINT IF EXISTS "MerchantIntent_merchantSessionId_fkey",
  DROP CONSTRAINT IF EXISTS "MerchantIntent_merchantFrameId_fkey";

ALTER TABLE "MerchantEvent"
  DROP CONSTRAINT IF EXISTS "MerchantEvent_merchantSessionId_fkey",
  DROP CONSTRAINT IF EXISTS "MerchantEvent_merchantFrameId_fkey";

ALTER TABLE "MerchantUsageLedger"
  DROP CONSTRAINT IF EXISTS "MerchantUsageLedger_merchantSessionId_fkey";

ALTER TABLE "TryOnTask"
  DROP CONSTRAINT IF EXISTS "TryOnTask_merchantSessionId_fkey",
  DROP CONSTRAINT IF EXISTS "TryOnTask_merchantFrameId_fkey";

ALTER TABLE "StoreAsset"
  DROP CONSTRAINT IF EXISTS "StoreAsset_merchantSessionId_fkey";

ALTER TABLE "MerchantIntent"
  ADD CONSTRAINT "MerchantIntent_merchantSessionId_merchantId_fkey"
  FOREIGN KEY ("merchantSessionId", "merchantId")
  REFERENCES "MerchantSession"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantIntent_merchantFrameId_merchantId_fkey"
  FOREIGN KEY ("merchantFrameId", "merchantId")
  REFERENCES "MerchantFrame"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantEvent"
  ADD CONSTRAINT "MerchantEvent_merchantSessionId_merchantId_fkey"
  FOREIGN KEY ("merchantSessionId", "merchantId")
  REFERENCES "MerchantSession"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantEvent_merchantFrameId_merchantId_fkey"
  FOREIGN KEY ("merchantFrameId", "merchantId")
  REFERENCES "MerchantFrame"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantUsageLedger"
  ADD CONSTRAINT "MerchantUsageLedger_merchantSessionId_merchantId_fkey"
  FOREIGN KEY ("merchantSessionId", "merchantId")
  REFERENCES "MerchantSession"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TryOnTask"
  ADD CONSTRAINT "TryOnTask_merchantSessionId_merchantId_fkey"
  FOREIGN KEY ("merchantSessionId", "merchantId")
  REFERENCES "MerchantSession"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "TryOnTask_merchantFrameId_merchantId_fkey"
  FOREIGN KEY ("merchantFrameId", "merchantId")
  REFERENCES "MerchantFrame"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreAsset"
  ADD CONSTRAINT "StoreAsset_merchantSessionId_merchantId_fkey"
  FOREIGN KEY ("merchantSessionId", "merchantId")
  REFERENCES "MerchantSession"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
