#!/usr/bin/env tsx

import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'
import { formatGenerationReliabilityReport } from '@/lib/generation/reliability-report'

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main() {
  const report = await queryGenerationReliabilityReport({
    period: readArg('--period') ?? '7d',
    from: readArg('--from'),
    to: readArg('--to'),
    includeTest: process.argv.includes('--include-test'),
    environment: readArg('--environment'),
  })
  process.stdout.write(`${formatGenerationReliabilityReport(report)}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
