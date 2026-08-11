import { resolve } from 'node:path'
import {
  buildPilotPreflightReport,
  readPilotPackage,
} from '../src/modules/store/application/pilot-delivery-kit'

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

async function main() {
  const packageDir = resolve(packageArgument())
  try {
    const report = buildPilotPreflightReport(await readPilotPackage(packageDir))
    console.log(JSON.stringify({ command: 'pilot:preflight', packageDir, ...report }, null, 2))
    if (report.errors.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(JSON.stringify({
      command: 'pilot:preflight',
      packageDir,
      summary: null,
      warnings: [],
      errors: [error instanceof Error ? error.message : String(error)],
    }, null, 2))
    process.exitCode = 1
  }
}

main()
