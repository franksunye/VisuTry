import assert from 'node:assert/strict'
import { localPostgresPrisma as prisma } from './lib/local-postgres-prisma'

type PrismaLikeError = { code?: string; message?: string }

function isForeignKeyViolation(error: unknown): boolean {
  const err = error as PrismaLikeError
  return err.code === 'P2003' || /foreign key constraint/i.test(String(err.message ?? error))
}

async function assertRejected(label: string, work: () => Promise<unknown>): Promise<void> {
  try {
    await work()
  } catch (error) {
    assert.ok(isForeignKeyViolation(error), `${label}: expected FK violation, got ${String(error)}`)
    return
  }
  assert.fail(`${label}: expected tenant FK rejection`)
}

async function merchantFixture(suffix: string, slug: string) {
  return prisma.merchant.create({
    data: {
      slug: `${slug}-${suffix}`,
      name: slug,
      pilotType: 'INTERNAL',
      referenceData: false,
      classification: 'AUTOMATION',
      classificationSource: 'AUTOMATED_TEST',
      classificationReason: 'Merchant tenant FK contract fixture; never commercial traffic.',
    },
    select: { id: true },
  })
}

async function frameFixture(merchantId: string, sku: string) {
  return prisma.merchantFrame.create({
    data: {
      merchantId,
      sku,
      name: sku,
      shape: 'rectangle',
      status: 'ACTIVE',
    },
    select: { id: true },
  })
}

async function experienceFixture(
  merchantId: string,
  type: 'STORE' | 'CAMPAIGN',
  slug: string,
) {
  return prisma.experience.create({
    data: {
      merchantId,
      type,
      slug,
      name: slug,
      status: 'ACTIVE',
    },
    select: { id: true },
  })
}

async function sessionFixture(merchantId: string, experienceId: string | null, token: string) {
  return prisma.merchantSession.create({
    data: {
      merchantId,
      experienceId,
      capabilityTokenHash: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      status: 'ACTIVE',
    },
    select: { id: true },
  })
}

