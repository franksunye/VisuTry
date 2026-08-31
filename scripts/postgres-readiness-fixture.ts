import assert from 'node:assert/strict'
import type { PrismaClient } from '@prisma/client'

export type ReadinessFixtureSummary = {
  users: number
  sessions: number
  merchants: number
  experiences: number
  merchantFrames: number
  tryOnTasks: number
  faceAnalysisTasks: number
  payments: number
  merchantUsageRows: number
  sponsoredUsageRows: number
  generationRequests: number
  generationAttempts: number
}

function timestamp(offsetMs = 0): Date {
  return new Date(Date.now() + offsetMs)
}

/**
 * Creates and verifies synthetic rows for the provider-portability smoke.
 * Everything is committed and deleted inside one transaction, so an existing
 * non-production target is not left with rehearsal data.
 */
export async function runPostgresReadinessFixture(
  client: PrismaClient,
  prefix: string,
  options: { retain?: boolean } = {},
): Promise<ReadinessFixtureSummary> {
  return client.$transaction(async (tx) => {
    const suffix = `${prefix}-${Date.now()}-${process.pid}`
    const user = await tx.user.create({
      data: {
        name: 'DB-P3 synthetic user',
        email: `${suffix}@example.test`,
        username: `p3_${Date.now()}_${process.pid}`,
        freeTrialsUsed: 2,
        creditsPurchased: 12,
        creditsUsed: 3,
        isPremium: true,
        premiumExpiresAt: timestamp(86_400_000),
        currentSubscriptionType: 'PREMIUM_MONTHLY',
      },
      select: { id: true },
    })
    const account = await tx.account.create({
      data: {
        id: `account-${suffix}`,
        userId: user.id,
        type: 'oauth',
        provider: 'fixture-provider',
        providerAccountId: `provider-account-${suffix}`,
        refresh_token: 'synthetic-refresh-token',
        access_token: 'synthetic-access-token',
      },
      select: { id: true },
    })
    const session = await tx.session.create({
      data: {
        id: `session-${suffix}`,
        sessionToken: `synthetic-session-token-${suffix}`,
        userId: user.id,
        expires: timestamp(86_400_000),
      },
      select: { id: true },
    })
    const merchant = await tx.merchant.create({
      data: {
        slug: `p3-${suffix}`,
        name: 'DB-P3 Synthetic Merchant',
        pilotType: 'INTERNAL',
        referenceData: true,
        classification: 'AUTOMATION',
        classificationSource: 'DB_P3_REHEARSAL',
        classificationReason: 'Synthetic provider portability fixture.',
        planCode: 'FOUNDING_PILOT',
        sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
        commercialStage: 'MIGRATION_REHEARSAL',
        entitlementVersion: 'db-p3',
        commercialStatus: 'ACTIVE',
        maxCompareFrames: 3,
      },
      select: { id: true },
    })
    const membership = await tx.merchantMembership.create({
      data: {
        userId: user.id,
        merchantId: merchant.id,
        role: 'OWNER',
      },
      select: { id: true },
    })
    const billingAccount = await tx.merchantBillingAccount.create({
      data: {
        merchantId: merchant.id,
        provider: 'FIXTURE',
        stripeCustomerId: `fixture-customer-${suffix}`,
        subscriptionStatus: 'active',
        cancelAtPeriodEnd: false,
        lastEventId: `fixture-event-${suffix}`,
      },
      select: { id: true },
    })
    const billingEvent = await tx.merchantBillingEvent.create({
      data: {
        provider: 'FIXTURE',
        providerEventId: `fixture-provider-event-${suffix}`,
        merchantId: merchant.id,
        billingAccountId: billingAccount.id,
        eventType: 'subscription.created',
        planCode: 'FOUNDING_PILOT',
        status: 'PROCESSED',
        eventCreatedAt: Math.floor(Date.now() / 1_000),
      },
      select: { id: true },
    })
    const credential = await tx.merchantAgentCredential.create({
      data: {
        merchantId: merchant.id,
        name: 'DB-P3 synthetic credential',
        keyPrefix: `p3_${suffix}`,
        secretHash: 'synthetic-secret-hash',
        scopes: ['merchant:read'],
        status: 'ACTIVE',
        createdByUserId: user.id,
      },
      select: { id: true },
    })
    const audit = await tx.merchantOperationAudit.create({
      data: {
        merchantId: merchant.id,
        actorType: 'USER',
        actorId: user.id,
        action: 'DB_P3_REHEARSAL',
        resourceType: 'Merchant',
        resourceId: merchant.id,
        result: 'PASS',
      },
      select: { id: true },
    })
    const merchantFrame = await tx.merchantFrame.create({
      data: {
        merchantId: merchant.id,
        sku: `frame-${suffix}`,
        name: 'DB-P3 Synthetic Frame',
        brand: 'Fixture Brand',
        price: 1999,
        currency: 'usd',
        shape: 'round',
        styleTags: ['fixture', 'portable'],
        collectionTags: ['db-p3'],
        source: 'MANUAL',
        externalId: `external-${suffix}`,
        enrichmentStatus: 'APPROVED',
        status: 'ACTIVE',
      },
      select: { id: true },
    })
    const store = await tx.experience.create({
      data: {
        merchantId: merchant.id,
        type: 'STORE',
        slug: `store-${suffix}`,
        name: 'DB-P3 Synthetic Store',
        status: 'ACTIVE',
        presentationMode: 'PRODUCT_FIRST',
        referenceData: true,
        referenceMetadata: { rehearsal: 'db-p3' },
      },
      select: { id: true },
    })
    const campaign = await tx.experience.create({
      data: {
        merchantId: merchant.id,
        type: 'CAMPAIGN',
        slug: `campaign-${suffix}`,
        name: 'DB-P3 Synthetic Campaign',
        status: 'ACTIVE',
        campaignObjective: 'LEAD',
        campaignGate: 'OPT_IN_AFTER_VALUE',
        presentationMode: 'ACTION_FIRST',
        referenceData: true,
      },
      select: { id: true },
    })
    const experienceFrame = await tx.experienceFrame.create({
      data: {
        experienceId: store.id,
        merchantId: merchant.id,
        merchantFrameId: merchantFrame.id,
        sortOrder: 1,
        active: true,
      },
      select: { experienceId: true, merchantFrameId: true },
    })
    const merchantSession = await tx.merchantSession.create({
      data: {
        merchantId: merchant.id,
        experienceId: store.id,
        anonymousVisitorId: `visitor-${suffix}`,
        capabilityTokenHash: `hash-${suffix}`,
        status: 'ACTIVE',
        referenceData: true,
        lastActiveAt: timestamp(),
        expiresAt: timestamp(86_400_000),
        source: 'db-p3',
        campaign: `campaign-${suffix}`,
        acquisitionSurface: 'provider-portability',
        billableAICommerceSession: true,
        billableAICommerceSessionAt: timestamp(),
      },
      select: { id: true },
    })
    const storeAsset = await tx.storeAsset.create({
      data: {
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        ownerType: 'MERCHANT_SESSION',
        ownerId: merchantSession.id,
        purpose: 'SHOPPER_PHOTO',
        storageKey: `db-p3/${suffix}/photo.jpg`,
        accessMode: 'PRIVATE_SIGNED',
        providerUrl: 'https://assets.example.test/db-p3/photo.jpg',
        expiresAt: timestamp(86_400_000),
      },
      select: { id: true },
    })
    const consumerTask = await tx.tryOnTask.create({
      data: {
        userId: user.id,
        type: 'GLASSES',
        userImageUrl: 'https://assets.example.test/db-p3/user.jpg',
        itemImageUrl: 'https://assets.example.test/db-p3/item.jpg',
        glassesImageUrl: 'https://assets.example.test/db-p3/item.jpg',
        status: 'COMPLETED',
        resultImageUrl: 'https://assets.example.test/db-p3/result.jpg',
        quotaSettledAt: timestamp(),
        quotaSource: 'credit',
        origin: 'CONSUMER',
        idempotencyKey: `consumer-idempotency-${suffix}`,
        clientSubmissionId: `consumer-client-${suffix}`,
        metadata: { rehearsal: 'db-p3', provider: 'portable-postgresql' },
        dispatchVersion: 0,
        resultPersistVersion: 0,
        expiresAt: timestamp(86_400_000),
      },
      select: { id: true },
    })
    const storeTask = await tx.tryOnTask.create({
      data: {
        type: 'GLASSES',
        userImageUrl: 'https://assets.example.test/db-p3/store-user.jpg',
        itemImageUrl: 'https://assets.example.test/db-p3/store-item.jpg',
        status: 'PENDING',
        origin: 'STORE_PILOT',
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        merchantFrameId: merchantFrame.id,
        idempotencyKey: `store-idempotency-${suffix}`,
        clientSubmissionId: `store-client-${suffix}`,
        batchId: `batch-${suffix}`,
        metadata: { campaignId: campaign.id, assetId: storeAsset.id },
        dispatchVersion: 0,
        resultPersistVersion: 0,
      },
      select: { id: true },
    })
    const faceAnalysisTask = await tx.faceAnalysisTask.create({
      data: {
        userId: user.id,
        userImageUrl: 'https://assets.example.test/db-p3/face.jpg',
        status: 'COMPLETED',
        detectedShape: 'oval',
        confidence: 0.97,
        basicResult: { shape: 'oval' },
        fullResult: { shape: 'oval', confidence: 0.97 },
        reportUnlocked: true,
        metadata: { rehearsal: true },
        expiresAt: timestamp(86_400_000),
      },
      select: { id: true },
    })
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        stripeSessionId: `fixture-session-${suffix}`,
        stripePaymentId: `fixture-payment-${suffix}`,
        amount: 2999,
        currency: 'usd',
        status: 'COMPLETED',
        productType: 'CREDITS_PACK',
        description: 'DB-P3 synthetic payment',
        attribution: { source: 'db-p3' },
        unlockTaskId: consumerTask.id,
        statusReason: 'rehearsal',
        completedAt: timestamp(),
        creditsRevoked: 2,
      },
      select: { id: true },
    })
    const usageRender = await tx.merchantUsageLedger.create({
      data: {
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        tryOnTaskId: storeTask.id,
        kind: 'RENDER_SUCCESS',
        dedupeKey: `render-${suffix}`,
      },
      select: { id: true },
    })
    const usageSession = await tx.merchantUsageLedger.create({
      data: {
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        kind: 'AI_COMMERCE_SESSION',
        dedupeKey: `session-${suffix}`,
      },
      select: { id: true },
    })
    const sponsoredUsage = await tx.merchantSponsoredUsage.create({
      data: {
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        experienceId: store.id,
        userId: user.id,
        shopperIdentityHash: `shopper-hash-${suffix}`,
        usageType: 'SPONSORED_GENERATION',
        status: 'CONSUMED',
        idempotencyKey: `sponsored-${suffix}`,
        reservedAt: timestamp(-1_000),
        consumedAt: timestamp(),
      },
      select: { id: true },
    })
    const generationRequest = await tx.generationRequest.create({
      data: {
        tryOnTaskId: consumerTask.id,
        origin: 'CONSUMER',
        userId: user.id,
        merchantId: merchant.id,
        storeId: store.id,
        campaignId: campaign.id,
        clientSubmissionId: `generation-${suffix}`,
        generationType: 'GLASSES_TRY_ON',
        requestedModel: 'fixture-model',
        requestedProvider: 'fixture-provider',
        finalStatus: 'COMPLETED',
        startedAt: timestamp(-2_000),
        completedAt: timestamp(),
        endToEndDurationMs: 1_250,
        attemptCount: 1,
        isTest: true,
        environment: 'test',
      },
      select: { id: true },
    })
    const generationAttempt = await tx.generationAttempt.create({
      data: {
        requestId: generationRequest.id,
        attemptNumber: 1,
        provider: 'fixture-provider',
        model: 'fixture-model',
        providerTaskId: `provider-task-${suffix}`,
        submittedAt: timestamp(-1_500),
        completedAt: timestamp(),
        submitDurationMs: 100,
        attemptDurationMs: 1_100,
        providerDurationMs: 1_000,
        status: 'COMPLETED',
        isTimeout: false,
      },
      select: { id: true },
    })
    const intent = await tx.merchantIntent.create({
      data: {
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        experienceId: store.id,
        merchantFrameId: merchantFrame.id,
        type: 'PRODUCT_CLICK',
        idempotencyKey: `intent-${suffix}`,
        email: `${suffix}@example.test`,
        name: 'DB-P3 Synthetic Shopper',
        note: 'Synthetic migration rehearsal intent.',
      },
      select: { id: true },
    })
    const event = await tx.merchantEvent.create({
      data: {
        eventId: `event-${suffix}`,
        type: 'TRY_ON_COMPLETED',
        merchantId: merchant.id,
        merchantSessionId: merchantSession.id,
        experienceId: store.id,
        merchantFrameId: merchantFrame.id,
        tryOnTaskId: storeTask.id,
        source: 'SERVER',
        locale: 'en-US',
        deviceType: 'test',
        referenceData: true,
        metadata: { rehearsal: 'db-p3' },
      },
      select: { id: true },
    })
    const abuseCounter = await tx.storeAbuseCounter.create({
      data: {
        merchantId: merchant.id,
        bucket: `db-p3:${suffix}`,
        windowStart: timestamp(-60_000),
        count: 2,
        bytes: BigInt(128),
      },
      select: { id: true },
    })
    const orphanBlob = await tx.storeOrphanBlob.create({
      data: {
        url: `https://assets.example.test/db-p3/orphan-${suffix}.jpg`,
        pathname: `db-p3/orphan-${suffix}.jpg`,
        merchantId: merchant.id,
        failCount: 0,
      },
      select: { id: true },
    })

    const claimed = await tx.tryOnTask.updateMany({
      where: { id: storeTask.id, dispatchVersion: 0 },
      data: { dispatchLeaseOwner: `fixture-${suffix}`, dispatchLeaseUntil: timestamp(30_000), dispatchVersion: 1 },
    })
    assert.equal(claimed.count, 1, 'fenced lease claim must update exactly one row')
    const staleClaim = await tx.tryOnTask.updateMany({
      where: { id: storeTask.id, dispatchVersion: 0 },
      data: { dispatchLeaseOwner: 'stale-fixture', dispatchVersion: 2 },
    })
    assert.equal(staleClaim.count, 0, 'stale fenced lease must not overwrite a newer claim')

    const persisted = await tx.generationRequest.findUnique({
      where: { id: generationRequest.id },
      include: { attempts: true },
    })
    assert.equal(persisted?.attempts.length, 1, 'generation request must retain its attempt relation')
    assert.equal(
      (await tx.merchantUsageLedger.count({ where: { merchantId: merchant.id } })),
      2,
      'merchant usage ledger rows must persist independently of consumer credits',
    )
    assert.equal(
      await tx.experience.count({ where: { merchantId: merchant.id, type: 'STORE', status: 'ACTIVE' } }),
      1,
      'one-active-store invariant must hold',
    )
    const loadedUser = await tx.user.findUnique({ where: { id: user.id }, select: { creditsPurchased: true, creditsUsed: true } })
    assert.deepEqual(loadedUser, { creditsPurchased: 12, creditsUsed: 3 })

    if (!options.retain) {
      // Delete in dependency order before committing the transaction. This
      // also proves that all fixture rows are owned by the transaction and
      // leaves no synthetic data in an existing non-production provider.
      await tx.generationAttempt.delete({ where: { id: generationAttempt.id } })
      await tx.generationRequest.delete({ where: { id: generationRequest.id } })
      await tx.merchantSponsoredUsage.delete({ where: { id: sponsoredUsage.id } })
      await tx.merchantUsageLedger.delete({ where: { id: usageRender.id } })
      await tx.merchantUsageLedger.delete({ where: { id: usageSession.id } })
      await tx.payment.delete({ where: { id: payment.id } })
      await tx.faceAnalysisTask.delete({ where: { id: faceAnalysisTask.id } })
      await tx.merchantEvent.delete({ where: { id: event.id } })
      await tx.merchantIntent.delete({ where: { id: intent.id } })
      await tx.storeAsset.delete({ where: { id: storeAsset.id } })
      await tx.tryOnTask.delete({ where: { id: storeTask.id } })
      await tx.tryOnTask.delete({ where: { id: consumerTask.id } })
      await tx.merchantSession.delete({ where: { id: merchantSession.id } })
      await tx.experienceFrame.delete({ where: { experienceId_merchantFrameId: { experienceId: experienceFrame.experienceId, merchantFrameId: experienceFrame.merchantFrameId } } })
      await tx.experience.delete({ where: { id: campaign.id } })
      await tx.experience.delete({ where: { id: store.id } })
      await tx.merchantFrame.delete({ where: { id: merchantFrame.id } })
      await tx.storeAbuseCounter.delete({ where: { id: abuseCounter.id } })
      await tx.storeOrphanBlob.delete({ where: { id: orphanBlob.id } })
      await tx.merchantOperationAudit.delete({ where: { id: audit.id } })
      await tx.merchantAgentCredential.delete({ where: { id: credential.id } })
      await tx.merchantBillingEvent.delete({ where: { id: billingEvent.id } })
      await tx.merchantBillingAccount.delete({ where: { id: billingAccount.id } })
      await tx.merchantMembership.delete({ where: { id: membership.id } })
      await tx.account.delete({ where: { id: account.id } })
      await tx.session.delete({ where: { id: session.id } })
      await tx.merchant.delete({ where: { id: merchant.id } })
      await tx.user.delete({ where: { id: user.id } })
    }

    return {
      users: 1,
      sessions: 1,
      merchants: 1,
      experiences: 2,
      merchantFrames: 1,
      tryOnTasks: 2,
      faceAnalysisTasks: 1,
      payments: 1,
      merchantUsageRows: 2,
      sponsoredUsageRows: 1,
      generationRequests: 1,
      generationAttempts: 1,
    }
  })
}
