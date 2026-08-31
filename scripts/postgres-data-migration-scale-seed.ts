import assert from 'node:assert/strict'
import type { PrismaClient } from '@prisma/client'
import {
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  createReadinessPrismaClient,
  printJson,
  queryOne,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  requireLocalReadinessEnvironment,
  type ReadinessSqlRow,
} from './lib/postgres-readiness'

const DEFAULTS = {
  users: 5_000,
  tryOnTasks: 20_000,
  generationRequests: 20_000,
  faceShapeDetections: 50_000,
} as const

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function positiveInteger(name: string, fallback: number, maximum = 250_000): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a positive integer.`)
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be between 1 and ${maximum}.`)
  }
  return value
}

function boundedInteger(name: string, fallback: number, maximum: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a non-negative integer.`)
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${name} must be between 0 and ${maximum}.`)
  }
  return value
}

async function executeScaleSeed(
  client: PrismaClient,
  prefix: string,
  counts: {
    users: number
    tryOnTasks: number
    generationRequests: number
    secondAttemptRequests: number
    faceShapeDetections: number
    faceAnalysisTasks: number
    payments: number
    storeTasks: number
    usageRows: number
    sponsoredUsageRows: number
    assets: number
  },
): Promise<void> {
  const p = sqlLiteral(prefix)
  const merchantId = `${prefix}-merchant`
  const storeId = `${prefix}-store`
  const campaignId = `${prefix}-campaign`
  const frameId = `${prefix}-frame`
  const sessionId = `${prefix}-session`

  await client.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      INSERT INTO "Merchant" (
        "id", "slug", "name", "pilotType", "referenceData", "classification",
        "planCode", "sponsoredUsagePolicyKey", "commercialStage",
        "entitlementVersion", "commercialStatus", "maxCompareFrames", "createdAt", "updatedAt"
      ) VALUES (
        ${sqlLiteral(merchantId)}, ${sqlLiteral(`${prefix}-merchant`)},
        'DB-P3 scale synthetic merchant', 'INTERNAL', true,
        'TEST'::"MerchantClassification", 'FOUNDING_PILOT', 'VISUTRY_OWNED',
        'MIGRATION_REHEARSAL', 'db-p3-scale', 'ACTIVE', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "Experience" (
        "id", "merchantId", "type", "slug", "name", "status",
        "presentationMode", "referenceData", "createdAt", "updatedAt"
      ) VALUES
        (
          ${sqlLiteral(storeId)}, ${sqlLiteral(merchantId)}, 'STORE'::"ExperienceType",
          ${sqlLiteral(`${prefix}-store`)}, 'DB-P3 scale synthetic store',
          'ACTIVE'::"ExperienceStatus", 'PRODUCT_FIRST'::"PresentationMode", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ),
        (
          ${sqlLiteral(campaignId)}, ${sqlLiteral(merchantId)}, 'CAMPAIGN'::"ExperienceType",
          ${sqlLiteral(`${prefix}-campaign`)}, 'DB-P3 scale synthetic campaign',
          'ACTIVE'::"ExperienceStatus", 'ACTION_FIRST'::"PresentationMode", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "MerchantFrame" (
        "id", "merchantId", "sku", "name", "shape", "source", "status",
        "styleTags", "collectionTags", "enrichmentStatus", "createdAt", "updatedAt"
      ) VALUES (
        ${sqlLiteral(frameId)}, ${sqlLiteral(merchantId)}, ${sqlLiteral(`${prefix}-sku`)},
        'DB-P3 scale synthetic frame', 'round', 'MANUAL'::"MerchantFrameSource",
        'ACTIVE'::"MerchantFrameStatus", ARRAY['scale', 'synthetic']::text[],
        ARRAY['db-p3']::text[], 'APPROVED'::"EnrichmentStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "ExperienceFrame" (
        "experienceId", "merchantId", "merchantFrameId", "sortOrder", "active", "createdAt", "updatedAt"
      ) VALUES (${sqlLiteral(storeId)}, ${sqlLiteral(merchantId)}, ${sqlLiteral(frameId)}, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "MerchantSession" (
        "id", "merchantId", "experienceId", "anonymousVisitorId", "capabilityTokenHash",
        "status", "referenceData", "expiresAt", "source", "campaign",
        "acquisitionSurface", "billableAICommerceSession", "billableAICommerceSessionAt", "createdAt", "updatedAt"
      ) VALUES (
        ${sqlLiteral(sessionId)}, ${sqlLiteral(merchantId)}, ${sqlLiteral(storeId)},
        ${sqlLiteral(`${prefix}-visitor`)}, ${sqlLiteral(`${prefix}-capability-hash`)},
        'ACTIVE'::"MerchantSessionStatus", true, CURRENT_TIMESTAMP + INTERVAL '1 day',
        'db-p3-scale', ${sqlLiteral(`${prefix}-campaign`)}, 'provider-portability', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "User" (
        "id", "email", "username", "creditsPurchased", "creditsUsed",
        "isPremium", "premiumExpiresAt", "currentSubscriptionType", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-user-' || gs::text,
             ${p} || '-user-' || gs::text || '@example.test',
             ${p} || '-username-' || gs::text,
             20 + (gs % 5),
             3 + (gs % 3),
             (gs % 2 = 0),
             CASE WHEN gs % 2 = 0 THEN CURRENT_TIMESTAMP + INTERVAL '30 days' ELSE NULL END,
             CASE WHEN gs % 2 = 0 THEN 'PREMIUM_MONTHLY' ELSE NULL END,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.users}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId")
      SELECT ${p} || '-account-' || gs::text,
             ${p} || '-user-' || gs::text,
             'oauth', 'db-p3-fixture', ${p} || '-provider-account-' || gs::text
        FROM generate_series(1, ${counts.users}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "Session" ("id", "sessionToken", "userId", "expires")
      SELECT ${p} || '-session-' || gs::text,
             ${p} || '-session-token-' || gs::text,
             ${p} || '-user-' || gs::text,
             CURRENT_TIMESTAMP + INTERVAL '1 day'
        FROM generate_series(1, ${counts.users}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "MerchantMembership" ("id", "userId", "merchantId", "role", "createdAt", "updatedAt")
      SELECT ${p} || '-membership-' || gs::text,
             ${p} || '-user-' || gs::text,
             ${sqlLiteral(merchantId)},
             CASE WHEN gs = 1 THEN 'OWNER' ELSE 'ADMIN' END::"MerchantMembershipRole",
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.users}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "FaceShapeDetection" ("id", "status", "failureReason", "createdAt")
      SELECT ${p} || '-shape-' || gs::text,
             'COMPLETED'::"TaskStatus",
             NULL, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.faceShapeDetections}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "FaceAnalysisTask" (
        "id", "userId", "userImageUrl", "status", "detectedShape", "confidence",
        "basicResult", "fullResult", "reportUnlocked", "metadata", "expiresAt", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-face-analysis-' || gs::text,
             ${p} || '-user-' || (((gs - 1) % ${counts.users}) + 1)::text,
             'https://assets.example.test/db-p3-scale/face.jpg',
             'COMPLETED'::"TaskStatus", 'oval', 0.97,
             '{"shape":"oval","scale":true}'::jsonb,
             '{"shape":"oval","confidence":0.97,"scale":true}'::jsonb,
             true, '{"rehearsal":"db-p3-scale"}'::jsonb,
             CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.faceAnalysisTasks}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "Payment" (
        "id", "userId", "stripeSessionId", "stripePaymentId", "amount", "currency",
        "status", "productType", "description", "attribution", "completedAt", "creditsRevoked", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-payment-' || gs::text,
             ${p} || '-user-' || (((gs - 1) % ${counts.users}) + 1)::text,
             ${p} || '-payment-session-' || gs::text,
             ${p} || '-payment-id-' || gs::text,
             1999 + (gs % 5) * 100,
             'usd',
             CASE WHEN gs % 10 = 0 THEN 'PENDING' ELSE 'COMPLETED' END::"PaymentStatus",
             'CREDITS_PACK'::"ProductType", 'DB-P3 scale synthetic payment',
             '{"source":"db-p3-scale"}'::jsonb,
             CASE WHEN gs % 10 = 0 THEN NULL ELSE CURRENT_TIMESTAMP END,
             CASE WHEN gs % 10 = 0 THEN 0 ELSE gs % 3 END,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.payments}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "StoreAsset" (
        "id", "merchantId", "merchantSessionId", "ownerType", "ownerId", "purpose",
        "storageKey", "accessMode", "providerUrl", "expiresAt", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-asset-' || gs::text,
             ${sqlLiteral(merchantId)}, ${sqlLiteral(sessionId)}, 'MERCHANT_SESSION',
             ${sqlLiteral(sessionId)}, 'SHOPPER_PHOTO'::"StoreAssetPurpose",
             ${p} || '/asset-' || gs::text || '.jpg', 'PRIVATE_SIGNED'::"StoreAssetAccessMode",
             'https://assets.example.test/db-p3-scale/asset.jpg', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.assets}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "TryOnTask" (
        "id", "userId", "type", "userImageUrl", "itemImageUrl", "glassesImageUrl",
        "status", "resultImageUrl", "quotaSettledAt", "quotaSource", "origin",
        "merchantId", "merchantSessionId", "merchantFrameId", "idempotencyKey",
        "clientSubmissionId", "batchId", "metadata", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-task-' || gs::text,
             CASE WHEN gs <= ${counts.storeTasks} THEN NULL
                  ELSE ${p} || '-user-' || (((gs - 1) % ${counts.users}) + 1)::text END,
             'GLASSES'::"TryOnType",
             'https://assets.example.test/db-p3-scale/user.jpg',
             'https://assets.example.test/db-p3-scale/item.jpg',
             'https://assets.example.test/db-p3-scale/item.jpg',
             CASE WHEN gs % 5 = 0 THEN 'PENDING' ELSE 'COMPLETED' END::"TaskStatus",
             CASE WHEN gs % 5 = 0 THEN NULL ELSE 'https://assets.example.test/db-p3-scale/result.jpg' END,
             CASE WHEN gs <= ${counts.storeTasks} OR gs % 5 = 0 THEN NULL ELSE CURRENT_TIMESTAMP END,
             CASE WHEN gs <= ${counts.storeTasks} OR gs % 5 = 0 THEN NULL ELSE 'credit' END,
             CASE WHEN gs <= ${counts.storeTasks} THEN 'STORE_PILOT' ELSE 'CONSUMER' END::"TryOnOrigin",
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(merchantId)} ELSE NULL END,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(sessionId)} ELSE NULL END,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(frameId)} ELSE NULL END,
             ${p} || '-idempotency-' || gs::text,
             ${p} || '-submission-' || gs::text,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${p} || '-batch-' || ((gs - 1) / 50)::text ELSE NULL END,
             '{"rehearsal":"db-p3-scale","provider":"postgresql"}'::jsonb,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.tryOnTasks}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "GenerationRequest" (
        "id", "tryOnTaskId", "origin", "userId", "merchantId", "storeId", "campaignId",
        "clientSubmissionId", "generationType", "requestedModel", "requestedProvider",
        "finalStatus", "startedAt", "completedAt", "endToEndDurationMs", "attemptCount",
        "isTest", "environment", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-request-' || gs::text,
             ${p} || '-task-' || gs::text,
             CASE WHEN gs <= ${counts.storeTasks} THEN 'STORE' ELSE 'CONSUMER' END::"GenerationTelemetryOrigin",
             CASE WHEN gs <= ${counts.storeTasks} THEN NULL
                  ELSE ${p} || '-user-' || (((gs - 1) % ${counts.users}) + 1)::text END,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(merchantId)} ELSE NULL END,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(storeId)} ELSE NULL END,
             CASE WHEN gs <= ${counts.storeTasks} THEN ${sqlLiteral(campaignId)} ELSE NULL END,
             ${p} || '-generation-' || gs::text,
             'GLASSES_TRY_ON', 'db-p3-scale-model', 'db-p3-fixture-provider',
             'COMPLETED'::"GenerationRequestFinalStatus",
             CURRENT_TIMESTAMP - INTERVAL '5 minutes', CURRENT_TIMESTAMP, 1250,
             CASE WHEN gs <= ${counts.secondAttemptRequests} THEN 2 ELSE 1 END,
             true, 'test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.generationRequests}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "GenerationAttempt" (
        "id", "requestId", "attemptNumber", "provider", "model", "providerTaskId",
        "submittedAt", "completedAt", "submitDurationMs", "attemptDurationMs",
        "providerDurationMs", "status", "isTimeout", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-attempt-' || request_no::text || '-' || attempt_no::text,
             ${p} || '-request-' || request_no::text,
             attempt_no, 'db-p3-fixture-provider', 'db-p3-scale-model',
             ${p} || '-provider-task-' || request_no::text || '-' || attempt_no::text,
             CURRENT_TIMESTAMP - INTERVAL '4 minutes', CURRENT_TIMESTAMP,
             100, 1150, 1050, 'COMPLETED'::"GenerationAttemptStatus", false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.generationRequests}) AS requests(request_no)
        CROSS JOIN LATERAL generate_series(
          1, CASE WHEN request_no <= ${counts.secondAttemptRequests} THEN 2 ELSE 1 END
        ) AS attempts(attempt_no)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "MerchantUsageLedger" (
        "id", "merchantId", "merchantSessionId", "tryOnTaskId", "kind", "dedupeKey", "createdAt"
      )
      SELECT ${p} || '-usage-' || gs::text,
             ${sqlLiteral(merchantId)}, ${sqlLiteral(sessionId)}, ${p} || '-task-' || gs::text,
             CASE WHEN gs % 2 = 0 THEN 'RENDER_SUCCESS' ELSE 'RENDER_ATTEMPT' END::"MerchantUsageKind",
             ${p} || '-usage-dedupe-' || gs::text, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.usageRows}) AS series(gs)
    `)
    await tx.$executeRawUnsafe(`
      INSERT INTO "MerchantSponsoredUsage" (
        "id", "merchantId", "merchantSessionId", "experienceId", "userId",
        "shopperIdentityHash", "usageType", "status", "idempotencyKey",
        "reservedAt", "consumedAt", "createdAt", "updatedAt"
      )
      SELECT ${p} || '-sponsored-' || gs::text,
             ${sqlLiteral(merchantId)}, ${sqlLiteral(sessionId)}, ${sqlLiteral(storeId)},
             ${p} || '-user-' || (((gs - 1) % ${counts.users}) + 1)::text,
             ${p} || '-shopper-hash-' || gs::text,
             CASE WHEN gs % 2 = 0 THEN 'SPONSORED_GENERATION' ELSE 'SPONSORED_COMPARE' END::"MerchantSponsoredUsageType",
             CASE WHEN gs % 3 = 0 THEN 'RESERVED' ELSE 'CONSUMED' END::"MerchantSponsoredUsageStatus",
             ${p} || '-sponsored-key-' || gs::text,
             CURRENT_TIMESTAMP,
             CASE WHEN gs % 3 = 0 THEN NULL ELSE CURRENT_TIMESTAMP END,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM generate_series(1, ${counts.sponsoredUsageRows}) AS series(gs)
    `)
  })
}

async function main(): Promise<void> {
  requireLocalReadinessEnvironment()
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to create the scaled SOURCE_SIM fixture.')
  }
  const connectionString = assertPostgresConnectionString(
    'P3_FIXTURE_DATABASE_URL',
    requireEnvironmentVariable('P3_FIXTURE_DATABASE_URL'),
  )
  const counts = {
    users: positiveInteger('P3_SCALE_USERS', DEFAULTS.users),
    tryOnTasks: positiveInteger('P3_SCALE_TRY_ON_TASKS', DEFAULTS.tryOnTasks),
    generationRequests: positiveInteger('P3_SCALE_GENERATION_REQUESTS', DEFAULTS.generationRequests),
    secondAttemptRequests: boundedInteger(
      'P3_SCALE_SECOND_ATTEMPT_REQUESTS',
      Math.floor(DEFAULTS.generationRequests / 2),
      positiveInteger('P3_SCALE_GENERATION_REQUESTS', DEFAULTS.generationRequests),
    ),
    faceShapeDetections: positiveInteger('P3_SCALE_FACE_SHAPE_DETECTIONS', DEFAULTS.faceShapeDetections),
    faceAnalysisTasks: positiveInteger('P3_SCALE_FACE_ANALYSIS_TASKS', Math.min(DEFAULTS.users, 5_000)),
    payments: positiveInteger('P3_SCALE_PAYMENTS', Math.min(DEFAULTS.users, 5_000)),
    storeTasks: positiveInteger('P3_SCALE_STORE_TASKS', Math.min(DEFAULTS.tryOnTasks, 1_000)),
    usageRows: positiveInteger('P3_SCALE_USAGE_ROWS', Math.min(DEFAULTS.tryOnTasks, 5_000)),
    sponsoredUsageRows: positiveInteger('P3_SCALE_SPONSORED_USAGE_ROWS', Math.min(DEFAULTS.users, 5_000)),
    assets: positiveInteger('P3_SCALE_ASSETS', 100),
  }
  if (counts.storeTasks > counts.tryOnTasks) counts.storeTasks = counts.tryOnTasks
  if (counts.generationRequests > counts.tryOnTasks) counts.generationRequests = counts.tryOnTasks
  if (counts.secondAttemptRequests > counts.generationRequests) counts.secondAttemptRequests = counts.generationRequests
  if (counts.usageRows > counts.tryOnTasks) counts.usageRows = counts.tryOnTasks

  const prefix = `db-p3-scale-${Date.now()}-${process.pid}`
  const client = createReadinessPrismaClient(connectionString)
  try {
    await assertReadinessTargetSafety(client, connectionString)
    await executeScaleSeed(client, prefix, counts)
    const actual = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT
         (SELECT COUNT(*) FROM "User" WHERE "id" LIKE ${sqlLiteral(`${prefix}-user-%`)})::bigint AS users,
         (SELECT COUNT(*) FROM "TryOnTask" WHERE "id" LIKE ${sqlLiteral(`${prefix}-task-%`)})::bigint AS try_on_tasks,
         (SELECT COUNT(*) FROM "GenerationRequest" WHERE "id" LIKE ${sqlLiteral(`${prefix}-request-%`)})::bigint AS generation_requests,
         (SELECT COUNT(*) FROM "GenerationAttempt" WHERE "id" LIKE ${sqlLiteral(`${prefix}-attempt-%`)})::bigint AS generation_attempts,
         (SELECT COUNT(*) FROM "FaceShapeDetection" WHERE "id" LIKE ${sqlLiteral(`${prefix}-shape-%`)})::bigint AS face_shape_detections,
         (SELECT COUNT(*) FROM "FaceAnalysisTask" WHERE "id" LIKE ${sqlLiteral(`${prefix}-face-analysis-%`)})::bigint AS face_analysis_tasks,
         (SELECT COUNT(*) FROM "Payment" WHERE "id" LIKE ${sqlLiteral(`${prefix}-payment-%`)})::bigint AS payments,
         (SELECT COUNT(*) FROM "MerchantUsageLedger" WHERE "id" LIKE ${sqlLiteral(`${prefix}-usage-%`)})::bigint AS usage_rows,
         (SELECT COUNT(*) FROM "MerchantSponsoredUsage" WHERE "id" LIKE ${sqlLiteral(`${prefix}-sponsored-%`)})::bigint AS sponsored_usage_rows`,
    )
    const actualCounts = Object.fromEntries(
      Object.entries(actual).map(([key, value]) => [key, Number(value)]),
    )
    assert.equal(actualCounts.users, counts.users)
    assert.equal(actualCounts.try_on_tasks, counts.tryOnTasks)
    assert.equal(actualCounts.generation_requests, counts.generationRequests)
    assert.equal(actualCounts.generation_attempts, counts.generationRequests + counts.secondAttemptRequests)
    assert.equal(actualCounts.face_shape_detections, counts.faceShapeDetections)
    assert.equal(actualCounts.face_analysis_tasks, counts.faceAnalysisTasks)
    assert.equal(actualCounts.payments, counts.payments)
    assert.equal(actualCounts.usage_rows, counts.usageRows)
    assert.equal(actualCounts.sponsored_usage_rows, counts.sponsoredUsageRows)
    printJson({
      result: 'PASS',
      mode: 'scale',
      localSyntheticOnly: true,
      target: redactPostgresConnectionString(connectionString),
      dataset: {
        ...actualCounts,
        expectedGenerationAttempts: counts.generationRequests + counts.secondAttemptRequests,
      },
    })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`Scaled PostgreSQL fixture failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
