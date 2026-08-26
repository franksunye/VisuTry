import {
  OPS_RECLASSIFICATION_SOURCE,
  MerchantReclassificationError,
  reclassifyMerchantWithTransaction,
  validateMerchantReclassificationInput,
} from '@/modules/merchant/application/merchant-reclassification-ops'
import {
  parseReclassifyMerchantArgs,
  validateReclassifyMerchantArgs,
} from '../../../../scripts/ops/reclassify-merchant'

const input = {
  merchantId: 'qa-merchant',
  from: 'POSSIBLE_EXTERNAL' as const,
  to: 'TEST' as const,
  reason: 'Production G1 E2E verification',
}

function transactionFixture(classification = 'POSSIBLE_EXTERNAL') {
  const merchant = {
    findUnique: jest.fn().mockResolvedValue({
      id: input.merchantId,
      classification,
      classificationSource: 'SELF_SERVICE_SIGNUP',
      classificationReason: 'Created through authenticated self-service signup; commercial activation is not yet verified.',
    }),
    update: jest.fn().mockResolvedValue({
      id: input.merchantId,
      classification: 'TEST',
      classificationSource: OPS_RECLASSIFICATION_SOURCE,
      classificationReason: input.reason,
    }),
  }
  async function transactionRunner<T>(callback: (tx: { merchant: typeof merchant }) => Promise<T>): Promise<T> {
    return callback({ merchant })
  }
  const transaction = jest.fn(transactionRunner) as unknown as typeof transactionRunner
  return { merchant, transaction }
}

describe('Merchant reclassification operations', () => {
  it('defaults to dry-run and requires an explicit production acknowledgement for writes', () => {
    const options = parseReclassifyMerchantArgs([
      '--merchant-id=qa-merchant',
      '--from=POSSIBLE_EXTERNAL',
      '--to=TEST',
      '--reason=Production G1 E2E verification',
    ])

    expect(options.execute).toBe(false)
    expect(validateReclassifyMerchantArgs(options)).toEqual(input)
    expect(() => validateReclassifyMerchantArgs({ ...options, execute: true })).toThrow('Production writes require')
  })

  it('validates the explicit, non-empty operation contract', () => {
    expect(validateMerchantReclassificationInput(input)).toEqual(input)
    expect(() => validateMerchantReclassificationInput({ ...input, merchantId: ' ' })).toThrow(MerchantReclassificationError)
    expect(() => validateMerchantReclassificationInput({ ...input, reason: ' ' })).toThrow('reason must be non-empty')
    expect(() => validateMerchantReclassificationInput({ ...input, from: 'TEST' })).toThrow('from and to must be different')
  })

  it('updates only classification provenance fields after an in-transaction expected-state check', async () => {
    const { merchant, transaction } = transactionFixture()
    const result = await reclassifyMerchantWithTransaction(transaction, input)

    expect(result.after).toMatchObject({
      id: input.merchantId,
      classification: 'TEST',
      classificationSource: OPS_RECLASSIFICATION_SOURCE,
      classificationReason: input.reason,
    })
    expect(merchant.update).toHaveBeenCalledWith({
      where: { id: input.merchantId },
      data: {
        classification: 'TEST',
        classificationSource: OPS_RECLASSIFICATION_SOURCE,
        classificationReason: input.reason,
      },
      select: expect.any(Object),
    })
  })

  it('aborts when the merchant is missing or its classification changed', async () => {
    const missing = transactionFixture()
    missing.merchant.findUnique.mockResolvedValue(null)
    await expect(reclassifyMerchantWithTransaction(missing.transaction, input)).rejects.toMatchObject({ code: 'MERCHANT_NOT_FOUND' })
    expect(missing.merchant.update).not.toHaveBeenCalled()

    const mismatch = transactionFixture('TEST')
    await expect(reclassifyMerchantWithTransaction(mismatch.transaction, input)).rejects.toMatchObject({ code: 'CLASSIFICATION_MISMATCH' })
    expect(mismatch.merchant.update).not.toHaveBeenCalled()
  })
})
