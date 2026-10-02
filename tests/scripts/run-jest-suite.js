#!/usr/bin/env node

const { spawnSync } = require('node:child_process')

const deterministicDatabaseUrl = 'postgresql://ci:ci@127.0.0.1:1/visutry_jest_no_db'
const suites = {
  core: {
    paths: ['tests/unit', 'tests/integration/data', 'tests/integration/modules'],
    timeout: 60_000,
    description: 'unit + deterministic in-process integration',
  },
  unit: {
    paths: ['tests/unit'],
    timeout: 30_000,
    description: 'unit',
  },
  'integration-core': {
    paths: ['tests/integration/data', 'tests/integration/modules'],
    timeout: 60_000,
    description: 'deterministic in-process integration',
  },
}

const suiteName = process.argv[2] || 'core'
const suite = suites[suiteName]

if (!suite) {
  console.error(`Unknown Jest suite "${suiteName}". Choose one of: ${Object.keys(suites).join(', ')}.`)
  process.exit(2)
}

const jestCli = require.resolve('jest/bin/jest')
const env = {
  ...process.env,
  CI: 'true',
  NODE_ENV: 'test',
  NEXT_TELEMETRY_DISABLED: '1',
  SKIP_ENV_VALIDATION: '1',
  NEXTAUTH_SECRET: 'ci-only-nextauth-secret',
  NEXTAUTH_URL: 'http://127.0.0.1:3001',
  STRIPE_SECRET_KEY: 'sk_test_ci_placeholder',
  // Core Jest suites must not use ambient developer, Preview, or Production DB URLs.
  DATABASE_URL: deterministicDatabaseUrl,
  DATABASE_URL_UNPOOLED: deterministicDatabaseUrl,
  DIRECT_URL: deterministicDatabaseUrl,
}

console.log(`Running ${suite.description} Jest suite once (${suite.paths.join(', ')}).`)
console.log('Database access is disabled for this deterministic suite.')

const result = spawnSync(process.execPath, [
  jestCli,
  ...suite.paths,
  '--runInBand',
  `--testTimeout=${suite.timeout}`,
], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
})

if (result.error) {
  console.error('Unable to start Jest:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