async function main(): Promise<void> {
  const suffix = `${Date.now()}-${process.pid}`
  const merchantA = await merchantFixture(suffix, 'tenant-fk-a')
  const merchantB = await merchantFixture(suffix, 'tenant-fk-b')
  const user = await prisma.user.create({
    data: {
      email: `tenant-fk-${suffix}@example.test`,
      freeTrialsUsed: 0,
      creditsPurchased: 0,
      creditsUsed: 0,
    },
    select: { id: true },
  })

  const frameA = await frameFixture(merchantA.id, `frame-a-${suffix}`)
  const frameB = await frameFixture(merchantB.id, `frame-b-${suffix}`)
  const storeA = await experienceFixture(merchantA.id, 'STORE', `store-a-${suffix}`)
  const storeB = await experienceFixture(merchantB.id, 'STORE', `store-b-${suffix}`)
  const campaignA = await experienceFixture(merchantA.id, 'CAMPAIGN', `campaign-a-${suffix}`)
  const sessionA = await sessionFixture(merchantA.id, storeA.id, `hash-a-${suffix}`)
  const sessionACampaign = await sessionFixture(merchantA.id, campaignA.id, `hash-ac-${suffix}`)
  const sessionB = await sessionFixture(merchantB.id, storeB.id, `hash-b-${suffix}`)
  const sessionANoExperience = await sessionFixture(merchantA.id, null, `hash-anull-${suffix}`)

  const createdIds = {
    merchantA: merchantA.id,
    merchantB: merchantB.id,
    user: user.id,
  }

  try {
    const precheck = await prisma.$queryRaw<Array<{
      intent_session: bigint
      intent_frame: bigint
      event_session: bigint
      event_frame: bigint
      usage_session: bigint
      tryon_session: bigint
      tryon_frame: bigint
      asset_session: bigint
    }>>`
      SELECT
        (SELECT COUNT(*) FROM "MerchantIntent" c JOIN "MerchantSession" p ON p."id" = c."merchantSessionId" WHERE c."merchantId" <> p."merchantId") AS intent_session,
        (SELECT COUNT(*) FROM "MerchantIntent" c JOIN "MerchantFrame" p ON p."id" = c."merchantFrameId" WHERE c."merchantId" <> p."merchantId") AS intent_frame,
        (SELECT COUNT(*) FROM "MerchantEvent" c JOIN "MerchantSession" p ON p."id" = c."merchantSessionId" WHERE c."merchantId" <> p."merchantId") AS event_session,
        (SELECT COUNT(*) FROM "MerchantEvent" c JOIN "MerchantFrame" p ON p."id" = c."merchantFrameId" WHERE c."merchantId" <> p."merchantId") AS event_frame,
        (SELECT COUNT(*) FROM "MerchantUsageLedger" c JOIN "MerchantSession" p ON p."id" = c."merchantSessionId" WHERE c."merchantId" <> p."merchantId") AS usage_session,
        (SELECT COUNT(*) FROM "TryOnTask" c JOIN "MerchantSession" p ON p."id" = c."merchantSessionId" WHERE c."merchantId" <> p."merchantId") AS tryon_session,
        (SELECT COUNT(*) FROM "TryOnTask" c JOIN "MerchantFrame" p ON p."id" = c."merchantFrameId" WHERE c."merchantId" <> p."merchantId") AS tryon_frame,
        (SELECT COUNT(*) FROM "StoreAsset" c JOIN "MerchantSession" p ON p."id" = c."merchantSessionId" WHERE c."merchantId" <> p."merchantId") AS asset_session
    `
    const counts = Object.fromEntries(
      Object.entries(precheck[0]!).map(([key, value]) => [key, Number(value)]),
    )
    assert.deepEqual(counts, {
      intent_session: 0,
      intent_frame: 0,
      event_session: 0,
      event_frame: 0,
      usage_session: 0,
      tryon_session: 0,
      tryon_frame: 0,
      asset_session: 0,
    })

    const sameTenantIntent = await prisma.merchantIntent.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        experienceId: storeA.id,
        merchantFrameId: frameA.id,
        type: 'FAVORITE',
        idempotencyKey: `intent-valid-${suffix}`,
      },
    })
    assert.equal(sameTenantIntent.merchantId, merchantA.id)

    const nullableFrameIntent = await prisma.merchantIntent.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        experienceId: storeA.id,
        merchantFrameId: null,
        type: 'INQUIRY',
        idempotencyKey: `intent-null-frame-${suffix}`,
      },
    })
    assert.equal(nullableFrameIntent.merchantFrameId, null)

    await assertRejected('MerchantIntent cross-tenant session', () =>
      prisma.merchantIntent.create({
        data: {
          merchantId: merchantA.id,
          merchantSessionId: sessionB.id,
          type: 'FAVORITE',
          idempotencyKey: `intent-cross-session-${suffix}`,
        },
      }),
    )

    await assertRejected('MerchantIntent cross-tenant frame', () =>
      prisma.merchantIntent.create({
        data: {
          merchantId: merchantA.id,
          merchantSessionId: sessionA.id,
          merchantFrameId: frameB.id,
          type: 'PRODUCT_CLICK',
          idempotencyKey: `intent-cross-frame-${suffix}`,
        },
      }),
    )

    const nullableEvent = await prisma.merchantEvent.create({
      data: {
        eventId: `event-null-${suffix}`,
        type: 'merchant_page_viewed',
        merchantId: merchantA.id,
        merchantSessionId: null,
        merchantFrameId: null,
        source: 'SERVER',
      },
    })
    assert.equal(nullableEvent.merchantSessionId, null)
    assert.equal(nullableEvent.merchantFrameId, null)

    const sameTenantEvent = await prisma.merchantEvent.create({
      data: {
        eventId: `event-valid-${suffix}`,
        type: 'merchant_frame_selected',
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        experienceId: storeA.id,
        merchantFrameId: frameA.id,
        source: 'SERVER',
      },
    })
    assert.equal(sameTenantEvent.merchantFrameId, frameA.id)

    await assertRejected('MerchantEvent cross-tenant session', () =>
      prisma.merchantEvent.create({
        data: {
          eventId: `event-cross-session-${suffix}`,
          type: 'merchant_tryon_started',
          merchantId: merchantA.id,
          merchantSessionId: sessionB.id,
          source: 'SERVER',
        },
      }),
    )

    await assertRejected('MerchantEvent cross-tenant frame', () =>
      prisma.merchantEvent.create({
        data: {
          eventId: `event-cross-frame-${suffix}`,
          type: 'merchant_tryon_completed',
          merchantId: merchantA.id,
          merchantSessionId: sessionA.id,
          merchantFrameId: frameB.id,
          source: 'SERVER',
        },
      }),
    )

    const nullUsage = await prisma.merchantUsageLedger.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: null,
        kind: 'SESSION',
      },
    })
    assert.equal(nullUsage.merchantSessionId, null)

    const sameTenantUsage = await prisma.merchantUsageLedger.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        kind: 'RENDER_ATTEMPT',
        dedupeKey: `usage-valid-${suffix}`,
      },
    })
    assert.equal(sameTenantUsage.merchantSessionId, sessionA.id)

    await assertRejected('MerchantUsageLedger cross-tenant session', () =>
      prisma.merchantUsageLedger.create({
        data: {
          merchantId: merchantA.id,
          merchantSessionId: sessionB.id,
          kind: 'RENDER_SUCCESS',
          dedupeKey: `usage-cross-${suffix}`,
        },
      }),
    )

    const nullAsset = await prisma.storeAsset.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: null,
        ownerType: 'MERCHANT',
        ownerId: merchantA.id,
        purpose: 'FRAME_INPUT',
        storageKey: `asset-null-${suffix}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
    assert.equal(nullAsset.merchantSessionId, null)

    const sameTenantAsset = await prisma.storeAsset.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        ownerType: 'SESSION',
        ownerId: sessionA.id,
        purpose: 'SHOPPER_PHOTO',
        storageKey: `asset-valid-${suffix}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
    assert.equal(sameTenantAsset.merchantSessionId, sessionA.id)

    await assertRejected('StoreAsset cross-tenant session', () =>
      prisma.storeAsset.create({
        data: {
          merchantId: merchantA.id,
          merchantSessionId: sessionB.id,
          ownerType: 'SESSION',
          ownerId: sessionB.id,
          purpose: 'SHOPPER_PHOTO',
          storageKey: `asset-cross-${suffix}`,
          expiresAt: new Date(Date.now() + 60_000),
        },
      }),
    )

    const consumerTask = await prisma.tryOnTask.create({
      data: {
        userId: user.id,
        type: 'GLASSES',
        userImageUrl: 'https://example.test/consumer-user.png',
        itemImageUrl: 'https://example.test/consumer-item.png',
        origin: 'CONSUMER',
        merchantId: null,
        merchantSessionId: null,
        merchantFrameId: null,
      },
    })
    assert.equal(consumerTask.origin, 'CONSUMER')
    assert.equal(consumerTask.merchantId, null)
    assert.equal(consumerTask.userId, user.id)

    const storeTask = await prisma.tryOnTask.create({
      data: {
        type: 'GLASSES',
        userImageUrl: 'https://example.test/store-user.png',
        itemImageUrl: 'https://example.test/store-item.png',
        origin: 'STORE_DEMO',
        merchantId: merchantA.id,
        merchantSessionId: sessionA.id,
        merchantFrameId: frameA.id,
        idempotencyKey: `store-task-${suffix}`,
      },
    })
    assert.equal(storeTask.origin, 'STORE_DEMO')

    const campaignTask = await prisma.tryOnTask.create({
      data: {
        type: 'GLASSES',
        userImageUrl: 'https://example.test/campaign-user.png',
        itemImageUrl: 'https://example.test/campaign-item.png',
        origin: 'STORE_PILOT',
        merchantId: merchantA.id,
        merchantSessionId: sessionACampaign.id,
        merchantFrameId: frameA.id,
        idempotencyKey: `campaign-task-${suffix}`,
      },
    })
    assert.equal(campaignTask.origin, 'STORE_PILOT')
    assert.equal(campaignTask.merchantSessionId, sessionACampaign.id)

    await assertRejected('TryOnTask cross-tenant session', () =>
      prisma.tryOnTask.create({
        data: {
          type: 'GLASSES',
          userImageUrl: 'https://example.test/cross-session-user.png',
          itemImageUrl: 'https://example.test/cross-session-item.png',
          origin: 'STORE_DEMO',
          merchantId: merchantA.id,
          merchantSessionId: sessionB.id,
          merchantFrameId: frameA.id,
          idempotencyKey: `tryon-cross-session-${suffix}`,
        },
      }),
    )

    await assertRejected('TryOnTask cross-tenant frame', () =>
      prisma.tryOnTask.create({
        data: {
          type: 'GLASSES',
          userImageUrl: 'https://example.test/cross-frame-user.png',
          itemImageUrl: 'https://example.test/cross-frame-item.png',
          origin: 'STORE_DEMO',
          merchantId: merchantA.id,
          merchantSessionId: sessionA.id,
          merchantFrameId: frameB.id,
          idempotencyKey: `tryon-cross-frame-${suffix}`,
        },
      }),
    )

    await assertRejected('MerchantSession cross-tenant experience', () =>
      prisma.merchantSession.create({
        data: {
          merchantId: merchantA.id,
          experienceId: storeB.id,
          capabilityTokenHash: `hash-cross-exp-${suffix}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }),
    )

    const sameTenantNullExperience = await prisma.merchantSession.findUniqueOrThrow({
      where: { id: sessionANoExperience.id },
    })
    assert.equal(sameTenantNullExperience.experienceId, null)
    assert.equal(sameTenantNullExperience.merchantId, merchantA.id)

    const sameTenantExperienceIntent = await prisma.merchantIntent.create({
      data: {
        merchantId: merchantA.id,
        merchantSessionId: sessionACampaign.id,
        experienceId: campaignA.id,
        type: 'FAVORITE',
        idempotencyKey: `intent-campaign-${suffix}`,
      },
    })
    assert.equal(sameTenantExperienceIntent.experienceId, campaignA.id)

    await assertRejected('MerchantIntent cross-tenant experience', () =>
      prisma.merchantIntent.create({
        data: {
          merchantId: merchantA.id,
          merchantSessionId: sessionA.id,
          experienceId: storeB.id,
          type: 'FAVORITE',
          idempotencyKey: `intent-cross-exp-${suffix}`,
        },
      }),
    )

    console.log(JSON.stringify({
      ok: true,
      database: 'local-postgresql',
      integrityCheck: counts,
      merchantA: merchantA.id,
      proofs: {
        crossTenantSessionRejected: true,
        crossTenantFrameRejected: true,
        sameTenantWritesSucceeded: true,
        nullableReferencesSucceeded: true,
        consumerTryOnTaskSucceeded: true,
        storeAndCampaignTryOnTaskSucceeded: true,
        experienceTenantFkUnchanged: true,
      },
    }, null, 2))
  } finally {
    await prisma.tryOnTask.deleteMany({
      where: { OR: [{ merchantId: createdIds.merchantA }, { userId: createdIds.user }] },
    })
    await prisma.merchantIntent.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.merchantEvent.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.merchantUsageLedger.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.storeAsset.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.merchantSession.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.merchantFrame.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.experience.deleteMany({ where: { merchantId: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.user.delete({ where: { id: createdIds.user } })
    await prisma.merchant.deleteMany({ where: { id: { in: [createdIds.merchantA, createdIds.merchantB] } } })
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
