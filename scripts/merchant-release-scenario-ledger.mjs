#!/usr/bin/env node
/**
 * G1-F: fail-closed, evidence-only Playwright scenario ledger.
 * A discovered test, a test.skip, or a green unrelated CI job is NOT execution.
 * This does not run tests or access a database; independent fixture verification
 * and the complete G2 release matrix remain separate gates.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STATUSES = new Set(['PASS', 'FAILED', 'SKIPPED', 'NOT_TESTED', 'FLAKY', 'AMBIGUOUS'])
const MODES = new Set(['MOCK', 'PREPARED_DEMO', 'TEST_PROVIDER'])

function normalPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '')
}

function sameFile(actual, expected) {
  const a = normalPath(actual)
  const e = normalPath(expected)
  return a === e || a.endsWith('/' + e)
}

function gatherTests(suite, inheritedFile, collected) {
  const file = suite.file || inheritedFile
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      collected.push({
        file: spec.file || file,
        title: spec.title,
        project: test.projectName,
        status: test.status,
        expectedStatus: test.expectedStatus,
        results: test.results || [],
      })
    }
  }
  for (const nested of suite.suites || []) gatherTests(nested, file, collected)
}

function classify(test) {
  if (test.status === 'skipped' || test.expectedStatus === 'skipped'
      || test.results.some((result) => result.status === 'skipped')) return 'SKIPPED'
  const attempts = test.results
  if (!attempts.length) return 'NOT_TESTED'
  if (test.status === 'flaky' || attempts.length > 1
      || attempts.some((result) => result.status !== 'passed')) {
    return test.status === 'unexpected' ? 'FAILED' : 'FLAKY'
  }
  return test.status === 'expected' && test.expectedStatus === 'passed'
    && attempts[0].status === 'passed' ? 'PASS' : 'FAILED'
}

export function buildMerchantScenarioLedger({ manifest, reports, evidence }) {
  if (manifest?.version !== 1 || manifest?.gate !== 'G1-F-FOUNDATION'
      || !Array.isArray(manifest.required) || manifest.required.length === 0) {
    throw new Error('Invalid G1-F foundation manifest')
  }
  if (!Array.isArray(reports) || reports.length === 0
      || reports.some((report) => !Array.isArray(report?.suites))) {
    throw new Error('Playwright JSON reporter results are required, not --list output')
  }
  if (!/^[a-f0-9]{40}$/.test(evidence?.sourceSha || '')
      || !/^LOCAL\|local:(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}\/[A-Za-z0-9_]+$/.test(evidence?.claimedDatabaseMarker || '')
      || !MODES.has(evidence?.mode)
      || !Number.isInteger(evidence?.reportedProviderRequests)
      || evidence.reportedProviderRequests < 0
      || !Number.isFinite(evidence?.reportedExternalCostUsd)
      || evidence.reportedExternalCostUsd < 0) {
    throw new Error('Exact SHA, claimed local DB marker, execution mode and cost telemetry are required')
  }
  const ids = new Set()
  const selectors = new Set()
  const tests = []
  for (const report of reports) for (const suite of report.suites) gatherTests(suite, null, tests)
  const scenarios = manifest.required.map((requirement) => {
    if (!requirement?.id || !requirement.file || !requirement.title || !requirement.project
        || ids.has(requirement.id)) throw new Error('Invalid or duplicate required scenario ID')
    ids.add(requirement.id)
    const selector = [requirement.file, requirement.title, requirement.project].join('|')
    if (selectors.has(selector)) throw new Error('Duplicate required Playwright selector')
    selectors.add(selector)
    const matches = tests.filter((test) => sameFile(test.file, requirement.file)
      && test.title === requirement.title && test.project === requirement.project)
    const status = matches.length > 1 ? 'AMBIGUOUS'
      : matches.length === 0 ? 'NOT_TESTED' : classify(matches[0])
    if (!STATUSES.has(status)) throw new Error('Unknown scenario status')
    const attempts = matches.length === 1 ? matches[0].results.length : 0
    const durationMs = matches.length === 1 ? matches[0].results.reduce(
      (sum, result) => sum + (Number.isFinite(result.duration) ? result.duration : 0), 0) : 0
    return { ...requirement, status, executed: attempts > 0 && status !== 'SKIPPED',
      attempts, durationMs }
  })
  const counts = Object.fromEntries([...STATUSES].map((status) =>
    [status, scenarios.filter((scenario) => scenario.status === status).length]))
  const passed = scenarios.every((scenario) => scenario.status === 'PASS')
  return {
    schemaVersion: 1,
    gate: manifest.gate,
    scope: 'FOUNDATION_ONLY_NOT_G2_OR_G4_CERTIFICATION',
    evidence: { ...evidence, provenance: 'operator-reported; verify DB marker and provider ledger independently' },
    requiredCount: scenarios.length,
    counts,
    scenarios,
    result: passed ? 'PASS' : 'BLOCKED',
  }
}

function parseArgs(argv) {
  const options = { reports: [] }
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith('--') || !value) throw new Error('Expected --key value arguments')
    if (key === '--report') options.reports.push(value)
    else if (['--manifest', '--source-sha', '--database-marker', '--mode',
      '--provider-requests', '--external-cost-usd', '--output'].includes(key)) options[key.slice(2)] = value
    else throw new Error('Unknown flag: ' + key)
  }
  return options
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.manifest || !args.reports.length || !args['source-sha']
      || !args['database-marker'] || !args.mode || args['provider-requests'] === undefined
      || args['external-cost-usd'] === undefined || !args.output) {
    throw new Error('Required: --manifest path --report playwright.json [--report ...] --source-sha HEAD --database-marker LOCAL|local:host:port/db --mode MOCK|PREPARED_DEMO|TEST_PROVIDER --provider-requests N --external-cost-usd N --output path')
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (head !== args['source-sha']) throw new Error('Source SHA does not match checked-out HEAD')
  const ledger = buildMerchantScenarioLedger({
    manifest: JSON.parse(readFileSync(resolve(args.manifest), 'utf8')),
    reports: args.reports.map((file) => JSON.parse(readFileSync(resolve(file), 'utf8'))),
    evidence: {
      sourceSha: head,
      claimedDatabaseMarker: args['database-marker'],
      mode: args.mode,
      reportedProviderRequests: Number(args['provider-requests']),
      reportedExternalCostUsd: Number(args['external-cost-usd']),
    },
  })
  writeFileSync(resolve(args.output), JSON.stringify(ledger, null, 2) + '\n')
  for (const item of ledger.scenarios) {
    process.stdout.write(item.status.padEnd(12) + ' ' + item.id + ' (' + item.attempts + ' attempts)\n')
  }
  process.stdout.write('G1-F scenario ledger: ' + ledger.result + ' — '
    + ledger.counts.PASS + '/' + ledger.requiredCount + ' required PASS\n')
  if (ledger.result !== 'PASS') process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    process.stderr.write('G1-F ledger BLOCKED: ' + (error instanceof Error ? error.message : 'Unknown error') + '\n')
    process.exitCode = 1
  }
}
