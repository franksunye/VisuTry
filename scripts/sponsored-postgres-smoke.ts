import assert from 'node:assert/strict'
import { prisma } from '@/lib/prisma'
import { createPrismaMerchantSponsoredUsageRepository } from '@/modules/store/infrastructure/prisma/merchant-sponsored-usage-repository'
import { checkUserQuota } from '@/lib/quota'

async function main(): Promise<void> {
  const suffix = `${Date.now()}-${process.pid}`
  const merchant = await prisma.merchant.create({
    data: {
      slug: `local-sponsored-${suffix}`,
      name: 'Local Sponsored Validation',
      pilotType: 'INTERNAL',
      referenceData: false,
      sponsoredUsagePolicyKey: 'VISUTRY_OWNED',
    },
    select: { id: true, slug: true },
  })
  const user = await prisma.user.create({
    data: {
      email: `local-sponsored-${suffix}@example.test`,
      freeTrialsUsed: 3,
      creditsPurchased: 1,
      creditsUsed: 0,
    },
  })
  const repository = createPrismaMerchantSponsoredUsageRepository()
  const now = new Date()

  try {
    const first = await repository.reserve({
      merchantId: merchant.id,
      shopperIdentityHash: 'local-anonymous-shopper',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `first-${suffix}`,
      now,
    })
    assert.ok(first, 'first anonymous reservation should succeed')
    assert.equal(await repository.consume(first.id), true)

    const exhausted = await repository.reserve({
      merchantId: merchant.id,
      shopperIdentityHash: 'local-anonymous-shopper',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `second-${suffix}`,
      now: new Date(now.getTime() + 1_000),
    })
    assert.equal(exhausted, null, 'same shopper should be exhausted in rolling window')
    assert.equal(checkUserQuota(user).allowed, true, 'consumer credit should remain available')

    const signedInFallback = await repository.reserve({
      merchantId: merchant.id,
      userId: user.id,
      shopperIdentityHash: 'local-new-visitor-identity',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `signed-in-${suffix}`,
      now: new Date(now.getTime() + 2_000),
    })
    assert.ok(signedInFallback, 'a different identity may reserve independently')
    assert.equal(await repository.release(signedInFallback.id), true)

    const userScopedExhausted = await repository.reserve({
      merchantId: merchant.id,
      userId: user.id,
      shopperIdentityHash: 'local-another-visitor-identity',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `user-scoped-${suffix}`,
      now: new Date(now.getTime() + 3_000),
    })
    assert.ok(userScopedExhausted, 'released reservation should not consume the user scope')
    assert.equal(await repository.consume(userScopedExhausted.id), true)

    const old = new Date(now.getTime() - 25 * 60 * 60 * 1_000)
    const rollingExpired = await repository.reserve({
      merchantId: merchant.id,
      shopperIdentityHash: 'local-rolling-shopper',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `rolling-expired-${suffix}`,
      now: old,
    })
    assert.ok(rollingExpired)
    assert.equal(await repository.consume(rollingExpired.id), true)

    const afterWindow = await repository.reserve({
      merchantId: merchant.id,
      shopperIdentityHash: 'local-rolling-shopper',
      usageType: 'SPONSORED_GENERATION',
      limit: 1,
      rollingWindowHours: 24,
      idempotencyKey: `after-window-${suffix}`,
      now,
    })
    assert.ok(afterWindow, 'expired usage must not block the next rolling window')

    const concurrent = await Promise.all(
      Array.from({ length: 8 }, (_, index) => repository.reserve({
        merchantId: merchant.id,
        shopperIdentityHash: 'local-concurrent-shopper',
        usageType: 'SPONSORED_GENERATION',
        limit: 1,
        rollingWindowHours: 24,
        idempotencyKey: `concurrent-${suffix}-${index}`,
      })),
    )
    assert.equal(
      concurrent.filter(Boolean).length,
      1,
      'advisory lock should allow exactly one concurrent reservation',
    )

    const rows = await prisma.merchantSponsoredUsage.findMany({
      where: { merchantId: merchant.id },
      select: { status: true, userId: true, usageType: true },
    })
    assert.ok(rows.length >= 5)
    assert.ok(rows.every((row) => row.usageType === 'SPONSORED_GENERATION'))
    assert.equal(user.creditsPurchased, 1)
    assert.equal(user.creditsUsed, 0)

    console.log(JSON.stringify({
      ok: true,
      database: 'local-postgresql',
      merchant: merchant.slug,
      rows: rows.length,
      concurrentWinners: concurrent.filter(Boolean).length,
      consumerCreditsMutated: false,
    }, null, 2))
  } finally {
    await prisma.merchantSponsoredUsage.deleteMany({ where: { merchantId: merchant.id } })
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.merchant.delete({ where: { id: merchant.id } })
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
