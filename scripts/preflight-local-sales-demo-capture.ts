import { assertLocalSalesDemoCaptureEnvironment } from './lib/local-sales-demo-capture-contract'

try {
  if (process.argv.length > 2) throw new Error('This capture command does not accept provider or other mode flags.')
  assertLocalSalesDemoCaptureEnvironment(process.env)
  console.log('LOCAL SALES DEMO CAPTURE PREFLIGHT: PASS')
  console.log('APP_ENV=local PrismaPg=LOCAL Stripe=TEST Providers=BLOCKED')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
