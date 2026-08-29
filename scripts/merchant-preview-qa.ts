import 'dotenv/config'
import { validatePreviewQaEnvironment } from '../src/modules/merchant/application/merchant-preview-qa-guard'

const USAGE = 'usage-threshold'

function valueFlag(argv: string[], name: string): string | undefined {
  const inline = argv.find((argument) => argument.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = argv.indexOf(name)
  if (index < 0) return undefined
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`)
  return value
}

function environmentLabel(): string {
  return `VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unknown'}; APP_ENV=${process.env.APP_ENV ?? 'unknown'}; DATABASE_IDENTITY=${process.env.VISUTRY_DATABASE_IDENTITY ?? 'unset'}; STRIPE_MERCHANT_BILLING_MODE=${process.env.STRIPE_MERCHANT_BILLING_MODE ?? 'unknown'}; VISUTRY_PREVIEW_QA=${process.env.VISUTRY_PREVIEW_QA ?? 'unset'}`
}

function printResult(value: Record<string, unknown>): void {
  console.log(JSON.stringify(value, null, 2))
}

function printFailure(command: string, error: unknown, merchant: string | undefined): never {
  printResult({
    command,
    environment: environmentLabel(),
    merchantId: merchant ?? null,
    classification: 'UNKNOWN',
    beforeState: null,
    fixture: command,
    afterState: null,
    result: 'FAIL',
    error: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
  throw error
}

function help(): void {
  console.log([
    'Preview-only G4-C QA harness',
    '',
    'Every mutating command requires:',
    '  VERCEL_ENV=preview APP_ENV=preview VISUTRY_PREVIEW_QA=1 STRIPE_MERCHANT_BILLING_MODE=test',
    '  STRIPE_SECRET_KEY=sk_test_...',
    '',
    'Commands:',
    '  npx tsx scripts/merchant-preview-qa.ts ensure [--user-id=<id>]',
    '  npx tsx scripts/merchant-preview-qa.ts snapshot --merchant=QA-FREE',
    '  npx tsx scripts/merchant-preview-qa.ts usage-threshold --merchant=QA-USAGE --percent=69|70|90|100',
    '  npx tsx scripts/merchant-preview-qa.ts pilot-expire --merchant=QA-PILOT',
    '  npx tsx scripts/merchant-preview-qa.ts subscription-boundary --merchant=QA-SUBSCRIPTION --mode=near-expiry|expired',
    '  npx tsx scripts/merchant-preview-qa.ts replay-event --merchant=QA-SUBSCRIPTION --event-id=evt_... [--repeat=1|2]',
    '  npx tsx scripts/merchant-preview-qa.ts replay-event-concurrent --merchant=QA-SUBSCRIPTION --event-id=evt_... [--repeat=5|10]',
    '',
    'Run from Vercel Preview context, for example:',
    '  vercel env run -e preview --git-branch codex/g4c-commercial-launch -- npx tsx scripts/merchant-preview-qa.ts snapshot --merchant=QA-FREE',
    '',
    'The replay-event command retrieves a Stripe TEST event and invokes the same',
    'processMerchantStripeEvent implementation used by the Preview webhook route.',
  ].join('\n'))
}

async function main(): Promise<void> {
  const [command = 'help', ...argv] = process.argv.slice(2)
  if (command === 'help' || command === '--help' || command === '-h') {
    help()
    return
  }

  const merchant = valueFlag(argv, '--merchant')
  try {
    validatePreviewQaEnvironment()
    const {
      ensurePreviewQaMerchants,
      expirePreviewPilot,
      preparePreviewSubscriptionBoundary,
      replayPreviewStripeEvent,
      setPreviewUsageThreshold,
      snapshotPreviewQaMerchant,
    } = await import('../src/modules/merchant/application/merchant-preview-qa')
    if (command === 'ensure') {
      const result = await ensurePreviewQaMerchants({ userId: valueFlag(argv, '--user-id') ?? process.env.VISUTRY_PREVIEW_QA_USER_ID })
      for (const item of result) {
        const afterState = await snapshotPreviewQaMerchant(item.alias)
        printResult({
          command,
          environment: environmentLabel(),
          merchantId: item.row.id,
          classification: item.row.classification,
          beforeState: 'created or reused without changing existing commercial/billing state',
          fixture: `ensure ${item.alias}`,
          afterState,
          result: 'PASS',
        })
      }
      return
    }
    if (command === 'snapshot') {
      const afterState = await snapshotPreviewQaMerchant(merchant)
      printResult({ command, environment: environmentLabel(), merchantId: afterState.merchantId, classification: afterState.classification, beforeState: null, fixture: 'read-only snapshot', afterState, result: 'PASS' })
      return
    }
    if (command === USAGE) {
      const result = await setPreviewUsageThreshold({ merchant, percentage: Number(valueFlag(argv, '--percent')) })
      printResult({ command, environment: environmentLabel(), merchantId: result.merchantId, classification: result.classification, beforeState: result.before, fixture: `set canonical AI Commerce Session usage to ${result.percentage}% (${result.desired} rows; append-only)`, afterState: result.after, result: result.pass ? 'PASS' : 'FAIL' })
      if (!result.pass) process.exitCode = 1
      return
    }
    if (command === 'pilot-expire') {
      const result = await expirePreviewPilot({ merchant })
      printResult({ command, environment: environmentLabel(), merchantId: result.merchantId, classification: result.classification, beforeState: result.before, fixture: 'expire Preview Pilot period only after verified Stripe TEST Pilot activation; receipt ledger unchanged', afterState: result.after, pilotRevenueBeforeCents: result.revenueBeforeCents, pilotRevenueAfterCents: result.revenueAfterCents, result: result.pass ? 'PASS' : 'FAIL' })
      if (!result.pass) process.exitCode = 1
      return
    }
    if (command === 'subscription-boundary') {
      const mode = valueFlag(argv, '--mode') ?? 'expired'
      if (mode !== 'near-expiry' && mode !== 'expired') throw new Error('--mode must be near-expiry or expired.')
      const result = await preparePreviewSubscriptionBoundary({ merchant, mode })
      printResult({ command, environment: environmentLabel(), merchantId: result.merchantId, classification: result.classification, beforeState: result.before, fixture: `prepare ${mode} period boundary after verified Stripe TEST subscription activation; no activation fabricated`, afterState: result.after, result: result.pass ? 'PASS' : 'FAIL' })
      if (!result.pass) process.exitCode = 1
      return
    }
    if (command === 'replay-event' || command === 'replay-event-concurrent') {
      const eventId = valueFlag(argv, '--event-id')
      if (!eventId) throw new Error('--event-id is required.')
      const repeat = Number(valueFlag(argv, '--repeat') ?? (command === 'replay-event-concurrent' ? '10' : '2'))
      const concurrent = command === 'replay-event-concurrent'
      const result = await replayPreviewStripeEvent({ merchant, eventId, repeat, concurrent })
      printResult({ command, environment: environmentLabel(), merchantId: result.merchantId, classification: result.classification, beforeState: result.before, fixture: `retrieve Stripe TEST event ${result.eventId} (${result.eventType}) and ${concurrent ? 'concurrently ' : ''}deliver through canonical webhook processor ${repeat} time(s)`, afterState: result.after, deliveries: result.results, result: result.pass ? 'PASS' : 'FAIL' })
      if (!result.pass) process.exitCode = 1
      return
    }
    throw new Error(`Unknown command: ${command}. Run with help.`)
  } catch (error) {
    printFailure(command, error, merchant)
  }
}

main().catch(() => {
  // The structured failure is already printed above.
})
