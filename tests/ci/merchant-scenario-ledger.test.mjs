import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMerchantScenarioLedger } from '../../scripts/merchant-release-scenario-ledger.mjs'

const manifest = {
  version: 1, gate: 'G1-F-FOUNDATION',
  required: [
    { id: 'first-value', file: 'tests/e2e/first-value.spec.ts',
      title: 'reaches private Store Preview', project: 'chromium' },
  ],
}
const evidence = {
  sourceSha: 'a'.repeat(40),
  claimedDatabaseMarker: 'LOCAL|local:127.0.0.1:55434/visutry_g1f_test',
  mode: 'MOCK', reportedProviderRequests: 0, reportedExternalCostUsd: 0,
}
function report(status = 'expected', results = [{ status: 'passed', duration: 25 }], overrides = {}) {
  return { suites: [{
    file: 'tests/e2e/first-value.spec.ts',
    specs: [{ title: 'reaches private Store Preview', tests: [
      { projectName: 'chromium', status, expectedStatus: 'passed', results, ...overrides },
    ] }],
  }] }
}
const evaluate = (reports) => buildMerchantScenarioLedger({ manifest, reports, evidence })

test('a real passed test is accepted with execution duration', () => {
  const result = evaluate([report()])
  assert.equal(result.result, 'PASS')
  assert.equal(result.scenarios[0].executed, true)
  assert.equal(result.scenarios[0].durationMs, 25)
  assert.equal(result.scenarios[0].attempts, 1)
  assert.equal(result.scope, 'FOUNDATION_ONLY_NOT_G2_OR_G4_CERTIFICATION')
})

test('discovered-but-unexecuted Playwright test blocks', () => {
  const result = evaluate([{ suites: [{ file: 'tests/e2e/first-value.spec.ts', specs: [] }] }])
  assert.equal(result.scenarios[0].status, 'NOT_TESTED')
  assert.equal(result.result, 'BLOCKED')
})

test('explicit skip, expected skip, and empty result block', () => {
  assert.equal(evaluate([report('skipped', [])]).scenarios[0].status, 'SKIPPED')
  assert.equal(evaluate([report('expected', [{ status: 'skipped' }], { expectedStatus: 'skipped' })]).result, 'BLOCKED')
  assert.equal(evaluate([report('expected', [])]).result, 'BLOCKED')
})

test('failed, interrupted, and flaky retries never certify the gate', () => {
  assert.equal(evaluate([report('unexpected', [{ status: 'failed' }])]).scenarios[0].status, 'FAILED')
  assert.equal(evaluate([report('unexpected', [{ status: 'interrupted' }])]).result, 'BLOCKED')
  const recovered = evaluate([report('flaky', [{ status: 'failed' }, { status: 'passed' }])])
  assert.equal(recovered.scenarios[0].status, 'FLAKY')
  assert.equal(recovered.result, 'BLOCKED')
})

test('Playwright testDir-relative file paths match exact manifest test', () => {
  const relative = report()
  relative.suites[0].file = 'first-value.spec.ts'
  assert.equal(evaluate([relative]).result, 'PASS')
  const wrong = report()
  wrong.suites[0].file = 'different.spec.ts'
  assert.equal(evaluate([wrong]).scenarios[0].status, 'NOT_TESTED')
})

test('wrong project and duplicate reports fail closed', () => {
  assert.equal(evaluate([report('expected', [{ status: 'passed' }], { projectName: 'webkit' })]).result, 'BLOCKED')
  assert.equal(evaluate([report(), report()]).scenarios[0].status, 'AMBIGUOUS')
})

test('missing/malformed report, manifest and provenance fail closed', () => {
  assert.throws(() => evaluate([]), /JSON reporter/)
  assert.throws(() => buildMerchantScenarioLedger({ manifest: { ...manifest, required: [] }, reports: [report()], evidence }), /manifest/)
  assert.throws(() => buildMerchantScenarioLedger({ manifest, reports: [report()], evidence: { ...evidence, claimedDatabaseMarker: 'PRODUCTION|neon.example' } }), /Exact SHA/)
  assert.throws(() => buildMerchantScenarioLedger({ manifest, reports: [report()], evidence: { ...evidence, sourceSha: 'invalid' } }), /Exact SHA/)
  assert.throws(() => buildMerchantScenarioLedger({ manifest, reports: [report()], evidence: { ...evidence, reportedExternalCostUsd: NaN } }), /Exact SHA/)
  assert.throws(() => buildMerchantScenarioLedger({ manifest: { ...manifest, required: [manifest.required[0], manifest.required[0]] }, reports: [report()], evidence }), /duplicate required/)
})

test('dedicated original Kiosk manifest uses the same strict one-attempt gate', () => {
  const kioskManifest = {
    ...manifest,
    gate: 'G1-F-KIOSK-PRIVACY-EXECUTED',
  }
  const passed = buildMerchantScenarioLedger({
    manifest: kioskManifest, reports: [report()], evidence,
  })
  assert.equal(passed.result, 'PASS')
  assert.equal(passed.requiredCount, 1)
  assert.equal(passed.scenarios[0].attempts, 1)
  const skip = buildMerchantScenarioLedger({
    manifest: kioskManifest, reports: [report('skipped', [])], evidence,
  })
  assert.equal(skip.result, 'BLOCKED')
  assert.equal(skip.scenarios[0].status, 'SKIPPED')
  assert.throws(() => buildMerchantScenarioLedger({
    manifest: { ...kioskManifest, gate: 'G4-COMMERCIAL-READY' },
    reports: [report()], evidence,
  }), /manifest/)
})
