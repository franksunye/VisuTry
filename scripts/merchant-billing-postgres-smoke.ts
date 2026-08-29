import assert from 'node:assert/strict'
import type Stripe from 'stripe'
import { processMerchantStripeEvent } from '@/modules/merchant/application/merchant-billing'
import { localPostgresPrisma } from './lib/local-postgres-prisma'

const CONCURRENT_DELIVERIES = 50

function subscriptionEvent(input: { id: string; merchantId: string; customerId: string; subscriptionId: string; created: number }): Stripe.Event {
  return {
    id: input.id,
    object: 'event',
    api_version: '2026-08-01',
    created: input.created,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: input.subscriptionId,
        object: 'subscription',
        customer: input.customerId,
        metadata: {
          billingPurpose: 'MERCHANT_PLAN',
          merchantId: input.merchantId,
          requestedPlanCode: 'LAUNCH',
          stripePriceId: 'price_local_launch',
        },
        items: { data: [{ id: 'si_local', price: { id: 'price_local_launch' } }] },
        status: 'active',
        cancel_at_period_end: false,
        current_period_start: input.created,
        current_period_end: input.created + 30 * 24 * 60 * 60,
      },
    },
  } as unknown as Stripe.Event
}

async function main(): Promise<void> {
  if (process.env.APP_ENV !== 'local' || process.env.VERCEL_ENV === 'production') {
    throw new Error('Merchant Billing PostgreSQL smoke requires APP_ENV=local and refuses Production.')
  }
  const suffix = `${Date.now()}-${process.pid}`
  const merchant = await localPostgresPrisma.merchant.create({
    data: {
      slug: `local-billing-${suffix}`,
      name: 'Local Billing Concurrency Validation',
      classification: 'TEST',
      classificationSource: 'LOCAL_QA_STRESS',
      classificationReason: 'Disposable local PostgreSQL billing concurrency fixture.',
    },
    select: { id: true },
  })
  const account = await localPostgresPrisma.merchantBillingAccount.create({
    data: {
      merchantId: merchant.id,
      provider: 'STRIPE',
      stripeCustomerId: `cus_local_${suffix}`,
    },
    select: { id: true },
  })

  try {
    const created = 1_750_000_000
    const events = Array.from({ length: CONCURRENT_DELIVERIES }, (_, index) => subscriptionEvent({
      id: `evt_local_${suffix}_${String(index).padStart(3, '0')}`,
      merchantId: merchant.id,
      customerId: `cus_local_${suffix}`,
      subscriptionId: `sub_local_${suffix}`,
      created,
    }))
    const settled = await Promise.allSettled(events.map((event) => processMerchantStripeEvent(event, localPostgresPrisma)))
    const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    assert.equal(failures.length, 0, failures.map((failure) => String(failure.reason)).join('\n'))
    assert.equal(settled.filter((result) => result.status === 'fulfilled').length, CONCURRENT_DELIVERIES)

    const ledger = await localPostgresPrisma.merchantBillingEvent.findMany({
      where: { billingAccountId: account.id },
      select: { status: true, processingReason: true, providerEventId: true },
    })
    assert.equal(ledger.length, CONCURRENT_DELIVERIES)
    assert.ok(ledger.every((row) => row.status === 'PROCESSED' || (row.status === 'IGNORED' && row.processingReason === 'OUT_OF_ORDER')))
    assert.ok(ledger.every((row) => row.status !== 'REJECTED'))

    const [finalAccount, finalMerchant] = await Promise.all([
      localPostgresPrisma.merchantBillingAccount.findUnique({ where: { id: account.id }, select: { subscriptionStatus: true, lastEventId: true } }),
      localPostgresPrisma.merchant.findUnique({ where: { id: merchant.id }, select: { planCode: true, commercialStatus: true } }),
    ])
    assert.equal(finalAccount?.subscriptionStatus, 'active')
    assert.equal(finalAccount?.lastEventId, events.at(-1)?.id)
    assert.equal(finalMerchant?.planCode, 'LAUNCH')
    assert.equal(finalMerchant?.commercialStatus, 'PAID_ACTIVE')

    console.log(JSON.stringify({
      ok: true,
      database: 'local-postgresql',
      deliveries: CONCURRENT_DELIVERIES,
      rejected: ledger.filter((row) => row.status === 'REJECTED').length,
      outOfOrder: ledger.filter((row) => row.status === 'IGNORED').length,
      finalEventId: finalAccount?.lastEventId,
      canonicalPlan: finalMerchant?.planCode,
      canonicalStatus: finalMerchant?.commercialStatus,
    }, null, 2))
  } finally {
    await localPostgresPrisma.merchantBillingEvent.deleteMany({ where: { billingAccountId: account.id } })
    await localPostgresPrisma.merchantBillingAccount.delete({ where: { id: account.id } })
    await localPostgresPrisma.merchant.delete({ where: { id: merchant.id } })
    await localPostgresPrisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
