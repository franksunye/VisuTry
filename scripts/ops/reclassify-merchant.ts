import 'dotenv/config'
import { reclassifyMerchantWithTransaction, validateMerchantReclassificationInput } from '../../src/modules/merchant/application/merchant-reclassification-ops'
import { isMerchantClassification } from '../../src/modules/merchant/domain/merchant-classification'

const PRODUCTION_CONFIRMATION = 'I_UNDERSTAND_PRODUCTION_WRITE'

export type ReclassifyMerchantCliOptions = {
  merchantId?: string
  from?: string
  to?: string
  reason?: string
  execute: boolean
  productionConfirm?: string
}

const VALUE_FLAGS = new Set(['--merchant-id', '--from', '--to', '--reason', '--production-confirm'])
const BOOLEAN_FLAGS = new Set(['--execute'])

function usage() {
  return [
    'Usage:',
    '  npx tsx scripts/ops/reclassify-merchant.ts --merchant-id=<id> --from=<classification> --to=<classification> --reason="<reason>"',
    '',
    'Default mode is dry-run. To write, also pass:',
    `  --execute --production-confirm=${PRODUCTION_CONFIRMATION}`,
  ].join('\n')
}

function readFlag(argv: string[], flag: string): string | undefined {
  const inline = argv.find((argument) => argument.startsWith(`${flag}=`))
  if (inline) return inline.slice(flag.length + 1)

  const index = argv.indexOf(flag)
  if (index < 0) return undefined
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`)
  return value
}

export function parseReclassifyMerchantArgs(argv: string[]): ReclassifyMerchantCliOptions {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`)
    const flag = argument.includes('=') ? argument.slice(0, argument.indexOf('=')) : argument
    if (!VALUE_FLAGS.has(flag) && !BOOLEAN_FLAGS.has(flag)) throw new Error(`Unknown option: ${flag}`)
    if (VALUE_FLAGS.has(flag) && !argument.includes('=')) index += 1
  }

  return {
    merchantId: readFlag(argv, '--merchant-id'),
    from: readFlag(argv, '--from'),
    to: readFlag(argv, '--to'),
    reason: readFlag(argv, '--reason'),
    execute: argv.includes('--execute'),
    productionConfirm: readFlag(argv, '--production-confirm'),
  }
}

export function validateReclassifyMerchantArgs(options: ReclassifyMerchantCliOptions) {
  const from = options.from
  const to = options.to
  if (!options.merchantId || !from || !to || options.reason === undefined) {
    throw new Error(`merchant-id, from, to, and reason are required.\n\n${usage()}`)
  }
  if (!isMerchantClassification(from) || !isMerchantClassification(to)) {
    throw new Error('from and to must be canonical Merchant classifications.')
  }
  if (options.execute && options.productionConfirm !== PRODUCTION_CONFIRMATION) {
    throw new Error(`Production writes require --production-confirm=${PRODUCTION_CONFIRMATION}.`)
  }

  return validateMerchantReclassificationInput({
    merchantId: options.merchantId,
    from,
    to,
    reason: options.reason,
  })
}

async function main() {
  const options = parseReclassifyMerchantArgs(process.argv.slice(2))
  const input = validateReclassifyMerchantArgs(options)
  const { prisma } = await import('../../src/lib/prisma')

  if (!options.execute) {
    const before = await prisma.merchant.findUnique({
      where: { id: input.merchantId },
      select: {
        id: true,
        classification: true,
        classificationSource: true,
        classificationReason: true,
      },
    })
    if (!before) throw new Error(`Merchant not found: ${input.merchantId}`)
    if (before.classification !== input.from) {
      throw new Error(`Expected ${input.merchantId} to be ${input.from}, found ${before.classification}.`)
    }

    console.log(JSON.stringify({
      command: 'reclassify-merchant',
      mode: 'DRY_RUN',
      changes: {
        merchantId: input.merchantId,
        from: before.classification,
        to: input.to,
        classificationSource: 'OPS_RECLASSIFICATION',
        classificationReason: input.reason,
      },
      message: 'No changes written. Re-run with --execute and the explicit production confirmation to apply.',
    }, null, 2))
    return
  }

  const result = await reclassifyMerchantWithTransaction((callback) => prisma.$transaction(callback), input)
  console.log(JSON.stringify({
    command: 'reclassify-merchant',
    mode: 'EXECUTE',
    before: result.before,
    after: result.after,
  }, null, 2))
}

if (process.argv[1]?.endsWith('reclassify-merchant.ts')) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
    .finally(async () => {
      const { prisma } = await import('../../src/lib/prisma').catch(() => ({ prisma: null }))
      await prisma?.$disconnect()
    })
}
