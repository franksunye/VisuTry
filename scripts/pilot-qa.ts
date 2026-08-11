import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

function baseUrlArgument(): string | undefined {
  return process.argv.find((argument) => argument.startsWith('--base-url='))
}

function run(label: string, args: string[], extraArgs: string[] = []) {
  const result = spawnSync('npx', ['tsx', ...args, ...extraArgs], { stdio: 'inherit', env: process.env })
  return { label, status: result.status ?? 1 }
}

function main() {
  const packageDir = resolve(packageArgument())
  const production = process.argv.includes('--production')
  const results = [
    run('preflight', ['scripts/pilot-preflight.ts', packageDir]),
    run('url-health', ['scripts/pilot-check-urls.ts', packageDir]),
    run('shared-pilot-tests', ['node_modules/jest/bin/jest.js', 'tests/unit/modules/store/pilot-delivery-kit.test.ts', 'tests/unit/modules/store/pilot-seed-plan.test.ts', '--runInBand', '--testTimeout=30000']),
  ]
  if (production) {
    results.push(
      run('dry-run', ['scripts/pilot-seed-plan.ts', packageDir]),
      run('post-publish-verify', ['scripts/pilot-verify.ts', packageDir]),
      run('route-smoke', ['scripts/pilot-route-smoke.ts', packageDir], baseUrlArgument() ? [baseUrlArgument()!] : []),
    )
  }
  const failed = results.filter((result) => result.status !== 0)
  console.log(JSON.stringify({ command: 'pilot:qa', packageDir, production, results, failures: failed }, null, 2))
  if (failed.length > 0) process.exitCode = 1
}

main()
