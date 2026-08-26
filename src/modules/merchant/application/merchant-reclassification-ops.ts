import {
  isMerchantClassification,
  type MerchantClassification,
} from '../domain/merchant-classification'

export const OPS_RECLASSIFICATION_SOURCE = 'OPS_RECLASSIFICATION'

export type MerchantReclassificationInput = {
  merchantId: string
  from: MerchantClassification
  to: MerchantClassification
  reason: string
}

export type MerchantReclassificationSnapshot = {
  id: string
  classification: string
  classificationSource: string | null
  classificationReason: string | null
}

type MerchantReclassificationTransaction = {
  merchant: {
    findUnique(args: {
      where: { id: string }
      select: {
        id: true
        classification: true
        classificationSource: true
        classificationReason: true
      }
    }): Promise<MerchantReclassificationSnapshot | null>
    update(args: {
      where: { id: string }
      data: {
        classification: MerchantClassification
        classificationSource: string
        classificationReason: string
      }
      select: {
        id: true
        classification: true
        classificationSource: true
        classificationReason: true
      }
    }): Promise<MerchantReclassificationSnapshot>
  }
}

export class MerchantReclassificationError extends Error {
  constructor(
    public readonly code: 'INVALID_INPUT' | 'MERCHANT_NOT_FOUND' | 'CLASSIFICATION_MISMATCH',
    message: string,
  ) {
    super(message)
    this.name = 'MerchantReclassificationError'
  }
}

export function validateMerchantReclassificationInput(input: Partial<MerchantReclassificationInput>): MerchantReclassificationInput {
  if (!input.merchantId?.trim() || !isMerchantClassification(input.from) || !isMerchantClassification(input.to)) {
    throw new MerchantReclassificationError(
      'INVALID_INPUT',
      'merchantId, from, and to are required and must use canonical Merchant classifications.',
    )
  }

  const reason = input.reason?.trim() ?? ''
  if (!reason) {
    throw new MerchantReclassificationError('INVALID_INPUT', 'reason must be non-empty.')
  }
  if (reason.length > 500) {
    throw new MerchantReclassificationError('INVALID_INPUT', 'reason must be 500 characters or fewer.')
  }
  if (input.from === input.to) {
    throw new MerchantReclassificationError('INVALID_INPUT', 'from and to must be different classifications.')
  }

  return {
    merchantId: input.merchantId.trim(),
    from: input.from,
    to: input.to,
    reason,
  }
}

export async function reclassifyMerchantWithTransaction(
  transaction: <T>(callback: (tx: MerchantReclassificationTransaction) => Promise<T>) => Promise<T>,
  rawInput: Partial<MerchantReclassificationInput>,
) {
  const input = validateMerchantReclassificationInput(rawInput)

  return transaction(async (tx) => {
    const before = await tx.merchant.findUnique({
      where: { id: input.merchantId },
      select: {
        id: true,
        classification: true,
        classificationSource: true,
        classificationReason: true,
      },
    })

    if (!before) {
      throw new MerchantReclassificationError('MERCHANT_NOT_FOUND', `Merchant not found: ${input.merchantId}`)
    }
    if (before.classification !== input.from) {
      throw new MerchantReclassificationError(
        'CLASSIFICATION_MISMATCH',
        `Expected ${input.merchantId} to be ${input.from}, found ${before.classification}.`,
      )
    }

    const after = await tx.merchant.update({
      where: { id: input.merchantId },
      data: {
        classification: input.to,
        classificationSource: OPS_RECLASSIFICATION_SOURCE,
        classificationReason: input.reason,
      },
      select: {
        id: true,
        classification: true,
        classificationSource: true,
        classificationReason: true,
      },
    })

    return { before, after }
  })
}
